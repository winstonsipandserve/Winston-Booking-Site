# Development

Shared, tool-agnostic guidance for changing and verifying this repository. Project facts belong in `docs/`; tool-specific adapters should point here rather than restating these rules.

**See also:** [architecture.md](architecture.md) (stack and runtime) · [database.md](database.md) (schema and data rules) · [decisions.md](decisions.md) (locked-in choices) · [roadmap.md](roadmap.md) (known gaps and verification status)

---

## Documentation

Read the relevant document before planning work in that area. Do not infer domain rules from code alone; several rules exist for reasons the implementation does not show.

`docs/` describes the current state and is the canonical source for shared project, business, and technical knowledge. When work changes something a document asserts, update that document in the same change. Put each fact in exactly one place and cross-reference it elsewhere.

There is no progress log, and one must not be created. Git history carries chronology; these documents are edited in place.

`docs/decisions.md` records choices that must not be silently undone. Raise any required deviation before implementing it.

## Planning and Approval

Discuss and plan work against the live repository. Instructions written around an "originating prompt" are stale.

Ask before implementing when a task:

- deviates from `docs/decisions.md`;
- adds a dependency;
- changes the database schema;
- touches payment, authentication, or booking-conflict logic; or
- is ambiguous enough that two reasonable readings would produce materially different work.

Routine, reversible implementation decisions outside those gates do not need separate approval.

## Git and Branch Promotion

Coding agents must never run `git add`, `git commit`, or `git push` in this repository. Work that is ready to commit ends with an explicit Git command block for Arjay to review and run. This applies to merges as well as ordinary changes.

Promotion is manual, with no automated merge gates:

- `dev` → `staging` after local verification passes.
- `staging` → `main` only after verifying the deployed staging environment, not just the local build. `main` auto-deploys to production.
- Before any payment-touching promotion to `main`, explicitly confirm the PayMongo key swap described in [roadmap.md](roadmap.md).

## Verification

- Output is manually reviewed and validated, including browser verification when behavior or presentation changes. Nothing is auto-approved.
- Nothing in this project is currently treated as previously verified; see [roadmap.md](roadmap.md). Re-run the relevant checks rather than citing an earlier QA pass.
- There are no automated tests. Verification means exercising the affected flow and checking real output or data.
- Report results honestly. Include failures and identify skipped checks.

## Development data reset

Use `npm run db:reset-dev-data` to preview removal of all customer and test records. The command preserves admin users and reference/configuration data, including resources, resource types, pricing rules, the guest-fee rule, and add-on catalogs.

The command is dry-run by default. After verifying that the configured `DATABASE_URL` is an isolated development database, apply it only with both safeguards enabled:

```powershell
$env:ALLOW_DEV_DATA_RESET = "true"
npm run db:reset-dev-data -- --confirm
```

It must not be run against production or shared data. The deletion order is transaction-protected and follows the schema's foreign-key dependencies.

## Coding Conventions

### Prisma and migrations

Follow [database.md](database.md) for naming, mappings, money, timestamps, relationships, row-level security, immutable audit models, and the current migration procedure. Never edit an applied migration. Any work touching bookings or migrations must verify the overlap exclusion constraint and RLS policies still exist.

### API routes

- Route handlers live under `src/app/api/` and return `Response.json(...)` with explicit status codes: 400 for validation, 401 for authentication, 409 for conflicts, and 500 for unexpected failures.
- Error responses contain one string field named `error`, never a nested error object.
- Derive member status server-side from the customer's active membership. Never trust a request body or client session claim for it.
- Import the shared Prisma singleton from `src/lib/prisma.ts`; do not create a client per route.

### Components

- Use folder-per-feature organization under `src/components/`, with PascalCase filenames matching exported components.
- Add `'use client'` only when a component uses state, effects, or browser APIs. Leave server components without it.
- Put shared non-component helpers in `src/lib/`.
- For multi-step wizards, place steps in a `steps/` subfolder, one component per step plus a step indicator. Lift all state, including the current step, to the top-level orchestrator so back/forward navigation does not reset values.

### Client-side API errors

Branch on `res.status`, not only `res.ok`, so expected outcomes such as 409 conflicts remain distinguishable from generic failures. Surface a 400 response's `error` in the UI. Use a generic inline message for network or unexpected errors; do not navigate away or throw uncaught exceptions that discard in-progress form state.

### Authentication and the Edge Runtime

Follow the three-file runtime split in [architecture.md](architecture.md). `middleware.ts` must never import the Node-only `auth.ts`, and every gated route must enforce its own authentication check rather than relying on middleware alone.

### Throwaway-script data safety

Any disposable script that deletes data must scope every deletion to row IDs captured when the script created those rows and pass those IDs directly to the delete call.

Never clean up by resource ID, date range, or time window. Those selectors can silently include pre-existing data.

### Dependencies and design

Reuse installed dependencies by default. Any new dependency needs explicit approval and must respect the scoped exceptions in [decisions.md](decisions.md).

Do not re-derive palette, radius, navbar, or dark-mode conventions per task. Follow the design-system decisions in [decisions.md](decisions.md).
