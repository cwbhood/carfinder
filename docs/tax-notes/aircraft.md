# Aircraft (all eleven tabs): price basis, taxes and fees, October 2026

Snapshot date 12 October 2026. The aircraft rows in `data/air_<cc>.json` share one master list of types (the same
plane, jet or helicopter is sold worldwide at a dollar or euro factory price), so unlike cars the price basis and the
estimation method are the same in every tab; only the taxes, registration and running-cost assumptions change.
Encoded in `VFEES[cc].air` (`data/vfees.json`), `VERT.air` and `normalize()` for `vt === 'air'` in `src/script.html`.

## 1. Price basis
- `price_min` is the maker's 2026 **factory list price** for the base configuration; `price_max` the **typically
  equipped** price with the avionics and options almost every buyer takes (a second screen, autopilot, air
  conditioning, de-ice, cabin finish on jets). Business jets and helicopters are quoted typically equipped by their
  makers, so the spread on those rows covers the usual option packages.
- The US file is in dollars before sales or use tax. Every other file is the dollar list (euro list for Pipistrel,
  Tecnam, Diamond, Extra, Stemme, Schempp-Hirth, Schleicher, AutoGyro, Magni, Dassault, Airbus Helicopters, Leonardo,
  Guimbal and the Russian and Chinese types priced in their home currency) converted at the ECB reference rates of
  the compile day, 12 October 2026 (`fx.convertedAt.air` and the matching `fx.perEur` table in `data/sources.json`;
  rubles at the Bank of Russia official rate, 84.90 ₽/$), rounded to the nearest 1,000 (100,000 rupees; 10,000 rubles,
  baht or pesos), and shown **before VAT, GST, IVA or duty**, which the fee lines add. Because the invoice follows the
  exchange rate, every row outside the US carries `est = 1`.
- Russia keeps only Russian-built types (UZGA, Russian Helicopters, Aviatika) and the Western types that still reach the
  market as parallel imports through third countries, marked `deals` with a note; they have no factory support.
- `delivery` is a typical delivery-and-acceptance charge (ferry flight, handover training, documentation) where makers
  charge one, converted the same way. Many light-aircraft makers include it.

## 2. Dealer bands
Aircraft are sold by the maker or a regional distributor, not haggled on a lot, so the bands are narrow:
hot 100% to 103% (positions on backlogged types change hands at a premium), steady 95% to 100% (a few percent off or
options thrown in, more at quarter-end), deals 88% to 95% (types being replaced, end of a production run, unsold
"white-tail" aircraft). GAMA's quarterly shipment reports show which types are slipping.

## 3. From factory list to delivered, per tab
| Tab | Purchase tax | Duty | Registration | Notes |
|---|---|---|---|---|
| USA | State sales or use tax on the aircraft and delivery at the state's general rate, except: Virginia 2% aircraft tax; North Carolina 4.75% capped at $2,500; South Carolina 5% capped at $500; Massachusetts, Connecticut, New York, Maine, Rhode Island, New Hampshire, Oregon, Montana, Alaska and Delaware exempt aircraft (several require a commercial or casual-sale condition, treated as exempt here). Fly-away exemptions (Texas, Florida, Kansas…) let a nonresident buyer take delivery tax-free and pay use tax at home | none | FAA N-number registration $5, renewed every 7 years; about a dozen states register aircraft or levy personal-property tax (typical $300 first year) | |
| Canada | GST or HST (BC: GST plus 7% PST on aircraft, 12% total) | duty-free | Transport Canada Certificate of Registration, about C$110 | |
| United Kingdom | VAT 20% on private purchases and imports (VAT-registered businesses and qualifying airlines reclaim or zero-rate it) | duty-free | CAA G-INFO registration by weight class, about £250 | Certified aircraft fly on a CofA with an annual ARC; microlights and homebuilts on a Permit to Fly |
| Australia | GST 10% on the aircraft and freight | duty-free | CASA VH- registration, about A$130; RAAus registers LSA and ultralights separately | |
| Mexico | IVA 16% | duty-free under T-MEC for most civil aircraft | AFAC XA/XB registration and airworthiness certificate, about MX$9,000 | |
| Spain | IVA 21% (IGIC in Canarias) and the **impuesto de matriculación** of 12% of the pre-IVA price on private aircraft above 1,550 kg MTOW (piston twins, turboprops, jets, helicopters); light aircraft, gliders and gyroplanes exempt; business and air-taxi aircraft exempt | duty-free | AESA EC- registration and airworthiness certificate, about €400 | |
| Thailand | VAT 7% | duty-free | CAAT HS- registration, about ฿6,000 | |
| Russia | VAT 20% on the aircraft, duty and delivery | 5% to 20% by weight class on imports, treated as 10%; Russian-built types none | Rosaviatsiya RA- registration and airworthiness certificate, about 20,000 ₽ | Western types only as parallel imports |
| Brazil | ICMS, reduced to 4% in most states for aviation, plus PIS/COFINS 9.25% | duty-free | ANAC RAB registration (PR-/PS-), about R$1,500 | |
| China | VAT 13% on the aircraft, duty and delivery | 5% on general-aviation aircraft and helicopters; Chinese-built types none | CAAC B- registration and airworthiness certificate, about ¥5,000 | General-aviation flights need approved low-altitude airspace; the 2024 low-altitude economy reforms are opening it province by province |
| India | GST 28% on aircraft for personal use (5% for scheduled and non-scheduled operators, which is why most Indian business jets sit on an NSOP) | basic customs duty plus surcharge, treated as 3% for private use | DGCA VT- registration, certificate of airworthiness and the NSOP or private-category paperwork, about ₹50,000 | |

