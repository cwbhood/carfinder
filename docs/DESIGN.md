# Design: the CarFinder system

One identity across the app (`carfinder.html`), the website (`index.html`, `about.html`, `404.html`) and the generated
pages (`methodology.html`, `tax/`, `trade-in-credit/`, `data/`). The tokens are in `brand/tokens.css`; the app inlines
the same values because it is one self-contained file. Change a value in both places or not at all.

## The idea: the window sticker
Every new car carries a Monroney label: a plain, dense, honest document that states the price. CarFinder is the
sticker the dealer never prints, the one with the drive-off number on it. So the interface borrows from printed
automotive paperwork, not from app templates:

- **Paper and ink.** Warm off-white paper in light mode, deep ink in dark mode. Hairline rules, not boxes with shadows.
- **The number is the hero.** The drive-off price is set large in tabular mono, once per card. Everything else on the
  card is quieter than it.
- **Itemised like a receipt.** Breakdowns are rows with dotted leaders from label to amount, a rule above the total.
- **Labels like a form.** Small mono labels in sentence case (letter-spaced uppercase only for the 10–11 px field
  labels of the sticker, and nowhere else).
- **One signal colour.** Sticker orange marks the one thing to act on or the number to read. It is not decoration.

## Tokens (brand/tokens.css)
| Token | Light (paper) | Dark (ink) | Use |
|---|---|---|---|
| `--bg` | `#f3f0e8` | `#0e0f11` | page |
| `--surface` | `#fffdf7` | `#16181b` | cards, sheet, inputs |
| `--surface-2` | `#ece8de` | `#1d2024` | table heads, hover, zebra |
| `--ink` | `#17140f` | `#ece8e0` | text and figures |
| `--muted` | `#5f594f` | `#9b968d` | secondary text (AA on bg and surface) |
| `--faint` | `#8a8377` | `#6d6961` | rules, ticks, disabled controls, text of 18 px and up only (3:1) |
| `--line` | `#dcd5c6` | `#2a2d31` | hairlines |
| `--line-strong` | `#c4bba8` | `#3a3e44` | input borders, total rules |
| `--accent` | `#b03a0b` | `#ff7a3d` | the drive-off price, primary action, focus |
| `--accent-ink` | `#ffffff` | `#160b05` | text on accent |
| `--accent-soft` | `#f7e3d6` | `#2e1a10` | selected states |
| `--good` | `#2f6f4a` | `#5cc48a` | discounts, "listed" |
| `--warn` | `#7e560f` | `#e0a83a` | "estimated", caution |
| `--bad` | `#a8261b` | `#ff6b5b` | markup over sticker |

Type, three families only (all self-hosted in `brand/fonts/`):
- **Display**: Big Shoulders Display 900. Page titles and the one hero line per page. Never for UI controls, never
  below 28 px.
- **Text**: Barlow 400/500/600. All prose and controls. Body 16 px / 1.55; UI 15 px; small 13.5 px.
- **Figures and field labels**: IBM Plex Mono 400/500, `font-variant-numeric: tabular-nums`. Every price, rate, count
  and spec figure. Field labels 11 px, `letter-spacing: .08em`, uppercase.
- Source Sans 3 and Barlow Condensed stay in the folder but are no longer used.

Scale (px): 11 · 13.5 · 15 · 16 · 18 · 22 · 28 · 40 · 56 · 80. Spacing: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
Radius: 3 px on controls and tags, 6 px on cards and the sheet, 0 on tables and rules. No pills except the round
icon buttons (close, theme).
Elevation: none on cards (a hairline does it). The detail sheet and menus get one shadow:
`0 1px 0 var(--line), 0 24px 48px -24px rgba(0,0,0,.35)`.
Motion: 140 ms `cubic-bezier(.2,.7,.2,1)` for state changes, 220 ms for the sheet; nothing loops; everything stops
under `prefers-reduced-motion`.
Focus: 2 px `--accent` outline, 2 px offset, on every interactive element.

