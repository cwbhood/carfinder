# Changelog

All notable changes to CarFinder. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions
follow [Semantic Versioning](https://semver.org/) (data corrections are patches, new countries or verticals are minors,
a schema change is a major).

## [1.2.0] - 2026-10-14

Four honest states instead of one vague one, floors that cannot be tripped by adding data, and build-and-price
links in every car market.

### Added
- **Four row states.** Every row is exactly one of *checked* (a person compared it to the maker's page after
  compile; none yet, this is where per-row verification goes), *listed* (the maker's published price on the compile
  date), *converted* (a published list in another currency at a dated rate: aircraft outside the US) or *estimated*
  (modelled from announcements, trade press or dealer quotes). Cards, the sheet's new Status line, the copied report,
  the masthead count and the filter label all use them; "preliminary" is gone. Aircraft are now 89% from a published
  list (865 converted, 1 listed) instead of "99.9% estimates".
- **Per-vertical floors with margin** in `data/quality-floor.json`: rows from a published list (cars 68%, bikes 32%,
  boats 10%, aircraft 86%) and photos (cars 84%, bikes 62%, boats 3%, aircraft 93%), plus a ceiling on makers without
  a linked page (159) and a floor on build-and-price coverage for all car rows (42%). Adding boats can no longer break
  cars, and a vertical that stands still is visible.
- **Build-and-price links in all eleven car markets**: 1,215 of 2,729 car rows (44.5%, from 337) link the maker's
  configurator or price page for that market, each one found through a search result or a fetch of the page.
- **A quality history.** `docs/data-quality-history.csv` keeps one row per release (v1.0.0 and v1.1.0 measured from
  their commits with the same script), so the trajectory survives rebuilds; the build upserts the current version.
- The World tab's "rates have moved" flag is a button with a real tooltip (`aria-describedby`, shown on hover, focus
  or tap); the toast that confirms "Copy the details" and "Share" is a polite live region that exists before anything
  is announced into it.

### Changed
- `docs/DATA-QUALITY.md` and the methodology page's "What is measured" table show the four states, the per-vertical
  floors and the build-and-price coverage per market.
- The masthead reads "of 414 prices, 49 estimated" (or "93 converted") with a link to what the states mean.

## [1.1.0] - 2026-10-14

The trust layer, measured instead of asserted: citations behind every tax row, dated exchange rates, honest wording,
and a scorecard that CI keeps from regressing.

