# Business & Domain

The business rules, pricing, and domain concepts for Winston Sip and Serve, as finalized with the client. This is the *what the business does* document — it describes rules that would still be true if the software were rewritten from scratch.

> **Updated 21 September 2026** to the client's revised membership product, rate card, inventory, and add-on catalogue. The application still implements the previous rules in several places; [roadmap.md](roadmap.md) → Client Update tracks the gap, and [features.md](features.md) describes the app as currently built.

**See also:** [features.md](features.md) (what the app currently does) · [workflows.md](workflows.md) (how processes run) · [decisions.md](decisions.md) (why choices were made) · [roadmap.md](roadmap.md) (what is not built yet)

---

## Business Overview

**Winston Sip and Serve** is a sports facility offering pickleball courts plus tennis, pickleball, and golf simulator bays, with an attached café and bar. The platform is a customer-facing booking site plus an admin panel for staff.

- **Single venue.** There is no multi-location concept and none is planned. Nothing in the domain differentiates by location.
- **Current business scope**: taking and managing bookings, and selling/managing memberships.
- **Planned extension**: a point-of-sale (POS) system for the café/bar, on this same platform. Not being built now — see [roadmap.md](roadmap.md).

---

## User Types

| Type | Has a login? | How they are identified |
|---|---|---|
| **Anonymous booker** | No | Provides name, phone, and email before payment. A customer record is created or matched on their email. |
| **Member** | Yes | A login account exists only once an approved membership has been paid for and activated. Every member holds one of three tiers — see Membership. |
| **Admin / staff** | Yes | Individual staff accounts, not a shared login. Multiple staff can hold the admin role. |

Key rules:

- **Non-members can book without creating an account.** Before being redirected to payment they must supply name, phone number, and email address.
- **Only members have login accounts.** Account access is tied to an approved, paid membership. A non-member's customer record exists in the system but has no password.
- Knowing a member's contact details is never sufficient to obtain member pricing, spend their credit, or use their perks — member benefits require an authenticated session. See [decisions.md](decisions.md).

---

## Sports, Resources & Facilities

Three sports across two resource categories — **courts** (physical playing surfaces) and **simulators** (bays).

| Sport | Courts | Simulators |
|---|---|---|
| Tennis | — | 2 |
| Pickleball | 2 | 1 |
| Golf | — (no physical court) | 1 |

**Six bookable units in total**, across four resource types: pickleball court, tennis simulator, pickleball simulator, golf simulator. **There is no tennis court.** Tennis is played only in the simulator bays.

A booking is always made against a *specific* unit (Court 1, Bay 2), never against a sport in the abstract.

> **If inventory ever changes, two places must be updated together.** The Home page stat banner is a **static hardcoded snapshot**, not a live query — it reads `TOTAL_RESOURCES` and `SPORT_COUNT` constants in `StatsBar.tsx`. Changing the resources in the database without updating those constants leaves the marketing page advertising the wrong numbers.

---

## Business Hours

- **6:00 AM – 10:00 PM daily**, uniform across every resource type.
- A booking's start must be in the future; past slots cannot be booked (the wizard disables them and the API rejects them).
- The AM (6–11) / PM (12–10) rate-period split that appears on the client's rate sheet is a **display label only**, not a booking restriction. Bookings may span the 11 AM–12 PM boundary freely, and no pricing differs by period.

### Advance booking window

How far ahead a booking may be made depends on who is booking. The window is **today (Manila) plus the next N calendar days**; every later date is disabled.

| Who | Window |
|---|---|
| Non-member (and any date that no membership term covers) | today + 3 days |
| Winston Player | today + 5 days |
| Winston Premier / Founding Member | today + 7 days |
| Winston Elite | today + 10 days |

