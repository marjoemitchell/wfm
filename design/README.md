# Handoff: Montana Money — campaign finance tracker

## Overview
A public-facing web app for tracking current Montana officeholders and their campaign donors. A user lands on a roster of officeholders, drills into any one to see where their money comes from (in-state vs. out-of-state, PACs vs. individuals, sector breakdown, largest donors), then clicks any donor to see every officeholder that donor funds. Supporting views aggregate money by industry, compare officeholders side by side, and map donor geography.

Working title in the design is **Montana Money**; the name is still open (MT990, Big Sky Ledger, Who Funds Montana were candidates). The masthead is a single text node — easy to swap.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. `Montana Money v2.dc.html` is written for a streaming component runtime (`support.js`) that is specific to the design tool; do not port that runtime.

The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, Svelte, Rails views, etc.) using its established patterns, routing, and data layer. If no environment exists yet, choose an appropriate stack — this is a read-heavy, server-renderable data site, so Next.js/Remix with server-side rendering and a Postgres-backed query layer is a natural fit.

The template markup uses inline styles throughout. That is a constraint of the design tool, not a recommendation: reimplement styling in whatever the codebase uses (Tailwind, CSS modules, styled-components).

## Fidelity
**High-fidelity.** Colors, typography, scale, and spacing are final and should be matched closely. Layout structure, hover states, and interaction flow are all specified below. The one exception is the donor-geography map, which is an intentionally rough schematic (a hand-approximated Montana polygon) — see *Map view* for how to do it properly.

All numbers in the prototype are **illustrative placeholder data**, not real filings.

---

## Design tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| Ground | `#0E0F12` | Page background, card interiors |
| Ground raised | `#14151A` | Row hover background |
| Ground panel | `#15161A` | Map landmass fill |
| Ink | `#E8E4DC` | Primary text (bone white) |
| Ink secondary | `#9B9A90` | Body copy, secondary values |
| Ink tertiary | `#96958B` | Sub-labels under row titles |
| Ink quiet | `#8E8D83` | Inactive nav/filter labels, rank numbers |
| Ink faint | `#8A897F` | Footer |
| Accent | `#E4322B` | Signal red — the only accent. Active underlines, eyebrow labels, primary bars, map bubbles, CTA fill |
| Accent hover | `#FF6A5E` | Link hover |
| Gold | `#E0B23C` | Secondary data series (PAC share, out-of-state states) |
| Rule strong | `#E4322B` | 1px rule under masthead and page headers |
| Rule | `#232427` | 1px section dividers |
| Rule faint | `#1B1C1F` | 1px list-row dividers |
| Track | `#26272B` | Unfilled portion of bars |
| Border | `#2E2F31` | Input underline, unchecked checkbox, button outline |
| Lead line | `#3A3B3E` | Map leader lines |
| Party — Republican | `#F08A7E` | Label text + 1px outline |
| Party — Democrat | `#8FB6E8` | Label text + 1px outline |
| Party — Nonpartisan | `#B5AFA2` | Label text + 1px outline |

Contrast note: every grey above is at or above 4.5:1 on `#0E0F12`. Do not darken them — earlier values failed WCAG AA at these sizes.

### Typography
Two families, loaded from Google Fonts:
- **Playfair Display** (400, 500, 700) — display serif. Every name, headline, and headline-scale dollar figure.
- **Archivo** (300, 400, 500, 600) — UI sans. Labels, body copy, table values, buttons, inputs.

| Role | Font | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Masthead | Playfair | 42px | 500 | -0.02em | 0.95 |
| Page headline | Playfair | 60px | 400 | -0.03em | 1.0 |
| Detail-page name | Playfair | 76px | 400 | -0.035em | 0.94 |
| Donor-page name | Playfair | 68px | 400 | -0.03em | 0.96 |
| Big stat (headline band) | Playfair | 46px | 400 | -0.025em | 1.0 |
| Big stat (secondary) | Playfair | 40px | 400 | -0.025em | 1.0 |
| Percentage callout | Playfair | 54px | 400 | -0.03em | 1.0 |
| Roster row name | Playfair | 25px | 400 | -0.015em | 1.15 |
| Roster row amount | Playfair | 27px | 400 | -0.02em | — |
| Donor row name | Playfair | 19px | 400 | -0.01em | — |
| Compare card name | Playfair | 28px | 400 | -0.02em | 1.1 |
| Eyebrow / section label | Archivo | 10.5px | 400 | 0.2em, uppercase | — |
| Metric label | Archivo | 10.5px | 400 | 0.14–0.16em, uppercase | — |
| Nav tab | Archivo | 11px | 400 | 0.22em, uppercase | — |
| Body copy | Archivo | 13.5px | 400 | — | 1.55 |
| Table value | Archivo | 14–15px | 400 | — | — |
| Sub-label | Archivo | 11.5px | 400 | — | — |
| Button (CTA) | Archivo | 11px | 400 | 0.2em, uppercase | — |

