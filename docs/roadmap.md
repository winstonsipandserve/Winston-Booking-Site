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

## Client Update — 21 September 2026 (documented, not yet built)

The client revised the membership product, rate card, inventory, and add-ons. [business.md](business.md) now states the new rules; the code still implements the old ones. Each item below is one unit of work to prioritise; update the matching sections of [features.md](features.md), [workflows.md](workflows.md), and [database.md](database.md) as it lands, and remove their banners once all are done.

1. **Membership tiers and pricing.** `MembershipTier` becomes `player` / `premier` / `elite` at ₱3,500 / ₱6,500 / ₱9,500, all 12-month terms; drop the activation-fee / credit split (`Membership.activationFeeCentavos`, the `creditCentavos` plan field); add a Founding flag, a counter over paid Premier activations capped at 100, and the ₱5,000 first-year Founding price. Touches `src/lib/membership-pricing.ts`, `prisma/schema.prisma`, `src/lib/format.ts` tier labels, `TierCards.tsx`, `/membership/pay/[id]`, `/account/renew`, `/membership/renew/[id]`, `MembershipCheckoutSummary.tsx`, `src/lib/resend.ts` copy, `membership-certificate-pdf.tsx`, the `dashboard-data.ts` by-tier chart, and the check-in result cards.
2. **Tier booking discount.** Replace member `PricingRule` rows with a percentage applied in `src/lib/booking-pricing.ts` from the tier of the term covering the slot (see [decisions.md](decisions.md)); wizard price display; `pricing-rule-combos.ts` allow-list; admin `ResourcesTabs.tsx` loses the member column for courts and simulators but keeps it for coaching.
3. **Inventory and base rates.** Seed and schema: remove `tennis_court`; pickleball courts 3 → 2, pickleball simulators 2 → 1, tennis simulators 1 → 2, golf simulators 2 → 1; new base rates; remove the 15-minute simulator tiers and the 30- and 90-minute golf tiers. Touches `prisma/seed.ts`, the `StatsBar.tsx` constants, `Facilities.tsx`, `SportStep.tsx`, `dashboard-data.ts`, and any copy naming tennis courts. Verify the `booking_no_overlap` constraint and RLS after the migration.
4. **Guest fee ₱100 and the 7-guest cap.** Seed value; the wizard's guest-count maximum; validation in `POST /api/bookings` and `PATCH /api/bookings/[id]`.
5. **Ball boy removal.** `AddOnServiceSlug`, seed, `AddOnsStep.tsx`, `ReviewStep.tsx`, `PaymentStep.tsx`, `BookingSummary.tsx`, `BookingConfirmation.tsx`, `booking-confirmation.ts`, both booking emails, the admin booking detail, `ResourcesTabs.tsx`, `pricing-rule-combos.ts`.
6. **Advance booking window.** Per-tier constants (non-member 3, Player 5, Premier 7, Elite 10 days from today, Manila); the Date & Time step disables dates outside the window; `POST /api/bookings`, `/api/availability`, and the admin reschedule lookup reject them. The window follows the term covering the slot, falling back to the non-member window.
7. **Guest passes.** A per-term allowance and consumption record (a counter on `Membership` or a ledger), a wizard control to apply passes to a booking's guests, a snapshot of passes used on the booking, the account page balance, and the admin member detail.
8. **Birthday-month court hour.** Date of birth on the application form, `MembershipApplication`, and `Customer`; once-per-term redemption on a slot inside the birthday month; wizard surfacing. **Blocked on the client's answer about which resources count** (Open Questions below).
9. **Credit without a grant.** The webhook's membership branch stops writing an `activation` / `renewal` credit entry and the membership no longer starts with a balance; top-ups, redemption, and the ledger stay. Update every surface that promises F&B credit — account status card, certificate PDF, activation and renewal emails, checkout summaries, `/membership` copy. The "renewal credit is displayed as the current balance" bug below becomes moot once no grant exists.
10. **Marketing copy.** `/membership` tier cards and perks, and Home / About / Facilities mentions of tennis courts or nine units.
11. **Documentation follow-through.** Re-align `features.md`, `workflows.md`, and `database.md` (enum tables, seed counts, worked examples) as each item above ships.

---

## Known Bugs

### Correctness

