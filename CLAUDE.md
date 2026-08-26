# CLAUDE.md

Project context for Claude Code. Read this before starting any work in this repo.

For business rules, pricing, membership logic, and domain-specific details, see **PROJECT_CONTEXT.md**.

---

## Project Identity

**Winston Sip and Serve** — a booking platform + admin panel for a sports facility offering tennis, pickleball, and golf simulator bays.

- **Current build scope**: Customer-facing booking flow, and an admin panel for staff to manage resources, bookings, and (once defined) memberships.
- **Not in current scope**: A POS system is planned as a future extension of this same platform (see "Scope & Future Extension" below) — do not build POS features now.
- **Single venue**: No multi-location support needed at this time.

- **Repo**: `https://github.com/winstonsipandserve/Winston-Booking-Site.git`
- **Local**: `C:\Projects\winston-booking-website`
- **Branches**:
  - `main` — production, auto-deploys to Vercel Production
  - `staging` — pre-production testing
  - `dev` — day-to-day development work

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Auth.js v5 — both admin and member login are decided and live (two Credentials providers, JWT session, no adapter/DB session tables). `/account`'s displayed content is now fully wired to real `Booking`/`Membership` data for the logged-in customer; see Architecture Decisions → Customer & auth model |
| Payments | PayMongo (Checkout Sessions API) |
| Email | Resend |
| Hosting | Vercel |
| Error tracking | Sentry |

---

## Architecture Decisions

These are locked in. Don't deviate without discussing first.

- **Resource model**: `ResourceType` contains individual `Resource` records (specific court/bay) — one unified system, not per-sport tables. There are 5 resource types: `tennis-court`, `pickleball-court`, `tennis-sim`, `pickleball-sim`, `golf-sim`. Current inventory: 1 tennis court, 3 pickleball courts, 1 tennis simulator, 2 pickleball simulators, 2 golf simulators.
- **Home stat banner is a static snapshot, not live-queried**: The homepage stat banner ("3 Sports", "9 Courts & Simulators") is a hardcoded snapshot of the locked inventory above, deliberately — this is a fixed single-venue inventory that only changes through a rare, deliberate admin action, and any time-sensitive facility news (e.g. a court under renovation) is already surfaced through the `/book` announcement gate instead. This mirrors how the Opens Daily/Last Booking hours are already a hardcoded constant (`business-hours.ts`) rather than fetched. If the inventory ever changes, update both the inventory list in this doc and the `TOTAL_RESOURCES`/`SPORT_COUNT` constants in `src/components/home/StatsBar.tsx`.
- **Double-booking prevention**: Enforced at the database level via a PostgreSQL exclusion constraint on overlapping `tsrange` (using `btree_gist`), combined with a pending-hold-and-expire flow. This is **not** an application-level check — there is no admin bypass. Prisma has no native syntax for `EXCLUDE USING gist`, so this constraint is written as raw SQL and its master copy will live at `prisma/manual-sql/booking-exclusion-constraint.sql` (created when the Prisma schema is first generated) — not buried inside a single migration file where it could be missed or lost on a reset. Any future prompt that touches `Booking` or runs a migration must include a VERIFY step confirming this constraint still exists in the database (e.g. a query against `pg_constraint`).
- **Booking confirmation**: A booking only flips to `confirmed` on a verified PayMongo `payment.paid` webhook (HMAC-SHA256 signature verified). Never confirm on client-side redirect.
- **Money**: Stored as `Int` in centavos everywhere, matching PayMongo's native format. Never use floats for currency.
- **Booking state machine**: `pending_payment` → `confirmed` (webhook) or `cancelled` (hold expiry / failed payment).
- **Booking hold duration & expiry**: A `pending_payment` booking is held for **10 minutes** (`BOOKING_HOLD_MINUTES` env var, default `10`) before being treated as abandoned. This is an ops parameter, not admin-editable — a plain env var, not a `PricingRule`-style DB table, since it's not something the client tunes via the admin panel. Expiry is enforced by a hybrid mechanism:
  - **Expire-on-write (primary, correctness-critical)**: immediately before inserting a new booking, any stale `pending_payment` rows for that resource/time range are transactionally cancelled first. Required because the `booking_no_overlap` exclusion constraint only ignores `cancelled` rows — a passive "filter expired holds out of availability queries" approach would not free the slot for a competing insert.
  - **Daily Vercel cron sweep (secondary, hygiene only)**: a daily cron route cancels stale `pending_payment` rows platform-wide, independent of new booking attempts. Vercel's Hobby plan caps cron jobs at once per day (a more frequent schedule fails at deploy time), so this can't be the primary mechanism yet — tighten the cadence once the project moves to Pro before go-live (see Branch Promotion Policy).
