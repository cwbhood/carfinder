/* Builds methodology.html, the "How we calculate" page, from the same data the app ships with, so the page cannot drift
   from the numbers: compile dates and sources (data/sources.json), exchange rates, dealer bands and market texts
   (src/script.html), the state tables (data/states_*.json), the bike, boat and aircraft fee rules (data/vfees.json)
   and the per-country research notes with their sources (docs/tax-notes/*.md). Called by src/build.js. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const CC_ORDER = ['US','CA','MX','BR','UK','ES','RU','IN','CN','TH','AU'];
const NOTE = {US:null, CA:'ca', MX:'mx', BR:'br', UK:'uk', ES:'es', RU:'ru', IN:null, CN:'cn', TH:'th', AU:'au'};
const VT_NAME = {car:'Cars and trucks', moto:'Motorcycles and scooters', boat:'Boats and jet skis', air:'Planes, jets and helicopters'};

/* the app's own constants, evaluated from the assembled script up to the point where the page state begins */
function appConstants(assembledBody){
  const js = assembledBody.match(/<script>([\s\S]*)<\/script>/)[1];
  const cut = js.indexOf('/* ===== state ===== */');
  if (cut < 0) throw new Error('state marker missing in src/script.html');
  const src = js.slice(0, cut) + '\nreturn {FX, CUR, CUR_NAME, BAND, MKT_TXT, MKT_TXT_V, REGIONS, REGION_DEFAULT, COUNTRIES, CC_NAME, ABOUT, ABOUT_V, GLOSS, GLOSS_V, VERT, VFEES, STATES_US, STATES_IN, SOURCES, VT_LABEL};';
  return new Function(src)();
}

