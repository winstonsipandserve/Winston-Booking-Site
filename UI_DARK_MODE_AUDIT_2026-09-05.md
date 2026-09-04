# UI Dark Mode Audit — 2026-09-05

Analysis-only pass. **Zero application source files were modified to produce this report.** Scope: the six admin pages' own content (shell/Sidebar/Topbar/layout chrome, `Modal.tsx`'s `neutral`-variant chrome, `ConfirmModal.tsx`, `PasswordInput.tsx`, `SignOutButton.tsx`, and the Settings page/its two tabs are already dark-correct per the 2026-09-05 dark-mode passes and are **not** re-audited here) plus every modal whose inner content renders on those pages, plus the three unauthenticated admin auth pages. Cross-referenced against CLAUDE.md's "Admin dark/light mode" locked color-token table (Architecture Decisions).

---

## Part 1 — Table of Contents (file inventory)

**Dashboard**
1. `src/app/admin/(protected)/page.tsx`
2. `src/components/admin/DashboardStats.tsx`
3. `src/components/admin/DashboardStatCard.tsx`
4. `src/components/admin/DashboardCharts.tsx` (recharts — 3 charts)
5. `src/components/admin/DashboardActivity.tsx`

**Bookings**
6. `src/app/admin/(protected)/bookings/page.tsx`
7. `src/app/admin/(protected)/bookings/[id]/page.tsx`
8. `src/components/admin/BookingsFilterModal.tsx`
9. `src/components/admin/BookingsSearchBar.tsx`
10. `src/components/admin/RescheduleForm.tsx`

