# Architecture

CarFinder is one self-contained HTML page. There is no framework, no bundler and no runtime dependency; the only build
step stitches three source files together and inlines the data.

```
src/head.html    markup + CSS                         ─┐
src/script.html  all the JavaScript                   ─┼─ node src/build.js ─▶ carfinder.html
data/*.json      cars, bikes, boats, aircraft, state  ─┘                     (dist/carfinder-artifact.html with --artifact)
                 tables, fee rules (vfees), photo index (images)
```

## The page
- **Verticals** (`VERTS = ['car','moto','boat','air']`, the buttons in `#vertTabs`) and **country tabs** (`ORDER`) together
  decide what the page shows: `VT` (the vertical), `CC` (the tab), `C = countryConfig(CC, VT)` (the live config),
  `CARS = DATA[VT][CC]`, `M = MONEY[CC]` and the assumptions `A`. `switchVertical()` / `switchCountry()` call
  `setLive()`, reset the filter state `S`, then `buildChrome()` rebuilds the chips, filter options (sizes, seats or
  capacity, drivetrain / transmission / propulsion / engines, the efficiency and range-or-length sliders, the sort
  labels), region
  picker, glossary, footer and wizard, and `render()` draws the cards. `?v=moto&cc=IN` on the URL deep-links a view.
- **Per-vertical config** lives in `VERT[vt]` (bodies, sizes, fuels, labels, wizard questions, price-preset scale,
  loan and distance assumptions, lede). `countryConfig(cc, vt)` lays it over `COUNTRIES[cc]` so every downstream
  function reads one object `C` whatever the vertical; cars get `COUNTRIES[cc]` unchanged.
- **Filter state** lives in one object `S` (search, body, fuel, size, class, make, countries, price range, seats,
  drivetrain, efficiency, range, model years, launch flag, preliminary flag, sort). `passes(c)` applies it to a car,
  `sortList()` orders the result, `render()` draws the first page of cards and `renderMore()` appends the next (also
  triggered by an IntersectionObserver up to 150 cards).
- **Cards** (`cardHTML`) show the photo (`photoHTML`: the Wikimedia Commons rendition from `IMAGES`, or the body-type
  silhouette `<symbol id="sil-…">` from `src/head.html`), the list price, the dealer band and the on-road range from
  `bd(c, price)`, the specs line per vertical (`specsHTML`), the efficiency string from `effShort()`, and the market
  badge. The whole card opens the detail sheet.
- **Detail sheet** (`renderDetail`): tags, note, the trim slider, the window-sticker breakdown (`stickerHTML`), payment
  and fuel panels, the efficiency tiles (`effPanel`), the market explanation. Only the price-dependent parts are
  re-rendered while the slider moves (`updateDetailPrice`).
- **Compare** (`openCompare`): up to four vehicles in a table whose rows follow the vertical (engine / length /
  cruise speed and range, seats / capacity, drivetrain / transmission / propulsion / engines, price per hp or per seat);
  the selection is kept per vertical and country.
- **Wizard** (`#wGo`): four answers become filter state (`wizardBudgets`, `wizardUse`, `wizardFuels`, and the fourth
  question: AWD for cars, learner-friendly sizes for bikes, trailerable lengths for boats, owner-flown types for
  aircraft).
- **Persistence**: vertical, country, region per country, compare list per vertical and country, assumptions per
  vertical and country and the World-tab units, all in localStorage under `cf_*`, every read and write wrapped in
  try/catch.
- **Permalinks** (`viewHash`, `syncHash`, `applyHash`): the whole view lives in the URL hash, `#v=air&cc=UK&r=GB&b=
  Helicopter&rng=300&sort=perhp&cmp=…&d=…`: vertical, country, region or currency, World units, search, every filter
  set, price range, seats, drive, sliders, sort, model years, launch and preliminary toggles, the comparison set and
  the open sheet. Vehicles are named by a slug (`slugOf`: make-model, plus the country on the World tab and the year
  for US leftovers and early arrivals). History hygiene is per trigger: `render()` (filters, typing, sort) rewrites
  the current entry with `replaceState`; opening a sheet (`d=` detail, `co=1` compare) adds one with `pushState`
  (`sheetOpened`), so Back closes it and Forward reopens it, and closing a sheet with its button or Escape goes
  `history.back()` over the entry it added (`sheetClosed`) rather than leaving a dead one. `onHashChange` tells a
  sheet-only change (the keys in `SHEET_KEYS`, which include the comparison set a sheet can edit) from a real one: the
  first opens or closes the sheet in place, the second rebuilds the view from the hash (`applyHash`), as a pasted hash
  on load does; the app's own `back()` is flagged (`OWN_BACK`) so a stale hash never re-applies over a view that has
  moved on. The `?v=&cc=` query form still works. `shareLink()` copies the permalink or opens the share sheet on
  phones; none of the history writes change the title or focus, so screen readers hear nothing from them.
