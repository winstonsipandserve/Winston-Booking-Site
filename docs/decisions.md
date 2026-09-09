# Decisions

Locked-in choices and the reasoning behind them. **Do not deviate from these without discussing it first** — several exist because the obvious alternative caused a real problem.

Each entry states the decision, why, and what breaks if it is undone.

**See also:** [architecture.md](architecture.md) · [database.md](database.md) · [workflows.md](workflows.md) · [roadmap.md](roadmap.md) (what is still undecided)

---

## Data & Correctness

### Double-booking is prevented by the database, not the application

A PostgreSQL exclusion constraint on overlapping time ranges per resource, using `btree_gist`, combined with the hold-and-expire flow.

**Why:** an application-level check-then-insert can be passed by two concurrent requests, and both then insert. The database must be the final authority.

**Consequences:** there is **no admin bypass**. Prisma cannot express the constraint, so it lives as raw SQL with a master copy under `prisma/manual-sql/`. Any migration or change touching bookings must verify the constraint still exists.

### A booking is confirmed only by a verified webhook

Never on the client-side redirect back from PayMongo.

**Why:** a customer can close the browser before returning. The redirect proves nothing.

**The one exception** is a credit-covered booking, where no payment processor is involved at all — confirmation happens via an atomic credit decrement inside the booking's own transaction.

### Money is always an integer of centavos

Never a float, anywhere — storage, computation, or transport.

**Why:** it matches PayMongo's native format exactly, and floats cannot represent currency reliably.

### Snapshot what was actually charged

Several columns deliberately duplicate data that could otherwise be recomputed: the guest fee charged, each add-on's price, and the customer's name and phone at booking time.

**Why:** rates are admin-editable and customer records change. Without snapshots, editing a rate would retroactively rewrite the history of every past booking, and a later booking under a shared email could overwrite an earlier one's contact details.

**Consequence:** display surfaces read snapshots, not live joins. This is not redundancy to clean up.

### Customer records are never blind-inserted

Always look-up-or-create on the unique email.

Related rule: a customer's name and phone are only overwritten on mismatch **while they have no password**. Once someone has a real login account, a mismatched anonymous booking under their email can never overwrite their profile.

### Disable, do not delete

The booking foreign key to customer is `ON DELETE RESTRICT`, so a customer with booking history cannot be deleted.

**Why:** it matches the precedent set by resource deactivation, and it is safer than silently detaching history with `SET NULL`. A future customer-delete feature must handle existing bookings explicitly rather than relying on cascade behaviour.

### The credit ledger is the source of truth, not the balance

The cached balance on a membership exists for fast reads. The immutable transaction ledger is authoritative, with positive amounts for credits and negative for debits, so summing always recovers the true balance.

**Why:** a cached counter alone cannot be audited or repaired. A future POS will add a ledger *reason*, not a new table.

### Audit rows are immutable

Reschedules, credit transactions, and activity log entries have no `updatedAt` and are never edited. A wrong entry is corrected by inserting a new row.

---

## Modelling

### One unified resource model

`ResourceType` contains individual `Resource` records, rather than per-sport tables.

**Why:** conflicts are checked per physical unit, and adding a sport should not mean adding a table.

### Pricing lives in the database, gated by an allow-list

Rates are admin-editable rows, one per explicit resource-type / rate-tier / duration combination. Invalid combinations simply have no row.

The allow-list of valid combinations is a **single source of truth in code**, enforced both server-side (invalid combinations are rejected with a 400) and client-side (no "+ Add" control is rendered for a cell the allow-list does not cover).

**Why:** the client changes prices; that must not require a deploy. But the shape of what *can* be priced is a business decision, not a free-for-all.

**Membership tier prices are the deliberate exception** — fixed in code, not admin-editable.

### The guest fee gets its own table

Rather than a column on the pricing rules or a hardcoded constant.

**Why:** it keeps the fee admin-editable without conflating it with duration-tiered pricing rows, and the table shape leaves room for future per-sport variation without restructuring. It is edit-only — no create, no delete — permanently.

### Membership payments are a separate model from booking payments

Rather than adding an application foreign key to the booking-scoped payment table.

**Why:** the payment table stays booking-scoped and, later, POS-scoped. Membership activation and renewal have a different lifecycle — multiple checkout attempts per application, priced snapshots, and renewals with no application at all.

