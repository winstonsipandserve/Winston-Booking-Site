# PROJECT_CONTEXT.md

Business rules, pricing, and membership logic for Winston Sip and Serve, as finalized by the client. Read alongside **CLAUDE.md** (tech stack, architecture decisions, workflow).

---

## Resource Inventory

- Tennis: 1 court, 1 simulator
- Pickleball: 3 courts, 2 simulators
- Golf: 2 simulators (no physical court)
- Single venue, no location differentiation needed

---

## Pricing

### Member Rates

**Court (hourly flat):**
- Tennis court: ₱650/hr
- Pickleball court: ₱550/hr

**Simulator (tiered by minutes):**
- Tennis sim: 15min ₱250 / 30min ₱400 / 60min ₱750
- Pickleball sim: 15min ₱250 / 30min ₱400 / 60min ₱750
- Golf sim: 30min ₱450 / 60min ₱950 / 90min ₱1400

### Non-Member Rates

**Court (hourly flat):**
- Tennis court: ₱750/hr
- Pickleball court: ₱650/hr

**Simulator (tiered by minutes):**
- Tennis sim: 15min ₱300 / 30min ₱450 / 60min ₱800
- Pickleball sim: 15min ₱300 / 30min ₱450 / 60min ₱800
- Golf sim: 60min ₱1150 / 90min ₱1450 — **no 30-min tier offered to non-members** (member-only tier)

---

## Guest Fee Rule

- Applies to non-member court bookings only (NOT simulators, NOT member bookings)
- ₱150/hr per additional guest, booker is exempt from their own guest fee
- Single lump-sum charge to the booker covering court rate + (guest fee × non-exempt guest count) — one Payment record per Booking, not split per guest
- Example: 6-person tennis court booking (1 booker + 5 guests), non-member: ₱750 court + (5 × ₱150) = ₱1,500 total, charged to booker

---

## Add-On Services

Coaching fee and ball boy are add-ons attached to a booking, not separate booking types. Equipment rental (rackets/paddles) is out of scope for now but will follow the identical add-on pattern later — design the add-on model generically enough to absorb it without restructuring.

**Coaching Fee:**
- Member court (tennis/pickleball): ₱750 (1 pax) / ₱1200 (2 pax)
- Member tennis sim: ₱800/hr
- Member pickleball sim: ₱800/hr
- Member golf sim: ₱1000
- Non-member court (tennis/pickleball): ₱800 (1pax) / ₱1200 (2pax)
- Non-member tennis sim: **Not offered** — no rate listed on client rate sheet
- Non-member pickleball sim: **Not offered** — no rate listed on client rate sheet
- Non-member golf sim: ₱1000

**Ball Boy:**
- Member: ₱150
- Non-member: ₱150

Note: ball boy is a court-only add-on (courts have a ball boy; simulators do not, per resource type — matches existing rate sheet structure). Coaching fee applies to both courts and simulators.

---

## Membership Tiers

- 3 plans: 3-month (₱5,500), 6-month (₱12,500), 12-month (₱22,500)
- Each payment splits into: non-refundable activation fee + expiring F&B credit balance
  - 3mo: ₱2,000 activation + ₱3,500 credit
  - 6mo: ₱6,000 activation + ₱6,500 credit
  - 12mo: ₱10,500 activation + ₱12,000 credit
- Credit expires at plan end regardless of usage — no rollover, no refund on unused credit
- Perks: priority bookings, facility use, complimentary F&B (via credit), exclusive event access

---

## Membership Application & Approval Flow

- Customer submits form: name, address, contact number, email, government ID (front, back, selfie with ID)
- Application enters pending state — does NOT create a Membership record yet
- Admin manually reviews and approves or rejects
- Membership record (with tier, credit balance, expiry) is created only on approval
- Government ID images: private storage, admin-only access — do not expose to the customer-facing membership account UI
- Note for a later prompt: rejection should support an optional reason, and application needs status/reviewedBy/reviewedAt fields for the audit trail

---

## Cancellation & Reschedule Policy

- No customer-initiated refund or reschedule — final at time of booking
- Admin-initiated reschedule only, for facility-side issues (weather, maintenance) — never customer-side changes
- Actual reschedule date coordination with the customer happens outside the system (phone/manual contact)
- Reschedule must be logged with an audit trail: original slot, new slot, reason, admin who performed it, timestamp — not a silent overwrite of the original booking

---

## Admin Capabilities (confirmed scope)

- Manage all bookings
- Manage courts & simulators (resources)
- Manage membership accounts (including application approval/rejection)
- Manage bulletin (announcements/news shown on the public homepage)
- Manage pricing rules (court/simulator rates, add-on service rates — member and non-member)

---

## Bulletin / Announcements

- Admin-managed announcements/news section, displayed on the public homepage
