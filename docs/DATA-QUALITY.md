# Data quality

Measured by `src/quality.js` at build time from the data files; `node src/build.js` rewrites this page and
`test/quality.test.mjs` fails the build when a number drops below its floor in `data/quality-floor.json`.
One row per release is kept in `data-quality-history.csv`, so the trajectory survives rebuilds.
Data as of **12 Oct 2026** (the newest compile date); exchange rates of **14 Oct 2026**.

## Four states

Every row is in exactly one state, each true of the row and nothing more:

- **checked**: a person compared the row to the maker’s page after compile (the row carries a `checked` date). None yet; this is where per-row verification goes.
- **listed**: the maker’s published list price for this market on the dataset’s compile date, not individually re-checked since.
- **converted**: a published list in another currency, converted at a dated exchange rate (aircraft outside the US).
- **estimated**: modelled from announcements, trade press or dealer quotes (most boats, and bikes outside the US).

"From a published list" below is checked + listed + converted; the floors are per vertical, so adding boats cannot break cars and a vertical that stands still is visible.

## Headline

| Measure | Value | Floor |
|---|---:|---:|
| Rows | 5,700 | |
| Checked by a person | 0 (0.0%) | |
| Listed (maker’s published price) | 2,517 (44.2%) | |
| Converted (published list at a dated rate) | 865 (15.2%) | |
| Estimated | 2,318 (40.7%) | |
| From a published list, all rows | 3,382 (59.3%) | per vertical, below |
| Rows whose maker page is linked | 5,407 (94.9%) | 92% |
| Makers without a linked page | 159 | at most 159 |
| US car rows with a build-and-price link | 337 of 414 (81.4%) | 78% |
| Car rows with a build-and-price link, all markets | 1,215 of 2,729 (44.5%) | 42% |
| Rows with a photo | 4,228 (74.2%) | per vertical, below |
| Price sources that cite a page | 34 of 49 | at most 15 unlinked |
| US state rows with a citation | 52 of 52 | all |
| Indian state rows with a citation | 27 of 27 | all |
| Makers spelled two ways (case- and accent-insensitive) | 0 | 0 |

## Per vertical, with floors

| Vertical | Rows | From a published list | Floor | Photos | Floor |
|---|---:|---:|---:|---:|---:|
| Cars & trucks | 2,729 | 71.1% | 68% | 86.2% | 84% |
| Motorcycles | 1,444 | 35.6% | 32% | 64.2% | 62% |
| Boats | 556 | 11.3% | 10% | 3.6% | 3% |
| Aircraft | 971 | 89.2% | 86% | 95.7% | 93% |

Raise a floor when a vertical improves; a change that lowers one is the regression the test exists to catch.

## Dates

| Dataset | Prices compiled | Tax rules as of | Rates on the compile day | Converted at |
|---|---|---|---|---|
| Cars & trucks | 29 Sept 2026 | 29 Sept 2026 | 29 Sept 2026 | home-currency list, not converted |
| Motorcycles | 10 Oct 2026 | 10 Oct 2026 | 9 Oct 2026 | home-currency list, not converted |
| Boats | 10 Oct 2026 | 10 Oct 2026 | 9 Oct 2026 | home-currency list, not converted |
| Aircraft | 12 Oct 2026 | 12 Oct 2026 | 12 Oct 2026 | 12 Oct 2026 (from the maker’s dollar or euro list) |

The World tab converts at the ECB rates of 14 Oct 2026; the rate tables in `data/sources.json` hold 29 Sept 2026, 9 Oct 2026, 12 Oct 2026, 14 Oct 2026. There are no per-row verification dates yet: "compiled" is the date of the whole dataset.

## Per dataset

