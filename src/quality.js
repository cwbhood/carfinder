/* Data-quality scorecard: measured from the data files, never asserted.
   measure() returns the numbers; markdown() renders docs/DATA-QUALITY.md; historyCsv() upserts one row per release
   into docs/data-quality-history.csv so the trajectory survives rebuilds; test/quality.test.mjs holds the numbers
   above the floors in data/quality-floor.json so CI goes red when coverage regresses. Everything here is
   deterministic (no "today"), so the generated files only change when the data or the version does and
   `node src/build.js --check` can compare them. QUALITY_ROOT points the measurement at another checkout. */
const fs = require('fs'), path = require('path');
const ROOT = process.env.QUALITY_ROOT || path.join(__dirname, '..');
const CCS = ['US','IN','CN','UK','AU','MX','ES','TH','RU','BR','CA'];
const VTS = ['car','moto','boat','air'];
const STATES = ['checked','listed','converted','estimated'];
const VT_NAME = {car:'Cars & trucks', moto:'Motorcycles', boat:'Boats', air:'Aircraft'};
const CC_NAME = {US:'USA', IN:'India', CN:'China', UK:'United Kingdom', AU:'Australia', MX:'Mexico', ES:'Spain', TH:'Thailand', RU:'Russia', BR:'Brazil', CA:'Canada'};
const FILE = {car:'cars', moto:'moto', boat:'boat', air:'air'};
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const exists = f => fs.existsSync(path.join(ROOT, f));
const fold = s => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const EST_INDEX = {car:{US:20, other:18}, moto:18, boat:18, air:18};   // position of the `est` flag in each row schema

function estOf(vt, cc, row){ const i = vt === 'car' ? (cc === 'US' ? EST_INDEX.car.US : EST_INDEX.car.other) : EST_INDEX[vt]; return row[i] ? 1 : 0; }
/* the same four states as rowStatus() in the app's core (src/script.html); test/quality.test.mjs checks the two agree on every row */
function statusOf(vt, cc, est, checked){ if (checked) return 'checked'; if (!est) return 'listed'; if (vt === 'air' && cc !== 'US') return 'converted'; return 'estimated'; }
const fromList = d => d.checked + d.listed + d.converted;                   // rows that come from a published list, converted or not

