# Workflows

How the important processes actually run, end to end.

**See also:** [business.md](business.md) (the rules these flows enforce) · [features.md](features.md) (the screens involved) · [database.md](database.md) (the records written) · [decisions.md](decisions.md) (why they work this way)

---

## Booking: anonymous (non-member)

The default path. The customer is not logged in and may not exist in the system yet.

1. **Announcement gate.** `/book` loads active announcements whose start has arrived and whose optional end is still in the future. Urgent notices appear first, then warnings and information; the customer continues past the interstitial into the wizard.
2. **Five-step wizard** — Sport → Court → Date & Time → Add-Ons → Summary. All state, including the current step, lives in the top-level orchestrator, so navigating Back and forward again never loses an entered value.
   - The Date & Time step calls `/api/availability` to grey out occupied slots before submit.
3. **Hold created.** On Confirm, `POST /api/bookings` creates the booking with `status: pending_payment` and `customerId: null`. Pricing here is **provisional and always at the non-member rate**, because no customer or email exists yet. The response also establishes a random 24-hour, HttpOnly, SameSite browser capability; only that browser can read the hold, attach contact details, start checkout, or poll its confirmation.
4. **Payment page.** The booking reference is shown immediately. The customer enters name, phone, and email.
5. **Customer attached and re-priced.** `PATCH /api/bookings/[id]` resolves the customer by look-up-or-create on email (never updating an existing row's name/phone — see [decisions.md](decisions.md)), attaches them, stores the name/phone snapshots, and recomputes the price — **still always at the non-member rate**, regardless of whether that email belongs to a real member. The attach is one-shot: a booking that already has a customer returns `409`.
   - The only thing that can change the total between steps 3 and 5 is an admin editing a rate in that window. The wizard surfaces any change as a confirmation-required "final price is X (was Y)" notice before checkout.
6. **PayMongo.** `POST /api/checkout` creates a Checkout Session and the customer is redirected to PayMongo's hosted page.
7. **Confirmation.** `/book/confirmation` polls the booking's status. The booking becomes `confirmed` **only** when the webhook arrives — never on the redirect back.

> **Why the anonymous path never grants member rates:** knowing a member's email must not be enough to obtain their pricing or spend their credit. The customer record is still resolved and attached, so the booking appears in that person's history once they log in.

---

## Booking: member

Same `/book` route, not a separate one.

1. `/book` reads the session **server-side**. If the session role is `member`, it loads that customer and builds a member context (name, email, phone, active-membership flag, and the coverage window plus credit balance of every unexpired term) passed into the wizard.
2. The wizard is pre-filled, so there is no contact-details step to complete. The rate tier follows the **chosen date**: a day outside every term's coverage is priced non-member and a notice on the date step explains why.
3. **Single-phase pricing.** `POST /api/bookings` resolves the membership **covering the slot start** itself (`getMembershipActiveAt`), prices at the member rate only when one exists, and attaches `customerId` directly at hold creation. There is no PATCH round-trip.
4. The payment step skips straight to a "Booking under {name} ({email})" summary.
5. Credit redemption is evaluated at this point — see below.

The guest-count control and the ₱150-per-guest fee apply identically on both paths.

---

## Credit redemption

Evaluated inside `POST /api/bookings` on the member path only.

**Full coverage or nothing.**

- **If the credit balance covers the entire grand total** (base + guest fee + add-ons): the balance is decremented atomically inside the booking's own transaction (the decrement re-checks that the term still covers the slot start, so a lapse between lookup and write cannot redeem credit), the booking is created **already `confirmed`**, a payment row is written with method `membership_credit` and status `paid`, and a negative `booking_redemption` ledger entry is recorded. **No PayMongo involvement at all.**
  - The atomic guard is a conditional decrement that only applies if the balance is still sufficient, so two concurrent bookings cannot both spend the same credit.
- **If the balance does not cover it**: credit is left completely untouched, the booking is created as `pending_payment`, and the member pays the **full amount** through PayMongo. An advisory modal explains this before they proceed.

**Credit is never split with a card payment.** There is no partial redemption.

---

## Payment confirmation (the webhook)

`POST /api/webhooks/paymongo` is the single authority that marks anything paid.

1. Verify the HMAC-SHA256 signature on the `Paymongo-Signature` header. Reject otherwise.
2. Ignore every event whose type is not `payment.paid`.
3. **Dispatch on which metadata key is present** — the three branches are mutually exclusive:

| Metadata key | Branch |
|---|---|
| `bookingId` | Booking payment |
| `membershipPaymentId` | Membership activation or renewal |
| `topUpPaymentId` | Credit top-up |

4. **Booking branch** — mark the payment paid, capture PayMongo's payment id, fee, and net amount, confirm the booking, and send the confirmation email plus a staff notification. If the booking is not pending, log a loud "payment collected for non-pending booking — manual review needed" error rather than failing silently.
5. **Membership branch** — pick the start date (payment time, or one millisecond after the customer's latest unexpired term for an early renewal), compute the end date from the tier as end-of-day Manila, create the `Membership` row with its credit balance, write the activation or renewal ledger entry, generate an activation token, and send the activation (or renewal) email plus a staff notification.
6. **Top-up branch** — mark the payment paid, write a `top_up` ledger entry, increment the cached balance, and send the top-up confirmation email.

> Client-side redirect completion never confirms anything. A customer can close the browser before returning.

---

## Hold and expiry

A `pending_payment` booking occupies its slot for `BOOKING_HOLD_MINUTES` (default 10) from creation.

**"Occupying the slot"** means: `confirmed`, **or** `pending_payment` created within the hold window. This one definition is shared by `/api/availability` and booking creation, so what shows as available can never drift from what actually gets held.

Expiry runs in two layers:

1. **Expire-on-write.** Before any new booking insert, stale pending rows for that resource and time are transactionally cancelled first. This is necessary because the database exclusion constraint ignores only `cancelled` rows — a stale pending row would otherwise block the slot forever.
2. **Daily cron sweep** (`/api/cron/expire-bookings`) for hygiene, cancelling stale rows platform-wide.

In both cases the linked PayMongo checkout session is **actively expired** through PayMongo's API (best-effort), closing the window where a customer could pay into an already-released slot.

### Hold abuse controls

Holds are free and occupy their slot for the hold window, so without limits an anonymous script could keep every slot perpetually busy. `POST /api/bookings` applies three server-side limits, in this order, after request validation and before any write:

1. **Creation throttle.** Each validated hold request consumes one attempt in the shared 15-minute rate-limit window (`booking_hold` scope of `AuthRateLimitAttempt`). Members are keyed on their customer id (10 per window) plus their IP (20 per window); anonymous bookers on IP only (10 per window). Over budget → `429`, nothing written.
2. **Live-hold cap.** Inside the booking transaction, after a per-client advisory lock, the client's `pending_payment` rows still inside the hold window are counted; a fourth is refused with `429` and the transaction rolls back (including any credit decrement). Credit-covered bookings confirm immediately and are exempt because they never hold a slot.
3. **Court duration cap.** Court bookings are limited to 4 hours (see [business.md](business.md) → Pricing), so one hold cannot occupy a court's whole day.

The client key is stored as `Booking.holdClientHash` (an HMAC, never a raw IP). Constants live in `src/lib/booking-limits.ts`; the checks in `src/lib/booking-hold-abuse.ts`. These limits bound one client; a distributed attacker with many IPs is out of scope — see [roadmap.md](roadmap.md).

---

## Membership: application → approval → activation

1. **Submit.** The applicant completes the form at `/membership/apply` with name, address, contact number, email, and three government ID images. Images are validated by declared type, size, and JPEG/PNG file signature before upload to the private bucket. A customer record is resolved or created. Staff receive a notification email.
   - **Submissions are throttled per IP** — 3 per rolling 15 minutes (`membership_application` scope of `AuthRateLimitAttempt`), checked after field and file validation but before any customer row, upload, or staff email is created. Over budget → `429`, shown inline by the form.
   - **Reapplication is blocked** unless the most recent application for that email was rejected. Each blocked case returns its own distinct message, derived from the same display-status logic the admin list uses.
2. **Review.** An admin opens the application, views the ID images through signed URLs in an admin-only lightbox, and approves or rejects. Rejection requires a non-empty reason. Either way an activity log row is written in the same transaction as the mutation.
3. **On rejection** — a branded email is sent carrying the admin's reason. No membership is created. The customer record stays, with no membership attached.
4. **On approval** — the application is marked approved and a **payment link email** is sent. **No membership exists yet.** The link carries a hashed, 48-hour `MembershipPaymentLinkToken` in its query string (`?token=`), not just the bare application id — both `/membership/pay/[id]` and the checkout-session API (`POST /api/membership-payments`) reject a missing, invalid, superseded, or expired token, mirroring `MemberActivationToken`.
5. **Payment.** The applicant opens `/membership/pay/[id]` and pays through PayMongo Checkout.
6. **Activation.** The webhook's membership branch creates the `Membership` with its tier, dates, and credit balance, writes the activation ledger entry, and issues an activation token. The activation email carries a **PDF membership certificate** (first-time activation only).
7. **Account setup.** The member opens `/activate`, sets a password, and the token is consumed. They now have a login.
   - **If the activation link expires unused**, the member has an active membership but no way to log in, and forgot-password can't help (it only emails members who already have a `passwordHash`). An admin can resend a fresh activation link from the member's detail page — this retires the dead token and issues a new one with the same 48-hour expiry, via a plainer reminder email (no certificate, no congratulations copy).
   - **If the payment link expires unused**, the application is still `approved` with no membership. An admin can resend a fresh payment link from the application's detail page (shown whenever it's awaiting payment) — this supersedes any earlier unused token and issues a new one with the same 48-hour expiry, reusing the original approval email copy.

---

## Membership renewal

Two routes to the same outcome; both create a `MembershipPayment` with no application attached.

Both are gated by one rule, `getRenewalEligibility()` in `membership-current.ts`: eligible when the customer has no unexpired term, or exactly one that ends within `RENEWAL_WINDOW_DAYS` (14). A second unexpired row means a renewal is already queued and both routes refuse with a distinct 409.

- **Self-service** — an expired member sees "Renew Membership" and an eligible active member sees "Renew Early" on `/account`; both lead to `/account/renew`, which restates when the new term will start before the member picks a tier and pays. Gated by the member's own session (`POST /api/account/membership-renewal`), so it carries no emailed link and needs no payment-link token.
- **Admin-initiated** — an admin uses "Send Renewal Link" (shown when the customer is eligible), which creates the payment row, emails the member a `/membership/renew/[id]?token=` link, and logs the action. When a renewal is already queued, clicking the button again re-sends the same pending payment row's link with a fresh `MembershipPaymentLinkToken` (superseding the earlier one) — the same button doubles as the resend action if the previous link expired. The detail page says a renewal is already queued only once nothing is left to (re)send.

Either way the webhook creates a fresh membership with a `renewal` ledger entry. For an early renewal the new row's `startDate` is one millisecond after the current term's `endDate` (i.e. the next Manila day); the renewal email states the start date. The account card shows a queued renewal's end date under the current term. **Renewal never attaches the certificate PDF.**

---

## Credit top-up

- **Self-service** — an active member uses "Top Up F&B Credit" on `/account`, choosing one of four fixed presets (₱1,000 / ₱2,500 / ₱5,000 / ₱10,000), and pays through PayMongo. The webhook's top-up branch credits the balance and emails a confirmation. Shown **only** for an active, unexpired membership. If the payment lands after the term has ended, the credit is still applied and staff get a `Membership | Top-Up After Expiry | …` notification to arrange a refund or renewal (see [business.md](business.md)).
- **Admin / front desk** — an admin uses "Add Credit" on an active member's detail page, choosing Cash or Online mode (a note is required for cash; a reference is required for online). The amount must be at least ₱1,000, and the admin must type the displayed member-and-amount confirmation before the top-up can be recorded. This records an **already-paid** payment row, a ledger entry, and an activity log row in one transaction. Gated to a currently-active membership.

> The admin path sends **no** confirmation email; only the self-service path does. See [roadmap.md](roadmap.md).

---

## Member check-in

Front-desk identification, resolving from a stable per-customer identifier pair that is always created and rotated together:

- A **QR code** encoding a 24-random-byte token.
- A **6-digit fallback code**, zero-padded, unique, generated with collision retry.

Both are shown on `/account` and can be regenerated by the member.

An admin uses `/admin/check-in`, either scanning with the camera or typing the code. Both routes resolve through one shared function and render through one shared result card, giving four states: not found, no membership, active, and expired (plus a rate-limited state).

**Code entry is rate-limited per admin**: failed lookups are logged, and the 11th failure within any rolling 5-minute window is blocked, with a retry-after. Cleanup is expire-on-write, no cron.

**The QR/token path is deliberately not rate-limited** — a 24-random-byte token is not brute-forceable, and rate-limiting it would only hinder legitimate scanning.

---

## Admin reschedule

The only way a booking's time changes. See [business.md](business.md) for the policy.

1. An admin opens the booking and expands the Reschedule section (collapsed by default).
2. They select the new date from a calendar, then choose from the live availability-filtered start-time grid (6:00 AM through 10:00 AM) and enter a reason. The lookup excludes the booking being moved and evaluates its full duration. The start-time window is enforced in the form and API; the resulting slot is also validated against business hours and the same overlap constraint as any other booking.
3. Before submitting, they confirm the change by typing `reschedule <booking reference>` in the confirmation dialog.
4. In one transaction: the booking is updated, an immutable `BookingReschedule` audit row is written, and an activity log row is recorded.
5. After the transaction commits, the customer and `winstonsipandserve@gmail.com` receive a reschedule email with the previous slot, new slot, and recorded reason. The staff copy also identifies the admin who performed the reschedule. Any follow-up coordination still happens outside the system by replying to the customer email.

---

## Announcement-triggered resource auto-disable

An announcement can take specific courts or bays offline while it is live.

**An announcement is actively claiming its resources when all of these hold:** `isActive` is on, `autoDisableResources` is on, `startAt` has arrived, and `endAt` is absent or still in the future. This predicate is evaluated fresh every time, never cached.

The start clause lets an operational notice be prepared in advance without disabling anything immediately. An optional `announceAt` earlier than `startAt` makes the notice visible on `/book` (tagged Upcoming) while the resources remain bookable; the claim still begins only at `startAt`. Selecting resources without enabling auto-disable only displays their names to the customer.

**Manual always wins.** Each resource records which mechanism last disabled it:

- A manual admin Disable or Enable always stamps or clears `manual`, regardless of any announcement claim.
- During the expand rollout, an announcement claim is internally tagged `bulletin` for compatibility with older application instances. Releasing it only re-enables a resource with that automatic tag — it never steals back a manual disable.
- Applying a claim only disables a resource that is currently active.
- Before re-enabling, the release path checks whether **any other** active, auto-disabling announcement inside its window still links to that resource.

Each announcement write route wraps resource-link and apply/release work in a single transaction, and deleting an announcement releases every linked resource first.

The daily `/api/cron/expire-bookings` run also releases resources for announcements whose end has passed and applies disables whose start has passed. **Because it runs once daily, a scheduled effect can lag by up to a day.** Public announcement visibility is evaluated at request time and does not share this delay.

---

## Membership expiry reminders

`/api/cron/membership-reminders` runs daily and sends three kinds of email:

| Trigger | Email |
|---|---|
| Expiring in more than 3 and up to 14 days | 14-day reminder |
| Expiring within 3 days | 3-day reminder |
| Already past the end date | Expired notice |

The windows only select rows. Each email states the **actual** number of Manila calendar days left (today / tomorrow / in N days), computed at send time. The 3-day block stamps both `reminder3SentAt` and `reminder14SentAt`, so a member is never sent both reminders in one run.

A row is **suppressed** — stamped without sending, and counted in the response's `suppressedCount` — when the customer holds a later membership (a queued early renewal, or a new term bought after this one lapsed). Reminder and expired emails link to `/account/renew`, never to `/membership/apply`, because reapplication is blocked for anyone who has held a membership.

Each membership carries a nullable timestamp per email type, stamped **immediately after** that email is sent, row by row rather than batched. This is deliberate: a mid-run failure can never cause a retry to double-send.