All numeric columns use `font-variant-numeric: tabular-nums`.

### Spacing & structure
- Page gutter: `40px` left/right. Content `max-width: 1320px`, centered.
- Section vertical rhythm: `34–38px` top padding on page-header sections, `22px` on list rows, `20px` on roster rows.
- Grid gaps: `44–56px` between editorial columns, `22–24px` inside table rows, `18–26px` between stat pairs.
- **Border radius: 0 everywhere.** No rounded corners, no shadows, no cards. The entire design is hairline rules on a flat dark ground. The only exception is the sticky Compare CTA, which is a solid red rectangle (still square).
- Bars are `2px` or `3px` tall — `2px` in dense lists, `3px` on the detail-page callouts.
- Selection color: `::selection { background: #E4322B; color: #0E0F12 }`.

---

## Screens / Views

Six views, all client-side within one shell. Nav tabs cover four (Officeholders, Industries, Compare, Donor geography); the two detail views are reached by clicking through.

### Shell (persistent)

**Masthead** — bottom border `1px solid #E4322B`, gutter `40px`, padding `26px 0 14px`. Flex row, `space-between`, `align-items: flex-end`, wraps.
- Left: "Montana Money" (Playfair 42px/500). Below it, `10.5px / 0.3em / uppercase / #8A897F`: "Officeholders · Donors · 2026 cycle".
- Right: search field, `flex: 0 1 340px`, `min-width: 300px`. A red `⌕` glyph (14px) then a borderless transparent input, 14px, ink `#E8E4DC`, placeholder `#8E8D83`, placeholder text "Search names, offices, industries". The whole group sits on a `1px solid #2E2F31` bottom border with `8px` padding beneath. No box, no fill.

**Nav** — `position: sticky; top: 0`, background `#0E0F12`, bottom border `1px solid #232427`. Flex row, `gap: 30px`. Each tab is a borderless transparent button, `11px / 0.22em / uppercase`, `15px 0` padding. Active: color `#E8E4DC` and a red underline via `box-shadow: inset 0 -1px 0 0 #E4322B`. Inactive: `#8E8D83`, no underline. Detail views (politician, donor) keep the Officeholders tab lit. Far right of the same row: "Demo data" in `10.5px / 0.16em / uppercase / #E4322B` — remove this once real data is wired.

**Footer** — `40px` top padding, then a `1px solid #232427` top rule with `20px` padding above the content. Flex row, `space-between`, `11px / 0.08em / #8A897F`. Left: "Montana Money — prototype". Right: the disclaimer string.

Tabs, in order: Officeholders · Industries · Compare · Donor geography.

---

### 1. Officeholder roster (default view)

**Headline band** — CSS grid, `repeat(auto-fit, minmax(190px, 1fr))`, bottom border `1px solid #232427`. Each cell padded `34px 26px 30px 0`:
- Value: Playfair 46px, `-0.025em`, `#E8E4DC`
- Label: `10.5px / 0.18em / uppercase / #E4322B`, `12px` above margin
- Note: `12px / #96958B / line-height 1.45`, `4px` margin

Four stats: Officeholders (count, "Federal, statewide, legislative, judicial") · Tracked money (sum of all sector totals, "Across all listed campaigns") · Named donors (count, "Individuals, PACs and committees") · Median in-state (%, "Share of itemized contributions").

**Filter bar** — flex row, `space-between`, `18px 0` padding, bottom border `1px solid #232427`.
- Left: branch filters, `gap: 22px`. Borderless text buttons, 12px. Active: `#E8E4DC` with `1px solid #E4322B` bottom border and `3px` padding beneath; inactive `#8E8D83`, transparent border. Options: All · Federal · Statewide · Legislature · Judicial.
- Right: "SORT" label (`10px / 0.2em / uppercase / #8E8D83`) then three text buttons styled identically to the filters: Total raised · In-state % · Name.

