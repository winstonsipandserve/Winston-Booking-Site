# Architecture

How the software is built: the stack, the code layout, the external services, and the environment it runs in.

**See also:** [database.md](database.md) (how data is shaped) · [workflows.md](workflows.md) (how processes run) · [decisions.md](decisions.md) (why these choices) · [development.md](development.md) (how changes are made) · [features.md](features.md) (what is built)

---

## Technology Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | React 19, Tailwind CSS v4 (CSS-first `@theme`, no config file) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 6 |
| Auth | Auth.js v5 (NextAuth beta) — Credentials providers, JWT sessions, no adapter |
| Payments | PayMongo (Checkout Sessions API) |
| Email | Resend |
| File storage | Supabase Storage |
| Charts | Recharts (admin dashboard only) |
| PDF | `@react-pdf/renderer` (membership certificate only) |
| QR | `qrcode` (generation), `html5-qrcode` (camera scanning) |
| Hosting | Vercel |
| Error tracking | Sentry |

---

## Repository & Branches

- **Repo**: `https://github.com/winstonsipandserve/Winston-Booking-Site.git`
- **Local**: `C:\Projects\winston-booking-website`

| Branch | Role |
|---|---|
| `main` | Production — auto-deploys to Vercel Production |
| `staging` | Pre-production testing |
| `dev` | Day-to-day development work |

Promotion between branches is manual. See [development.md](development.md) for the promotion policy.

---

## Project Structure

```
src/
  app/              App Router — pages, layouts, and API routes
    (marketing)     /, /about, /cafe-bar, /news, /membership
    book/           Booking wizard and confirmation
    account/        Member portal (server-gated on a member session)
    admin/
      (protected)/  Admin panel — layout enforces the admin session
      login, forgot-password, reset-password
    api/            Route handlers (see API Surface below)
  components/       Folder-per-feature: about, account, admin, auth, booking,
                    cafe-bar, home, layout, membership, news, ui
  lib/              Non-component helpers — pricing, auth, email, storage, formatting
  hooks/            React hooks
  types/            Type augmentation (Auth.js session/JWT shapes)
prisma/
  schema.prisma     Single schema file
  migrations/       Applied migrations
  manual-sql/       Master copies of hand-written SQL (see database.md)
  seed.ts           Reference data seed
```

Conventions for adding to this structure — component naming, `'use client'` placement, wizard step layout, shared helper placement — live in [development.md](development.md).

---

## API Surface

Route handlers live under `src/app/api/`, return `Response.json(...)` with explicit status codes, and use a shared Prisma singleton (`src/lib/prisma.ts`).

### Public / anonymous

| Route | Methods | Purpose |
|---|---|---|
| `/api/resources` | GET | Resource catalog with active resources, pricing rules, add-on rules, guest fee |
| `/api/availability` | GET | Occupied time ranges for a resource on a given Philippine calendar date |
| `/api/bookings` | POST | Create a booking hold (session-aware — see [workflows.md](workflows.md)) |
| `/api/bookings/[id]` | GET, PATCH | Read booking detail / attach customer contact details and re-price |
| `/api/checkout` | POST | Create or reuse a PayMongo Checkout Session for a booking |
| `/api/bulletin/gate-notices` | GET | Top 3 published non-expired bulletins, excluding Promotion |
| `/api/membership-applications` | POST | Submit an application (multipart, with ID images) |
| `/api/membership-applications/[id]` | GET | Application status poller |
| `/api/membership-payments` | POST | Create/resume checkout for an approved application |
| `/api/membership-payments/[id]` | GET | Membership payment status poller |
| `/api/membership-payments/[id]/checkout` | POST | Start checkout for an admin-issued renewal link |
| `/api/activate` | POST | Consume an activation token and set a member password |
| `/api/auth/forgot-password` | POST | Member reset request — enumeration-safe, always returns the same response |
| `/api/auth/reset-password` | POST | Consume a reset token and set a new password |
| `/api/auth/[...nextauth]` | GET, POST | Auth.js endpoint for both providers |

### Member-session-gated (`/api/account/*`)

| Route | Methods | Purpose |
|---|---|---|
| `/api/account/check-in-token/regenerate` | POST | Rotate the check-in token and code, return a fresh QR |
| `/api/account/membership-renewal` | POST | Self-service renewal checkout |
| `/api/account/membership-topup` | POST | Credit top-up checkout against a fixed preset |
| `/api/account/membership-topup/[id]` | GET | Top-up status poller — **note: this route performs no session or ownership check**, see [roadmap.md](roadmap.md) |

### Admin-gated (`/api/admin/*`)

