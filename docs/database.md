# Database

How data is structured: models, enums, relationships, constraints, and the data-level rules that are easy to get wrong.

`prisma/schema.prisma` is the source of truth. This document explains it — it does not replace reading it.

> **Business rules changed on 21 September 2026.** Every item of the client update is now built; this document describes the application as it stands. [business.md](business.md) holds the rules.

**See also:** [architecture.md](architecture.md) (how the app is built) · [decisions.md](decisions.md) (why the schema looks like this) · [business.md](business.md) (the rules the data encodes)

---

## Ground Rules

- **28 models during the expand rollout.** PascalCase model names, snake_case database columns via `@map`, `cuid()` primary keys. Two of those models are the legacy `Bulletin` pair retained temporarily for rollback compatibility.
- **Money is always `Int` in centavos.** ₱100.00 is stored as `10000`. Never a float, anywhere.
- **`createdAt` / `updatedAt` on every model — except the immutable audit models**, which are `createdAt`-only by design (listed below).
- **Every new table must enable RLS with explicit deny-all policies** for the `anon` and `authenticated` roles, in the same migration that creates it. Never deferred to a follow-up.

---

## Read This Before Reporting On Money

**`Booking.totalAmountCentavos` is not what the customer paid.** It holds the base rate plus the guest fee only — **add-ons are excluded**, since they are priced per row on `BookingAddOn`.

The amount actually charged or redeemed is `bookingGrandTotalCentavos()` (`src/lib/booking-pricing.ts`), which is `totalAmountCentavos + sum(addOns[].amountCentavos)`.

Any query, export, or report that reads `totalAmountCentavos` as "what the customer paid" is **wrong for every booking with coaching**. This has already caused one staff-facing display bug.

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
| `ResourceTypeSlug` | `pickleball_court`, `tennis_sim`, `pickleball_sim`, `golf_sim`, `lounge`, `conference_room` |
| `ResourceCategory` | `court`, `simulator`, `space` |
| `RateTier` | `member`, `non_member` |
| `BookingStatus` | `pending_payment`, `confirmed`, `cancelled` |
| `ApplicationStatus` | `pending`, `approved`, `rejected` |
| `MembershipTier` | `player`, `premier`, `elite` |
| `CreditTransactionReason` | `booking_redemption`, `top_up` |
| `PaymentMethod` | `paymongo`, `membership_credit`, `cash`, `manual_online` |
| `PaymentStatus` | `pending`, `paid`, `failed` |
| `AdminRole` | `admin` (one value today, room for more) |
| `AddOnServiceSlug` | `coaching_fee` |
| `BulletinCategory` | `Renovation`, `Closure`, `Tournament`, `Community`, `General`, `FacilityMaintenance`, `Promotion` |
| `BulletinCustomerEligibility` | `Everyone`, `MembersOnly`, `NewCustomers`, `ReturningCustomers`, `SpecificMembershipTier` |
| `BulletinBookingImpact` | `NoImpact`, `LimitedAvailability`, `TemporarilyUnavailable`, `ScheduleChanges` |
| `BulletinCustomerAction` | `NoActionRequired`, `RescheduleBooking`, `ContactSupport`, `BookAnotherFacility`, `WaitForFurtherNotice` |
| `ResourceDisabledReason` | `manual`, `bulletin` |
| `AnnouncementUrgency` | `info`, `warning`, `urgent` |
| `NewsCategory` | `tournament`, `community`, `promo`, `general` |
| `NewsStatus` | `draft`, `published` |
| `AdminActivityAction` | `membership_application_approved`, `membership_application_rejected`, `membership_renewal_link_sent`, `member_activation_link_resent`, `membership_payment_link_resent`, `booking_rescheduled`, `membership_credit_topup_added`, `news_post_created`, `news_post_updated`, `news_post_deleted`, `announcement_created`, `announcement_updated`, `announcement_deleted` |
| `AdminActivityEntityType` | `membership_application`, `booking`, `membership`, `news_post`, `announcement` |

`MembershipDisplayStatus` is **not** a database enum — it is a derived TypeScript union (`pending`, `awaiting_payment`, `active`, `expired`, `rejected`). See "Membership status" below.

