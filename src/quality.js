/* Data-quality scorecard: measured from the data files, never asserted.
   measure() returns the numbers; markdown() renders docs/DATA-QUALITY.md; test/quality.test.mjs holds them above the
   floors in data/quality-floor.json so CI goes red when coverage regresses. Everything here is deterministic (no
   "today"), so the generated file only changes when the data does and `node src/build.js --check` can compare it. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CCS = ['US','IN','CN','UK','AU','MX','ES','TH','RU','BR','CA'];
const VTS = ['car','moto','boat','air'];
const VT_NAME = {car:'Cars & trucks', moto:'Motorcycles', boat:'Boats', air:'Aircraft'};
const CC_NAME = {US:'USA', IN:'India', CN:'China', UK:'United Kingdom', AU:'Australia', MX:'Mexico', ES:'Spain', TH:'Thailand', RU:'Russia', BR:'Brazil', CA:'Canada'};
const FILE = {car:'cars', moto:'moto', boat:'boat', air:'air'};
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const exists = f => fs.existsSync(path.join(ROOT, f));
const fold = s => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const EST_INDEX = {car:{US:20, other:18}, moto:18, boat:18, air:18};   // position of the `est` flag in each row schema

function estOf(vt, cc, row){ const i = vt === 'car' ? (cc === 'US' ? EST_INDEX.car.US : EST_INDEX.car.other) : EST_INDEX[vt]; return row[i] ? 1 : 0; }

function measure(){
  const S = read('data/sources.json'), I = exists('data/images.json') ? read('data/images.json') : {map:{}};
  const brands = S.brands || {}, byCC = S.brandsByCC || {}, bp = S.buildPrice || {};
  const makerUrl = (make, cc) => (byCC[make] && byCC[make][cc]) || brands[make] || null;
  const datasets = [], uncovered = {};
  for (const vt of VTS) for (const cc of CCS){
    const f = `data/${FILE[vt]}_${cc.toLowerCase()}.json`; if (!exists(f)) continue;
    const rows = read(f); const photos = (I.map || {})[`${vt}/${cc}`] || {};
    let est = 0, linked = 0, bpl = 0, ph = 0;
    for (const r of rows){
      est += estOf(vt, cc, r);
      if (makerUrl(r[0], cc)) linked++; else { const u = uncovered[r[0]] = uncovered[r[0]] || {rows:0, sets:new Set()}; u.rows++; u.sets.add(`${vt}/${cc}`); }
      if (bp[`${vt}/${cc}`] && bp[`${vt}/${cc}`][r[0]]) bpl++;
      if (photos[`${r[0]}|${r[1]}`]) ph++;
    }
    datasets.push({vt, cc, rows:rows.length, est, confirmed:rows.length - est, makerLinked:linked, buildPrice:bpl, photos:ph});
  }
  const sum = (list, k) => list.reduce((a, d) => a + d[k], 0);
  const byVt = {}; for (const vt of VTS){ const l = datasets.filter(d => d.vt === vt); byVt[vt] = {rows:sum(l,'rows'), est:sum(l,'est'), confirmed:sum(l,'confirmed'), makerLinked:sum(l,'makerLinked'), buildPrice:sum(l,'buildPrice'), photos:sum(l,'photos')}; }
  const total = {rows:sum(datasets,'rows'), est:sum(datasets,'est'), confirmed:sum(datasets,'confirmed'), makerLinked:sum(datasets,'makerLinked'), buildPrice:sum(datasets,'buildPrice'), photos:sum(datasets,'photos')};
  // sources: per set, how many cite a page
  const sets = Object.assign({}, S.sets || {}); for (const [vt, v] of Object.entries(S.setsDefault || {})) sets[`${vt}/default`] = v;
  let srcTotal = 0, srcLinked = 0; const unlinked = [];
  for (const [k, v] of Object.entries(sets)) for (const [name, url] of (v.sources || [])){ srcTotal++; if (url) srcLinked++; else unlinked.push({set:k, name}); }
  // brand keys: the same maker spelled two ways in any map
  const dupes = [];
  for (const [label, map] of [['brands', brands], ['brandsByCC', byCC]].concat(Object.keys(bp).map(k => [`buildPrice ${k}`, bp[k]]))){
    const seen = {}; for (const k of Object.keys(map)){ const f = fold(k); if (seen[f] && seen[f] !== k) dupes.push(`${label}: ${seen[f]} / ${k}`); else seen[f] = k; }
  }
  const makes = {}; for (const vt of VTS) for (const cc of CCS){ const f = `data/${FILE[vt]}_${cc.toLowerCase()}.json`; if (!exists(f)) continue; for (const r of read(f)){ const k = fold(r[0]); (makes[k] = makes[k] || new Set()).add(r[0]); } }
  for (const set of Object.values(makes)) if (set.size > 1) dupes.push('data rows: ' + [...set].join(' / '));
  // tax tables: one citation per row
  const us = read('data/states_us.json'), inn = read('data/states_in.json');
  const states = {US:{rows:Object.keys(us).length, cited:Object.values(us).filter(r => r[4]).length}, IN:{rows:Object.keys(inn).length, cited:Object.values(inn).filter(r => r.src).length}};
  const notes = {}; for (const cc of CCS){ const f = `docs/tax-notes/${cc.toLowerCase()}.md`; if (!exists(f)) continue; const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); notes[cc] = (t.match(/https?:\/\/[^\s)>\]]+/g) || []).length; }
  for (const f of ['us-bikes-boats', 'aircraft']){ const p = `docs/tax-notes/${f}.md`; if (exists(p)){ const t = fs.readFileSync(path.join(ROOT, p), 'utf8'); notes[f] = (t.match(/https?:\/\/[^\s)>\]]+/g) || []).length; } }
  const fx = S.fx || {};
  return {asOf: Object.values(S.compiled || {}).sort().pop() || null, compiled:S.compiled || {}, rulesAsOf:S.rulesAsOf || {}, fx:{date:fx.date || null, convertedAt:fx.convertedAt || {}, compiledAt:fx.compiledAt || {}, dates:Object.keys(fx.perEur || {}).sort()},
    datasets, byVt, total, sources:{total:srcTotal, linked:srcLinked, unlinked}, brandKeys:{dupes, uncovered:Object.fromEntries(Object.entries(uncovered).map(([k, u]) => [k, {rows:u.rows, sets:[...u.sets].sort()}]))}, states, notes};
}

const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '–';
const n = x => x.toLocaleString('en-US');
const fmtDate = iso => { if (!iso) return '–'; const d = new Date(iso + 'T00:00:00Z'); return isNaN(d) ? iso : d.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}); };

function markdown(m, floors){
  const L = [];
  L.push('# Data quality', '',
    'Measured by `src/quality.js` at build time from the data files; `node src/build.js` rewrites this page and',
    '`test/quality.test.mjs` fails the build when a number drops below its floor in `data/quality-floor.json`.',
    `Data as of **${fmtDate(m.asOf)}** (the newest compile date); exchange rates of **${fmtDate(m.fx.date)}**.`, '');
  L.push('## Headline', '',
    '| Measure | Value | Floor |', '|---|---:|---:|',
    `| Rows | ${n(m.total.rows)} | |`,
    `| Confirmed from a published list (not an estimate) | ${n(m.total.confirmed)} (${pct(m.total.confirmed, m.total.rows)}) | ${pct(floors.confirmedShare, 1)} |`,
    `| Rows whose maker page is linked | ${n(m.total.makerLinked)} (${pct(m.total.makerLinked, m.total.rows)}) | ${pct(floors.makerLinkShare, 1)} |`,
    `| US car rows with a build-and-price link | ${n(m.byVt.car ? m.datasets.find(d => d.vt==='car' && d.cc==='US').buildPrice : 0)} (${pct(m.datasets.find(d => d.vt==='car' && d.cc==='US').buildPrice, m.datasets.find(d => d.vt==='car' && d.cc==='US').rows)}) | ${pct(floors.buildPriceShareUS, 1)} |`,
    `| Rows with a photo | ${n(m.total.photos)} (${pct(m.total.photos, m.total.rows)}) | ${pct(floors.photoShare, 1)} |`,
    `| Price sources that cite a page | ${m.sources.linked} of ${m.sources.total} | at most ${floors.unlinkedSourcesMax} unlinked |`,
    `| US state rows with a citation | ${m.states.US.cited} of ${m.states.US.rows} | all |`,
    `| Indian state rows with a citation | ${m.states.IN.cited} of ${m.states.IN.rows} | all |`,
    `| Duplicate brand keys (case- and accent-insensitive) | ${m.brandKeys.dupes.length} | 0 |`, '');
  L.push('## Dates', '',
    '| Dataset | Prices compiled | Tax rules as of | Rates on the compile day | Converted at |', '|---|---|---|---|---|');
  for (const vt of VTS) L.push(`| ${VT_NAME[vt]} | ${fmtDate(m.compiled[vt])} | ${fmtDate(m.rulesAsOf[vt])} | ${fmtDate(m.fx.compiledAt[vt])} | ${m.fx.convertedAt[vt] ? fmtDate(m.fx.convertedAt[vt]) + ' (from the maker’s dollar or euro list)' : 'home-currency list, not converted'} |`);
  L.push('', `The World tab converts at the ECB rates of ${fmtDate(m.fx.date)}; the rate tables in \`data/sources.json\` hold ${m.fx.dates.map(fmtDate).join(', ')}. There are no per-row verification dates yet: "compiled" is the date of the whole dataset, "confirmed" means the row matches the maker’s published list on that date.`, '');
  L.push('## Per dataset', '',
    '| Dataset | Rows | Confirmed | Estimates | Maker linked | Build & price | Photos |', '|---|---:|---:|---:|---:|---:|---:|');
  for (const vt of VTS){ const v = m.byVt[vt]; if (!v.rows) continue;
    L.push(`| **${VT_NAME[vt]}** | **${n(v.rows)}** | **${pct(v.confirmed, v.rows)}** | **${n(v.est)}** | **${pct(v.makerLinked, v.rows)}** | **${v.buildPrice ? pct(v.buildPrice, v.rows) : '–'}** | **${pct(v.photos, v.rows)}** |`);
    for (const d of m.datasets.filter(d => d.vt === vt)) L.push(`| ${CC_NAME[d.cc]} | ${n(d.rows)} | ${pct(d.confirmed, d.rows)} | ${n(d.est)} | ${pct(d.makerLinked, d.rows)} | ${d.buildPrice ? pct(d.buildPrice, d.rows) : '–'} | ${pct(d.photos, d.rows)} |`);
  }
  L.push('', '## Sources without a link', '', 'Price sources recorded as a name only (print lists, dealer quotes, maker price lists with no stable page). The app marks them "not linked".', '');
  if (!m.sources.unlinked.length) L.push('None.'); else for (const u of m.sources.unlinked) L.push(`- ${u.set}: ${u.name}`);
  L.push('', '## Makers without a linked page', '', 'Rows whose maker has no entry in `brands` or `brandsByCC` in `data/sources.json`.', '');
  const unc = Object.entries(m.brandKeys.uncovered).sort((a, b) => b[1].rows - a[1].rows);
  if (!unc.length) L.push('None.'); else for (const [k, u] of unc) L.push(`- ${k}: ${u.rows} row${u.rows === 1 ? '' : 's'} (${u.sets.join(', ')})`);
  L.push('', '## Brand keys', '', m.brandKeys.dupes.length ? m.brandKeys.dupes.map(d => '- ' + d).join('\n') : 'No maker is spelled two ways in the data or the source maps.');
  L.push('', '## Tax tables', '',
    `- USA: ${m.states.US.cited} of ${m.states.US.rows} state rows cite the state revenue department or DMV page (\`data/states_us.json\`, 5th and 6th elements).`,
    `- India: ${m.states.IN.cited} of ${m.states.IN.rows} state rows cite the transport department or the Act (\`data/states_in.json\`, \`src\` and \`srcName\`).`,
    `- Other countries: the per-region rules are documented in \`docs/tax-notes/<cc>.md\` with their sources: ${Object.entries(m.notes).map(([k, v]) => `${k} (${v} links)`).join(', ')}.`, '');
  return L.join('\n') + '\n';
}

module.exports = {measure, markdown, VTS, CCS, VT_NAME, CC_NAME};
if (require.main === module){ const m = measure(); console.log(JSON.stringify({total:m.total, byVt:m.byVt, sources:{total:m.sources.total, linked:m.sources.linked, unlinked:m.sources.unlinked.length}, dupes:m.brandKeys.dupes, states:m.states, uncovered:Object.keys(m.brandKeys.uncovered).length}, null, 1)); }
