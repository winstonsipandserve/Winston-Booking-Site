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

---

## Re-verification — 2026-08-31

**Method**: Playwright/browser-automation MCP against the local `dev` server, same 4 widths, audit-only (re-check + new-issue scan, no code changes). Contrast ratios are computed with the WCAG relative-luminance formula. For solid/gradient backgrounds (TwoSides) the background color at the text's exact position is computed analytically from the live gradient stops. For photo backgrounds (Hero, CtaBanner) the actual rendered image is drawn to an offscreen canvas and sampled pixel-by-pixel underneath each text element's bounding box (avg across a 6–9×2–3 point grid per element; Hero's tagline was additionally checked point-by-point for worst-case dips). Current on-disk state includes the uncommitted `CtaBanner.tsx` change and new `cta-background03.jpg`/`cta-background02.jpg` files noted in git status — CtaBanner is currently wired to **`cta-background03.jpg`**.

### Part 1 — Original 5 findings

1. **TwoSides "Book a Court →" contrast — still blocking, ratio changed but still fails.** Re-measured against the current gradient colors (`brand-light` #FDF3E7 → `brand-dark` #321E1E) at the link's actual scroll position:
   - 320×800: **1.62:1** (fraction 0.509)
   - 375×812: **1.68:1** (fraction 0.494)
   - 414×896: **1.61:1** (fraction 0.510)
   - 639×900: **1.61:1** (fraction 0.510)
   All four are still far below the 4.5:1 AA minimum — still a blocking failure. The absolute ratio moved from the original ~1.07:1 to ~1.6–1.7:1 (the 2026-08-30 repaint's new `accent-primary` #CD1818 sits slightly less on top of the new gradient midpoint than the old palette did), but this is nowhere near a fix — the link remains effectively unreadable at its mid-gradient landing position. Root cause (the `bg-gradient-to-b` below `md:` vs `md:bg-gradient-to-r` split) is unchanged. **STILL BLOCKING.**

2. **Navbar mobile-menu opacity mismatch — still present, unchanged.** Re-confirmed at all 4 widths, checked immediately on a fresh unscrolled load (menu opened before any scroll): header background alpha ≈ **0.012** (`bg-brand-light/[0.01]`) vs. the dropdown panel's alpha **1.0** (solid `rgb(253,243,231)`). The transparent-strip-over-solid-panel seam is visually identical to the original screenshot — Hero's tennis-court photo still bleeds through the header strip while the panel below is opaque cream. **STILL PRESENT, unchanged.**

3. **Hamburger tap target — still 40×40px at all 4 widths.** The corner-rounding pass (`rounded-full` → `rounded-none`) did not change the button's box size — confirmed `w-10 h-10` (40×40px) at 320/375/414/639, still under the ~44px recommended minimum. **STILL BLOCKING (minor), unchanged size.**

4. **TwoSides/Footer link tap-target height — unchanged.** TwoSides "Book a Court →" link measures **121×20px** at all 4 widths (identical to original). Footer "Book Now" quick-link measures **63×19px** at all 4 widths (originally reported ~19px — confirmed). **UNCHANGED.**

5. **StatsBar "Courts & Simulators" 2-line wrap — still wraps at 320/375/414, but resolved at 639.** Measured via rendered line-box height vs. the single-line "Sports" sibling in the same row:
   - 320×800: courts label 32px vs. sports 16px → **wraps to 2 lines**
   - 375×812: 32px vs. 16px → **wraps**
   - 414×896: 32px vs. 16px → **wraps**
   - 639×900: **16px vs. 16px → does NOT wrap**, confirmed visually (screenshot shows "COURTS & SIMULATORS" on one line, same row height as "SPORTS")
   This is a genuine change from what the original audit's Summary line implied ("at all mobile widths") — the 639px column is wide enough (~295px vs. 320px's ~127px) for the label to fit on one line, and the original per-width 639 entry itself never explicitly re-confirmed the wrap (it only said "no issues found"). **CHANGED: still wraps below 639px, resolved at 639px** — not a fix, just a width where the two-column layout happens to have enough room.

### Part 2 — Background-swapped sections

**CtaBanner** (gradient+Sunburst → `cta-background03.jpg` photo + flat `bg-brand-dark/70` overlay) — **no new issues at any of the 4 widths.**
- Image loads correctly at all 4 widths (verified via direct fetch + manual decode, since the on-page `<img>` is `loading="lazy"` and didn't fire in this automation harness — not a real bug, a testing-tool limitation, see note below).
- Contrast, effective background = photo pixel blended with the 70%-opacity overlay, sampled under each text/button element:

  | Width | Heading "Ready to Play?" | Subtext | "Book Now" (solid btn) | "Explore Membership" (outline btn) |
  |---|---|---|---|---|
  | 320 | 12.09:1 | 9.38:1 | 5.12:1 | 15.43:1 |
  | 375 | 11.85:1 | 9.98:1 | 5.12:1 | 15.68:1 |
  | 414 | 12.11:1 | 9.62:1 | 5.12:1 | 15.46:1 |
  | 639 | 12.48:1 | 10.62:1 | 5.12:1 | 14.79:1 |

  All comfortably clear the 4.5:1 AA minimum at every width — the 70% dark overlay does its job. (`bookBtn`'s ratio is constant because it's white text on the solid `accent-primary` button color, not the photo — unaffected by the background swap.)
- No awkward crop/cutoff: checked with the overlay temporarily hidden at 320px — the photo is a tight close-up of a pickleball racket/ball, no edge artifacts or subject cutoff at this crop.
- Buttons remain comfortably tappable: 48px ("Book Now") / 50px ("Explore Membership") tall at all 4 widths, still stacked full-width (`flex-col`; still column at 639 since `sm:640` isn't reached yet) — same pattern as the original audit found pre-swap.
- Worth noting as a design observation, not a defect: with the overlay applied, the photo is barely perceptible behind the text (reads as near-solid dark brown) — this is clearly intentional per the "flat overlay" framing in the 2026-08-30 commit message, not a rendering bug.

**Hero** (dark overlay removed → bare photo + `.hero-text-shadow` utility) — **no blocking issue found; one minor caveat.**
- Average contrast (text color vs. sampled photo background across each element's bounding box), all 4 widths:

  | Width | Eyebrow | Headline "Winston" | "Sip & Serve" | Tagline |
  |---|---|---|---|---|
  | 320 | 5.34:1 | 5.80:1 | 5.67:1 | 4.96:1 |
  | 375 | 5.33:1 | 5.80:1 | 5.67:1 | 5.02:1 |
  | 414 | 5.31:1 | 5.77:1 | 5.69:1 | 5.16:1 |
  | 639 | 5.29:1 | 5.78:1 | 5.69:1 | 5.68:1 |

  All four text elements clear 4.5:1 AA at every width — and that's the raw ratio *without* crediting `.hero-text-shadow`'s `0 2px 16px rgba(0,0,0,.65)` + `0 1px 4px rgba(0,0,0,.5)`, which adds real additional legibility on top of these numbers. **No blocking contrast issue**, unlike TwoSides.
- Caveat: a finer point-by-point sample (27 points) across the tagline at 320px found one isolated point dipping to **~1.28:1** — a single bright court sideline crossing directly behind that narrow slice of text — while every neighboring sample point in the same line stayed 5.5–6.2:1. This is a sub-glyph-scale, momentary crossing (not a sustained patch), and the text-shadow's dark halo specifically exists to cover exactly this kind of local bright spot. Flagging it because the prompt asked for the same rigor as TwoSides, but this reads as a minor, likely-inconsequential caveat rather than a new blocking finding — worth a visual spot-check if pursued further, not worth a code change on its own.

**Note on methodology**: `window.scrollTo()`/`Element.scrollIntoView()` called via injected JavaScript do not reliably fire native `scroll` events in this automation harness, which was initially observed to leave the Navbar's `scrolled` React state stuck (falsely reporting the header as solid/scrolled after any programmatic scroll). Worked around by reloading fresh and checking the unscrolled Navbar state before doing any other scrolling for each width — not a product bug, a limitation of the test harness. Also: the dev server that was running at session start (PID 24824) had exited by the time this re-verification began; a fresh `npm run dev` was started on the same port to continue.