**Roster rows** — CSS grid, `30px 2.3fr 1.4fr 1.5fr 1fr 40px`, `gap: 22px`, `align-items: center`, `20px 0` padding, bottom border `1px solid #1B1C1F`, hover background `#14151A`.
1. Rank — zero-padded index ("01"), `11px / #8E8D83`
2. Name block (clickable → detail): Playfair 25px name, then office in `11.5px / #96958B`
3. Party chip: text + `1px solid` in the party color, `10px / 0.16em / uppercase`, padding `3px 8px`, square. Below it, `8px` down: top industry, `11.5px / #96958B`
4. In-state bar: `2px` track `#26272B` with red fill at the in-state percentage; below, `8px` down, "IN-STATE 34%" in `10.5px / 0.1em / uppercase / #8E8D83`
5. Total raised — right-aligned, Playfair 27px, tabular
6. Compare checkbox — `26×26px`, square, `1px` border. Unchecked: transparent fill, `#2E2F31` border, `#8E8D83` glyph slot (empty). Checked: `#E4322B` fill, `#0E0F12` "✓".

Empty state: `70px 0`, centered, `13px / #8E8D83`, "Nothing matches that search."

**Sticky compare CTA** — appears when ≥1 officeholder is selected. `position: sticky; bottom: 22px`, centered. Solid `#E4322B` rectangle, `#0E0F12` text, `11px / 0.2em / uppercase`, padding `14px 26px`, label "Compare {n} →".

---

### 2. Politician detail

**Back link** — `← Officeholders`, `10.5px / 0.2em / uppercase / #E4322B`, borderless, `22px` top padding.

**Header** — grid `1.6fr 1fr`, `gap: 50px`, `align-items: end`, padding `20px 0 40px`, bottom border `1px solid #E4322B`.
- Left: eyebrow "{Party} · {Branch}" in `10.5px / 0.2em / uppercase` **in the party color**; name in Playfair 76px; then "{Office} · {Cycle}" in `15px / #9B9A90`.
- Right: two stats in a `1fr 1fr` grid — Total raised, Cash on hand. Value Playfair 40px, label `10.5px / 0.16em / uppercase / #96958B` beneath.

**Money-source band** — grid `repeat(auto-fit, minmax(260px, 1fr))`, `gap: 44px`, `34px 0` padding, bottom border `1px solid #232427`. Two parallel blocks:
- *Geography of the money* (red eyebrow) → in-state % as Playfair 54px with "from Montana addresses" (`12.5px / #9B9A90`) baseline-aligned beside it → `3px` track with **bone (`#E8E4DC`)** fill at that percentage → "{n}% arrives from outside the state" in `11.5px / #96958B`.
- *PACs vs. individuals* (red eyebrow) → PAC % as Playfair 54px with "from PACs & committees" → `3px` track with **gold (`#E0B23C`)** fill → "{n}% from individual contributors".

**Two-column body** — grid `1fr 1.35fr`, `gap: 56px`, `36px` top padding.
- *Sector breakdown* (left): header label + `1px solid #232427` bottom rule. Rows `15px 0` with `1px solid #1B1C1F` dividers: sector name (13.5px) left, amount (14px, `#9B9A90`, tabular) right, then a `2px` red bar at that sector's share of this politician's itemized total. Rows are clickable → Industries view.
- *Largest donors* (right): header row with the label left and "Open a donor to see everyone they fund" (`11.5px / #8A897F`) right. Rows are grid `1.7fr 1fr 0.8fr`, `16px 0`, hover `#14151A`, clickable → donor detail: Playfair 19px donor name with employer beneath (`11.5px / #96958B`) · city, state (`12px / #9B9A90`) · amount right-aligned (15px, tabular, exact dollars with thousands separators, not abbreviated).

---

### 3. Donor detail

Same header geometry as politician detail. Eyebrow reads "Donor · {Sector}" in red. Name Playfair 68px. Beneath: "{Employer} · {City}, {State}" in `15px / #9B9A90`. Right stats: Total given, Recipients (count).

**Who they fund** — section label with `1px solid #232427` rule, then rows: grid `2.2fr 1.2fr 1.4fr 0.8fr`, `gap: 22px`, `20px 0`, `1px solid #1B1C1F` divider, hover `#14151A`, clickable → that politician's detail.
1. Playfair 24px name + office beneath (`11.5px / #96958B`)
2. Party chip (same treatment as roster)
3. Note — `12px / #9B9A90`. Contribution context, e.g. "Max primary + general", "Federal PAC limit", "Out-of-state"; defaults to "Itemized contribution"
4. Amount — right-aligned Playfair 24px, tabular, exact dollars

