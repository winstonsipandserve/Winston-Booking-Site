# Database

How data is structured: models, enums, relationships, constraints, and the data-level rules that are easy to get wrong.

`prisma/schema.prisma` is the source of truth. This document explains it — it does not replace reading it.

**See also:** [architecture.md](architecture.md) (how the app is built) · [decisions.md](decisions.md) (why the schema looks like this) · [business.md](business.md) (the rules the data encodes)

---

## Ground Rules

- **27 models during the expand rollout.** PascalCase model names, snake_case database columns via `@map`, `cuid()` primary keys. Two of those models are the legacy `Bulletin` pair retained temporarily for rollback compatibility.
- **Money is always `Int` in centavos.** ₱100.00 is stored as `10000`. Never a float, anywhere.
- **`createdAt` / `updatedAt` on every model — except the immutable audit models**, which are `createdAt`-only by design (listed below).
- **Every new table must enable RLS with explicit deny-all policies** for the `anon` and `authenticated` roles, in the same migration that creates it. Never deferred to a follow-up.

---

## Read This Before Reporting On Money

**`Booking.totalAmountCentavos` is not what the customer paid.** It holds the base rate plus the guest fee only — **add-ons are excluded**, since they are priced per row on `BookingAddOn`.

The amount actually charged or redeemed is `bookingGrandTotalCentavos()` (`src/lib/booking-pricing.ts`), which is `totalAmountCentavos + sum(addOns[].amountCentavos)`.

Any query, export, or report that reads `totalAmountCentavos` as "what the customer paid" is **wrong for every booking with a ball boy or coaching**. This has already caused one staff-facing display bug.

### Reporting semantics

The payment method determines what a number means. Do not substitute a PayMongo settlement figure for a sale value, or assume that every paid record passed through PayMongo.

| Reporting measure | Include | Exclude / interpretation |
|---|---|---|
| **Booking revenue** | Every paid `Payment` with a `bookingId`, using `amountCentavos`, including `membership_credit` redemptions | This is the value of paid bookings. A credit redemption is included because the booking was paid, but it is not new cash received on that booking date. |
| **Membership revenue** | Paid `MembershipPayment` rows and paid `Payment` rows with a `membershipId` (credit top-ups), regardless of whether the method is PayMongo, cash, or manual online | A credit top-up is recorded as membership revenue when the credit is issued, not again as a new cash receipt when that credit pays for a booking. |
| **PayMongo net settlement** | `paymongoNetAmountCentavos` only for a paid `Payment` whose method is `paymongo` | This is the amount expected to settle after PayMongo fees, not the booking or top-up's gross value. `null` means not applicable or unavailable; display it as `N/A`/an em dash, never as zero. |
| **Counter cash / manual online** | Paid top-ups with method `cash` or `manual_online`, using `amountCentavos` | These have no PayMongo ID, fee, or net amount. They are internal records of payment received, not processor-settlement records. |

**Never add Booking Revenue and Membership Revenue to create a cash-collected total.** A member can first buy or receive credit through a membership payment or top-up, then redeem that same credit on a booking. Adding both amounts would count the same cash receipt twice. Keep booking/service value, membership/top-up receipts, credit redemptions, and PayMongo settlements as separate measures unless a reporting definition explicitly states how they are reconciled.

### Credit top-up evidence and reconciliation

- **Self-service top-ups** use PayMongo. The payment starts pending and becomes paid only through the verified webhook, which records the PayMongo identifiers, fee, and net amount, then writes the credit-ledger entry.
- **Admin-recorded cash top-ups** are recorded as paid immediately and require a staff note. **Admin-recorded manual-online top-ups** are likewise recorded as paid immediately and require an external payment reference. Both write a `top_up` credit-ledger entry and an immutable admin activity-log entry with the responsible admin and method.
- These admin records create an auditable system trail, but they do not independently verify a physical cash-drawer count or an external transfer. Counter-cash and manual-online totals must be reconciled against the cash drawer and bank/e-wallet evidence outside the system.

---

## Enums