| Dataset | Rows | Checked | Listed | Converted | Estimated | Maker linked | Build & price | Photos |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **Cars & trucks** | **2,729** | **0** | **1,939 (71.1%)** | **0** | **790 (28.9%)** | **95.6%** | **44.5%** | **86.2%** |
| USA | 414 | 0 | 365 (88.2%) | 0 | 49 (11.8%) | 100.0% | 81.4% | 93.5% |
| India | 208 | 0 | 165 (79.3%) | 0 | 43 (20.7%) | 100.0% | 41.3% | 82.7% |
| China | 188 | 0 | 185 (98.4%) | 0 | 3 (1.6%) | 82.4% | 21.3% | 88.8% |
| United Kingdom | 280 | 0 | 222 (79.3%) | 0 | 58 (20.7%) | 100.0% | 51.4% | 86.1% |
| Australia | 302 | 0 | 176 (58.3%) | 0 | 126 (41.7%) | 100.0% | 35.4% | 86.8% |
| Mexico | 324 | 0 | 135 (41.7%) | 0 | 189 (58.3%) | 96.9% | 32.7% | 82.4% |
| Spain | 164 | 0 | 127 (77.4%) | 0 | 37 (22.6%) | 99.4% | 40.2% | 90.9% |
| Thailand | 211 | 0 | 82 (38.9%) | 0 | 129 (61.1%) | 96.2% | 33.6% | 88.6% |
| Russia | 159 | 0 | 84 (52.8%) | 0 | 75 (47.2%) | 62.3% | 26.4% | 58.5% |
| Brazil | 233 | 0 | 214 (91.8%) | 0 | 19 (8.2%) | 97.0% | 28.8% | 83.7% |
| Canada | 246 | 0 | 184 (74.8%) | 0 | 62 (25.2%) | 100.0% | 60.6% | 94.3% |
| **Motorcycles** | **1,444** | **0** | **514 (35.6%)** | **0** | **930 (64.4%)** | **93.1%** | **–** | **64.2%** |
| USA | 270 | 0 | 220 (81.5%) | 0 | 50 (18.5%) | 98.5% | – | 61.9% |
| India | 175 | 0 | 142 (81.1%) | 0 | 33 (18.9%) | 97.7% | – | 53.1% |
| China | 102 | 0 | 0 (0.0%) | 0 | 102 (100.0%) | 78.4% | – | 52.9% |
| United Kingdom | 175 | 0 | 56 (32.0%) | 0 | 119 (68.0%) | 96.0% | – | 67.4% |
| Australia | 121 | 0 | 8 (6.6%) | 0 | 113 (93.4%) | 95.9% | – | 73.6% |
| Mexico | 107 | 0 | 8 (7.5%) | 0 | 99 (92.5%) | 95.3% | – | 63.6% |
| Spain | 127 | 0 | 37 (29.1%) | 0 | 90 (70.9%) | 95.3% | – | 74.8% |
| Thailand | 97 | 0 | 25 (25.8%) | 0 | 72 (74.2%) | 91.8% | – | 74.2% |
| Russia | 54 | 0 | 0 (0.0%) | 0 | 54 (100.0%) | 44.4% | – | 24.1% |
| Brazil | 88 | 0 | 12 (13.6%) | 0 | 76 (86.4%) | 90.9% | – | 69.3% |
| Canada | 128 | 0 | 6 (4.7%) | 0 | 122 (95.3%) | 99.2% | – | 75.8% |
| **Boats** | **556** | **0** | **63 (11.3%)** | **0** | **493 (88.7%)** | **87.8%** | **–** | **3.6%** |
| USA | 162 | 0 | 51 (31.5%) | 0 | 111 (68.5%) | 99.4% | – | 1.9% |
| India | 24 | 0 | 0 (0.0%) | 0 | 24 (100.0%) | 87.5% | – | 0.0% |
| China | 25 | 0 | 0 (0.0%) | 0 | 25 (100.0%) | 80.0% | – | 8.0% |
| United Kingdom | 54 | 0 | 0 (0.0%) | 0 | 54 (100.0%) | 88.9% | – | 3.7% |
| Australia | 53 | 0 | 0 (0.0%) | 0 | 53 (100.0%) | 88.7% | – | 3.8% |
| Mexico | 32 | 0 | 0 (0.0%) | 0 | 32 (100.0%) | 93.8% | – | 6.3% |
| Spain | 54 | 0 | 0 (0.0%) | 0 | 54 (100.0%) | 85.2% | – | 3.7% |
| Thailand | 26 | 0 | 0 (0.0%) | 0 | 26 (100.0%) | 96.2% | – | 7.7% |
| Russia | 24 | 0 | 0 (0.0%) | 0 | 24 (100.0%) | 20.8% | – | 4.2% |
| Brazil | 45 | 0 | 7 (15.6%) | 0 | 38 (84.4%) | 68.9% | – | 4.4% |
| Canada | 57 | 0 | 5 (8.8%) | 0 | 52 (91.2%) | 94.7% | – | 3.5% |
| **Aircraft** | **971** | **0** | **1 (0.1%)** | **865** | **105 (10.8%)** | **99.4%** | **–** | **95.7%** |
| USA | 106 | 0 | 1 (0.9%) | 0 | 105 (99.1%) | 100.0% | – | 94.3% |
| India | 90 | 0 | 0 (0.0%) | 90 | 0 (0.0%) | 100.0% | – | 95.6% |
| China | 77 | 0 | 0 (0.0%) | 77 | 0 (0.0%) | 94.8% | – | 96.1% |
| United Kingdom | 93 | 0 | 0 (0.0%) | 93 | 0 (0.0%) | 100.0% | – | 95.7% |
| Australia | 103 | 0 | 0 (0.0%) | 103 | 0 (0.0%) | 100.0% | – | 95.1% |
| Mexico | 82 | 0 | 0 (0.0%) | 82 | 0 (0.0%) | 100.0% | – | 96.3% |
| Spain | 91 | 0 | 0 (0.0%) | 91 | 0 (0.0%) | 100.0% | – | 95.6% |
| Thailand | 80 | 0 | 0 (0.0%) | 80 | 0 (0.0%) | 98.8% | – | 96.3% |
| Russia | 56 | 0 | 0 (0.0%) | 56 | 0 (0.0%) | 98.2% | – | 98.2% |
| Brazil | 93 | 0 | 0 (0.0%) | 93 | 0 (0.0%) | 100.0% | – | 96.8% |
| Canada | 100 | 0 | 0 (0.0%) | 100 | 0 (0.0%) | 100.0% | – | 94.0% |