- **The window is judged at the slot, like every other member benefit.** A date is bookable when it falls within the window of the membership term that covers it; otherwise it must fall within the non-member window. A member whose term ends in two days therefore cannot use their tier's window to reach a date after expiry — unless a queued renewal covers that date.
- Worked example: on 21 September a non-member can book 21, 22, 23, or 24 September; the 25th onward is disabled. A Winston Player sees 21–26; a Premier member 21–28; an Elite member 21 September – 1 October.
- Admin reschedules are bound by the same window as the booking's customer.

---

## Pricing

All prices are in Philippine pesos. Courts are charged at a flat hourly rate; simulators are charged in fixed duration tiers. The rate card lists **base rates**; members receive a percentage discount by tier (below).

### Base rates

| Resource | Duration | Base rate |
|---|---|---|
| Pickleball court | per hour | ₱750 |
| Tennis simulator | 30 min | ₱400 |
| | 60 min | ₱800 |
| Pickleball simulator | 30 min | ₱350 |
| | 60 min | ₱750 |
| Golf simulator | 60 min | ₱1,200 |

Only the combinations above are offered. There is no 15-minute simulator tier, no 30-minute golf tier, and no 90-minute golf tier.

Court bookings must be a whole number of hours, **up to 4 hours per booking**. Simulator bookings must match one of the tiers above exactly. The 4-hour court cap is enforced by the API and bounds how much of a court a single unpaid hold can occupy — see [workflows.md](workflows.md) → Hold and expiry.

### Member discount

A member's tier takes a percentage off the **base court or simulator rate** of every booking whose slot their term covers:

| Tier | Discount |
|---|---|
| Winston Player | 5% |
| Winston Premier (including Founding Members) | 10% |
| Winston Elite | 15% |

- The discount applies to the base rate only — **not** to the guest fee and **not** to coaching. (Assumption pending client confirmation; see [roadmap.md](roadmap.md) → Open Questions.)
- Computed in centavos; every current rate divides exactly, and any future remainder rounds half-up to the nearest centavo.
- Worked example: an Elite member booking a 60-minute golf simulator pays ₱1,200 − 15% = **₱1,020**; a Player booking two court hours pays (2 × ₱750) − 5% = **₱1,425**.

### Where rates live

Base court and simulator rates, coaching rates, and the guest fee are **admin-editable from the panel** without a code deploy. Only the combinations listed above are valid — an unoffered combination (e.g. a 30-minute golf slot) simply has no rate and cannot be created. Membership tier prices, tier discount percentages, and the Founding Member cap are the exception: they are fixed in code, not admin-editable.

---

## Guest Fee

A flat **₱100 per additional guest**.

- Applies to **all bookings** — every resource type (courts and simulators), members and non-members alike. It is not reduced by the member discount.
- **Independent of booking duration.** A 30-minute simulator session and a 3-hour court booking incur the same per-guest fee.
- **The booker is exempt from their own guest fee** — only additional guests are charged.
- **Maximum 7 guests per booking.** Confirmed by the client for non-member bookings; members are held to the same cap until the client says otherwise (see [roadmap.md](roadmap.md) → Open Questions).
- **Members may waive the fee with complimentary guest passes** — see Membership → Guest passes.
- Charged as a **single lump sum to the booker** covering base rate + (guest fee × unwaived guest count). One payment for the whole booking, never split per guest.
- **Admin-editable**, not hardcoded.

Worked examples:

- **Court**: 6-person pickleball court booking (1 booker + 5 guests), non-member — ₱750 court + (5 × ₱100) = **₱1,250**, charged to the booker.
- **Simulator**: Premier member golf-sim booking (60 min) with 2 additional guests and no passes left — (₱1,200 − 10%) + (2 × ₱100) = **₱1,280**, charged to the booker.

---

## Add-On Services

Coaching is an **add-on attached to a booking**, not a separate booking type. It is a flat charge per booking — not multiplied by duration or guest count — and is not reduced by the member discount.

**Ball boy has been removed entirely.** It is not offered on the public booking wizard or on the member booking flow, on any resource.