- **Business hours cannot reject a midnight-crossing booking.** The check compares minutes-of-day independently for start and end, so a 23:00 → 01:00 range satisfies both bounds and passes. The documented 6 AM–10 PM rule is enforced only for same-day ranges.
- **The guest fee lookup has no ordering.** It fetches the first row with no `orderBy`, so the single-row assumption is unenforced. A second row would make pricing nondeterministic.
- **`Membership.status` is a dead column.** Nothing reads or writes it any more (`endDate` alone decides, see [database.md](database.md)); it still exists in the schema and defaults to `active`. Dropping it needs a migration and has not been scheduled.
- **Memberships created before September 2026 lapse at the exact PayMongo payment instant**, not at end of day Manila. No backfill has been run; a one-off `UPDATE` setting `end_date` to 23:59:59.999 Asia/Manila of its current date would align them, and must be reviewed before running.

### Display and reporting

- The membership approve/reject route reports its email as sent unconditionally. The underlying senders swallow send failures internally and the route never checks their result, so a real delivery failure is invisible to the admin. No fix scoped yet.
- Several date-formatting calls in the email, webhook, and membership-lookup modules use a Philippine locale with no explicit time zone, and so fall back to the server runtime's zone. Flagged as likely correctness bugs, not yet confirmed.
- **Renewal credit is displayed as the current balance instead of the original grant.** Membership display fields look only for an `activation` ledger row. A renewed membership whose initial row is correctly marked `renewal` showed “₱2,850 F&B credit” after a ₱650 booking instead of the original ₱3,500 grant; check-in likewise showed ₱2,850 remaining out of ₱2,850. **Superseded** by Client Update item 9 — once no credit is granted there is no "original grant" to display; do not fix separately.

### Dead code

- `src/components/admin/ComingSoonSection.tsx` is referenced nowhere.

---

## Deferred By Decision

Each of these is a conscious scope limit, not an oversight.

- **Activity log filter UI** (by action type, entity type, or admin) — no design decided on shape, or on server- versus client-side filtering.
- **Member Actions panel** — Extend, Suspend, and Cancel Membership, pending business-rule decisions on suspend/cancel semantics and credit forfeiture. Add Credit already shipped.
- **Admin-panel loading indicators** — the shared loading overlay is wired across all customer-facing buttons but not the admin panel: roughly 8 text-swap buttons and 6 currently-silent buttons remain.
- **Create-new-admin UI** — the Admin Users tab is read plus deactivate/reactivate only.
- **Member-versus-non-member revenue breakdown** — bookings do not capture which rate tier applied at the time, so historical rows cannot be reclassified. This would need a new forward-only column.
- **Reconciling dashboard revenue against net-of-fee amounts** — the PayMongo fee is captured but surfaced only on the booking detail page.
- **A `www` variant/redirect and a staging subdomain** — revisit if either becomes useful.
- **Parallelizing the credit-redemption transaction** — there are candidate groups of independent writes. Revisit only if the transaction timeout margin proves insufficient.
- **Exact-time announcement resource scheduling** — the current daily cron can apply or release a scheduled resource disable up to one day late. Public announcement visibility is request-time accurate; increasing cron frequency requires a hosting-plan change.

---

## Open Questions

Genuinely undecided, needing a business or client answer.

**From the 21 September 2026 client update** (each is documented in [business.md](business.md) with the stated provisional reading):

- **Birthday "court hour" scope.** The pickleball courts only, or any 60-minute booking including simulators? Documented as pickleball courts. Blocks Client Update item 8.
- **Member guest cap.** The client stated the 7-guest maximum for non-members. Documented as applying to members too.
- **Discount scope.** Does the 5 / 10 / 15% tier discount also apply to coaching or the guest fee? Documented as base court/simulator rate only.
- **Founding count.** Documented as the first 100 *paid* Premier activations, counted when the webhook confirms payment, and as a permanent flag that survives a lapse and later renewal.
- **Sip & Serve 10%.** How the café/bar discount is honoured before the POS extension exists. Documented as an offline, at-the-counter perk.

- **PayMongo account provenance.** The client has not created their own PayMongo account. The keys currently in use are Arjay's personal test-mode account. The client's own **test** keys must be swapped in before promoting to staging, and **live** keys before promoting to production. This swap must be explicitly confirmed before any payment-touching promotion to production.
- **Enabled payment methods.** Checkout requests GCash and Maya only. Verify both
  are enabled on the target PayMongo account before promotion.
