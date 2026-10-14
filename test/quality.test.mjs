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

test('docs/DATA-QUALITY.md is the scorecard of the current data', () => {
  const onDisk = fs.readFileSync(path.join(ROOT, 'docs/DATA-QUALITY.md'), 'utf8');
  assert.equal(onDisk, Q.markdown(m, floors), 'run `node src/build.js` to regenerate docs/DATA-QUALITY.md');
});

test('source-link, confirmation and photo coverage stay above their floors (data/quality-floor.json)', () => {
  assert.ok(m.total.rows > 5000, 'the datasets are present');
  assert.ok(share(m.total.confirmed, m.total.rows) >= floors.confirmedShare, `confirmed share ${share(m.total.confirmed, m.total.rows).toFixed(4)} < floor ${floors.confirmedShare}`);
  assert.ok(share(m.total.makerLinked, m.total.rows) >= floors.makerLinkShare, `maker-link share ${share(m.total.makerLinked, m.total.rows).toFixed(4)} < floor ${floors.makerLinkShare}`);
  const us = m.datasets.find(d => d.vt === 'car' && d.cc === 'US');
  assert.ok(share(us.buildPrice, us.rows) >= floors.buildPriceShareUS, `US build-and-price share ${share(us.buildPrice, us.rows).toFixed(3)} < floor ${floors.buildPriceShareUS}`);
  assert.ok(share(m.total.photos, m.total.rows) >= floors.photoShare, `photo share ${share(m.total.photos, m.total.rows).toFixed(4)} < floor ${floors.photoShare}`);
  assert.ok(m.sources.unlinked.length <= floors.unlinkedSourcesMax, `${m.sources.unlinked.length} unlinked sources > ${floors.unlinkedSourcesMax}: ${m.sources.unlinked.map(u => u.set + ': ' + u.name).join('; ')}`);
});

test('every US and Indian state row cites a source, and no brand key is spelled two ways', () => {
  for (const cc of ['US', 'IN']) if (floors.statesCited[cc] === 'all') assert.equal(m.states[cc].cited, m.states[cc].rows, `${cc}: ${m.states[cc].cited} of ${m.states[cc].rows} state rows cited`);
  assert.equal(m.brandKeys.dupes.length, floors.duplicateBrandKeys, 'duplicate brand keys: ' + m.brandKeys.dupes.join('; '));
});

test('every citation and maker link is an absolute http(s) URL', () => {
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
