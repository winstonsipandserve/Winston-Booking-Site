# Features

What the application currently does. This is an inventory of built, working functionality — not a plan and not a history.

> **Verification status:** nothing in this project is currently treated as independently verified. QA passes run under an earlier workflow were discarded along with their findings, so any prior claim that a feature was "click-through verified" no longer stands. Re-verify before relying on anything here.

**See also:** [workflows.md](workflows.md) (how these flows run) · [business.md](business.md) (the rules behind them) · [roadmap.md](roadmap.md) (what is *not* built)

---

## Public Website

Six pages, all mobile-responsive.

| Page | Contents |
|---|---|
| **Home** (`/`) | Hero, stats bar, how-it-works, two-sides section, facilities, call-to-action banner |
| **About** (`/about`) | Hero, our story, values, call to action |
| **Café & Bar** (`/cafe-bar`) | Café/Bar mode toggle, menu highlights, gallery, speakeasy feature |
| **News** (`/news`) | Published and scheduled-by-date editorial posts with four category filters. Featured posts sort first and the newest featured post receives the large-card treatment; cards link to full articles at `/news/[slug]` |
| **Membership** (`/membership`) | Hero, tier cards, application process, apply call to action |
| **Book Now** (`/book`) | The booking wizard |

The navbar is fixed, transparent over a hero and solid on scroll for Home, About, Membership, Café & Bar, and News. `/book` has no hero and forces it permanently solid.

The public-site corner-radius system is applied sitewide with no exceptions remaining.

**Placeholder content pending client input:** Home hero copy, About's Our Story, and footer contact details.

---

## Booking

- **Announcement gate** before the wizard, showing only active operational announcements from their advance-notice date (or their start when none is set) until their end. Notices whose start is still ahead are tagged **Upcoming** so customers can see that the affected courts remain bookable until then. Urgent, warning, and information notices sort in that order, then newest start date; three notices appear per page with an empty state when none are live.
- **Five-step wizard** — Sport, Court, Date & Time, Add-Ons, Summary — with a step indicator and full back/forward state preservation.
- **Live availability**: the time-slot grid greys out occupied slots before submit.
- **Member-aware**: a logged-in member with an active membership gets member pricing and a pre-filled contact step, in a single pricing phase. Anonymous bookers are priced at the non-member rate throughout.
- **Guest count** control with the universal ₱150-per-guest fee, on every booking.
- **Add-ons**: ball boy (courts only) and coaching (with pax selection on courts).
- **Full-coverage credit redemption** for members whose balance covers the whole total — confirms instantly with no payment redirect.
- **PayMongo Checkout** for everything else, with automatic redirect.
- **Confirmation page** showing a booking-details card (reference, resource, date and time, duration, guests, ball boy, coaching) and a separate pricing card (base price, itemized add-ons, total). Anonymous booking follow-up is bound to a short-lived HttpOnly browser capability; member booking follow-up is bound to the member session.

---

## Member Account

Gated on a member session; anything else redirects to login.

- **Profile** — name, email, phone.
- **Membership status card** — tier, expiry, and current credit balance.
- **Check-in credentials** — QR code plus a 6-digit fallback code, with a regenerate action.
- **Top Up F&B Credit** — four preset amounts in a modal, shown only for an active membership.
- **Renew Membership** — shown only for an expired membership.
- **Recent bookings** — the 50 most recent, with real booking data.
- **Renewal and top-up confirmation pages** that poll for payment completion.

---

## Authentication

| Surface | Status |
|---|---|
| Member login (`/login`) | Live — client-side sign-in so the navbar updates immediately, with a password show/hide toggle |
| Member activation (`/activate`) | Live — sets the first password from an emailed token |
| Member forgot/reset password | Live end-to-end, enumeration-safe and rate-limited |
| Admin login (`/admin/login`) | Live, rate-limited, with an error modal |
| Admin forgot/reset password | Live end-to-end and rate-limited |
| Sign out | Confirmation modal required on the public navbar |

Both member and admin auth run on Auth.js v5 with JWT sessions. Every admin surface re-checks the admin's active flag against the database on each request.

---

## Membership

- **Application** (`/membership/apply`) — multipart form with three government ID uploads to private storage. Duplicate applications are blocked with a distinct message per case, surfaced in a dismissible modal.
- **Admin review** — approve or reject, with a mandatory rejection reason.
- **Tier-activation payment** (`/membership/pay/[id]`) plus a confirmation poller.
- **Self-service renewal** (`/account/renew`) and **admin-initiated renewal links** (`/membership/renew/[id]`).
- **Credit top-up** — self-service via PayMongo, and admin-logged cash or manual-online at the front desk.
- **Membership certificate PDF** attached to first-time activation emails only.

---

## Admin Panel

Eight sections, all gated by the shared admin session check and all supporting Light / Dark / System theming stored per-browser.

> The admin panel is **tablet-and-up only** by decision — no mobile-width support is planned. See [decisions.md](decisions.md).

### Dashboard

