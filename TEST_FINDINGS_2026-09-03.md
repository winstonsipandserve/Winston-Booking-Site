# Test Findings — 2026-09-03

QA/verification pass against local dev (`npm run dev`, Next.js 16 / Turbopack). Playwright-equivalent
browser automation (Claude Browser MCP) was used for all UI-driven steps; direct `fetch()` calls
(from the page's own origin, so equivalent to `curl`/API calls) were used for server-side bypass
checks; Supabase MCP (`execute_sql`) and a temporary Prisma-based scratchpad script were used for DB
verification and test-data seed/cleanup. No application source file, schema, migration, or script
was modified — see VERIFY at the end.

Legend: **Pass** / **Fail** / **Partial**

---

## Part 1 — Navbar/Footer cross-cutting checks

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| Scroll-driven solid transition — Home | Transparent (`bg-brand-light/0`) at scrollY 0, solid (`bg-brand-light`) after scrolling past threshold, reverts on scroll-back | Confirmed via `header.className` before/after a dispatched `scroll` event | Pass |
| Same, on About | Same | Confirmed identically | Pass |
| Same, on Membership | Same | Confirmed identically | Pass |
| Same, on Café & Bar | Same | Confirmed identically | Pass |
| `/book` renders permanently solid, no scroll listener | Header stays `bg-brand-light` regardless of scroll position | Scrolled to 0 and dispatched `scroll` — header stayed solid (proves no listener re-adds transparency) | Pass |
| `/news` renders permanently solid, no scroll listener | Same | Same result | Pass |
| Mobile hamburger icon follows `headerSolid` | `text-accent-light` when unscrolled-over-hero, `text-brand-dark` when solid | Home (unscrolled): `text-accent-light`. `/news` (forced solid): `text-brand-dark`. | Pass |

**Note:** all hamburger/scroll checks were done via `header.className` / `button.className` DOM inspection rather than screenshots, per the project's own documented Browser-pane quirk (compositing doesn't reliably reflect in screenshots in this environment).

---

## Part 2 — Home

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| Stat banner values | "3 Sports", "9 Courts & Simulators" | Confirmed via page text: `"3\n\nSPORTS"` and `"9\n\nCOURTS & SIMULATORS"` | Pass |
| 5 Facilities tile images resolve | No broken `src`/404 | All 5 (`tennis-courts.jpg`, `pickleball-courts.jpg`, `golf-simulator.jpg`, `cafe-bar.jpg`, `speakeasy-lounge.jpg`) return `200 image/jpeg`. Note: all 5 are byte-identical (160,501 bytes each) — expected, matches PROGRESS.md's documented "local placeholder copies pending real photography," not a bug. | Pass |

---

## Part 3 — Book Now wizard, functional (all 5 resource types)

Each resource type was driven through the real 5-step wizard (SPORT → COURT → DATE & TIME →
ADD-ONS → SUMMARY) as an anonymous user. Displayed prices were read from the rendered page at each
step, not computed in this report. All runs stopped at/after the real PayMongo checkout page — see
Part 3 note on rigor below.

| Resource type | Duration tested | Price shown at Review | Expected (PROJECT_CONTEXT.md) | Status |
|---|---|---|---|---|
| Tennis Court | 60 min, 5 guests | ₱1,500.00 (₱750 + 5×₱150) | ₱750/hr + guest fee | Pass |
| Pickleball Court | 60 min, ball boy + coaching 2-pax | ₱2,000.00 (₱650 + ₱150 + ₱1,200) | ₱650/hr | Pass |
| Tennis Simulator | 30 min | ₱450.00 | ₱450 | Pass |
| Pickleball Simulator | 60 min | ₱800.00 | ₱800 | Pass |
| Golf Simulator | 60 min + coaching | ₱2,150.00 (₱1,150 + ₱1,000) | ₱1,150 | Pass |

Duration-tier and slot-granularity checks (also confirmed live in the wizard):
- Court types offer 60/120/180/240-minute options (Tennis Court, Pickleball Court). Pass.
- Tennis/Pickleball Simulator offer 15/30/60-minute options, 15-minute slot granularity. Pass.
- Golf Simulator offers **only 60/90-minute options** — the 30-minute tier is correctly absent
  from the non-member duration selector (member-only tier, per PROJECT_CONTEXT.md). Pass.