---

## Resources & Pricing

**`ResourceType`** — the six bookable kinds, keyed by `slug` (unique). Carries `category` (court, simulator, or space). Courts and spaces are priced hourly from a single 60-minute rule; simulators by duration tier. Spaces take no member discount and no birthday perk (`categoryHasMemberPricing`, `src/lib/booking-limits.ts`). Parent of resources, pricing rules, and add-on pricing rules.

**`Resource`** — a specific physical unit (Court 1, Bay 2), belonging to a `ResourceType`. Bookings reference a `Resource`, never a `ResourceType`.

- `isActive` — whether it can be booked.
- `disabledNote` — free-text admin note entered on a manual disable.
- `disabledReason` (`ResourceDisabledReason?`) — which mechanism most recently disabled it. Null whenever `isActive` is true; meaningful only when false.

> Naming trap: `disabledNote` is the free-text note, and `disabledReason` is the structured enum. The free-text column was originally named `disabledReason` and was renamed to free that name.

**`PricingRule`** — one **base** rate per valid resource-type / duration combination, unique on both. There is no rate-tier column: a member's price is the base rate less their tier's `bookingDiscountPercent` (`src/lib/membership-pricing.ts`), applied in `priceBooking`. Invalid combinations simply have no row. Admin-editable.

**`AddOnService`** / **`AddOnPricingRule`** — add-on catalog and its rates. The pricing rule is unique on service + resource type + rate tier + pax count. `paxCount` is null for simulator coaching (a single flat rate); 1 or 2 for coaching on courts. Coaching is the only add-on service.

**`GuestFeeRule`** — its own table holding a single row with `amountCentavos`. Edit-only by design: no create, no delete.

> The single-row assumption is not enforced at the schema level. Every reader goes through `getGuestFeeRule()` (`src/lib/guest-fee.ts`), which orders by `createdAt`, then `id`, so a stray second row can never make pricing nondeterministic — the oldest row always wins.

---

## Customers & Authentication

**`Customer`** — one row per person, unique on `email`.

- `passwordHash` is **nullable** — null for a non-member row created from a booking's name/email/phone, set once a member activates. A customer with a password has a real login account.
- `dateOfBirth` (`@db.Date`, nullable) — copied from the application when the activation payment is confirmed; drives the birthday-month court hour. Null for non-member rows. Read the month in UTC: a `DATE` comes back at UTC midnight and must never pass through a Manila conversion.
- `passwordChangedAt` — stamped by every password-setting route; sessions issued before it are rejected (see [architecture.md](architecture.md) → Authentication). `AdminUser` carries the same column.
- `checkInToken` (unique) and `checkInCode` (unique, 6 chars) are the front-desk check-in identifier pair. Always created and rotated **together**. Both nullable until first generated.
- **Resolved by look-up-or-create on `email`**, never blind-inserted.

**`AdminUser`** — individual staff accounts, unique on `email`. `isActive` gates both login and every existing session's next request. Referenced as a real foreign key by application reviews, reschedules, activity logs, admin-initiated renewal payments, and admin-logged top-ups — giving per-action accountability.

**Token models** — `MemberActivationToken`, `PasswordResetToken`, `AdminPasswordResetToken` all share the same shape: an owner foreign key, a unique `tokenHash`, `expiresAt`, and a nullable `usedAt`.

> **The raw token is never stored.** Only its SHA-256 hex digest goes in `tokenHash`.

**`MembershipPaymentLinkToken`** shares that same shape but gates two different emailed links, told apart by which of its two nullable, mutually-exclusive FKs is set — same choice already made for `Payment.bookingId`/`membershipId`, and for the same reason (real FK integrity per link kind) rather than a polymorphic reference or a second token table:

- `applicationId` set — gates `/membership/pay/[id]` and `POST /api/membership-payments` (the approval payment link).
- `membershipPaymentId` set — gates `/membership/renew/[id]` and `POST /api/membership-payments/[id]/checkout` (the admin-initiated renewal link). Self-service renewal (`/account/renew`) is gated by the member's own session instead and never touches this table.

