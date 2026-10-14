// Schema checks for every dataset, then the pricing core run against every car in every region.
// No dependencies: `node --test` runs this.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const CLS = new Set(['Mainstream', 'Luxury', 'Exotic']);
const MKT = new Set(['hot', 'steady', 'deals']);
const G_BODY = new Set(['Hatch', 'Sedan', 'SUV', 'MPV', 'Pickup', 'Van', 'Coupe', 'Conv', 'Wagon', 'Sports']);
const G_SIZE = new Set(['City', 'Small', 'Compact', 'Midsize', 'Large', 'Full-size']);
const G_FUEL = new Set(['Petrol', 'Diesel', 'Hybrid', 'PHEV', 'EV', 'CNG', 'LPG']);
// price limits in local units (sanity, not policy): [min, max]
const LIM = { cn: [20000, 20000000], uk: [8000, 2000000], au: [12000, 3000000], mx: [150000, 60000000], es: [8000, 2500000],
              th: [250000, 120000000], ru: [500000, 200000000], br: [50000, 20000000], ca: [15000, 3000000] };

function between(x, lo, hi) { return typeof x === 'number' && x >= lo && x <= hi; }

test('global datasets (CN UK AU MX ES TH RU BR CA) follow the 20-field schema', () => {
  for (const cc of Object.keys(LIM)) {
    const rows = load(`data/cars_${cc}.json`);
    assert.ok(rows.length > 100, `${cc}: ${rows.length} rows`);
    const keys = new Set();
    rows.forEach((r, i) => {
      const tag = `${cc}#${i} ${r[0]} ${r[1]}`;
      assert.equal(r.length, 20, `${tag}: 20 fields`);
      const [mk, md, body, size, cls, fuels, fuel, mn, mx, co2, l100, rng, kwh, hp, seats, drive, mkt, note, est, isNew] = r;
      assert.ok(mk && md && typeof mk === 'string' && typeof md === 'string', `${tag}: names`);
      assert.ok(G_BODY.has(body), `${tag}: body ${body}`);
      assert.ok(G_SIZE.has(size), `${tag}: size ${size}`);
      assert.ok(CLS.has(cls), `${tag}: class ${cls}`);
      assert.ok(fuels.split('/').every(f => G_FUEL.has(f)) && fuels.split('/').includes(fuel), `${tag}: fuels ${fuels} / ${fuel}`);
      assert.ok(Number.isInteger(mn) && between(mn, ...LIM[cc]), `${tag}: min price ${mn}`);
      assert.ok(Number.isInteger(mx) && mx >= mn && mx <= LIM[cc][1], `${tag}: top price ${mx}`);
      assert.ok(co2 === null || between(co2, 0, 600), `${tag}: co2 ${co2}`);
      if (fuel === 'EV') { assert.equal(l100, null, `${tag}: EV has no L/100`); assert.ok(between(rng, 100, 1300), `${tag}: EV range ${rng}`); assert.ok(kwh === null || between(kwh, 8, 250), `${tag}: kWh ${kwh}`); }
      else if (fuel === 'PHEV') { assert.ok(between(l100, 1, 20), `${tag}: PHEV L/100 ${l100}`); assert.ok(between(rng, 20, 500), `${tag}: PHEV range ${rng}`); }
      else { assert.ok(between(l100, 2.5, 25), `${tag}: L/100 ${l100}`); assert.equal(rng, null, `${tag}: combustion car has no electric range`); }
      assert.ok(between(hp, 20, 1600), `${tag}: hp ${hp}`);
      assert.ok(between(seats, 2, 17), `${tag}: seats ${seats}`);
      assert.ok(typeof drive === 'string' && drive, `${tag}: drive`);
      assert.ok(MKT.has(mkt), `${tag}: market ${mkt}`);
      assert.ok(typeof note === 'string' && note.length <= 150 && !note.includes('"'), `${tag}: note`);
      assert.ok([0, 1].includes(est) && [0, 1].includes(isNew), `${tag}: flags`);
      const k = mk + '|' + md; assert.ok(!keys.has(k), `${cc}: duplicate ${k}`); keys.add(k);
    });
  }
});

