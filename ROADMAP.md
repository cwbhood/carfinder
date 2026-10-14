# Roadmap

Tick things off as they ship; add what you learn.

## Data
- [x] Motorcycles and scooters (1,444) and boats and jet skis (556) in every country, with their own fee rules (`data/vfees.json`)
- [x] Planes, business jets, helicopters, gyroplanes, gliders and eVTOLs (971) in every country, priced from the factory list with each country's aviation taxes, registration and running costs
- [x] A photo per vehicle from Wikipedia / Wikimedia Commons with attribution (4,227 so far; silhouettes for the rest)
- [ ] Confirm the *preliminary* bike and boat prices outside the US against dealer price lists; add trims and more boat builders
- [ ] Photos for the remaining 1,470 vehicles (mostly boats, small-market bikes and new eVTOLs without a Wikipedia article)
- [ ] Aircraft: pre-owned and demonstrator pricing, the fractional and charter alternatives, and local-currency price lists where makers publish them
- [ ] Monthly price refresh (incentives and run-out models move fastest; mark the compile date in `ABOUT` and here)
- [ ] Trim-level rows behind each model (today one row spans base to top; the slider interpolates)
- [ ] Used-car reference values (Tabela FIPE, Parkers, KBB) next to the new price
- [ ] More countries: Germany, France, Italy, Japan, South Korea, Indonesia, South Africa, Turkey, Saudi Arabia
- [x] A citation per state row: US sales-tax rows cite the state revenue department or DMV page, Indian rows the transport department or the Act (`data/states_us.json`, `data/states_in.json`)
- [ ] Dealer doc-fee and registration tables for every US state from state sources rather than typical values (doc fees are the least certain number in each row)
- [ ] Per-row verification dates (today a row's date is its dataset's compile date)

## Features
- [x] Shareable URLs: the tab, region, filters, sort, comparison set and open sheet in the hash, with Share buttons
- [x] Provenance on every price (build-and-price link, compile date, confirmed or estimate, the citation behind the region's rules), a prefilled "Wrong price? Tell us" issue and a "Copy the details" report that needs no account
- [x] Dated exchange-rate tables with a "rates moved since compile" flag; aircraft rows converted at their own compile-day rates
- [x] A measured data-quality scorecard (`docs/DATA-QUALITY.md`) with CI floors
- [x] "How we calculate": every table, band, rate and source on one generated page (`methodology.html`), with a Source column on the state tables
- [x] Installable and offline (web app manifest + service worker); print stylesheet
- [ ] A "total cost of ownership over 5 years" column (depreciation + fuel + insurance + tax)
- [ ] Lease and PCP estimates where that is how most people buy (UK, Spain, Canada)
- [ ] Monthly budget mode: show cars whose payment fits a number
- [ ] Insurance estimates by driver profile where public rate tables exist
- [ ] Save the window sticker as a PDF (the print stylesheet handles the browser's own print-to-PDF today)

## Site and project
- [x] Walkthrough video and GIFs on the website (recorded by `brand/tools/record.py`; re-record with the `record-demo` branch)
- [ ] Translate the glossary and the app chrome (Spanish, Portuguese, Hindi, Chinese, Thai, Russian)
- [x] Versioned releases with a changelog (`CHANGELOG.md`, GitHub Releases from v1.0.0)
- [ ] A build check that flags prices older than a set number of days (the scorecard records the compile dates; the age check needs a clock, so it belongs in CI rather than the deterministic build)
- [ ] Lighthouse and axe runs in CI with published numbers
