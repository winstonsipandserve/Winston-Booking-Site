# Workflows

How the important processes actually run, end to end.

**See also:** [business.md](business.md) (the rules these flows enforce) · [features.md](features.md) (the screens involved) · [database.md](database.md) (the records written) · [decisions.md](decisions.md) (why they work this way)

---

## Booking: anonymous (non-member)

The default path. The customer is not logged in and may not exist in the system yet.

1. **Announcement gate.** `/book` loads published, non-expired bulletins (excluding Promotions) and shows them as an interstitial notice. The customer continues past it into the wizard.
2. **Five-step wizard** — Sport → Court → Date & Time → Add-Ons → Summary. All state, including the current step, lives in the top-level orchestrator, so navigating Back and forward again never loses an entered value.
   - The Date & Time step calls `/api/availability` to grey out occupied slots before submit.
3. **Hold created.** On Confirm, `POST /api/bookings` creates the booking with `status: pending_payment` and `customerId: null`. Pricing here is **provisional and always at the non-member rate**, because no customer or email exists yet. The response also establishes a random 24-hour, HttpOnly, SameSite browser capability; only that browser can read the hold, attach contact details, start checkout, or poll its confirmation.
4. **Payment page.** The booking reference is shown immediately. The customer enters name, phone, and email.
5. **Customer attached and re-priced.** `PATCH /api/bookings/[id]` resolves the customer by look-up-or-create on email, attaches them, stores the name/phone snapshots, and recomputes the price — **still always at the non-member rate**, regardless of whether that email belongs to a real member.
   - The only thing that can change the total between steps 3 and 5 is an admin editing a rate in that window. The wizard surfaces any change as a confirmation-required "final price is X (was Y)" notice before checkout.
6. **PayMongo.** `POST /api/checkout` creates a Checkout Session and the customer is redirected to PayMongo's hosted page.
7. **Confirmation.** `/book/confirmation` polls the booking's status. The booking becomes `confirmed` **only** when the webhook arrives — never on the redirect back.

> **Why the anonymous path never grants member rates:** knowing a member's email must not be enough to obtain their pricing or spend their credit. The customer record is still resolved and attached, so the booking appears in that person's history once they log in.

---

## Booking: member

Same `/book` route, not a separate one.

1. `/book` reads the session **server-side**. If the session role is `member`, it loads that customer and builds a member context (name, email, phone, active-membership flag, credit balance) passed into the wizard.
2. The wizard is pre-filled, so there is no contact-details step to complete.
3. **Single-phase pricing.** `POST /api/bookings` resolves membership status itself, prices at the **member rate**, and attaches `customerId` directly at hold creation. There is no PATCH round-trip.
4. The payment step skips straight to a "Booking under {name} ({email})" summary.
5. Credit redemption is evaluated at this point — see below.

The guest-count control and the ₱150-per-guest fee apply identically on both paths.

---

## Credit redemption

Evaluated inside `POST /api/bookings` on the member path only.

**Full coverage or nothing.**

- **If the credit balance covers the entire grand total** (base + guest fee + add-ons): the balance is decremented atomically inside the booking's own transaction, the booking is created **already `confirmed`**, a payment row is written with method `membership_credit` and status `paid`, and a negative `booking_redemption` ledger entry is recorded. **No PayMongo involvement at all.**
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
5. **Membership branch** — compute the end date from the tier, create the `Membership` row with its credit balance, write the activation or renewal ledger entry, generate an activation token, and send the activation (or renewal) email plus a staff notification.
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

---

## Membership: application → approval → activation

1. **Submit.** The applicant completes the form at `/membership/apply` with name, address, contact number, email, and three government ID images. Images are validated by declared type, size, and JPEG/PNG file signature before upload to the private bucket. A customer record is resolved or created. Staff receive a notification email.
   - **Reapplication is blocked** unless the most recent application for that email was rejected. Each blocked case returns its own distinct message, derived from the same display-status logic the admin list uses.
2. **Review.** An admin opens the application, views the ID images through signed URLs in an admin-only lightbox, and approves or rejects. Rejection requires a non-empty reason. Either way an activity log row is written in the same transaction as the mutation.
3. **On rejection** — a branded email is sent carrying the admin's reason. No membership is created. The customer record stays, with no membership attached.
4. **On approval** — the application is marked approved and a **payment link email** is sent. **No membership exists yet.**
5. **Payment.** The applicant opens `/membership/pay/[id]` and pays through PayMongo Checkout.
6. **Activation.** The webhook's membership branch creates the `Membership` with its tier, dates, and credit balance, writes the activation ledger entry, and issues an activation token. The activation email carries a **PDF membership certificate** (first-time activation only).
7. **Account setup.** The member opens `/activate`, sets a password, and the token is consumed. They now have a login.

---

## Membership renewal

Two routes to the same outcome; both create a `MembershipPayment` with no application attached.

- **Self-service** — an expired member sees a "Renew Membership" call to action on `/account`, picks a tier at `/account/renew`, and pays.
- **Admin-initiated** — an admin uses "Send Renewal Link" (shown only for an expired membership), which creates the payment row, emails the member a `/membership/renew/[id]` link, and logs the action.

Either way the webhook creates a fresh membership with a `renewal` ledger entry. **Renewal never attaches the certificate PDF.**

---

## Credit top-up

- **Self-service** — an active member uses "Top Up F&B Credit" on `/account`, choosing one of four fixed presets (₱1,000 / ₱2,500 / ₱5,000 / ₱10,000), and pays through PayMongo. The webhook's top-up branch credits the balance and emails a confirmation. Shown **only** for an active, unexpired membership — the mirror image of the Renew call to action.
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

## Bulletin-triggered resource auto-disable

A bulletin can take specific courts or bays offline while it is live.

**A bulletin is actively claiming its resources when all of these hold:** it is published, `autoDisableResources` is on, it has not expired, and its event start (if set) has already passed. This predicate is evaluated fresh every time, never cached.

The event-start clause is what lets a closure be announced in advance without disabling anything immediately.

**Manual always wins.** Each resource records which mechanism last disabled it:

- A manual admin Disable or Enable always stamps or clears `manual`, regardless of any bulletin's claim.
- Releasing a bulletin's claim only re-enables a resource currently tagged `bulletin` — it never steals back a manual disable.
- Applying a claim only disables a resource that is currently active.
- Before re-enabling, the release path checks whether **any other** published, auto-disabling, unexpired bulletin still links to that resource.

Each of the three bulletin write routes wraps its handler in a single transaction, and deleting a bulletin releases every linked resource first.

The daily `/api/cron/expire-bookings` run also releases resources for bulletins whose expiry has passed and applies disables for bulletins whose event start has passed. **Because it runs once daily, a scheduled effect can lag by up to a day.**

---

## Membership expiry reminders

`/api/cron/membership-reminders` runs daily and sends three kinds of email:

| Trigger | Email |
|---|---|
| Expiring within 14 days | 14-day reminder |
| Expiring within 3 days | 3-day reminder |
| Already past the end date | Expired notice |

Each membership carries a nullable timestamp per email type, stamped **immediately after** that email is sent, row by row rather than batched. This is deliberate: a mid-run failure can never cause a retry to double-send.