Gated twice: `middleware.ts` matches `/admin/:path*` and `/api/admin/:path*`, and every handler independently calls `getActiveAdminSession()`. The two admin auth routes (`forgot-password`, `reset-password`) intentionally require no session.

Covers: account password change, activity log, admin user list and activate/deactivate, booking reschedule and CSV export, bulletin CRUD, check-in by token and by code, guest fee edit, membership approve/reject, credit top-up, renewal link send, membership CSV export, pricing rule and add-on pricing rule CRUD, and resource edit/disable.

### Webhook

`/api/webhooks/paymongo` (POST) — the single confirmation authority for all payments. See [workflows.md](workflows.md).

### Cron

Both require `Authorization: Bearer $CRON_SECRET` and return 401 otherwise, including when the secret is unset.

| Route | Schedule (UTC) | Purpose |
|---|---|---|
| `/api/cron/expire-bookings` | `0 0 * * *` | Expire stale holds; release and apply bulletin resource disables |
| `/api/cron/membership-reminders` | `0 1 * * *` | 14-day and 3-day expiry reminders, plus expired notices |

**There are two cron entries, not one.** Vercel's Hobby plan caps cron frequency at once per day, which is why scheduled effects can lag by up to a day.

---

## Authentication

Auth.js v5 with two Credentials providers — `credentials` for admins, `member-credentials` for members — JWT sessions, and no database adapter or session tables.

**The config is deliberately split across three files:**

| File | Contents | Runtime |
|---|---|---|
| `auth.config.ts` | `providers: []`, `session`, `pages`, and the `jwt`/`session` callbacks | Edge-safe |
| `auth.ts` | Spreads `auth.config.ts` and adds both Credentials providers | Node only |
| `middleware.ts` | Imports **only** `auth.config.ts` and builds its own lightweight wrapper | Edge |

`middleware.ts` runs on the Edge Runtime, which cannot load Prisma or Node's `crypto` (used for password hashing). Anything touching those must live only in `auth.ts`. **`middleware.ts` must never import `auth.ts`** — that would pull Prisma and `crypto` into the Edge bundle.

Admin gating goes through one shared helper, `getActiveAdminSession()` (`src/lib/admin-session.ts`), used by the protected layout and every admin API route. It re-checks the admin's active flag against the database on every request, so deactivating an admin rejects their already-open session on its next request rather than only at next login.

---

## External Services

### Supabase

PostgreSQL, Storage, and row-level security.

- The app's real database access goes through Prisma using the privileged connection, which bypasses RLS. RLS deny-all policies exist to close off the Supabase anon-key REST API path. See [database.md](database.md).
- **Storage buckets:**

| Bucket | Visibility | Contents |
|---|---|---|
| `membership-applications` | Private, admin-only via signed URLs | Government ID images |
| `bulletin-images` | Public | Bulletin artwork |
| `email-assets` | Public (read-only for anon; writes service-role only) | The logo used in transactional emails, uploaded manually via the Supabase dashboard |

- MCP access to Supabase is **read-only**.

### PayMongo

**Checkout Sessions** (hosted, redirect-based) — not raw Payment Intents with client-side Elements.

- Requested payment methods: `card`, `gcash`, `grab_pay`, `paymaya`.
- Amounts are always in centavos, matching PayMongo's native format.
- Confirmation happens **only** via a verified `payment.paid` webhook (HMAC-SHA256 over the `Paymongo-Signature` header), never on the client-side redirect.
- When a stale hold is cancelled, its checkout session is actively expired via PayMongo's Expire Checkout Session endpoint, closing the window where someone could pay into a released slot.

**Real webhook payload shape** — self-signed test payloads got this wrong, so trust this and not a hand-built fixture:

- Event type is at `data.attributes.type` and is matched against `'payment.paid'` — *not* `'checkout_session.payment.paid'`.
- Payment fields live under `data.attributes.data.attributes`, not `data.attributes.data`:
  - `metadata.bookingId` / `metadata.membershipPaymentId` / `metadata.topUpPaymentId` — the dispatch key
  - `status` — must equal `'paid'`
  - `payment_intent_id` — a flat string field, not a nested object
  - `paid_at` — Unix **seconds**

### Resend

Transactional email, sending from `no-reply@winstonsipandserve.club` (SPF/DKIM verified; DMARC is monitor-only `p=none`) with reply-to `winstonsipandserve@gmail.com`.