- **Does "Booking Revenue This Month" mean services rendered or cash collected?** It sums every paid booking payment regardless of method, so a credit-covered booking counts identically to a fresh card charge. Not a bug — the question has not been put to the client. Revisit if the number is ever used for real financial reporting.
- **An expired member stays authenticated on member routes.** Deliberate: the session is what lets them reach `/account/renew`, and bookings already fall back to non-member pricing. Revisit only if a member-only surface appears that must not be reachable after lapse.
- **A top-up paid after expiry is credited to the lapsed term and flagged to staff** rather than refunded automatically. A refund flow (PayMongo refund API + ledger reversal) has not been built.

---

## Test Data Gaps

- **Membership expiry coverage remains manual.** `scripts/membership-expiry-fixtures.ts` now creates an ID-scoped near-expiry, expired, and renewed-member dataset and cleans it up from its manifest, but the walkthrough is not automated.
- **No content lifecycle fixture set exists.** The reset utility safely removes announcement and news data, but repeatable fixtures for scheduled/expired notices, overlapping resource claims, and draft/scheduled news still need to be added to automated tests.
- **No reproducible admin bootstrap.** The seed creates reference data only and no admin user, so admin accounts exist only in the live dev database. A fresh environment currently has no way to create the first admin.

---

## Infrastructure & Pre-Launch

- **Supabase is still on the Free tier.** Pro is required before launch for backups and a higher connection limit. Not yet actioned.
- **Vercel two-factor authentication is inactive.** Strongly recommended, no target date.
- **Prisma CLI's `deepmerge-ts@7.1.5` dependency carries CVE-2026-40345.** It is a dev-tooling-only stack-exhaustion risk requiring crafted cyclic configuration objects, not a production request path. Prisma has not released a compatible upgrade: current releases still pin v7, while the upstream v8 bump remains open. Do not force an override or downgrade Prisma; re-run `npm audit --omit=dev` when Prisma ships a supported fix.
- **Admin forgot/reset password vs. middleware on Vercel — unverified.** `middleware.ts` exempts only `/admin/login`, yet `/api/admin/auth/forgot-password` and `reset-password` must work without a session. Locally the middleware never executes so the routes answer normally; on a deployment where it does run, the matcher would redirect them to the login page and the forms would show a false "link sent" message. Check on staging; if it reproduces, exempt `/api/admin/auth/*` (and `/admin/forgot-password`, `/admin/reset-password`) in the matcher.
- **Staging re-verification needed** — the region fix and the Vercel Auth re-enable were only ever applied by redeploying `dev`.
- **Production overrides need confirming** at the eventual staging-to-production promotion. The custom domain is connected to Production and currently returns 404s because of the framework-preset issue described in [architecture.md](architecture.md).
- **Connection priming floor** of roughly 300 ms per admin navigation on a fresh pooled connection. Reducing it project-wide — via Prisma Accelerate, a different pooling strategy, or Vercel Fluid Compute — is an open investigation.
- The Supabase MCP role cannot terminate backend connections; killing the local Node process is the actual fix when the session-mode pooler hits its connection cap.
- **Membership applications do not verify the applicant controls the email.** A stranger can submit under someone else's address, which blocks that person from applying until staff reject the fake one (and staff must review bogus ID images). The per-IP throttle bounds the volume; the real fix is a pre-submission email verification code (new token model, email, and form step). Not yet scheduled.
- **Booking hold spam from many IPs is not mitigated.** The per-client hold limits in [workflows.md](workflows.md) stop a single script; a distributed attacker can still tie up slots. The backstop options are bot protection on the hold step (e.g. Cloudflare Turnstile — a new dependency) or Vercel WAF rate limiting (Pro plan). Not yet decided.
- **Bulletin contract cleanup is intentionally pending.** After staging and production verification on the new Announcement/News code, apply a separate migration that removes the legacy bulletin tables/enums and renames the internal resource-disable reason from `bulletin` to `announcement`.

---

## Content

- **Facility photography** — the facilities section uses local placeholder photos. Swapping in real venue photography means replacing those five files directly.
- **Copy pending client input** — Home hero copy, About's Our Story, and footer contact details.
- `/book` currently has no hero. If it gets one back, revisit whether it still needs to force the navbar solid.

---

## Planned Extension: POS

The client wants a point-of-sale system for the café and bar, on this same platform.

**This is not being built now.** Do not create product, inventory, or order tables — see [decisions.md](decisions.md) for the constraints the schema already satisfies so that the extension will not force a rewrite:

- The customer model is generic enough to be shared with POS transactions.
- The payment model already allows a payment with no booking attached.
- The credit ledger will take a new reason value rather than a new table.
- The admin role model assumes more resource types will exist later.