**Booking-hold creation (DB-level check — `customerId: null`, `status: pending_payment`):**
Confirmed directly via `bookings` table for 3 of the 5 runs (Tennis Court, Pickleball Court, Tennis
Simulator — one representative of each resource *category*, since court and simulator go through
the identical `POST /api/bookings` code path). All 3 showed `customer_id: null`,
`status: 'pending_payment'`, and `total_amount_centavos` matching the displayed price exactly. Not
re-run for Pickleball Simulator / Golf Simulator to avoid unnecessary extra test rows — their
pricing was still confirmed live in the UI (table above). Pass (scoped as described).

**PayMongo redirect:** Two of the runs (Tennis Court guest-fee scenario, and the anonymous
re-pricing check below) were carried through to a real PayMongo hosted checkout page
(`https://checkout.paymongo.com/...`) showing the correct total. Stopped there per scope — not
filled out or submitted. Flagged as Arjay's manual step.

---

## Part 4 — Add-ons, guest fee, business hours

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| Coaching, court, 1-pax | ₱800 (non-member) | ₱800.00 shown | Pass |
| Coaching, court, 2-pax | ₱1,200 (non-member) | ₱1,200.00 shown | Pass |
| Coaching, non-member tennis/pickleball sim | Not offered (no rate row) | Add-Ons step showed **no** Coaching option at all for non-member Tennis Simulator (confirmed empty Add-Ons step); DB has no `add_on_pricing_rules` row for either sim at `non_member` tier | Pass |
| Coaching, non-member golf sim | Offered, ₱1,000 | ₱1,000.00 shown, selectable | Pass |
| Ball Boy, court bookings | Offered, ₱150 | ₱150.00 shown on Tennis/Pickleball Court | Pass |
| Ball Boy, simulator bookings | Absent | Confirmed absent on Tennis Sim, Pickleball Sim, Golf Sim Add-Ons steps (no `ball_boy` rows exist for simulator resource types in `add_on_pricing_rules`) | Pass |
| Guest fee: non-member Tennis Court, 5 guests | Total = ₱750 + 5×₱150 = ₱1,500, single Payment record, booker not charged own fee | Booking created with `guest_count: 5`, `total_amount_centavos: 150000`. Carried to real checkout — single `payments` row created (`amount_centavos: 150000`, `status: 'pending'`). Confirmed via DB. | Pass |
| Business hours — UI slot generation | No slots before 6:00 AM or after 10:00 PM start | Confirmed: earliest slot generated is `6:00 AM`, latest is `10:00 PM`, across court (60-min) and simulator (15/30-min) granularities | Pass |
| Business hours — 11am–12pm boundary | A booking spanning 11:00 AM–12:00 PM is allowed (label-only split, no restriction) | Selected 11:00 AM start / 60-min duration for Tennis Court — accepted with no warning, booking created successfully | Pass |
| Business hours — bypass attempt (before open) | `POST /api/bookings` with `startTime` 5:00 AM → 400 | `{"error":"Bookings must start and end between 6:00 AM and 10:00 PM"}`, status 400 | Pass |
| Business hours — bypass attempt (after close) | `POST /api/bookings` with a 9:30 PM start (60-min, ends 10:30 PM) → 400 | Same error, status 400 | Pass |
| Anonymous re-pricing security check (direct API) | `PATCH /api/bookings/[id]` with a real active member's exact name/email/phone must still price non-member | Seeded a temporary `Customer` + active `Membership` (see Test Data section) with a distinct name/email/phone. Anonymous hold created (₱750, tennis court). Direct `PATCH` with the exact matching name/email/phone returned `{"isMember":false,"totalAmountCentavos":75000}` — still non-member rate. DB confirmed `customer_id` correctly resolved to the real member's `Customer` row, but `total_amount_centavos` stayed 75000 (non-member), not 65000 (member). | Pass |
| Anonymous re-pricing security check (wizard Payment-page form) | Same, via the actual UI form | Filled Name/Phone/Email with the same real member's exact details on a fresh Pickleball Court booking and clicked **Pay Now**. Review/Payment step continued to show ₱650.00 (non-member rate, not ₱550 member rate) and proceeded straight to a real PayMongo checkout at ₱650.00 — confirms the UI path also never grants member pricing. | Pass |

**Test data note:** the anonymous re-pricing check required an existing active member to attempt
impersonating. Since the DB had zero `Customer`/`Membership` rows at the start of this pass (and
creating one via the real paid-activation flow is out of scope — see SCOPE), one `Customer` +
`Membership` row was seeded directly via a temporary Prisma script (not `scripts/reset-*` — a
one-off file in the session scratchpad directory, not committed to the repo) for this check only,
and deleted at the end of the pass (see Cleanup section).

---