**But credit top-ups** *do* live on the payment table, with a nullable non-unique membership reference — because a top-up is a straightforward payment against a membership, and keeping it there is what lets revenue reporting treat bookings and memberships as two non-overlapping buckets.

### The payment table has a nullable booking reference, reserved for POS

Chosen over a polymorphic reference-type/reference-id pattern.

**Why:** real database-enforced referential integrity. A future POS transaction will create a payment with no booking attached.

---

## Pricing & Access

### The anonymous path never grants member rates

Booking is priced twice on the anonymous path: provisionally at hold creation, then finalized at customer attachment — **both always at the non-member rate**, regardless of whether the resolved customer is actually a member.

**Why this matters:** knowing a member's email must never be sufficient to obtain member pricing or spend their credit. Member benefits require an authenticated session.

The customer is still resolved and attached, so the booking appears in that person's history once they log in.

### One `/book` route serves everyone

Not a separate member route. The session is read server-side and drives whether pricing is single-phase at the member rate or two-phase at the non-member rate.

### Credit redemption is full-coverage or nothing

If the balance covers the entire total, the booking is paid entirely from credit. If not, credit is untouched and the member pays the full amount by card.

**Why:** partial redemption means reconciling a split payment across two systems, with a partial-failure mode in the middle. Not worth the complexity for the value it adds.

### Member status is checked server-side, always

Never trusted from a request body or a client session claim. This holds regardless of how auth evolves.

### Admin gating goes through one shared helper

Every admin page and API route calls the same function, which re-checks the admin's active flag against the database on **every request** — not just at login.

**Why:** deactivating an admin must reject their already-open session immediately, not at their next sign-in.

### Manual always wins over automation

For resource disabling: a manual admin decision always overrides a bulletin's automatic claim, and releasing a bulletin's claim never steals back a manually disabled resource.

**Why:** staff acting deliberately at the venue must not be silently overridden by a scheduled rule.

---

## Scope

### Do not build POS tables now

The client wants a POS extension on this platform later. **Do not create product, inventory, or order tables.** That is premature scope creep.

The goal is only to avoid painting the schema into a corner. Concretely, three things must stay general:

- **Customer** — generic enough that a POS transaction and a booking can reference the same record. No booking-only customer fields a shared model would later have to migrate away from.
- **Payment** — general (amount, method, status, reference) rather than booking-specific fields baked in. Already satisfied by the nullable booking reference.
- **Admin roles** — the role model assumes more resource types will exist later, even though only booking-related roles exist today.

### The admin panel is tablet-and-up only

No mobile-width support is planned. It is a staff tool used on tablets and desktops in practice, not a public surface.

**Consequence:** verification for admin work should not budget a mobile-width check by default. The public site and member account remain fully mobile-responsive — this decision does not touch them.

---

## Design System

These are locked. Read them before any visual work rather than re-deriving a palette per task.

### Public-site colour tokens

Defined as Tailwind v4 `@theme` tokens in `globals.css`. Every component reads the tokens; **never hardcode a hex value.**

| Token | Value | Role |
|---|---|---|
| `--color-brand-dark` | `#321E1E` | Dominant |
| `--color-brand-mid` | `#4E3636` | Secondary |
| `--color-accent-primary` | `#CD1818` | Primary call-to-action — used sparingly |
| `--color-accent-teal` | `#116D6E` | Tertiary — only the café/bar mode toggle and membership tier checkmarks |

`--color-brand-light` / `--color-accent-light` (cream) are unchanged. **The admin panel intentionally stays neutral grey and does not use these tokens.**

### Corner-radius scale

A small, deliberate scale as `@theme` tokens, plus Tailwind's own `rounded-none` and `rounded-full`.

| Token | Size | Applied to |
|---|---|---|
| `--radius-input` | 8px | Text, email, and password inputs |
| `--radius-card-inline` | 12px | Nested inline notices, inset thumbnails |
| `--radius-card` | 16px | Primary content cards, modal dialogs (brand variant), image tiles |
| `rounded-none` | — | Buttons, calls to action, and every booking-wizard selector chip |
| `rounded-full` | — | Badges, pills, step-indicator dots |

No exceptions remain sitewide. The admin panel is untouched by this scale.

### Admin dark mode

