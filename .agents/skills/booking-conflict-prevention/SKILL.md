---
name: booking-conflict-prevention
description: Double-booking-safe patterns for court/bay reservations across tennis, pickleball, and golf-sim resources. Use when building or modifying any code that creates, holds, confirms, cancels, or queries bookings — including admin manual bookings.
---

# Booking Conflict Prevention

Use this skill as a routing and verification checklist. The repository's shared documentation is authoritative; do not preserve generic booking assumptions or values in this skill.

## Read first

- [docs/decisions.md](../../../docs/decisions.md): database-enforced overlap prevention and the no-bypass decision.
- [docs/database.md](../../../docs/database.md): the current booking model, exact exclusion constraint, RLS requirements, and migration rules.
- [docs/workflows.md](../../../docs/workflows.md): anonymous/member booking creation, credit redemption, and hold expiry.
- [docs/architecture.md](../../../docs/architecture.md): API surface, runtime constraints, cron behavior, and development-environment caveats.
- [docs/development.md](../../../docs/development.md): approval gates and verification expectations.

Inspect the current schema, booking helpers, routes, and master SQL after reading those documents. If code and documentation disagree, report the mismatch rather than choosing silently.

## Checklist

- Keep the database as the final authority for overlap prevention; application availability checks exist for user experience, not race safety.
- Preserve one conflict definition across availability, booking creation, expiry, cancellation, rescheduling, and admin flows.
- Do not create an admin or alternate-path bypass around the database constraint.
- Handle the database conflict result as an expected application conflict while preserving the user's in-progress state.
- Preserve the documented interaction between pending holds, expire-on-write cleanup, scheduled cleanup, and payment-session expiry.
- For schema or migration work, use the exact current constraint name and predicate from `docs/database.md` and `prisma/manual-sql/`; never reconstruct them from memory.
- When the change touches bookings or migrations, verify the live exclusion constraint and RLS policies instead of assuming they survived.
- Obtain approval before changing booking-conflict logic or the database schema, as required by `docs/development.md`.
- Update the shared documentation in the same change if behavior or invariants change.
