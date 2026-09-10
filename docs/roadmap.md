# Roadmap & Open Work

Known bugs, deferred work, unresolved questions, and planned extensions. This is **not** a progress log — it records the current state of what is *not* done, and is edited in place rather than appended to.

**See also:** [features.md](features.md) (what is built) · [decisions.md](decisions.md) (what is settled) · [business.md](business.md) (the rules)

---

## Verification Status

**Nothing in this project is currently treated as verified.** The QA and audit passes run under an earlier workflow were discarded along with their findings documents and scripts. Any claim that a feature was "click-through verified" no longer stands. Re-verify anything before relying on it.

Never yet run under real conditions:

- PayMongo checkout completion against a real payment
- A systematic visual or pixel-level review
- The admin check-in camera scan with a real device

---

## Known Bugs

### Correctness

- **Business hours cannot reject a midnight-crossing booking.** The check compares minutes-of-day independently for start and end, so a 23:00 → 01:00 range satisfies both bounds and passes. The documented 6 AM–10 PM rule is enforced only for same-day ranges.
- **The guest fee lookup has no ordering.** It fetches the first row with no `orderBy`, so the single-row assumption is unenforced. A second row would make pricing nondeterministic.
- **`Membership.status` and `endDate` are two independent expiry rules.** One code path requires `status: 'active'` *and* an unexpired end date; another uses the end date alone. Nothing ever writes `expired`, so they agree only by accident — if an admin set a status manually, member pricing and credit redemption would stop while the badge still read "Active Member". See [database.md](database.md).
- **A published bulletin can disable a resource ahead of its own future event start.** The event-start gate does not retroactively re-check disables that were already applied. Unpublishing or editing the bulletin brings the resource back early.

### Display and reporting

- The admin Activity Log's action-label map has no entry for the credit top-up action (nor any action added since the map was written), so those rows render a blank Action cell.
- The membership approve/reject route reports its email as sent unconditionally. The underlying senders swallow send failures internally and the route never checks their result, so a real delivery failure is invisible to the admin. No fix scoped yet.
- Several date-formatting calls in the email, webhook, and membership-lookup modules use a Philippine locale with no explicit time zone, and so fall back to the server runtime's zone. Flagged as likely correctness bugs, not yet confirmed.

### Dead code

- `src/components/admin/ComingSoonSection.tsx` is referenced nowhere.

---

## Deferred By Decision

Each of these is a conscious scope limit, not an oversight.

- **Activity log filter UI** (by action type, entity type, or admin) — no design decided on shape, or on server- versus client-side filtering.
- **Member Actions panel** — Extend, Suspend, and Cancel Membership, pending business-rule decisions on suspend/cancel semantics and credit forfeiture. Add Credit already shipped.
- **Admin-panel loading indicators** — the shared loading overlay is wired across all customer-facing buttons but not the admin panel: roughly 8 text-swap buttons and 6 currently-silent buttons remain.
- **Create-new-admin UI** — the Admin Users tab is read plus deactivate/reactivate only.
- **Pagination on the membership detail histories** — credit transactions and bookings are capped at the last 10 rows each.
- **Member-versus-non-member revenue breakdown** — bookings do not capture which rate tier applied at the time, so historical rows cannot be reclassified. This would need a new forward-only column.
- **Reconciling dashboard revenue against net-of-fee amounts** — the PayMongo fee is captured but surfaced only on the booking detail page.
- **A `www` variant/redirect and a staging subdomain** — revisit if either becomes useful.
- **Parallelizing the credit-redemption transaction** — there are candidate groups of independent writes. Revisit only if the transaction timeout margin proves insufficient.

---

## Open Questions

Genuinely undecided, needing a business or client answer.

- **PayMongo account provenance.** The client has not created their own PayMongo account. The keys currently in use are Arjay's personal test-mode account. The client's own **test** keys must be swapped in before promoting to staging, and **live** keys before promoting to production. This swap must be explicitly confirmed before any payment-touching promotion to production.
- **Enabled payment methods.** Checkout currently requests card, GCash, GrabPay, and Maya — confirmed enabled on the personal test account. The client's own account may have a different set; re-verify at the same swap point.
- **Does "Booking Revenue This Month" mean services rendered or cash collected?** It sums every paid booking payment regardless of method, so a credit-covered booking counts identically to a fresh card charge. Not a bug — the question has not been put to the client. Revisit if the number is ever used for real financial reporting.

---

## Test Data Gaps

- **No expired-membership fixture exists** in the dev dataset. The expired branch of the display-status logic, the admin detail layout for it, and its reapplication-blocking message have never been exercised against a real row. Supabase MCP access is read-only, so creating one needs a script or the admin UI.
- **No test-data reset script exists.** The previous one was deleted. Write a fresh, ID-scoped one when a reset is next needed — read the throwaway-script data-safety convention in [development.md](development.md) first.
- **No reproducible admin bootstrap.** The seed creates reference data only and no admin user, so admin accounts exist only in the live dev database. A fresh environment currently has no way to create the first admin.

---

## Infrastructure & Pre-Launch

- **Supabase is still on the Free tier.** Pro is required before launch for backups and a higher connection limit. Not yet actioned.
- **Vercel two-factor authentication is inactive.** Strongly recommended, no target date.
- **Staging re-verification needed** — the region fix and the Vercel Auth re-enable were only ever applied by redeploying `dev`.
- **Production overrides need confirming** at the eventual staging-to-production promotion. The custom domain is connected to Production and currently returns 404s because of the framework-preset issue described in [architecture.md](architecture.md).
- **Connection priming floor** of roughly 300 ms per admin navigation on a fresh pooled connection. Reducing it project-wide — via Prisma Accelerate, a different pooling strategy, or Vercel Fluid Compute — is an open investigation.
- The Supabase MCP role cannot terminate backend connections; killing the local Node process is the actual fix when the session-mode pooler hits its connection cap.

---

## Content

- **Facility photography** — the facilities section uses local placeholder photos. Swapping in real venue photography means replacing those five files directly.
- **Copy pending client input** — Home hero copy, About's Our Story, footer contact details, and News social links.
- `/book` and `/news` currently have no hero. If either gets one back, revisit whether it still needs to force the navbar solid.

---

## Planned Extension: POS

The client wants a point-of-sale system for the café and bar, on this same platform.

**This is not being built now.** Do not create product, inventory, or order tables — see [decisions.md](decisions.md) for the constraints the schema already satisfies so that the extension will not force a rewrite:

- The customer model is generic enough to be shared with POS transactions.
- The payment model already allows a payment with no booking attached.
- The credit ledger will take a new reason value rather than a new table.
- The admin role model assumes more resource types will exist later.
