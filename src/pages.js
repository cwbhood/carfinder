/* Builds the static, crawlable pages from the same data and pricing engine the app ships with (called by src/build.js):
     tax/<state>/              car sales tax in each state and DC: the tax's name, rate, local rates, trade-in rule, fees,
                               a worked example priced by the app's own engine, the citations
     trade-in-credit/<state>/  does the state tax the price less the trade-in, with what a trade saves at four sizes
     tax/ and trade-in-credit/ the hubs that link every state
     data/                     the dataset itself: files, schema, licence, DOI, Dataset JSON-LD
   Each page answers its question in the first paragraph, then shows the numbers behind it. Everything on a page comes
   from data/states_us.json, data/us_tax.json, data/us_local.json and the price rows, so a page cannot drift from the app. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const SITE = 'https://destinjones.github.io/carfinder/';
const slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const $ = n => '$' + Math.round(n).toLocaleString('en-US');
const pct = r => (Math.round(r * 1000) / 1000) + '%';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtDate = d => { const [y, m, day] = d.split('-').map(Number); return `${day} ${MONTHS[m - 1]} ${y}`; };

/* the app's engine and data, evaluated from the assembled page up to where the page state begins */
function engine(assembledBody){
  const js = assembledBody.match(/<script>([\s\S]*)<\/script>/)[1];
  const cut = js.indexOf('/* ===== state ===== */');
  return new Function(js.slice(0, cut) + '\nreturn {DATA, breakdown, usState, usRule, usTax, usLocal, usLocalTable, MONEY, STATES_US, US_TAX, US_LOCAL, SOURCES, BAND};')();
}

/* the places shown on a state page when it has a local table (all of them are in the app's picker) */
const FEATURED = {
  CA: ['Los Angeles (Los Angeles County)','San Diego (San Diego County)','San Jose (Santa Clara County)','San Francisco (San Francisco County)','Fresno (Fresno County)','Sacramento (Sacramento County)','Long Beach (Los Angeles County)','Oakland (Alameda County)','Bakersfield (Kern County)','Anaheim (Orange County)','Riverside (Riverside County)','Irvine (Orange County)','Lancaster (Los Angeles County)','Los Angeles County, unincorporated area'],
  NY: ['Manhattan (New York County), New York City','Brooklyn (Kings), New York City','Queens, New York City','Bronx, New York City','Staten Island (Richmond), New York City','Nassau County (outside its cities)','Suffolk County (outside its cities)','Westchester County (outside its cities)','Yonkers (city, Westchester County)','Erie County (outside its cities)','Monroe County (outside its cities)','Onondaga County (outside its cities)','Albany County (outside its cities)','Saratoga County (outside its cities)']
};

