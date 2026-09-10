<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Codex Adapter

This file is the Codex-facing entry point for this repository. Shared project, business, and technical knowledge lives in `docs/`; keep Codex-specific instructions here and Codex-compatible skills in `.agents/skills/`.

## Read Before Planning or Editing

Read the documents relevant to the task before planning or changing code. Do not infer domain rules from code alone.

| Topic | Canonical document |
|---|---|
| Development workflow, approval gates, Git, verification, coding conventions | [docs/development.md](docs/development.md) |
| Business rules, pricing, membership, domain concepts | [docs/business.md](docs/business.md) |
| Current application behavior | [docs/features.md](docs/features.md) |
| End-to-end processes | [docs/workflows.md](docs/workflows.md) |
| Stack, code layout, services, environment | [docs/architecture.md](docs/architecture.md) |
| Models, enums, relationships, constraints | [docs/database.md](docs/database.md) |
| Locked-in design and engineering decisions | [docs/decisions.md](docs/decisions.md) |
| Known bugs, deferred work, unverified areas | [docs/roadmap.md](docs/roadmap.md) |

Treat `docs/decisions.md` as a gate: if a task requires deviating from a recorded decision, raise it before implementation. When a change makes shared documentation inaccurate, update the relevant document in the same change.

## Project Map

| Path | Responsibility |
|---|---|
| `src/app/` | Next.js App Router pages, layouts, route groups, and API handlers |
| `src/components/` | Feature-organized React components and shared UI |
| `src/lib/` | Server and shared helpers for auth, bookings, pricing, payments, email, and storage |
| `src/hooks/` | Reusable React hooks |
| `src/types/` | Shared TypeScript and Auth.js type augmentation |
| `prisma/schema.prisma` | Current Prisma schema |
| `prisma/migrations/` | Immutable applied migrations |
| `prisma/manual-sql/` | Master SQL for constraints and RLS that Prisma cannot express |
| `auth.config.ts` | Edge-safe shared Auth.js configuration |
| `auth.ts` | Node-only Auth.js providers and database-backed authentication |
| `middleware.ts` | Edge middleware wrapper and route matcher |
| `docs/` | Canonical, tool-agnostic project knowledge |
| `.agents/skills/` | Repository-scoped Codex-compatible skills |
| `.codex/` | Project-scoped Codex configuration and optional custom agents |
| `.claude/` | Claude Code-specific configuration and skills |

## Codex Skills

Use repository skills when their descriptions match the task:

- `booking-conflict-prevention` for booking creation, availability, cancellation, expiry, or rescheduling.
- `paymongo-integration` for checkout, webhooks, payment state, reconciliation, or key handling.
- `prisma-schema-conventions` for schema, migration, raw SQL, RLS, or constraint work.
- `vibe-sec` for web-application security implementation or security reviews.
- The installed design and motion skills under `.agents/skills/` for frontend design, polish, prototypes, and animation work.

Skills provide workflows and checklists. The linked files in `docs/` remain authoritative for project facts.