All transactional email shares one branded layout via `buildBrandedEmail(...)` in `src/lib/email-templates.ts` rather than each call site building its own HTML. **There are 15 senders** in `src/lib/resend.ts`: activation, membership renewal, membership payment link, renewal payment link, member password reset, admin password reset, rejection, booking confirmation, four staff notifications (booking, application, activation, renewal), credit top-up confirmation, membership expiry reminder, and membership expired.

The first-time activation email carries a generated PDF membership certificate. It is attached only on first activation — never on renewal, and never on the plain activation-link case.

### Vercel

- **Framework Preset must be "Next.js"**, not "Other". On "Other" the build reports success but routing and serverless functions never wire up and every route 404s. `dev` and `staging` are corrected; Production runs on its own pinned Production Overrides and needs this confirmed at the eventual promotion.
- `prisma generate` is part of the `build` script itself, so a cached `node_modules` can never leave the build type-checking against a stale Prisma Client.
- **Deployment Protection**: Vercel Authentication ("Standard Protection") is on project-wide — the only tier available on the Hobby plan. The production custom domain is auto-exempted; only non-custom-domain preview/dev/staging URLs sit behind Vercel login. A Protection Bypass for Automation secret exists for tooling that cannot authenticate interactively — send it as the `x-vercel-protection-bypass` **header**, not a query parameter. For giving a person access to a protected preview, use Vercel's Shareable Links rather than hand-building a bypass URL.
- Function region and the Supabase project are both `syd1`.

---

## Environment Variables

Names and purpose only. Real values live in `.env.local` (never committed) and Vercel's Environment Variables settings.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres, pooled connection — used at runtime |
| `DIRECT_URL` | Supabase Postgres, direct connection — used for Prisma migrations |
| `AUTH_SECRET` | Auth.js session encryption secret |
| `PAYMONGO_SECRET_KEY` | PayMongo server-side API key |
| `PAYMONGO_PUBLIC_KEY` | PayMongo client-side key |
| `PAYMONGO_WEBHOOK_SECRET` | Verifies `payment.paid` webhook signatures |
| `RESEND_API_KEY` | Transactional email sending |
| `NEXT_PUBLIC_APP_URL` | Base app URL (differs per environment) |
| `SENTRY_DSN` | Error tracking |
| `BOOKING_HOLD_MINUTES` | Minutes a pending booking is held before being treated as abandoned (default `10`) |
| `CRON_SECRET` | Authenticates Vercel Cron invocations |
| `SUPABASE_URL` | Supabase project API URL, for server-side Storage REST calls |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS and Storage policies — server-only, never exposed to the client |
| `MEMBER_ACTIVATION_TOKEN_HOURS` | Activation token lifetime (default `48`) |
| `PASSWORD_RESET_TOKEN_HOURS` | Member reset token lifetime (default `1`) |
| `ADMIN_PASSWORD_RESET_TOKEN_HOURS` | Admin reset token lifetime (default `1`) |

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Seed reference data |

Automated tests: none yet.

**Prisma CLI commands are wrapped with `dotenv-cli`** (`dotenv -e .env.local --`) because the Prisma CLI only auto-reads a file literally named `.env` — it does not read `.env.local` the way Next.js does at runtime. `.env.local` stays the single source of truth; **do not create a second `.env` file.**

---

## Development Environment Notes

These are known local quirks. Re-verify against `staging` before assuming any of them is dev-only.

- **`middleware.ts` does not execute** in this Next 16 / Turbopack / Windows dev setup. Every gated route therefore carries its own auth check and does the real enforcement; the matcher alone is never sufficient. Any new route under the matcher must include its own explicit check.
- **`prisma migrate dev` / `--create-only` fails** (P3006/P1014) against a fresh shadow database, because an earlier migration inserts into Supabase-managed `storage.buckets`, which does not exist in a vanilla shadow DB. Until resolved, hand-write migration SQL and apply with `prisma migrate deploy`, which skips the shadow database.
- **Local `DATABASE_URL` points at the session-mode pooler** (port `5432`, no `pgbouncer=true`) rather than the transaction-mode pooler (`6543`) used in deployed environments. Transaction-mode pooling forces `DEALLOCATE ALL` before reusing prepared statements, which is measurable overhead locally where a single long-lived connection is safe. **Deployed environments must keep the pooled `:6543` connection** so serverless functions do not exhaust Supabase's connection limit.
- Connection priming costs roughly 300 ms on a fresh pooled connection per admin navigation. Reducing this is an open investigation — see [roadmap.md](roadmap.md).
- The `Navbar` is fixed and transparent until scrolled, tuned for a dark photographic hero directly beneath it. A page whose top section is a plain light background needs one of the two documented fixes — see [decisions.md](decisions.md).