### Added
- **A citation on every state row.** `data/states_us.json` carries the state revenue-department, DMV or statute page
  each rate was read from (52 of 52; the nationwide average cites the Tax Foundation's midyear table), and
  `data/states_in.json` the transport department's tax page or the state's Motor Vehicles Taxation Act on India Code
  (27 of 27). The methodology page prints them as a Source column and the detail sheet links the one behind the
  region you picked, so the tables point outward instead of at themselves.
- **Build-and-price links.** `sources.json → buildPrice["car/US"]` holds the verified configurator entry point for
  36 US brands (337 of 414 US car rows); the detail sheet links it in preference to the homepage. Sources recorded as
  a name only now show a **not linked** badge in the app and on the methodology page rather than reading like
  citations.
- **Dated exchange-rate tables.** `sources.json → fx` keeps every ECB table the data has used (29 Sept, 9 Oct, 12 Oct
  and 14 Oct 2026) with the Bank of Russia ruble rate for each day, which table each dataset was compiled or
  converted at, and which the World tab converts at. The World tab's masthead flags the largest currency move since
  the lists were compiled and the detail sheet states the row's own; aircraft rows say the rate they were converted
  at and how far the dollar has moved since. `tools/fx.mjs` pulls a table for a date; `tools/air.py` regenerates
  the aircraft rows from the dollar master list at the recorded rates.
- **Estimates in the open.** The masthead counts the estimates on every tab ("49 of 414 are estimates"), the filter
  box says how many rows it toggles, and the methodology page has a per-dataset table of confirmed rows and
  estimates.
- **"Copy the details."** Next to "Wrong price? Tell us" (a prefilled GitHub issue) the detail sheet now copies the
  same report (vehicle, region, figures, source, compile date, status, permalink) to the clipboard, so a correction
  can be sent by e-mail or message without an account; an "E-mail it" button appears when `sources.json` names a
  `contact.email`.
- **Data-quality scorecard.** `src/quality.js` measures the data at every build into `docs/DATA-QUALITY.md`: rows
  confirmed vs estimated, maker-link, build-and-price and photo coverage, linked sources, state citations, duplicate
  brand keys, the dates. `test/quality.test.mjs` fails CI when a measure drops below its floor in
  `data/quality-floor.json`, and the methodology page shows the same numbers under "What is measured".
- The app shows its version next to the data-as-of date, linked to the release; printed detail sheets carry the
  provenance block with its links written out and the permalink they were printed from.

### Changed
- **"Verified" is now "Compiled".** The date in the provenance panel is the dataset's compile date, which is what it
  always was; the panel says so, and "Confirmed" is defined as matching the maker's published list on that date.
  There are no per-row verification dates yet.
- **One spelling per maker.** Fiat/FIAT, Seat/SEAT, Mini/MINI, Infiniti/INFINITI, Ineos/INEOS and Citroen/Citroën
  were each two keys in `sources.json` and two spellings in the data; the rows, the photo index and the source maps
  now use the maker's own spelling (Fiat, SEAT, MINI, INFINITI, INEOS, Citroën) and the quality test fails on a
  second one. Mercedes-Benz and Mercedes-AMG stay separate on purpose.
- **Rubles at the Bank of Russia official rate** (84.41 ₽/$ on 29 Sept 2026, 83.87 on 14 Oct) instead of an
  unsourced "market rate" of 73.5: Russian aircraft prices converted from the dollar list rise about 15%, and
  Russian rows on the World tab convert at the official rate.
- **Aircraft rows re-converted** at the ECB rates of their compile day (12 Oct 2026) instead of the car list's
  29 Sept rates; prices outside the US move by about 1–2%.
- **Permalink history hygiene.** Filters and typing rewrite the current history entry (`replaceState`); opening a
  detail or compare sheet adds one (`pushState`), so Back closes the sheet and Forward reopens it, and closing a
  sheet with its button or Escape goes back over the entry it added instead of leaving a dead one. No history write
  touches the title or focus, so screen readers hear nothing from them.
- The "Wrong price? Tell us" and "Copy the details" actions are full-size buttons (44 px) in the sheet.

### Fixed
- The compare and detail sheets no longer hold a stale comparison set in the address after rows are removed inside
  the sheet.

## [1.0.0] - 2026-10-14

The first tagged release: four verticals, eleven countries, 5,700 vehicles, and every price traceable to its source.

### Added
- **Provenance on every price.** Each detail sheet has a "Where this price comes from" panel: the maker's price list
  (linked), what the dataset was compiled from, the verification date, whether the row is confirmed or an estimate and
  why, and which region's tax rules were applied. `data/sources.json` holds the compile dates, the exchange-rate date
  and the per-dataset sources; the masthead shows the data-as-of date on every tab.
- **Permalinks.** The vertical, country, region, every filter, the sort, the comparison set and the open sheet live in
  the URL hash, so any view can be shared and restored. "Share view" in the masthead and "Share" in the detail and
  compare sheets copy the link (or open the share sheet on phones).
- **How we calculate** (`methodology.html`), generated by the build from the same data the app ships with: the three
  prices and rounding rules, data-as-of dates, exchange rates, dealer bands, every country's state and fee tables, the
  bike, boat and aircraft fee lines, the research notes with their sources, and the corrections path.
- **Corrections path.** "Wrong price? Tell us" in every detail sheet opens a prefilled GitHub issue (vehicle, region,
  figures shown, permalink); issue templates for wrong prices, missing vehicles and bugs; a pull-request template;
  `SECURITY.md`.
- **Installable and offline.** A web app manifest and a service worker that caches the page and the fonts, fetches
  HTML network-first and never caches the photos. A print stylesheet for the list and the detail sheet.
- **Aircraft.** 971 planes, business jets, helicopters, gyroplanes, gliders and eVTOLs in every country, priced from the
  factory list with each country's aviation taxes, registration and running costs; knots and nautical miles with
  their mph, km/h, mile and km twins; fuel burn per flight hour at local avgas and Jet-A prices.
- Research notes for US bikes and boats and for aircraft under `docs/tax-notes/`.

### Changed
- Fee hooks are evaluated before region rate tables, so a hook line can carry rates, caps and exemptions as parameters.
- The offline browser checks no longer count aborted Wikimedia photo loads as page errors (CI had been red since photos
  were added).

## [0.3.0] - 2026-10-10
### Added
- Motorcycles and scooters (1,444) and boats and jet skis (556) in every country with their own fee rules
  (`data/vfees.json`), filters, wizard questions and glossaries; the vertical switch at the top of the page.
- A Wikipedia lead photo for 3,298 vehicles, credited to the photographer and licence, with silhouettes for the rest.
- The landing page's hero video and "See it in action" GIFs, recorded from the app by `brand/tools/record.py`.

## [0.2.0] - 2026-10-09
### Added
- The landing page rewritten around the monthly-payment trick; the GitHub username moved to destinjones.

## [0.1.0] - 2026-10-05
### Added
- The open source release with the website (`index.html`, `about.html`), GitHub Pages deployment, screenshots and
  the social card, and the phone-first layout (one sticky toolbar, bottom-sheet filters and dialogs, 44 px controls,
  light and dark themes). Cars and trucks for the USA, India, China, the UK, Australia, Mexico, Spain, Thailand,
  Russia, Brazil and Canada with list, dealer and on-road prices per state, province or city (compiled 29 September
  2026), the World tab, compare, the wizard, glossaries, and the tests that run every vehicle through every region.

[1.2.0]: https://github.com/destinjones/carfinder/releases/tag/v1.2.0
[1.1.0]: https://github.com/destinjones/carfinder/releases/tag/v1.1.0
[1.0.0]: https://github.com/destinjones/carfinder/releases/tag/v1.0.0
[0.3.0]: https://github.com/destinjones/carfinder/compare/c85aa56...3f5b682
[0.2.0]: https://github.com/destinjones/carfinder/compare/778ca38...c85aa56
[0.1.0]: https://github.com/destinjones/carfinder/commit/778ca38