Equipment rental (rackets/paddles) is out of scope for now but will follow the identical add-on pattern when added.

### Coaching fee

| Resource | Member | Non-member |
|---|---|---|
| Pickleball court | ₱750 (1 pax) / ₱1,200 (2 pax) | ₱800 (1 pax) / ₱1,200 (2 pax) |
| Tennis simulator | ₱800 | **not offered** |
| Pickleball simulator | ₱800 | **not offered** |
| Golf simulator | ₱1,000 | ₱1,000 |

Coaching on courts is tiered by pax count (1 or 2). Coaching on simulators has no pax tier. The member/non-member coaching rates are explicit rows, unchanged by the tier discount.

**Non-member coaching is not offered on tennis or pickleball simulators** — no rate exists on the client's rate sheet, so the combination is intentionally absent rather than priced at zero.

---

## Membership

### Tiers

Three annual plans. **The price is the membership fee in full — no food & beverage credit is granted with any tier.**

| Plan | Price / year | Advance window | Guest passes / year | Booking discount | Birthday-month perk | Other perks |
|---|---|---|---|---|---|---|
| **Winston Player** | ₱3,500 | 5 days | 2 | 5% | 50% off one court hour | Access to member open plays, mixers & events |
| **Winston Premier** | ₱6,500 | 7 days | 4 | 10% | 1 complimentary court hour | Priority registration for tournaments, leagues & clinics; access to exclusive member events; exclusive Winston welcome gift |
| **Winston Elite** | ₱9,500 | 10 days | 6 | 15% | 1 complimentary court hour | Highest-priority registration for tournaments, leagues & clinics; access to exclusive member events; premium Winston merchandise |

Every tier also receives **10% off Winston Sip & Serve** (the café and bar).

### Founding Members

- Limited to the **first 100 paid Winston Premier activations**.
- **First-year price ₱5,000** instead of ₱6,500. Renewals are at the standard Premier price of ₱6,500.
- Once the 100 places are filled, Premier costs ₱6,500 for everyone who joins after.
- Founding status is a **permanent flag on a Premier membership**, not a fourth tier: the 7-day window, 4 guest passes, 10% discount, birthday court hour, and every other Premier perk apply unchanged. Founding Members additionally receive **exclusive Founding Member merchandise**.

### Which perks the system enforces

| Enforced by the booking system | Honoured at the venue, outside the system |
|---|---|
| Advance booking window | 10% off Winston Sip & Serve (until the POS extension exists) |
| Booking discount | Member open plays, mixers, and exclusive member events |
| Complimentary guest passes | Priority / highest-priority registration for tournaments, leagues, and clinics |
| Birthday-month court hour | Welcome gift, premium merchandise, Founding Member merchandise |
| Founding Member price and the 100-place cap | |

### Guest passes

- Each tier grants a fixed number of complimentary guest passes **per membership term** (2 / 4 / 6).
- **One pass waives the ₱100 guest fee for one guest on one booking.** A booking with three guests and two passes remaining pays one guest fee.
- Passes are consumed when the booking is confirmed. Because customers cannot cancel, a consumed pass is not returned; an admin reschedule keeps the passes on the moved booking.
- **Unused passes expire with the term** and do not carry into a queued renewal, which starts with its own full allowance.

### Birthday-month court hour

- Redeemable **once per membership term**, on a booking whose slot falls within the member's birthday month on the Manila calendar.
- **Winston Player**: 50% off one court hour. **Premier, Founding, and Elite**: one court hour free.
- Requires the member's **date of birth**, collected on the membership application.
- Which resources count as a "court hour" — the pickleball courts only, or any 60-minute booking including simulators — is an **open client question**. Until answered, the perk is read as applying to the pickleball courts. See [roadmap.md](roadmap.md).

### Term, expiry, and renewal