test('US dataset follows the 21-field EPA schema', () => {
  const rows = load('data/cars_us.json');
  assert.ok(rows.length > 300);
  const BODY = new Set(['Sedan', 'Hatch', 'SUV', 'Truck', 'Minivan', 'Van', 'Coupe', 'Conv', 'Wagon', 'Sports']);
  const SIZE = new Set(['Subcompact', 'Compact', 'Midsize', 'Full-size', 'Heavy-duty']);
  const FUEL = new Set(['Gas', 'Diesel', 'Hybrid', 'PHEV', 'EV', 'Hydrogen']);
  const keys = new Set();
  rows.forEach((r, i) => {
    const tag = `US#${i} ${r[0]} ${r[1]}`;
    assert.equal(r.length, 21, `${tag}: 21 fields`);
    const [mk, md, year, body, size, cls, fuel, price, top, dest, city, hwy, mpg, rngMi, mpge, hp, seats, drive, mkt, note, est] = r;
    assert.ok(mk && md, `${tag}: names`);
    assert.ok([2025, 2026, 2027].includes(year), `${tag}: year ${year}`);
    assert.ok(BODY.has(body) && SIZE.has(size) && CLS.has(cls) && FUEL.has(fuel), `${tag}: enums ${body} ${size} ${cls} ${fuel}`);
    assert.ok(between(price, 10000, 5000000) && top >= price, `${tag}: price ${price}-${top}`);
    assert.ok(between(dest, 0, 6000), `${tag}: destination ${dest}`);
    if (fuel === 'EV' || fuel === 'Hydrogen') { assert.equal(mpg, null, `${tag}: EV has no mpg`); assert.ok(between(rngMi, 100, 700), `${tag}: range ${rngMi}`); assert.ok(between(mpge, 30, 160), `${tag}: MPGe ${mpge}`); }
    else if (fuel === 'PHEV') { assert.ok(between(mpg, 10, 70), `${tag}: mpg ${mpg}`); assert.ok(between(rngMi, 5, 200), `${tag}: electric miles ${rngMi} (range-extenders like the Ramcharger reach 145)`); }
    else { assert.ok(mpg === null || between(mpg, 8, 70), `${tag}: mpg ${mpg}`); assert.equal(rngMi, null, `${tag}: no electric range`); if (mpg !== null) assert.ok(between(city, 8, 70) && between(hwy, 8, 70), `${tag}: city/hwy`); }
    assert.ok(between(hp, 50, 2500) && between(seats, 2, 15), `${tag}: hp/seats`);
    assert.ok(MKT.has(mkt) && typeof note === 'string' && [0, 1].includes(est), `${tag}: market/note/flag`);
    const k = `${mk}|${md}|${year}`; assert.ok(!keys.has(k), `US: duplicate ${k}`); keys.add(k);
  });
});

test('India dataset follows the 20-field ex-showroom schema (prices in lakh)', () => {
  const rows = load('data/cars_in.json');
  assert.ok(rows.length > 150);
  const BODY = new Set(['Hatch', 'Sedan', 'SUV', 'MPV', 'Van', 'Pickup', 'Sports', 'Coupe', 'Conv', 'Wagon']);
  const SIZE = new Set(['Entry', 'Compact', 'Sub-4m', 'Midsize', 'Large', 'Full-size']);
  const keys = new Set();
  rows.forEach((r, i) => {
    const tag = `IN#${i} ${r[0]} ${r[1]}`;
    assert.equal(r.length, 20, `${tag}: 20 fields`);
    const [mk, md, body, size, cls, fuels, fuel, price, top, gst, kmpl, rng, kwh, hp, seats, drive, mkt, note, est, isNew] = r;
    assert.ok(mk && md && BODY.has(body) && SIZE.has(size) && CLS.has(cls), `${tag}: enums`);
    assert.ok(fuels.split('/').every(f => G_FUEL.has(f)) && fuels.split('/').includes(fuel), `${tag}: fuels`);
    assert.ok(between(price, 2, 2000) && top >= price, `${tag}: price ${price}-${top} lakh`);
    assert.ok([5, 18, 40].includes(gst), `${tag}: GST ${gst}`);
    if (fuel === 'EV') { assert.equal(kmpl, null); assert.ok(between(rng, 100, 1000), `${tag}: range ${rng}`); assert.ok(between(kwh, 3, 150), `${tag}: kWh ${kwh}`); }
    else if (fuel === 'PHEV') { assert.ok(between(kmpl, 5, 60) && between(rng, 10, 300), `${tag}: PHEV`); }
    else { assert.ok(between(kmpl, 4, 40), `${tag}: kmpl ${kmpl}`); assert.equal(rng, null, `${tag}: no electric range`); }
    assert.ok(between(hp, 30, 1500) && between(seats, 2, 17), `${tag}: hp/seats`);
    assert.ok(MKT.has(mkt) && typeof note === 'string' && [0, 1].includes(est) && [0, 1].includes(isNew), `${tag}: market/note/flags`);
    const k = mk + '|' + md; assert.ok(!keys.has(k), `IN: duplicate ${k}`); keys.add(k);
  });
});

