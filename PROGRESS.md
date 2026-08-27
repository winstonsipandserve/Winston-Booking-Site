# PROGRESS.md

Build status and change log for Winston Sip and Serve. Updated as a standard part of every Claude Code prompt going forward — see CLAUDE.md's Development Workflow for the process this supports.

**Entry format (going forward):** Completed Log entries should be 1–3 sentences — what changed, why (only if the decision isn't obvious), and current status. Skip VERIFY step-by-step narration, exact test data/scripts, row counts, and routine confirmations (`tsc` clean, `git status` matches scope, cleanup done) — those are true of every prompt by convention, not per-entry information. Full pre-2026-08-28 history, including every original VERIFY pass, is preserved verbatim in `PROGRESS_ARCHIVE.md` — grep it for a date or keyword and read only the matched lines; don't read it in full.

---

## Build Status

- **Stack**: Next.js 16 (App Router) + TypeScript, Prisma 6.19.3, Supabase (Postgres/RLS/Storage), Auth.js v5, PayMongo (Checkout Sessions API), Resend, Tailwind v4 (CSS-first `@theme`, no config file). Deployed to Vercel.
- **Schema**: 20 Prisma models (17 original + `MemberActivationToken`, `PasswordResetToken`, a unified `Bulletin`). `booking_no_overlap` exclusion constraint and RLS deny-all (all tables, `anon`+`authenticated`) both live as isolated migrations, master SQL under `prisma/manual-sql/`. Resource inventory: 1 tennis court, 3 pickleball courts, 1 tennis sim, 2 pickleball sims, 2 golf sims.
- **Booking + payment flow**: Complete end-to-end. Announcement gate → 5-step wizard (SPORT/COURT/DATE & TIME/ADD-ONS/SUMMARY) → hold created on Confirm (`customerId: null`, provisional non-member pricing) → Payment page (reference shown immediately; Pay Now attaches customer, re-prices member-aware, confirms if price changed) → PayMongo Checkout (auto-redirect) → `/book/confirmation` (polls, then renders result). Every step, including Payment, is on brand tokens.
- **Marketing site**: All 6 pages done — Home, Book Now, News, Café & Bar, Membership (info + `/membership/apply`), About. Home verified against a real mock UI. Navbar `fixed`, transparent-over-Hero → solid-on-scroll. Placeholder content pending client input: Home Hero copy, About's Our Story, Footer contact info, Café & Bar hours/photos, News social links.
- **Auth**: Email/password, live for admin (`credentials` provider) and member (`member-credentials` provider), JWT sessions, no adapter. Every `/api/admin/*` route + `(protected)/layout.tsx` require `role === 'admin'`. `/account` gates on `role === 'member'`, shows real `Customer`/`Membership`/`Booking` data.
- **Forgot password**: Live end-to-end — `PasswordResetToken` (1hr expiry), enumeration-safe `/api/auth/forgot-password` (always 200), `/api/auth/reset-password`, `/forgot-password` + `/reset-password` pages.
- **Membership application/approval**: Submission (`/membership/apply`) → admin review (`/admin/memberships`) → approve/reject mutation, live. Approval issues a `MemberActivationToken` + activation email; rejection sends a branded email with the admin's reason. Tier-activation *payment* (a real PayMongo charge) is not built — approval today just creates the `Membership` row free/manually.
- **Transactional email**: `buildBrandedEmail` (shared layout) has 4 consumers — activation, rejection, forgot-password, booking confirmation — all built. Sending from verified domain `no-reply@winstonsipandserve.club`, reply-to `winstonsipandserve@gmail.com`. Not yet designed: tier-activation payment confirmation, membership expiry/renewal reminders.
- **Admin panel**: Bookings (list/detail/reschedule), Memberships (list/detail + approve/reject), Resources & Pricing (tabbed Courts/Simulators/Guest Fee — resources are edit (pricing) + disable/enable only, no create/delete; Pricing/Add-on rows now have full create/edit/delete; Guest Fee stays edit-only, permanently, by design), Bulletin (full CRUD + image upload) — all live, gated by `(protected)/layout.tsx`. Not built: admin-side password reset, rate limiting, additional roles.
- **Known dev-environment quirks** (mirrors CLAUDE.md's own Known Issues): `middleware.ts` does not execute locally (Next 16/Turbopack/Windows) — every gated route has its own working `auth()` check doing the real enforcement; re-verify against `staging` before assuming this is dev-only. The Browser pane doesn't composite frames in this environment — prefer DOM/class-based checks over `getComputedStyle`/screenshots for VERIFY.

---

## Completed Log

- 2026-08-10 — CLAUDE.md scaffolded: identity, tech stack, architecture decisions, POS scope, dev workflow (`26c0991`)
- 2026-08-10 — Branch Promotion Policy added (`c7e5c5c`)
- 2026-08-10 — PROJECT_CONTEXT.md created: resource types, membership, cancellation rules; pricing left pending client rate table (`0a4d4cc`)
- 2026-08-10 — PROJECT_CONTEXT.md updated with finalized pricing/add-on rate tables (`1e4daf4`)
- 2026-08-10 — PROGRESS.md created
- 2026-08-10 — Pricing model confirmed DB-driven (`PricingRule`/`AddOnPricingRule`), admin-editable
- 2026-08-10 — Confirmed non-members book without an account (name/phone/email only); only members log in
- 2026-08-10 — `MembershipApplication.customerId` confirmed required — resolved via look-up-or-create by email, same pattern as bookings
- 2026-08-10 — Admin login resolved as individual staff logins, not shared; `reviewedBy`/`performedBy` will be real FKs
- 2026-08-10 — `BookingReschedule` confirmed createdAt-only/immutable (audit integrity) — corrections via a new row, not edits
- 2026-08-10 — `Payment.bookingId` confirmed a direct nullable FK to `Booking`, not polymorphic — trades a small future POS migration for DB-enforced integrity now
- 2026-08-10 — `MembershipCreditTransaction` ledger model added — `creditBalanceCentavos` is a cached total backed by an immutable transaction log
- 2026-08-10 — Next.js scaffold created (TypeScript, Tailwind, App Router)
- 2026-08-10 — Guest fee confirmed as its own admin-editable `GuestFeeRule` table, not hardcoded; membership-payment↔`Payment` linkage flagged open
- 2026-08-10 — Prisma schema created (16 models); `booking_no_overlap` exclusion constraint applied in an isolated migration; resource inventory seeded (5 types, 9 resources; pricing deferred). Prisma pinned to 6.19.3 — 7.x removed inline `datasource url` support
- 2026-08-10 — RLS enabled on all 16 tables, deny-all for `anon`/`authenticated`, isolated migration
- 2026-08-11 — Booking hold duration (10 min) + hybrid expiry (expire-on-write primary, daily cron secondary) documented as an Architecture Decision
- 2026-08-11 — Pricing seeded; Prisma client singleton added; `POST /api/bookings` implemented (validation, pricing, expire-on-write hold, 409 on overlap); cron route (`CRON_SECRET` bearer auth) + daily Vercel schedule added
- 2026-08-11 — `GET /api/resources` added; booking form UI built (resource/duration cascade, live non-member price estimate, 201/409/400 branching); homepage simplified to name/description/Book Now link
- 2026-08-11 — Booking flow restructured into announcement gate + 5-step wizard (structure only)
- 2026-08-11 — DATE & TIME step: real calendar + availability grid, business-hours enforcement (6am–10pm PH) added server-side; `booking-hold.ts`/`business-hours.ts` extracted; `GET /api/availability` added
- 2026-08-11 — `TimeSlotGrid`: selection highlight now spans the full occupied duration, not just the clicked slot
- 2026-08-11 — `TimeSlotGrid`: grid always renders the full 6am–10pm range regardless of duration (previously stopped early); slots that would run past close are marked `exceedsClosing`
- 2026-08-11 — Court duration options extended 1–3hr → 1–4hr; simulator duration dropdown fixed to only show non-member tiers (was leaking a member-only golf-sim tier)
- 2026-08-11 — Wizard split 5→6 steps: Ball Boy/Coaching moved out of DETAILS into a new ADD-ONS step; REVIEW relabeled SUMMARY
- 2026-08-11 — Ball Boy correctly gated to court types only in `AddOnsStep` (was ungated despite docs saying court-only)
- 2026-08-12 — Guest count relocated from DETAILS to ADD-ONS, alongside Ball Boy/Coaching
- 2026-08-12 — Add-on backend wiring: `AddOnService` (2 rows) + `AddOnPricingRule` (16 rows) seeded — non-member Tennis/Pickleball Sim coaching intentionally has no row ("no row = not offered")
- 2026-08-12 — ADD-ONS step wired to live add-on pricing from `GET /api/resources`, replacing the "Coming soon" placeholder
- 2026-08-12 — Doc-only: clarified PayMongo test credentials in `.env.local` are Arjay's personal test account, not the client's
- 2026-08-12 — PayMongo Checkout Session backend implemented (hosted Checkout Sessions, not Payment Intents/Elements) — documented as an Architecture Decision. `payment_method_types` turned out to be a required field on the API, not optional as first assumed
- 2026-08-12 — Wizard wired to real PayMongo Checkout + polling confirmation page — booking+payment flow complete end-to-end. `GET /api/bookings/[id]` + `/book/confirmation` (2s poll, 15 attempts) added
- 2026-08-12 — Booking reference (`Booking.id`) surfaced in our own UI (`ReviewStep`, `BookingConfirmation`), not just PayMongo's checkout page. Gap flagged: confirmation page's `pending_payment` state still shows no reference (out of scope, not fixed)
- 2026-08-12 — SUMMARY's auto-redirect to PayMongo replaced with a manual "Continue to Payment" pause screen — the auto-redirect fired too fast to ever be seen/tested. Environmental findings, not fixed here: `NEXT_PUBLIC_APP_URL=""` broke the PayMongo→app redirect (needed a real URL + dev-server restart — **confirmed fixed, `.env.local` now has `http://localhost:3000`**); ngrok free-tier interstitial page; PayMongo dashboard webhook pointed at the Vercel deployment, not the local tunnel (worked around via a self-signed webhook for local testing)
- 2026-08-12 — `Booking.customerId` made nullable — two-phase flow: hold created (`customerId: null`, provisional pricing) before customer known; `PATCH /api/bookings/[id]` resolves customer + re-prices member-aware once Name/Phone/Email are collected. `booking-pricing.ts`/`customer-resolution.ts` extracted as shared logic
- 2026-08-12 — DETAILS step removed; Name/Contact/Email + booking creation moved to a post-SUMMARY Payment page; checkout hand-off reverted to immediate redirect (5 steps total)
- 2026-08-12 — PayMongo line items consolidated to one row per booking (was one + one per add-on); `payment_method_types` expanded to `['card','gcash','grab_pay','paymaya']`, confirmed live-enabled for the test account
- 2026-08-12 — **Critical webhook bugfix**: real PayMongo events use `payment.paid`, not `checkout_session.payment.paid` as previously assumed — every prior "webhook confirmed working" entry had only been tested against the wrong payload shape; this was the first genuine real-payload confirmation. Also fixed `Payment.paidAt` to use the payload's actual `paid_at`, not server-processing time
- 2026-08-13 — Home page rebuilt with the real theme (design tokens, Navbar, Footer, all sections, live resource-count wiring via direct Prisma query)
- 2026-08-13 — Home polish pass: reveal-on-scroll, CTA banner decorative blobs, image variety, hover micro-interactions
- 2026-08-14 — Home redesigned against a client reference image: tokens split (`brand-light` vs `background`), Choose Your Sport/Testimonials removed, Hero/StatsBar/HowItWorks/Facilities (renamed from Gallery) rebuilt. Confirmed deviation: Navbar stays sticky above Hero rather than moving below it, per the reference. Hero/Footer copy flagged as placeholder pending client confirmation
- 2026-08-14 — Navbar/Hero refinement pass (5 items vs. reference — icon set, spacing, etc.)
- 2026-08-14 — Navbar/Hero/StatsBar/CtaBanner follow-up pass (4 items vs. latest reference screenshots) — social icons/My Account pill removed from Navbar, replaced with a Book Now link
- 2026-08-14 — Doc-only: newly installed UI/animation skills documented in CLAUDE.md
- 2026-08-15 — Navbar/Hero visual-match pass vs. a new reference screenshot — real brand logo asset swapped in
- 2026-08-15 — Font system replaced sitewide: Lora → Manrope (body) + Parisienne (script wordmark), Fraunces added as `font-serif` (not yet used); Navbar simplified to emblem-only logo, buttons removed
- 2026-08-15 — StatsBar/How It Works copy+color pass
- 2026-08-17 — Navbar link styling (uppercase, tracking) + CtaBanner dot-pattern/copy/button fixes
- 2026-08-17 — `/book`'s gate + heading moved onto brand tokens (cream/Fraunces/Manrope/brand-dark)
- 2026-08-17 — How It Works equal-height card fix (missing `h-full` on the `Reveal` wrapper)
- 2026-08-18 — SPORT step: added non-member starting-price labels
- 2026-08-18 — DATE & TIME UI pass: duration button group, calendar past-dates styling, time-slot borders
- 2026-08-18 — StepIndicator active-label visibility bugfix (CSS color issue, not missing markup)
- 2026-08-18 — StepIndicator + AddOnsStep moved onto brand tokens
- 2026-08-18 — ReviewStep (SUMMARY) redesigned as a ledger-style card
- 2026-08-18 — SPORT/COURT/DATE & TIME moved onto brand tokens + a pre-selection bugfix + shared Back/Continue bar restyled
- 2026-08-18 — AddOnsStep: Coaching pax count decoupled from guest count
- 2026-08-18 — PaymentStep redesigned to match; new shared `BookingSummary` component extracted (used by SUMMARY and Payment page)
- 2026-08-18 — `/api/resources` fetch lifted to page-load instead of gate-continue-click, so it runs concurrently with the announcement gate
- 2026-08-18 — AnnouncementGate gained an inert "Already a member? Sign in" placeholder line; SPORT gained full simulator tier pricing; selected states across SPORT/COURT/DATE & TIME made bolder (`border-2`/10%-tint)
- 2026-08-18 — New generic `Modal` component built; SPORT step's pricing moved off-card into it
- 2026-08-18 — New `Icons.tsx` (hand-authored inline SVGs) — sport icons on SPORT, badge icons on SUMMARY's ledger rows
- 2026-08-18 — Navbar CTA buttons reinstated: "Book a Court" + "Become a Member" (desktop + mobile)
- 2026-08-18 — Membership Application form built: public `/membership` page, 3 gov-ID uploads to a private Storage bucket, creates a pending `MembershipApplication` — no payment/activation/admin-review yet
- 2026-08-18 — Bugfix: `POST /api/membership-applications` error-handling gap — a DB failure outside the try block could throw unhandled instead of the standard `{error}` JSON shape
- 2026-08-19 — First live VERIFY of the membership application flow against real Storage credentials — all 12 checks passed
- 2026-08-19 — Doc-only: nav-tab page status (Home/Book Now done; News/Café & Bar/Membership/About not started) recorded in Next Up
- 2026-08-19 — Admin panel slice 1: AdminUser email/password login via Auth.js (Credentials provider, JWT, no adapter)
- 2026-08-19 — Admin panel slice 2: bookings list/detail/reschedule + session `role` callbacks added to `auth.ts`. Found and fixed two real blockers (no `AdminUser` row existed; `AUTH_SECRET` was empty). Flagged: `middleware.ts`'s matcher wasn't actually gating the reschedule route — later found broader (see 2026-08-19 entry below)
- 2026-08-19 — Bugfix: post-login "hang" on `/admin/login` — `signIn()` had no `redirectTo`, so it silently redirected back to the login page itself
- 2026-08-19 — Admin nav expanded 2→5 tabs with Coming Soon placeholders for Resources/Memberships/Bulletin
- 2026-08-19 — Admin frame restructured: top-nav → foldable left sidebar + topbar + bento content card
- 2026-08-19 — Bookings list restructured: trimmed columns, merged Start/End into one cell, added a View action
- 2026-08-19 — Bookings list: re-added a Reference column; 4 status-filter links replaced with a single Filter modal (status + date range)
- 2026-08-19 — Admin Memberships built as a read-only frame (list + detail, signed-URL gov-ID images) — no approve/reject yet
- 2026-08-19 — Bookings list's date column changed from slot start/end to `createdAt` ("Submitted") — deliberate; slot detail stays on the detail page
- 2026-08-19 — Memberships detail page visual redesign (status shown once, as a colored pill)
- 2026-08-19 — Admin Resources & Pricing built as a read-only frame
- 2026-08-19 — Resources & Pricing split into 3 tabs (Courts/Simulators/Guest Fee) with inert CRUD-preview buttons
- 2026-08-19 — Resources & Pricing cards made individually foldable (collapsed by default)
- 2026-08-19 — **Confirmed broader**: `middleware.ts` doesn't execute at all locally (Next 16/Turbopack/Windows), not just for the one route flagged above — every gated page/route is actually protected by its own `(protected)/layout.tsx`/route-level `auth()` check, not middleware
- 2026-08-19 — Resources & Pricing: resource-level Add/Edit/Delete wired for real; one-time cleanup of stray Booking test data from earlier manual testing
- 2026-08-19 — `prisma/bootstrap-admin.ts` retroactively documented and deleted — the real `AdminUser` it was meant to create already existed from an earlier unlogged run
- 2026-08-20 — Diagnosed `/admin/memberships`'s ~1.7s load as Prisma round-trip count, not query/render cost — fixed via `relationLoadStrategy: 'join'` (`relationJoins` preview feature)
- 2026-08-20 — Same `relationLoadStrategy: 'join'` fix applied to `/admin/resources`
- 2026-08-20 — Admin Pricing/Add-on/Guest-Fee mutation, edit-only: 3 new PATCH routes + `PriceEditModal`
- 2026-08-20 — Browser-verified the Pricing/Add-on/Guest-Fee edit slice live, via an already-authenticated session (not Claude Code login)
- 2026-08-20 — Admin membership review mutation wired: `PATCH /api/admin/memberships/[id]` (approve/reject + required rejection reason)
- 2026-08-20 — Doc-only: PROJECT_CONTEXT.md's stale membership-flow note reconciled with shipped behavior (rejection reason is required, not optional)
- 2026-08-20 — Membership page (`/membership`) visual refinement: per-month price lines added, 6-Month marked as featured
- 2026-08-20 — Home layout pass: Hero eyebrow added; StatsBar changed to a flat full-width dark band; How It Works redone as a 3-circle timeline; new "Two Sides, One Winston" section added; CtaBanner texture changed
- 2026-08-20 — Home layout pass round 2: a real mock UI became available for the first time — corrected drift from the text-only first pass (colors deliberately kept on our own tokens, not the mock's)
- 2026-08-20 — Navbar converted `sticky`→`fixed` (so the transparent-over-Hero state actually shows the photo); TwoSides gained a day-to-night gradient background
- 2026-08-20 — TwoSides gradient extended for contrast; Navbar scroll transition smoothed; all 7 CTA buttons given a gradient/shadow/motion treatment
- 2026-08-20 — Restraint pass: Hero wordmark enlarged one step; Navbar button heights fixed; the gradient/shadow/motion button treatment dialed back to flat single-tone
- 2026-08-20 — Button radius/size/legibility pass: all 7 buttons `rounded-full`→`rounded-lg`; Navbar buttons resized to match; "Become a Member" gained scroll-conditional light/dark text — closes out Home's button treatment
- 2026-08-20 — Café & Bar page built (`/cafe-bar`, 5 components)
- 2026-08-20 — Café & Bar gained a client-side Café/Bar mode switch
- 2026-08-20 — Membership page split into an info page (`/membership`) + a relocated application form (`/membership/apply`)
- 2026-08-20 — About page built (`/about`) — Our Story copy flagged as placeholder pending real content
- 2026-08-20 — News page built (`/news`), completing all 6 marketing pages. One-off decision (confirmed one-off, not standing): frontend content shape was designed before the DB schema question (extend `Bulletin` vs. new model), which stayed open until the Bulletin-unification work below
- 2026-08-21 — Home stat-banner latency fixed by dropping the DB dependency entirely (hardcoded constants) rather than caching it
- 2026-08-21 — Home mobile-responsiveness audit (audit-only) across 320–639px — one blocking contrast issue (TwoSides' mobile-gradient link) + 4 polish findings, written to `docs/audits/2026-08-21-home-mobile-audit.md`
- 2026-08-21 — Bulletin admin read-only frame built
- 2026-08-21 — `Bulletin` model unified to match News/AnnouncementGate's shape (`excerpt`, `category` enum, `imageUrl`, etc.)
- 2026-08-21 — Bulletin admin CRUD fully wired (create/edit/delete + image upload)
- 2026-08-21 — AnnouncementGate wired to live Bulletin data; `/news` date format switched to a shared formatter — **Bulletin unification complete, no hardcoded `NEWS_ITEMS`/`SAMPLE_NOTICES` remain anywhere**
- 2026-08-21 — `/news` wired to the live Bulletin table (was hardcoded `NEWS_ITEMS`)
- 2026-08-21 — Doc-only: PROJECT_CONTEXT.md's stale claim that bulletins appear on the homepage corrected (they surface on `/news` and `/book`'s gate)
- 2026-08-21 — Member login/account scaffold added — hardcoded sample data only, no backend (sessionStorage mock)
- 2026-08-21 — `/account` visual redesign — still sample data
- 2026-08-21 — `/account` Navbar-legibility bugfix (light hero background made the transparent Navbar's light text unreadable) + two-column layout
- 2026-08-21 — Recent Bookings pagination (10/page) + Navbar Sign In/Sign Out toggle (sessionStorage-based) + "Become a Member" removed from Navbar
- 2026-08-21 — `/account` Recent Bookings widened to full column span; Membership Status emblem contrast fixed
- 2026-08-21 — `/account` Recent Bookings horizontal-scrollbar bugfix (CSS overflow-axis coupling) + QR "View Full Screen" modal + Navbar button reorder
- 2026-08-22 — `/account` sidebar gained an inert Book-a-Court element; Navbar swaps it for an account icon when the mock session is active
- 2026-08-22 — Book-a-Court placeholder relocated into MembershipStatusCard's footer; structural fix to shared `Modal.tsx` affecting all its consumers
- 2026-08-22 — `/account` Profile-card height-match fix (removed a stray `md:items-start` overriding grid stretch); Recent Bookings scroll workaround removed
- 2026-08-22 — Doc-only: CLAUDE.md's stale "auth method undecided" wording corrected to reflect the already-made email/password decision
- 2026-08-22 — Post-approval member activation flow built (schema + issuance + email + `/activate` page) — deliberately stops short of real member login (next entry)
- 2026-08-23 — Real Auth.js member login wired: second `member-credentials` provider, `/account`'s gate is now a real server-side session check, Navbar reads a real session. `/account`'s displayed content is still sample data (next entry). **Critical gap found in VERIFY, flagged as blocking**: a `role: 'member'` session passed every admin auth check, since none of them checked `role` — only session existence
- 2026-08-24 — Closed the admin-gate gap above: every `/api/admin/*` route (9 files, 11 occurrences) and `(protected)/layout.tsx` now also require `role === 'admin'`
- 2026-08-24 — `/account` wired to real `Booking`/`Membership` data — no `SAMPLE_*` constants left. Membership selection prefers an active/non-expired row, falls back to the most recent of any status, or an empty state
- 2026-08-26 — Resend sending domain verified (`winstonsipandserve.club`) — closes the sandbox-sender limitation; sending from `no-reply@winstonsipandserve.club`, reply-to `winstonsipandserve@gmail.com`
- 2026-08-26 — VERIFY pass found `RESEND_API_KEY` was empty — no real send was possible yet; flagged for Arjay
- 2026-08-26 — Fixed duplicate Prisma query logging (listener was re-attaching on every hot-reload); documented the local-dev DB connection decision (`:5432` session-mode, not pooled `:6543`) as locked-in in CLAUDE.md
- 2026-08-26 — Real end-to-end activation-email delivery confirmed once `RESEND_API_KEY` was set — real admin approval → real inbox delivery with a working `/activate` link
- 2026-08-26 — Resend MCP connected in both this planning chat and Claude Code CLI
- 2026-08-26 — Branded email layout built (`buildBrandedEmail`, shared by all future email cases) — first consumer is the activation email; rejection/forgot-password not built here yet. New public `email-assets` Storage bucket for the logo
- 2026-08-27 — Visual polish pass on the branded email layout (logo contrast, top strip, eyebrow label, CTA styling, divider, card border, proper hidden-preheader technique)
- 2026-08-27 — Approval email rewritten from a bare notice into a warm, benefit-led welcome (perks box, tier personalization)
- 2026-08-27 — `sendRejectionEmail` added — second `buildBrandedEmail` consumer; calmer context box (not the celebratory approval box) surfacing the admin's reason, plain inline `/book` link (not a CTA button)
- 2026-08-27 — Member password reset built end-to-end — `PasswordResetToken` (1hr expiry), enumeration-safe forgot-password route, reset route, `/forgot-password` + `/reset-password` pages, `sendPasswordResetEmail` as the third `buildBrandedEmail` consumer. **All three tracked membership email cases (approve/reject/forgot-password) now closed out**
- 2026-08-27 — Real membership data reset at Arjay's request, for a clean testing slate (Customer rows preserved, `passwordHash` reset to null) — gov-ID images from the deleted applications are now orphaned in Storage (flagged, not cleaned up)
- 2026-08-27 — `/reset-password` invisible-Navbar bug fixed (missing `bg-brand-dark` hero band) — `/forgot-password` has an identical bug in its lower section, not yet fixed
- 2026-08-27 — `PROGRESS.md` compressed (552KB → ~28KB): full pre-2026-08-28 history moved verbatim into new `PROGRESS_ARCHIVE.md`; this file rewritten to current-state Build Status + one-line Completed Log entries + a trimmed Next Up. `CLAUDE.md`/`PROJECT_CONTEXT.md` untouched. See the "Entry format" note at the top of this file for the convention new entries should follow going forward
- 2026-08-27 — `/forgot-password/page.tsx`'s leftover `bg-background` legacy token fixed → `bg-brand-light`, matching `/reset-password`'s lower section. Closes out the last item from the 2026-08-27 forgot-password-flow build
- 2026-08-27 — `sendBookingConfirmationEmail` added as the 4th `buildBrandedEmail` consumer — booking-reference ledger card (sport/date/time/duration/guest fee/add-ons/total), Café & Bar cross-sell, membership upsell CTA. Reused `formatCentavos` from `src/lib/format.ts` for peso formatting rather than writing a duplicate (date/time formatting had no existing match, written fresh). Not yet wired to the PayMongo webhook — preview-only, sample email fired to arjayical22@gmail.com for template review.
- 2026-08-27 — Resource Add/Delete removed from the admin panel; replaced with a Disable/Enable toggle. New `Resource.disabledReason` column (nullable, cleared server-side whenever `isActive` flips back to `true`, regardless of request body). `POST /api/admin/resources` and `DELETE /api/admin/resources/[id]` deleted; `PATCH /api/admin/resources/[id]` extended to accept `isActive`/`disabledReason`. `ResourceFormModal` deleted (no longer used); new `DisableResourceModal` (reuses the shared `Modal`) prompts for an optional reason on disable. Disabled resources stay visible in the admin list (with their reason shown inline) but are now rejected server-side, not just UI-hidden: `POST /api/bookings` and `GET /api/availability` both 400 `{ error: 'Resource not found' }` for an inactive resource id, matching the not-found response shape so a disabled resource isn't distinguishable from a nonexistent one. New courts/simulators are now DB-injected only — no in-app create path.
- 2026-08-27 — Admin Pricing/Add-on rows gained full create/delete: `POST /api/admin/pricing-rules` and `POST /api/admin/add-on-pricing-rules` (409 on duplicate unique-combination, checked explicitly rather than relying on a raw Prisma P2002); `DELETE` added to both `[id]` routes (`PricingRule` hard-deletes with no referential check; `AddOnPricingRule` 409s with a friendly message if any `BookingAddOn` still references it). `PriceEditModal` gained a create mode (single-field POST form) alongside its existing multi-field edit/PATCH mode. Every previously-inert control in `ResourcesTabs` (disabled "+Add", disabled edit pencil) is now live — each price cell shows either a value with edit+delete, or a working "+Add"; the disabled-pencil placeholder was removed outright rather than kept as an inert state. Guest Fee confirmed staying edit-only, permanently, by design (its shape has nothing to key a second row on) — not a placeholder awaiting a future pass.

---

## Next Up

- Orphaned gov-ID images in the private `membership-applications` Storage bucket, left over from the 2026-08-27 membership-data reset — not cleaned up.
- Membership tier-activation payment flow (real PayMongo charge for the ₱5,500/12,500/22,500 plans) — unbuilt. Blocks the two undesigned email cases (tier-activation confirmation, expiry/renewal reminder) and member pricing/duration/coaching-tier UI in the booking wizard.
- Member-aware booking flow — `/book` only supports non-member pricing today; Navbar's Book a Court is hidden for logged-in members with a placeholder-only entry on `/account`.
- Home mobile-responsiveness: one blocking issue (TwoSides' "Book a Court →" link unreadable against its own mobile gradient) + 4 polish findings, per `docs/audits/2026-08-21-home-mobile-audit.md` — audited, not yet fixed.
- `middleware.ts`'s own `auth()` wrapper has no `role === 'admin'` check — can't be exercised locally (middleware doesn't run there), but worth adding for defense-in-depth before `staging`/`main` promotion.
- `bookings_customer_id_fkey`'s live constraint doesn't match schema (missing `ON DELETE SET NULL`/`ON UPDATE CASCADE`) — non-blocking, worth reconciling.
- Member-repricing (the `priceUpdate` "your final price is X, was Y" notice) still unverified live — no active `Membership` rows exist to exercise it against; seed one when this path needs a real check.
- `/api/resources` round-trip cost — measured 1.3–4s via instrumentation but 20–100ms live in a Browser-pane walkthrough; worth understanding whether this is Supabase-region latency or measurement variance before assuming production steady-state.
- Guest Fee remains edit-only, permanently, by design (`GuestFeeRule`'s shape — `id`/`amountCentavos`/timestamps only — has nothing to key a second row on); Pricing/Add-on rows now support full create/edit/delete.
- Wire `sendBookingConfirmationEmail` into the PayMongo webhook's `payment.paid` handler (currently template-only, unused in the real booking flow).

---

## Open Decisions

See CLAUDE.md → "Open / Not Yet Decided" for the current list — not duplicated here to avoid two sources of truth.