## Build-and-price links per car market

| Market | Rows | Linked to a build-and-price page |
|---|---:|---:|
| USA | 414 | 337 (81.4%) |
| India | 208 | 86 (41.3%) |
| China | 188 | 40 (21.3%) |
| United Kingdom | 280 | 144 (51.4%) |
| Australia | 302 | 107 (35.4%) |
| Mexico | 324 | 106 (32.7%) |
| Spain | 164 | 66 (40.2%) |
| Thailand | 211 | 71 (33.6%) |
| Russia | 159 | 42 (26.4%) |
| Brazil | 233 | 67 (28.8%) |
| Canada | 246 | 149 (60.6%) |

Rows without one link the maker’s site for that market (`brandsByCC`) or its global site (`brands`).

## Sources without a link

Price sources recorded as a name only (print lists, dealer quotes, maker price lists with no stable page). The app marks them "not linked".

- car/US: Manufacturer build-and-price pages (the maker link on each row)
- car/IN: Manufacturer price lists
- car/IN: ARAI figures from brand brochures
- car/UK: Manufacturer price lists
- car/MX: Manufacturer sites
- car/ES: Manufacturer tariffs
- car/TH: Manufacturer sites
- car/RU: Official price lists (brand sites)
- car/BR: Manufacturer offer pages
- car/CA: Manufacturer newsroom price releases
- moto/US: Manufacturer sites and dealer showroom listings
- boat/US: Manufacturer sites and dealer listings
- air/ALL: Manufacturer price lists and type announcements
- moto/default: Maker price lists and dealer listings in this market
- boat/default: Maker price lists and dealer listings in this market

## Makers without a linked page

159 makers (floor: at most 159); rows whose maker has no entry in `brands` or `brandsByCC` in `data/sources.json`.

