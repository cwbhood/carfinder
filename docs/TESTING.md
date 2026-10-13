# Testing

## Node (no dependencies): `node --test`
- `test/data.test.mjs`
  - every dataset row against its schema: field count, enums, plausible ranges per country, EV/PHEV/combustion
    consistency, duplicates, notes without double quotes;
  - the state tables;
  - the pricing core run for every car in every region (~44,000 combinations): finite, ordered totals within 0.5× and
    2.2× of list (3.2× in China, where a Shanghai plate can double a cheap car), no `NaN`/`undefined`/`null` in any
    breakdown line, a finite fuel cost and payment, a usable efficiency string;
  - known quotes: a RAV4 in Texas, a Creta in Maharashtra, a RAV4 in Ontario, a Sandero in the UK, a RAV4 in NSW, a
    Seagull outside the plate-restricted cities;
  - every non-US efficiency string carries an mpg or miles companion.
- `test/build.test.mjs`: `carfinder.html` matches a fresh build, is a complete document that makes no request to
  Google Fonts, and every local link on the three pages points at a file that exists.

## Browser (Python + Playwright)
```
pip install playwright pillow
playwright install chromium
python3 test/browser/audit.py        # layout: 360/390/430/768/1280 px, light and dark, every tab
python3 test/browser/interact.py     # behaviour: ~60 assertions on a 390 px phone
```
`audit.py` fails on any horizontal overflow (page or element), any rendered `NaN`/`undefined`/`null`, or a console
error, and prints the controls under 44 px as information. `interact.py` drives filters, sort, search, state change,
the detail sheet and trim slider, the compare flow, show-more and auto-load, the wizard, World-tab currency and unit
switches and persistence across a reload, and runs the data pass (every card, efficiency string and detail sheet for
all 2,729 cars) inside the page. Screenshots land in `test/browser/_out/` (ignored by git).

Both run in CI (`.github/workflows/ci.yml`) on every push and pull request.

## What is not tested automatically
Real quotes drift: incentives change monthly, fuel prices weekly, exchange rates daily. The known-quote assertions are
deliberately wide bands. When a rate changes, update the function, the tax note and, if needed, the band in the test.

## Motorcycles, boats and aircraft (`test/verticals.test.mjs`)
Schema checks for every `moto_<cc>.json`, `boat_<cc>.json` and `air_<cc>.json` (21 fields, enums, size matches engine
size, length or seats, turbines burn Jet-A, gliders have no engine,
price limits per country, EV fields), the shape of every fee line in `data/vfees.json`, the table-driven engine run for
every bike, boat and aircraft in every region (finite, ordered totals within 0.7× to 1.9× of list, no NaN text, mpg,
gal/h and nautical-mile companions
on every non-US bike), and known quotes (a Grom in Texas, a Splendor in Delhi, a Classic 350 in Karnataka, a Sea-Doo
Spark in Florida, a PCX125 in the UK, a Hunter 350 in Ontario). The browser checks also switch verticals: the data pass
renders every card, breakdown, compare table and detail sheet of all four verticals, and `interact.py` checks the
bike, boat and aircraft filters, chips, wizard, glossary, the length and range sliders and persistence of the
vertical across a reload.
