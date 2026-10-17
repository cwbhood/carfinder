// The data-quality scorecard (docs/DATA-QUALITY.md) is measured, and CI goes red when a measure regresses below its floor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const Q = require(path.join(ROOT, 'src/quality.js'));
const floors = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/quality-floor.json'), 'utf8'));
const m = Q.measure();
const share = (a, b) => b ? a / b : 0;
const VERSION = fs.readFileSync(path.join(ROOT, 'src/build.js'), 'utf8').match(/const VERSION = '([^']+)'/)[1];

test('docs/DATA-QUALITY.md and docs/data-quality-history.csv are the scorecard of the current data', () => {
  const onDisk = fs.readFileSync(path.join(ROOT, 'docs/DATA-QUALITY.md'), 'utf8');
  assert.equal(onDisk, Q.markdown(m, floors), 'run `node src/build.js` to regenerate docs/DATA-QUALITY.md');
  const hist = fs.readFileSync(path.join(ROOT, 'docs/data-quality-history.csv'), 'utf8');
  assert.equal(hist, Q.historyCsv(hist, m, VERSION), 'run `node src/build.js` to update docs/data-quality-history.csv');
  const versions = hist.trim().split('\n').slice(1).map(l => l.split(',')[0]);
  assert.ok(versions.includes(VERSION), `history has a row for v${VERSION}`);
  assert.equal(new Set(versions).size, versions.length, 'one history row per version');
});

test('every vertical stays above its floors (data/quality-floor.json): rows from a published list, photos', () => {
  assert.ok(m.total.rows > 5000, 'the datasets are present');
  for (const vt of Q.VTS){
    const v = m.byVt[vt]; if (!v.rows) continue;
    assert.ok(share(Q.fromList(v), v.rows) >= floors.fromListShare[vt], `${vt}: from-a-published-list share ${share(Q.fromList(v), v.rows).toFixed(4)} < floor ${floors.fromListShare[vt]}`);
    assert.ok(share(v.photos, v.rows) >= floors.photoShare[vt], `${vt}: photo share ${share(v.photos, v.rows).toFixed(4)} < floor ${floors.photoShare[vt]}`);
  }
});

test('maker links, build-and-price links and linked sources stay above their floors', () => {
  assert.ok(share(m.total.makerLinked, m.total.rows) >= floors.makerLinkShare, `maker-link share ${share(m.total.makerLinked, m.total.rows).toFixed(4)} < floor ${floors.makerLinkShare}`);
  const unlinkedMakers = Object.keys(m.brandKeys.uncovered).length;
  assert.ok(unlinkedMakers <= floors.unlinkedMakersMax, `${unlinkedMakers} makers without a linked page > ${floors.unlinkedMakersMax}`);
  const us = m.datasets.find(d => d.vt === 'car' && d.cc === 'US');
  assert.ok(share(us.buildPrice, us.rows) >= floors.buildPriceShareUS, `US build-and-price share ${share(us.buildPrice, us.rows).toFixed(3)} < floor ${floors.buildPriceShareUS}`);
  assert.ok(share(m.byVt.car.buildPrice, m.byVt.car.rows) >= floors.buildPriceShareCar, `car build-and-price share ${share(m.byVt.car.buildPrice, m.byVt.car.rows).toFixed(3)} < floor ${floors.buildPriceShareCar}`);
  assert.ok(m.sources.unlinked.length <= floors.unlinkedSourcesMax, `${m.sources.unlinked.length} unlinked sources > ${floors.unlinkedSourcesMax}: ${m.sources.unlinked.map(u => u.set + ': ' + u.name).join('; ')}`);
});

test('every US and Indian state row cites a source, and no brand key is spelled two ways', () => {
  for (const cc of ['US', 'IN']) if (floors.statesCited[cc] === 'all') assert.equal(m.states[cc].cited, m.states[cc].rows, `${cc}: ${m.states[cc].cited} of ${m.states[cc].rows} state rows cited`);
  assert.equal(m.brandKeys.dupes.length, floors.duplicateBrandKeys, 'duplicate brand keys: ' + m.brandKeys.dupes.join('; '));
});