function measure(){
  const S = read('data/sources.json'), I = exists('data/images.json') ? read('data/images.json') : {map:{}};
  const brands = S.brands || {}, byCC = S.brandsByCC || {}, bp = S.buildPrice || {};
  const makerUrl = (make, cc) => (byCC[make] && byCC[make][cc]) || brands[make] || null;
  const datasets = [], uncovered = {};
  for (const vt of VTS) for (const cc of CCS){
    const f = `data/${FILE[vt]}_${cc.toLowerCase()}.json`; if (!exists(f)) continue;
    const rows = read(f); const photos = (I.map || {})[`${vt}/${cc}`] || {};
    const d = {vt, cc, rows:rows.length, checked:0, listed:0, converted:0, estimated:0, est:0, makerLinked:0, buildPrice:0, photos:0};
    for (const r of rows){
      const est = estOf(vt, cc, r); d.est += est; d[statusOf(vt, cc, est, null)]++;
      if (makerUrl(r[0], cc)) d.makerLinked++; else { const u = uncovered[r[0]] = uncovered[r[0]] || {rows:0, sets:new Set()}; u.rows++; u.sets.add(`${vt}/${cc}`); }
      if (bp[`${vt}/${cc}`] && bp[`${vt}/${cc}`][r[0]]) d.buildPrice++;
      if (photos[`${r[0]}|${r[1]}`]) d.photos++;
    }
    datasets.push(d);
  }
  const KEYS = ['rows','checked','listed','converted','estimated','est','makerLinked','buildPrice','photos'];
  const sumOf = list => { const o = {}; for (const k of KEYS) o[k] = list.reduce((a, d) => a + d[k], 0); return o; };
  const byVt = {}; for (const vt of VTS) byVt[vt] = sumOf(datasets.filter(d => d.vt === vt));
  const total = sumOf(datasets);
  // sources: per set, how many cite a page
  const sets = Object.assign({}, S.sets || {}); for (const [vt, v] of Object.entries(S.setsDefault || {})) sets[`${vt}/default`] = v;
  let srcTotal = 0, srcLinked = 0; const unlinked = [];
  for (const [k, v] of Object.entries(sets)) for (const [name, url] of (v.sources || [])){ srcTotal++; if (url) srcLinked++; else unlinked.push({set:k, name}); }
  // brand keys: the same maker spelled two ways in any map or in the rows
  const dupes = [];
  for (const [label, map] of [['brands', brands], ['brandsByCC', byCC]].concat(Object.keys(bp).map(k => [`buildPrice ${k}`, bp[k]]))){
    const seen = {}; for (const k of Object.keys(map)){ const f = fold(k); if (seen[f] && seen[f] !== k) dupes.push(`${label}: ${seen[f]} / ${k}`); else seen[f] = k; }
  }
  const makes = {}; for (const vt of VTS) for (const cc of CCS){ const f = `data/${FILE[vt]}_${cc.toLowerCase()}.json`; if (!exists(f)) continue; for (const r of read(f)){ const k = fold(r[0]); (makes[k] = makes[k] || new Set()).add(r[0]); } }
  for (const set of Object.values(makes)) if (set.size > 1) dupes.push('data rows: ' + [...set].join(' / '));
  // build-and-price coverage per car market
  const bpByCC = {}; for (const d of datasets.filter(d => d.vt === 'car')) bpByCC[d.cc] = {rows:d.rows, linked:d.buildPrice};
  // tax tables: one citation per row
  const us = read('data/states_us.json'), inn = read('data/states_in.json');
  const states = {US:{rows:Object.keys(us).length, cited:Object.values(us).filter(r => r[4]).length}, IN:{rows:Object.keys(inn).length, cited:Object.values(inn).filter(r => r.src).length}};
  const notes = {}; for (const cc of CCS){ const f = `docs/tax-notes/${cc.toLowerCase()}.md`; if (!exists(f)) continue; const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); notes[cc] = (t.match(/https?:\/\/[^\s)>\]]+/g) || []).length; }
  for (const f of ['us-bikes-boats', 'aircraft']){ const p = `docs/tax-notes/${f}.md`; if (exists(p)){ const t = fs.readFileSync(path.join(ROOT, p), 'utf8'); notes[f] = (t.match(/https?:\/\/[^\s)>\]]+/g) || []).length; } }
  const fx = S.fx || {};
  return {asOf: Object.values(S.compiled || {}).sort().pop() || null, compiled:S.compiled || {}, rulesAsOf:S.rulesAsOf || {}, fx:{date:fx.date || null, convertedAt:fx.convertedAt || {}, compiledAt:fx.compiledAt || {}, dates:Object.keys(fx.perEur || {}).sort()},
    datasets, byVt, total, bpByCC, sources:{total:srcTotal, linked:srcLinked, unlinked}, brandKeys:{dupes, uncovered:Object.fromEntries(Object.entries(uncovered).map(([k, u]) => [k, {rows:u.rows, sets:[...u.sets].sort()}]))}, states, notes};
}

const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '–';
const pct0 = v => (100 * v).toFixed(0) + '%';
const n = x => x.toLocaleString('en-US');
const fmtDate = iso => { if (!iso) return '–'; const d = new Date(iso + 'T00:00:00Z'); return isNaN(d) ? iso : d.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}); };