- Voge: 12 rows (moto/AU, moto/CN, moto/ES, moto/RU, moto/UK)
- Jetour: 11 rows (car/CN, car/MX, car/RU)
- Zontes: 11 rows (moto/CN, moto/ES, moto/IN, moto/RU, moto/UK)
- Kove: 8 rows (moto/AU, moto/CN, moto/RU, moto/US)
- Super Soco: 8 rows (moto/AU, moto/BR, moto/CA, moto/CN, moto/ES, moto/MX, moto/RU, moto/UK)
- BAIC: 6 rows (car/MX, car/RU)
- Moskvich: 6 rows (car/RU)
- Tenet: 6 rows (car/RU)
- Wey: 5 rows (car/CN, car/RU)
- Dongfeng: 5 rows (car/CN, car/RU)
- Voyah: 5 rows (car/CN, car/RU)
- Aion: 5 rows (car/TH)
- Haojue: 5 rows (moto/BR, moto/CN)
- GAC Aion: 4 rows (car/CN)
- Bestune: 4 rows (car/CN, car/MX, car/RU)
- Soueast: 4 rows (car/MX, car/RU)
- Solaris: 4 rows (car/RU)
- Caoa Chery: 4 rows (car/BR)
- Brig: 4 rows (boat/AU, boat/CN, boat/TH, boat/UK)
- Fangchengbao: 3 rows (car/CN)
- Exeed: 3 rows (car/CN, car/RU)
- Exlantix: 3 rows (car/RU)
- Belgee: 3 rows (car/RU)
- Livan: 3 rows (car/RU)
- Caoa Changan: 3 rows (car/BR)
- Lifan: 3 rows (moto/CN, moto/RU, moto/TH)
- Vento: 3 rows (moto/MX, moto/RU)
- GPX: 3 rows (moto/TH)
- Optimist: 3 rows (boat/BR, boat/CN, boat/RU)
- Ora: 2 rows (car/CN)
- IM: 2 rows (car/CN)
- Onvo: 2 rows (car/CN)
- GAC Trumpchi: 2 rows (car/CN)
- Neta: 2 rows (car/TH)
- Xcite: 2 rows (car/RU)
- Genuine: 2 rows (moto/US)
- Moto Morini: 2 rows (moto/IN, moto/RU)
- Zeeho: 2 rows (moto/CN, moto/RU)
- Felo: 2 rows (moto/CN, moto/TH)
- Minsk: 2 rows (moto/RU)
- Motoland: 2 rows (moto/RU)
- Racer: 2 rows (moto/RU)
- Ventura: 2 rows (boat/BR)
- AVIC: 2 rows (air/CN)
- Harbin: 2 rows (air/CN, air/TH)
- Yangwang: 1 row (car/CN)
- iCAR: 1 row (car/CN)
- Roewe: 1 row (car/CN)
- Firefly: 1 row (car/CN)
- Luxeed: 1 row (car/CN)
- Stelato: 1 row (car/CN)
- Maextro: 1 row (car/CN)
- Shangjie: 1 row (car/CN)
- Foton: 1 row (car/MX)
- Zacua: 1 row (car/MX)
- Ebro: 1 row (car/ES)
- Juneyao: 1 row (car/TH)
- Jeland: 1 row (car/RU)
- M-Hero: 1 row (car/RU)
- Rox: 1 row (car/RU)
- Nordcross: 1 row (car/RU)
- Forthing: 1 row (car/RU)
- SWM: 1 row (car/RU)
- Oting: 1 row (car/RU)
- Amberauto: 1 row (car/RU)
- Lance: 1 row (moto/US)
- Ampere: 1 row (moto/IN)
- River: 1 row (moto/IN)
- Dayang: 1 row (moto/CN)
- Jialing: 1 row (moto/CN)
- Davinci: 1 row (moto/CN)
- Tailg: 1 row (moto/CN)
- Luyuan: 1 row (moto/CN)
- Royal Alloy: 1 row (moto/UK)
- Herald: 1 row (moto/UK)
- Fonz: 1 row (moto/AU)
- Savic: 1 row (moto/AU)
- Veloci: 1 row (moto/MX)
- Carabela: 1 row (moto/MX)
- Macbor: 1 row (moto/ES)
- Hanway: 1 row (moto/ES)
- Velca: 1 row (moto/ES)
- Stallions: 1 row (moto/TH)
- H SEM: 1 row (moto/TH)
- Deco: 1 row (moto/TH)
- Regulmoto: 1 row (moto/RU)
- Avantis: 1 row (moto/RU)
- Irbis: 1 row (moto/RU)
- Baltmotors: 1 row (moto/RU)
- Sharmax: 1 row (moto/RU)
- Stels: 1 row (moto/RU)
- ABM: 1 row (moto/RU)
- Promax: 1 row (moto/RU)
- Eltreco: 1 row (moto/RU)
- Avelloz: 1 row (moto/BR)
- Voltz: 1 row (moto/BR)
- Watts: 1 row (moto/BR)
- Origem: 1 row (moto/BR)
- Arc: 1 row (boat/US)
- Mandovi Drydocks: 1 row (boat/IN)
- Sea Hawk: 1 row (boat/IN)
- Navgathi: 1 row (boat/IN)
- Sunbird: 1 row (boat/CN)
- Hansheng: 1 row (boat/CN)
- Aquila: 1 row (boat/CN)
- Warrior: 1 row (boat/UK)
- Aintree Boats: 1 row (boat/UK)
- Collingwood: 1 row (boat/UK)
- Ortomarine: 1 row (boat/UK)
- Hartley: 1 row (boat/UK)
- Savage: 1 row (boat/AU)
- Stessl: 1 row (boat/AU)
- Yellowfin: 1 row (boat/AU)
- Evolution: 1 row (boat/AU)
- Arvor: 1 row (boat/AU)
- Imemsa: 1 row (boat/MX)
- Eduardoño: 1 row (boat/MX)
- Pacific Craft: 1 row (boat/ES)
- Nuva: 1 row (boat/ES)
- Faeton: 1 row (boat/ES)
- Magonis: 1 row (boat/ES)
- Myabca: 1 row (boat/ES)
- Valiant: 1 row (boat/ES)
- Capelli: 1 row (boat/ES)
- Nautivela: 1 row (boat/ES)
- Fregat: 1 row (boat/RU)
- Badger: 1 row (boat/RU)
- Gladiator: 1 row (boat/RU)
- Hunterboat: 1 row (boat/RU)
- Windboat: 1 row (boat/RU)
- Wyatboat: 1 row (boat/RU)
- Salut: 1 row (boat/RU)
- Kazanka: 1 row (boat/RU)
- Neman: 1 row (boat/RU)
- Volzhanka: 1 row (boat/RU)
- Orionboat: 1 row (boat/RU)
- Realcraft: 1 row (boat/RU)
- Tuna: 1 row (boat/RU)
- NorthSilver: 1 row (boat/RU)
- Berkut: 1 row (boat/RU)
- Luch: 1 row (boat/RU)
- Velvette: 1 row (boat/RU)
- Grizzly: 1 row (boat/RU)
- Fluvimar: 1 row (boat/BR)
- Real Powerboats: 1 row (boat/BR)
- Coral: 1 row (boat/BR)
- Mestra: 1 row (boat/BR)
- Evolve: 1 row (boat/BR)
- Armatti: 1 row (boat/BR)
- Phantom: 1 row (boat/BR)
- Cimitarra: 1 row (boat/BR)
- Azimut Brasil: 1 row (boat/BR)
- Zefir: 1 row (boat/BR)
- Delta Yachts: 1 row (boat/BR)
- Campion: 1 row (boat/CA)
- Thunder Jet: 1 row (boat/CA)
- CL Boats: 1 row (boat/CA)
- AVIC General: 1 row (air/CN)
- Aviatika: 1 row (air/RU)

## Brand keys

No maker is spelled two ways in the data or the source maps.

## Tax tables

- USA: 52 of 52 state rows cite the state revenue department or DMV page (`data/states_us.json`, 5th and 6th elements).
- India: 27 of 27 state rows cite the transport department or the Act (`data/states_in.json`, `src` and `srcName`).
- Other countries: the per-region rules are documented in `docs/tax-notes/<cc>.md` with their sources: CN (31 links), UK (29 links), AU (75 links), MX (27 links), ES (58 links), TH (126 links), RU (99 links), BR (51 links), CA (47 links), us-bikes-boats (57 links), aircraft (22 links).