- **Provenance** (`provenance(c, cc)` and `regionSource(cc, code)` in the core, `provHTML` in the sheet,
  `data/sources.json`): the compile date per vertical ("Compiled" is a dataset date; there are no per-row dates yet),
  the dated exchange-rate tables (`FX_SRC`, `fxPerUsd(date)`, `fxMove(from, to, since)`: the World tab converts at
  `fx.date` and flags how far a currency has moved since a dataset's `compiledAt` day; aircraft rows record the
  `convertedAt` day they were converted on), per-dataset price sources with links (a null URL renders as a *not
  linked* badge), the makers' build-and-price pages (`buildPrice["vt/CC"]`) or sites by brand and country, the
  citation behind the region's tax rules (US and Indian state rows carry one), and the confirmed-or-estimate status
  with its reason. `issueURL()` builds the prefilled "Wrong price? Tell us" issue link, `reportText()` the plain-text
  version that "Copy the details" puts on the clipboard (and an "E-mail it" button uses when `sources.json` names a
  `contact.email`); the masthead's `#asof` line shows the data-as-of date, the estimate count, the FX-moved flag on the
  World tab and the app version (`APP_VERSION`, stamped by the build). `src/quality.js` measures all of this into
  `docs/DATA-QUALITY.md` at build time and `test/quality.test.mjs` holds it above `data/quality-floor.json`.

## The pricing core
Everything between `//<<core` and `//core>>` in `src/script.html` is DOM-free so the tests can run it in Node:
- `normalize(raw, cc, vt)` turns a JSON row into one object shape for every country (`price`, `top`, `fuel`, `fuels`,
  `l100`, `rng`, `kwh`, `hp`, `seats`, `mkt`, `note`, `est`, `isNew`, plus `mpg`/`mpge`/`dest` for the US and
  `kmpl`/`gst` for India; `ccm` for bikes, `len` and `gph` for boats, `ktas` (cruise knots), `gph` and `rng` in km
  for aircraft, `dest` = freight or delivery for all three).
- `MONEY[cc]` formats money (`money`, short `k`, and `range` with the symbol once), `FX`/`toWorld()` convert for the
  World tab, `BAND[cc]` holds the dealer bands and `MKT_TXT[cc]` their explanations.
- `bd<CC>(c, price, region, M)` returns `{dlo, dhi, lo, hi, lines, head}`: the dealer band, the on-road range and the
  breakdown lines (`cls`: `est` estimated, `info` shown but not added, `bold`). `breakdown()` dispatches by country for
  cars and to `bdV()` for bikes, boats and aircraft.
- `bdV(cc, c, price, region, M)` is the table-driven engine for motorcycles, boats and aircraft: `VFEES[cc][vt]` (from
  `data/vfees.json`) gives the dealer bands, the price basis (and an optional `typical` label for the dealer-price
  line) and a list of fee lines, each a `fixed` amount (or
  `"dest"` for the row's freight), a `pct` of the dealer price, `rates` by region, `brackets` on engine size /
  horsepower / length / price, a `hook` into a country rule (`usSales` with caps, `usDoc`, `inRoad`, `caProv`,
  `cnPurchase`, `esMatric`) or a `text` shown as information. `feeAmount()` evaluates one line (modes `pct`, `fixed`,
  `perhp`; modifiers for fuel, body, EV multiplier, min / max, `withDest`, `plus`, `suffix`); a hook is evaluated before
  `rates`, so a hook line can carry `rates`, `caps` and `exempt` lists as its parameters.
- `fuelCost(c, A, cc)`, `monthlyPay(price, A)`, `effShort(c, cc)`, the aircraft text helpers `airSpeedTxt()` /
  `airRangeTxt()` / `powerLbl()` (knots and nautical miles with their mph, km/h, mile or km twins; horsepower or
  pounds of thrust) and the unit helpers `usMpg()` / `usMi()`.

## The World tab
`DATA[vt].ALL` pools every country's vehicles of that vertical with the vocabulary merged (`Truck` → `Pickup`, `Gas` → `Petrol`, size names
unified) and a `home` reference to the original object. `worldPrices()` precomputes each car's list and on-road range
in the chosen currency; `worldPresets()` rebuilds the price presets and wizard budgets in that currency; `WUNIT`
switches the efficiency unit (L/100 km, mpg, km/L) through `WORLD_UNITS`.

