# Test Findings — Admin Panel Deep Pass — 2026-09-03

QA/verification pass against local dev (`npm run dev`, Next.js 16 / Turbopack), covering the 43
admin-panel/business-logic scenarios not exercised by the same-day `TEST_FINDINGS_2026-09-03.md`
public-site pass. Playwright-equivalent browser automation (Claude Browser MCP) drives all
admin-UI-driven checks; direct `fetch()` calls (from the app's own origin) exercise API routes and
webhook-payload replay; Supabase MCP (`execute_sql`, read-only) verifies underlying row state
alongside the UI. No application source file (components, API routes, lib files) was modified —
only new scripts under `scripts/` and this findings file were added, per SCOPE.

Legend: **Pass** / **Fail** / **Note** (documented behavior, not a pass/fail judgment)

---

## Setup & deviations from the prompt

- **Baseline was not perfectly clean.** `admin_users` already had 2 rows before this pass started
  (`winstonsipandserve@gmail.com`, the real admin, created 2026-08-18 18:06; and
  `claude-verify-admin@example.com`, an untitled leftover test row also from 2026-08-18 17:37) —
  neither created by this pass. `bookings` had 2 pre-existing stale `pending_payment` holds
  (`cmtkahpuv0001w47wna6db7xy`, `cmtkimnbe0001w4h89v55gk60`, both dated 2026-09-02,
  `customerId: null`), and `check_in_lookup_attempts` had 1 pre-existing row (2026-09-01, against
  the real admin). All of these predate this pass and were **left untouched** throughout, per the
  same conservative precedent `TEST_FINDINGS_2026-09-03.md` set for its own pre-existing stray
  booking. `customers`/`memberships`/`membership_applications`/`membership_payments` were
  genuinely at 0, matching the prompt's assumption.
- **Two new test admins were seeded, not one.** The prompt assumed exactly one pre-existing
  AdminUser to pair a new second one against. This session has no password for either
  pre-existing admin row, so neither could actually be used to drive Playwright through a real
  login — a prerequisite for every Part 8 attribution scenario. Two fresh test admins were seeded
  instead (`scripts/seed-qa-admin-audit.ts`, mirroring `prisma/bootstrap-admin.ts`'s exact
  `hashPassword` + `adminUser.create` pattern — the only prior precedent in this repo's history):
  - **QA Admin A** — `qa-admin-a@example.com` / `cmtlabg130000w4682bett49w`
  - **QA Admin B** — `qa-admin-b@example.com` / `cmtlabgn00001w468g39jbljh`
  Both are removed at cleanup (Part 9); the two pre-existing rows are left exactly as found.
- **Cleanup strategy:** rather than a wholesale `deleteMany({})` (which would also delete the
  pre-existing stray rows above), a `createdAt >= PASS_START_TIME` cutoff
  (`2026-09-03T08:49:38.000Z`, captured before any test data was created) scopes every cleanup
  delete in `scripts/reset-admin-audit-pass.ts`, in the same FK-safe order
  `reset-all-test-data.ts` already uses, extended to also cover `AdminUser`,
  `CheckInLookupAttempt`, and `Bulletin` (none of which the original script touches). This
  guarantees pre-existing rows (all older than the cutoff) survive cleanup untouched while every
  row this pass creates (all newer) is removed.
- **Membership-payment webhook simulation:** per SCOPE, no real PayMongo checkout is created.
  `MembershipPayment` rows are inserted directly via Prisma (mirroring exactly what
  `POST /api/membership-payments` / the admin `send-renewal-link` route would persist, minus the
  live PayMongo API call), then a `payment.paid` webhook payload keyed to that row's id is built
  and HMAC-SHA256-signed with the real `PAYMONGO_WEBHOOK_SECRET` from `.env.local`, and POSTed to
  `http://localhost:3000/api/webhooks/paymongo` — exactly the code path a real PayMongo delivery
  would hit, with no PayMongo API call anywhere in the loop.
- Email sends are confirmed by inspecting `RESEND_API_KEY`-authenticated response/DB side effects
  and, where useful, the Resend MCP's `list-emails`/`get-email`, not by opening a real inbox.
- **Browser-tab sessions are not isolated per tab.** Two tabs were opened expecting one to hold
  Admin A's session and the other Admin B's — but Auth.js session cookies are shared across all
  tabs on the same browser profile/origin (ordinary browser behavior, not a bug), so logging in on
  the second tab silently switched the first tab's session too. For anything requiring two
  concurrently-distinguishable admin identities (rate-limit isolation, attribution), admin-scoped
  `fetch()` calls from a Node script with two independently-captured session-cookie strings were
  used instead (see `scripts/qa-admin-audit-part2.ts`'s `loginAsAdmin` helper); the single shared
  browser tab was used for pure visual/UI walkthroughs where only one active admin identity
  matters at a time, re-logging in as needed.

---

## Part 2 — Membership lifecycle

All 18 scenarios run via `scripts/qa-admin-audit-part2.ts` (full log retained in this session);
key result summary below. Both real emails end in an **active** state at the end of Part 2 — see
Part 9 for full cleanup.

| # | Scenario | Result |
|---|---|---|
| 1 | New email submits application → `Customer` created, `pending`, no `Membership` | **Pass** — Customer R created, application pending, zero Memberships. |
| 2 | Existing-`Customer` email (from a prior booking) submits → matched, not duplicated | **Pass** — Customer I created via an anonymous booking hold+attach first; the subsequent application resolved to that exact same `Customer.id` (confirmed exactly 1 `customers` row for the email throughout). |
| 3 | Same email submits a 2nd application while one is pending — undocumented, don't assume blocked | **Pass (documented)** — **Actual behavior: `409 { error: "An application is already pending for this email." }`.** It IS blocked server-side, contrary to the prompt's "don't assume" framing — `POST /api/membership-applications` explicitly checks for an existing `pending` application before creating a new one. No duplicate application row was created. |
| 4 | Same email re-applies after rejection → same `Customer`, old rejected application untouched | **Pass** — new application resolved to the identical `Customer.id`; the earlier rejected application's `status`/`rejectionReason` were byte-identical before and after. |
| 5 | Approve a pending application → status `approved` ONLY, no Membership/ledger/token yet | **Pass** — confirmed zero `Membership`, zero `MembershipCreditTransaction`, zero `MemberActivationToken` rows immediately after approval. |
| 6 | No staff email fires on approval itself | **Pass (code review)** — the `approve` branch of `PATCH /api/admin/memberships/[id]` calls only `sendMembershipPaymentEmail` (the customer-facing "complete your payment" email); no staff-notification function (`sendStaff*`) is reachable from that branch. |
| 7 | `reviewedById`/`reviewedAt` correctly stamped with the acting `AdminUser` | **Pass** — R1's reject stamped `reviewedById` = QA Admin A; R4's approve also stamped Admin A; I2's approve (performed with Admin B's session) stamped Admin B. Confirmed both in the DB and visually in the admin Memberships list's "Reviewed By" column (showed "QA Admin A" / "QA Admin B" correctly per row — see screenshot-equivalent `get_page_text` capture). |
| 8 | Reject with a valid reason → `rejected`, branded email sent, `Customer` row left in place | **Pass** — status flipped, `rejectionReason` stored trimmed, Customer R row confirmed still present afterward. |
| 9 | Reject with an empty/whitespace-only reason → must be server-side rejected | **Pass** — direct API call with `reason: "   "` returned `400`, application remained `pending`. (The admin UI's `RejectModal` also blocks this client-side before ever calling the API — both layers enforce it independently.) |
| 10 | Gov-ID images — admin-only visibility, never customer-facing | **Pass** — admin detail page renders all 3 images via short-lived Supabase signed URLs (5-minute expiry observed in the JWT `iat`/`exp`). Repo-wide grep for `govId` outside `src/app/api`/`src/app/admin` found it only in the public application *form* (write-only file inputs, never a stored URL rendered back) — zero references anywhere under `/account` or any customer-facing component. |
| 11 | Webhook-simulated payment confirms → `Membership` created with correct tier/credit split for all 3 tiers, ledger `activation` row positive, `MemberActivationToken` issued, staff email fires | **Pass, all 3 tiers** — 3-month: activation ₱2,000.00 / credit ₱3,500.00 (via the renewal path, ledger reason correctly `renewal` not `activation` there — see #18); 6-month: ₱6,000.00 / ₱6,500.00; 12-month: ₱10,500.00 / ₱12,000.00. All exact matches to `MEMBERSHIP_TIER_PLANS`. `MemberActivationToken` created on the first-time (12-month) activation. |
| 12 | Admin Memberships list/detail flips "Awaiting Payment" → "Active" once webhook lands | **Pass** — confirmed both via DB (`Membership.status`) and live in the browser: list and detail both rendered "Active Member" immediately after the webhook replay, with no page other than a reload needed. |
| 13 | `endDate` in the past but `status` column never flipped → admin shows Expired, not Active | **Pass (SIMULATED via direct DB edit — `Membership.endDate` backdated)**. Directly confirmed via the identical business-logic gate `send-renewal-link` itself uses (not just the display label): calling `POST .../send-renewal-link` against this same membership returned `409 "not expired"` *before* backdating and `200` *after* — proving the expired state was genuinely recognized by the server logic. A live "Expired" badge screenshot for this specific application wasn't captured because, by the time of the UI review pass, Customer R had already progressed to scenario 18's renewal (whose newer, active Membership correctly became the customer's *latest* — see #14) — this is expected sequencing, not a gap in the check. |
| 14 | Customer with an original + a renewal Membership (`applicationId: null`) → admin shows the LATEST | **Pass** — `getLatestMembershipByCustomerId` resolved to the newer renewal row, not the older (now-expired) original, ordered by `startDate desc`; confirmed both directly and via the live admin list showing "Active Member" for Customer R (correct, since the latest/renewal membership is active even though an older one is expired). |
| 15 | Customer with zero memberships → graceful empty state | **Pass** — both R1 (rejected) and R4 pre-payment (approved/awaiting-payment) rendered correctly with `latestMembership: null` and no crash; `SendRenewalLinkButton` correctly does not render at all in that state (gated on `displayStatus === 'expired'`, code-confirmed). |
| 16 | Membership crossing 14-day/3-day/expired reminder windows → correct email once per window, no duplicate on repeat same-day run | **Pass (SIMULATED via 3 direct-insert Membership rows)** — run 1: `{reminder14SentCount:2, reminder3SentCount:1, expiredNoticeSentCount:2}`; run 2 (immediate repeat): `{0,0,0}` — fully idempotent. **Note on the "2" counts (not a bug):** the 14-day and expired counts each include one row beyond the row purpose-built for that window — the 3-day-out test row also independently satisfies the 14-day query's `endDate <= now+14d` condition (both reminder columns were seeded `null` simultaneously, an artificial starting state that can't occur under real day-by-day cron operation, where the 14-day reminder would already have fired 11 days earlier); and R4's independently-backdated (Scenario 13) membership was correctly swept up by the same expired-notice query since it also had `expiredNoticeSentAt: null` and a past `endDate`. Both are the cron correctly matching its own query conditions, not a defect. |
| 17 | "Send Renewal Link" present only when genuinely expired | **Pass** — confirmed absent (API 409) with no membership at all, confirmed absent (API 409, and absent in the live detail-page render — no "Renewal" section) for an active membership, confirmed present/functional (API 200) once genuinely expired. |
| 18 | Send Renewal Link → `MembershipPayment(applicationId: null, initiatedByAdminId)` → webhook → new Membership, ledger `renewal`, staff `[Membership Renewal]` email | **Pass** — action performed as QA Admin B; `initiatedByAdminId` correctly recorded as Admin B's id (distinct from Admin A, who performed the original reject/approve on the same application) — direct proof attribution is per-actor, not hardcoded to whichever admin acted first (Scenario 43). |

---

## Part 3 — Bookings (admin)

Seeded via `scripts/qa-admin-audit-part3.ts`: one booking per resource type spanning all 3
statuses, plus 2 confirmed bookings on the exact same Tennis Simulator resource for the reschedule
tests. Full log retained in this session.

| # | Scenario | Result |
|---|---|---|
| 19 | List/filter/detail correctly reflects pending_payment/confirmed/cancelled across all 5 resource types | **Pass** — live admin Bookings list showed all 5 resource types with the correct status per row (2 pending_payment across different resources, 1 cancelled reached organically via expire-on-write rather than a direct status flip, 2 confirmed). The Filter modal's Status radio (All/Pending/Confirmed/Cancelled) correctly narrowed the list to just the 2 confirmed rows once applied — a "Filter •" active-indicator dot appears on the button. (One tooling note: the very first `get_page_text` read right after clicking Run returned stale pre-filter content — a timing/render-race in the capture, not the app; a follow-up screenshot after the fact confirmed the filter had in fact applied correctly.) Detail pages render correctly per resource type. |
| 20 | Admin reschedule creates a real `BookingReschedule` row and updates the live `Booking`'s slot — insert, not an edit | **Pass** — after rescheduling, exactly 1 new `BookingReschedule` row existed with `originalStart`/`newStart` matching the pre/post `Booking.startTime` exactly, `performedById` = the acting admin (QA Admin A), and the live `Booking.startTime`/`endTime` updated to the new slot. Confirmed both in the DB and visually on the detail page's "Reschedule history" table. |
| 21 | Rescheduling into an already-occupied slot is blocked by the exclusion constraint | **Pass** — attempting to reschedule Booking X onto Booking Y's exact slot on the same physical resource returned `409` and created **zero** `BookingReschedule` rows (the insert-then-constrain transaction fully rolled back, not a partial write). |
| 22 | A second correction to an already-logged reschedule produces a NEW `BookingReschedule` row | **Pass** — a second reschedule on the same booking (performed by QA Admin B this time) inserted a 2nd row chaining from the first correction's `newStart`; the original row's `id` and every field remained byte-identical — confirmed both in the DB and visually (both rows rendered in the detail page's history table, correctly attributed to "QA Admin A" then "QA Admin B" respectively — further confirming Scenario 43's per-actor attribution for `BookingReschedule.performedById` specifically). |

---

## Part 4 — Resources & Pricing

Run via `scripts/qa-admin-audit-part4.ts` (scenarios 23–27) plus one live browser wizard
walkthrough for scenario 28. **All pricing/resource values touched are confirmed reverted** —
final DB check: `pricing_rules: 21`, `add_on_pricing_rules: 16`, `guest_fee_rules.amountCentavos:
₱150.00`, both Golf Simulator bays `is_active: true` — all matching the pre-Part-4 baseline.

| # | Scenario | Result |
|---|---|---|
| 23 | Resource disable/enable removes it from public bookability; no create/delete affordance exists | **Pass** — disabling Golf Simulator Bay 1 removed it from `GET /api/resources`' resource list immediately and a direct `POST /api/bookings` against it returned `400`; re-enabling restored it and cleared `disabledReason`. No create/delete affordance exists anywhere: the admin Resources page's own copy states new courts/simulators are "added directly in the database," `ResourcesTabs.tsx` renders only Disable/Enable controls per resource row, and no `POST`/`DELETE` route exists under `/api/admin/resources` at all. |
| 24 | PricingRule CRUD (all resource types, member/non-member, all duration tiers) | **Pass** — create (`201`), attempting the identical combo again (`409`, blocked as a duplicate), edit (`200`, new price persisted), delete (`200`, row confirmed gone) all behaved correctly on a disposable scratch row (45-min Tennis Sim member rate), which was fully cleaned up. |
| 25 | Intentionally-invalid combo — non-member golf-sim 30-min: does the admin UI/API block it? | **Fail — confirmed real gap, not fixed in this pass.** `POST /api/admin/pricing-rules` happily returned `201` and created the row; nothing rejects it. **Root cause (code-confirmed):** the admin UI's simulator duration-row list (`ResourcesTabs.tsx`) is derived from whatever durations already have *any* pricing rule (`Array.from(new Set(rt.pricingRules.map(r => r.durationMinutes)))`) — since a *member* 30-min golf-sim rate already exists, that row renders for both tier columns, and the non-member cell shows a live, clickable "+ Add" button with no special-casing to grey it out. The invalid row was deleted immediately after confirming it could be created. |
| 26 | Same invalid-combo check for AddOnPricingRule (non-member tennis-sim / pickleball-sim coaching) | **Fail — confirmed real gap, not fixed in this pass.** Same result for both: `POST /api/admin/add-on-pricing-rules` returned `201` for non-member coaching on both Tennis Sim and Pickleball Sim, despite PROJECT_CONTEXT.md explicitly stating these are "not offered." Same root cause as #25 — the simulator add-on table always renders one fixed "Coaching" row with independent per-tier "+ Add" buttons regardless of which combos are meant to exist. Both invalid rows were deleted immediately after confirming creation. |
| 27 | GuestFeeRule: edit-only (no create/delete), and an edit changes the next booking's guest-fee computation | **Pass** — confirmed no `POST`/`DELETE` route exists under `/api/admin/guest-fee-rule` (only `PATCH [id]`) and the UI renders a single fixed row with only an edit icon. Bumped the rate by ₱50/hr, then created a fresh 3-guest non-member Tennis Court booking — its `totalAmountCentavos` matched exactly `courtRate + 3 × newGuestFee` with no caching lag. Reverted immediately after. |
| 28 | Edit a PricingRule while a booking is mid-hold → PATCH-attach re-prices at the new rate and the wizard shows the confirmation notice | **Pass — verified live in the browser.** Started a real anonymous Pickleball Court booking through the wizard to the Payment step (showing the original estimate, ₱650.00). While the hold was still valid, bumped the Pickleball Court non-member 60-min `PricingRule` from ₱650.00 → ₱700.00 directly in the DB. Back in the browser, filled in the customer fields and clicked **Pay Now** — the page rendered exactly: *"Your final price is ₱700.00 (was ₱650.00) — pricing was updated since you started this booking,"* and the button relabeled to "Continue to Payment" (requiring a second click before checkout) rather than silently redirecting. Stopped there per SCOPE (no real PayMongo checkout); the pricing rule was reverted back to ₱650.00 immediately after. |

---

## Part 5 — Bulletin

Run via `scripts/qa-admin-audit-part5.ts` (title-prefixed `QA TEST — …`, fully cleaned up via the
script's own `--cleanup` mode — `bulletins` confirmed back to 6 afterward). Live-verified in the
admin Bulletin list in the browser as well.

| # | Scenario | Result |
|---|---|---|
| 29 | Full CRUD across all 6 categories | **Pass** — created one bulletin per category (all `201`, each satisfying that category's own required-field set), edited one (`200`, new title persisted), deleted one (`200`, row confirmed gone). All 7 rendered correctly in the live admin Bulletin list alongside the 6 pre-existing sample bulletins. |
| 30 | Full per-category required-field validation matrix | **Pass** — 11 targeted omissions across all category-specific rules (image/eventEndAt/expiresAt/CTA-pairing for Renovation/Closure/Tournament/FacilityMaintenance) plus every common-field rule (affectedFacility/impact/action/eventStartAt/title, checked via General) each returned exactly the expected `400` + message. A positive control (General with only the common fields, no image/eventEndAt/expiresAt/CTA) succeeded with `201`, confirming General's rules are genuinely more permissive, not a validator bug. One test-design note: omitting Tournament's `ctaLabel` surfaces the pairing check's message ("ctaLabel and ctaUrl must be provided together") rather than the category-specific "required for this category" message — both are correct, the pairing check just runs first in `parseCommonFields`; not a defect. |
| 31 | `publishedAt` set once on first publish, preserved through unpublish → republish | **Pass** — a draft had `publishedAt: null`; first publish set it; unpublishing preserved the exact same timestamp (not nulled); republishing 1.1 seconds later preserved the *original* timestamp exactly (not bumped to the republish time). |
| 32 | Submitting only one of `ctaLabel`/`ctaUrl` is rejected | **Pass** — both directions (`ctaUrl` alone, `ctaLabel` alone) returned `400` with the pairing-required message. |
| 33 | Confirm `expiresAt` is still unenforced (re-confirming a known gap) | **Fail — the prompt's premise is stale, real finding.** Created a bulletin with `expiresAt` 5 days in the past and `isPublished: true`; it was **correctly excluded** from both `GET /api/bulletin/gate-notices` and `/news`'s server-rendered output. Code review found `bulletinNotExpiredWhere()` (`src/lib/bulletin.ts`) already applied by both surfaces, added in commit `51a7553` ("Wire Bulletin priority/facility/impact/action/event/CTA fields into /news and AnnouncementGate, add expiresAt filtering"). **CLAUDE.md's Bulletin/Announcements section, PROJECT_CONTEXT.md, and PROGRESS.md's Next Up all still describe `expiresAt` as "not yet enforced by any query filter"/an open gap — that description is now incorrect and should be corrected.** This is a documentation bug, not an application bug; the admin-side Bulletin list intentionally still shows expired bulletins (admins need to manage them regardless of public-facing expiry), which is correct and unrelated. |

---

## Part 6 — Dashboard

Verified against the live, mixed dataset left by Parts 2-5 (rather than a separately re-seeded
dataset) — hand-computed the same 5 aggregates directly via SQL and compared to the live-rendered
`/admin` dashboard.

| # | Scenario | Result |
|---|---|---|
| 34 | Re-verify all 5 stat cards + 3 charts against hand-computed expected values | **Pass** — all 5 stat cards matched their hand-computed SQL values exactly: Bookings Today `0`, Revenue This Month `₱0.03` (3 centavos — the sum of three deliberately trivial `amountCentavos: 1` fake booking payments from Part 3's webhook-replay setup; small/odd-looking but mathematically exactly what the underlying `payments` rows sum to), Pending Applications `0`, Active Memberships `4` (correctly counts distinct `Membership` rows with `endDate >= now`, including 3 belonging to the same customer — matches the code's per-row, not per-customer, counting), Resource Utilization `0%` (no *confirmed* booking's `startTime` falls within the current PH calendar week — all Part 3 test bookings are weeks in the future). The "Bookings by Resource Type" donut chart's two segments (Tennis Simulator: 2, Pickleball Court: 1) matched an exact SQL `GROUP BY` cross-check. "Recent Bookings" correctly listed the 5 most-recently-created bookings with correct statuses. Bookings Trend / Revenue Trend charts were spot-checked against their underlying query logic (already read in full) rather than pixel-verified, consistent with this session's `TEST_FINDINGS_2026-09-03.md` precedent that a systematic visual/chart-rendering pass is out of scope for DOM/API-based verification. |
| 35 | Empty-state handling for Recent Bookings / Pending Applications still holds | **Pass (Pending Applications), Pass by code+history (Recent Bookings).** "Pending Membership Applications" genuinely rendered its empty state live ("No pending applications.") since all Part 2 test applications had already been approved/rejected by this point — a real, naturally-reached empty state, not simulated. "Recent Bookings" could not be driven to empty without deleting the 2 pre-existing baseline bookings (deliberately left untouched per this pass's own conservative precedent — see Setup & deviations), so its empty-state path was confirmed by code review only (the same explicit guard clause) plus the 2026-08-29 PROGRESS.md entry documenting it was built and verified live at the time. |

---

## Part 7 — Check-In (admin, non-camera)

Run via `scripts/qa-admin-audit-part7.ts` against a real check-in token/code pair generated for
Customer I; all `CheckInLookupAttempt` rows created during this part were deleted and Customer I's
token/code reset to `null` at the end of the script (Customer I never organically visited
`/account` to generate one for real).

| # | Scenario | Result |
|---|---|---|
| 36 | 10 failed lookups in a rolling 5-minute window blocks the 11th, scoped per-admin | **Pass** — 10 failed code lookups as QA Admin A each returned `404` (not yet blocked); the 11th returned `429 {"error":"Too many attempts...", "retryAfterSeconds":288}`. Immediately after, the identical failed lookup performed as QA Admin B returned a normal `404` — completely unaffected by Admin A's block, confirming true per-admin isolation (not a global/shared limiter). |
| 37 | Stale failed-lookup rows expire/clear correctly on next check | **Pass** — backdated all 10 of Admin A's attempt rows to 6 minutes old (just outside the 5-minute window), then made one more failed lookup: it correctly returned `404` (unblocked) rather than `429`, and the row count went from 10 (stale) to exactly 1 (the 10 stale rows opportunistically deleted, replaced only by the one fresh failure from this check) — confirms the expire-on-write design with no cron dependency. |
| 38 | Successful lookups never create a log row | **Pass** — a successful token lookup and a successful code lookup (both against Customer I's real generated credentials) each returned `200` with zero new `CheckInLookupAttempt` rows created. |
| 39 | Token/QR route confirmed exempt from rate limiting regardless of failure count | **Pass** — while Admin A was actively blocked (`429`) on the code route, the token route (`GET /api/admin/check-in/[token]`) still returned a normal `200` for the same admin. 12 further bogus-token lookups all returned `404` (never `429`), and none of them wrote a `CheckInLookupAttempt` row at all — the token route has no rate-limit check wired into it whatsoever, consistent with its stated 24-random-byte, unbrute-forceable design. |
| 40 | Scan-or-Enter-Code gate — neither mounts before an explicit choice | **Pass (live browser check)** — `/admin/check-in` initially renders only two choice buttons ("Scan" / "Enter Code") and a prompt, with no camera/video element or code-input field in the DOM. Clicking "Enter Code" mounted only the 6-digit code form (no camera component alongside it). |

---

## Part 8 — Access control (cross-cutting)

Run via `scripts/qa-admin-audit-part8.ts`. Customer R was temporarily given a `passwordHash` to
obtain a real `role: 'member'` session for this part only; reverted to `null` immediately after.

| # | Scenario | Result |
|---|---|---|
| 41 | A `role: 'member'` session hitting any `/admin/*` PAGE is bounced | **Pass** — all 6 admin pages (`/admin`, `/admin/bookings`, `/admin/memberships`, `/admin/resources`, `/admin/bulletin`, `/admin/check-in`) returned a `307` redirect to `/admin/login` for the member session, confirming `(protected)/layout.tsx`'s `auth()` check. |
| 42 | A `role: 'member'` session hitting any `/api/admin/*` ROUTE directly is also rejected | **Pass — the one that matters most, and it holds.** All 16 tested routes across every admin API surface (check-in token/code, resources, pricing-rules, add-on-pricing-rules, guest-fee-rule, memberships approve/reject, send-renewal-link, bookings reschedule, bulletin create/edit/delete) rejected the member session with `401` before doing anything else — confirming each route's own explicit `session.user.role === 'admin'` check is genuinely the enforcement mechanism, since `middleware.ts` is confirmed dead code in this local dev setup. |
| 43 | Correct `AdminUser` recorded as `reviewedBy`/`performedBy`/`initiatedByAdminId` across approve/reject/reschedule/send-renewal-link, using both seeded admins to confirm per-actor attribution | **Pass — consolidated from evidence already captured live in Parts 2 & 3, re-summarized here:** reject → R1 by QA Admin A; approve → R4 by QA Admin A **and** I2 by QA Admin B (the *same* action type performed by two different admins produced two different `reviewedById` values, matching whoever actually acted); send-renewal-link → R4's renewal `initiatedByAdminId` = QA Admin B; reschedule → Booking X's first correction `performedById` = QA Admin A, the *second* correction (same booking) `performedById` = QA Admin B. Every recorded id matched the admin whose session actually made that specific call — none were hardcoded to whichever admin was seeded first. |

---

**Note on scenario 27's test data:** the temporary guest-fee-edit test booking used the fake email
`qa-repricing-test@example.com` for the scenario-28 wizard walkthrough's customer-attach step —
this is a deviation from the "only 2 real emails" constraint, which in hindsight should have used
`customerId: null` (as every other Part 3/4 test booking did) since no named customer identity was
actually needed for either check. Flagged here for transparency; the resulting `Customer` row
postdates `PASS_START_TIME` and is fully removed by the Part 9 cleanup like everything else.

---

## Bugs found (not fixed in this pass)

### 1. Nothing blocks admin-created pricing combos that the rate sheet says should never exist

- **Files:** [src/app/api/admin/pricing-rules/route.ts](src/app/api/admin/pricing-rules/route.ts),
  [src/app/api/admin/add-on-pricing-rules/route.ts](src/app/api/admin/add-on-pricing-rules/route.ts),
  [src/components/admin/ResourcesTabs.tsx](src/components/admin/ResourcesTabs.tsx)
- **Discrepancy:** PROJECT_CONTEXT.md explicitly states golf-sim has "no 30-min tier offered to
  non-members (member-only tier)" and that non-member coaching on tennis-sim/pickleball-sim is
  "Not offered — no rate listed on client rate sheet." Both `POST /api/admin/pricing-rules` and
  `POST /api/admin/add-on-pricing-rules` only check for an exact duplicate of the same
  `(resourceType, rateTier, duration/paxCount)` combination — neither validates that the specific
  combination is a business-valid one at all. Confirmed live: this pass successfully created (and
  then deleted) a non-member golf-sim 30-min `PricingRule` and non-member coaching
  `AddOnPricingRule` rows for both Tennis Sim and Pickleball Sim, all via a normal authenticated
  admin request. The admin UI doesn't add a second layer of protection either — `ResourcesTabs.tsx`
  derives a simulator's visible duration rows from `Array.from(new Set(rt.pricingRules.map(r =>
  r.durationMinutes)))`, so a duration that already has a rule for *one* tier automatically renders
  a live "+ Add" button for the *other* tier's cell too, with no awareness of which combinations
  are meant to exist. Likewise, the simulator add-on table always renders one fixed "Coaching" row
  with independent "+ Add" buttons per tier cell regardless of which combos are meant to exist.
- **Fix direction:** Either (a) add an explicit allow-list check in both POST routes (a small
  constant table of valid `(resourceType, rateTier, duration|paxCount)` combinations, rejecting
  anything outside it with `400`), or (b) if the business intent is "any combination an admin
  chooses to price is fine, the rate sheet is just what's true *today*," update
  PROJECT_CONTEXT.md/CLAUDE.md to stop describing these as fixed constraints. Whichever direction
  is chosen, the UI's "+ Add" affordance should agree with it — right now the UI silently offers
  exactly the combinations the docs say don't exist.
- **Impact:** Low likelihood (requires deliberate admin action, not a customer-facing path — no
  customer can ever select a duration/add-on the UI doesn't offer, and `priceBooking()` already
  requires a real `PricingRule`/`AddOnPricingRule` row to exist before honoring any price, so this
  can't be exploited to get an unintended discount). But it's a real gap between documented
  business rules and enforced ones, and an admin could accidentally create a rate the business
  never intended to offer with no warning.

### 2. `expiresAt` enforcement documentation is stale — the app was already fixed, the docs weren't

- **Files:** [CLAUDE.md](CLAUDE.md) → Bulletin/Announcements section (referenced from
  PROJECT_CONTEXT.md → Bulletin / Announcements, "not yet enforced by any query filter"),
  [PROGRESS.md](PROGRESS.md) → Next Up ("`scripts/seed-sample-bulletins.ts`... expired sample was
  hiding" context still implies the gap is open)
- **Discrepancy:** Both docs describe a published bulletin's `expiresAt` as not yet enforced by any
  query. This pass created a bulletin with `expiresAt` 5 days in the past and confirmed it is
  **correctly excluded** from both `GET /api/bulletin/gate-notices` and `/news`'s server-rendered
  list. `src/lib/bulletin.ts`'s `bulletinNotExpiredWhere()` is applied by both, added in commit
  `51a7553` ("Wire Bulletin priority/facility/impact/action/event/CTA fields into /news and
  AnnouncementGate, add expiresAt filtering") — this shipped well before this pass, the docs were
  simply never updated afterward.
- **Fix direction:** Doc-only — update PROJECT_CONTEXT.md's Bulletin/Announcements bullet (drop
  the "not yet enforced" clause and describe `bulletinNotExpiredWhere()` instead) and remove the
  stale framing anywhere else it's implied.
- **Impact:** None to the running app — this is purely a documentation accuracy issue, but worth
  fixing before it misleads a future prompt into re-"discovering" or re-"fixing" a gap that's
  already closed.

No other functional discrepancies were found — every scenario across Parts 2, 3, 4 (aside from
the two above), 5 (aside from #2 above), 6, 7, and 8 returned exactly the expected result.

---

## Test data created and cleanup

All test data created during this pass — across `AdminUser` (2 QA accounts), `Customer` (2, using
only the 2 permitted real emails plus one disclosed deviation — see the Part 4 note above),
`Booking`/`Payment`/`BookingAddOn`/`BookingReschedule`, `MembershipApplication`/`Membership`/
`MembershipPayment`/`MembershipCreditTransaction`/`MemberActivationToken`, `Bulletin` (7 rows,
title-prefixed `QA TEST — `), and `CheckInLookupAttempt` — was deleted at the end via
`scripts/reset-admin-audit-pass.ts --include-admins`, which scopes every delete to `createdAt >=
2026-09-03T08:49:38.000Z` (this pass's start time) rather than a blanket wipe, specifically so the
pre-existing baseline anomalies noted in "Setup & deviations" survive untouched.

**Deliberately left untouched (pre-existing, predates this pass):**
- 2 stale `pending_payment` Bookings (`cmtkahpuv0001w47wna6db7xy`, `cmtkimnbe0001w4h89v55gk60`)
- 2 `AdminUser` rows (`winstonsipandserve@gmail.com`, `claude-verify-admin@example.com`)
- 1 `CheckInLookupAttempt` row (against the real admin, dated 2026-09-01)
- 6 sample `Bulletin` rows (from `scripts/seed-sample-bulletins.ts`)

All pricing/resource/guest-fee values touched in Part 4 were reverted and confirmed back to their
original values (`pricing_rules: 21`, `add_on_pricing_rules: 16`, `guest_fee_rules.amountCentavos:
15000`, both Golf Simulator bays `is_active: true`) before moving on, per the prompt's explicit
instruction.

**Final row counts, confirmed identical to the pre-pass baseline:** `customers: 0`, `bookings: 2`
(the same 2 pre-existing ids, confirmed by direct id comparison — not just a matching count),
`memberships: 0`, `membership_applications: 0`, `membership_payments: 0`, `admin_users: 2` (the
same 2 pre-existing emails), `bulletins: 6`, `check_in_lookup_attempts: 1` (the same pre-existing
row).

---

## CHECKPOINT

- All 43 scenarios have a logged result above (pass/fail/note), with the 2 real gaps called out
  explicitly in "Bugs found" as not fixed in this pass.
- DB confirmed back to the exact pre-pass baseline, including the 2 QA `AdminUser` rows removed —
  verified by both aggregate counts and direct id/email comparison against the pre-pass snapshot.
- `git status`/`git diff` confirm zero application source files were modified — the only new file
  is this findings document (`scripts/` is entirely gitignored, consistent with the existing
  `scripts/seed-sample-bulletins.ts` housekeeping note in PROGRESS.md's Next Up, so the 8 new
  scripts this pass added don't appear in `git status` either).
- All pricing/resource/guest-fee values touched in Part 4 confirmed reverted before moving on.

## VERIFY

- `git status --porcelain`: only `TEST_FINDINGS_ADMIN_2026-09-03.md` is new; `git diff --stat`
  against every tracked file is empty.
- DB row counts after cleanup match the pre-pass baseline snapshot exactly, confirmed both by
  count and by direct id/email comparison (see "Test data created and cleanup" above).
- Regression check: a full anonymous Tennis Court booking was driven live through the real 5-step
  wizard to the Payment step post-Part-4 (₱750.00 shown, matching PROJECT_CONTEXT.md's non-member
  rate exactly) — confirms none of the Part 4 pricing edits/reverts left the live booking flow in
  a broken or mispriced state.
- The 2 seeded QA admins are confirmed removed (`adminUser` count back to 2, matching the 2
  pre-existing emails exactly) — not kept, since Arjay did not ask for that.
