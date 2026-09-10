---
name: dev-data-reset
description: Safely reset all non-reference development data while preserving admin accounts and facility configuration.
metadata:
  short-description: Reset development data safely
---

# Development data reset

Use this skill only when the user explicitly asks to clear development or test data. This is a destructive database operation, not a cleanup shortcut for staging or production.

Run the repository command in dry-run mode first:

```bash
npm run db:reset-dev-data
```

The command reports the rows it would remove. It must never be run against production. The actual reset requires both safeguards:

```bash
ALLOW_DEV_DATA_RESET=true npm run db:reset-dev-data -- --confirm
```

On Windows PowerShell:

```powershell
$env:ALLOW_DEV_DATA_RESET = "true"
npm run db:reset-dev-data -- --confirm
```

The reset removes customer, membership, booking, payment, bulletin, token, rate-limit, and admin activity data in foreign-key-safe order. It preserves `AdminUser`, resources, resource types, pricing rules, the guest-fee rule, add-on services, and add-on pricing rules.

Do not broaden the allowlist or add table-wide deletion elsewhere. If the database contains real or shared data, stop and ask the user to identify an isolated development database. Do not run the reset automatically as part of another task.