Information lines (shown, not added): hull and liability insurance at 1.5% of value a year (1% to 2% in practice,
more for low-time pilots and helicopters), a delivery flight and independent acceptance inspection at 0.5% to 1%,
hangarage at 2% to 4% of value a year, the annual inspection and maintenance at 3% to 8% a year (US$3,000 to US$8,000
on a light single, US$40,000+ on a turboprop, US$300,000+ plus engine programmes on a large jet), and a pilot licence
(private pilot from about US$15,000, instrument rating US$10,000+, helicopter PPL US$20,000+, a jet type rating
US$30,000 to US$60,000, often included with a new jet).

## 4. Speed, range, fuel burn and running assumptions
- `ktas` is the maker's cruise speed in knots true airspeed; `range_km` the maximum range with reserves at long-range
  cruise, usually with fewer than the full seats occupied (plan on 80% to 90%). The app shows knots and nautical miles
  everywhere with mph, km/h, miles or km alongside.
- `gph` is the maker's cruise fuel burn in US gallons per hour: avgas 100LL for most pistons, Jet-A for turbines and
  the Jet-A diesels (Continental CD and Austro engines). The yearly fuel estimate multiplies it by the flight hours in
  the cost assumptions (100 hours a year by default, a typical private owner's 50 to 150) at local pump prices held in
  `VERT.air.fuel`: avgas US$6.95 and Jet-A US$6.25 a gallon in the US; per litre elsewhere (avgas about C$2.90, £2.60,
  €2.90, A$3.10, MX$55, ฿110, 400 ₽, R$12, ¥25, ₹400; Jet-A about C$2.00, £1.20, €1.30, A$1.90, MX$30, ฿40, 95 ₽,
  R$7.50, ¥8, ₹110). Electric types are charged at the car electricity price with a 10% loss, a full pack being roughly
  an hour aloft.
- Loans: the car loan rate for the country plus 0.5 points, 180 months, 15% down, as aircraft lenders typically offer
  on new equipment.
- Power is the total shaft horsepower of all engines; turbofans are rated in pounds of thrust (lbf), which the app
  labels separately because the two do not compare. Gliders carry `hp = 0`, `fuel = None` and no fixed range.

## 5. Glossary terms used
Factory list vs typically equipped · delivery position · pre-buy / acceptance inspection · registration authorities
(FAA, CAA, EASA state registers, DGCA, CAAC) · owner-flown and single-pilot types · eVTOL (EHang EH216-S certified in
China; the Joby, Archer and Vertical air-taxi designs still in certification and not sold to individuals) · LSA and the
2025 MOSAIC rule · TBO (1,500 to 2,200 hours on pistons; an overhaul US$30,000 to US$60,000).

## 6. Sources
- Factory list prices and option pricing: manufacturer price lists and type announcements (Cirrus, Piper, Textron
  Aviation, Diamond, Pipistrel, Tecnam, Daher, Pilatus, Embraer, Honda Aircraft, Bombardier, Gulfstream, Dassault,
  Robinson, Bell, Airbus Helicopters, Leonardo), with the trade press for typically-equipped and delivery-position
  pricing: https://www.ainonline.com , https://www.flyingmag.com , https://www.aopa.org/news-and-media , and GAMA's
  shipment and billing reports https://gama.aero/news-and-events/statistics/
- Exchange rates: ECB euro reference rates of 12 October 2026 (the compile day; the tables in `data/sources.json`)
  and the Bank of Russia official US dollar rate https://www.cbr.ru/eng/currency_base/daily/
  https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
- US sales and use tax on aircraft: state revenue departments (Virginia aircraft sales and use tax
  https://www.tax.virginia.gov/aircraft-sales-and-use-tax ; North Carolina aircraft cap
  https://www.ncdor.gov/taxes-forms/sales-and-use-tax/aircraft-and-qualified-jet-engines ; South Carolina maximum tax
  https://dor.sc.gov/sales-use-tax-index/maximum-tax-max-tax ; Texas fly-away exemption
  https://comptroller.texas.gov/taxes/publications/94-168.php ) and the AOPA state tax summaries
  https://www.aopa.org/advocacy/advocacy-briefs/aviation-tax-and-fee-summaries
- Registration: FAA aircraft registry https://www.faa.gov/licenses_certificates/aircraft_certification/aircraft_registry ;
  Transport Canada https://tc.canada.ca/en/aviation/aircraft-registration ; UK CAA G-INFO https://www.caa.co.uk/aircraft-register/g-info/ ;
  CASA https://www.casa.gov.au/aircraft/aircraft-registration ; DGCA https://www.dgca.gov.in ; CAAC http://www.caac.gov.cn
- VAT, GST and duty on aircraft: HMRC VAT Notice 744C (ships and aircraft) https://www.gov.uk/guidance/vat-on-ships-aircraft-and-associated-services-notice-744c ;
  Australian Border Force tariff (chapter 88, free) https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification ;
  Agencia Tributaria, Impuesto Especial sobre Determinados Medios de Transporte https://sede.agenciatributaria.gob.es ;
  CBIC GST rate schedule (aircraft for personal use 28%) https://www.cbic.gov.in ; China customs tariff chapter 88 and
  the 2024 low-altitude economy policy http://www.caac.gov.cn
- Running costs: AOPA and Aviation Consumer operating-cost surveys; Conklin & de Decker aircraft cost data (jets);
  Robinson, Cirrus and Cessna published direct operating cost sheets.

Not confirmed on a web page (knowledge-based, approx): the registration fee amounts outside the US and UK, the
insurance, hangar and annual percentages, the Russian duty rate by weight class, and the Indian customs surcharge.