One difference from the other three token models: `usedAt` here means *superseded by a resend*, never *consumed by a successful action* — a customer can make several checkout attempts on the same token before paying. Reuse after payment succeeds is blocked by the existing `application.membership` / `membershipPayment.status` checks, not by this table.

**`AuthRateLimitAttempt`** — a short-lived, write-once abuse-control counter for member/admin login, password-reset, and booking-hold requests. `scope` distinguishes the flow (the `booking_hold` and `membership_application` scopes key on member id and/or IP, see [workflows.md](workflows.md)); `identifierHash` is an HMAC of either the normalized account identifier or client IP, never the raw value. It is indexed by `(scope, identifierHash, createdAt)` and cleaned up expire-on-write, so it is not an audit ledger.

**`CheckInLookupAttempt`** — a soft abuse counter for failed code lookups, indexed on `(adminUserId, createdAt)`, cascade-deleted with the admin. Write-once rows, cleared opportunistically once outside the rate-limit window. Not a financial or audit ledger, so it needs no locking guarantees.

---

## Bookings

**`Booking`**

- `customerId` is **nullable** — a hold is created and its reference shown to the customer *before* name/email/phone are collected. The customer attaches in a later step.
- `startTime` / `endTime` define the slot. `status` follows `pending_payment` → `confirmed` or `cancelled`.
- `totalAmountCentavos` — discounted base rate + guest fee, **excluding add-ons** (see the warning above).
- `guestCount` — **counts non-member guests only.** A guest who is themself a Winston member is free, is never entered anywhere on the booking, and has no representation in this column or anywhere else in the schema; their membership is verified in person by staff at check-in, outside the booking system entirely. See [business.md](business.md) → Guest Fee.
- `guestFeeAmountCentavos` — a snapshot of the guest fee actually charged, already *inside* `totalAmountCentavos`. It exists only so the fee can be broken back out for display, independent of any later rate edit.
- `memberDiscountCentavos` — a snapshot of the tier discount already taken off inside `totalAmountCentavos` (0 for non-member bookings), so receipts can show the undiscounted rate and the discount line independent of later rate or tier changes. When `birthdayPerkApplied` is true it holds the birthday reduction instead (50% or 100% of the base rate).
- `guestPassesUsed` / `birthdayPerkApplied` — the perks redeemed on this booking. A term's remaining allowance is derived by summing/finding these over the member's slot-occupying bookings inside the term (`src/lib/member-perks.ts`); there is no counter on `Membership`, so an abandoned hold releases its perks automatically.
- `customerNameSnapshot` / `customerPhoneSnapshot` — the name and phone actually submitted for *this specific booking*, independent of any later change to the shared customer row.
- `accessTokenHash` / `accessTokenExpiresAt` — the SHA-256 hash and expiry of the short-lived, anonymous-browser booking capability. The raw token is sent only as an HttpOnly, SameSite cookie and is never stored in the database or URL. Member bookings use the member session instead.
- `holdClientHash` — HMAC of the client that created the hold (member id, or request IP for anonymous bookers), used only to cap live holds per client; indexed with `status` and `createdAt`. Nullable: null on rows created before the cap existed. See [workflows.md](workflows.md) → Hold abuse controls.

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

- `isFounding` — this payment belongs to a Founding Member. True either because it's the qualifying first-100 Premier activation (priced at ₱5,000) or because the customer already holds Founding status from an earlier term and is renewing Premier (priced at the standard ₱6,500 — the discount is a first-term perk only, see [business.md](business.md) → Founding Members). Decided when the row is created, under the advisory lock in `src/lib/membership-founding.ts`, and copied onto the `Membership` when the webhook confirms payment. An unpaid, newly-Founding-priced row created inside the payment-link lifetime (48 hours) holds a Founding seat; an existing Founding Member's standard-priced renewal does not consume a seat, since they already hold one.

- No unique constraint on `applicationId`: multiple rows can exist per application over time, one per checkout attempt.
- `tier` and `amountCentavos` are a **priced snapshot at creation**, independent of later changes to the tier plans.
- `applicationId` is nullable, supporting self-service renewal (a renewal has no application).
- `initiatedByAdminId` is set only when an admin sends a manual renewal link.

