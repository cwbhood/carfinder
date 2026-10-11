// Motorcycle and boat datasets: schema checks for every country, the fee-rule file, and the table-driven pricing
// engine run for every bike and boat in every region. No dependencies: `node --test` runs this.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const CCS = ['US', 'IN', 'CN', 'UK', 'AU', 'MX', 'ES', 'TH', 'RU', 'BR', 'CA'];
const CLS = new Set(['Mainstream', 'Luxury', 'Exotic']);
const MKT = new Set(['hot', 'steady', 'deals']);
const M_BODY = new Set(['Scooter', 'Commuter', 'Naked', 'Sport', 'Cruiser', 'Adventure', 'Touring', 'Dual-sport', 'Retro', 'Mini', 'Trike']);
const M_SIZE = new Set(['Under 125cc', '125-300cc', '300-650cc', '650-1000cc', 'Over 1000cc']);
const M_FUEL = new Set(['Petrol', 'CNG', 'Hybrid', 'EV']);
const B_BODY = new Set(['PWC', 'Pontoon', 'Bowrider', 'Deck boat', 'Center console', 'Fishing', 'Bass boat', 'Jon boat', 'Cabin', 'Wake', 'RIB', 'Sail', 'Dinghy']);
const B_SIZE = new Set(['Under 16 ft', '16-20 ft', '20-26 ft', '26-35 ft', 'Over 35 ft']);
const B_FUEL = new Set(['Petrol', 'Diesel', 'EV', 'Sail']);
// cheapest plausible scooter and dearest flagship, in local units (sanity, not policy)
const M_LIM = { US: [1500, 60000], IN: [40000, 6000000], CN: [2500, 600000], UK: [1500, 60000], AU: [2500, 90000], MX: [12000, 900000], ES: [1500, 60000], TH: [30000, 2500000], RU: [100000, 12000000], BR: [6000, 300000], CA: [2000, 80000] };
const B_LIM = { US: [2500, 2000000], IN: [500000, 600000000], CN: [10000, 40000000], UK: [3000, 1500000], AU: [4000, 3000000], MX: [100000, 40000000], ES: [3000, 1500000], TH: [200000, 60000000], RU: [30000, 30000000], BR: [10000, 8000000], CA: [3000, 2000000] };
const between = (x, lo, hi) => typeof x === 'number' && x >= lo && x <= hi;

test('motorcycle datasets follow the 21-field schema in all eleven countries', () => {
  let total = 0;
  for (const cc of CCS) {
    const rows = load(`data/moto_${cc.toLowerCase()}.json`); total += rows.length;
    assert.ok(rows.length >= 50, `${cc}: ${rows.length} bikes`);
    const keys = new Set();
    rows.forEach((r, i) => {
      const tag = `moto ${cc}#${i} ${r[0]} ${r[1]}`;
      assert.equal(r.length, 21, `${tag}: 21 fields`);
      const [mk, md, body, size, cls, fuels, fuel, mn, mx, ccm, l100, rng, kwh, hp, seats, trans, mkt, note, est, isNew, dest] = r;
      assert.ok(mk && md && typeof mk === 'string' && typeof md === 'string', `${tag}: names`);
      assert.ok(M_BODY.has(body) && M_SIZE.has(size) && CLS.has(cls), `${tag}: enums ${body} / ${size} / ${cls}`);
      assert.ok(fuels.split('/').every(f => M_FUEL.has(f)) && fuels.split('/').includes(fuel), `${tag}: fuels ${fuels} / ${fuel}`);
      assert.ok(Number.isInteger(mn) && between(mn, ...M_LIM[cc]) && Number.isInteger(mx) && mx >= mn && mx <= M_LIM[cc][1], `${tag}: price ${mn}-${mx}`);
      if (fuel === 'EV') { assert.equal(ccm, null, `${tag}: EV has no cc`); assert.equal(l100, null, `${tag}: EV has no L/100`); assert.ok(between(rng, 30, 600), `${tag}: range ${rng}`); assert.ok(between(kwh, 1, 30), `${tag}: kWh ${kwh}`); }
      else { assert.ok(between(ccm, 49, 2600), `${tag}: cc ${ccm}`); assert.ok(between(l100, 1.2, 10), `${tag}: L/100 ${l100}`); assert.ok(rng === null || between(rng, 30, 600), `${tag}: range`); }
      if (ccm) assert.equal(size, ccm < 125 ? 'Under 125cc' : ccm <= 300 ? '125-300cc' : ccm <= 650 ? '300-650cc' : ccm <= 1000 ? '650-1000cc' : 'Over 1000cc', `${tag}: size matches cc`);
      assert.ok(between(hp, 2, 260) && between(seats, 1, 3), `${tag}: hp/seats ${hp}/${seats}`);
      assert.ok(typeof trans === 'string' && trans && MKT.has(mkt), `${tag}: transmission/market`);
      assert.ok(typeof note === 'string' && note.length <= 160 && !note.includes('"'), `${tag}: note`);
      assert.ok([0, 1].includes(est) && [0, 1].includes(isNew) && between(dest, 0, 5000), `${tag}: flags/freight`);
      const k = mk + '|' + md; assert.ok(!keys.has(k), `${cc}: duplicate ${k}`); keys.add(k);
    });
  }
  assert.ok(total > 1200, `${total} motorcycles in all`);
});

