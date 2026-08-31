# PROJECT_CONTEXT.md

Business rules, pricing, and membership logic for Winston Sip and Serve, as finalized by the client. Read alongside **CLAUDE.md** (tech stack, architecture decisions, workflow).

---

## Resource Inventory

- Tennis: 1 court, 1 simulator
- Pickleball: 3 courts, 2 simulators
- Golf: 2 simulators (no physical court)
- Single venue, no location differentiation needed

---

## Account Requirements

- Non-members can book without creating an account. Before payment (redirect to PayMongo), they must provide: name, phone number, email address.
- Only members have login accounts — account access is tied to an approved Membership.

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

## Business Hours

- 6:00 AM–10:00 PM daily, uniform across all resource types — no maximum advance-booking window.
- The AM (6–11) / PM (12–10) rate-period split referenced elsewhere is a display label only, not a booking restriction — bookings may span freely across the 11am–12pm boundary.

---

## Guest Fee Rule

- Applies to non-member court bookings only (NOT simulators, NOT member bookings)
- ₱150/hr per additional guest, booker is exempt from their own guest fee
- Single lump-sum charge to the booker covering court rate + (guest fee × non-exempt guest count) — one Payment record per Booking, not split per guest
- Example: 6-person tennis court booking (1 booker + 5 guests), non-member: ₱750 court + (5 × ₱150) = ₱1,500 total, charged to booker
- Rate is admin-editable via the panel, not hardcoded — stored in a dedicated `GuestFeeRule` table (see CLAUDE.md → Architecture Decisions), same DB-driven pricing pattern as `PricingRule`/`AddOnPricingRule`.

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
- Submitting an application always resolves to a `Customer` record (created or matched by email) — this happens regardless of approval outcome. A rejected application leaves that `Customer` record in place with no `Membership` attached; this is a normal state, not an error condition.
- Admin manually reviews and approves or rejects
- Approval alone does NOT create a Membership — it only flips the application to `approved` and emails the applicant a payment link. The Membership record (with tier, credit balance, expiry) is created only once that tier-activation payment is confirmed via the PayMongo webhook (see CLAUDE.md → Architecture Decisions → Membership payment model).
- Government ID images: private storage, admin-only access — do not expose to the customer-facing membership account UI
- Rejection requires a reason (non-empty string, enforced server-side, trimmed before storage) — not optional. Application carries status/reviewedById/reviewedAt for the audit trail (built 2026-08-20, see PROGRESS.md).

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
- Manage bulletin (announcements/news shown on /news and /book's announcement gate — not the homepage)
- Manage pricing rules (court/simulator rates, add-on service rates — member and non-member)

---

## Bulletin / Announcements

- One unified `Bulletin` model backs the admin panel (`/admin/bulletin`), the public `/news` page, and `/book`'s `AnnouncementGate` — these are not three separate data sources. `/news` and `AnnouncementGate` (via `GET /api/bulletin/gate-notices`) are both wired to the live `Bulletin` table today; no hardcoded `NEWS_ITEMS`/`SAMPLE_NOTICES` arrays remain.
- Core fields: `title`, `body` (labeled "Description" in the admin UI — the underlying field/column is still `body`, not renamed), `excerpt` (a shorter summary distinct from the full body), `category` (`BulletinCategory`), `imageUrl`, `socialPlatform`/`socialUrl` (both optional, provided together or not at all), `isPublished`, `publishedAt`.
- `BulletinCategory` is a fixed 6-value enum, admin dropdown label shown in parentheses: `Renovation` ("Renovation"), `Closure` ("Facility Closure"), `Tournament` ("Tournament"), `Community` ("Community Event"), `General` ("General Announcement"), `FacilityMaintenance` ("Facility Maintenance"). No other categories exist or are planned.
- Optional metadata fields (added 2026-08-27, all nullable): `affectedFacility` (free-text, e.g. which court/bay/area is impacted), `impact` (free-text description of the effect on customers), `action` (free-text — what a customer should do in response, if anything), `eventStartAt`/`eventEndAt` (optional independent datetimes for a bulletin tied to a scheduled event or maintenance window — not required as a pair), `expiresAt` (optional date after which the bulletin is considered stale — not yet enforced by any query filter; see Open items), `ctaLabel`/`ctaUrl` (optional pair, provided together or not at all, for an optional call-to-action link/button). A `priority` field (`BulletinPriority`: Normal/High) existed briefly but was removed 2026-08-31 — a client/business decision that announcements shouldn't carry a priority.
- Every published bulletin carries a real `publishedAt` date — auto-set the first time a bulletin is published, and preserved (never reset) through any later unpublish/republish cycle. There is no "Ongoing"/evergreen concept — an unpublished bulletin is simply a draft with `publishedAt: null` until its first publish.
- Bulletin images upload to a public Supabase Storage bucket (`bulletin-images`) — publicly readable via a constructed public URL, no signed-URL flow needed (unlike the private government-ID bucket used for membership applications).
