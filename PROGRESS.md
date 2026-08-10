# PROGRESS.md

Build status and change log for Winston Sip and Serve. Updated as a standard part of every Claude Code prompt going forward — see CLAUDE.md's Development Workflow for the process this supports.

---

## Build Status

- CLAUDE.md: Done — identity, tech stack, locked architecture decisions (5 resource types), scope/future-extension plan, skills, MCP servers, env var reference, dev workflow, branch promotion policy, open items
- PROJECT_CONTEXT.md: Done — resource inventory, full pricing, guest fee rule, add-on services, membership tiers, membership application/approval flow, cancellation/reschedule policy, admin capabilities, bulletin
- Prisma schema: Not started
- Customer-facing booking flow: Not started
- Admin panel: Not started
- PayMongo payment integration: Not started
- Membership application + approval flow (implementation): Not started
- Bulletin/announcements (implementation): Not started
- Auth: Not started — method undecided (email/password vs. magic link)

## Completed Log

- 2026-08-10 — CLAUDE.md scaffolded: project identity, tech stack, locked architecture decisions, POS extension scope, dev workflow (`26c0991`)
- 2026-08-10 — Branch Promotion Policy added to CLAUDE.md (`c7e5c5c`)
- 2026-08-10 — PROJECT_CONTEXT.md created: resource types, pricing, membership, and cancellation rules finalized (`0a4d4cc`)
- 2026-08-10 — PROJECT_CONTEXT.md updated with finalized pricing and add-on rate tables (`1e4daf4`)
- 2026-08-10 — PROGRESS.md created

## Next Up

- Core Prisma schema: ResourceType/Resource, Customer, Payment/Transaction, Booking (state machine + exclusion constraint), AddOnService/BookingAddOn, Membership, MembershipApplication, Bulletin

## Open Decisions

See CLAUDE.md → "Open / Not Yet Decided" for the current list — not duplicated here to avoid two sources of truth.