---

## Membership & Credit

**`Membership`** — `tier`, `isFounding`, `startDate`, `endDate`, and `creditBalanceCentavos`.

- `isFounding` — a permanent Founding Member flag (a flag, not a tier — see [decisions.md](decisions.md)), copied from the paying `MembershipPayment`. Stays true on every later Premier term that member takes, even once renewals are priced at the standard rate — only the discounted first-term price is one-time, not the flag. A renewal into Player or Elite does not carry the flag forward.
- There is no activation fee and no credit grant: the payment amount is the plan price in full, and `creditBalanceCentavos` starts at 0. Membership rows carry no `status` column; `endDate` alone decides liveness.

- `applicationId` is nullable and unique — null for renewals created without an application.
- `creditBalanceCentavos` is a **cached running total, not the source of truth.**
- `reminder14SentAt`, `reminder3SentAt`, `expiredNoticeSentAt` — each nullable timestamp is stamped once its email fires, so the reminders cron can never double-send to a row.

**`MembershipCreditTransaction`** — the actual source of truth for credit. Immutable, `createdAt`-only.

- `amountCentavos` is **positive for credits** (top-up) and **negative for debits** (booking redemption), so `SUM(amountCentavos)` per membership always recovers the correct balance regardless of reason.
- `bookingId` is set only on `booking_redemption` rows; null otherwise.
- A future POS will add a further `reason` value, not a new table.

### Membership status — one rule, one module

`endDate` alone decides whether a term is live. There is no status column on the row (the dead `Membership.status` column and its enum were dropped in `20260921020000_membership_tiers_reset`).

All row selection goes through `src/lib/membership-current.ts`:

| Helper | Rule |
|---|---|
| `getMembershipActiveAt(customerId, at)` | The row whose `startDate <= at <= endDate`. Bookings pass the slot start; everything else passes now. |
| `getCurrentMembership(customerId)` | The row covering now, else the one with the latest `endDate` (a queued renewal or the most recently lapsed term). This is what account, admin detail, check-in, and reapplication display. |
| `getLiveMemberships(customerId)` | Every row with `endDate >= now`, earliest first — the current term plus any queued renewal. |
| `getRenewalEligibility(customerId)` | No live row → eligible; one live row ending within `RENEWAL_WINDOW_DAYS` → eligible; otherwise `not_in_window` or `already_scheduled`. |

Ties are broken by `MEMBERSHIP_RELEVANCE_ORDER` (`endDate desc, startDate desc, id asc`), so a customer with two rows always resolves the same way. `getMembershipDisplayStatus()` layers application status on top: `pending`/`rejected` win, an approved application with no row is `awaiting_payment`, otherwise `endDate >= now`.

`endDate` for rows created after September 2026 is 23:59:59.999 Asia/Manila on the last day of the term (`computeMembershipEndDate`); older rows carry the exact PayMongo `paid_at` instant.

---

## Announcements & News

**`Announcement`** — short operational content for the booking gate: `title`, plain-text `message`, `urgency`, `isActive`, optional `announceAt`, `startAt`, optional `endAt`, and `autoDisableResources`. `startAt`–`endAt` is the operational window (when the closure or change applies and auto-disable may run). `announceAt` is an optional advance-notice date that must be on or before `startAt`; the notice is public from `announceAt ?? startAt`, and the API stores null when it equals `startAt`. `createdById` is nullable only for migrated content; every new API write derives it from the active admin session. Lookups are indexed on `isActive` + `startAt` + `endAt` and on `isActive` + `announceAt` + `endAt`.

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

`prisma/seed.ts` (`npm run db:seed`) is idempotent and seeds only reference configuration: the 6 resource types, 8 resources, 8 base pricing rules, the ₱100 guest fee rule, 1 add-on service, and 8 add-on pricing rules. It creates no announcements or news posts. Exact reference-data values are in [business.md](business.md).

**The seed creates no admin user.** There is no reproducible admin bootstrap — admin accounts exist only in the live database. See [roadmap.md](roadmap.md).