/* a small Markdown renderer for the research notes: headings, paragraphs, lists, tables, bold, code, links */
function inline(s){
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (m, t, u) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`);
  s = s.replace(/(^|[\s(])((https?:\/\/)[^\s<)]+?)([.,;)]*)(?=\s|$|<)/g, (m, pre, url, proto, tail) => {
    const show = url.replace(/^https?:\/\/(www\.)?/, ''); return `${pre}<a href="${url}" target="_blank" rel="noopener">${show.length > 72 ? show.slice(0, 70) + '…' : show}</a>${tail}`; });
  return s;
}
function markdown(md, depth){
  const lines = md.replace(/\r/g, '').split('\n'); const out = []; let i = 0; let para = [];
  const flush = () => { if (para.length){ out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  while (i < lines.length){
    const L = lines[i];
    const h = L.match(/^(#{1,4})\s+(.*)$/);
    if (h){ flush(); const lvl = Math.min(6, h[1].length + depth); out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); i++; continue; }
    if (/^\s*\|/.test(L)){
      flush(); const rows = []; while (i < lines.length && /^\s*\|/.test(lines[i])){ rows.push(lines[i]); i++; }
      const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^\s*\|?\s*:?-{2,}/.test(r));
      if (body.length){ const head = cells(body[0]); out.push('<div class="tbl"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' + body.slice(1).map(r => '<tr>' + cells(r).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>'); }
      continue;
    }
    const li = L.match(/^\s*[-*]\s+(.*)$/), ol = L.match(/^\s*\d+[.)]\s+(.*)$/);
    if (li || ol){
      flush(); const tag = li ? 'ul' : 'ol'; const items = [];
      while (i < lines.length){
        const m = lines[i].match(li ? /^\s*[-*]\s+(.*)$/ : /^\s*\d+[.)]\s+(.*)$/);
        if (m){ items.push(m[1]); i++; }
        else if (/^\s{2,}\S/.test(lines[i]) && items.length){ items[items.length - 1] += ' ' + lines[i].trim(); i++; }   // wrapped continuation
        else break;
      }
      out.push(`<${tag}>` + items.map(x => `<li>${inline(x)}</li>`).join('') + `</${tag}>`); continue;
    }
    if (!L.trim()){ flush(); i++; continue; }
    para.push(L.trim()); i++;
  }
  flush(); return out.join('\n');
}
function noteSections(md){            // split a note into {title, sources: [urls...], body}
  const title = (md.match(/^#\s+(.*)$/m) || [,''])[1];
  const urls = [...new Set((md.match(/https?:\/\/[^\s<)\]]+/g) || []).map(u => u.replace(/[.,;:]+$/, '')))];
  return {title, urls, body: md.replace(/^#\s+.*$/m, '')};
}

const money0 = n => Number(n).toLocaleString('en-US');
const pct = x => (Math.round(x * 10000) / 100) + '%';
function feeHow(f, cc){
  const base = f.ofList ? 'the list price' : 'the dealer price'; const plus = f.withDest ? ' plus freight or delivery' : '';
  const mode = f.mode === 'fixed' ? 'fixed amount' : f.mode === 'perhp' ? 'per horsepower' : 'share of ' + base + plus;
  let how;
  if (f.text) how = `Information: ${esc(f.text)}`;
  else if (f.fixed === 'dest') how = 'The row’s freight, setup or delivery figure';
  else if (f.fixed !== undefined) how = `Fixed ${money0(f.fixed)}`;
  else if (f.pct !== undefined) how = `${pct(f.pct)} of ${base}${plus}`;
  else if (f.rates) how = `By region (${mode}): ` + Object.entries(f.rates).map(([k, v]) => `${esc(k)} ${f.mode === 'fixed' ? money0(v) : f.mode === 'perhp' ? money0(v) + '/hp' : pct(v)}`).join(', ');
  else if (f.brackets) how = `By ${f.on === 'ccm' ? 'engine size' : f.on === 'hp' ? 'power' : f.on === 'len' ? 'length' : 'price'} (${mode}): ` + f.brackets.map(([u, v]) => `up to ${u >= 1e9 ? 'any' : money0(u)}: ${f.mode === 'fixed' ? money0(v) : f.mode === 'perhp' ? money0(v) + '/hp' : pct(v)}`).join('; ');
  else if (f.hook) how = ({usSales:'The state’s sales or use tax rate on the dealer price' + plus + (f.caps ? ', capped in ' + Object.entries(f.caps).map(([k, v]) => `${k} (${money0(v)})` ).join(', ') : '') + (f.exempt ? '; exempt in ' + f.exempt.join(', ') : '') + (f.rates ? '; special rates ' + Object.entries(f.rates).filter(([k]) => k !== 'US').map(([k, v]) => `${k} ${pct(v)}`).join(', ') : ''), usDoc:'The state’s typical dealer documentation fee', inRoad:'The state’s road-tax rate', caProv:'The province’s sales tax (GST/HST plus PST or QST)', cnPurchase:'10% of the ex-VAT price', esMatric:'The registration tax by CO2 band'})[f.hook] || f.hook;
  const mods = [];
  if (f.fuel) mods.push(`only ${f.fuel}`); if (f.notFuel) mods.push(`not ${f.notFuel}`); if (f.fuels) mods.push(`only ${f.fuels.join('/')}`);
  if (f.body) mods.push(`only ${f.body}`); if (f.notBody) mods.push(`not ${f.notBody}`); if (f.bodies) mods.push(`only ${f.bodies.join(', ')}`);
  if (f.evMult !== undefined) mods.push(f.evMult === 0 ? 'EVs exempt' : `EVs × ${f.evMult}`);
  if (f.min !== undefined) mods.push(`at least ${money0(f.min)}`); if (f.max !== undefined) mods.push(`at most ${money0(f.max)}`);
  if (f.approx) mods.push('approximate');
  return how + (mods.length ? ` <span class="mod">(${esc(mods.join('; '))})</span>` : '');
}
function feesTable(F){
  return `<div class="tbl"><table><thead><tr><th>Line</th><th>How it is computed</th><th>Counted?</th></tr></thead><tbody>` +
    `<tr><td><b>${esc(F.basis.k)}</b><br><small>${esc(F.basis.sub)}</small></td><td>The published price on the row</td><td>basis</td></tr>` +
    `<tr><td><b>${esc(F.typical || 'Typical dealer price')}</b></td><td>Hot ${pct(F.bands.hot[0])}–${pct(F.bands.hot[1])} · steady ${pct(F.bands.steady[0])}–${pct(F.bands.steady[1])} · deals ${pct(F.bands.deals[0])}–${pct(F.bands.deals[1])} of the basis, by the row’s market level</td><td>the range the fees are added to</td></tr>` +
    F.fees.map(f => `<tr><td><b>${esc(f.k)}</b>${f.sub ? `<br><small>${esc(f.sub)}</small>` : ''}</td><td>${feeHow(f)}</td><td>${f.text || f.info ? '<span class="info">shown, not added</span>' : 'added'}</td></tr>`).join('') +
    `</tbody></table></div>`;
}

function build(assembledBody){
  const A = appConstants(assembledBody);
  const S = A.SOURCES; const fmt = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
  const notes = {}; for (const cc of CC_ORDER) if (NOTE[cc]) notes[cc] = noteSections(read(`docs/tax-notes/${NOTE[cc]}.md`));
  const usBB = noteSections(read('docs/tax-notes/us-bikes-boats.md')); const airNote = noteSections(read('docs/tax-notes/aircraft.md'));
  const srcList = srcs => `<span class="src">${srcs.map(([n, u]) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>` : esc(n)).join(' · ')}</span>`;
  const toc = [];
  let body = '';

  /* 1. the three prices */
  toc.push(['prices', 'The three prices']);
  body += `<section id="prices"><h2>The three prices</h2>
<p>Every row shows the same three numbers, built the same way in every tab.</p>
<ol class="steps">
<li><b>List price.</b> The maker’s published price for the cheapest and the dearest trim, variant or package of the model, on the basis that market uses (US sticker before destination, Indian ex-showroom, UK on-the-road, Australian RRP before on-roads, Canadian MSRP before freight, and so on; each tab names its basis). Nothing is adjusted: if a brand quotes a price with tax inside, so does the row.</li>
<li><b>Typical dealer price.</b> A band, not a quote: each model carries a market level (<i>hot</i>, <i>steady</i>, <i>deals</i>) set from the discount climate for that model in that market when the data was compiled, and the band is a share of the list price (the table below). The breakdown applies the band to the trim you pick with the slider.</li>
<li><b>On-road price.</b> The dealer band plus every mandatory cost of putting the vehicle on the road, water or ramp in the region you pick: destination or freight, taxes, registration, plates, compulsory insurance, levies and rebates, each as a separate line with a note on what it is. Lines marked <span class="info">shown, not added</span> (insurance where it is optional, running costs, mooring) are information only. A total is a range because the dealer price is a range.</li>
</ol>
<p><b>Rounding.</b> Prices are stored in whole local units (rupees, not lakh; yuan, not 万). Fees are computed exactly and displayed rounded to the unit; a <code>~</code> marks a typical figure rather than a statutory one. Price presets and wizard budgets are rounded to two significant figures. Nothing is rounded before it is added.</p>
<p><b>Running costs.</b> Yearly fuel or charging uses the official efficiency figure (EPA, ARAI, WLTP, NRCan, CLTC, Eco Sticker, INMETRO…) at the fuel and electricity prices in the cost assumptions, which you can edit; monthly payments use the loan terms there. Aircraft and boats use fuel burn per hour times the hours you set.</p>
</section>`;

  /* 2. data as of, exchange rates */
  toc.push(['dates', 'Data as of']);
  const fxRows = Object.entries(A.FX).filter(([k]) => k !== 'USD').map(([k, v]) => `<tr><td>${k}</td><td>${esc(A.CUR_NAME[k])}</td><td class="num">${v}</td><td class="num">${(1 / v).toFixed(4)}</td></tr>`).join('');
  body += `<section id="dates"><h2>Data as of</h2>
<div class="tbl"><table><thead><tr><th>Dataset</th><th>Prices compiled</th><th>Tax and fee rules as of</th></tr></thead><tbody>
${Object.entries(S.compiled).map(([vt, d]) => `<tr><td>${VT_NAME[vt]}</td><td>${fmt(d)}</td><td>${fmt(S.rulesAsOf[vt] || d)}</td></tr>`).join('')}
</tbody></table></div>
<p>The World tab converts every list price and on-road figure at the <a href="${esc(S.fx.url)}" target="_blank" rel="noopener">${esc(S.fx.name)}</a> of <b>${fmt(S.fx.date)}</b>, quoted here per US dollar. Aircraft list prices outside the US are converted at the same rates before tax.</p>
<div class="tbl"><table><thead><tr><th>Code</th><th>Currency</th><th class="num">Per US dollar</th><th class="num">US dollars per unit</th></tr></thead><tbody>${fxRows}</tbody></table></div>
<p>Each detail sheet in the app repeats the compile date, the price source and whether the row is confirmed or an estimate (<i>preliminary</i> rows: announced, converted or partly confirmed pricing).</p>
</section>`;

  /* 3. dealer bands */
  toc.push(['bands', 'Dealer bands']);
  body += `<section id="bands"><h2>Dealer bands</h2>
<p>The share of list price a buyer typically pays, by market level, for cars. Motorcycles, boats and aircraft have their own bands in the fee tables below.</p>
<div class="tbl"><table><thead><tr><th>Market</th><th>Hot</th><th>Steady</th><th>Deals</th></tr></thead><tbody>
${CC_ORDER.map(cc => `<tr><td><b>${esc(A.CC_NAME[cc])}</b></td>${['hot','steady','deals'].map(m => `<td>${pct(A.BAND[cc][m][0])}–${pct(A.BAND[cc][m][1])}<br><small>${esc(A.MKT_TXT[cc][m][0])}</small></td>`).join('')}</tr>`).join('')}
</tbody></table></div>
<p>Aircraft, every market: hot ${pct(A.VFEES.US.air.bands.hot[0])}–${pct(A.VFEES.US.air.bands.hot[1])} (${esc(A.MKT_TXT_V.air.hot[0])}), steady ${pct(A.VFEES.US.air.bands.steady[0])}–${pct(A.VFEES.US.air.bands.steady[1])}, deals ${pct(A.VFEES.US.air.bands.deals[0])}–${pct(A.VFEES.US.air.bands.deals[1])}.</p>
</section>`;

  /* 4. per country */
  for (const cc of CC_ORDER){
    const name = A.CC_NAME[cc]; const id = cc.toLowerCase(); toc.push([id, name]);
    const set = S.sets['car/' + cc] || {};
    const regions = cc === 'US' ? null : cc === 'IN' ? null : Object.entries(A.REGIONS[cc]).map(([k, v]) => v[0]);
    let sec = `<section id="${id}" class="country"><h2>${esc(name)}</h2>
<h3>Cars and trucks</h3>
<p><b>Price basis:</b> ${esc(set.basis || '')}. <b>Compiled:</b> ${fmt(S.compiled.car)} from ${srcList(set.sources || [])}</p>
<div class="about">${A.ABOUT[cc]}</div>`;
    if (cc === 'US'){
      sec += `<h4>State table (data/states_us.json)</h4><p>Combined state and average local sales-tax rate, the typical dealer documentation fee, and the note the breakdown shows. Title and plates are about $350 nationwide.</p>
<div class="tbl"><table><thead><tr><th>State</th><th class="num">Sales tax</th><th class="num">Typical doc fee</th><th>Note</th></tr></thead><tbody>
${Object.entries(A.STATES_US).map(([k, v]) => `<tr><td><b>${esc(v[0])}</b> <small>${k}</small></td><td class="num">${v[1]}%</td><td class="num">$${money0(v[2])}</td><td>${esc(v[3])}</td></tr>`).join('')}
</tbody></table></div>`;
    } else if (cc === 'IN'){
      const slab = p => p ? p.map(([u, r]) => `${u >= 1e6 ? 'above' : 'up to ₹' + u + ' L'}: ${r}%`).join('; ') : '—';
      sec += `<h4>State table (data/states_in.json)</h4><p>RTO road tax by price slab (lakh of ex-showroom) and fuel, the cess multiplier, fixed registration charges and the EV rule.</p>
<div class="tbl"><table><thead><tr><th>State</th><th>Petrol slabs</th><th>Diesel</th><th>EV</th><th>Note</th></tr></thead><tbody>
${Object.entries(A.STATES_IN).map(([k, v]) => `<tr><td><b>${esc(v.name)}</b> <small>${k}</small></td><td>${esc(slab(v.p))}${v.mult && v.mult !== 1 ? ` <small>× ${v.mult} cess</small>` : ''}${v.cap ? ` <small>cap ₹${money0(v.cap)}</small>` : ''}</td><td>${v.d ? esc(slab(v.d)) : 'as petrol'}</td><td>${v.ev && v.ev.length === 0 ? 'exempt' : v.ev && v.ev.length ? esc(slab(v.ev)) : 'as petrol'}</td><td>${esc(v.note || '')}</td></tr>`).join('')}
</tbody></table></div>`;
    } else {
      sec += `<p><b>Regions in the picker:</b> ${regions.map(esc).join(' · ')} (default ${esc(A.REGIONS[cc][A.REGION_DEFAULT[cc]][0])}). The rates, brackets and formulas for each are in the research note below.</p>`;
    }
    if (notes[cc]){
      const n = notes[cc];
      sec += `<details class="note"><summary>Research note: ${esc(n.title)} <small>(${n.urls.length} sources)</small></summary><div class="md">${markdown(n.body, 2)}</div></details>`;
    }
    /* bikes, boats, aircraft for this country */
    for (const vt of ['moto', 'boat', 'air']){
      const F = A.VFEES[cc] && A.VFEES[cc][vt]; if (!F) continue;
      const vset = S.sets[vt + '/' + cc] || S.sets[vt + '/ALL'] || S.setsDefault[vt] || {};
      sec += `<h3>${VT_NAME[vt]}</h3><p><b>Price basis:</b> ${esc(vset.basis || F.basis.k)}. <b>Compiled:</b> ${fmt(S.compiled[vt])} from ${srcList(vset.sources || [])}</p>
<div class="about">${A.ABOUT_V[vt](cc)}</div>
<h4>Fee lines (data/vfees.json → ${cc}.${vt})</h4>${feesTable(F)}`;
      if (F.glossary && F.glossary.length) sec += `<p class="fine"><b>Local terms:</b> ${F.glossary.map(([t, d]) => `<i>${esc(t)}</i>: ${esc(d)}`).join(' ')}</p>`;
    }
    if (cc === 'US') sec += `<details class="note"><summary>Research note: ${esc(usBB.title)} <small>(${usBB.urls.length} sources)</small></summary><div class="md">${markdown(usBB.body, 2)}</div></details>`;
    sec += `</section>`; body += sec;
  }

  /* 5. aircraft note and World */
  toc.push(['aircraft', 'Aircraft, every market']);
  body += `<section id="aircraft"><h2>Aircraft, every market</h2><p>The aircraft rows share one master list priced in the maker’s currency, so the method is the same in every tab; the note below has the basis, the per-tab taxes and the sources.</p>
<details class="note" open><summary>Research note: ${esc(airNote.title)} <small>(${airNote.urls.length} sources)</small></summary><div class="md">${markdown(airNote.body, 2)}</div></details></section>`;
  toc.push(['world', 'World tab']);
  body += `<section id="world"><h2>World tab</h2><div class="about">${A.ABOUT.ALL}</div></section>`;

  /* 6. corrections */
  toc.push(['corrections', 'Corrections']);
  body += `<section id="corrections"><h2>Corrections</h2>
<p>Every detail sheet has a <i>Wrong price? Tell us</i> link that opens a GitHub issue with the vehicle, your region and the figures shown already filled in. You can also <a href="https://github.com/destinjones/carfinder/issues/new?template=wrong-price.yml">open one directly</a>, or edit the data: each country’s rows are a JSON file with a <a href="https://github.com/destinjones/carfinder/blob/main/docs/DATA.md">documented schema</a>, each car tax rule is one function and each bike, boat or aircraft fee is one row in <code>data/vfees.json</code>, and the tests re-run every vehicle in every region on every change. Corrections with a source are merged quickly.</p>
<p>Prices move monthly and tax rules change with budgets: treat every figure here as an estimate to bargain within, and get an out-the-door price in writing from two or three dealers before you sign.</p>
</section>`;

  const tpl = read('src/methodology.html');
  const tocHTML = toc.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('');
  // function replacements: the notes contain '$', which a string replacement would read as a pattern
  return tpl.replace('{{TOC}}', () => tocHTML).replace('{{BODY}}', () => body).replace(/\{\{DATE_CARS\}\}/g, () => fmt(S.compiled.car)).replace(/\{\{DATE_AIR\}\}/g, () => fmt(S.compiled.air)).replace(/\{\{DATE_FX\}\}/g, () => fmt(S.fx.date));
}
module.exports = {build};
