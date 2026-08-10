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
| Framework | Next.js (App Router) + TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Auth.js — method TBD (email/password vs. magic link, decision pending) |
| Payments | PayMongo (Payment Intents API) |
| Email | Resend |
| Hosting | Vercel |
| Error tracking | Sentry |

---

## Architecture Decisions

These are locked in. Don't deviate without discussing first.

- **Resource model**: `ResourceType` contains individual `Resource` records (specific court/bay) — one unified system, not per-sport tables. There are 5 resource types: `tennis-court`, `pickleball-court`, `tennis-sim`, `pickleball-sim`, `golf-sim`. Current inventory: 1 tennis court, 3 pickleball courts, 1 tennis simulator, 2 pickleball simulators, 2 golf simulators.
- **Double-booking prevention**: Enforced at the database level via a PostgreSQL exclusion constraint on overlapping `tsrange` (using `btree_gist`), combined with a pending-hold-and-expire flow. This is **not** an application-level check — there is no admin bypass. Prisma has no native syntax for `EXCLUDE USING gist`, so this constraint is written as raw SQL and its master copy will live at `prisma/manual-sql/booking-exclusion-constraint.sql` (created when the Prisma schema is first generated) — not buried inside a single migration file where it could be missed or lost on a reset. Any future prompt that touches `Booking` or runs a migration must include a VERIFY step confirming this constraint still exists in the database (e.g. a query against `pg_constraint`).
- **Booking confirmation**: A booking only flips to `confirmed` on a verified PayMongo `payment.paid` webhook (HMAC-SHA256 signature verified). Never confirm on client-side redirect.
- **Money**: Stored as `Int` in centavos everywhere, matching PayMongo's native format. Never use floats for currency.
- **Booking state machine**: `pending_payment` → `confirmed` (webhook) or `cancelled` (hold expiry / failed payment).
- **Pricing model**: Prices are stored in the database (`PricingRule` for court/simulator rates, `AddOnPricingRule` for coaching fee / ball boy rates) rather than hardcoded in application code. This lets admin edit prices via the admin panel without a code deploy. Each row is an explicit combination of resource type, member/non-member rate, and duration tier — invalid combinations (e.g. non-member golf-sim 30-min) simply have no row, rather than existing with a null or zero price.
- **Customer & auth model**: `Customer` records carry no auth fields (no password, no login) — they're created from name/email/phone at booking time for non-members, who never need an account. Only members log in; that account will link to `Customer` once Auth.js's method is decided (see "Open / Not Yet Decided") — this doesn't block current schema work. Since bookings can repeat with the same email and `Customer.email` is unique, booking creation must look up-or-create `Customer` by email, not blind-insert. Membership applications follow the same rule: at submission, `MembershipApplication.customerId` is resolved via look-up-or-create by email (never nullable, never blind-insert) — so an applicant who never booked before still gets a `Customer` row at application time, and one who already has a `Customer` (from a prior booking) is matched to it instead of duplicated.
- **Admin/staff model**: Admin panel uses individual staff logins, not a single shared account — multiple staff can hold the same (currently only) admin role. This requires an `AdminUser` model; `MembershipApplication.reviewedBy` and `BookingReschedule.performedBy` are real foreign keys to this table (not plain strings), giving per-action accountability. `AdminUser` carries no auth fields yet (no password/session handling) — that's deferred until Auth.js's method is decided (see "Open / Not Yet Decided"), same deferral pattern as `Customer`. `role` is modeled as an enum with a single value today, leaving room for more admin roles later without restructuring.
- **`BookingReschedule` immutability**: This model has no `updatedAt` and its rows are never edited after creation — each row is a permanent audit entry (original slot, new slot, reason, admin, timestamp), not a mutable record. If a logged reschedule entry is ever wrong (e.g. admin typo), the fix is to insert a new correcting row, never to edit the original — the log must show what was actually recorded and when, not a silently revised version of events.
- **`Payment` ↔ `Booking` relationship**: `Payment.bookingId` is a direct, nullable foreign key to `Booking` (not a polymorphic/generic reference). Nullable because a future POS transaction will also create a `Payment` row with no `Booking` attached. This trades a small future migration (adding a `posOrderId` column to `Payment` once POS is built) for real database-enforced referential integrity now — chosen deliberately over a polymorphic `referenceType`/`referenceId` pattern, since `Payment` handles real money and the FK guarantee outweighs saving one future migration.

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
- **API routes**: [fill in once scaffolded — route structure, response shape conventions]
- **Components**: [fill in once scaffolded — folder structure, naming]
- **Error handling**: [fill in once a pattern is established]

---

## Claude Code Skills (`.claude/skills/`)

Use these when the task matches — don't reinvent what they already encode.

- **`paymongo-integration`** — full Payment Intent flow, webhook HMAC-SHA256 verification, raw body handling, centavos conversion, reconciliation fallback. Use for anything touching payments or webhooks.
- **`booking-conflict-prevention`** — PostgreSQL exclusion constraint setup, hold-and-expire flow. Use for anything touching booking creation, availability, or scheduling logic. References the manual SQL file at `prisma/manual-sql/booking-exclusion-constraint.sql` as the source of truth for this constraint — any prompt using this skill must verify the constraint is present in the DB, not assume it survived a migration.
- **`prisma-schema-conventions`** — naming rules, centavos-as-Int, migration workflow. Use whenever editing `schema.prisma`.

**Deliberately not built as skills**: git commit workflow and browser verification are handled manually (see Workflow section below) — an ambient skill here would conflict with that gate.

---

## MCP Servers

- **Supabase** — official, OAuth-authenticated, **read-only**, scoped to `project_ref=vsmjybtidvmzvicdpkdo`. Docs/database/debugging/development features only. Safe to commit config (no secrets in it).
- **Playwright** — official `@playwright/mcp`, project-scoped, for browser-based verification.
- **Context7** — for current Next.js/Prisma/PayMongo/Auth.js documentation lookups.

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
  before the first real promotion to `main` involving payments.

**Commands** (fill in once scaffolded):
- Dev server: `npm run dev`
- Prisma migrate: `npx prisma migrate dev`
- Prisma studio: `npx prisma studio`
- Tests: TBD

---

## Open / Not Yet Decided

- Auth method: email/password vs. magic link
- Domain + DNS not yet set up
- PayMongo account not yet created by client (test keys pending)