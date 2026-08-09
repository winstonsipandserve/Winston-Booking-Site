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

> **BLOCKED — client rate table not yet supplied.** The originating prompt referenced "the client's PDF" for full rate tables, but no such file exists in this repo and no figures were included in the prompt text. Rather than invent numbers, this section is left open pending the actual data. Needed:
>
> - Court rates (hourly-flat), member vs. non-member: tennis court, pickleball courts
> - Simulator rates (tiered by minutes), member vs. non-member:
>   - Tennis sim & pickleball sim: 15 / 30 / 60-minute tiers
>   - Golf sim: 30 / 60 / 90-minute tiers
> - Coaching fee, member vs. non-member
> - Ball boy rate, member vs. non-member
>
> **Do not fill this section with placeholder or estimated numbers** — wait for the client's actual rate table (PDF upload or pasted figures), then update this section in a follow-up edit.

---

## Guest Fee Rule

- Applies to non-member court bookings only (NOT simulators, NOT member bookings)
- ₱150/hr per additional guest, booker is exempt from their own guest fee
- Single lump-sum charge to the booker covering court rate + (guest fee × non-exempt guest count) — one Payment record per Booking, not split per guest
- Example: 6-person tennis court booking (1 booker + 5 guests), non-member: ₱750 court + (5 × ₱150) = ₱1,500 total, charged to booker

---

## Add-On Services

- Coaching fee and ball boy are add-ons attached to a booking, not separate booking types
- Rates vary by resource type and member/non-member status — **blocked on the same client rate table as the Pricing section above**; document once received
- Equipment rental (rackets/paddles) is out of scope for now but will follow the identical add-on pattern later — design the add-on model generically enough to absorb it without restructuring

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

---

## Bulletin / Announcements

- Admin-managed announcements/news section, displayed on the public homepage