- **Every tier is a 12-month term.**
- **A term runs through 23:59:59 Asia/Manila on its last day.** The end date is the start date plus twelve months, on the Manila calendar; members never lapse mid-day.
- **Member benefits are judged at the slot, not at checkout.** A booking gets the tier discount, the tier's advance window, and access to guest passes and credit only when a membership term covers the booking's start time. A member two days from expiry booking next week pays non-member rates for that slot and the wizard says so.
- **Renewal opens 14 days before expiry.** The renewed term is queued to start the day after the current one ends, so no paid-for days are lost. Outside that window a live member cannot renew, and only one renewal can be queued at a time. A lapsed member can renew at any time and the new term starts on payment.
- **A renewal may be into any tier.** A Founding Member renews at the standard Premier price and keeps the Founding flag.
- **Each term has its own credit balance and its own guest-pass and birthday allowances.** None carry from the current term into a queued renewal.

### Credit rules

Credit is a member's prepaid balance for bookings. **No credit is granted with a membership**; a balance exists only through top-ups.

- Credit can be **topped up** by the member themselves and by staff at the front desk.
- Credit is spent on bookings on a **full-coverage-only basis**: if the balance covers the entire booking total, the booking is paid entirely from credit; if it does not, credit is left untouched and the member pays the full amount by card/e-wallet. **Credit is never split with a card payment.** See [workflows.md](workflows.md).
- **Credit belongs to the term it was bought in and expires at that term's end.** No rollover into a queued renewal, no refund on unused credit.
- **A top-up paid after the term ended is still credited to that term** (the checkout was started while active, the payment landed late). Staff receive an "Action needed" notification and arrange a refund or a renewal by hand; a successful payment is never discarded.
- Every change to a member's balance is recorded as an immutable ledger entry, so the balance can always be re-derived. See [decisions.md](decisions.md).

### Application & approval rules

- A prospective member submits: name, **date of birth**, address, contact number, email, and government ID (front, back, and a selfie holding the ID), and chooses a tier.
- The application enters a **pending** state. **It does not create a membership.**
- Submitting an application always resolves to a customer record (created or matched by email), **regardless of approval outcome**. A rejected application leaves that customer record in place with no membership attached — this is a normal state, not an error.
- An admin manually reviews and approves or rejects. There is no automatic approval.
- **Approval alone does not create a membership.** It marks the application approved and emails the applicant a payment link. The membership — with its tier, allowances, and expiry — exists only once that activation payment is confirmed. A Premier activation that lands while fewer than 100 Founding places are taken is charged ₱5,000 and flagged Founding at that moment.
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
- Manage pricing rules — base court and simulator rates, coaching rates (member and non-member), and the guest fee. Tier prices, tier discounts, and the Founding Member cap are fixed in code.

---

## Announcements & News

Operational booking notices and editorial news are separate domains.

### Announcements

Announcements are short, plain-text heads-ups shown only in the `/book` “Before You Book” gate. An announcement has an **Information**, **Warning**, or **Urgent** level; an operational window (**Affects from** / **Affects until**) describing when the closure or change actually applies; an optional earlier **Show notice from** date so customers get advance warning while the courts stay bookable; and optional links to specific courts or simulator bays.

Linking a resource is informational by default. The separate auto-disable toggle is required to take linked resources offline during the operational window; the advance-notice date never affects availability. A manual staff enable or disable always overrides an automatic announcement claim, and releasing one announcement never overrides a manual disable or another active claim. See [workflows.md](workflows.md).

### News

News is long-form editorial content shown only on `/news` and `/news/[slug]`. Its categories are **Tournament**, **Community**, **Promotion**, and **General**. Posts may be drafted, published immediately, or scheduled, and any number may be featured; the newest featured post receives the large-card treatment.

Promotion news remains informational. It does not modify checkout totals, validate promo codes, or change pricing rules. Any actual price change is made separately by an admin through pricing.