## Part 5 — Double-booking + hold expiry

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| Two overlapping holds, same resource/time | First `201`, second `409 Slot unavailable` | First booking: `201`. Second (identical resource+time): `409 {"error":"Slot unavailable"}` | Pass |
| `booking_no_overlap` exclusion constraint present | Constraint exists in `pg_constraint` | `EXCLUDE USING gist (resource_id WITH =, tsrange(start_time, end_time) WITH &&) WHERE (status <> 'cancelled')` — confirmed present and correctly defined | Pass |
| Hold expiry — availability + rebooking | After a hold's `createdAt` is older than `BOOKING_HOLD_MINUTES` (10 min default), `GET /api/availability` shows the slot free, and a new booking for that exact slot succeeds | Backdated a hold's `createdAt` by 15 minutes. `GET /api/availability` returned `{"busy":[]}` for that slot. A new `POST /api/bookings` for the identical resource/time succeeded (`201`). The original stale hold was confirmed flipped to `status: 'cancelled'` by the new booking's expire-on-write step. | Pass |

---

## Part 6 — Announcement gate + Café & Bar

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| `/book` announcement gate reflects live published `Bulletin` rows | Not hardcoded | Gate showed exactly the 3 most-recently-published, non-expired bulletins (`General`, `Community`, `Tournament`), matching `GET /api/bulletin/gate-notices`'s `take: 3` + `orderBy publishedAt desc` + not-expired filter. Confirmed against direct DB query of `bulletins`. Two other valid (non-expired) bulletins exist but aren't shown, which is the intended `take: 3` limit, not a bug. | Pass |
| Café/Bar toggle — `aria-pressed` + active class | Swaps on click | Initial: Café `aria-pressed="true"` (`bg-accent-primary`), Bar `false`. After clicking Bar: Café `false`, Bar `true` with `accent-teal` class (distinct color per CLAUDE.md's documented `accent-teal` placement decision). | Pass |

---

## Part 7 — Membership

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| Tier card pricing/credit breakdown | 3-month ₱5,500 (₱2,000+₱3,500); 6-month ₱12,500 (₱6,000+₱6,500); 12-month ₱22,500 (₱10,500+₱12,000) | All three confirmed exactly via rendered page text | Pass |
| Valid application — `arjayrafaelical@gmail.com`, 3-month | Creates/matches `Customer` by email, creates `MembershipApplication` (`pending`), **no** `Membership` row | `201`, application `status: "pending"`. DB confirmed `Customer` created and `MembershipApplication.status = 'pending'`, tier `three_month`, no `Membership` row for that customer. | Pass |
| Valid application — `arjayical22@gmail.com`, 6-month | Same | `201`, `pending`, tier `six_month`, no `Membership` row | Pass |
| Validation — missing required field (address) | 400, no `Customer` created | `{"error":"Address is required"}`, 400. No `customers` row created for the disposable test email. | Pass |
| Validation — invalid file type on gov ID | 400, no `Customer` created | `{"error":"Government ID (front) must be a JPEG or PNG image"}`, 400 (uploaded a `text/plain` file for `govIdFront`) | Pass |
| Validation — missing gov-ID file entirely | 400, no `Customer` created | `{"error":"Selfie with ID is required"}`, 400 | Pass |
| Duplicate applicant — re-submit `arjayrafaelical@gmail.com` | Resolves to the same existing `Customer`, not a duplicate | Per SCOPE, deleted the prior pending `MembershipApplication` row for that email first, then re-submitted with a different tier (`twelve_month`). New application created successfully; `customers` table confirmed exactly **one** row for `arjayrafaelical@gmail.com`, with the same `id` as before the deletion/resubmission. | Pass |
| Gov-ID images not exposed in customer-facing UI | Not present anywhere in `/account` | Code review: `govId*` fields/URLs appear only in the create API route, the public application *form* (write-only file inputs, never a stored URL rendered back), and the admin-only `/admin/(protected)/memberships/[id]` detail page. No reference anywhere under `src/app/account` or its components. (No live activated member existed to click through `/account` itself — see "Not Tested" section.) | Pass (code-review-based) |

**Test-data / email-reuse note:** `arjayrafaelical@gmail.com` was used twice — once for the initial
valid-application test, and a second time for the duplicate-applicant test after its prior
`MembershipApplication` row was deleted (per SCOPE's explicit allowance for reusing one of the two
permitted real emails after a scoped delete). No more than 2 distinct real emails were used at any
point, and both uses are logged here.

---

## Part 8 — News

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| All 7 filter pills present and URL-driven | `?category=` | All 7 pills rendered (`All` + 6 categories). Clicking "Tournament" set `location.search` to `?category=Tournament`, highlighted the Tournament pill, and filtered the grid to exactly the 1 Tournament-category card. | Pass |
| Invalid/missing category param falls back to "All" silently | No error, "All" active | Navigated directly to `/news?category=NotARealCategory` — "All" pill shown active, all 5 (unexpired) bulletins rendered, no console error | Pass |
| Zero-results empty state | Renders for a category with no published bulletins | `/news?category=FacilityMaintenance` — the only `FacilityMaintenance` bulletin is expired (`expires_at` in the past), so this category naturally has zero live results. Empty-state message *"No announcements in this category yet."* rendered correctly, 0 cards. | Pass |

**Tooling note:** early attempts to click these pills via a synthetic `element.click()` call (and
once via `computer` click before a viewport had been established) silently did nothing — no URL
change, no state change, no console error. This was tracked down to the Browser pane reporting a
`0×0` viewport at that point in the session (a `read_page` call showed `Viewport: 0x0`), not an
application bug — after using `resize_window` to force a real viewport and re-fetching a fresh
element reference via `find`, a real (trusted) click worked correctly and the app behaved exactly
as expected in the table above. Documented here in case it recurs for a future session — it is a
Browser-tool/environment quirk (consistent with the project's already-documented "Browser pane
doesn't composite frames" issue in `PROGRESS.md`), not a defect in `NewsGrid.tsx`.

---

## Bugs found (not fixed in this pass)

### 1. `/book`'s announcement-gate "Sign in" text is a dead placeholder, not a real link

- **File:** [src/components/booking/AnnouncementGate.tsx:64-71](src/components/booking/AnnouncementGate.tsx)
- **Discrepancy:** The gate reads *"Already a member? **Sign in** for member rates and priority
  booking."* The "Sign in" text is styled to look like a link (underlined, accent color) but is a
  plain `<span>`, not an `<a>`/`next/link`. Clicking it does nothing. The inline comment above it
  still says `{/* Placeholder — link to https://winstonsportsclub.web.app/auth once member auth is
  live */}` — but member auth (`/login`) has been fully live since 2026-08-22/23 per CLAUDE.md's
  Customer & auth model section. This is stale placeholder code that was never wired up once real
  auth shipped.
- **Fix direction:** Replace the `<span>` with a `next/link` `<Link href="/login">` (or similar),
  removing the now-inaccurate placeholder comment.
- **Impact:** Low-severity UX gap — a member landing on `/book` anonymously has no working way to
  sign in from the gate itself (they'd have to use the Navbar's own Sign In link instead, which
  does work).

### 2. `SportStep.tsx`'s "View Pricing" modal uses its own hardcoded pricing tables, separate from the DB-driven `PricingRule` data used everywhere else in the wizard

- **File:** [src/components/booking/steps/SportStep.tsx:48-97](src/components/booking/steps/SportStep.tsx)
- **Discrepancy:** `NON_MEMBER_PRICING`/`MEMBER_PRICING` are hardcoded `Record<string, PricingInfo>`
  literals baked into this component, shown in the Step 1 "View Pricing" popup. Every other price
  shown later in the same wizard (Steps 3-5, `BookingForm.tsx`) is computed live from
  `resourceType.pricing`, which comes from `GET /api/resources` reading the actual `PricingRule`
  table — the same DB-driven source the admin panel's Pricing/Add-on CRUD writes to (per CLAUDE.md's
  "Pricing model" architecture decision, prices are explicitly meant to be admin-editable with no
  code deploy). Today the two sources happen to agree (verified in Part 3 above), but if an admin
  edits a `PricingRule` row via `/admin/resources`, this Step 1 popup will silently continue showing
  the old hardcoded number while the rest of the wizard shows the new live price — a real
  discrepancy a customer could see within a single booking session.
- **Fix direction:** Derive the "View Pricing" modal's tiers from `resourceTypes[].pricing` (already
  fetched and passed into `BookingForm`/`SportStep`) instead of the separate hardcoded tables, the
  same way `getDurationOptions`/`estimateCentavos` already do.