| Enum | Values |
|---|---|
| `ResourceTypeSlug` | `tennis_court`, `pickleball_court`, `tennis_sim`, `pickleball_sim`, `golf_sim` |
| `ResourceCategory` | `court`, `simulator` |
| `RateTier` | `member`, `non_member` |
| `BookingStatus` | `pending_payment`, `confirmed`, `cancelled` |
| `ApplicationStatus` | `pending`, `approved`, `rejected` |
| `MembershipTier` | `three_month`, `six_month`, `twelve_month` |
| `MembershipStatus` | `active`, `expired` |
| `CreditTransactionReason` | `activation`, `renewal`, `booking_redemption`, `top_up` |
| `PaymentMethod` | `paymongo`, `membership_credit`, `cash`, `manual_online` |
| `PaymentStatus` | `pending`, `paid`, `failed` |
| `AdminRole` | `admin` (one value today, room for more) |
| `AddOnServiceSlug` | `coaching_fee`, `ball_boy` |
| `BulletinCategory` | `Renovation`, `Closure`, `Tournament`, `Community`, `General`, `FacilityMaintenance`, `Promotion` |
| `BulletinCustomerEligibility` | `Everyone`, `MembersOnly`, `NewCustomers`, `ReturningCustomers`, `SpecificMembershipTier` |
| `BulletinBookingImpact` | `NoImpact`, `LimitedAvailability`, `TemporarilyUnavailable`, `ScheduleChanges` |
| `BulletinCustomerAction` | `NoActionRequired`, `RescheduleBooking`, `ContactSupport`, `BookAnotherFacility`, `WaitForFurtherNotice` |
| `ResourceDisabledReason` | `manual`, `bulletin` |
| `AnnouncementUrgency` | `info`, `warning`, `urgent` |
| `NewsCategory` | `tournament`, `community`, `promo`, `general` |
| `NewsStatus` | `draft`, `published` |
| `AdminActivityAction` | `membership_application_approved`, `membership_application_rejected`, `membership_renewal_link_sent`, `booking_rescheduled`, `membership_credit_topup_added` |
| `AdminActivityEntityType` | `membership_application`, `booking`, `membership` |

`MembershipDisplayStatus` is **not** a database enum — it is a derived TypeScript union (`pending`, `awaiting_payment`, `active`, `expired`, `rejected`). See "Membership status" below.

---

## Resources & Pricing

**`ResourceType`** — the five bookable kinds, keyed by `slug` (unique). Carries `category` (court or simulator). Parent of resources, pricing rules, and add-on pricing rules.

**`Resource`** — a specific physical unit (Court 1, Bay 2), belonging to a `ResourceType`. Bookings reference a `Resource`, never a `ResourceType`.

- `isActive` — whether it can be booked.
- `disabledNote` — free-text admin note entered on a manual disable.
- `disabledReason` (`ResourceDisabledReason?`) — which mechanism most recently disabled it. Null whenever `isActive` is true; meaningful only when false.

> Naming trap: `disabledNote` is the free-text note, and `disabledReason` is the structured enum. The free-text column was originally named `disabledReason` and was renamed to free that name.

**`PricingRule`** — one row per valid resource-type / rate-tier / duration combination, unique on all three. Invalid combinations simply have no row. Admin-editable.

**`AddOnService`** / **`AddOnPricingRule`** — add-on catalog and its rates. The pricing rule is unique on service + resource type + rate tier + pax count. `paxCount` is null for services without a pax tier (ball boy); 1 or 2 for coaching on courts.

**`GuestFeeRule`** — its own table holding a single row with `amountCentavos`. Edit-only by design: no create, no delete.

> `guestFeeRule.findFirst()` is called without an `orderBy`, so the single-row assumption is not enforced at the schema level. A second row would make pricing nondeterministic. See [roadmap.md](roadmap.md).

---

## Customers & Authentication

**`Customer`** — one row per person, unique on `email`.

- `passwordHash` is **nullable** — null for a non-member row created from a booking's name/email/phone, set once a member activates. A customer with a password has a real login account.
- `checkInToken` (unique) and `checkInCode` (unique, 6 chars) are the front-desk check-in identifier pair. Always created and rotated **together**. Both nullable until first generated.
- **Resolved by look-up-or-create on `email`**, never blind-inserted.

**`AdminUser`** — individual staff accounts, unique on `email`. `isActive` gates both login and every existing session's next request. Referenced as a real foreign key by application reviews, reschedules, activity logs, admin-initiated renewal payments, and admin-logged top-ups — giving per-action accountability.

**Token models** — `MemberActivationToken`, `PasswordResetToken`, `AdminPasswordResetToken` all share the same shape: an owner foreign key, a unique `tokenHash`, `expiresAt`, and a nullable `usedAt`.

> **The raw token is never stored.** Only its SHA-256 hex digest goes in `tokenHash`.

**`AuthRateLimitAttempt`** — a short-lived, write-once abuse-control counter for member/admin login and password-reset requests. `scope` distinguishes the flow; `identifierHash` is an HMAC of either the normalized account identifier or client IP, never the raw value. It is indexed by `(scope, identifierHash, createdAt)` and cleaned up expire-on-write, so it is not an audit ledger.

**`CheckInLookupAttempt`** — a soft abuse counter for failed code lookups, indexed on `(adminUserId, createdAt)`, cascade-deleted with the admin. Write-once rows, cleared opportunistically once outside the rate-limit window. Not a financial or audit ledger, so it needs no locking guarantees.

---

## Bookings

**`Booking`**

