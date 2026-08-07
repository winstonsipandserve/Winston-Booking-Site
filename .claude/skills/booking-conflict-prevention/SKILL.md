---
name: booking-conflict-prevention
description: Double-booking-safe patterns for court/bay reservations across tennis, pickleball, and golf-sim resources. Use when building or modifying any code that creates, holds, confirms, cancels, or queries bookings — including admin manual bookings.
---

# Booking Conflict Prevention

## Resource model
- `ResourceType` (tennis / pickleball / golf-sim) defines rules: slot duration, pricing, operating hours.
- `Resource` is a specific bookable unit (Court 1, Bay 2) belonging to a `ResourceType`.
- Every booking references a single `Resource`, never a `ResourceType` directly — conflicts are checked per physical resource, not per sport.

## The core rule
Never rely on an application-level "check then insert" for conflict detection alone — two requests can pass the check simultaneously and both insert. The database must be the final authority.

## Required DB-level guard
Use a Postgres exclusion constraint on the bookings table to make overlapping ranges physically impossible for the same resource:

```sql
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    resource_id WITH =,
    tsrange(start_time, end_time) WITH &&
  )
  WHERE (status IN ('pending_payment', 'confirmed'));
```

- The `WHERE` clause is important — cancelled/expired bookings must NOT be included, or they'd block the slot forever.
- Prisma can't express this constraint directly — add it via a raw SQL migration (`prisma migrate dev --create-only`, then edit the generated SQL file before applying).
- Requires the `btree_gist` extension enabled on the database.

## Application-level check (for UX, not safety)
Still query for conflicts before attempting the insert, so the user gets a clean "slot no longer available" message instead of a raw DB constraint error. But always wrap the actual booking creation in a try/catch for the constraint violation too — the app-level check can still lose a race.

## Hold-and-expire flow
1. Booking created → status `pending_payment`, with `hold_expires_at` set (e.g., now + 5 minutes).
2. If PayMongo confirms payment before expiry → status `confirmed`, `hold_expires_at` cleared.
3. If `hold_expires_at` passes with no confirmation → status `cancelled`, slot released. Run this via a scheduled job (Vercel Cron), not on-demand — don't rely on a user's next page load to trigger cleanup.
4. See the `paymongo-integration` skill for exactly which webhook event triggers the confirm step.

## Admin manual bookings (walk-ins / phone bookings)
Must go through the same creation path and the same DB constraint — no special bypass table or logic. Admin bookings can skip the payment hold step (mark `confirmed` immediately if paid in person) but still respect the exclusion constraint.

## Per-resource-type duration rules
Slot duration is NOT hardcoded globally — it's a property of `ResourceType` (e.g., tennis/pickleball in 30–60 min blocks, golf-sim in 60 min blocks). Any booking-creation code must read the duration/interval rule from the resource's type, not assume a fixed value.

## Before implementing
If the change touches booking creation, cancellation, or availability queries, confirm it respects the exclusion constraint and the hold-expiry flow above before writing code. Flag any request that seems to require bypassing either.