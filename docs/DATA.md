# Data: what is in `data/`, how it is shaped, where it came from

Every country tab is one JSON file of vehicle rows plus, for the US and India, a table of state tax rules. The files
are plain JSON arrays of arrays (compact, diff-friendly, no keys to misspell). `src/script.html` names the fields in
`US_FIELDS`, `IN_FIELDS` and `G_FIELDS`, and `test/data.test.mjs` enforces everything below.

**Compile date: 29 September 2026.** Prices are the manufacturers' published prices on that day, from brand price lists
and the main listing portal in each country (Autohome and Dongchedi for China; Carwow, What Car? and Autotrader for the
UK; Drive, CarExpert, carsguide and RedBook for Australia; Autocosmos and brand sites for Mexico; km77 and brand tariffs
for Spain; Autospinn and Headlightmag for Thailand; official price lists and Drom/Auto.ru for Russia; Webmotors and
brand launch pricing for Brazil; brand sites, Unhaggle and AutoTrader.ca for Canada; manufacturer sites and EPA
fueleconomy.gov for the US; brand sites and CarDekho/CarWale for India). Rows whose price is announced, expected or
backed out of an all-in price carry `est = 1` and show a *Preliminary* tag.

## One row per nameplate
A row is a model, not a trim: the price range runs from the cheapest variant to the most expensive (options excluded),
and the efficiency figures are for the most efficient common variant, the electric range for the longest-range one, the
power for the most powerful. An EV sold under its own name (Nexon EV, Corolla Cross Hybrid where the country lists it
separately) is its own row; a fuel option sold as a variant is part of the same row (`fuelsStr` = `"Petrol/Hybrid"`).

## Global schema (CN, UK, AU, MX, ES, TH, RU, BR, CA): 20 fields
```
[make, model, body, size, cls, fuelsStr, fuel, price_min, price_max, co2, l100, range_km, kwh, hp, seats, drive, mkt, note, est, isNew]
```
| # | field | rules |
|---|---|---|
| 0 | make | brand as sold locally ("Chirey" in Mexico, "GWM" in Australia, "Caoa Chery" in Brazil) |
| 1 | model | model name without the brand |
| 2 | body | `Hatch` `Sedan` `SUV` `MPV` `Pickup` `Van` `Coupe` `Conv` `Wagon` `Sports` |
| 3 | size | `City` (A-segment) `Small` (B) `Compact` (C) `Midsize` (D) `Large` (E, full-size pickups) `Full-size` (F, Land Cruiser class) |
| 4 | cls | `Mainstream` `Luxury` `Exotic` |
| 5 | fuelsStr | every fuel option joined by `/` from `Petrol` `Diesel` `Hybrid` (full hybrid; mild hybrids count as petrol or diesel) `PHEV` (also range-extenders) `EV` `CNG` `LPG` |
| 6 | fuel | the primary fuel the efficiency figures describe; must appear in `fuelsStr` |
| 7–8 | price_min, price_max | integers in local currency on the country's price basis (below); max ≥ min |
| 9 | co2 | combined g/km on the local official cycle for the base variant, or `null`; drives the UK, Spanish, Thai and Australian tax rules |
| 10 | l100 | combined litres per 100 km for the most efficient common variant (charge-sustaining figure for plug-ins); `null` for EVs |
| 11 | range_km | electric range in km on the local cycle (CLTC, WLTP, NEDC, EPA as published) for the longest-range variant; EV 100–1300, PHEV 20–500, otherwise `null` |
| 12 | kwh | battery size of the biggest pack; `null` if unknown or not electric |
| 13 | hp | peak power (PS/hp) of the most powerful variant, 20–1600 |
| 14 | seats | maximum seats, 2–17 |
| 15 | drive | free text like `FWD`, `RWD`, `AWD`, `4WD`, `FWD/AWD`; the drivetrain filter matches `AWD|4WD`, `FWD`, `RWD` |
| 16 | mkt | `hot` (sells at list, waiting lists), `steady` (small discounts), `deals` (big discounts, run-out, price war). Sets the dealer price band in `BAND[cc]` and the card badge |
| 17 | note | one plain-English line, ≤ 150 characters, no double quotes: the one thing a buyer should know |
| 18 | est | 1 if the price is estimated, announced or converted; shows the *Preliminary* tag and can be filtered out |
| 19 | isNew | 1 if launched, replaced or facelifted in 2025–26; drives the *New or updated* tag and filter |