test('boat datasets follow the 21-field schema in all eleven countries', () => {
  let total = 0;
  for (const cc of CCS) {
    const rows = load(`data/boat_${cc.toLowerCase()}.json`); total += rows.length;
    assert.ok(rows.length >= 20, `${cc}: ${rows.length} boats`);
    const keys = new Set();
    rows.forEach((r, i) => {
      const tag = `boat ${cc}#${i} ${r[0]} ${r[1]}`;
      assert.equal(r.length, 21, `${tag}: 21 fields`);
      const [mk, md, body, size, cls, fuels, fuel, mn, mx, len, gph, rng, kwh, hp, seats, drive, mkt, note, est, isNew, dest] = r;
      assert.ok(mk && md, `${tag}: names`);
      assert.ok(B_BODY.has(body) && B_SIZE.has(size) && CLS.has(cls), `${tag}: enums ${body} / ${size} / ${cls}`);
      assert.ok(fuels.split('/').every(f => B_FUEL.has(f)) && fuels.split('/').includes(fuel), `${tag}: fuels ${fuels} / ${fuel}`);
      assert.ok(Number.isInteger(mn) && between(mn, ...B_LIM[cc]) && Number.isInteger(mx) && mx >= mn && mx <= B_LIM[cc][1], `${tag}: price ${mn}-${mx}`);
      assert.ok(between(len, 7, 90), `${tag}: length ${len}`);
      assert.equal(size, len < 16 ? 'Under 16 ft' : len <= 20 ? '16-20 ft' : len <= 26 ? '20-26 ft' : len <= 35 ? '26-35 ft' : 'Over 35 ft', `${tag}: size matches length`);
      if (fuel === 'Sail' || fuel === 'EV') assert.equal(gph, null, `${tag}: no fuel burn for sail/electric`);
      else assert.ok(between(gph, 0.3, 120), `${tag}: gal/h ${gph}`);
      if (fuel === 'EV') assert.ok(between(kwh, 5, 400) && between(rng, 20, 300), `${tag}: battery/range`);
      assert.ok(between(hp, 0, 2000) && (fuel === 'Sail' || hp > 0), `${tag}: hp ${hp}`);
      assert.ok(between(seats, 1, 30) && typeof drive === 'string' && drive && MKT.has(mkt), `${tag}: seats/drive/market`);
      assert.ok(typeof note === 'string' && note.length <= 160 && !note.includes('"'), `${tag}: note`);
      assert.ok([0, 1].includes(est) && [0, 1].includes(isNew) && between(dest, 0, 20000), `${tag}: flags/freight`);
      const k = mk + '|' + md; assert.ok(!keys.has(k), `${cc}: duplicate ${k}`); keys.add(k);
    });
  }
  assert.ok(total > 450, `${total} boats in all`);
});

