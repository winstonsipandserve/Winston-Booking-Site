# Home Page Mobile-Responsiveness Audit

**Date**: 2026-08-21
**Method**: Playwright MCP, dev server at `http://localhost:3000`, audit-only (no code changes)
**Widths tested**: 320×800, 375×812, 414×896, 639×900 (all below Tailwind's `sm:640` breakpoint except 639, which sits just under it)
**Confirmed**: `src/app/globals.css`'s `@theme` block defines only color/font/shadow tokens — no breakpoint overrides. `sm`/`md`/`lg` are Tailwind's stock 640/768/1024px throughout this audit.

No horizontal overflow (`scrollWidth` vs `clientWidth`) was found at any of the four widths on any section.

---

## Summary (ordered for a fix prompt)

### Blocking
1. **TwoSides — "Book a Court →" link is unreadable at all four mobile widths.** The link's `text-accent-primary` color (`#C08552`) sits almost exactly on top of the section's own mid-gradient color at the link's scroll position, producing a measured contrast ratio of roughly **1.07:1** (WCAG AA requires 4.5:1). Confirmed both by computed-style/contrast-math and visually in screenshots at 320px and 639px. Root cause: the section uses `bg-gradient-to-b` (vertical, light→dark) below `md:`, but only switches to `md:bg-gradient-to-r` (horizontal) at 768px+, where the link sits safely in the light-background left column. Below `md`, the vertical gradient's midpoint (where the link happens to land) is a muddy tan almost identical to the link's own color. See `src/components/home/TwoSides.tsx:22-27`.

### Polish
2. **Navbar — mobile menu panel vs. header-bar opacity mismatch when opened unscrolled.** When the hamburger is tapped before any scrolling (`scrolled === false`), the top header strip stays nearly transparent (`bg-brand-light/[0.01]`) and still shows the Hero background image behind the logo/close button, while the dropdown panel immediately below it renders on a solid `bg-brand-light` cream background. The visual seam between a see-through strip and an opaque panel looks unfinished. See `src/components/layout/Navbar.tsx:35-37` (header background) vs. `Navbar.tsx:123` (menu panel background). Present at 320/375/414/639.
3. **Hamburger button tap target is 40×40px**, under the ~44px recommended minimum, at every mobile width (`h-10 w-10` in `Navbar.tsx:110`).
4. **TwoSides and Footer text links have short vertical tap targets** — "Book a Court →" / "Visit the Café →" measure ~121×20px, and each Footer Quick Link measures roughly 19px tall (no padding, just line-height). Not unreadable, just tight targets for touch. `TwoSides.tsx:22-27,45-50`, `Footer.tsx:73-78`.
5. **StatsBar's "Courts & Simulators" label wraps to two lines while its grid siblings stay on one**, at all mobile widths (2-column layout means the label only has ~150px of column width). Not clipped, just visually uneven row height. `StatsBar.tsx:33-35`.

### Non-issues / caveats worth noting
- A floating circular "N" badge appears bottom-left in every screenshot — this is the **Next.js dev-tools indicator**, dev-only, not present in a production build. It happened to sit near the "Visit the Café →" link in the open mobile menu; re-verify that area isn't obstructed by anything real once built for production.
- Two console warnings appear on every load (`next/image` missing `sizes` prop, and an LCP `loading="eager"` suggestion for `/images/placeholder.jpg` in Facilities) — these are Next.js dev performance hints, not responsive-layout bugs, and are not width-dependent. Flagging for awareness only.

---

## Navbar

- **320×800**: No overflow. Logo + hamburger fit with room (`header` 305×44, hamburger 40×40 at x=241). Hamburger tap target is under 44px (see Polish #3). Opening the menu reveals the header-strip/panel opacity mismatch (Polish #2) — screenshot confirms the Hero court image bleeding through the top strip while the dropdown below is solid cream.
- **375×812**: No issues beyond the same #2/#3 (unchanged across widths — hamburger stays 40×40, header transparency logic is width-independent).
- **414×896**: Same as above, no new issues. No overflow.
- **639×900**: Desktop nav (`ul.hidden md:flex`) confirmed still `display: none`, hamburger confirmed still `display: flex` — mobile nav correctly persists right up to the `md:768` boundary, not `sm:640`. No overflow. Same #2/#3 apply.

## Hero

- **320×800**: No issues found. Eyebrow/wordmark/tagline/CTA all render well below the transparent header (header bottom=44px, hero content starts at y=220) — no obscuring. `min-h-screen` (not `min-h-[85vh]` as the prompt assumed — current source uses `min-h-screen`) content is vertically centered and fits without clipping at 800px viewport height.
- **375×812**: No issues found — same layout, comfortably centered.
- **414×896**: No issues found.
- **639×900**: No issues found — confirmed via screenshot: navbar stays transparent/unobtrusive over the hero image, wordmark and CTA fully legible, "Book Now" button sized well (171×48 well above the 44px tap-target floor).

## StatsBar

- **320×800**: No overflow. Grid confirmed 2 columns (`grid-cols-2`, `sm:grid-cols-4` not yet active) as designed — this is intentional, not a bug. "Courts & Simulators" wraps to 2 lines vs. single-line siblings, causing uneven cell heights within a row (Polish #5). All values remain fully legible, no clipping.
- **375×812**: Same 2×2 layout, same 2-line-label asymmetry (Polish #5). No blocking issues.
- **414×896**: Same pattern, no new issues.
- **639×900**: Still 2 columns (`sm:grid-cols-4` requires 640px, and 639 is one pixel short) — confirms the layout does **not** silently break while waiting for the `sm:` breakpoint; it simply stays in the 2×2 arrangement, which still reads cleanly at this width. No issues found.

## HowItWorks

- **320×800**: No issues found. Steps stack in a single column with the numbered circle + connecting vertical line rendering correctly (circle 56×56, well above tap-target minimum, though not a link so not tap-target-relevant). Text wraps normally, no clipping.
- **375×812**: No issues found.
- **414×896**: No issues found.
- **639×900**: No issues found — screenshot confirms the connecting line stays aligned through all three circles, headings and body copy read cleanly, generous spacing.

## TwoSides

- **320×800**: **Blocking** — "Book a Court →" link is essentially invisible (contrast ~1.07:1) at the vertical gradient's midpoint; see Summary #1. Layout itself collapses correctly to a single stacked column (`grid-cols-1`, no `md:grid-cols-[1fr_auto_1fr]` yet), sunburst-in-circle divider (64×64) is legible and centered between the two stacked blocks. "Visit the Café →" (bottom, dark-background half) has good contrast and is fully legible.
- **375×812**: Same blocking contrast issue reproduces (measured fraction along gradient ~0.494, same as 320px). Stacked single-column layout otherwise fine.
- **414×896**: Same blocking contrast issue reproduces (fraction ~0.494). No other issues.
- **639×900**: Same blocking contrast issue reproduces (fraction ~0.510, link has drifted slightly but remains in the unreadable middle band) — confirmed visually via screenshot, "BOOK A COURT" text is barely perceptible against the background. Single-column stacking and sunburst divider remain otherwise correct.

## Facilities

- **320×800**: No overflow. Grid degrades to 2 columns (`grid-cols-2`) with the large "Tennis Courts" tile spanning both columns/2 rows (257×256) above a clean 2×2 grid of smaller tiles (120×160 each). No squashing or overlap; labels legible (e.g. "Golf Simulator" wraps to 2 lines within its tile, no clipping).
- **375×812**: Same pattern scaled up (large tile 312×256, small tiles 148×160). No issues found.
- **414×896**: Same pattern (small tiles 167.6×167.6-ish columns). No issues found.
- **639×900**: Still 2 columns (`md:grid-cols-4` requires 768px) — large tile 576×256, small tiles 280×160 each. Degrades sanely, no overlap, confirms nothing relies on an unreached `sm:`/`md:` class to avoid breaking.

## CtaBanner

- **320×800**: No issues found. Buttons stack full-width vertically (`flex-col`, `sm:flex-row` not yet active — expected below 640px) with comfortable spacing and tap targets (48–50px tall). The large decorative sunburst (`-right-56`, 700×700) is clipped by the section's `overflow-hidden` and rendered at low opacity (`text-accent-light/[0.16]`); screenshot confirms it reads as a subtle background texture, not overwhelming the "Ready to Play?" copy.
- **375×812**: Same stacked-button layout, same subtle sunburst treatment. No issues found.
- **414×896**: No issues found.
- **639×900**: Buttons still stacked (`sm:flex-row` requires 640px, one pixel away) — reads fine full-width, not cramped. No issues found.

## Footer

- **320×800**: No overflow. All three columns (`grid-cols-1`, `md:grid-cols-3` not yet active) stack cleanly: brand block → Contact → Quick Links, no overlap or misalignment. Quick Link items have short (~19px) individual tap targets (Polish #4) but adequate `gap-3` spacing between them mitigates mis-taps. Bottom copyright bar also stacks (`flex-col`, `sm:flex-row`) and is legible.
- **375×812**: Same clean single-column stacking. No new issues.
- **414×896**: Same. No new issues.
- **639×900**: Still single column (`md:grid-cols-3` requires 768px) — confirmed this doesn't look broken or prematurely cramped at this width; content has plenty of room. No issues found.