### Price basis per country
| Tab | File | Basis (what is already inside the number) |
|---|---|---|
| China | `cars_cn.json` | 厂商指导价 (guide price), CNY; includes 13% VAT and consumption tax |
| UK | `cars_uk.json` | OTR price, GBP; VAT, delivery, plates, £55 registration and first-year VED included; pickups shown VAT-inclusive |
| Australia | `cars_au.json` | RRP before on-road costs, AUD; GST and Luxury Car Tax included |
| Mexico | `cars_mx.json` | precio de lista, MXN; IVA and ISAN included |
| Spain | `cars_es.json` | PVP recomendado, EUR; IVA and impuesto de matriculación included, before campaigns |
| Thailand | `cars_th.json` | ราคาป้าย retail price, THB; excise, interior tax and 7% VAT included |
| Russia | `cars_ru.json` | РРЦ recommended price, RUB; 20% VAT, utilisation fee and duty included; official importers only |
| Brazil | `cars_br.json` | preço de tabela, BRL, São Paulo; IPI, PIS/COFINS, ICMS and frete included |
| Canada | `cars_ca.json` | MSRP before freight and PDI, CAD |

## US schema: 21 fields (`cars_us.json`)
```
[make, model, year, body, size, cls, fuel, msrp, top, dest, city, hwy, mpg, range_mi, mpge, hp, seats, drive, mkt, note, est]
```
`year` is 2025 (leftover), 2026 or 2027 (early arrival). `body` adds `Truck` and `Minivan`; `size` is `Subcompact`
`Compact` `Midsize` `Full-size` `Heavy-duty`; `fuel` is one of `Gas` `Diesel` `Hybrid` `PHEV` `EV` `Hydrogen`. `msrp`
and `top` are the base and top-trim MSRP before the destination charge `dest`. `city`, `hwy`, `mpg` are EPA figures
(`null` for EVs and for heavy trucks, which are not rated); `range_mi` and `mpge` are the EPA electric range and MPGe for
EVs and plug-ins. The L/100 km used for unit companions is derived as 235.215 / mpg.

## India schema: 20 fields (`cars_in.json`)
```
[make, model, body, size, cls, fuelsStr, fuel, price_lakh, top_lakh, gst, kmpl, range_km, kwh, hp, seats, drive, mkt, note, est, isNew]
```
Prices are **ex-showroom in lakh** (3.5 = ₹3,50,000) and are multiplied by 100,000 on load. `gst` is the slab inside the
price (5% EVs, 18% small cars, 40% larger ones, since 22 September 2025). `size` adds `Entry` and `Sub-4m`. `kmpl` is the
ARAI claimed mileage (km per kg for CNG); L/100 km for unit companions is 100 / kmpl.

## State tables
- `states_us.json`: `code → [name, sales tax %, typical dealer doc fee $, note, source URL, source name]`, 50 states +
  DC + `US` (nationwide average). The source is the state revenue department, DMV or statute page the rate was read
  from (the nationwide row cites the Tax Foundation's midyear table); the methodology page prints it as a Source
  column and the detail sheet links it next to the region's rules. Connecticut's 7.75% above $50,000 and South
  Carolina's $500 cap are special-cased in `usTax()`, and DC's excise (a rate by weight class and city mpg on the NADA
  value, since February 2025) is `DC_EXCISE` / `dcRate()`.
- `us_tax.json`: `{asof, states: code → {tax, trade, why, src}}`: what the state calls the tax on a car purchase (sales
  tax, Title Ad Valorem Tax, highway use tax, excise, document fee…), how a trade-in reduces it (`"full"`: tax on the
  price less the trade-in; `"none"`: tax on the full price; a number: the credit is capped at that trade-in value, as in
  Michigan; `"notax"`), one sentence of why, and the source of the trade-in rule (`[url, label]`). Every state and DC
  has a row; `test/data.test.mjs` fails otherwise. Sales Tax Handbook is the compiled source except where a state
  document is cited (it was out of date for Maryland, Kentucky and Michigan when checked).
- `us_local.json`: `state → {asof, src, basis, places: [[label, combined rate %]]}`: the state's own table of combined
  state and local rates for states where a car's rate depends on where it is registered (California from CDTFA, every
  city and unincorporated county; New York from Publication 718, every county, city and NYC borough). Copied from the
  published table and checksummed against it; refresh it the same way when the state publishes a new table. A state
  without a table uses the average in `states_us.json`.