test('fee rules: every country has motorcycle and boat rules, and every fee line is well formed', () => {
  const V = load('data/vfees.json');
  const KIND = ['fixed', 'pct', 'rates', 'brackets', 'hook', 'text'];
  for (const cc of CCS) for (const vt of ['moto', 'boat']) {
    const F = V[cc] && V[cc][vt]; assert.ok(F, `${cc} ${vt} rules exist`);
    for (const m of ['hot', 'steady', 'deals']) assert.ok(Array.isArray(F.bands[m]) && F.bands[m][0] <= F.bands[m][1] && F.bands[m][0] > 0.6 && F.bands[m][1] < 1.1, `${cc} ${vt} band ${m}`);
    assert.ok(F.basis && F.basis.k && F.basis.sub, `${cc} ${vt} basis`);
    assert.ok(Array.isArray(F.fees) && F.fees.length >= 2, `${cc} ${vt} has fee lines`);
    for (const f of F.fees) {
      assert.ok(f.k && f.sub, `${cc} ${vt} "${f.k}" has a label and explanation`);
      assert.equal(KIND.filter(k => f[k] !== undefined && !(k === 'rates' && f.hook)).length, 1, `${cc} ${vt} "${f.k}" has exactly one amount kind (hooks may carry rates as parameters)`);
      if (f.brackets) { assert.ok(['ccm', 'hp', 'len', 'price'].includes(f.on), `${cc} ${vt} "${f.k}" brackets need on`); assert.ok(f.brackets.every(b => b.length === 2), `${cc} ${vt} "${f.k}" bracket pairs`); }
      if (f.mode) assert.ok(['pct', 'fixed', 'perhp'].includes(f.mode), `${cc} ${vt} "${f.k}" mode`);
    }
    for (const [t, d] of F.glossary || []) assert.ok(t && d, `${cc} ${vt} glossary entry`);
  }
});

function core() {
  const script = fs.readFileSync(path.join(ROOT, 'src/script.html'), 'utf8');
  const js = script.match(/<script>([\s\S]*)<\/script>/)[1];
  const coreSrc = js.match(/\/\/<<core([\s\S]*)\/\/core>>/)[1];
  const RAW = { moto: {}, boat: {} };
  for (const cc of CCS) { RAW.moto[cc] = load(`data/moto_${cc.toLowerCase()}.json`); RAW.boat[cc] = load(`data/boat_${cc.toLowerCase()}.json`); }
  const STATES_US = load('data/states_us.json'), STATES_IN = load('data/states_in.json'), VFEES = load('data/vfees.json');
  const X = new Function('STATES_US', 'STATES_IN', 'VFEES', coreSrc + '\nreturn {normalize, MONEY, breakdown, fuelCost, effShort, monthlyPay, REGIONS};')(STATES_US, STATES_IN, VFEES);
  const DATA = { moto: {}, boat: {} };
  for (const vt of ['moto', 'boat']) for (const cc of CCS) DATA[vt][cc] = X.normalize(RAW[vt][cc], cc, vt);
  return { X, DATA, STATES_US, STATES_IN };
}
const ASSUME = { US: { gas: 4.45, elec: 0.17, miles: 5000, hours: 75, apr: 8, term: 48, down: 10 }, IN: { petrol: 100, diesel: 90, elec: 8, miles: 4000, hours: 75, apr: 10, term: 48, down: 10 },
  CN: { petrol: 8.6, diesel: 8.3, elec: 0.55, miles: 5000, hours: 75, apr: 4.5, term: 48, down: 10 }, UK: { petrol: 1.741, diesel: 1.992, elec: 0.2632, miles: 3000, hours: 75, apr: 8.9, term: 48, down: 10 },
  AU: { petrol: 2.35, diesel: 2.8, elec: 0.32, miles: 5000, hours: 75, apr: 8.7, term: 48, down: 10 }, MX: { petrol: 23.69, diesel: 27.01, elec: 2.5, miles: 6000, hours: 75, apr: 15, term: 48, down: 10 },
  ES: { petrol: 1.93, diesel: 1.93, elec: 0.15, miles: 5000, hours: 75, apr: 9, term: 48, down: 10 }, TH: { petrol: 34.94, diesel: 41.44, elec: 4.2, miles: 6000, hours: 75, apr: 6.5, term: 48, down: 10 },
  RU: { petrol: 69.98, diesel: 81.25, elec: 8, miles: 7000, hours: 75, apr: 24.6, term: 48, down: 10 }, BR: { petrol: 6.59, diesel: 7.05, elec: 1.0, miles: 5000, hours: 75, apr: 27, term: 48, down: 10 },
  CA: { petrol: 1.89, diesel: 2.64, elec: 0.12, miles: 6000, hours: 75, apr: 8, term: 48, down: 10 } };

