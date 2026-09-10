---
name: prisma-schema-conventions
description: Naming, typing, and migration conventions for the Prisma schema on this project. Use when creating or modifying any Prisma model, running migrations, or writing raw SQL against the database.
---

# Prisma Schema Conventions

Use this skill as a routing and verification checklist. The current schema and shared documentation are authoritative; do not keep a second schema specification in this skill.

## Read first

- [docs/database.md](../../../docs/database.md): current models, enums, mappings, relationships, money rules, immutable models, RLS, and migration procedure.
- [docs/decisions.md](../../../docs/decisions.md): the reasons behind schema boundaries, constraints, snapshots, deletion behavior, and dependency choices.
- [docs/architecture.md](../../../docs/architecture.md): database connections, Prisma commands, deployment behavior, and local migration limitations.
- [docs/workflows.md](../../../docs/workflows.md): transactional behavior the schema supports.
- [docs/development.md](../../../docs/development.md): approval gates and verification expectations.

Inspect `prisma/schema.prisma`, the full migration history, and relevant master SQL after reading those documents. If schema, migrations, master SQL, and documentation disagree, report the mismatch rather than choosing silently.

## Checklist

- Obtain approval before changing the schema or adding a dependency.
- Follow the current naming, mapping, ID, money, timestamp, enum, relation, index, and immutability conventions in `docs/database.md` and the existing schema.
- Preserve historical and audit data according to the documented deletion and immutability decisions.
- Never edit an applied migration. Use the repository's current documented migration procedure, including its shadow-database limitation; do not substitute a remembered Prisma workflow.
- Keep master SQL and its migration representation synchronized when a change affects manually expressed database behavior.
- Enable the documented deny-all RLS policies in the same migration as every new application table.
- For booking or migration changes, verify the live exclusion constraint and RLS policies after applying the change.
- Cross-check schema changes against the affected workflows and payment/booking skills so transactional behavior remains representable.
- Update `docs/database.md` and any affected shared document in the same change.