**Memberships**
11. `src/app/admin/(protected)/memberships/page.tsx`
12. `src/app/admin/(protected)/memberships/[id]/page.tsx`
13. `src/components/admin/MembershipsFilterModal.tsx`
14. `src/components/admin/MembershipReviewActions.tsx` (includes inline `RejectModal`)
15. `src/components/admin/SendRenewalLinkButton.tsx` (includes inline `TierPickerModal`)
16. `src/lib/membership-display-status.ts` (non-component — supplies the badge color/label maps consumed by #11/#12)

**Resources & Pricing**
17. `src/app/admin/(protected)/resources/page.tsx`
18. `src/components/admin/ResourcesTabs.tsx` (includes inline `ResourceTypeCard`, `PriceCell`, icon components)
19. `src/components/admin/PriceEditModal.tsx` (includes inline `PriceCreateForm`/`PriceEditForm`)
20. `src/components/admin/DisableResourceModal.tsx`

**Bulletin**
21. `src/app/admin/(protected)/bulletin/page.tsx`
22. `src/components/admin/BulletinList.tsx`
23. `src/components/admin/BulletinFormModal.tsx` (includes inline `BulletinForm`, `FormSection`)
24. `src/components/admin/BulletinAddButton.tsx`

**Check-In**
25. `src/app/admin/(protected)/check-in/page.tsx`
26. `src/components/admin/CheckInTabs.tsx`
27. `src/components/admin/CheckInScanner.tsx`
28. `src/components/admin/CheckInCodeEntry.tsx`
29. `src/components/admin/CheckInResultCard.tsx`

**Auth pages (unauthenticated)**
30. `src/app/admin/login/page.tsx`
31. `src/components/admin/AdminLoginErrorModal.tsx` (thin wrapper around already-dark `ConfirmModal` — see note in its section)
32. `src/app/admin/forgot-password/page.tsx`
33. `src/components/admin/AdminForgotPasswordForm.tsx`
34. `src/app/admin/reset-password/page.tsx`
35. `src/components/admin/AdminResetPasswordForm.tsx`

**Confirmed out of scope / not touched by this audit**: `AdminSidebar.tsx`, `AdminTopbar.tsx`, `(protected)/layout.tsx`, `Modal.tsx` (neutral variant), `ConfirmModal.tsx`, `PasswordInput.tsx` (its own default classNames), `SignOutButton.tsx`, `MyAccountTab.tsx`, `ThemeToggle.tsx`, `ProfileCard.tsx`, `ChangePasswordForm.tsx`, `AdminUsersTab.tsx`, `SettingsTabs.tsx`, `settings/page.tsx`. Also confirmed **not rendered by any in-scope page** and excluded: `ComingSoonSection.tsx` (only referenced in `PROGRESS_ARCHIVE.md`, an unused leftover component with zero Tailwind classes at all).

35 files inventoried across 9 pages, ~340 individual style declarations catalogued below.

---

## Part 2 & 3 — Per-page inventory and token mapping

Legend for Part 3 mappings: → *Table row* means it maps cleanly to CLAUDE.md's locked color-token table. → **Needs a decision** means flagged, not resolved here.

### Dashboard

**`(protected)/page.tsx`**
- `<h1>` — `text-gray-900` → *Primary text*
- `<p>` subtitle — `text-gray-500` → *Muted/secondary text*
- No background/border classes on this file itself (relies on `main`'s theme-agnostic background).

**`DashboardStatCard.tsx`** (5 instances via `DashboardStats.tsx`)
- Card — `rounded-2xl border border-gray-200 bg-white p-4 shadow-sm` → *Card/panel surface* + *Card/panel border*
- Icon wrapper — `text-gray-400` → **Needs a decision** (icon-muted tone sits between "Muted/secondary text" `text-gray-500` and no existing lighter-gray row; recommend `dark:text-gray-500`, consistent with the muted-text row, but not literally in the table)
- Label — `text-xs font-medium uppercase tracking-wide text-gray-500` → *Muted/secondary text*
- Value — `text-2xl font-semibold text-gray-900` → *Primary text*
- Optional note — `text-xs text-gray-500` → *Muted/secondary text*

**`DashboardCharts.tsx`** — three recharts charts, entirely inline JS props, **zero Tailwind classes control the plotted regions** — none will pick up a `dark:` variant automatically. Inventoried separately per the checkpoint requirement:
- Card wrappers (×3) — `rounded-2xl border border-gray-200 bg-white p-4 shadow-sm` → *Card/panel surface* + border (same as stat cards)
- Section headings (×3) — `text-sm font-semibold text-gray-900` → *Primary text*
- **Bookings Trend (bar chart)**:
  - `CartesianGrid stroke="#e5e7eb"` (gridlines) — **Needs a decision**
  - `XAxis`/`YAxis` `tick={{ fill: '#6b7280' }}`, `axisLine={{ stroke: '#e5e7eb' }}` — **Needs a decision**
  - `Tooltip contentStyle={tooltipStyle}` = `{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }` — **Needs a decision**
  - `Legend wrapperStyle={{ color: '#6b7280' }}` — **Needs a decision**
  - `Bar` series fills: `#111827` (Confirmed), `#6b7280` (Pending), `#d1d5db` (Cancelled) — **Needs a decision**
- **Revenue Trend (area chart)**:
  - Same `CartesianGrid`/`XAxis`/`YAxis`/`Tooltip` treatment as above — **Needs a decision**
  - `linearGradient#revenueFill` stops `#111827` at 0.8→0 opacity — **Needs a decision**
  - `Area stroke="#111827"` — **Needs a decision**
- **Bookings by Resource Type (donut/pie chart)**:
  - `RESOURCE_COLORS = ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db']` (5-segment grayscale ramp, also reused for the legend dots via inline `style={{ backgroundColor }}`) — **Needs a decision**
  - `Tooltip contentStyle={tooltipStyle}` — same as above — **Needs a decision**
  - Legend list text — `text-xs text-gray-600` (label) / `text-gray-900` (name) / `text-gray-500` (count) → *Muted/secondary text* + *Primary text* (the swatch dots themselves are the flagged item, not this text)

**`DashboardActivity.tsx`**
- Two card wrappers — `rounded-2xl border border-gray-200 bg-white p-4 shadow-sm` → *Card/panel surface* + border
- Section headings — `text-sm font-semibold text-gray-900` → *Primary text*
- Empty-state text (×2) — `text-sm text-gray-500` → *Muted/secondary text*
- `BookingStatusPill`:
  - Confirmed — `bg-gray-900 text-white` → maps directly to *Active/selected button (inverted)* row (`dark:bg-gray-100 dark:text-gray-900`)
  - Pending — `bg-gray-100 text-gray-500` → **Needs a decision** (no "neutral pill" row exists distinct from card surface; closest analogy is the outline/muted pairing, not a literal table row)
  - Cancelled — `bg-gray-100 text-gray-400 line-through` → **Needs a decision** (same as above, plus the `line-through` itself is unaffected by theme)
- Recent Bookings list — reference `font-mono text-xs text-gray-500`, row text `text-sm text-gray-900` → *Muted text* + *Primary text*
- Pending Applications count pill — `bg-gray-100 text-gray-600` → **Needs a decision** (same neutral-pill gap as above)
- Application row — `text-sm font-medium text-gray-900` / `text-xs text-gray-500` → *Primary text* / *Muted text*
- "Review →" link — `text-xs text-gray-500 hover:text-gray-900` → *Muted text*, hover → *Primary text* (no table row for a hover-to-primary link exactly, but directionally consistent)

---

### Bookings

**`bookings/page.tsx`**
- `<h1>` — `text-2xl font-semibold text-gray-900` → *Primary text*
- "Export" button (non-functional stub) — `rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50` → *Outline/cancel button* row
- Table wrapper — `rounded-xl border border-gray-200` → *Card/panel border*
- `<thead>` — `sticky top-0 z-10 bg-gray-50` → **Needs a decision** (no explicit "table header background" row in the locked table — closest is *Card/panel surface*, but `bg-gray-50` is the page-shell token, not the card token; needs an explicit call on which one a sticky table header should use)
- `<th>` cells — `border-b border-gray-200 ... text-gray-700` → *Nested/inset border* row; `text-gray-700` has no exact table entry (between primary `text-gray-900` and muted `text-gray-600`) — **Needs a decision**
- `<tr>` rows — `border-b border-gray-100 last:border-b-0 hover:bg-gray-50` → *Nested/inset border* (close; table uses `border-gray-200` for nested, this is `-100`) — **Needs a decision** on whether `border-gray-100` gets its own darker-still shade or collapses to the same `dark:border-gray-700` as `-200`
- `<td>` cells — `text-gray-900` (most), `text-gray-500` (submitted time, reference id is `font-mono text-xs text-gray-500`) → *Primary text* / *Muted text*
- "View" action link — `rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100` → *Outline/cancel button* row
- Empty-state row — `px-4 py-6 text-center text-gray-500` → *Muted text*
- Pagination — `text-sm text-gray-600` body, `font-medium text-gray-900 hover:underline` for Prev/Next links → *Muted text* / *Primary text*

**`bookings/[id]/page.tsx`** — **Flagged separately: this entire page carries zero Tailwind classes.** It is raw unstyled HTML (`<table cellPadding={4}>`, `<table border={1}>`, bare `<h1>`/`<h2>`/`<section>`) relying entirely on browser default black-on-white rendering. This is not a "missing `dark:` variant" gap in the normal sense — the page was never brought onto the admin design system at all, light or dark. It cannot be given a `dark:` treatment until it first has a light-mode Tailwind pass matching the rest of the admin panel. Flagged prominently in "Needs a mapping decision" below rather than itemized line-by-line, since there is no existing light-mode class to map from.
- Back link, `<h1>`, all `<h2>` section headers, all table cells, Customer/Add-ons/Payment/Reschedule-history text — plain, no classes.
- Reschedule-history `<table border={1}>` — inline `style={{ borderCollapse: 'collapse' }}`, no color styling at all.

**`BookingsFilterModal.tsx`** (renders inside already-dark `Modal` `neutral` chrome — inner content not yet swept)
- Trigger button — `rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50` → *Outline/cancel button*
- Active-filter dot — `h-1.5 w-1.5 rounded-full bg-gray-900` → *Active/selected button* token family (`dark:bg-gray-100`) — reasonable but the dot has no text pairing, so purely a background swap
- Section labels — `text-xs font-semibold uppercase tracking-wide text-gray-500` → *Muted text*
- Radio labels — `text-sm text-gray-900` → *Primary text*
- Date inputs — `rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900` → *Form input* row
- Date sub-labels ("From"/"To") — `text-xs text-gray-600` → *Muted text*
- "Clear" button — `rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50` → *Outline/cancel button*
- "Run" button — `rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800` → *Active/selected button (inverted)*

**`BookingsSearchBar.tsx`**
- Input — `rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none` → *Form input* row (placeholder/focus-border have no explicit dark equivalent yet — **Needs a decision** on placeholder/focus-border shade)
- "Search" button — `rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50` → *Outline/cancel button*

**`RescheduleForm.tsx`** — **Also entirely unstyled**, same finding class as the Booking detail page: bare `<form>`/`<label>`/`<input>`/`<textarea>`/`<button>` with only inline `style={{ marginTop, marginBottom, color: 'red' }}` layout hacks, no Tailwind at all. Cannot be dark-swept without a light-mode pass first.

---

### Memberships

**`membership-display-status.ts`** (supporting file, not a page — feeds badges on #11/#12)
- `MEMBERSHIP_DISPLAY_STATUS_CLASSES`:
  - `pending` — `bg-amber-100 text-amber-800` → **Needs a decision**
  - `awaiting_payment` — `bg-blue-100 text-blue-800` → **Needs a decision**
  - `active` — `bg-gray-900 text-white` → *Active/selected button (inverted)* row
  - `expired` — `bg-orange-100 text-orange-800` → **Needs a decision**
  - `rejected` — `bg-red-100 text-red-800` → **Needs a decision**

**`memberships/page.tsx`**
- `<h1>` — `text-gray-900` → *Primary text*
- "Export" stub button — same as Bookings → *Outline/cancel button*
- Table wrapper/header/rows/cells — identical pattern to Bookings' table (see above): `bg-gray-50` sticky header (**Needs a decision**, same as Bookings), `border-gray-200`/`border-gray-100` borders (*Nested/inset border* + **Needs a decision** on the `-100` shade), `text-gray-700` header text (**Needs a decision**), `text-gray-900` body text (*Primary text*)
- Status badge cell — renders the `MEMBERSHIP_DISPLAY_STATUS_CLASSES` above, `rounded-full px-3 py-1 text-xs font-medium` wrapper — inherits the same flagged colors
- "View" link — same *Outline/cancel button* pattern as Bookings
- Empty state, pagination — identical patterns to Bookings (*Muted text* / *Primary text*)

**`memberships/[id]/page.tsx`**
- Back link — `text-sm text-gray-500 hover:text-gray-900` → *Muted text*, hover → *Primary text*
- `<h1>` — `text-xl font-semibold text-gray-900` → *Primary text*
- App ID — `text-xs font-mono text-gray-400` → **Needs a decision** (lighter than the documented muted tones `text-gray-500`/`text-gray-600`; no table row for `text-gray-400`)
- Status badge (top) — same flagged `MEMBERSHIP_DISPLAY_STATUS_CLASSES` as above
- Section cards (Applicant/Application/Review/Government ID) — `rounded-xl border border-gray-200 bg-white p-5` → *Card/panel surface* + border
- Section headings — `text-sm font-semibold text-gray-900` → *Primary text*
- Field rows — `border-b border-gray-100` divider → **Needs a decision** (same `-100` vs `-200` nested-border question as the tables above); label `text-gray-500` → *Muted text*; value `font-medium text-gray-900` → *Primary text*
- "Not yet reviewed" — `text-sm italic text-gray-400` → **Needs a decision** (same `text-gray-400` gap as App ID above)
- Gov-ID thumbnails — `aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50` (image placeholder background) → border maps to *Card/panel border*; `bg-gray-50` fill has no direct row (closest is page-shell background, not card) — **Needs a decision**
- Gov-ID captions — `text-xs font-medium uppercase tracking-wide text-gray-500` → *Muted text*
- Review-actions/renewal section headings — `text-sm font-semibold text-gray-900` → *Primary text*

**`MembershipsFilterModal.tsx`** — same structural pattern as `BookingsFilterModal.tsx` (trigger button, active-filter dot, section label, radio labels, Clear/Run buttons) → all map identically: *Outline/cancel button*, *Active/selected (inverted)*, *Muted text*, *Primary text*.

**`MembershipReviewActions.tsx`**
- Approve button — `rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700` → **Needs a decision** (green CTA, no token in the locked table covers a non-danger colored action button; also worth flagging that this pre-dates and sits outside the documented "no green status-badge" convention, which was scoped to badges, not buttons)
- Reject button — `rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50` → **Needs a decision** (outline-danger button, not covered by the *Danger button* row, which is filled-red only)
- Inline error text — `text-sm text-red-600` → **Needs a decision** (no explicit dark-red text token; `ConfirmModal`'s existing `dark:text-red-400` pattern elsewhere in the app is a plausible precedent, not yet codified in the locked table)
- **`RejectModal` (inline in this file)** — renders via bare `<Modal isOpen={isOpen} onClose={onClose} title="...">` with **no `variant="neutral"` prop passed**, meaning it silently renders on the public-site **`brand`/cream** styling (`bg-brand-light`, `border-brand-dark/10`, `font-serif text-brand-dark` heading) inside the admin panel — the same class of pre-existing bug already fixed once for `DisableResourceModal.tsx` (2026-09-04) and `PriceEditModal.tsx` (2026-09-05). This is **not a dark-mode gap**, it's a pre-existing light-mode defect that also blocks any dark-mode treatment, since the `brand` variant has no `dark:` styling at all by design. Flagged prominently below.
  - Its inner form content (textarea, Cancel/Reject buttons) *does* carry gray-scale admin classes (`border-gray-200`, `text-gray-900`, `bg-gray-50` hover, `bg-red-600`/`hover:bg-red-700` Reject button) that would map normally once the variant bug is fixed — *Form input* / *Outline/cancel button* / **Needs a decision** (red button, no danger-with-outline-cancel-pair token drift, though `bg-red-600`/`hover:bg-red-700` alone does map to *Danger button*).

**`SendRenewalLinkButton.tsx`**
- Trigger button — `rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50` → *Outline/cancel button*
- **`TierPickerModal` (inline in this file)** — same bug as `RejectModal` above: bare `<Modal isOpen={isOpen} onClose={handleClose} title="Send Renewal Link">`, **no `variant="neutral"`**, renders brand/cream. Flagged alongside `RejectModal` below.
  - Inner content once fixed: confirmation text `text-sm text-gray-900` → *Primary text*; Close/Cancel buttons → *Outline/cancel button*; `<select>` — `rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900` → *Form input*; error text `text-sm text-red-600` → **Needs a decision** (same as above); Send Link button `bg-gray-900 ... hover:bg-gray-800` → *Active/selected button (inverted)*.

---

### Resources & Pricing

**`resources/page.tsx`**
- `<h1>` — `mb-2 text-xl font-semibold text-gray-900` → *Primary text*
- Explanatory paragraph — `mb-6 text-sm italic text-gray-400` → **Needs a decision** (same `text-gray-400` gap noted under Memberships)

**`ResourcesTabs.tsx`** — largest file in scope; grouped by element type rather than line-by-line:
- Tab bar buttons — active: `bg-gray-900 text-white` → *Active/selected (inverted)*; inactive: `text-gray-600 hover:bg-gray-100` → *Muted/secondary text* + **Needs a decision** on the hover-background shade (`bg-gray-100` has no direct dark equivalent in the table beyond the general card-surface family)
- `ResourceTypeCard` outer — `rounded-xl border border-gray-200 bg-white p-5` → *Card/panel surface* + border
- Expand/collapse header — chevron `text-gray-500` → *Muted text*; type name `text-base font-semibold text-gray-900` → *Primary text*; resource count `text-xs text-gray-500` → *Muted text*
- Resource list wrapper — `divide-y divide-gray-100 rounded-lg border border-gray-200` → **Needs a decision** on `divide-gray-100` (same `-100` vs `-200` nested-border question as elsewhere) + *Card/panel border* for the outer border
- Resource row — label `text-gray-900` → *Primary text*; disabled-reason `text-xs text-gray-400` → **Needs a decision** (same `-400` gap)
- Active/Inactive badge — `bg-green-100 text-green-800` (Active) vs `bg-gray-100 text-gray-500` (Inactive) → **Needs a decision** — green badge has no dark mapping, and this specific badge is a known **pre-existing violation** of the project's documented "no green/red Tailwind status-badge" convention (CLAUDE.md doesn't carry this rule verbatim in the excerpt reviewed, but PROGRESS.md's 2026-08-28 Bulletin entry and the neutral badge conventions used everywhere else in this same audit — Bookings' Confirmed pill, Bulletin's Published pill — confirm `bg-gray-900`/`text-white` is the established "positive" pattern; this Active badge is the outlier)
- Disable/Enable buttons — `rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50` → *Outline/cancel button* (note: `border-gray-300`, not the table's `border-gray-200` — **Needs a decision** on whether `-300` collapses to the same `dark:border-gray-700`)
- Pricing/Add-on tables (×2 per card) — header `bg-gray-50` (**Needs a decision**, same sticky-header question as Bookings/Memberships tables), `<th>` `border-gray-200 text-gray-700` (border → *Nested/inset border*; text → **Needs a decision**, same `-700` gap), `<tr>` `border-gray-100` (**Needs a decision**), `<td>` `text-gray-900` (*Primary text*)
- `PriceCell` "+ Add" button — `rounded border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700` → **Needs a decision** (dashed border has no precedent anywhere else in the locked table)
- `PriceCell` delete icon — `text-gray-300 hover:text-red-600` → **Needs a decision** (`text-gray-300` is even lighter than the other flagged `-400` cases; hover-red has no dark equivalent)
- `PriceCell` inline error — `text-xs text-red-600` → **Needs a decision** (same red-text gap as Memberships)
- `ActionIconButton` (pencil) — `text-gray-400 hover:text-gray-700` → **Needs a decision** (`-400`/`-700` pairing, neither in the table)
- Guest Fee tab — card wrapper (*Card/panel surface*), heading (*Primary text*), label `text-gray-500` (*Muted text*), value `font-medium text-gray-900` (*Primary text*), helper text `text-xs text-gray-500` (*Muted text*)

**`PriceEditModal.tsx`** (already `variant="neutral"` — correctly wired to the dark-capable `Modal` chrome, but its own inner form content is unswept)
- Form labels — `text-sm text-gray-900` → *Primary text*
- Text inputs (×2 forms) — `rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900` → *Form input*
- Field errors — `text-sm text-red-600` → **Needs a decision** (same red-text gap noted repeatedly above)
- Cancel button — `rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50` → *Outline/cancel button*
- Create/Save button — `rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800` → *Active/selected (inverted)*

**`DisableResourceModal.tsx`** (already `variant="neutral"`, fixed 2026-09-04 — inner content unswept)
- Label — `text-sm text-gray-900` → *Primary text*
- Textarea — `rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900` → *Form input*
- Error text — `text-sm text-red-600` → **Needs a decision**
- Cancel/Confirm buttons — same *Outline/cancel button* / *Active/selected (inverted)* pattern as above

---

### Bulletin

**`bulletin/page.tsx`**
- `<h1>` — `text-xl font-semibold text-gray-900` → *Primary text*
- List wrapper — `rounded-xl border border-gray-200` (+ `p-4`) → *Card/panel border*

**`BulletinAddButton.tsx`**
- Trigger button — `rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50` → *Outline/cancel button* (note `border-gray-300`/`text-gray-700`, same off-table shades flagged under Resources & Pricing)

**`BulletinList.tsx`**
- Empty-state — `text-sm text-gray-500` → *Muted text*
- Bulletin card — `rounded-xl border border-gray-200 bg-white p-4` → *Card/panel surface* + border
- Image thumbnail — `rounded-lg border border-gray-200` (image) or `bg-gray-100` (no-image placeholder) → border maps to *Card/panel border*; `bg-gray-100` placeholder fill → **Needs a decision** (same "gray-100 as a fill, not a card surface" gap noted under Memberships' gov-ID thumbnails)
- Title — `font-semibold text-gray-900` → *Primary text*
- Category pill — `border border-gray-200 bg-gray-100 text-gray-700` → **Needs a decision** (neutral pill distinct from the card-surface token, `text-gray-700` off-table as elsewhere)
- Published/Draft pill — `bg-gray-900 text-white` (Published) / `bg-gray-100 text-gray-500` (Draft) → *Active/selected (inverted)* for Published; Draft → **Needs a decision** (same neutral-pill gap as Dashboard's Pending/Cancelled pills)
- Excerpt — `text-sm text-gray-600` → *Muted/secondary text*
- Published date — `text-xs text-gray-500` → *Muted text*
- "Not yet published" — `text-xs italic text-gray-400` → **Needs a decision** (same `-400` gap)
- Edit/Delete icon buttons — `text-gray-400 hover:text-gray-700` (edit) / `text-gray-400 hover:text-red-600` (delete) → **Needs a decision** (same off-table gray pairing + hover-red gap noted repeatedly)

**`BulletinFormModal.tsx`** (already `variant="neutral"` — inner content unswept; largest form in the admin panel)
- All labels — `text-sm text-gray-900` → *Primary text* (×~13 fields)
- All text/textarea/select/date/datetime inputs — `rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900` → *Form input* (repeated ~11 times)
- File input — `text-sm text-gray-900` (no border/bg styling, native file-picker chrome) → *Primary text* only; native file-input chrome itself is unaffected by `dark:` classes (browser-rendered) — **Needs a decision** (acknowledge as a known limitation rather than something CSS alone fixes)
- Image preview — `rounded-lg border border-gray-200` → *Card/panel border*
- Checkbox label — `text-sm text-gray-900` → *Primary text* (native checkbox chrome, same browser-rendered caveat as the file input)
- `FormSection` heading — `text-xs font-semibold uppercase tracking-wide text-gray-500` → *Muted text*
- `FormSection` divider (non-first sections) — `border-t border-gray-100` → **Needs a decision** (same `-100` nested-border question)
- Footer divider — `border-t border-gray-100` → same as above
- Error text — `text-sm text-red-600` → **Needs a decision**
- Cancel/Save buttons — *Outline/cancel button* / *Active/selected (inverted)*, same pattern as every other modal

---

### Check-In

**`check-in/page.tsx`**
- `<h1>` — `text-xl font-semibold text-gray-900` → *Primary text*
- Content wrapper — `rounded-xl border border-gray-200 p-4` → *Card/panel border*

**`CheckInTabs.tsx`**
- Tab buttons — active: `border-gray-900 bg-gray-900 text-white` → *Active/selected (inverted)*; inactive: `border-gray-200 text-gray-600 hover:bg-gray-50` → *Outline/cancel button*
- Instructional text — `text-sm text-gray-500` → *Muted text*

**`CheckInScanner.tsx`**
- Scanner viewport — `rounded-xl border border-gray-200` → *Card/panel border*
- Camera-error text — `text-sm text-red-600` → **Needs a decision**
- Status text ("Point the camera…"/"Starting camera…"/"Verifying…") — `text-sm text-gray-500` → *Muted text*

**`CheckInCodeEntry.tsx`**
- Instruction text — `text-sm text-gray-500` → *Muted text*
- Code input — `rounded-lg border border-gray-200 px-4 py-2 text-center text-2xl font-semibold tracking-[0.3em] text-gray-900 focus:border-gray-400 focus:outline-none` → *Form input* (focus-border shade again **Needs a decision**, same as Bookings search bar)
- Validation text — `text-xs text-red-600` → **Needs a decision**
- Check In button — `bg-gray-900 ... hover:bg-gray-800` → *Active/selected (inverted)*

**`CheckInResultCard.tsx`** — the richest status-color surface in the whole admin panel, all **Needs a decision**:
- `not_found`/`rate_limited` — `border-red-200 bg-red-50` card, `text-red-700` header → **Needs a decision**
- `no_membership` — `border-gray-200 bg-gray-50` card, `text-gray-700` header → **Needs a decision** (bg-gray-50-as-fill gap, same as elsewhere) + off-table `text-gray-700`
- `active` — `border-gray-200 bg-white` card, `text-gray-900` header → *Card/panel surface* + border (this one already maps cleanly) + *Primary text*
- `expired` — `border-amber-200 bg-amber-50` card, `text-amber-700` header → **Needs a decision**
- Name/email — `text-base font-medium text-gray-900` / `text-xs text-gray-500` → *Primary text* / *Muted text*
- Detail rows divider — `border-t border-gray-200` → *Nested/inset border* (this one is `-200`, maps cleanly, unlike the many `-100` instances flagged above)
- Detail row labels/values — `text-gray-700` (label, off-table) / `font-medium` (value, inherits `text-gray-700` from parent) → **Needs a decision**
- Action button — `bg-gray-900 ... hover:bg-gray-800` → *Active/selected (inverted)*

---

### Auth pages (unauthenticated)

**`login/page.tsx`**
- Page background — `min-h-screen ... bg-gray-50` → *Page shell background* (maps to table row, but note: this page is never shown inside the `(protected)` shell, so its own `dark:` variant is meaningless unless a future decision is made about whether unauthenticated pages should also respect the stored theme preference — flagged, see below)
- Card — `rounded-2xl border border-gray-200 bg-white p-8 shadow-sm` → *Card/panel surface* + border
- Eyebrow text — `text-xs font-semibold uppercase tracking-wide text-gray-400` → **Needs a decision** (`-400` gap, same as elsewhere)
- `<h1>` — `text-xl font-semibold text-gray-900` → *Primary text*
- Email label — `text-sm text-gray-900` → *Primary text*
- Email input — `rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900` → *Form input*
- (Password field delegates to `PasswordInput.tsx`, already dark-correct via its own default classNames — not re-audited)
- Submit button — `bg-gray-900 ... hover:bg-gray-800` → *Active/selected (inverted)*
- "Forgot password?" link — `text-sm text-gray-500 hover:text-gray-700 hover:underline` → *Muted text*, hover has no exact table row (**Needs a decision**, minor)

**`AdminLoginErrorModal.tsx`** — thin wrapper that renders `<ConfirmModal>` with `hideCancel`/`confirmLabel="OK"`. Since `ConfirmModal` is already confirmed dark-correct (out of scope, per the "already-swept" list), **this component needs no changes of its own** — noted here only to confirm it was checked, not skipped. Flag: it inherits dark styling correctly today, but only works because the surrounding page never toggles the `dark` class outside of `localStorage`'s `winston-admin-theme` key, which is only ever set from inside `(protected)/settings` — an unauthenticated visitor on `/admin/login` who has never been in Settings will only ever see Light, regardless of OS preference, since the FOUC-prevention script that reads that key lives in `(protected)/layout.tsx`, not the root layout. This is the same "meaningless dark: variant without a theme-detection script on this page" gap noted for the page background above.

**`forgot-password/page.tsx`** — same shell pattern as `login/page.tsx`: page background (*Page shell background*, same theme-detection-script caveat), card (*Card/panel surface* + border), eyebrow text (**Needs a decision**, `-400`), `<h1>` (*Primary text*), description paragraph `text-sm text-gray-500` (*Muted text*).

**`AdminForgotPasswordForm.tsx`**
- Success message — `mt-6 text-sm text-gray-600` → *Muted/secondary text*
- Label — `text-sm text-gray-900` → *Primary text*
- Email input — `rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:opacity-50` → *Form input* (disabled-opacity state has no explicit dark note, likely fine as-is but unverified)
- Error text — `text-sm text-red-600` → **Needs a decision**
- Submit button — `bg-gray-900 ... hover:bg-gray-800` → *Active/selected (inverted)*

**`reset-password/page.tsx`** — same shell pattern again: page background, card, eyebrow text (**Needs a decision**), `<h1>`, description `text-sm text-gray-500`, Suspense fallback `text-sm text-gray-500` → all map identically to `forgot-password/page.tsx` above.

**`AdminResetPasswordForm.tsx`**
- "Missing token" message — `mt-6 text-sm text-gray-600` → *Muted text*
- Success state — `text-sm text-gray-600` (body), `text-sm font-medium text-gray-900 hover:underline` (Go to Sign In link) → *Muted text* / *Primary text*
- (Both password fields delegate to `PasswordInput.tsx` — already dark-correct, not re-audited)
- Error text — `text-sm text-red-600` → **Needs a decision**
- Submit button — `bg-gray-900 ... hover:bg-gray-800` → *Active/selected (inverted)*

---

## Part 4 — Consolidated "Needs a mapping decision"

Grouped by category, with every page/file it recurs on. Nothing below was resolved by this audit — all require an explicit decision before implementation.

### 1. Off-table gray shades (recurs on nearly every page)
The locked table only names `text-gray-900`/`text-gray-500`/`text-gray-600` (text), `border-gray-200`/`border-gray-700` (borders), and `bg-gray-50`/`bg-gray-950` (page) / `bg-white`/`bg-gray-900` (card). In practice the codebase also uses, with no dark counterpart decided:
- `text-gray-700` — table `<th>` headers (Bookings, Memberships, Resources & Pricing), category/detail-row labels (Bulletin, Check-In)
- `text-gray-400` — italic/placeholder-ish text (`text-gray-400` app-id, "Not yet reviewed", "Not yet published", disabled-reason, eyebrow text on all 3 auth pages)
- `text-gray-300` — `PriceCell` delete icon default state
- `border-gray-100` — every table `<tr>` divider, `FormSection` dividers, gov-ID/detail-row dividers (vs. the table's own `-200`)
- `border-gray-300` — Disable/Enable buttons, `BulletinAddButton`, `PriceCell`'s dashed "+ Add" border
- `bg-gray-50` used as a **sticky table header** background (Bookings/Memberships/Resources & Pricing tables) — distinct from its documented use as *page shell background*
- `bg-gray-50`/`bg-gray-100` used as an **image-placeholder fill** (gov-ID thumbnails, Bulletin's no-image thumbnail, `no_membership` check-in card) — distinct from *Card/panel surface*
- `bg-gray-100` used as a **neutral pill background** (Dashboard's Pending/Cancelled pills, Bulletin's Draft pill, Bulletin's category pill, Resources' Inactive badge) — distinct from both card surface and page background

**Recommendation for Arjay to decide**: whether to extend the locked table with 2–3 new named tokens (e.g. a "muted-er" text tone, a "hairline" border tone, a "neutral pill" background pair) or collapse each of these onto the nearest existing token during implementation. Either is workable; this audit deliberately doesn't pick for you.

### 2. Semantic status-color badges/cards (no dark equivalent exists anywhere in the app yet)
- Membership display-status badges: `amber-100/800` (pending), `blue-100/800` (awaiting payment), `orange-100/800` (expired), `red-100/800` (rejected) — `src/lib/membership-display-status.ts`
- Resources & Pricing Active/Inactive badge: `green-100/800` — `ResourcesTabs.tsx` (also a likely pre-existing convention violation, see below)
- Check-In result cards: `red-200/50` (not found/rate-limited), `amber-200/50` (expired) — `CheckInResultCard.tsx`
- Membership review buttons: `green-600` filled (Approve), `red-300` outline (Reject) — `MembershipReviewActions.tsx`
- All inline red validation/error text (`text-red-600`/`text-xs text-red-600`) — recurs on essentially every form in scope (BookingsFilterModal indirectly via RescheduleForm's `color:'red'`, MembershipReviewActions, PriceEditModal, DisableResourceModal, BulletinFormModal, CheckInScanner/CheckInCodeEntry, all 3 auth forms)

**Recommendation**: these need real semantic dark equivalents (e.g. `amber-100/800` → `amber-900/30` bg + `amber-300` text is the conventional Tailwind dark-mode pairing), not a mechanical swap onto the existing gray/inverted tokens — this is genuinely new design decision territory, not just "pick the closest row."

### 3. Recharts' three charts (Dashboard) — structurally different problem
None of the plotted regions (gridlines, axis ticks, tooltip, legend, bar/area/pie fills) are Tailwind classes — they're inline JS style objects and hex-string props passed to `recharts` components (`DashboardCharts.tsx`). A `dark:` CSS variant cannot touch these at all. Making the charts dark-correct requires either:
- Reading the current theme in JS (e.g. checking `document.documentElement.classList.contains('dark')`, or lifting theme state into a React context `ThemeToggle.tsx` currently doesn't expose) and conditionally passing a second palette, or
- Wrapping `DashboardCharts` in a client-side theme-aware re-render.
This is a real implementation-approach decision, not a color-token lookup — flagged prominently since the checkpoint specifically called this out.

### 4. Two modals silently rendering brand/cream styling inside the admin panel (pre-existing bug, blocks dark-mode work)
- `MembershipReviewActions.tsx`'s inline `RejectModal` — `<Modal isOpen={isOpen} onClose={onClose} title="Reject Membership Application">` with no `variant` prop, defaults to `'brand'`.
- `SendRenewalLinkButton.tsx`'s inline `TierPickerModal` — same pattern, `<Modal isOpen={isOpen} onClose={handleClose} title="Send Renewal Link">`, no `variant` prop.

Both are the same class of bug already found and fixed twice before (`DisableResourceModal.tsx` on 2026-09-04, `PriceEditModal.tsx` on 2026-09-05 — see PROGRESS.md's matching entries) — an admin modal that was never given `variant="neutral"` and has been rendering on public-site brown/cream chrome the whole time. This is **not itself a dark-mode gap**; it's a light-mode defect. But it directly blocks dark-mode work on these two modals, since the `brand` variant has zero `dark:` styling by design (correctly — it's the public-site variant). **Recommend fixing the `variant="neutral"` omission first** (trivial, one prop each), then sweeping their inner content exactly like every other neutral modal in this report.

### 5. Two entirely unstyled pages/components (blocks dark-mode work, different reason than #4)
- `src/app/admin/(protected)/bookings/[id]/page.tsx` (Booking detail page)
- `src/components/admin/RescheduleForm.tsx`

Neither carries any Tailwind classes at all — bare HTML tags and native browser-default table/border rendering, plus one inline `style={{ color: 'red' }}` for RescheduleForm's error text. These cannot receive a `dark:` treatment because there is no light-mode admin-system styling to add a `dark:` variant *to* — they need a first-time Tailwind pass matching the rest of the admin panel (card/table/form conventions used everywhere else in this report) before dark mode is even a meaningful question for them. Recommend treating this as its own small prep step ahead of — or folded into — whichever grouped prompt covers Bookings.

### 6. Theme-detection script scope (auth pages)
All three auth pages (`/admin/login`, `/admin/forgot-password`, `/admin/reset-password`) sit outside `(protected)/layout.tsx`, so they never receive the FOUC-prevention `<script>` that reads `localStorage`'s `winston-admin-theme` key and applies `.dark` to `<html>` before paint. Even after these pages' own Tailwind classes gain `dark:` variants, an admin who has selected Dark in Settings will still see these three pages render Light, since nothing there ever adds the `.dark` class. Decide whether to: (a) duplicate the inline script onto these three pages too (they're unauthenticated, so `winston-admin-theme` would still be readable from a shared browser), (b) leave them permanently light by design (defensible — they're the "get back into the panel" pages, seen infrequently), or (c) something else. Not decided by this audit.

### 7. Native browser-chrome elements (file input, checkbox) — `BulletinFormModal.tsx`
The image `<input type="file">` and the Published `<input type="checkbox">` render OS/browser-native controls that Tailwind `dark:` classes cannot restyle (beyond the file input's own text label, already inventoried above). Flagging as a known limitation to set expectations for the implementation pass, not something requiring a "decision" in the same sense as the others.

---

## Tracked/untracked status of this report

`.gitignore` currently has a **specific, non-wildcard** entry for `UI_CORNER_RADIUS_AUDIT_2026-09-04.md` (that exact filename) and a **wildcard** entry for `TEST_FINDINGS_*.md`. Neither pattern covers `UI_DARK_MODE_AUDIT_2026-09-05.md` — no existing rule matches this filename, so as written this file **will be tracked** by git if committed as-is. Per instructions, no new `.gitignore` entry was added unilaterally; this is left for Arjay to decide (add a matching entry, generalize the corner-radius line into a wildcard covering both audit types, or commit it — same open-decision framing as the existing `scripts/` gitignore item in PROGRESS.md's Next Up).

---

## Summary

- **35 files** inventoried across 9 pages/auth-flows (6 admin pages + 3 auth pages), all their page-specific modals included.
- **~340 individual style declarations** catalogued (Tailwind classes, inline styles, and recharts JS color props).
- The large majority map cleanly onto CLAUDE.md's existing 9-row color-token table with no new decision needed.
- **7 categories of open decisions** consolidated in Part 4, spanning: off-table gray shades that recur everywhere, 5 distinct semantic-color surfaces with no dark equivalent yet, the 3 recharts charts (a JS-prop problem, not a CSS one), 2 modals with a pre-existing brand/neutral bug, 2 entirely unstyled files that need a light-mode pass first, the auth pages' missing theme-detection script, and 2 native-browser-chrome elements.
- Zero application source files were modified to produce this report.
