# PROGRESS.md

Build status and change log for Winston Sip and Serve. Updated as a standard part of every Claude Code prompt going forward — see CLAUDE.md's Development Workflow for the process this supports.

---

## Build Status

- Next.js scaffold: Done — TypeScript, Tailwind, App Router, npm
- CLAUDE.md: Done — identity, tech stack, locked architecture decisions (5 resource types), scope/future-extension plan, skills, MCP servers, env var reference, dev workflow, branch promotion policy, open items
- PROJECT_CONTEXT.md: Done — resource inventory, full pricing, guest fee rule, add-on services, membership tiers, membership application/approval flow, cancellation/reschedule policy, admin capabilities, bulletin
- Prisma schema: Done — 16 models, booking exclusion constraint (isolated migration), resource inventory seeded (pricing seeding deferred)
- Customer-facing booking flow: Not started
- Admin panel: Not started
- PayMongo payment integration: Not started
- Membership application + approval flow (implementation): Not started
- Bulletin/announcements (implementation): Not started
- Auth: Not started — method undecided (email/password vs. magic link)

## Completed Log

- 2026-08-10 — CLAUDE.md scaffolded: project identity, tech stack, locked architecture decisions, POS extension scope, dev workflow (`26c0991`)
- 2026-08-10 — Branch Promotion Policy added to CLAUDE.md (`c7e5c5c`)
- 2026-08-10 — PROJECT_CONTEXT.md created: resource types, membership, and cancellation rules finalized; pricing left pending client rate table (`0a4d4cc`)
- 2026-08-10 — PROJECT_CONTEXT.md updated with finalized pricing and add-on rate tables (`1e4daf4`)
- 2026-08-10 — PROGRESS.md created
- 2026-08-10 — CLAUDE.md + PROJECT_CONTEXT.md updated: pricing model confirmed as DB-driven (PricingRule/AddOnPricingRule), admin-editable via admin panel — added to Architecture Decisions and Admin Capabilities respectively
- 2026-08-10 — PROJECT_CONTEXT.md + CLAUDE.md updated: confirmed non-members book without an account (name/phone/email only), only members have login accounts — added Account Requirements section and Customer & auth model architecture note
- 2026-08-10 — CLAUDE.md + PROJECT_CONTEXT.md updated: MembershipApplication.customerId confirmed required (not nullable) — applications resolve to Customer via look-up-or-create by email at submission, same pattern as bookings
- 2026-08-10 — CLAUDE.md updated: admin login model resolved as individual staff logins (not shared account) — added AdminUser architecture note, removed resolved item from Open/Not Yet Decided; MembershipApplication.reviewedBy and BookingReschedule.performedBy will be real FKs, not strings
- 2026-08-10 — CLAUDE.md updated: documented safeguard for the booking-overlap exclusion constraint (Prisma can't express EXCLUDE USING gist natively) — master SQL will live at prisma/manual-sql/booking-exclusion-constraint.sql, and all future Booking/migration prompts must VERIFY the constraint still exists in the DB
- 2026-08-10 — CLAUDE.md updated: confirmed BookingReschedule is createdAt-only and immutable by design (audit trail integrity) — corrections are handled via a new row, not editing the original; added exception to Coding Conventions and new Architecture Decisions bullet
- 2026-08-10 — CLAUDE.md updated: Payment.bookingId confirmed as a direct nullable FK to Booking (not polymorphic) — documented as Architecture Decision, trades a small future migration for POS support in exchange for DB-enforced integrity now
- 2026-08-10 — CLAUDE.md updated: added MembershipCreditTransaction ledger model — Membership.creditBalanceCentavos is now a cached total backed by an immutable transaction log, POS-ready without pre-building spend logic
- 2026-08-10 — Next.js scaffold created (TypeScript, Tailwind, App Router, npm) — package.json now exists at repo root
- 2026-08-10 — CLAUDE.md + PROJECT_CONTEXT.md updated: guest fee rate confirmed as its own admin-editable GuestFeeRule table (not a PricingRule column, not hardcoded); membership payment ↔ Payment linkage flagged as still-open, added to Open/Not Yet Decided
- 2026-08-10 — Prisma schema created (16 models: ResourceType, Resource, PricingRule, GuestFeeRule, Customer, AdminUser, MembershipApplication, Membership, MembershipCreditTransaction, Booking, BookingReschedule, AddOnService, AddOnPricingRule, BookingAddOn, Payment, Bulletin) and initial migration applied; booking-overlap exclusion constraint (`booking_no_overlap`) applied via an isolated migration kept separate from `init`, master copy at `prisma/manual-sql/booking-exclusion-constraint.sql`; resource inventory seeded (5 ResourceType rows, 9 Resource rows — pricing tables intentionally left empty, deferred to a future prompt); CLAUDE.md Commands section updated so `db:migrate`/`db:studio`/`db:seed` wrap the Prisma CLI with `dotenv-cli` (`.env.local` isn't auto-read by the CLI). Note: installed Prisma pinned to 6.19.3, not latest 7.x — Prisma 7 removed inline `datasource url`/`directUrl` support (moved to a separate `prisma.config.ts`), which would have broken the schema shape this prompt specifies and CLAUDE.md's `DATABASE_URL`/`DIRECT_URL` env var table; flagging in case a deliberate Prisma 7 migration is wanted later. Resource labels ("Court 1", "Bay 1", etc.) are a reasonable default, not specified in PROJECT_CONTEXT.md — editable later via the admin panel.
- 2026-08-10 — Row Level Security enabled on all 16 application tables with explicit deny-all policies for the `anon` and `authenticated` Supabase roles, applied via an isolated migration (same pattern as the booking exclusion constraint), master SQL at `prisma/manual-sql/enable-rls-deny-all.sql`. `_prisma_migrations` deliberately left untouched (internal tracking table, not app data). CLAUDE.md updated with a new Row Level Security Architecture Decision and a Coding Conventions rule requiring RLS + deny-all policies on every future table's creating migration.
- 2026-08-11 — CLAUDE.md updated: booking hold duration (10 min, `BOOKING_HOLD_MINUTES` env var) and hybrid expiry mechanism (expire-on-write primary, daily Vercel cron sweep secondary) documented as a new Architecture Decision; env var added to the Environment Variables table.

## Next Up

- Booking-creation API route: availability check against the exclusion constraint, hold creation (`pending_payment` `Booking` row using `BOOKING_HOLD_MINUTES`), expire-on-write cancellation logic, plus a daily Vercel cron route for hygiene sweeping. API-route-only — no booking-form UI yet (UI is a separate follow-up prompt once concurrency-critical backend logic is verified).

## Open Decisions

See CLAUDE.md → "Open / Not Yet Decided" for the current list — not duplicated here to avoid two sources of truth.