- **Six stat cards**: Bookings Today, Booking Revenue This Month, Membership Revenue This Month, Pending Applications, Active Memberships, Resource Utilization.
- **Revenue Trend chart** with a Booking/Membership view toggle, a range selector (3mo / 6mo / 12mo / YTD), and per-view breakdowns — Booking: Total or By Resource Type; Membership: Total, By Tier, or Top-Ups.
- **Booking-activity calendar** showing confirmed-booking volume per day through a five-step blue intensity scale, with previous/next month navigation.
- **Recent Bookings** and **Pending Applications** lists.

Booking revenue and membership revenue are counted separately and cannot overlap: booking revenue counts only payments attached to a booking, while membership revenue counts activation/renewal payments plus top-ups.

### Bookings

List with a working search bar and a filter modal, both server-side and composable. Both list and detail show the true grand total (including add-ons), the PayMongo payment id, and the net settled amount; the detail page additionally shows the PayMongo fee. Reschedule is a collapsed-by-default foldable section with a date calendar and live available-time grid for the booking's resource and duration; the database remains the final conflict authority at confirmation. CSV export honours the current filters and exports every matching row, not just the current page.

### Resources & Pricing

Tabbed as Courts / Simulators / Guest Fee.

- Resources are **edit and disable/enable only** — no create or delete. A resource disabled by an announcement is labelled as such.
- Pricing and add-on rows have full create/edit/delete, gated by the valid-combination allow-list, so an unoffered combination has no "+ Add" control at all.
- The guest fee is **edit-only**, permanently.

### Memberships

List and detail with approve/reject. The status filter splits on derived display status. CSV export is functional.

- A **pending** application's detail page shows an identity-verification lightbox gallery and a sticky Approve/Reject bottom bar.
- An **active or expired** member's page shows a header with name and "Member since", a four-cell quick-stats row, member information and membership detail cards, a collapsible verification-documents section, and credit-transaction and booking histories (capped at 10 rows each, no pagination).
- Actions: Send Renewal Link (expired only) and Add Credit (active only).

### Announcements

Paginated create/read/update/delete for short booking notices, with urgency, an operational window (Affects from / Affects until), an optional earlier Show-notice-from date, optional resource links, and a separate auto-disable toggle. Rows show inactive, scheduled (not yet visible), announced (visible as advance notice, not yet in effect), live, or expired state plus affected resources and whether they are taken offline.

### News

Paginated create/read/update/delete for rich-text stories. The editor supports headings, lists, blockquotes, emphasis, and safe links. The add/edit modal shows fields on the left and a live preview on the right (`lg` and up) that updates as you type, switchable between the `/news` card (featured horizontal card when "Feature this post" is checked, otherwise the standard grid card) and the full `/news/[slug]` article view. The modal does not close on backdrop click; closing via X, Cancel, or Escape with unsaved changes asks for confirmation first. Rows show cover, category, draft/scheduled/published state, featured state, and publication date. Published posts require a JPEG/PNG cover of at most 5 MB; migrated legacy posts may retain a null cover.

### Check-In

Camera QR scanning plus a rate-limited manual code fallback, sharing one result card across four states.

### Settings

Three tabs:

- **My Account** — change password, theme toggle.
- **Admin Users** — list with Deactivate/Reactivate. **No create-new-admin UI.**
- **Activity Log** — paginated (20 per page, newest first), read-only. **No filter UI.**

---

## Transactional Email

All email shares one branded layout. **Fifteen senders** are live, sending from a verified domain:

| Group | Emails |
|---|---|
| Member lifecycle | Activation (with certificate PDF), membership payment link, renewal, renewal payment link, expiry reminder, expired notice, rejection |
| Auth | Member password reset, admin password reset |
| Booking | Booking confirmation, reschedule notice |
| Credit | Top-up confirmation |
| Staff notifications | New booking, new application, membership activation, membership renewal |

Booking confirmation and staff booking notification emails show a base-rate price row followed by an indented, itemized add-ons breakdown.

---

## Scheduled Jobs

Two daily cron jobs, both secret-authenticated:

- **Expire bookings** — cancels stale holds, expires their PayMongo sessions, and releases or applies announcement-driven resource disables.
- **Membership reminders** — 14-day and 3-day expiry reminders plus expired notices, each stamped per-row so they can never double-send.

---

## Cross-Cutting UI

- **Loading overlay** — a shared full-screen spinner is the standard in-flight state for all customer-facing submit and redirect buttons. Buttons keep a permanent static label and are disabled while loading, rather than swapping their own text. **The admin panel is not yet wired to this.**
- **Modal** — one shared component with a brand variant (public site) and a neutral variant (admin). A shared confirm modal backs every admin confirmation; no native browser `confirm`/`alert` remains.
- **Admin activity log** — approve/reject, reschedule, renewal-link sends, and admin credit top-ups each write an audit row.

---

## Explicitly Not Built

- Additional admin roles beyond the single `admin` role
- A create-new-admin UI or route
- Activity log filtering
- Admin-panel loading-overlay wiring
- Any POS functionality
- Automated tests

Further detail and reasoning in [roadmap.md](roadmap.md).