test('state tables: every US state has a rate and doc fee; every Indian state has road-tax slabs', () => {
  const us = load('data/states_us.json');
  assert.ok(Object.keys(us).length >= 51, 'US: 50 states + DC + average');
  for (const [code, s] of Object.entries(us)) { assert.ok(typeof s[0] === 'string' && between(s[1], 0, 12) && between(s[2], 0, 1500), `US ${code}`); }
  const inn = load('data/states_in.json');
  assert.ok(Object.keys(inn).length >= 20);
  for (const [code, s] of Object.entries(inn)) { assert.ok(typeof s.name === 'string' && Array.isArray(s.p) && s.p.length, `IN ${code}`); }
});

// ---- the pricing core, run for real: every car × every region must give a finite, ordered total and no NaN text
function core() {
  const script = fs.readFileSync(path.join(ROOT, 'src/script.html'), 'utf8');
  const js = script.match(/<script>([\s\S]*)<\/script>/)[1];
  const coreSrc = js.match(/\/\/<<core([\s\S]*)\/\/core>>/)[1];
  const RAW = { US: load('data/cars_us.json'), IN: load('data/cars_in.json') };
  for (const cc of ['CN', 'UK', 'AU', 'MX', 'ES', 'TH', 'RU', 'BR', 'CA']) RAW[cc] = load(`data/cars_${cc.toLowerCase()}.json`);
  const STATES_US = load('data/states_us.json'), STATES_IN = load('data/states_in.json'), SOURCES = load('data/sources.json');
  const X = new Function('RAW', 'STATES_US', 'STATES_IN', 'SOURCES', coreSrc + '\nreturn {normalize, MONEY, breakdown, fuelCost, effShort, monthlyPay, REGIONS, EFF_UNIT, FX};')(RAW, STATES_US, STATES_IN, SOURCES);
  const DATA = {}; for (const cc of Object.keys(RAW)) DATA[cc] = X.normalize(RAW[cc], cc);
  return { X, DATA, STATES_US, STATES_IN };
}
const ASSUME = { RU: { petrol: 69.98, diesel: 81.25, elec: 8, miles: 17000, apr: 23.6, term: 60, down: 20 }, BR: { petrol: 6.59, diesel: 7.05, elec: 1.0, miles: 13000, apr: 26, term: 60, down: 25 },
  CA: { petrol: 1.89, diesel: 2.64, elec: 0.12, miles: 15000, apr: 6.99, term: 72, down: 10 }, US: { gas: 4.45, elec: 0.17, miles: 12000, apr: 7, term: 72, down: 10 },
  IN: { petrol: 100, diesel: 90, cng: 78, elec: 8, miles: 10000, apr: 9, term: 60, down: 15 }, CN: { petrol: 8.6, diesel: 8.3, elec: 0.55, miles: 13000, apr: 3.5, term: 36, down: 30 },
  UK: { petrol: 1.741, diesel: 1.992, elec: 0.2632, miles: 7400, apr: 7.9, term: 48, down: 10 }, AU: { petrol: 2.35, diesel: 2.8, elec: 0.32, miles: 12500, apr: 7.7, term: 60, down: 10 },
  MX: { petrol: 23.69, diesel: 27.01, elec: 2.5, miles: 15000, apr: 14, term: 60, down: 20 }, ES: { petrol: 1.93, diesel: 1.93, elec: 0.15, miles: 12500, apr: 8, term: 60, down: 15 },
  TH: { petrol: 34.94, diesel: 41.44, elec: 4.2, miles: 15000, apr: 5.5, term: 60, down: 15 } };

