---
name: paymongo-integration
description: PayMongo checkout, webhook verification, payment-state, and key-handling workflows for this booking platform. Use when building, modifying, or debugging checkout, webhook, reconciliation, refund, or payment-related code.
---

# PayMongo Integration

Use this skill as a routing and verification checklist. The repository's shared documentation is authoritative; do not assume a generic PayMongo integration shape or copy provider defaults into project behavior.

## Read first

- [docs/architecture.md](../../../docs/architecture.md): the current PayMongo product flow, payment methods, webhook payload shape, environment variables, and deployment constraints.
- [docs/workflows.md](../../../docs/workflows.md): checkout, webhook dispatch, hold expiry, membership payments, renewals, and top-ups.
- [docs/decisions.md](../../../docs/decisions.md): payment confirmation authority, centavo storage, snapshots, and model boundaries.
- [docs/database.md](../../../docs/database.md): current payment models, identifiers, relationships, and reporting semantics.
- [docs/roadmap.md](../../../docs/roadmap.md): unresolved account, key-swap, payment-method, and reporting questions.
- [docs/development.md](../../../docs/development.md): approval gates and verification expectations.

Inspect the current PayMongo helper, checkout routes, webhook handler, payment models, and affected callers after reading those documents. If code and documentation disagree, report the mismatch rather than choosing silently.

## Checklist

- Follow the exact payment flow documented for this application rather than substituting a generic Payment Intent or Elements flow.
- Keep secret keys and webhook secrets server-only and environment-backed. Never add credentials to source, configuration, logs, or fixtures.
- Keep all monetary values as integer centavos across storage, transport, calculations, and provider calls.
- Treat only the verified webhook path as payment confirmation authority, except for the explicitly documented non-processor credit flow.
- Verify signatures against the unmodified request body before parsing it, and preserve the documented event filtering, metadata dispatch, idempotency, and non-pending-payment handling.
- Preserve the coupling between payment state, booking or membership state, credit ledger writes, notifications, and checkout-session expiry.
- Use current documented payload fields and provider identifiers; do not infer shapes from hand-built fixtures or stale examples.
- Confirm the environment-specific key and payment-method requirements before any payment-touching promotion.
- Obtain approval before changing payment behavior, as required by `docs/development.md`.
- Update the shared documentation in the same change if behavior or invariants change.
