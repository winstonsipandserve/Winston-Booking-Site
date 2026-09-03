# Test Findings — Member-Account Deep Pass — 2026-09-03

QA/verification pass against local dev (`npm run dev`, Next.js 16 / Turbopack), covering
member-facing auth, `/account`, the credit-covered/insufficient-credit booking paths, membership
expiry/renewal, and forgot/reset-password — the surfaces not exercised by the same-day
`TEST_FINDINGS_2026-09-03.md` (public site) or `TEST_FINDINGS_ADMIN_2026-09-03.md` (admin panel)
passes. Two real, persistent test-member accounts were used per the prompt's explicit design:
`arjayical22@gmail.com` (Member A, pre-existing/active) and `arjayrafaelical@gmail.com` (Member B,
seeded fresh in Part 1) — **neither is deleted at the end of this pass**, unlike prior QA passes.

Methodology: direct `fetch()` calls from Node scripts (mirroring every prior QA script's
csrf/cookie login + webhook-sign/post helpers) drove most business-logic scenarios; the Claude
Browser MCP drove genuine UI-only checks (sign-out modal Cancel/Escape/backdrop, password
show/hide toggle, the insufficient-credit modal, the booking wizard's member-vs-non-member
pricing display). **The Browser pane's `read_page`/click-by-coordinate tooling was non-functional
in this session** (0×0 viewport, offscreen coordinates on every `computer` click) — this matches
CLAUDE.md's already-documented "Browser pane doesn't composite frames" limitation. Per that same
note's guidance ("prefer DOM/class-based checks"), UI interactions were instead driven via
`javascript_tool` dispatching real DOM events (`.click()`, native `input` events via the React
controlled-input setter, real `KeyboardEvent`/`MouseEvent` construction for Escape/backdrop) —
this still exercises the actual React event handlers and code paths, not a simulation of them.
Real activation/reset emails were retrieved via the Resend MCP and their tokens extracted from the
actual sent content — no token was ever guessed or reconstructed. All temporary/QA-only
infrastructure (one `AdminUser` row, one throwaway `PasswordResetToken` row) was removed at
cleanup; no application source file was modified — only new scripts under `scripts/` (gitignored)
and this findings file.

Legend: **Pass** / **Fail** / **Note** (documented behavior, not a pass/fail judgment)

---

## Part 1 — Seed Member B + forgot-password edge cases

| # | Scenario | Result |
|---|---|---|
| 1a | Real application submitted for Member B (3-Month) via `POST /api/membership-applications` (multipart, real tiny JPEG gov-ID files) | **Pass** — `201`, application `pending`. |
| 1b | Approved via a temporary QA `AdminUser` session (`PATCH /api/admin/memberships/[id]`, `action: approve`) | **Pass** — `200`, status `approved`, `paymentEmailSent: true`. |
| G31 | `forgot-password` for a nonexistent email | **Pass** — identical `200` generic message, zero new `PasswordResetToken` rows. |
| G32 | `forgot-password` for Member B **before** activation (real Customer, active-membership-to-be, `passwordHash` still null) | **Pass** — identical `200` generic message, zero new `PasswordResetToken` rows for that customer. The enumeration-safe "already activated" gate held even for an otherwise-real, soon-to-be-active member. |
| 1c | Tier-activation payment webhook-replayed (`metadata.membershipPaymentId`, real HMAC-SHA256 signature) | **Pass (after a script fix — see Deviations)** — `Membership` created: `three_month`, `activationFeeCentavos: 200000`, `creditBalanceCentavos: 350000`. `MemberActivationToken` row created. |
| 1f | Real activation email retrieved via Resend MCP, real `/activate?token=...` link extracted (never guessed), `POST /api/activate` with `password123` | **Pass** — `passwordHash` now set; login with `password123` confirmed via `/api/auth/session`. |

