# Business & Domain

The business rules, pricing, and domain concepts for Winston Sip and Serve, as finalized with the client. This is the *what the business does* document — it describes rules that would still be true if the software were rewritten from scratch.

**See also:** [features.md](features.md) (what the app currently does) · [workflows.md](workflows.md) (how processes run) · [decisions.md](decisions.md) (why choices were made) · [roadmap.md](roadmap.md) (what is not built yet)

---

## Business Overview

**Winston Sip and Serve** is a sports facility offering tennis, pickleball, and golf simulator bays, with an attached café and bar. The platform is a customer-facing booking site plus an admin panel for staff.

- **Single venue.** There is no multi-location concept and none is planned. Nothing in the domain differentiates by location.
- **Current business scope**: taking and managing bookings, and selling/managing memberships.
- **Planned extension**: a point-of-sale (POS) system for the café/bar, on this same platform. Not being built now — see [roadmap.md](roadmap.md).

---

## User Types

| Type | Has a login? | How they are identified |
|---|---|---|
| **Anonymous booker** | No | Provides name, phone, and email before payment. A customer record is created or matched on their email. |
| **Member** | Yes | A login account exists only once an approved membership has been paid for and activated. |
| **Admin / staff** | Yes | Individual staff accounts, not a shared login. Multiple staff can hold the admin role. |

Key rules:

- **Non-members can book without creating an account.** Before being redirected to payment they must supply name, phone number, and email address.
- **Only members have login accounts.** Account access is tied to an approved, paid membership. A non-member's customer record exists in the system but has no password.
- Knowing a member's contact details is never sufficient to obtain member pricing or spend their credit — member benefits require an authenticated session. See [decisions.md](decisions.md).

---

## Sports, Resources & Facilities

Three sports across two resource categories — **courts** (physical playing surfaces) and **simulators** (bays).

| Sport | Courts | Simulators |
|---|---|---|
| Tennis | 1 | 1 |
| Pickleball | 3 | 2 |
| Golf | — (no physical court) | 2 |

**Nine bookable units in total**, across five resource types: tennis court, pickleball court, tennis simulator, pickleball simulator, golf simulator.

A booking is always made against a *specific* unit (Court 1, Bay 2), never against a sport in the abstract.

> **If inventory ever changes, two places must be updated together.** The Home page stat banner is a **static hardcoded snapshot**, not a live query — it reads `TOTAL_RESOURCES` and `SPORT_COUNT` constants in `StatsBar.tsx`. Changing the resources in the database without updating those constants leaves the marketing page advertising the wrong numbers.

---

## Business Hours

- **6:00 AM – 10:00 PM daily**, uniform across every resource type.
- **No maximum advance-booking window** — a customer may book arbitrarily far ahead.
- The AM (6–11) / PM (12–10) rate-period split that appears on the client's rate sheet is a **display label only**, not a booking restriction. Bookings may span the 11 AM–12 PM boundary freely, and no pricing differs by period.

---

## Pricing

All prices are in Philippine pesos. Courts are charged at a flat hourly rate; simulators are charged in fixed duration tiers.

### Court rates (hourly flat)

| Resource | Member | Non-member |
|---|---|---|
| Tennis court | ₱650/hr | ₱750/hr |
| Pickleball court | ₱550/hr | ₱650/hr |

### Simulator rates (tiered by minutes)

| Resource | Duration | Member | Non-member |
|---|---|---|---|
| Tennis simulator | 15 min | ₱250 | ₱300 |
| | 30 min | ₱400 | ₱450 |
| | 60 min | ₱750 | ₱800 |
| Pickleball simulator | 15 min | ₱250 | ₱300 |
| | 30 min | ₱400 | ₱450 |
| | 60 min | ₱750 | ₱800 |
| Golf simulator | 30 min | ₱450 | **not offered** |
| | 60 min | ₱950 | ₱1,150 |
| | 90 min | ₱1,400 | ₱1,450 |

**The 30-minute golf simulator tier is member-only.** This is a deliberate membership perk, not an oversight — non-members have no 30-minute golf option at any price.

Court bookings must be a whole number of hours. Simulator bookings must match one of the tiers above exactly.

### Where rates live

Court, simulator, and add-on rates are **admin-editable from the panel** without a code deploy. Only the combinations listed above are valid — an unoffered combination (e.g. non-member 30-minute golf) simply has no rate and cannot be created. Membership tier prices are the exception: they are fixed in code, not admin-editable.

---

## Guest Fee

A flat **₱150 per additional guest**.

- Applies to **all bookings** — every resource type (courts and simulators) and both rate tiers (member and non-member).
- **Independent of booking duration.** A 15-minute simulator session and a 3-hour court booking incur the same per-guest fee.
- **The booker is exempt from their own guest fee** — only additional guests are charged.
- Charged as a **single lump sum to the booker** covering base rate + (guest fee × guest count). One payment for the whole booking, never split per guest.
- **Admin-editable**, not hardcoded.

Worked examples:

- **Court**: 6-person tennis court booking (1 booker + 5 guests), non-member — ₱750 court + (5 × ₱150) = **₱1,500**, charged to the booker.
- **Simulator**: member golf-sim booking (60 min) with 2 additional guests — ₱950 sim + (2 × ₱150) = **₱1,250**, charged to the booker.

---

## Add-On Services