- `states_in.json`: `code → {name, p, d, c, ev, mult, fixed, cap, min, preGst, city, note, src, srcName}`: road-tax
  slabs by price (lakh) for petrol (`p`), diesel (`d`), CNG (`c`) and EVs (`ev`, empty = exempt), a cess multiplier,
  fixed and capped amounts, whether the slab applies to the pre-GST price, a city surcharge, and the citation (`src`:
  the state transport department's tax page or the state's Motor Vehicles Taxation Act on India Code). `BH` is the
  Bharat series. `test/quality.test.mjs` fails when any state row in either file lacks its citation.
- Every other country's regions and rates live in `src/script.html` next to the breakdown function that uses them
  (`REGIONS`, `RU_TAX`, `BR_ST`, `CA_PROV`, `CA_FREIGHT`, the Australian duty formulas, the Mexican ISAN table…), with
  the research behind them in [`docs/tax-notes/`](tax-notes/).

## How the on-road price is estimated
1. **Dealer band.** `BAND[cc][mkt]` gives the share of list a car in that demand level sells for (US `deals`: 87–94%
   of sticker; China `deals`: 70–85%; NEVs in China have their own tighter bands). The band and its reason are shown on
   the card and in the breakdown.
2. **Taxes and fees** for the chosen region are applied to both ends of the band by the country's `bd<CC>()` function.
   Lines marked `info` (insurance in most countries, trade-in subsidies, KASKO, next year's transport tax) are shown
   but not added; lines marked `est` are the estimated ones.
3. **Rebates** that the dealer takes off at purchase (the UK Electric Car Grant, Canada's EVAP and provincial rebates)
   are subtracted; rebates paid afterwards (Spain's Plan Auto+, China's trade-in subsidy) are shown as information.
4. **World tab.** Each car's home on-road price for its default region is converted at the ECB reference rates of
   the date in `sources.json → fx.date` (`FX` is derived from `fx.perEur[fx.date]`; rubles at the Bank of Russia rate
   in `fx.rubPerUsd`). The rates of each dataset's compile day are kept too (`fx.compiledAt`), so the app can say how
   far a currency has moved since a price list was compiled: the masthead flags the largest move on the World tab and
   the detail sheet states the row's own.

Fuel cost uses the country's default fuel and electricity prices and typical annual distance (`COUNTRIES[cc].assume`,
editable in the app), with a 12% charging-loss factor (25% for CLTC-rated ranges). Monthly payment is a standard
amortised loan on the midpoint of the on-road range with the country's typical rate, term and down payment.

## Adding or fixing rows
Edit the JSON (keep the field order), then `node src/build.js && node --test`. The tests reject a wrong length, an
unknown enum, a range outside the plausible limits, a duplicate make+model, a note with a double quote, and any
car-region combination whose total comes out non-finite or implausible. A pull request with the source of the price in
its description is all it takes.

## Motorcycle schema: 21 fields (`moto_<cc>.json`, every country)
```
[make, model, body, size, cls, fuelsStr, fuel, price_min, price_max, cc, l100, range_km, kwh, hp, seats, trans, mkt, note, est, isNew, freight]
```
- `body`: Scooter · Commuter · Naked · Sport · Cruiser · Adventure · Touring · Dual-sport · Retro · Mini · Trike.
- `size` follows `cc`: Under 125cc (< 125) · 125-300cc · 300-650cc · 650-1000cc · Over 1000cc; electric bikes are
  classed by motor power.
- `fuelsStr` / `fuel`: Petrol, CNG, Hybrid, EV (first of `fuelsStr`). `cc` and `l100` are `null` for EVs; `range_km`
  and `kwh` are the claimed range and battery for EVs.
- Prices are whole local units in every country (India in rupees, not lakh). `freight` is the freight-and-setup (PDI)
  charge where it is added on top (US, Canada); 0 where the published price already includes delivery.
- `trans`: the transmission text ("Manual 6-speed", "CVT automatic", "DCT automatic", "Single-speed").

## Boat schema: 21 fields (`boat_<cc>.json`, every country)
```
[make, model, body, size, cls, fuelsStr, fuel, price_min, price_max, length_ft, gph, range_km, kwh, hp, seats, propulsion, mkt, note, est, isNew, freight]
```
- `body`: PWC · Pontoon · Bowrider · Deck boat · Center console · Fishing · Bass boat · Jon boat · Cabin · Wake · RIB ·
  Sail · Dinghy. `size` follows `length_ft`: Under 16 ft · 16-20 ft · 20-26 ft · 26-35 ft · Over 35 ft.
- `fuel`: Petrol, Diesel, EV, Sail. `gph` is a typical cruise fuel burn in US gallons per hour for the standard engine
  (`null` for sail and electric); `hp` may be 0 on an engineless sailing dinghy; `seats` is the rated capacity.
- `note` says what the price includes (hull only, boat-and-motor, boat-motor-trailer package). `freight` is the
  freight / prep / commissioning charge where it is added on top.

## Aircraft schema: 21 fields (`air_<cc>.json`, every country)
```
[make, model, body, size, cls, fuelsStr, fuel, price_min, price_max, ktas, gph, range_km, kwh, hp, seats, engines, mkt, note, est, isNew, delivery]
```
- `body`: LSA · Piston single · Piston twin · Turboprop · Light jet · Midsize jet · Large jet · Helicopter · eVTOL ·
  Gyroplane · Glider. `size` follows `seats` (pilot included): Up to 2 · 3-4 · 5-8 · 9-14 · Over 14.
- `cls`: Mainstream (general aviation), Luxury (turboprops, light and midsize jets, premium helicopters), Exotic
  (large-cabin jets).
- `fuel`: Avgas, Jet-A (turbines and the Jet-A diesel pistons), EV, or None for a pure glider. `ktas` is the maker's
  cruise speed in knots; `gph` the cruise fuel burn in US gallons per hour (`null` for electric and unpowered);
  `range_km` the maximum range with reserves in km, shown in nautical miles (`null` for gliders); `kwh` the battery
  for electric types; `hp` the total shaft horsepower of all engines, or pounds of thrust on turbofans (`engines`
  says which: "Twin turbofan"), 0 for a glider.
- `engines`: free text ("Single piston (Rotax)", "Twin turboshaft", "Electric motors (6)") that the engine filter
  matches on. `delivery` is a typical delivery-and-acceptance charge in local units where the maker charges one.
- Prices are the maker's 2026 factory list from base to typically equipped. The US file is in dollars before sales
  tax; every other file is the dollar or euro list converted at the rates of the aircraft compile day
  (`sources.json → fx.convertedAt.air`, the table in `fx.perEur`; rubles at `fx.rubPerUsd`), rounded, shown before
  VAT / GST / duty (the fee rules add them) and marked `est = 1`, since the invoice follows the exchange rate. The
  files are generated: `python3 tools/air.py` rewrites them from the dollar master list in that script at the recorded
  rates, so a new compile is "pull the rates, set `convertedAt.air`, run the script". Russia keeps only Russian-built
  types and the Western types that still reach it as parallel imports.

### Price basis for bikes and boats
US and Canada MSRP before freight and setup; UK OTR (bikes) and VAT-inclusive dealer price (boats); Australia
ride-away (bikes) and RRP (boats); India ex-showroom (GST 18% up to 350 cc, 40% above, 5% EV; 40% on boats); China
guide price with VAT; Mexico, Spain, Thailand, Russia and Brazil the published retail price with tax inside. The rules
that turn each into an on-road price are in `data/vfees.json`.

## Fee rules: `vfees.json`
`VFEES[cc].moto`, `.boat` and `.air` each hold `bands` (dealer price as a share of list per market level), `basis` (the
label and explanation of the published price), an optional `typical` label for the dealer-price line ("Typical
transaction price" for aircraft), `fees` (the lines of the breakdown, in order) and `glossary` (extra terms for that
country). A fee line is `{k, sub}` plus one of `fixed` (a number, or `"dest"` for the row's freight), `pct`,
`rates` (by region code, `XX` for the rest), `brackets` (`[[upto, value], …]` on `on: "ccm" | "hp" | "len" |
"price"`), `hook` (`usSales` with `rates` / `caps` / `exempt`, `usDoc`, `inRoad`, `caProv`, `cnPurchase`, `esMatric`) or
`text` (information only). `mode` is `pct` (default), `fixed` or `perhp`; modifiers: `fuel`, `notFuel`, `fuels`,
`body`, `notBody`, `bodies`, `evMult`, `min`, `max`, `ofList`, `withDest`, `plus`, `suffix`, `info`, `skipZero`,
`approx`. Aircraft lines use the same kinds: the US sales-tax hook carries the aircraft rates, caps and exemptions
by state, Spain's registration tax applies through `bodies`, and the insurance, hangar, annual and licence lines are
`info` or `text`.

## Provenance: `sources.json`
`compiled` and `rulesAsOf` give the compile date per vertical (`car`, `moto`, `boat`, `air`); `sets["<vt>/<CC>"]` the
price basis, the sources the dataset was compiled from (`[name, url]`, `url` null when it is a brand's own price list
rather than one site: the app and the methodology page then show it as **not linked** instead of dressing it up as a
citation) and the rules applied; `setsDefault` the fallback for verticals without a per-country entry; `brands` the
makers' sites, `brandsByCC` the country-specific ones and `buildPrice["<vt>/<CC>"]` the verified build-and-price entry
points (cars in all eleven markets, 1,215 rows), which the detail sheet links in preference to the homepage. Add one
only from a page you have seen (a search result or a fetch), never a guessed URL. Keep one spelling per maker
across the data and these maps (the maker's own: `MINI`, `SEAT`, `INFINITI`, `INEOS`, `Citroën`, `Fiat`); the quality
test fails on a second spelling. Optional `contact.email` turns on an "E-mail it" button on the report panel.

`fx` holds every exchange-rate table the data has used: `perEur[date]` (ECB reference rates per euro) and
`rubPerUsd[date]` (Bank of Russia official rate), `date` (the table the World tab converts at), `compiledAt[vt]` (the
rates of each dataset's compile day) and `convertedAt[vt]` (datasets whose prices were converted from a dollar or euro
list: aircraft). Pull a new table with `node tools/fx.mjs YYYY-MM-DD` where the network allows it (it reads the ECB
90-day history and the Bank of Russia daily XML and writes the entry), then set the dates by hand.

The app shows all of it in the detail sheet: "Compiled" is the dataset date, and every row is in one of four states
derived by `rowStatus()` from its `est` flag, the vertical and the market: **checked** (a `checked` date on the row;
none yet), **listed** (`est = 0`: the maker's published price on the compile date), **converted** (`est = 1` on an
aircraft row outside the US: a dollar or euro list at a dated rate) or **estimated** (any other `est = 1`).
`methodology.html` lists it per country; `docs/DATA-QUALITY.md` is the measured scorecard and
`docs/data-quality-history.csv` one row per release (`src/quality.js`, regenerated by every build; the floors are per
vertical in `data/quality-floor.json`).

## Photo index: `images.json`
`files` lists each Wikimedia Commons file once as `[name, host, md5 prefix, author, licence, "o"?]` and `map` goes from
`"vt/cc"` to `"make|model"` to `[file index, approx]` (approx = the photo may show an earlier generation or another
market's version). The index was built from the English Wikipedia API on 10 October 2026 (lead image of the article
found for the make and model, author and licence from `imageinfo`); re-run the lookup when models are added. Only
page titles containing the make were accepted, brand pages and photos dated before 2005 were rejected.