- **Pricing model**: Prices are stored in the database (`PricingRule` for court/simulator rates, `AddOnPricingRule` for coaching fee / ball boy rates) rather than hardcoded in application code. This lets admin edit prices via the admin panel without a code deploy. Each row is an explicit combination of resource type, member/non-member rate, and duration tier — invalid combinations (e.g. non-member golf-sim 30-min) simply have no row, rather than existing with a null or zero price.
- **Customer & auth model**: `Customer` carries a nullable `passwordHash` — null for every non-member row (created from name/email/phone for customers who never need an account), set once a member completes activation via `/activate` (see PROGRESS.md's 2026-08-22 Completed Log entry). Member-facing Auth.js login (**email/password, decided**) is now live: a second Credentials provider (`member-credentials`, alongside the admin provider) checks this hash, `/account` gates on a real server-side session check (`session.user.role === 'member'`), and Navbar reflects the real session and real sign-out — see PROGRESS.md's 2026-08-23 Completed Log entry. **`/account`'s displayed Profile/Membership Status/Recent Bookings are now wired to real `Booking`/`Membership` rows for the logged-in customer** — see PROGRESS.md's 2026-08-24 Completed Log entry (the second one, following the admin-gate fix). Membership selection treats `endDate` as the source of truth for expiry rather than the stored `status` column (nothing in this codebase auto-flips `status` when a membership lapses), and falls back to the customer's most recent membership (any status) if none is currently valid, or a graceful empty state if the customer has none at all. Since bookings can repeat with the same email and `Customer.email` is unique, customer resolution must look up-or-create `Customer` by email, not blind-insert. Membership applications follow the same rule: at submission, `MembershipApplication.customerId` is resolved via look-up-or-create by email (never nullable, never blind-insert) — so an applicant who never booked before still gets a `Customer` row at application time, and one who already has a `Customer` (from a prior booking) is matched to it instead of duplicated. **`Booking.customerId` is nullable — a deliberate deviation from this originally-required-at-creation pattern.** A booking hold is created (and its reference number shown to the customer) before name/email/phone are ever collected, since the booking-reference-first UX needs the `Booking` row to exist before `Customer` resolution is possible; `Booking.customer` is attached in a separate step (`PATCH /api/bookings/[id]`) once those fields are collected on the payment page, immediately before checkout-session creation. `GET /api/bookings/[id]`'s `customer` field is null-safe (`{ name } | null`) to cover the brief window between hold creation and customer attachment.
- **Two-phase booking pricing**: A booking is priced twice. At hold creation (`POST /api/bookings`), pricing is provisional — computed at the non-member rate, since no customer/email exists yet to check for an active `Membership`. At customer attachment (`PATCH /api/bookings/[id]`), pricing is finalized — recomputed with the now-known `isMember` status, which can lower the total (member rate, guest fee no longer applicable) if the resolved `Customer` turns out to have an active membership. `src/lib/booking-pricing.ts` is the single source of truth for this math in both phases (parameterized by `isMember: boolean`, never resolves membership itself) — `src/lib/customer-resolution.ts` is the single source of truth for the look-up-or-create-then-check-membership logic that the PATCH step feeds into it. The booking wizard surfaces this to the customer as an explicit "your final price is X (was Y)" notice requiring a confirmation click before checkout, rather than silently redirecting at a different price than what was shown at hold creation.
- **Admin/staff model**: Admin panel uses individual staff logins, not a single shared account — multiple staff can hold the same (currently only) admin role. This requires an `AdminUser` model; `MembershipApplication.reviewedBy` and `BookingReschedule.performedBy` are real foreign keys to this table (not plain strings), giving per-action accountability. `AdminUser` now carries a `passwordHash` field, and email/password login is live at `/admin/login` (Auth.js v5, Credentials provider, JWT session, no adapter/DB session tables). Gating is currently enforced by `(protected)/layout.tsx`'s own `auth()`/`redirect()` check for pages, and each `/api/admin/*` route's own explicit session check for API routes — `middleware.ts` does not appear to execute in this Next 16.3.0/Turbopack-on-Windows dev setup (root cause not identified), confirmed via instrumentation logging zero invocations across a full debugging session. Member-facing auth is a separate concern — see Architecture Decisions → Customer & auth model. `role` is modeled as an enum with a single value today, leaving room for more admin roles later without restructuring. Since a second Auth.js Credentials provider now exists for members, `(protected)/layout.tsx` and every `/api/admin/*` route check `session.user.role === 'admin'` in addition to session existence (see PROGRESS.md's 2026-08-24 Completed Log entry) — a bare "session exists" check is no longer sufficient to gate admin access, since a `role: 'member'` session would otherwise pass it too.
- **`BookingReschedule` immutability**: This model has no `updatedAt` and its rows are never edited after creation — each row is a permanent audit entry (original slot, new slot, reason, admin, timestamp), not a mutable record. If a logged reschedule entry is ever wrong (e.g. admin typo), the fix is to insert a new correcting row, never to edit the original — the log must show what was actually recorded and when, not a silently revised version of events.
- **`Payment` ↔ `Booking` relationship**: `Payment.bookingId` is a direct, nullable foreign key to `Booking` (not a polymorphic/generic reference). Nullable because a future POS transaction will also create a `Payment` row with no `Booking` attached. This trades a small future migration (adding a `posOrderId` column to `Payment` once POS is built) for real database-enforced referential integrity now — chosen deliberately over a polymorphic `referenceType`/`referenceId` pattern, since `Payment` handles real money and the FK guarantee outweighs saving one future migration.
- **Membership credit ledger**: `Membership.creditBalanceCentavos` is a cached running total, not the source of truth — a `MembershipCreditTransaction` model logs every event that changes a member's credit (activation, future POS spend, manual adjustments), each row immutable (`createdAt`-only, same pattern as `BookingReschedule`). The balance field exists for fast reads; the ledger exists for auditability and disputes. No spending events exist yet since POS isn't built — today every row will be an `activation` credit — but the ledger is in place so POS integration only adds a new `reason` value, not a new table or a balance-migration.
- **Guest fee rate storage**: The ₱150/hr per-guest surcharge (non-member court bookings only) lives in its own `GuestFeeRule` table (`id`, `amountCentavos`, `createdAt`, `updatedAt`) rather than as a column on `PricingRule` or a hardcoded constant. This keeps it admin-editable via the panel — consistent with the pricing-in-DB decision — without conflating a flat per-guest surcharge with the duration-tiered rows in `PricingRule`, which it doesn't actually fit. Only one row exists today; the table shape allows future variation (e.g. per-sport guest fees) without restructuring.
- **Row Level Security (RLS)**: All 17 application tables — including `member_activation_tokens` (added 2026-08-22, see Customer & auth model) — have RLS enabled with explicit deny-all policies for the `anon` and `authenticated` Supabase roles. The app's actual DB access goes through Prisma via `DATABASE_URL`/`DIRECT_URL` (Supabase's privileged `postgres` role, which bypasses RLS), so this closes off the Supabase anon-key REST API path without changing app behavior. Master SQL lives at `prisma/manual-sql/enable-rls-deny-all.sql`. Any future prompt that adds a table must enable RLS with deny-all policies in that same migration (see Coding Conventions), and any prompt touching RLS or running a migration should VERIFY policies still exist (query `pg_policies` and `pg_class.relrowsecurity`).
- **Transactional email sending domain**: `winstonsipandserve.club` is verified in Resend (SPF/DKIM live, DMARC set to monitor-only `p=none`). Activation emails send from `no-reply@winstonsipandserve.club` with `reply-to` set to `winstonsipandserve@gmail.com`, the inbox actually monitored — see `src/lib/resend.ts`.
- **Password reset**: A `PasswordResetToken` model (mirroring `MemberActivationToken`'s shape exactly — `customerId` FK, `tokenHash`, `expiresAt`, `usedAt`) backs member self-service password reset. Its expiry is a separate env var, `PASSWORD_RESET_TOKEN_HOURS` (default `1`), deliberately much shorter than activation's 48 hours — a reset link guards an existing account rather than onboarding a new one, so a tight window matters more than convenience. `POST /api/auth/forgot-password` is enumeration-safe by design: it looks up the `Customer` by email and only creates a token + sends an email if found and already activated (`passwordHash` set), but always returns the identical `200 { message: "If that email is registered, we've sent a password reset link." }` regardless of whether the email exists, was never activated, or was found and emailed — never a different status or message for any case, and the `/forgot-password` form never branches on the outcome either. `POST /api/auth/reset-password` mirrors `/api/activate`'s validation order and transaction shape (set `Customer.passwordHash`, stamp `usedAt`, in one `$transaction`), but its 404 for an unresolvable token is deliberately vaguer ("Invalid or expired reset link") than activation's, since a reset link failing to resolve shouldn't hint at why.
- **Transactional email branding**: All transactional emails share one branded layout via `buildBrandedEmail(...)` in `src/lib/email-templates.ts` (generic/parameterized, not tied to any single email case) rather than each call site building its own inline HTML/text strings — `sendActivationEmail`, `sendRejectionEmail`, and `sendPasswordResetEmail` are its three consumers — all built. The layout's logo image is served from a new public Supabase Storage bucket, `email-assets` (mirrors the `bulletin-images` bucket's shape: `public = true`, one deny-by-default-except-SELECT RLS policy for `anon`/`authenticated`, writes service-role-only — master SQL at `prisma/manual-sql/email-assets-bucket.sql`). Asset upload into this bucket is manual (via the Supabase dashboard), not app-driven, since it's a small, rarely-changing set of static brand assets rather than user-generated content.
- **Local-dev database connection**: `.env.local`'s `DATABASE_URL` intentionally points at Supabase's session-mode pooler (port `5432`, no `pgbouncer=true`) rather than the transaction-mode pooler (port `6543`) used for deployed environments. Transaction-mode pooling forces Prisma to run `DEALLOCATE ALL` before reusing prepared statements and adds extra round trips per query — measurable overhead in local dev where a single long-lived connection is safe. Deployed environments (Vercel staging/production) must keep the pooled `:6543` connection, since serverless functions there need PgBouncer to avoid exhausting Supabase's connection limit — this split is deliberate, not an inconsistency to "fix."
- **Business hours**: Bookings are restricted to **6:00 AM–10:00 PM Asia/Manila**, uniformly across all resource types (no per-sport variation). This is a hardcoded constant in `src/lib/business-hours.ts` (`BUSINESS_OPEN_HOUR`/`BUSINESS_CLOSE_HOUR`), not admin-editable yet — unlike `PricingRule`/`GuestFeeRule`, it isn't stored in the DB. Enforced server-side in `POST /api/bookings` (400 on any out-of-hours request, even bypassing the UI) and reflected client-side by `GET /api/availability` and the booking wizard's time-slot grid, which never generate out-of-hours candidates. Could move to a DB table following the `PricingRule` pattern later if admin editability is wanted.
- **`GET /api/availability`**: Public, no-auth endpoint (same trust level as `GET /api/resources`) that returns which time ranges are already occupied for a given `resourceId` + PH calendar `date`, so the booking wizard's time-slot grid can gray out unavailable slots before submit. Returns `{ busy: [{ start, end }] }` only — no pricing, no customer data. Uses the same "counts as occupying the slot" definition as booking creation (see `src/lib/booking-hold.ts` below), evaluated at request time, so a stale `pending_payment` hold correctly shows as available.
- **`src/lib/booking-hold.ts` extraction**: `HOLD_MINUTES` and the "is this booking currently holding/occupying its slot" condition (`confirmed`, or a `pending_payment` row younger than the hold window) were extracted out of `POST /api/bookings` into this shared file so `GET /api/availability` could reuse the exact same definition without duplicating it. Both routes import `HOLD_MINUTES` from here — this is what guarantees the hold window can never drift between "what counts as available" (availability endpoint) and "what actually gets held" (booking creation) if the env var or the logic ever changes.
- **PayMongo integration shape**: PayMongo Checkout Sessions (hosted, redirect-based) is the chosen integration — not raw Payment Intents + client-side Elements. `Payment` carries two PayMongo ids: `paymongoCheckoutSessionId` (set at checkout-session creation) and `paymongoPaymentIntentId` (resolved once payment completes, from the webhook payload). Bookings confirm only via a verified `payment.paid` webhook (HMAC-SHA256, `Paymongo-Signature` header) — this refines, not replaces, the existing "never confirm on client-side redirect" decision above. Because a PayMongo checkout session's own lifetime isn't guaranteed to match `BOOKING_HOLD_MINUTES`, whenever a stale `pending_payment` hold is cancelled (expire-on-write or the daily cron), its linked PayMongo checkout session is also actively expired via PayMongo's Expire Checkout Session endpoint (best-effort) — this closes the gap where a customer could pay into a slot that's already been released to someone else.
  - **Bugfix note (2026-08-12)**: the webhook route originally matched on event type `checkout_session.payment.paid`, which does not exist — real PayMongo deliveries send `payment.paid`. This went undetected because every prior VERIFY pass used self-signed test payloads that shared the same wrong assumption, never a real PayMongo delivery. It surfaced only once a genuine ngrok-captured GCash test payment came back as a silent 200 no-op instead of confirming the booking. Fixed the event-type check and every downstream field-extraction path to match the real payload shape (`route.ts`'s local interface documents the corrected shape). The real payload nests the payment object one level deeper than the route previously assumed:
    - Event type: `data.attributes.type` — match `'payment.paid'`, not `'checkout_session.payment.paid'`.
    - Payment fields all live under `data.attributes.data.attributes` (not `data.attributes.data` directly): `metadata.bookingId`, `status` (must equal `'paid'`), `payment_intent_id` (a flat string field, not a nested `payment_intent.id` object), and `paid_at` (Unix seconds — converted via `new Date(paid_at * 1000)`, previously the route ignored this field entirely and stamped `Payment.paidAt` with the webhook-processing server time instead of the actual payment time).
    - One specific booking (`cmsq31lm30001w4m8b045hv2f`) was left stranded `pending_payment` despite being genuinely paid on PayMongo's side, due to this bug; it was resolved by replaying its actual captured webhook delivery against the fixed endpoint, not by fabricating data.

---

## Scope & Future Extension

**Current build**: Booking system (tennis / pickleball / golf-sim) + Admin panel to manage it. This is the entire scope right now.

**Planned, not yet happening**: The client wants to extend this same platform with a POS system later. POS is **not** being built now — but the schema should be designed so that extension doesn't force a rewrite. Concretely:

- **Customer/User model**: Keep it generic enough that a future POS transaction and a booking can both reference the same customer record. Don't build booking-only customer fields that a shared customer model would later have to duplicate or migrate away from.
- **Payment/Transaction model**: PayMongo is shared ground between booking and POS. Keep payment records general (amount, method, status, reference) rather than booking-specific fields baked directly into a `BookingPayment`-style table, since POS sales will also need PayMongo transactions.
- **Admin panel / roles**: Since the admin panel is in scope now, design its permission/role model assuming more resource types will exist later (POS orders, inventory), even though only booking-related roles exist today.

**What NOT to do**: Don't create `Product`, `Inventory`, `POSOrder`, or any POS-specific tables now. That's premature scope creep. The goal is only to avoid painting the booking schema into a corner — not to pre-build POS.

---

## Coding Conventions

- **Prisma schema**: PascalCase model names, snake_case DB columns via `@map`, `cuid()` IDs, money fields as `Int` (centavos), required `createdAt`/`updatedAt` timestamps on all models — **except `BookingReschedule`**, which is `createdAt`-only by design (see "Architecture Decisions" for why).
- **New tables**: every new table must enable RLS with explicit deny-all policies for `anon` and `authenticated` in the same migration that creates it — see Architecture Decisions → Row Level Security. Don't defer this to a follow-up migration.
- **API routes**: Route handlers live under `src/app/api/`, return `Response.json(...)` with explicit status codes (400 validation, 401 auth, 409 conflict, 500 unexpected). Member status for pricing is always derived server-side (`Customer` → active `Membership` check), never trusted from the request body or a client session — this holds even once real Auth.js wiring for member login is built. A shared Prisma client singleton lives at `src/lib/prisma.ts`; future routes should import it rather than instantiating `new PrismaClient()` per-route.
- **Components**: Folder-per-feature under `src/components/` (e.g. `src/components/booking/`), PascalCase filenames matching the exported component (`BookingForm.tsx`, `BookingConfirmation.tsx`). Add `'use client'` at the top of any component that uses state, effects, or browser APIs; leave server components (e.g. page files that don't need interactivity) without it. Shared, non-component helpers (formatting, etc.) live under `src/lib/`.
- **Multi-step wizards**: Individual steps live in a `steps/` subfolder under the owning feature (e.g. `src/components/booking/steps/`), one component per step plus a `StepIndicator`. All wizard state (including the current step) is lifted to the top-level orchestrator component and passed down as props — steps themselves hold no state — so navigating Back and forward again never resets a previously entered value.
- **Error handling**: API routes return `Response.json({ error: '<message>' }, { status })` on failure — a single `error` string field, no nested error objects — using the status codes above (400/401/409/500). Client components that call these routes branch on `res.status` (not just `res.ok`) to distinguish expected outcomes (e.g. 409 conflict) from generic failures, surface `400` bodies by reading `json.error` directly into the UI, and fall back to a generic inline message for network errors or unexpected statuses — never a route change or thrown/uncaught exception, so the user's in-progress form state is preserved.
- **Auth.js config split (Edge Runtime)**: `middleware.ts` runs on Next.js's Edge Runtime, which can't load Node-only APIs — Prisma, or `crypto` (used by `src/lib/admin-auth.ts`'s password hashing/verification). Any config that touches those must live only in the full root `auth.ts` (which spreads `auth.config.ts` and adds the Credentials provider); the root `auth.config.ts` itself must stay edge-safe (`providers: []`, just `session`/`pages`). `middleware.ts` imports only `auth.config.ts` and builds its own lightweight `NextAuth(authConfig).auth` wrapper from it — it must never import `auth.ts` directly, since that would pull Prisma/`crypto` into the Edge bundle.
- **Dependency exceptions**: New dependencies are avoided by default. `next-auth@5` (beta) was installed 2026-08-19 as an explicit approved exception, scoped specifically to admin auth (Credentials provider + JWT sessions) — not a general policy change. Future dependency additions still need the same kind of explicit approval before installing.

---

## Claude Code Skills (`.claude/skills/`)

Use these when the task matches — don't reinvent what they already encode.

- **`paymongo-integration`** — Checkout Session creation, webhook HMAC-SHA256 confirmation, checkout-session-expiry-on-hold-expiry, centavos conversion. Use for anything touching payments or webhooks.
- **`booking-conflict-prevention`** — PostgreSQL exclusion constraint setup, hold-and-expire flow. Use for anything touching booking creation, availability, or scheduling logic. References the manual SQL file at `prisma/manual-sql/booking-exclusion-constraint.sql` as the source of truth for this constraint — any prompt using this skill must verify the constraint is present in the DB, not assume it survived a migration.
- **`prisma-schema-conventions`** — naming rules, centavos-as-Int, migration workflow. Use whenever editing `schema.prisma`.
- **UI/animation skills** (`emil-design-eng`, `apple-design`, `animate`, `review-animations`, `find-animation-opportunities`, `impeccable`, etc.) — general design/motion reference and audit tools installed via `npx skills`, not project-specific. Reach for these on visual polish passes (Home page, Book Now reskin); `impeccable`'s hook/image-gen features are off by default — see its own SKILL.md before enabling.

**Deliberately not built as skills**: git commit workflow and browser verification are handled manually (see Workflow section below) — an ambient skill here would conflict with that gate.

---

## MCP Servers

- **Supabase** — official, OAuth-authenticated, **read-only**, scoped to `project_ref=vsmjybtidvmzvicdpkdo`. Docs/database/debugging/development features only. Safe to commit config (no secrets in it).
- **Playwright** — official `@playwright/mcp`, project-scoped, for browser-based verification.
- **Context7** — for current Next.js/Prisma/PayMongo/Auth.js documentation lookups.
- **Resend** — official hosted MCP (`https://mcp.resend.com/mcp`), OAuth-authenticated, connected in both this planning chat and Claude Code CLI. Gives direct tool access to Resend's platform (send/list/cancel emails, delivery logs, domain verification, contacts, webhooks) — useful for VERIFY steps that previously required manually checking the Resend dashboard (e.g. the 2026-08-26 activation-email delivery confirmation).

---

## Environment Variables

Names and purpose only — actual values live in `.env.local` (never committed) and Vercel's Environment Variables settings.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres, pooled connection (port 6543, pgbouncer) — used at runtime |
| `DIRECT_URL` | Supabase Postgres, direct connection (port 5432) — used for Prisma migrations |
| `AUTH_SECRET` | Auth.js session encryption secret |
| `PAYMONGO_SECRET_KEY` | PayMongo server-side API key (test/live) |
| `PAYMONGO_PUBLIC_KEY` | PayMongo client-side key |
| `PAYMONGO_WEBHOOK_SECRET` | For verifying `payment.paid` webhook signatures |
| `RESEND_API_KEY` | Transactional email sending |
| `NEXT_PUBLIC_APP_URL` | Base app URL (differs local/staging/prod) |
| `SENTRY_DSN` | Error tracking |
| `BOOKING_HOLD_MINUTES` | Minutes a `pending_payment` booking is held before being treated as abandoned (default: `10`) |
| `CRON_SECRET` | Authenticates Vercel Cron invocations of `/api/cron/expire-bookings` (Vercel auto-sends it as `Authorization: Bearer <value>`) |
| `SUPABASE_URL` | Supabase project API URL — used server-side for Storage REST calls (membership application ID images) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — bypasses RLS/Storage policies; server-only, never exposed to the client |
| `MEMBER_ACTIVATION_TOKEN_HOURS` | Hours a `MemberActivationToken` (issued on membership approval) remains valid before expiring (default: `48`) |
| `PASSWORD_RESET_TOKEN_HOURS` | Hours a `PasswordResetToken` (issued on a forgot-password request) remains valid before expiring (default: `1`) |

---

## Development Workflow

This is Arjay's process — Claude Code should support it, not route around it:

1. Planning and prompt drafting happens in a dedicated Claude Project (this repo's context is attached there).
2. Finalized prompts are pasted into Claude Code, run against this local repo.
3. Output is manually reviewed and validated (including browser verification where relevant) — not auto-approved.
4. Git operations (`add`, `commit`, `push`) are done manually, not automated by Claude Code. Prompts that produce commits should end with an explicit git block for Arjay to review before running, not run automatically.

### Branch Promotion Policy

Promotion between branches is manual — no automated CI/CD merge gates.

- **`dev` → `staging`**: Merge once a change has passed local
  verification (per the VERIFY steps in its originating prompt). Push
  to `staging` manually.
- **`staging` → `main`**: Only after verifying against the deployed
  `staging` environment itself (not just local) — this is the last
  checkpoint before production, since `main` auto-deploys to Vercel
  Production.
- Claude Code never merges or pushes branches automatically — commands
  are prepared for Arjay to review and run manually, same as all other
  git operations.
- **Open question**: PayMongo key handling per environment (test keys
  on `staging`, live keys on `main`) is not yet confirmed — flag this
  before the first real promotion to `main` involving payments. See
  "Open / Not Yet Decided" for the current key-provenance detail
  (whose test keys are in use today and the required swap points).

**Commands** (fill in once scaffolded):
- Dev server: `npm run dev`
- Prisma migrate: `npm run db:migrate`
- Prisma studio: `npm run db:studio`
- Tests: TBD

Note: Prisma CLI commands are wrapped with `dotenv-cli` (`dotenv -e .env.local --`) because Prisma's CLI only auto-reads a file literally named `.env` — it does not read `.env.local` the way Next.js does at runtime. `.env.local` remains the single source of truth; do not create a second `.env` file.

Note: `prisma migrate dev`/`--create-only` will fail (P3006/P1014) against a fresh shadow database, because an earlier migration inserts into Supabase-managed `storage.buckets`, which doesn't exist in a vanilla shadow DB. Until this is resolved, hand-write migration SQL (same convention as the exclusion constraint/RLS migrations) and apply via `prisma migrate deploy`, which skips the shadow database.

Known issue: `middleware.ts` is effectively dead code locally right now — it does not appear to execute in this Next 16.3.0/Turbopack-on-Windows dev setup (confirmed via instrumentation logging zero invocations across a full debugging session). Any new route added under its matcher must include its own explicit auth check, never rely on the matcher alone. Worth re-verifying against `staging` before assuming this is dev-only.

---

## Open / Not Yet Decided

- PayMongo account not yet created by the client. In the meantime, the `PAYMONGO_SECRET_KEY` / `PAYMONGO_PUBLIC_KEY` / `PAYMONGO_WEBHOOK_SECRET` values currently in `.env.local` belong to Arjay's personal PayMongo test-mode account, used temporarily so PayMongo integration work can proceed without waiting on the client — these are test-mode credentials only, never live keys. Before promoting to `staging`, swap in the client's own PayMongo test keys once their account exists; before promoting to `main`, swap in the client's live keys. This swap must be explicitly confirmed as done before any promotion to `main` that touches payments.
- Membership payment ↔ Payment relationship: how (or whether) a PayMongo payment for membership activation/credit purchase links to the `Payment` model is undecided. The current schema draft omits this link entirely — `Payment.bookingId` remains the only relationship, scoped to bookings only. Revisit before building the membership payment flow.
- `payment_method_types` on checkout session creation: confirmed live (2026-08-12) via a real checkout session created directly against the PayMongo API — `card`, `gcash`, `grab_pay`, and `paymaya` are all enabled and selectable for Arjay's personal test account, so `src/lib/paymongo.ts` now requests all four rather than the previous hardcoded `['card']`-only placeholder. This is Arjay's personal test account, not the client's — the client's own PayMongo account may have a different enabled set, so re-verify once it exists (same swap point as the key-provenance item above).
- Member QR code (shown on `/account`): real encoding scheme/purpose (check-in token, credit redemption, static vs. rotating) not yet decided — current UI uses a placeholder value against a public QR-image API.
- Member-aware booking flow — `/book` currently only supports non-member pricing; Navbar's Book a Court is now hidden for logged-in members, with a placeholder-only entry point on `/account` instead. Needs its own design pass once member pricing in the booking wizard is scoped.