A per-admin preference stored in browser local storage (`light` / `dark` / `system`, defaulting to `system`) — **not a database column.**

Tailwind v4's dark variant is class-based, driven by a class on the root element set by an inline no-flash script whose literal content lives in one shared constant. A layout-effect safety net handles soft client-side navigations, since React does not execute a rendered script tag. The root element carries a hydration-warning suppression for this reason.

The admin main region stays light unconditionally. A page needing its own dark background uses the **overlay pattern**: an isolated relative wrapper plus a hidden, pointer-events-none absolute sibling rendered first that appears only in dark mode.

**Use this token mapping rather than inventing one:**

| Element | Light | Dark |
|---|---|---|
| Page shell background | `bg-gray-50` | `dark:bg-gray-950` |
| Card/panel surface | `bg-white` | `dark:bg-gray-900` |
| Card/panel border | `border-gray-200` | `dark:border-gray-800` |
| Nested/inset border | `border-gray-200` | `dark:border-gray-700` |
| Primary text | `text-gray-900` | `dark:text-gray-100` |
| Muted/secondary text | `text-gray-500` / `text-gray-600` | `dark:text-gray-400` / `dark:text-gray-300` |
| Secondary/label text | `text-gray-700` | `dark:text-gray-300` |
| Faint/tertiary text | `text-gray-400` / `text-gray-300` | `dark:text-gray-500` / `dark:text-gray-600` |
| Active/selected button | `bg-gray-900 text-white` | `dark:bg-gray-100 dark:text-gray-900` |
| Outline/cancel button | `border-gray-200 text-gray-600 hover:bg-gray-50` | `dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800` |
| Danger button | `bg-red-600 hover:bg-red-700` | `dark:bg-red-600 dark:hover:bg-red-500` |
| Form input | `border-gray-200 bg-white text-gray-900` | `dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100` |
| Avatar/icon circle | `bg-gray-200 text-gray-700` | `dark:bg-gray-700 dark:text-gray-200` |
| Hairline border | `border-gray-100` / `divide-gray-100` | `dark:border-gray-800` |
| Bold outline border | `border-gray-300` | `dark:border-gray-600` |
| Inset/placeholder fill | `bg-gray-50` / `bg-gray-100` | `dark:bg-gray-800` |
| Neutral pill | `bg-gray-100` + matching muted text | `dark:bg-gray-800` + matching muted text |
| Error/danger text | `text-red-600` | `dark:text-red-400` |

A sticky table header on `bg-gray-50` aliases to the card-surface row, not a new token, since it sits inside a card rather than being the page shell.

**Locked per-surface semantic exceptions** — each keeps its light colour and adds a muted dark pairing. None of these are general tokens:

- The resource Active badge (green).
- Membership status badges and the Approve/Reject buttons.
- The four check-in result states: not-found and rate-limited (red), no-membership (grey), expired (amber).

> Separately: do not use Tailwind's default green-100/800 for status badges generally. That is a different convention from the palette above.

### The navbar pattern

The navbar is fixed and transparent (with light text) until scrolled, tuned for a dark photographic hero directly beneath it.

A page whose top section is a plain light background needs **one of two fixes**:

1. Give it a dark band directly below the navbar, using the established padding pattern.
2. For a page with no hero at all, add its route to the force-solid list, making the header permanently solid instead of scroll-conditional.

---

## Dependencies

**New dependencies are avoided by default.** Every addition needs explicit approval before installing. Five exceptions have been granted, each scoped narrowly and none of them a general policy change:

| Package | Scoped to |
|---|---|
| `next-auth@5` (beta) | Auth — Credentials providers and JWT sessions |
| `recharts` | The admin dashboard charts only |
| `qrcode` (+ `@types/qrcode`) | Member check-in QR generation only |
| `html5-qrcode` | The admin check-in camera scanner only |
| `@react-pdf/renderer` | The membership certificate PDF only |

The certificate PDF registers a real font rather than using the built-in Helvetica, because Helvetica's base-14 encoding has no glyph for the peso sign.

> **"Approved by Admin" on the certificate is an intentional static label**, not a bug. It is deliberately not tied to the actual reviewing admin. Do not "fix" it by wiring in the reviewer's name.

---

## Deliberately Not Automated

Git commit workflow and browser verification are handled manually. See CLAUDE.md — an ambient automation here would conflict with that gate.