Coaching and ball boy are **add-ons attached to a booking**, not separate booking types. Each is a flat charge per booking — not multiplied by duration or guest count.

Equipment rental (rackets/paddles) is out of scope for now but will follow the identical add-on pattern when added.

### Coaching fee

| Resource | Member | Non-member |
|---|---|---|
| Tennis court | ₱750 (1 pax) / ₱1,200 (2 pax) | ₱800 (1 pax) / ₱1,200 (2 pax) |
| Pickleball court | ₱750 (1 pax) / ₱1,200 (2 pax) | ₱800 (1 pax) / ₱1,200 (2 pax) |
| Tennis simulator | ₱800 | **not offered** |
| Pickleball simulator | ₱800 | **not offered** |
| Golf simulator | ₱1,000 | ₱1,000 |

Coaching on courts is tiered by pax count (1 or 2). Coaching on simulators has no pax tier.

**Non-member coaching is not offered on tennis or pickleball simulators** — no rate exists on the client's rate sheet, so the combination is intentionally absent rather than priced at zero.

### Ball boy

**₱150**, same for members and non-members.

**Ball boy is a court-only add-on.** Simulators have no ball boy option, matching the rate sheet's structure.

---

## Membership

### Tiers

Three plans. Each payment splits into a **non-refundable activation fee** plus an **expiring food & beverage credit balance**.

| Plan | Total price | Activation fee | F&B credit | Duration |
|---|---|---|---|---|
| 3-month | ₱5,500 | ₱2,000 | ₱3,500 | 3 months |
| 6-month | ₱12,500 | ₱6,000 | ₱6,500 | 6 months |
| 12-month | ₱22,500 | ₱10,500 | ₱12,000 | 12 months |

### Credit rules

- **Credit expires at plan end regardless of usage.** No rollover, no refund on unused credit.
- Credit can be **topped up** beyond the original grant, both by the member themselves and by staff at the front desk.
- Credit is spent on bookings on a **full-coverage-only basis**: if the balance covers the entire booking total, the booking is paid entirely from credit; if it does not, credit is left untouched and the member pays the full amount by card/e-wallet. **Credit is never split with a card payment.** See [workflows.md](workflows.md).
- Every change to a member's balance is recorded as an immutable ledger entry, so the balance can always be re-derived. See [decisions.md](decisions.md).

### Membership perks

- Priority bookings
- Facility use
- Complimentary food & beverage (via the credit balance)
- Exclusive event access
- Member pricing on all courts and simulators, including the member-only 30-minute golf simulator tier

### Application & approval rules

- A prospective member submits: name, address, contact number, email, and government ID (front, back, and a selfie holding the ID).
- The application enters a **pending** state. **It does not create a membership.**
- Submitting an application always resolves to a customer record (created or matched by email), **regardless of approval outcome**. A rejected application leaves that customer record in place with no membership attached — this is a normal state, not an error.
- An admin manually reviews and approves or rejects. There is no automatic approval.
- **Approval alone does not create a membership.** It marks the application approved and emails the applicant a payment link. The membership — with its tier, credit balance, and expiry — exists only once that activation payment is confirmed.
- **Rejection requires a reason.** A non-empty reason is mandatory, enforced server-side.
- **Government ID images are private, admin-only.** They must never be exposed on any customer-facing surface.
- **Reapplication is blocked** while the same email's most recent application is pending, awaiting payment, tied to an active membership, or tied to an expired membership — each case gives its own distinct message. Only a *rejected* most-recent application allows a fresh application.

---

## Cancellation & Reschedule Policy

- **No customer-initiated refund or reschedule.** A booking is final at the time it is made.
- **Admin-initiated reschedule only**, and only for facility-side issues — weather, maintenance, and similar. Never for customer-side changes of plan.
- Coordinating the actual new date with the customer happens **outside the system** (phone or manual contact).
- Every reschedule must be **logged with a full audit trail**: original slot, new slot, reason, which admin performed it, and when. A reschedule is never a silent overwrite of the original booking.

---

## Admin Capabilities (confirmed scope)

- Manage all bookings
- Manage courts and simulators
- Manage membership accounts, including application approval and rejection
- Manage booking announcements and public news independently
- Manage pricing rules — court and simulator rates, add-on service rates, and the guest fee, for both member and non-member tiers

---

## Announcements & News

Operational booking notices and editorial news are separate domains.

### Announcements

Announcements are short, plain-text heads-ups shown only in the `/book` “Before You Book” gate. An announcement has an **Information**, **Warning**, or **Urgent** level; an operational window (**Affects from** / **Affects until**) describing when the closure or change actually applies; an optional earlier **Show notice from** date so customers get advance warning while the courts stay bookable; and optional links to specific courts or simulator bays.

Linking a resource is informational by default. The separate auto-disable toggle is required to take linked resources offline during the operational window; the advance-notice date never affects availability. A manual staff enable or disable always overrides an automatic announcement claim, and releasing one announcement never overrides a manual disable or another active claim. See [workflows.md](workflows.md).

### News

News is long-form editorial content shown only on `/news` and `/news/[slug]`. Its categories are **Tournament**, **Community**, **Promotion**, and **General**. Posts may be drafted, published immediately, or scheduled, and any number may be featured; the newest featured post receives the large-card treatment.

Promotion news remains informational. It does not modify checkout totals, validate promo codes, or change pricing rules. Any actual price change is made separately by an admin through pricing.