## Photos
`data/images.json` is built offline (the Wikipedia API, `prop=pageimages`, title candidates from make and model with
fallbacks, then `imageinfo` for the author and licence) and inlined as `IMAGES`: `files` holds each Commons file once
(`[name, host, md5 prefix, author, licence, "o" when the original is served]`) and `map['vt/cc']['make|model']` points
at it with an approx flag. `thumbUrl()` builds the 960 px rendition URL (the width the API rendered; Commons refuses
widths it has not rendered), the `<img>` falls back to the silhouette on error, and `creditHTML()` writes the credit
line on the detail sheet. Nothing is copied into the repository.

## Adding a country
1. A JSON file on the global 20-field schema ([DATA.md](DATA.md)) and a tax-notes markdown in `docs/tax-notes/`.
2. In `src/script.html`: a `MONEY` formatter, a `BAND` row, `MKT_TXT` texts, `REGIONS` with a default in
   `REGION_DEFAULT`, `EFF_UNIT`, a `bd<CC>()` function and its case in `breakdown()`, a `COUNTRIES` config (labels,
   presets, efficiency filter, assumptions, wizard mappings), the tab in `ORDER`/`CC_NAME`, a `GLOSS` list, an `ABOUT`
   note and the per-country accent colours in `src/head.html`.
3. `data/cars_<cc>.json` is picked up by `src/build.js` from the country list; add the test tables in
   `test/data.test.mjs`, then `node src/build.js && node --test`.
4. Bikes, boats and aircraft for the country: `data/moto_<cc>.json`, `data/boat_<cc>.json` and `data/air_<cc>.json`
   on the 21-field schema, and a `VFEES[cc].moto` / `.boat` / `.air` entry in `data/vfees.json` (bands, basis, fee
   lines, glossary) plus the country's avgas and Jet-A prices in `VERT.air.fuel`; without a fee entry the car rules are
   used as a fallback.

## Methodology page and the service worker
`node src/build.js` also writes `methodology.html` through `src/methodology.js`: it evaluates the assembled script up
to the state marker to get the app's own constants (exchange rates, bands, market texts, regions, the state tables,
the fee rules, the about texts), renders the per-country research notes from `docs/tax-notes/*.md` with a small
Markdown renderer, and fills the `src/methodology.html` shell. It writes `sw.js` from `src/sw.js` with a version
stamp (the page's content hash), so every deploy invalidates the old cache; `--check` covers all three files.

## Generated pages
`src/pages.js` writes the crawlable pages from the same engine: `tax/<state>/` and `trade-in-credit/<state>/` for every
state and DC (the answer in the first paragraph, a worked example priced by `breakdown()`, the citations, FAQPage and
BreadcrumbList JSON-LD), the hubs `tax/` and `trade-in-credit/`, `data/` (the dataset page with Dataset JSON-LD and the
DOI) and `sitemap.xml`. They are committed like `methodology.html`; `--check` fails when any is stale and
`test/pages.test.mjs` checks every page. The app reads `#…&r=CA&loc=…` so a page links straight into a priced view.

## Styling
The design system is `docs/DESIGN.md` with its tokens in `brand/tokens.css`. The app inlines the same values in
`src/head.html` (it is one self-contained file); the website links `brand/site/site.css` and `brand/site/site.js`
(theme toggle); methodology and every generated page link `brand/site/pages.css`, with nav, footer and head links built
by `headLinks()`, `siteNav()` and `siteFoot()` in `src/pages.js`. All three store the theme choice as `cf_theme`.

## Website
`index.html` (showcase, the demo video and GIFs, how-to) and `about.html` share the visual language of the author's
other projects; they are static and hand-written. `brand/tools/shots.py` regenerates the screenshots and the social
card from the built app; `brand/tools/record.py` records the hero video and the three GIFs (one walks cars → bikes → boats → aircraft) in
headless Chromium (run
by `.github/workflows/record.yml` on the `record-demo` branch, where the Wikimedia photos load).
`.github/workflows/pages.yml` deploys the repository (minus tests and tools) to GitHub Pages on every push to `main`.