function markdown(m, floors){
  const L = [];
  const us = m.datasets.find(d => d.vt === 'car' && d.cc === 'US');
  const unlinkedMakers = Object.keys(m.brandKeys.uncovered).length;
  L.push('# Data quality', '',
    'Measured by `src/quality.js` at build time from the data files; `node src/build.js` rewrites this page and',
    '`test/quality.test.mjs` fails the build when a number drops below its floor in `data/quality-floor.json`.',
    'One row per release is kept in `data-quality-history.csv`, so the trajectory survives rebuilds.',
    `Data as of **${fmtDate(m.asOf)}** (the newest compile date); exchange rates of **${fmtDate(m.fx.date)}**.`, '');
  L.push('## Four states', '',
    'Every row is in exactly one state, each true of the row and nothing more:', '',
    '- **checked**: a person compared the row to the maker’s page after compile (the row carries a `checked` date). None yet; this is where per-row verification goes.',
    '- **listed**: the maker’s published list price for this market on the dataset’s compile date, not individually re-checked since.',
    '- **converted**: a published list in another currency, converted at a dated exchange rate (aircraft outside the US).',
    '- **estimated**: modelled from announcements, trade press or dealer quotes (most boats, and bikes outside the US).', '',
    '"From a published list" below is checked + listed + converted; the floors are per vertical, so adding boats cannot break cars and a vertical that stands still is visible.', '');
  L.push('## Headline', '',
    '| Measure | Value | Floor |', '|---|---:|---:|',
    `| Rows | ${n(m.total.rows)} | |`,
    `| Checked by a person | ${n(m.total.checked)} (${pct(m.total.checked, m.total.rows)}) | |`,
    `| Listed (maker’s published price) | ${n(m.total.listed)} (${pct(m.total.listed, m.total.rows)}) | |`,
    `| Converted (published list at a dated rate) | ${n(m.total.converted)} (${pct(m.total.converted, m.total.rows)}) | |`,
    `| Estimated | ${n(m.total.estimated)} (${pct(m.total.estimated, m.total.rows)}) | |`,
    `| From a published list, all rows | ${n(fromList(m.total))} (${pct(fromList(m.total), m.total.rows)}) | per vertical, below |`,
    `| Rows whose maker page is linked | ${n(m.total.makerLinked)} (${pct(m.total.makerLinked, m.total.rows)}) | ${pct0(floors.makerLinkShare)} |`,
    `| Makers without a linked page | ${unlinkedMakers} | at most ${floors.unlinkedMakersMax} |`,
    `| US car rows with a build-and-price link | ${n(us.buildPrice)} of ${n(us.rows)} (${pct(us.buildPrice, us.rows)}) | ${pct0(floors.buildPriceShareUS)} |`,
    `| Car rows with a build-and-price link, all markets | ${n(m.byVt.car.buildPrice)} of ${n(m.byVt.car.rows)} (${pct(m.byVt.car.buildPrice, m.byVt.car.rows)}) | ${pct0(floors.buildPriceShareCar)} |`,
    `| Rows with a photo | ${n(m.total.photos)} (${pct(m.total.photos, m.total.rows)}) | per vertical, below |`,
    `| Price sources that cite a page | ${m.sources.linked} of ${m.sources.total} | at most ${floors.unlinkedSourcesMax} unlinked |`,
    `| US state rows with a citation | ${m.states.US.cited} of ${m.states.US.rows} | all |`,
    `| Indian state rows with a citation | ${m.states.IN.cited} of ${m.states.IN.rows} | all |`,
    `| Makers spelled two ways (case- and accent-insensitive) | ${m.brandKeys.dupes.length} | 0 |`, '');
  L.push('## Per vertical, with floors', '',
    '| Vertical | Rows | From a published list | Floor | Photos | Floor |', '|---|---:|---:|---:|---:|---:|');
  for (const vt of VTS){ const v = m.byVt[vt]; if (!v.rows) continue; L.push(`| ${VT_NAME[vt]} | ${n(v.rows)} | ${pct(fromList(v), v.rows)} | ${pct0(floors.fromListShare[vt])} | ${pct(v.photos, v.rows)} | ${pct0(floors.photoShare[vt])} |`); }
  L.push('', 'Raise a floor when a vertical improves; a change that lowers one is the regression the test exists to catch.', '');
  L.push('## Dates', '',
    '| Dataset | Prices compiled | Tax rules as of | Rates on the compile day | Converted at |', '|---|---|---|---|---|');
  for (const vt of VTS) L.push(`| ${VT_NAME[vt]} | ${fmtDate(m.compiled[vt])} | ${fmtDate(m.rulesAsOf[vt])} | ${fmtDate(m.fx.compiledAt[vt])} | ${m.fx.convertedAt[vt] ? fmtDate(m.fx.convertedAt[vt]) + ' (from the maker’s dollar or euro list)' : 'home-currency list, not converted'} |`);
  L.push('', `The World tab converts at the ECB rates of ${fmtDate(m.fx.date)}; the rate tables in \`data/sources.json\` hold ${m.fx.dates.map(fmtDate).join(', ')}. There are no per-row verification dates yet: "compiled" is the date of the whole dataset.`, '');
  L.push('## Per dataset', '',
    '| Dataset | Rows | Checked | Listed | Converted | Estimated | Maker linked | Build & price | Photos |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  const row = (label, d, bold) => { const b = bold ? '**' : ''; return `| ${b}${label}${b} | ${b}${n(d.rows)}${b} | ${b}${n(d.checked)}${b} | ${b}${n(d.listed)} (${pct(d.listed, d.rows)})${b} | ${b}${n(d.converted)}${b} | ${b}${n(d.estimated)} (${pct(d.estimated, d.rows)})${b} | ${b}${pct(d.makerLinked, d.rows)}${b} | ${b}${d.buildPrice ? pct(d.buildPrice, d.rows) : '–'}${b} | ${b}${pct(d.photos, d.rows)}${b} |`; };
  for (const vt of VTS){ const v = m.byVt[vt]; if (!v.rows) continue; L.push(row(VT_NAME[vt], v, true)); for (const d of m.datasets.filter(d => d.vt === vt)) L.push(row(CC_NAME[d.cc], d, false)); }
  L.push('', '## Build-and-price links per car market', '', '| Market | Rows | Linked to a build-and-price page |', '|---|---:|---:|');
  for (const cc of CCS){ const b = m.bpByCC[cc]; if (b) L.push(`| ${CC_NAME[cc]} | ${n(b.rows)} | ${n(b.linked)} (${pct(b.linked, b.rows)}) |`); }
  L.push('', 'Rows without one link the maker’s site for that market (`brandsByCC`) or its global site (`brands`).', '');
  L.push('## Sources without a link', '', 'Price sources recorded as a name only (print lists, dealer quotes, maker price lists with no stable page). The app marks them "not linked".', '');
  if (!m.sources.unlinked.length) L.push('None.'); else for (const u of m.sources.unlinked) L.push(`- ${u.set}: ${u.name}`);
  L.push('', '## Makers without a linked page', '', `${unlinkedMakers} makers (floor: at most ${floors.unlinkedMakersMax}); rows whose maker has no entry in \`brands\` or \`brandsByCC\` in \`data/sources.json\`.`, '');
  const unc = Object.entries(m.brandKeys.uncovered).sort((a, b) => b[1].rows - a[1].rows);
  if (!unc.length) L.push('None.'); else for (const [k, u] of unc) L.push(`- ${k}: ${u.rows} row${u.rows === 1 ? '' : 's'} (${u.sets.join(', ')})`);
  L.push('', '## Brand keys', '', m.brandKeys.dupes.length ? m.brandKeys.dupes.map(d => '- ' + d).join('\n') : 'No maker is spelled two ways in the data or the source maps.');
  L.push('', '## Tax tables', '',
    `- USA: ${m.states.US.cited} of ${m.states.US.rows} state rows cite the state revenue department or DMV page (\`data/states_us.json\`, 5th and 6th elements).`,
    `- India: ${m.states.IN.cited} of ${m.states.IN.rows} state rows cite the transport department or the Act (\`data/states_in.json\`, \`src\` and \`srcName\`).`,
    `- Other countries: the per-region rules are documented in \`docs/tax-notes/<cc>.md\` with their sources: ${Object.entries(m.notes).map(([k, v]) => `${k} (${v} links)`).join(', ')}.`, '');
  return L.join('\n') + '\n';
}

/* one row per release; a rebuild of the same version replaces its row, a new version appends one */
const HIST_COLS = ['version','data_as_of','fx_date','rows','checked','listed','converted','estimated','maker_linked','unlinked_makers','build_price_us','build_price_cars','photos','sources_linked','sources_total','us_states_cited','in_states_cited','duplicate_brand_keys'];
function historyRow(m, version){
  const us = m.datasets.find(d => d.vt === 'car' && d.cc === 'US');
  return [version, m.asOf, m.fx.date, m.total.rows, m.total.checked, m.total.listed, m.total.converted, m.total.estimated, m.total.makerLinked, Object.keys(m.brandKeys.uncovered).length, us ? us.buildPrice : 0, m.byVt.car.buildPrice, m.total.photos, m.sources.linked, m.sources.total, m.states.US.cited, m.states.IN.cited, m.brandKeys.dupes.length];
}
function historyCsv(existing, m, version){
  const lines = (existing || '').split('\n').map(l => l.trim()).filter(Boolean);
  const rows = lines.slice(1).map(l => l.split(',')).filter(r => r[0] !== version);
  rows.push(historyRow(m, version).map(String));
  return HIST_COLS.join(',') + '\n' + rows.map(r => r.join(',')).join('\n') + '\n';
}

module.exports = {measure, markdown, historyCsv, statusOf, fromList, VTS, CCS, STATES, VT_NAME, CC_NAME};
if (require.main === module){ const m = measure(); console.log(JSON.stringify({total:m.total, byVt:m.byVt, bpByCC:m.bpByCC, sources:{total:m.sources.total, linked:m.sources.linked, unlinked:m.sources.unlinked.length}, dupes:m.brandKeys.dupes, states:m.states, unlinkedMakers:Object.keys(m.brandKeys.uncovered).length}, null, 1)); }