- `customerId` is **nullable** — a hold is created and its reference shown to the customer *before* name/email/phone are collected. The customer attaches in a later step.
- `startTime` / `endTime` define the slot. `status` follows `pending_payment` → `confirmed` or `cancelled`.
- `totalAmountCentavos` — base rate + guest fee, **excluding add-ons** (see the warning above).
- `guestFeeAmountCentavos` — a snapshot of the guest fee actually charged, already *inside* `totalAmountCentavos`. It exists only so the fee can be broken back out for display, independent of any later rate edit.
- `customerNameSnapshot` / `customerPhoneSnapshot` — the name and phone actually submitted for *this specific booking*, independent of any later change to the shared customer row.
- `accessTokenHash` / `accessTokenExpiresAt` — the SHA-256 hash and expiry of the short-lived, anonymous-browser booking capability. The raw token is sent only as an HttpOnly, SameSite cookie and is never stored in the database or URL. Member bookings use the member session instead.

**Snapshot columns matter.** Every booking display surface — admin list and detail, the booking API, the confirmation page, both confirmation emails, and PayMongo billing — reads these snapshots rather than joining live to `Customer`. Membership application and approval displays deliberately still read the live customer record.

**Foreign key to `Customer` is `ON DELETE RESTRICT ON UPDATE CASCADE`.** A customer with any booking history cannot be deleted. This matches the app's disable-don't-delete precedent rather than silently detaching history via `SET NULL`. A future customer-delete feature must explicitly handle or reassign existing bookings.

**`BookingAddOn`** — the add-ons on a booking, each with an `amountCentavos` snapshot of the price actually charged, independent of future rate edits.

**`BookingReschedule`** — an immutable audit row per reschedule: original slot, new slot, reason, performing admin, timestamp. **No `updatedAt`; rows are never edited.** A wrong entry is corrected by inserting a new row, never by amending the original.

### The double-booking constraint

Overlap prevention is enforced **at the database level**, not in application code:

```sql
EXCLUDE USING gist (resource_id WITH =, tsrange(start_time, end_time) WITH &&)
  WHERE (status <> 'cancelled')
```

Prisma cannot express `EXCLUDE USING gist` natively, so this lives as raw SQL. The master copy is `prisma/manual-sql/booking-exclusion-constraint.sql`, applied by its own migration and depending on the `btree_gist` extension.

> **Any change touching `Booking` or running a migration must verify this constraint still exists** — query `pg_constraint`. It is named `booking_no_overlap`. There is no admin bypass.

Because the constraint ignores `cancelled` rows only, stale pending holds must be transactionally cancelled *before* a new insert. See [workflows.md](workflows.md).

---

## Payments

**`Payment`** — booking payments **and** membership credit top-ups.

- `bookingId` — nullable and **unique**. One payment per booking today; null is reserved for future POS transactions.
- `membershipId` — nullable and **not unique**, because a membership accrues many top-ups over its life. Set only on top-up rows.

> The two are mutually exclusive in practice: no row has both set, which is what lets booking revenue and membership revenue be reported without overlap.