test('pricing core: every car in every region gets a finite on-road range, fuel cost and payment, with no NaN text', () => {
  const { X, DATA, STATES_US, STATES_IN } = core();
  let rows = 0;
  for (const cc of Object.keys(DATA)) {
    const regions = cc === 'US' ? Object.keys(STATES_US) : cc === 'IN' ? Object.keys(STATES_IN) : Object.keys(X.REGIONS[cc]);
    for (const r of regions) for (const c of DATA[cc]) {
      rows++;
      const o = X.breakdown(cc, c, c.price, r, X.MONEY[cc]);
      assert.ok(o.lo > 0 && o.hi >= o.lo * 0.999 && Number.isFinite(o.hi), `${cc} ${r} ${c.make} ${c.model}: total ${o.lo}-${o.hi}`);
      const maxRatio = cc === 'CN' ? 3.2 : 2.2;   // a Shanghai plate auction (~¥94,000) can double the price of a cheap petrol or plug-in car
      assert.ok(o.lo >= c.price * 0.5 && o.hi <= c.price * maxRatio, `${cc} ${r} ${c.make} ${c.model}: on-road ${o.lo}-${o.hi} vs list ${c.price} is not plausible`);
      for (const l of o.lines) assert.ok(!/NaN|undefined|null/.test(l.v + l.k + (l.sub || '')), `${cc} ${r} ${c.make} ${c.model}: line "${l.k}: ${l.v}"`);
      const f = X.fuelCost(c, ASSUME[cc], cc);
      assert.ok(f == null || (f >= 0 && Number.isFinite(f)), `${cc} ${c.make} ${c.model}: fuel ${f}`);
      const p = X.monthlyPay((o.lo + o.hi) / 2, ASSUME[cc]);
      assert.ok(p > 0 && Number.isFinite(p), `${cc} ${c.make} ${c.model}: payment ${p}`);
    }
    for (const c of DATA[cc]) {
      const e = X.effShort(c, cc);
      assert.ok(typeof e === 'string' && e && !/NaN|undefined|null/.test(e), `${cc} ${c.make} ${c.model}: efficiency "${e}"`);
    }
  }
  assert.ok(rows > 40000, `${rows} car-region combinations checked`);
});

test('pricing core: known quotes land where real-world quotes do', () => {
  const { X, DATA } = core();
  const q = (cc, mk, md, region) => { const c = DATA[cc].find(x => x.make === mk && x.model === md); assert.ok(c, `${cc} ${mk} ${md} exists`); return X.breakdown(cc, c, c.price, region, X.MONEY[cc]); };
  let o = q('US', 'Toyota', 'RAV4', 'TX');  assert.ok(o.lo > 34000 && o.hi < 40000, `RAV4 Texas drive-off ${o.lo}-${o.hi}`);
  o = q('IN', 'Hyundai', 'Creta', 'MH');     assert.ok(o.lo > 1200000 && o.hi < 1350000, `Creta Maharashtra on-road ${o.lo}-${o.hi}`);
  o = q('CA', 'Toyota', 'RAV4', 'ON');       assert.ok(o.lo > 43000 && o.hi < 47000, `RAV4 Ontario all-in ${o.lo}-${o.hi}`);
  o = q('UK', 'Dacia', 'Sandero', 'GB');     assert.ok(o.lo > 13000 && o.hi < 15500, `Sandero UK ${o.lo}-${o.hi}`);
  o = q('AU', 'Toyota', 'RAV4', 'NSW');      assert.ok(o.lo > 45000 && o.hi < 56000, `RAV4 NSW drive-away ${o.lo}-${o.hi}`);
  o = q('CN', 'BYD', 'Seagull', 'XX');       assert.ok(o.lo > 55000 && o.hi < 80000, `Seagull 落地价 ${o.lo}-${o.hi}`);
});

test('mpg and miles companions: every non-US efficiency string carries a US-unit equivalent', () => {
  const { X, DATA } = core();
  for (const cc of Object.keys(DATA)) {
    if (cc === 'US') continue;
    for (const c of DATA[cc]) {
      const e = X.effShort(c, cc);
      if (e === 'Not rated') continue;
      assert.ok(/ mpg| mi\b/.test(e), `${cc} ${c.make} ${c.model}: "${e}" has no mpg or miles companion`);
    }
  }
  const uk = DATA.UK.find(c => c.fuel === 'Petrol' && c.l100);
  assert.match(X.effShort(uk, 'UK'), /mpg UK \/ \d+ mpg US/);
});
