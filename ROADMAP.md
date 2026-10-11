# Roadmap

Tick things off as they ship; add what you learn.

## Data
- [x] Motorcycles and scooters (1,444) and boats and jet skis (556) in every country, with their own fee rules (`data/vfees.json`)
- [x] A photo per vehicle from Wikipedia / Wikimedia Commons with attribution (3,298 so far; silhouettes for the rest)
- [ ] Confirm the *preliminary* bike and boat prices outside the US against dealer price lists; add trims and more boat builders
- [ ] Photos for the remaining 1,400 vehicles (mostly boats and small-market bikes without a Wikipedia article)
- [ ] Monthly price refresh (incentives and run-out models move fastest; mark the compile date in `ABOUT` and here)
- [ ] Trim-level rows behind each model (today one row spans base to top; the slider interpolates)
- [ ] Used-car reference values (Tabela FIPE, Parkers, KBB) next to the new price
- [ ] More countries: Germany, France, Italy, Japan, South Korea, Indonesia, South Africa, Turkey, Saudi Arabia
- [ ] Dealer doc-fee and registration tables for every US state from state sources rather than typical values

## Features
- [ ] Shareable URLs: encode the tab, region and filters in the hash
- [ ] A "total cost of ownership over 5 years" column (depreciation + fuel + insurance + tax)
- [ ] Lease and PCP estimates where that is how most people buy (UK, Spain, Canada)
- [ ] Monthly budget mode: show cars whose payment fits a number
- [ ] Insurance estimates by driver profile where public rate tables exist
- [ ] Print / save the window sticker as a PDF

## Site and project
- [x] Walkthrough video and GIFs on the website (recorded by `brand/tools/record.py`; re-record with the `record-demo` branch)
- [ ] Translate the glossary and the app chrome (Spanish, Portuguese, Hindi, Chinese, Thai, Russian)
- [ ] Versioned releases with a changelog once the data refresh cadence is set