- **Impact:** Medium — not exploitable (the actual booking price is always computed server-side from
  the real `PricingRule`), but it's a real "lying UI" risk the moment pricing is edited via the admin
  panel, which the architecture explicitly designed for.

No other functional discrepancies were found — every pricing/business-rule/security scenario in
Parts 3-8 above returned exactly the expected result.

---

## Intentionally NOT tested in this pass

- **PayMongo checkout completion** (entering card/GCash details and completing a real payment) — two
  flows were carried up to the real PayMongo hosted checkout page and stopped there per SCOPE. Owned
  by Arjay as a manual step.
- **Webhook delivery confirmation** (`payment.paid` → booking `confirmed`) — requires either a real
  completed payment or a replayed webhook payload; out of scope for a no-payment pass.
- **Visual/pixel-level review** — this pass checked DOM state (classes, `aria-*`, text content,
  response bodies), not rendered appearance. Screenshots were attempted but are known-unreliable in
  this Browser-pane environment (see `PROGRESS.md`'s documented compositing issue); a couple were
  taken opportunistically during the News tooling investigation above and looked visually correct,
  but no systematic visual pass was done.
- **Admin Check-In real-camera scan** — hardware-dependent, explicitly out of scope per the prompt.
- **`/account` rendering for a real activated member** — no member had completed the paid
  activation flow (webhook-confirmed `MembershipPayment` → `Membership`) either before or during this
  pass, and creating one is out of scope (requires real PayMongo payment). The gov-ID-exposure check
  in Part 7 was therefore done by code review rather than a live click-through — see that row's
  notes.
- **Admin panel functional walkthrough beyond the login-gate smoke check** (Bookings/Memberships/
  Resources/Bulletin/Dashboard CRUD) — not in scope per the prompt's Parts 1-8; only a regression
  smoke check (unauthenticated `/admin` correctly redirects to `/admin/login`) was done, per the
  VERIFY step's "admin panel loads" instruction.

---

## Test data created and cleanup

All test data created during this pass was deleted at the end, via a temporary Prisma script (not
committed — lived only in the session scratchpad directory, deleted along with the session). Nothing
was left behind for this pass beyond the two real PayMongo checkout sessions already noted (those
exist only on PayMongo's side, in test mode, and expire on their own — no DB row was left pointing
at them).

Deleted at cleanup: 7 test `Booking` rows (and their `BookingAddOn`/`Payment` children), 4 test
`Customer` rows (`qa.test.guest.20260902@example.com`, the seeded `real.member.qa.test@example.com`,
`arjayrafaelical@gmail.com`, `arjayical22@gmail.com`), 1 seeded test `Membership` row, and 2
`MembershipApplication` rows (plus their 6 uploaded gov-ID Storage objects).

**Deliberately left untouched:** one pre-existing stale `pending_payment` booking
(`cmtkahpuv0001w47wna6db7xy`, resource `Court 1`/tennis, dated 2026-09-12, `created_at`
2026-09-02) that already existed in the DB **before** this pass started — it was not created by this
QA session, so per SCOPE it was left exactly as found rather than assumed to be mine to delete. It
is old enough that `booking_no_overlap`/expire-on-write will treat it as free for any new booking
attempt on that slot regardless.

Final DB counts (matches the exact snapshot taken before this pass began): `customers: 0`,
`bookings: 1` (the pre-existing one above), `memberships: 0`, `membership_applications: 0`,
`payments: 0`, `bulletins: 6` (unchanged), `admin_users: 2` (unchanged).

---

## CHECKPOINT

- No application source file, schema, migration, or script was modified — confirmed via `git status`
  / `git diff` (clean, zero changes) immediately before writing this report.
- Only `TEST_FINDINGS_2026-09-03.md` (this file) and `PROGRESS.md` are new/changed.
- Exactly 2 real emails were used for membership testing (`arjayrafaelical@gmail.com`,
  `arjayical22@gmail.com`), with the one reuse (duplicate-applicant test) explicitly logged in Part 7.
- All test Booking/Customer/Membership/MembershipApplication data created during this pass has been
  cleaned up. Nothing was deliberately left behind in the DB — the two open PayMongo checkout
  sessions exist only on PayMongo's side (test mode) and require no DB row or further action.

## VERIFY

- `git status`/`git diff`: clean before this file was written; after writing, the only changes are
  this file and `PROGRESS.md`.
- `booking_no_overlap` exclusion constraint: confirmed present in `pg_constraint`
  (`EXCLUDE USING gist (resource_id WITH =, tsrange(start_time, end_time) WITH &&) WHERE (status <>
  'cancelled')`) — unchanged by this pass's booking activity, as expected.
- DB row counts after cleanup match the pre-pass snapshot exactly (see Test data section above).
- Regression spot-checks: `/admin` (unauthenticated) correctly redirects to `/admin/login`, which
  renders correctly; `/login` (member) renders correctly. No real activated member existed before or
  after this pass to re-verify `/account` rendering against (none existed at the start either) — flagged
  under "Intentionally NOT tested."
