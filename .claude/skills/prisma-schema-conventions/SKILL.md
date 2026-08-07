---
name: prisma-schema-conventions
description: Naming, typing, and migration conventions for the Prisma schema on this project. Use when creating or modifying any Prisma model, running migrations, or writing raw SQL against the database.
---

# Prisma Schema Conventions

## Naming
- Model names: PascalCase, singular — `User`, `Booking`, `Resource`, `ResourceType`, `MembershipTier`, `Payment`.
- Field names in schema.prisma: camelCase — `startTime`, `resourceId`, `holdExpiresAt`.
- Map every field and model to snake_case columns/tables explicitly, so raw SQL (like the exclusion constraint in `booking-conflict-prevention`) lines up exactly with what Prisma generates:

```prisma
model Booking {
  id            String   @id @default(cuid())
  resourceId    String   @map("resource_id")
  startTime     DateTime @map("start_time")
  endTime       DateTime @map("end_time")
  status        BookingStatus
  holdExpiresAt DateTime? @map("hold_expires_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("bookings")
}
```

- IDs: `cuid()`, not auto-increment integers — avoids exposing sequential booking counts to users.

## Money
- Store all monetary amounts as `Int`, in centavos — never `Float` or `Decimal` for currency, and never store pesos as a whole-number-with-implied-decimals. This matches PayMongo's own amount format, so no conversion bugs at the API boundary (see `paymongo-integration`).

## Enums over free-text strings
Use Prisma enums for anything with a fixed set of states — don't use plain strings for these:
```prisma
enum BookingStatus {
  pending_payment
  confirmed
  cancelled
  completed
}

enum ResourceCategory {
  tennis
  pickleball
  golf_sim
}
```

## Timestamps
Every model gets `createdAt` (`@default(now())`) and `updatedAt` (`@updatedAt`). Non-negotiable — needed for admin dashboard sorting/filtering and debugging.

## Relations
- Name foreign key fields as `<model>Id` (e.g., `resourceId`, `userId`, `membershipTierId`).
- Always add an explicit `@@index` on foreign keys used in frequent lookups — at minimum, `[resourceId, startTime]` on `Booking` for availability queries, and `email` (unique) on `User`.

## Migration workflow
- Standard schema changes: `npx prisma migrate dev --name <descriptive_name>`.
- Anything requiring raw SQL Prisma can't express (exclusion constraints, extensions like `btree_gist`): `npx prisma migrate dev --create-only --name <name>`, then hand-edit the generated SQL file before applying, per `booking-conflict-prevention`.
- Never use `prisma db push` on this project once we have real data — it can silently drop columns. Migrations only, from day one.
- Migration names: snake_case, descriptive of the change — `add_hold_expires_at_to_bookings`, not `update1`.

## Soft delete vs hard delete
- Bookings and Users: never hard-deleted. Cancelled bookings keep `status = cancelled` and stay in the table for history/reporting. Deactivated users get a `deactivatedAt` timestamp, not a row deletion.
- Reference data (ResourceType, Resource) can be soft-deleted the same way if a court/bay is retired, so historical bookings still resolve correctly.

## Before implementing
If the change adds or modifies a model, apply the naming/mapping/enum rules above before generating the migration. If it touches money fields or the Booking model specifically, cross-check against `paymongo-integration` and `booking-conflict-prevention` for consistency.