Sorted descending by amount.

---

### 4. Industries

**Header** — grid `1.4fr 1fr`, `gap: 50px`, `align-items: end`, padding `38px 0 26px`, bottom border `1px solid #E4322B`. Left: "Money by industry" Playfair 60px + body copy (`13.5px / #9B9A90 / 1.55`, `max-width: 520px`): "Contributions aggregated across every officeholder in the tracker. Bars are scaled against the largest sector." Right: tracked total, Playfair 40px, with uppercase label beneath.

**Rows** — grid `30px 1.5fr 2fr 1fr`, `gap: 24px`, `22px 0`, `1px solid #1B1C1F` divider.
1. Rank ("01")
2. Playfair 23px sector name + "{n} donors tracked" (`11.5px / #96958B`)
3. `3px` red bar scaled against the largest sector, then "Top recipient — {Name}" (`11.5px / #9B9A90`, `10px` above)
4. Right-aligned: amount (17px, tabular) + "{n}% of tracked" (`11px / #8E8D83`), one decimal place

Sorted descending by total.

---

### 5. Compare

**Header** — Playfair 60px "Side by side" + "Up to four officeholders. Selections carry over from the roster." Right: a Clear button — `1px solid #2E2F31`, transparent, `#9B9A90`, `10.5px / 0.18em / uppercase`, padding `10px 16px`. Bottom border `1px solid #E4322B`.

**Picker** — flex row, `gap: 20px`, `20px 0`, bottom border `1px solid #232427`. All twelve officeholders as borderless 12.5px text buttons; selected get `#E8E4DC` + red underline, unselected `#8E8D83`.

**Cards** — grid `repeat(auto-fit, minmax(220px, 1fr))` with `gap: 1px` on a `#232427` background, so the gap itself draws the hairline grid. Each cell is `#0E0F12`, padded `24px 24px 26px`.
- Party chip label (color only, no border) → Playfair 28px name (clickable → detail) → office (`11.5px / #96958B`)
- `24px` down, five metrics stacked with `18px` gaps. Each: uppercase `10.5px / 0.14em / #8E8D83` label left, 15px tabular value right, then a `2px` bar. Metrics and bar colors: Total raised (bone, scaled against the largest raiser in the dataset) · Cash on hand (`#9B9A90`) · In-state (red) · PAC share (gold) · Out-of-state (`#8FB6E8`)
- `26px` down, a `1px solid #232427` top rule, then "TOP SECTORS" and the top three as label/value pairs (12px)

Max four selections; clicking a fifth is a no-op. Default selection in the prototype is Sheehy + Gianforte.

---

### 6. Donor geography (map)

**Header** — same structure as Industries. "Where the donors are" + "Schematic map. Circle area is total contributions from donors with that mailing address." Right stat: total from outside Montana.

**Body** — grid `1.8fr 1fr`, `gap: 46px`, `30px` top padding.

*Left — the map.* A `position: relative` wrapper holding an SVG (`viewBox="0 0 640 300"`, `width: 100%`) plus an HTML label layer positioned absolutely on top.
- SVG: Montana landmass `#15161A` with `1px #2E2F31` stroke; per city a bubble (`#E4322B` at `fill-opacity: 0.18` with a `1px` red stroke), a `2px` solid red center dot, and a `0.75px #3A3B3E` leader line from the center to the label anchor.
- Labels are **HTML, not SVG `<text>`**: absolutely positioned divs at percentage left/top derived from the same projection, `transform: translateY(-50%)`, `white-space: nowrap`, `pointer-events: none`. City name `11px / #E8E4DC`; amount `10.5px / #96958B`, tabular.
- Bubble radius: `8 + sqrt(cityTotal / maxCityTotal) * 22` in viewBox units — area-proportional, not radius-proportional.
- Label collision: sort cities by y ascending; for each, compare against already-placed labels and if `|Δx| < 120` and `Δy < 34` viewBox units, push the label down to `previous.labelY + 34`. The leader line absorbs the offset.

*Right — out-of-state panel.* Section label with rule, then per state: name (13.5px) + amount (14px, `#9B9A90`, tabular) on one line, then a `2px` gold bar scaled against the largest out-of-state total. Sorted descending.