**Deviation from the prompt, not a bug:** `POST /api/membership-payments` (the real
create-or-resume checkout endpoint the `/membership/pay/[id]` page calls) returns only
`{ checkoutUrl }` — it does **not** echo back `membershipPaymentId`, by design (the browser never
needs that id client-side; PayMongo's redirect and the later webhook carry it instead). The first
webhook-replay attempt in this pass used that (nonexistent) response field, so the webhook payload
silently had no `metadata.membershipPaymentId` at all — the handler correctly logged
`"neither bookingId nor membershipPaymentId"` and no-op'd `200`. Fixed by looking up the
just-created `MembershipPayment` row directly from the DB (`status: pending`, most recent) before
re-firing the webhook with the real id. This is a test-script defect, not an application bug — the
real customer-facing flow never constructs a webhook payload this way.

---

## Part 2 — Member A auth scenarios

| # | Scenario | Result |
|---|---|---|
| 2a | Login creates a session client-side; Navbar reflects it in the same tab, no refresh | **Pass** — after `signIn`, redirected to `/account`; Navbar showed initials + "Sign Out" without a page reload. |
| 2b | Wrong password | **Pass** — generic `"Invalid email or password."`, no session created, stayed on `/login`. |
| 2c | Real login + password show/hide toggle | **Pass** — toggle flips the real `<input type>` between `password`↔`text` and back. |
| 2d | Session persists across hard refresh / direct nav to `/account` | **Pass** — direct navigation rendered the full authenticated `/account` page. |
| 2e | Sign-out modal: Cancel keeps session; Escape dismisses (no sign-out); backdrop-click dismisses (no sign-out); Confirm signs out for real | **Pass on all four** — verified via real dispatched `click`/`KeyboardEvent('Escape')`/`MouseEvent` on the actual backdrop element (`onClick={onClose}`), session-status confirmed via `/api/auth/session` after each. Confirm correctly redirected to `/` with `session: null`. |
| 2e (mobile) | Repeat Confirm case at mobile width | **Not independently re-run** — the Sign Out flow uses the same `SignOutButton`/`Modal` component and handler on both desktop and mobile nav (confirmed by code read, `Navbar.tsx`); no separate mobile-only sign-out code path exists to regress. Flagged rather than silently skipped. |

---

## Part 3 — Member A `/account` display (while Active)

| # | Scenario | Result |
|---|---|---|
| 3a | Profile shows correct name/email/phone | **Pass** — "Arjay Ical" / `arjayical22@gmail.com` / `09898978783`. |
| 3b | Membership card: 6-Month, Active (no Expired badge), expiry, credit | **Pass** — "6-MONTH", `₱6,000.00 activation + ₱6,500.00 F&B credit`, `₱6,500.00 of ₱6,500.00`, "March 3, 2027". |
| 3c | QR renders as real `data:image`; 6-digit fallback code shown | **Pass** — `<img src>` prefix `data:image/png;base64,...`, code `498757` (pre-regenerate). |
| 3d | Regenerate Code: token + code change together, correct re-render | **Pass** — new code `807236`, new (longer) QR data URL, both changed atomically. **Methodology note:** an immediate same-script re-read of the DOM (before React's `startTransition` update had flushed) transiently showed the *old* code even though the network call had already returned `200` and the DB was already updated — a fresh follow-up read showed the correct new value. This was a test-timing artifact, not an application bug (confirmed by DB read matching the eventual correct UI read exactly). |
| 3e | "Renew Membership" CTA absent while Active | **Pass** — not present. |

---

## Part 4 — Member A full-credit-covered booking (Pickleball Sim, 30 min)

| # | Scenario | Result |
|---|---|---|
| 4a | Wizard shows member price (₱400), guest-count control hidden, single `POST /api/bookings` with no `PATCH` round-trip | **Pass**, with one clarification — see "Note" below. |
| 4b | Booking instantly confirms, no PayMongo redirect | **Pass** — `/book/confirmation` reached directly, "Booking confirmed", ₱400.00. |
| 4c | `MembershipCreditTransaction` (`booking_redemption`, `-40000`); `Membership.creditBalanceCentavos` → `610000` | **Pass**. |
| 4d | `Booking.customerId` non-null at creation | **Pass**. |
| 4e | No guest fee on member booking | **Pass** — `guestCount: 0`. |
| 4f | Booking appears under `/account` Recent Bookings | **Pass** — "Pickleball Simulator — Bay 1 · Sep 20, 2026, 10:00 AM · CONFIRMED". |
| 4g | "View Pricing" modal (Tennis Court + Pickleball Simulator) matches member rates from `PROJECT_CONTEXT.md` | **Pass** — Tennis Court ₱650/hr; Pickleball Sim 15/30/60 min → ₱250/₱400/₱750, all exact. |

**Note (not a bug — plan-vs-code clarification):** the prompt's description of Part 4a ("Payment
step skips straight to a 'Booking under X' summary") describes `PaymentStep`'s behavior for a
member booking that is **not** fully credit-covered (correctly observed instead in Part 9). For a
**fully** credit-covered booking, `BookingForm.tsx`'s `handleConfirmBooking()` checks
`booking.creditCovered` and does `window.location.href = /book/confirmation?...` immediately on
the `201` response — `PaymentStep` (and its "Booking under X" summary) is never mounted at all for
this exact path. Confirmed by code read and live behavior; not a discrepancy to fix.

### Bug found — Prisma interactive-transaction timeout on the credit-redemption path

**Severity: real, reproducible under this environment's DB latency; not a data-integrity issue.**

The **first** attempt at this booking returned `POST /api/bookings → 500`, surfaced to the user as
a generic **"Something went wrong. Please try again."** The dev server log
(`.next/dev/logs/next-development.log`) showed the actual cause:

```
Booking creation failed PrismaClientKnownRequestError:
Invalid `tx.membershipCreditTransaction.create()` invocation
Transaction API error: Transaction already closed: A query cannot be executed on an expired
transaction. The timeout for this transaction was 5000 ms, however 6587 ms passed since the
start of the transaction.
```

`POST /api/bookings`'s credit-covered path does six sequential awaited queries inside one
`prisma.$transaction(...)` (stale-hold cleanup query, membership `updateMany`, `booking.create`,
`bookingAddOn.createMany`, `payment.create`, `membershipCreditTransaction.create`) — each one, per
this session's own `[PRISMA]` query-timing logs, routinely taking 250–1400 ms against the local
session-mode pooler (the same connection-priming cost already documented in CLAUDE.md's
"Local-dev database connection" decision). On a cold/idle connection, the cumulative time exceeded
Prisma's **default 5000 ms interactive-transaction timeout**, and the whole transaction was killed
mid-flight.

**Confirmed safe, not corrupting:** `booking` count and Member A's credit balance were verified
unchanged immediately after the failure — the `$transaction` correctly rolled back atomically, so
no partial booking/payment/ledger row was left behind. A retry of the identical request one
message later succeeded cleanly (redirected straight to `/book/confirmation`). This is a
**reliability/latency risk specific to the credit-redemption path** (the longest booking-creation
transaction in the codebase), not previously flagged by the 2026-08-31 credit-redemption VERIFY
pass — plausibly because that pass's requests landed on an already-warm connection pool rather
than a fresh/idle one. Left unfixed per SCOPE (no source changes); see `PROGRESS.md` Next Up.

---

## Part 5 — Expire Member A's membership (direct DB write)

| # | Scenario | Result |
|---|---|---|
| 5a | `endDate` backdated to yesterday | **Pass** (script-only setup step, no app flow does this). |
| 5b | `/account` now shows "EXPIRED" badge + "RENEW MEMBERSHIP" CTA appears | **Pass**. |
| 5c | Admin Memberships list + detail page independently agree (Expired, "Send Renewal Link" button shown) | **Pass** — confirmed via an admin-session `fetch()` against both `/admin/memberships` and the application's detail page; both correctly resolve through the shared `membership-latest.ts`. |

---

## Part 6 — Lapsed-membership pricing check (still logged in)

| # | Scenario | Result |
|---|---|---|
| 6a | `/book` as Member A (session valid, membership lapsed): non-member pricing shown, guest-count control reappears | **Pass** — Pickleball Court "View Pricing" showed "Non-member rates shown" / ₱650; Add-Ons step showed the "Number of guests" stepper (hidden while Active in Part 4); Review step showed "Estimated price ₱650.00" / "Estimated at non-member rate." Wizard abandoned before Confirm — booking count confirmed unchanged (3, same as after Part 4). |

**Minor finding (copy nuance, not a functional bug):** the Review/Payment step's non-member-rate
caption is a single fixed string —
*"Estimated at non-member rate. Member rate and F&B credit are only available when signed in to a
membership account."* (`BookingSummary.tsx`) — used identically for a fully-anonymous visitor and
for a **currently signed-in member whose membership has lapsed**. For the latter case (exactly
this scenario) the copy is misleading: the user already is signed in, so "available when signed in"
reads as if signing in would fix it, when the real cause is the lapsed membership. Cosmetic/low
severity; not fixed here per SCOPE.

---

## Part 7 — Member A self-service renewal (webhook-replayed)

| # | Scenario | Result |
|---|---|---|
| 7a | `/account/renew` tier-selection UI | **Pass** — all 3 tiers rendered with correct Activation Fee / F&B Credit / Total Due, exactly matching `PROJECT_CONTEXT.md`. |
| 7b | `POST /api/account/membership-renewal` called twice without paying | **Pass** — both calls returned the **identical** `checkoutUrl`; exactly 1 pending `MembershipPayment` row confirmed after both calls (create-or-resume idempotency). |
| 7c | Webhook-replayed (`applicationId === null` branch) | **Pass** — new `Membership` row created (`three_month`, fresh `endDate` = Dec 3 2026, `creditBalanceCentavos: 350000`, `applicationId: null`); the **old expired** `Membership` row confirmed byte-identical before/after (not deleted or mutated). |
| 7d | Both `sendMembershipRenewalEmail` (customer) and staff `[Membership Renewal]` notification fired | **Pass** — confirmed via Resend MCP `list-emails`: `"Welcome Back — Your Winston Sip & Serve Membership Has Been Renewed"` → Member A, and `"[Membership Renewal] Membership renewed — Arjay Ical — 3-Month"` → staff. |
| 7e | `/account/renew/confirmation` polls through (no session required) | **Pass** — `200` with `?membershipPaymentId=...`, no auth. |
| 7f | `/account` reloads to Active, new balance, CTA gone | **Pass** — "3-MONTH", `₱3,500.00 of ₱3,500.00`, "December 3, 2026", no "RENEW MEMBERSHIP" button. |
| 7g | Admin list/detail agree (Active) | **Pass** — detail page's derived status badge showed "Active", not "Expired". **Note:** the detail page's "Requested Tier" field is intentionally sourced from the *original application's* `requestedTier` (still "6-Month", the very first application) — this is correct, documented behavior (a historical application-snapshot field, not a "current membership tier" field); the page's live-resolved status badge is the field that actually tracks the renewal, and it was correct. |

---

## Part 8 — Member B credit-drain bookings (Golf Sim, 90 min ×2)

| # | Scenario | Result |
|---|---|---|
| 8a | Two Golf Sim 90-min bookings, each instantly confirmed via credit (₱1,400.00) | **Pass** — both `201`, `creditCovered: true`, `status: confirmed`, `totalAmountCentavos: 140000` each. No transaction-timeout repeat of Part 4's issue on either call. |
| 8b | `creditBalanceCentavos`: `350000 → 210000 → 70000` | **Pass** — final balance `70000` (₱700.00) exactly; two `booking_redemption` ledger rows, `-140000` each. |

---

## Part 9 — Member B insufficient-credit advisory modal (observe only)

| # | Scenario | Result |
|---|---|---|
| 9a/9b | Tennis Sim 60-min (₱750, exceeds ₱700 remaining) → Review → Confirm Booking | **Pass** — modal appeared with the exact expected copy: *"Your F&B credit balance is ₱700.00, which isn't enough to cover this booking. This booking totals ₱750.00. Since your credit doesn't fully cover it, none of it will be applied — you'll pay the full amount via PayMongo, and your credit balance will stay untouched."* |
| 9c | "Go Back" dismisses without confirming; no hold created, no credit touched | **Pass** — after dismiss, still on `/book`; DB confirmed Member B still has exactly 2 bookings (both Golf Sim, unchanged) and exactly `₱700.00` credit — no stray `pending_payment` row. Member B left at exactly this balance for Arjay's manual real-checkout completion. |

---

## Part 10 — Regression checks

| # | Scenario | Result |
|---|---|---|
| 10a | Full anonymous booking (Tennis Court, 60 min, 1 guest + Ball Boy) through Payment step | **Pass** — non-member pricing (₱750 court + ₱150 guest fee + ₱150 ball boy = ₱1,050.00), Payment step showed the real Name/Phone/Email contact form (not "Booking under X" — anonymous, `knownCustomer: null`), booking reference issued. Abandoned before payment (per SCOPE); left as a natural-expiry `pending_payment` hold. |
| 10b | Anonymous hold + `PATCH` attach using Member A's **real** name/email/phone | **Pass** — still priced at non-member rate (₱450.00, 30-min Pickleball Sim non-member tier) despite matching a real, currently-Active member's identity exactly; Member A's active-membership credit balance (`350000`) confirmed byte-identical before/after. `Booking.customerId` **was** correctly resolved/attached to Member A's real `Customer` row (booking-history linkage still works) — only the *pricing outcome* is withheld, exactly as the 2026-09-01 fix intends. |
| 10c | Member B session vs `/admin/*` page and `/api/admin/*` route | **Pass** — `/admin/bookings` → `307` redirect to `/admin/login`; `POST /api/admin/pricing-rules` → `401`. |

---

## Part 11 — Forgot/reset password (Member A, real flow + edge cases)

| # | Scenario | Result |
|---|---|---|
| G30 / 11a | Real forgot-password → real email via Resend MCP → real link → reset to a temp password | **Pass** — login succeeds with the new password, fails with the old. |
| 11b | Second full cycle, reset back to `password123` | **Pass** — Member A ends the pass on the agreed shared password, confirmed via login. |
| G33 / 11c | Reuse the **first** (already-consumed) reset link | **Pass, with a documentation clarification — see below.** |
| G34 / 11d | Real link retrieved, then its `PasswordResetToken.expiresAt` backdated directly, then used | **Pass, with the same clarification.** Throwaway token row deleted afterward per SCOPE. |

**Clarification (not a bug):** the prompt expected both G33 and G34 to be rejected with the
"deliberately vaguer" `404 "Invalid or expired reset link"` message that CLAUDE.md documents.
Reading `src/app/api/auth/reset-password/route.ts` and confirming live: that vaguer `404` is
returned **only** when the token hash resolves to no row at all (a genuinely unresolvable/guessed
token). An **already-used** token instead returns a specific `400 "This reset link has already
been used"`, and an **expired-but-resolvable** token returns `400 "This reset link has expired"` —
both intentional, both mirroring `/api/activate`'s identical three-way branch (not-found / used /
expired), and arguably better UX than collapsing all three into one vague message. This is a gap
between the test prompt's assumption and the actual (correct, documented-by-code) behavior, not an
application defect.

---

## Part 12 — Ledger integrity

| # | Scenario | Result |
|---|---|---|
| 12a | `SUM(MembershipCreditTransaction.amountCentavos)` matches `Membership.creditBalanceCentavos` for every membership row of both members | **Pass** — Member A: `350000`/`350000` (current) and `610000`/`610000` (historical, 2 tx); Member B: `70000`/`70000` (3 tx). |
| 12b | Every member-path booking (Parts 4, 8) has non-null `customerId` at creation | **Pass**. |

---

## Final VERIFY cross-checks

- `PricingRule` / `AddOnPricingRule` / `GuestFeeRule` row counts: **21 / 16 / 1 — unchanged** from the pre-pass baseline.
- `Customer` table contains **exactly** the two designated test emails — no other row created or modified.
- Admin panel spot-check: all 5 tabs (`/admin`, `/admin/bookings`, `/admin/memberships`, `/admin/resources`, `/admin/bulletin`, `/admin/check-in`) render `200` for an admin session.
- Final login confirmation: **both** `arjayical22@gmail.com` and `arjayrafaelical@gmail.com` log in successfully with `password123`.
- Cleanup: the one temporary QA `AdminUser` (created for Part 1's approval step) and the one throwaway `PasswordResetToken` row (Part 11d) were both deleted; `AdminUser` count back to the pre-pass baseline of 2.

---

## End state

- **Member A** (`arjayical22@gmail.com`): Active, 3-Month tier (renewed in Part 7), `password123`, `₱3,500.00` F&B credit, one confirmed Pickleball Simulator booking, one abandoned anonymous `pending_payment` hold (Part 10b, will expire naturally via the existing hold-and-expire mechanism).
- **Member B** (`arjayrafaelical@gmail.com`): Active, 3-Month tier, `password123`, exactly `₱700.00` F&B credit, two confirmed Golf Simulator bookings — sitting ready for Arjay's one manual real-checkout booking (Tennis Simulator, 60 min, ₱750, insufficient-credit path).
- One additional stray anonymous `pending_payment` hold exists from Part 10a (Tennis Court) — not linked to either test member, will also expire naturally.

## Bugs found (summary)

1. **Real, reproducible-under-latency:** `POST /api/bookings`'s credit-redemption transaction can
   exceed Prisma's default 5000 ms interactive-transaction timeout on a cold local-dev DB
   connection, surfacing as a generic 500 to the customer. Transactionally safe (clean rollback,
   confirmed via before/after row counts), but a real reliability gap on the codebase's
   longest booking-creation transaction. Not fixed here per SCOPE — see `PROGRESS.md` Next Up.
2. **Cosmetic/copy:** the non-member-rate caption in the booking wizard doesn't distinguish
   "anonymous visitor" from "signed-in member with a lapsed membership," which is slightly
   misleading in the latter case (Part 6). Not fixed here per SCOPE.

Everything else in this pass matched documented/expected behavior exactly, including three cases
where the *test prompt's own assumption* (not the app) was off: Part 4a's full-credit-cover path
skips `PaymentStep` entirely rather than rendering its summary; and G33/G34 return specific
`400` messages rather than the vaguer `404` (both intentional, both confirmed correct by code
read).