- PayMongo identifiers, all nullable and unique: `paymongoCheckoutSessionId`, `paymongoPaymentIntentId` (`pi_xxx`), and `paymongoPaymentId` (`pay_xxx` — PayMongo's own payment resource, distinct from the intent, captured for staff cross-reference).
- `paymongoFeeCentavos` and `paymongoNetAmountCentavos` — PayMongo's combined fee and the amount that actually settles. **Null for credit-covered bookings and for any row predating these columns; not backfilled.**
- `externalReference` / `adminNote` / `initiatedByAdminId` — for admin-logged cash and manual-online top-ups. The note is required for cash top-ups, enforced at the API layer rather than the database.

**`MembershipPayment`** — tier activation and renewal payments, deliberately a **separate model** rather than a link off the booking-scoped `Payment`.

- No unique constraint on `applicationId`: multiple rows can exist per application over time, one per checkout attempt.
- `tier` and `amountCentavos` are a **priced snapshot at creation**, independent of later changes to the tier plans.
- `applicationId` is nullable, supporting self-service renewal (a renewal has no application).
- `initiatedByAdminId` is set only when an admin sends a manual renewal link.

---

## Membership & Credit

**`Membership`** — `tier`, `status`, `startDate`, `endDate`, `activationFeeCentavos`, and `creditBalanceCentavos`.

- `applicationId` is nullable and unique — null for renewals created without an application.
- `creditBalanceCentavos` is a **cached running total, not the source of truth.**
- `reminder14SentAt`, `reminder3SentAt`, `expiredNoticeSentAt` — each nullable timestamp is stamped once its email fires, so the reminders cron can never double-send to a row.

**`MembershipCreditTransaction`** — the actual source of truth for credit. Immutable, `createdAt`-only.

- `amountCentavos` is **positive for credits** (activation, renewal, top-up) and **negative for debits** (booking redemption), so `SUM(amountCentavos)` per membership always recovers the correct balance regardless of reason.
- `bookingId` is set only on `booking_redemption` rows; null otherwise.
- A future POS will add a further `reason` value, not a new table.

### Membership status — two rules coexist

This is a genuine subtlety worth knowing before writing any membership query.

| Function | Rule |
|---|---|
| `getMembershipDisplayStatus()` (`membership-display-status.ts`) | Application status wins for `pending`/`rejected`. An approved application with no membership row is `awaiting_payment`. Otherwise **`endDate >= now`** decides active vs expired. `Membership.status` is never consulted. |
| `isActiveMember()` / `getActiveMembership()` (`customer-resolution.ts`) | Requires **`status: 'active'` AND `endDate >= now`.** |

**Nothing in the codebase ever writes `status: 'expired'`** — only `active` is ever set. So the two rules agree today purely by accident. If an admin ever set a status manually, member pricing and credit redemption would stop working while the badge still read "Active Member". Tracked in [roadmap.md](roadmap.md).

Note also that `getLatestMembershipByCustomerId()` picks the latest membership by **`startDate`**, not `endDate` or `createdAt`.

---

## Announcements & News

**`Announcement`** — short operational content for the booking gate: `title`, plain-text `message`, `urgency`, `isActive`, `startAt`, optional `endAt`, and `autoDisableResources`. `createdById` is nullable only for migrated content; every new API write derives it from the active admin session. Active-window lookup is indexed on `isActive`, `startAt`, and `endAt`.

**`AnnouncementResource`** — the many-to-many link from an announcement to any court or simulator resource. The pair is unique and both foreign keys cascade-delete. Linking is informational unless `autoDisableResources` is true. The automatic disabled-reason value remains internally named `bulletin` during expand and is renamed only in the later contract migration.

**`NewsPost`** — editorial content with an immutable, unique generated `slug`; `title`; sanitized `bodyHtml`; optional `coverImageUrl`; `category`; optional `publishAt`; `status`; and `isFeatured`. New published posts require a cover in the API, while drafts and migrated legacy records may be coverless. Publication, featured ordering, and category lookups are indexed. `createdById` follows the same migration-only nullability rule as announcements.

**Legacy expand state.** `Bulletin` and `BulletinResource`, plus their old enums, remain in the schema only until staging and production verification completes. Application reads and writes no longer use them. The expand migration omits `[Sample]` titles, classifies non-sample rows into the new models, and preserves resource claims by creating an operational announcement when editorial content had linked resources or auto-disable enabled.

---

## Admin Activity Log

**`AdminActivityLog`** — immutable, `createdAt`-only, indexed on `adminId` and `createdAt`.

`entityId` is a **loose reference, deliberately not a real foreign key**, because this one table logs against several entity types. `metadata` is free-form JSON. The admin foreign key is `ON DELETE RESTRICT ON UPDATE CASCADE`.

---

## Immutable Audit Models

These four have **no `updatedAt`** and their rows are never edited. Corrections are always new rows.

- `BookingReschedule`
- `MembershipCreditTransaction`
- `AdminActivityLog`
- `CheckInLookupAttempt`
- `AnnouncementResource` (structurally immutable rather than an audit trail)
- `BulletinResource` (legacy expand-only)

---

## Row Level Security

All application tables have RLS enabled with explicit **deny-all** policies for the `anon` and `authenticated` Supabase roles.

The app's real access goes through Prisma using Supabase's privileged `postgres` role, which bypasses RLS — so these policies exist specifically to close off the Supabase anon-key REST API path, not to gate the application.

Master SQL: `prisma/manual-sql/enable-rls-deny-all.sql`.

> Any migration-touching work should verify policies still exist — query `pg_policies` and `pg_class.relrowsecurity`.

---

## Migrations

- Migrations live in `prisma/migrations/`. Hand-written SQL also keeps a readable master copy under `prisma/manual-sql/`.
- **Applied migration files are immutable.** Editing one changes its checksum and makes Prisma report the migration as modified on the next `migrate deploy`. If a `manual-sql` file and its migration mirror each other, changing one desyncs the pair.
- Because `prisma migrate dev` fails against a fresh shadow database in this project (see [architecture.md](architecture.md)), new migration SQL is hand-written and applied with `prisma migrate deploy`.

---

## Seed Data

`prisma/seed.ts` (`npm run db:seed`) is idempotent and seeds only reference configuration: the 5 resource types, 9 resources, 21 pricing rules, the ₱150 guest fee rule, 2 add-on services, and 16 add-on pricing rules. It creates no announcements or news posts. Exact reference-data values are in [business.md](business.md).

**The seed creates no admin user.** There is no reproducible admin bootstrap — admin accounts exist only in the live database. See [roadmap.md](roadmap.md).