test('the scorecard and the app agree on every row’s state (checked, listed, converted, estimated)', () => {
  const script = fs.readFileSync(path.join(ROOT, 'src/script.html'), 'utf8');
  const js = script.match(/<script>([\s\S]*)<\/script>/)[1];
  const coreSrc = js.match(/\/\/<<core([\s\S]*)\/\/core>>/)[1];
  const load = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const X = new Function('STATES_US', 'STATES_IN', 'VFEES', 'SOURCES', 'US_TAX', 'US_LOCAL', coreSrc + '\nreturn {normalize, rowStatus, STATUS};')(load('data/states_us.json'), load('data/states_in.json'), load('data/vfees.json'), load('data/sources.json'), load('data/us_tax.json'), load('data/us_local.json'));
  assert.deepEqual(Object.keys(X.STATUS), Q.STATES);
  let checked = 0;
  for (const vt of Q.VTS) for (const cc of Q.CCS){
    const f = `data/${{car:'cars', moto:'moto', boat:'boat', air:'air'}[vt]}_${cc.toLowerCase()}.json`;
    if (!fs.existsSync(path.join(ROOT, f))) continue;
    const rows = X.normalize(load(f), cc, vt);
    const d = m.datasets.find(d => d.vt === vt && d.cc === cc);
    const counts = {checked:0, listed:0, converted:0, estimated:0};
    for (const c of rows){ counts[X.rowStatus(c, cc)]++; checked++; }
    for (const k of Q.STATES) assert.equal(counts[k], d[k], `${vt}/${cc} ${k}`);
  }
  assert.ok(checked > 5000);
});

test('every citation and maker link is an absolute http(s) URL, and every rate date has a table', () => {
  const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sources.json'), 'utf8'));
  const ok = u => /^https?:\/\/[^\s"]+$/.test(u);
  for (const [k, v] of Object.entries(S.brands)) assert.ok(ok(v), `brands.${k}`);
  for (const [k, v] of Object.entries(S.brandsByCC)) for (const [cc, u] of Object.entries(v)) assert.ok(ok(u), `brandsByCC.${k}.${cc}`);
  for (const [k, v] of Object.entries(S.buildPrice || {})) for (const [b, u] of Object.entries(v)) assert.ok(ok(u), `buildPrice.${k}.${b}`);
  for (const [k, v] of Object.entries(S.sets)) for (const [name, u] of v.sources) if (u !== null) assert.ok(ok(u), `${k}: ${name}`);
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states_us.json'), 'utf8')))) { assert.ok(ok(v[4]), `states_us.${k}`); assert.ok(v[5] && v[5].length > 3, `states_us.${k} label`); }
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states_in.json'), 'utf8')))) { assert.ok(ok(v.src), `states_in.${k}`); assert.ok(v.srcName && v.srcName.length > 3, `states_in.${k} label`); }
  for (const [date, e] of Object.entries(S.fx.perEur)) { assert.match(date, /^\d{4}-\d{2}-\d{2}$/); for (const c of ['USD','GBP','INR','CNY','AUD','MXN','THB','BRL','CAD']) assert.ok(e[c] > 0, `fx ${date} ${c}`); assert.ok(S.fx.rubPerUsd[date] > 0, `rub ${date}`); }
  assert.ok(S.fx.perEur[S.fx.date], 'the World tab rate date has a rate table');
  for (const d of Object.values(S.fx.convertedAt)) assert.ok(S.fx.perEur[d], `convertedAt ${d} has a rate table`);
  for (const d of Object.values(S.fx.compiledAt)) assert.ok(S.fx.perEur[d], `compiledAt ${d} has a rate table`);
});