## Components
- **Header**: one bar. Wordmark left; vertical switch (Cars, Bikes, Boats, Aircraft) as a segmented control with
  text and small line icons; theme toggle right. The country switch is a compact menu or a scrolling strip of
  country codes with counts in mono, not a row of shouty caps tabs.
- **Masthead**: title in display type, one line of lede, the as-of line in mono at 13.5 px. Action buttons sit with
  the toolbar, not floating beside the title.
- **Toolbar**: search, region, sort in one row on desktop; search + filters button + sort on phones with the region
  on its own row (existing behaviour).
- **Filters**: body and fuel as a segmented list or checkbox-style toggles with counts, square-cornered; the sidebar
  reads like the left column of a form, with mono labels and hairlines between groups.
- **Card**: photo (or silhouette) on top at 16:10; make in mono label, model in Barlow 600 at 20 px; then the sticker
  block: two columns, "Sticker" (ink) and "Drive-off, <region>" (accent, mono, 24–28 px); one line of specs in mono
  with middle dots; at most ONE status tag (estimate, or the demand band) — the rest moves to the sheet. Compare is a
  quiet checkbox-style control, not a second button.
- **Detail sheet**: a document. Header with make/model; photo no taller than 40% of the viewport; the trim slider;
  the breakdown as a receipt (dotted leaders, mono amounts, a 2 px ink rule above the drive-off total, total in
  accent); provenance as a definition list in small type at the end, like the fine print on a sticker.
- **Tags**: 3 px radius, 11 px mono, border only (no filled pastel blobs). Colour only for state (good/warn/bad).
- **Buttons**: primary = accent fill, 3 px radius, Barlow 600 15 px; secondary = transparent with `--line-strong`
  border; tertiary = text link with underline offset 3 px. 44 px minimum height everywhere.
- **Tables** (methodology, state pages): mono figures right-aligned, hairline rows, `--surface-2` header, no zebra.

## Words
Keep the existing copy's voice: plain, specific, a little dry, numbers over adjectives. Sentence case everywhere.
No exclamation marks, no emoji, no "discover", "unlock", "seamless", "effortless", "revolutionary", "powerful".

## What makes it look generated (do not)
Gradient blobs or mesh backgrounds; glassmorphism; purple-to-blue gradients; neon glows; sparkle or magic icons;
every element a rounded pill; three identical icon-cards in a row as the "features" section; centred everything;
pastel badge confetti; drop shadows on every card; random decorative illustrations; stock "hero mockup tilted in 3D";
inconsistent radii; five font families; lorem-style filler ("Experience the future of car buying").

## What makes it look made (do)
A grid you can feel (12 columns, consistent gutters: 16 px phone, 24 px tablet, 32 px desktop, 1240 px max); a
baseline rhythm; alignment of figures in columns; real data in every example; one idea per section; small details
done right (tabular numerals, dotted leaders, hairlines at 0.5 px on 2× screens, consistent icon stroke 1.5 px,
optical alignment of the display type, hanging punctuation in quotes); and restraint.

## Constraints that do not move
Phone-first: 44 px controls, 16 px inputs, no horizontal overflow at 360 px. Light and dark both first-class
(`prefers-color-scheme` plus the manual toggle). AA contrast for text. Escape data with `esc()`. The pricing core
stays DOM-free. Photos stay Wikimedia links with the credit line.

## App notes (carfinder.html)
- Selected states: the vehicle switch inverts to ink (it is the mode); filter toggles take `--accent-soft` with an ink
  border; the country strip marks the open tab with a 2 px ink underline. Orange stays for the drive-off figure, the
  primary button, focus rings and the slider thumb.
- Counts on toggles are drawn from a `data-n` attribute by CSS, so a button's text stays its label.
- Field labels (11 px mono caps) sit above figures; in the card the two price columns share rows (CSS subgrid) so
  the sticker and drive-off figures sit on one line whatever the label length.
- Receipt rows: label, dotted leader (`::after`), mono amount; sub-notes on their own line in `--muted`; a 1 px
  `--line-strong` rule above subtotals and a 2 px ink rule above the total.