test('pricing engine: every bike and boat in every region gets a finite, plausible on-road range with no NaN text', () => {
  const { X, DATA, STATES_US, STATES_IN } = core();
  let rows = 0;
  for (const vt of ['moto', 'boat']) for (const cc of CCS) {
    const regions = cc === 'US' ? Object.keys(STATES_US) : cc === 'IN' ? Object.keys(STATES_IN) : Object.keys(X.REGIONS[cc]);
    for (const r of regions) for (const c of DATA[vt][cc]) {
      rows++;
      const o = X.breakdown(cc, c, c.price, r, X.MONEY[cc]);
      assert.ok(o.lo > 0 && o.hi >= o.lo * 0.999 && Number.isFinite(o.hi), `${vt} ${cc} ${r} ${c.make} ${c.model}: total ${o.lo}-${o.hi}`);
      assert.ok(o.lo >= c.price * 0.7 && o.hi <= c.price * 1.9, `${vt} ${cc} ${r} ${c.make} ${c.model}: on-road ${o.lo}-${o.hi} vs list ${c.price} is not plausible`);
      assert.ok(o.lines.length >= 3 && o.lines.some(l => l.k === 'Typical dealer price'), `${vt} ${cc} ${c.make} ${c.model}: breakdown lines`);
      for (const l of o.lines) assert.ok(!/NaN|undefined|null/.test(l.v + l.k + (l.sub || '')), `${vt} ${cc} ${r} ${c.make} ${c.model}: line "${l.k}: ${l.v}"`);
    }
    for (const c of DATA[vt][cc]) {
      const e = X.effShort(c, cc);
      assert.ok(typeof e === 'string' && e && !/NaN|undefined|null/.test(e), `${vt} ${cc} ${c.make} ${c.model}: efficiency "${e}"`);
      if (cc !== 'US' && vt === 'moto' && c.fuel !== 'EV') assert.ok(/ mpg/.test(e), `${vt} ${cc} ${c.make} ${c.model}: "${e}" carries no mpg companion`);
      const f = X.fuelCost(c, ASSUME[cc], cc);
      assert.ok(f == null || (f >= 0 && Number.isFinite(f)), `${vt} ${cc} ${c.make} ${c.model}: fuel ${f}`);
      if (vt === 'boat' && c.fuel === 'Petrol' && c.gph) assert.ok(f > 0, `${vt} ${cc} ${c.make} ${c.model}: a petrol boat has a fuel bill`);
      if (c.fuel === 'Sail') assert.equal(f, null, `${vt} ${cc} ${c.make} ${c.model}: sail has no fuel bill`);
      const p = X.monthlyPay(c.price, ASSUME[cc]); assert.ok(p > 0 && Number.isFinite(p), `${vt} ${cc} ${c.make} ${c.model}: payment`);
    }
  }
  assert.ok(rows > 30000, `${rows} vehicle-region combinations checked`);
});

test('pricing engine: known bike and boat quotes land where dealers do', () => {
  const { X, DATA } = core();
  const q = (vt, cc, mk, md, region) => { const c = DATA[vt][cc].find(x => x.make === mk && x.model === md); assert.ok(c, `${vt} ${cc} ${mk} ${md} exists`); return X.breakdown(cc, c, c.price, region, X.MONEY[cc]); };
  let o = q('moto', 'US', 'Honda', 'Grom', 'TX');            assert.ok(o.lo > 4100 && o.hi < 4900, `Grom Texas out-the-door ${o.lo}-${o.hi}`);
  o = q('moto', 'IN', 'Hero', 'Splendor+', 'DL');            assert.ok(o.lo > 80000 && o.hi < 92000, `Splendor Delhi on-road ${o.lo}-${o.hi}`);
  o = q('moto', 'IN', 'Royal Enfield', 'Classic 350', 'KA'); assert.ok(o.lo > 210000 && o.hi < 275000, `Classic 350 Karnataka on-road ${o.lo}-${o.hi}`);
  o = q('boat', 'US', 'Sea-Doo', 'Spark', 'FL');            assert.ok(o.lo > 8000 && o.hi < 11000, `Spark Florida ${o.lo}-${o.hi}`);
  o = q('moto', 'UK', 'Honda', 'PCX125', 'GB');              assert.ok(o.lo > 3600 && o.hi <= 3800, `PCX125 UK OTR ${o.lo}-${o.hi}`);
  o = q('moto', 'CA', 'Royal Enfield', 'Hunter 350', 'ON');  assert.ok(o.lo > 6500 && o.hi < 7800, `Hunter 350 Ontario all-in ${o.lo}-${o.hi}`);
});