function shell({title, desc, canonical, depth, crumbs, body, jsonld, eyebrow, h1, lede}){
  const up = '../'.repeat(depth);
  const tpl = read('src/methodology.html');
  const css = tpl.slice(tpl.indexOf('<style>'), tpl.indexOf('</style>') + 8)
    .replace('</style>', '.answer{font-size:clamp(17px,2vw,20px);color:var(--ink);max-width:44em;margin:22px 0 0}.answer b{color:var(--ink)}\n.crumbs{font:500 12px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint);margin:0 0 18px}.crumbs a{color:var(--ink-dim)}\n.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:26px 0 0;max-width:72em}.facts div{border:1px solid var(--line);border-radius:6px;background:var(--panel);padding:12px 14px}.facts b{display:block;font:900 26px/1.1 var(--display);color:var(--ink)}.facts span{font-size:13.5px;color:var(--ink-dim)}\n.cta{display:inline-flex;align-items:center;min-height:44px;padding:10px 16px;border-radius:6px;background:var(--accent);color:#04060a!important;font-weight:600;text-decoration:none;margin:22px 12px 0 0}\n.cta.alt{background:transparent;color:var(--ink)!important;border:1px solid var(--line-strong)}\ndl.faq dt{font-weight:700;color:var(--ink);margin:18px 0 4px}dl.faq dd{margin:0;color:var(--ink-dim);max-width:72em}\n.cols{columns:3 220px;column-gap:24px;padding:0;list-style:none}.cols li{break-inside:avoid;margin:0 0 6px}.cols a{display:inline-block;padding:6px 0}\n</style>');
  const ld = [{'@context':'https://schema.org','@type':'BreadcrumbList', itemListElement: crumbs.map(([n, u], i) => ({'@type':'ListItem', position:i + 1, name:n, item:SITE + u}))}].concat(jsonld || []);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#04060a">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Destin Jones">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}${canonical}">
<link rel="icon" href="${up}brand/emblem/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${up}brand/emblem/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="CarFinder 2026">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${canonical}">
<meta property="og:image" content="${SITE}brand/social/og-1200x630.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="${up}brand/fonts/fonts.css">
${css}
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<nav aria-label="Main">
  <div class="wrap">
    <a class="brand" href="${up}./"><img src="${up}brand/emblem/emblem-256.png" alt="">CarFinder</a>
    <div class="links"><a href="${up}tax/">Sales tax by state</a><a href="${up}trade-in-credit/">Trade-in credit</a><a href="${up}methodology.html">How we calculate</a><a href="${up}data/">Data</a><a class="go" href="${up}carfinder.html">Open CarFinder</a></div>
  </div>
</nav>
<main id="main">
<header class="hero">
  <div class="wrap">
    <p class="crumbs">${crumbs.map(([n, u], i) => i === crumbs.length - 1 ? esc(n) : `<a href="${up}${u}">${esc(n)}</a>`).join(' / ')}</p>
    <div class="eyebrow">${esc(eyebrow)}</div>
    <h1>${h1}</h1>
    ${lede}
  </div>
</header>
<div class="wrap">
${body.replace(/\{\{UP\}\}/g, up)}
</div>
</main>
<footer>
  <div class="wrap">
    <div>
      <p><a class="brand" href="${up}./" style="font-size:18px;color:var(--ink)"><img src="${up}brand/emblem/emblem-256.png" alt="" style="width:26px;height:26px">CarFinder 2026</a></p>
      <p>A free, open source project by <a href="${up}about.html">Destin Jones</a>, vibe coded with Claude. Estimates for awareness while shopping, not quotes, offers or tax advice: confirm the figures with the dealer and your state before you sign. No accounts, no ads, no tracking.</p>
    </div>
    <div>
      <p><a href="${up}./">Home</a> · <a href="${up}carfinder.html">Open CarFinder</a> · <a href="${up}tax/">Car sales tax by state</a> · <a href="${up}trade-in-credit/">Trade-in tax credit by state</a> · <a href="${up}data/">Dataset</a></p>
      <p><a href="https://github.com/destinjones/carfinder">Source on GitHub</a> · <a href="https://github.com/destinjones/carfinder/issues/new?template=wrong-price.yml">Report a wrong figure</a> · <a href="https://github.com/destinjones/carfinder/blob/main/CHANGELOG.md">Changelog</a> · <a href="https://github.com/destinjones/carfinder/blob/main/LICENSE">MIT licence</a></p>
    </div>
  </div>
</footer>
</body>
</html>
`;
}

const link = (u, t) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`;
const appLink = (code, loc) => `{{UP}}carfinder.html?v=car&amp;cc=US#v=car&amp;cc=US&amp;r=${code}${loc ? '&amp;loc=' + encodeURIComponent(loc).replace(/'/g, '%27') : ''}`;

function build(assembledBody){
  const E = engine(assembledBody);
  const ST = Object.entries(E.STATES_US).filter(([k]) => k !== 'US').map(([code, v]) => ({code, name:v[0], st:E.usState(code), rule:E.usRule(code), slug:slug(v[0])}));
  ST.sort((a, b) => a.name.localeCompare(b.name));
  const ruleAsOf = E.US_TAX.asof, ratesAsOf = E.SOURCES.compiled.car;
  const rav = E.DATA.car.US.find(c => c.make === 'Toyota' && c.model === 'RAV4');
  const M = E.MONEY.US;
  const pages = {};
  const tradeWord = r => r.trade === 'none' ? 'No' : r.trade === 'notax' ? 'No tax to reduce' : typeof r.trade === 'number' ? 'Capped at ' + $(r.trade) : 'Yes';
  const saveAt = (s, price, trade) => E.usTax(s.st, price, rav, 0) - E.usTax(s.st, price, rav, trade);

  for (const s of ST){
    const {code, name, st, rule} = s; const T = E.usLocalTable(code);
    const o = E.breakdown('US', rav, rav.price, code, M), oT = E.breakdown('US', rav, rav.price, code, M, {trade:15000});
    const taxLo = E.usTax(st, o.dlo, rav, 0), taxHi = E.usTax(st, o.dhi, rav, 0);
    const saved = taxHi - E.usTax(st, o.dhi, rav, 15000);
    const noTax = rule.trade === 'notax';
    const taxName = rule.tax === 'Sales tax' ? 'sales tax' : rule.tax;
    const rates = T ? T.places.map(p => p[1]) : null;
    const lowerTax = rule.tax.toLowerCase().replace('(tavt)', '(TAVT)');
    const cap1 = x => x.charAt(0).toUpperCase() + x.slice(1);
    const parts = st.note.split(';').map(x => x.trim()).filter(x => x && !/doc fee/i.test(x) && !/^[\d.]+% statewide$/.test(x));
    const hasLocal = /local|county|city|surtax|borough/i.test(st.note.replace(/no local tax[^;]*/i, ''));
    const headline = code === 'DC' ? `a <b>titling excise tax of 1% to 11%</b> of the vehicle’s NADA value instead of sales tax, set by weight class and city mpg since February 2025 (electric cars pay 1% to 3%)`
      : T ? `<b>${pct(Math.min(...rates))} to ${pct(Math.max(...rates))}</b> ${lowerTax} on a car, depending on the city or county where you register it`
      : code === 'CT' ? `<b>6.35%</b> sales tax on a car (<b>7.75%</b> if it costs more than $50,000)`
      : rule.tax === 'Sales tax' ? `<b>${pct(st.rate)}</b> sales tax on a car${hasLocal ? ' on average, state and local combined' : ''}`
      : `a <b>${pct(st.rate)} ${esc(lowerTax)}</b> on a car${code === 'SC' ? ', capped at $500,' : ''} instead of sales tax`;
    const GA = 'It is paid once, when you title the car, and replaces both sales tax and the old annual ad valorem tax.';
    const extra = code === 'GA' ? GA : (code === 'DC' || code === 'CT' || T || rule.tax !== 'Sales tax') ? '' : parts.filter(x => !/^[\d.]+%( state)?$/.test(x)).map(x => esc(cap1(x)) + '.').join(' ');
    const rateLine = noTax ? `${name} has no state sales tax on cars.` : `${name} charges ${headline}.${extra ? ' ' + extra : ''}${T ? ` Without a city CarFinder uses ${pct(st.rate)}.` : ''}`;
    const tradeLine = noTax ? '' : rule.trade === 'none' ? ` <b>Trade-in credit: none.</b> ${esc(rule.why)}`
      : typeof rule.trade === 'number' ? ` <b>Trade-in credit: up to ${$(rule.trade)}.</b> ${esc(rule.why)}`
      : ` <b>Trade-in credit: yes.</b> ${esc(rule.why || name + ' taxes the price less your trade-in.')}`;
    const answer = `<p class="answer">${rateLine}${tradeLine} Add a dealer doc fee (typically ${$(st.doc)}${/doc fee capped/i.test(st.note) ? ', capped by law' : ''}) and about $350 for title, registration and plates.</p>`;
    const facts = `<div class="facts"><div><b>${noTax ? '0%' : code === 'DC' ? '1–11%' : T ? pct(Math.min(...rates)) + '–' + pct(Math.max(...rates)) : pct(st.rate)}</b><span>${esc(rule.tax)}${T ? ' by city or county' : ''}</span></div><div><b>${tradeWord(rule)}</b><span>trade-in credit</span></div><div><b>${$(st.doc)}</b><span>typical dealer doc fee</span></div><div><b>${$(o.lo)}–${$(o.hi).slice(1)}</b><span>drive-off for a Toyota RAV4</span></div></div>`;
    let local = '';
    if (T){
      const rows = FEATURED[code].map(l => T.places.find(p => p[0] === l)).filter(Boolean);
      local = `<section><h2>Local rates in ${esc(name)}</h2><p>${esc(T.basis.charAt(0).toUpperCase() + T.basis.slice(1))}. Combined state and local rates from ${link(T.src[0], T.src[1])}; ${T.places.length} cities and counties are in CarFinder\u2019s picker. Some of the largest:</p>
<div class="tbl"><table><thead><tr><th>Where you register it</th><th class="num">Rate</th><th class="num">Tax on a ${$(40000)} car</th><th>Price it</th></tr></thead><tbody>${rows.map(([l, r]) => `<tr><td>${esc(l)}</td><td class="num">${pct(r)}</td><td class="num">${$(40000 * r / 100)}</td><td><a href="${appLink(code, l)}">open in CarFinder</a></td></tr>`).join('')}</tbody></table></div></section>`;
    } else if (/local|county|city/i.test(st.note) && !noTax){
      local = `<section><h2>Local taxes in ${esc(name)}</h2><p>${esc(st.note)}. CarFinder uses ${pct(st.rate)} as a typical combined rate for ${esc(name)} until its city and county table is added; your dealer will charge the rate for your address. California and New York already have every city and county.</p></section>`;
    }
    const ex = `<section><h2>Worked example: a ${rav.year} Toyota RAV4</h2><p>The RAV4 lists at ${$(rav.price)} to ${$(rav.top)} plus a ${$(rav.dest)} destination charge. Dealers are selling it at ${esc(E.BAND && rav.mkt ? ['at or above sticker','a little under sticker','well under sticker'][['hot','steady','deals'].indexOf(rav.mkt)] : 'around sticker')} this month (${$(o.dlo)} to ${$(o.dhi)} for the base trim), so in ${esc(name)}${T ? ' at the ' + pct(st.rate) + ' average' : ''}:</p>
<div class="tbl"><table><tbody>
<tr><td>Dealer price, base trim</td><td class="num">${$(o.dlo)} – ${$(o.dhi)}</td></tr>
<tr><td>${esc(rule.tax)}${code === 'DC' ? ' (rate for this car: see the app)' : ''}</td><td class="num">${$(taxLo)} – ${$(taxHi)}</td></tr>
<tr><td>Dealer doc fee (typical)</td><td class="num">${$(st.doc)}</td></tr>
<tr><td>Title, registration, plates (estimate)</td><td class="num">${$(350)}</td></tr>
<tr><td><b>Drive-off price</b></td><td class="num"><b>${$(o.lo)} – ${$(o.hi)}</b></td></tr>
<tr><td>Same car with a ${$(15000)} trade-in</td><td class="num">${noTax ? 'no tax to reduce' : saved > 0.5 ? `${$(oT.lo)} – ${$(oT.hi)} (saves ${$(saved)} in tax)` : 'no tax saving'}</td></tr>
</tbody></table></div><p>The trade-in pays part of the price as well; the drive-off figures above are before you hand it over. <a href="${appLink(code)}">Price any car in ${esc(name)}</a>, with your own trade-in under <i>Cost assumptions</i>.</p></section>`;
    const faq = [
      [`What is the car sales tax in ${name}?`, rateLine.replace(/<[^>]+>/g, '')],
      [`Does ${name} give a trade-in tax credit?`, noTax ? `There is no state tax on the purchase to reduce.` : (tradeLine.replace(/<[^>]+>/g, '').trim() + (saved > 0.5 ? ` On a Toyota RAV4 a $15,000 trade-in saves about ${$(saved)}.` : ''))],
      [`How much are dealer doc fees in ${name}?`, `Typically about ${$(st.doc)}${/doc fee capped/i.test(st.note) ? '; the state caps them' : '; it is a dealer charge, so ask for it before you sign'}.`]
    ];
    const srcs = [[st.src, st.srcName || st.src], rule.src].concat(T ? [T.src] : []).filter(x => x && x[0]);
    const body = `${facts}${ex}${local}
<section><h2>Common questions</h2><dl class="faq">${faq.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl></section>
<section><h2>Sources</h2><p>Rates as of ${fmtDate(ratesAsOf)}${T ? `, local rates effective ${fmtDate(T.asof)}` : ''}; trade-in rule checked ${fmtDate(ruleAsOf)}.</p><ul>${srcs.map(([u, t]) => `<li>${link(u, t)}</li>`).join('')}</ul><p>See also: <a href="{{UP}}trade-in-credit/${s.slug}/">Does ${esc(name)} give a trade-in tax credit?</a> · <a href="{{UP}}tax/">Car sales tax in every state</a> · <a href="{{UP}}methodology.html#us">How we calculate</a>. Spot something wrong? <a href="https://github.com/destinjones/carfinder/issues/new?template=wrong-price.yml">Tell us</a>.</p></section>`;
    pages[`tax/${s.slug}/index.html`] = shell({
      title: `Car sales tax in ${name} (2026): rate, trade-in rule, fees | CarFinder`,
      desc: `${rateLine.replace(/<[^>]+>/g, '')}${tradeLine.replace(/<[^>]+>/g, '')}`.slice(0, 300),
      canonical: `tax/${s.slug}/`, depth: 2, eyebrow: 'Car sales tax · ' + code,
      crumbs: [['CarFinder', ''], ['Car sales tax by state', 'tax/'], [name, `tax/${s.slug}/`]],
      h1: `Car sales tax in ${esc(name)}`, lede: answer + `<a class="cta" href="${appLink(code).replace(/\{\{UP\}\}/g, '../../')}">Price a car in ${esc(name)}</a><a class="cta alt" href="../../trade-in-credit/${s.slug}/">Trade-in rule</a>`,
      body, jsonld: [{'@context':'https://schema.org','@type':'FAQPage', mainEntity: faq.map(([q, a]) => ({'@type':'Question', name:q, acceptedAnswer:{'@type':'Answer', text:a}}))}]
    });

    // trade-in page
    const sizes = [5000, 10000, 15000, 25000];
    const verdict = noTax ? `There is nothing to credit: ${esc(rule.why)}` : rule.trade === 'none' ? `<b>No.</b> ${esc(rule.why)} A trade-in still lowers what you pay, but not your tax.`
      : typeof rule.trade === 'number' ? `<b>Yes, up to a cap.</b> ${esc(rule.why)}` : `<b>Yes.</b> ${esc(rule.why || name + ' taxes the price less the trade-in.')}`;
    const s15 = saveAt(s, 40000, 15000);
    const tAnswer = `<p class="answer">${verdict}${!noTax ? ` On a ${$(40000)} car, a ${$(15000)} trade-in ${s15 > 0.5 ? `saves you about <b>${$(s15)}</b> in ${esc(rule.tax.toLowerCase().replace('(tavt)', '(TAVT)'))}` : 'saves no tax'}.` : ''}</p>`;
    const others = ST.filter(x => x.rule.trade === 'none' || typeof x.rule.trade === 'number').filter(x => x.code !== code);
    const tBody = `${noTax ? '' : `<section><h2>What a trade-in saves in ${esc(name)}</h2><p>Tax at ${code === 'DC' ? 'the excise rate' : pct(st.rate)} on a ${$(40000)} purchase${code === 'SC' ? ', with South Carolina\u2019s $500 cap on the fee' : ''}:</p>
<div class="tbl"><table><thead><tr><th>Trade-in value</th><th class="num">Taxed on</th><th class="num">Tax</th><th class="num">Saved</th></tr></thead><tbody>
<tr><td>No trade-in</td><td class="num">${$(40000)}</td><td class="num">${$(E.usTax(st, 40000, rav, 0))}</td><td class="num">–</td></tr>
${sizes.map(t => { const taxable = rule.trade === 'none' ? 40000 : 40000 - (typeof rule.trade === 'number' ? Math.min(t, rule.trade) : t); return `<tr><td>${$(t)}</td><td class="num">${$(taxable)}</td><td class="num">${$(E.usTax(st, 40000, rav, t))}</td><td class="num">${$(saveAt(s, 40000, t))}</td></tr>`; }).join('')}
</tbody></table></div><p>${code === 'DC' ? 'DC\u2019s rate depends on the car\u2019s weight and mpg; this table uses a mid-size car. ' : ''}The trade-in still pays for part of the car in every state; the difference is only whether it also cuts the tax. To see it on a real car, enter your trade-in under <i>Cost assumptions</i> in <a href="${appLink(code)}">CarFinder for ${esc(name)}</a>.</p></section>`}
<section><h2>States that tax the full price</h2><p>Most states tax the price less the trade-in. These don\u2019t, or cap the credit:</p><ul class="cols">${others.map(x => `<li><a href="{{UP}}trade-in-credit/${x.slug}/">${esc(x.name)}</a>: ${esc(tradeWord(x.rule).toLowerCase())}</li>`).join('')}</ul></section>
<section><h2>Source</h2><p>${rule.src ? link(rule.src[0], rule.src[1]) : ''}, checked ${fmtDate(ruleAsOf)}. Rules differ for private sales, leases and some vehicle types; ask the dealer to show the taxable amount on the buyer\u2019s order. See also <a href="{{UP}}tax/${s.slug}/">car sales tax in ${esc(name)}</a> and <a href="{{UP}}trade-in-credit/">every state\u2019s rule</a>.</p></section>`;
    pages[`trade-in-credit/${s.slug}/index.html`] = shell({
      title: `Does ${name} give a trade-in tax credit? (2026) | CarFinder`,
      desc: tAnswer.replace(/<[^>]+>/g, '').trim().slice(0, 300),
      canonical: `trade-in-credit/${s.slug}/`, depth: 2, eyebrow: 'Trade-in tax credit · ' + code,
      crumbs: [['CarFinder', ''], ['Trade-in tax credit by state', 'trade-in-credit/'], [name, `trade-in-credit/${s.slug}/`]],
      h1: `Does ${esc(name)} give a trade-in tax credit?`, lede: tAnswer + `<a class="cta" href="${appLink(code).replace(/\{\{UP\}\}/g, '../../')}">Price a car with your trade-in</a><a class="cta alt" href="../../tax/${s.slug}/">${esc(name)} car sales tax</a>`,
      body: tBody, jsonld: [{'@context':'https://schema.org','@type':'FAQPage', mainEntity:[{'@type':'Question', name:`Does ${name} give a trade-in tax credit?`, acceptedAnswer:{'@type':'Answer', text:tAnswer.replace(/<[^>]+>/g, '').trim()}}]}]
    });
  }

  // hubs
  const hubTax = `<section><h2>Every state</h2><div class="tbl"><table><thead><tr><th>State</th><th>Tax on a car</th><th class="num">Rate used</th><th>Trade-in credit</th><th class="num">Typical doc fee</th></tr></thead><tbody>${ST.map(s => `<tr><td><a href="${s.slug}/"><b>${esc(s.name)}</b></a></td><td>${esc(s.rule.tax)}${E.usLocalTable(s.code) ? ' <small>(every city and county)</small>' : ''}</td><td class="num">${s.code === 'DC' ? '1–11%' : pct(s.st.rate)}</td><td><a href="../trade-in-credit/${s.slug}/">${esc(tradeWord(s.rule))}</a></td><td class="num">${$(s.st.doc)}</td></tr>`).join('')}</tbody></table></div><p class="fine">Rates as of ${fmtDate(ratesAsOf)}; where a state also has county and city taxes the rate shown is a typical combined rate, and California and New York are priced by city or county. Every state page cites its sources. Generated from <a href="https://github.com/destinjones/carfinder/blob/main/data/states_us.json">data/states_us.json</a> and <a href="https://github.com/destinjones/carfinder/blob/main/data/us_tax.json">data/us_tax.json</a>.</p></section>`;
  pages['tax/index.html'] = shell({title:'Car sales tax by state (2026): rates, trade-in rules, fees | CarFinder', desc:'What every US state and DC charges on a car purchase: the tax and its name (sales tax, TAVT, highway use tax, excise), the rate, whether a trade-in reduces it, and typical doc fees, with sources.', canonical:'tax/', depth:1, eyebrow:'Car sales tax', crumbs:[['CarFinder', ''], ['Car sales tax by state', 'tax/']], h1:'Car sales tax<br>by state', lede:`<p class="answer">Every state and DC taxes a car purchase differently: most charge sales tax, but Georgia charges a one-time TAVT, North Carolina a 3% highway use tax and South Carolina a fee capped at $500, while Alaska, Montana and New Hampshire charge nothing. ${ST.filter(s => s.rule.trade === 'none').length} states tax the full price even when you trade a car in. Pick a state for its rate, its trade-in rule, a worked example and the sources.</p>`, body:hubTax});
  const group = (f, h) => `<h3>${h}</h3><ul class="cols">${ST.filter(f).map(s => `<li><a href="${s.slug}/">${esc(s.name)}</a></li>`).join('')}</ul>`;
  pages['trade-in-credit/index.html'] = shell({title:'Trade-in tax credit by state (2026): which states tax the full price | CarFinder', desc:'Which US states let you subtract your trade-in before tax, which tax the full price (California, Virginia, Hawaii, Oregon, DC) and Michigan\u2019s cap, with what a trade-in saves in each state.', canonical:'trade-in-credit/', depth:1, eyebrow:'Trade-in tax credit', crumbs:[['CarFinder', ''], ['Trade-in tax credit by state', 'trade-in-credit/']], h1:'Trade-in tax credit<br>by state', lede:`<p class="answer">${ST.filter(s => s.rule.trade === 'full').length} states tax the price of a car less your trade-in. ${ST.filter(s => s.rule.trade === 'none').map(s => s.name).join(', ').replace(/, ([^,]*)$/, ' and $1')} tax the full price, Michigan caps the credit at ${$(E.usRule('MI').trade)} in 2026, and Alaska, Montana and New Hampshire have no tax to reduce. On a $40,000 car with a $15,000 trade-in the difference is $900 to $1,500 in tax.</p>`, body:`<section>${group(s => s.rule.trade === 'full', 'Tax the price less the trade-in')}${group(s => s.rule.trade === 'none', 'Tax the full price (no credit)')}${group(s => typeof s.rule.trade === 'number', 'Credit capped')}${group(s => s.rule.trade === 'notax', 'No tax to reduce')}<p class="fine">Rules checked ${fmtDate(ruleAsOf)}; each state page cites the state document or the compiled source it comes from. They cover a new car bought from a dealer; private sales and leases can differ.</p></section>`});

  // the dataset page
  pages['data/index.html'] = dataPage(E);
  // the sitemap: the hand-written pages, then every generated one, dated by the rules they print
  const d = E.US_TAX.asof;
  const fixed = [['', d, 'monthly', '1.0'], ['carfinder.html', d, 'monthly', '0.9'], ['methodology.html', d, 'monthly', '0.7'], ['tax/', d, 'monthly', '0.8'], ['trade-in-credit/', d, 'monthly', '0.8'], ['data/', d, 'monthly', '0.7'], ['about.html', '2026-10-05', 'yearly', '0.5']];
  const gen = Object.keys(pages).filter(k => /^(tax|trade-in-credit)\/[^/]+\/index\.html$/.test(k)).map(k => [k.replace(/index\.html$/, ''), d, 'monthly', '0.6']);
  pages['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${fixed.concat(gen).map(([u, m, f, pr]) => `  <url><loc>${SITE}${u}</loc><lastmod>${m}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`;
  return pages;
}

function dataPage(E){
  const S = E.SOURCES; const files = [];
  const VT = {car:'cars', moto:'moto', boat:'boat', air:'air'}, VN = {car:'Cars and trucks', moto:'Motorcycles and scooters', boat:'Boats and jet skis', air:'Planes, jets and helicopters'};
  let rows = 0;
  for (const vt of Object.keys(VT)) for (const cc of ['US','CA','MX','BR','UK','ES','RU','IN','CN','TH','AU']){
    const f = `${VT[vt]}_${cc.toLowerCase()}.json`; if (!fs.existsSync(path.join(ROOT, 'data', f))) continue;
    const n = JSON.parse(read('data/' + f)).length; rows += n; files.push([f, vt, cc, n]);
  }
  const rules = [['states_us.json', 'US state purchase-tax rates, typical doc fees, notes and a citation per state'], ['us_tax.json', 'US tax names and trade-in credit rules per state, with sources'], ['us_local.json', 'California and New York combined local rates by city and county, from the states\u2019 own tables'], ['states_in.json', 'Indian state road-tax slabs by fuel, with a citation per state'], ['vfees.json', 'Motorcycle, boat and aircraft fee rules per country'], ['sources.json', 'Compile dates, price sources, maker links and the dated ECB exchange-rate tables']];
  const doi = '10.5281/zenodo.23382016';
  const ld = {'@context':'https://schema.org', '@type':'Dataset', name:'CarFinder 2026: new-vehicle list prices and purchase taxes in 11 countries',
    description:`List prices, dealer price bands and the purchase-tax and fee rules behind an estimated on-road price for ${rows.toLocaleString('en-US')} new cars, motorcycles, boats and aircraft in the USA, India, China, the UK, Australia, Mexico, Spain, Thailand, Russia, Brazil and Canada, with a cited source for every US and Indian state rule and the trade-in tax credit rule for every US state.`,
    url: SITE + 'data/', sameAs: 'https://doi.org/' + doi, identifier: 'https://doi.org/' + doi, license: 'https://opensource.org/licenses/MIT', isAccessibleForFree: true,
    creator: {'@type':'Person', name:'Destin Jones', url: SITE + 'about.html'}, dateModified: E.US_TAX.asof, temporalCoverage: '2026', spatialCoverage: ['United States','India','China','United Kingdom','Australia','Mexico','Spain','Thailand','Russia','Brazil','Canada'],
    keywords: ['car prices','vehicle sales tax','trade-in tax credit','on-road price','motorcycles','boats','aircraft','open data'],
    distribution: files.map(([f]) => ({'@type':'DataDownload', encodingFormat:'application/json', contentUrl: SITE + 'data/' + f})).concat(rules.map(([f]) => ({'@type':'DataDownload', encodingFormat:'application/json', contentUrl: SITE + 'data/' + f})))};
  const body = `<section><h2>Price rows</h2><p>One JSON array per vertical and country; each row is an array in the order documented in <a href="https://github.com/destinjones/carfinder/blob/main/docs/DATA.md">docs/DATA.md</a> (make, model, body, size, price from base to top trim, efficiency, power, seats, drivetrain, the market heat that sets the dealer band, a note and whether the price is an estimate). ${rows.toLocaleString('en-US')} rows in ${files.length} files.</p>
<div class="tbl"><table><thead><tr><th>File</th><th>What</th><th class="num">Rows</th></tr></thead><tbody>${files.map(([f, vt, cc, n]) => `<tr><td><a href="${f}">${f}</a></td><td>${VN[vt]}, ${cc}</td><td class="num">${n.toLocaleString('en-US')}</td></tr>`).join('')}</tbody></table></div></section>
<section><h2>Rules and sources</h2><div class="tbl"><table><thead><tr><th>File</th><th>What</th></tr></thead><tbody>${rules.map(([f, d]) => `<tr><td><a href="${f}">${f}</a></td><td>${esc(d)}</td></tr>`).join('')}</tbody></table></div>
<p>How every figure is built from these files, with every table and its source: <a href="../methodology.html">How we calculate</a>. Coverage, measured at every build: <a href="https://github.com/destinjones/carfinder/blob/main/docs/DATA-QUALITY.md">the data-quality scorecard</a> and <a href="https://github.com/destinjones/carfinder/blob/main/docs/data-quality-history.csv">its history</a>.</p></section>
<section><h2>Cite it</h2><p>Every release is archived on Zenodo. To cite the dataset and app, use the concept DOI, which always resolves to the latest version: <a href="https://doi.org/${doi}">doi.org/${doi}</a>. Suggested citation: Jones, D. (2026). <i>CarFinder 2026</i> [Data set and software]. Zenodo. https://doi.org/${doi}. The repository\u2019s <a href="https://github.com/destinjones/carfinder/blob/main/CITATION.cff">CITATION.cff</a> has the same in machine-readable form.</p>
<p>Licence: MIT, as for the whole repository. The prices and rules are compiled from the public sources named in each file; check a figure against its source before relying on it, and <a href="https://github.com/destinjones/carfinder/issues/new?template=wrong-price.yml">report anything wrong</a>.</p></section>`;
  return shell({title:'CarFinder dataset: vehicle prices and purchase taxes in 11 countries | CarFinder', desc:ld.description, canonical:'data/', depth:1, eyebrow:'Open data', crumbs:[['CarFinder', ''], ['Dataset', 'data/']], h1:'The dataset', lede:`<p class="answer">Everything CarFinder shows comes from these JSON files: ${rows.toLocaleString('en-US')} new-vehicle price rows in 11 countries and the tax and fee rules applied to them, each US and Indian state rule with its citation. Free to use under the MIT licence and citable by DOI.</p><a class="cta" href="https://doi.org/${doi}">DOI ${doi}</a><a class="cta alt" href="https://github.com/destinjones/carfinder/tree/main/data">Browse on GitHub</a>`, body, jsonld:[ld]});
}

module.exports = {build};