**On the map, honestly:** the prototype's Montana outline is an eleven-point hand-approximated polygon and the projection is a naive linear lon/lat scale. Replace both in production — use real Census/TIGER state (and ideally county) boundaries with a proper projection (d3-geo `geoAlbers` centered on Montana, or `geoConicConformal`). A county choropleth of contribution density with the city bubbles layered on top would carry considerably more information than the current city-bubble-only view.

---

## Interactions & behavior

Navigation is entirely client-side; no page reloads.
- Nav tab → sets view. Detail views keep the Officeholders tab lit.
- Roster row name → politician detail. Roster checkbox → toggle compare membership (does not navigate; stop propagation so it doesn't also open the row).
- Politician detail: sector row → Industries view. Donor row → donor detail.
- Donor detail: recipient row → that politician's detail.
- Back link → previous view. The prototype stores a single `prev` value; in production use real routes and browser history instead.
- Search filters the roster live on each keystroke, matching against name + office + sector names, case-insensitive, trimmed. It only affects the roster view in the prototype — worth extending to a global search across donors and industries.
- Sticky compare CTA → Compare view.
- Hover: list rows shift background to `#14151A`. No transitions are specified; a `120ms` background ease is fine to add.
- No loading, error, or empty states beyond the roster's "Nothing matches that search." Real data needs at minimum a skeleton for the roster and an error state for a failed fetch.
- Responsive: the layout relies on `auto-fit` grids and `flex-wrap`, so it degrades reasonably, but **the detail-page 76px display type and the multi-column grids have not been designed for mobile.** Below ~700px you need explicit treatment: single-column stacking, display sizes stepped down to roughly 40–48px, and the roster's six-column grid collapsed to a name/amount two-line row.

## State
Prototype state, all in one component:
- `view` — `'roster' | 'politician' | 'donor' | 'industries' | 'compare' | 'map'`
- `polId`, `donorId` — current detail subject
- `prev` — previous view, for the back link
- `level` — branch filter: `'All' | 'Federal' | 'Statewide' | 'Legislature' | 'Judicial'`
- `sort` — `'raised' | 'instate' | 'name'`
- `query` — search string
- `compare` — array of politician ids, max 4

In production, `view`/`polId`/`donorId` should become routes (`/`, `/officeholder/:slug`, `/donor/:slug`, `/industries`, `/compare`, `/map`), and `level`/`sort`/`query`/`compare` should live in the query string so a filtered roster or a comparison is linkable and shareable. Comparison links in particular are the kind of thing people send each other.

## Data model
The prototype's shape, which maps closely to what you'd derive from filings:

```
Politician { id, name, office, level, party: 'R'|'D'|'N',
             raised, cash, inStatePct, pacPct,
             sectors: [{ name, amount }] }

Donor      { id, name, employer, city, state, sector,
             contributions: [{ politicianId, amount, note }] }
```

Derived in the view layer, not stored: industry totals and each sector's top recipient (aggregate across all politicians); tracked total (sum of all sector amounts); per-city and per-state donor totals; each sector's share of a politician's itemized total.

Real sources: **FEC** bulk data and API for federal candidates (Schedule A is the itemized-contributions form) and **Montana COPP** for state candidates. The two have different schemas, different contribution limits, and different filing cadences — normalizing them is the main data engineering task, and the sector/industry classification will need either OpenSecrets-style employer mapping or your own crosswalk. Everything in the prototype is placeholder.

## Assets
None. No images, no icon fonts, no SVG illustration. The only glyphs used are the text characters `⌕`, `←`, `→`, `✓`, and `·`. Fonts come from Google Fonts (Playfair Display, Archivo).

## Content requiring a decision
- **Site name** is unsettled. "Montana Money" is the working title.
- The **"Demo data" nav badge** and the footer disclaimer ("Illustrative sample figures for design review — not actual filing data.") must be removed or replaced with real provenance and a last-updated timestamp before launch. A public finance tracker needs to say where its numbers come from and when they were pulled — consider a persistent "Source: FEC filings through {date}" line in the footer.

## Screenshots
`screenshots/` holds a capture of each view of `Montana Money v2.dc.html`, in nav order: roster, politician detail, donor detail, industries, compare, donor geography. Use them as the visual target; the tables above are the authoritative measurements.

## Files
- `Montana Money v2.dc.html` — the design to implement. Dark editorial direction, all six views.
- `Montana Money.dc.html` — an earlier light/paper-toned direction, same information architecture. Included for reference only; **v2 is the design to build.**
