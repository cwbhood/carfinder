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

/* the chrome every content page shares, methodology.html included (src/methodology.js requires these): head links,
   navigation, footer and the theme switch. Styles live in brand/tokens.css and brand/site/pages.css; their URLs carry a
   hash of both files, because the service worker serves CSS cache-first. */
const cssVer = () => require('crypto').createHash('sha256').update(read('brand/tokens.css') + read('brand/site/pages.css')).digest('hex').slice(0, 10);
const THEME_INIT = `<script>try{var t=JSON.parse(localStorage.getItem('cf_theme'));if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>`;
const THEME_JS = `<script>(function(){var r=document.documentElement,b=document.querySelector('.theme');if(!b)return;var mq=matchMedia('(prefers-color-scheme: dark)');function dark(){var t=r.getAttribute('data-theme');return t?t==='dark':mq.matches}function lab(){b.setAttribute('aria-label',dark()?'Switch to the light theme':'Switch to the dark theme')}b.hidden=false;lab();b.addEventListener('click',function(){var t=dark()?'light':'dark';r.setAttribute('data-theme',t);try{localStorage.setItem('cf_theme',JSON.stringify(t))}catch(e){}lab()});if(mq.addEventListener)mq.addEventListener('change',lab)})();(function(){var c=document.querySelector('.site-nav .links [aria-current]');if(!c)return;var l=c.parentNode;if(l.scrollWidth>l.clientWidth)l.scrollLeft=c.getBoundingClientRect().left-l.getBoundingClientRect().left-16})()</script>`;
function headLinks(up){
  const v = cssVer();
  return `<meta name="theme-color" content="#f3f0e8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0e0f11" media="(prefers-color-scheme: dark)">
${THEME_INIT}
<link rel="stylesheet" href="${up}brand/fonts/fonts.css">
<link rel="stylesheet" href="${up}brand/tokens.css?v=${v}">
<link rel="stylesheet" href="${up}brand/site/pages.css?v=${v}">`;
}
/* the emblem's price tag, drawn in ink with the car cut out of it */
const MARK = `<svg viewBox="11 17 44 30" aria-hidden="true" focusable="false"><path class="tag" d="M12 21a3 3 0 0 1 3-3h24.5a3 3 0 0 1 2.2.95L54 31a1.5 1.5 0 0 1 0 2L41.7 45.05a3 3 0 0 1-2.2.95H15a3 3 0 0 1-3-3z"/><circle class="cut" cx="18.5" cy="32" r="2.8"/><path class="cut" d="M24.5 37.5l1.6-5.2a2 2 0 0 1 1.9-1.4h2.6l3-3.6a2 2 0 0 1 1.5-.7h5.6a2 2 0 0 1 1.6.8l2.7 3.5h2.3a2 2 0 0 1 2 2v3.4a1.2 1.2 0 0 1-1.2 1.2z"/><circle class="cut" cx="29.5" cy="38" r="2.5"/><circle class="cut" cx="44.5" cy="38" r="2.5"/></svg>`;
function siteNav(up, current){
  const L = [['tax/', 'Sales tax by state'], ['trade-in-credit/', 'Trade-in credit'], ['methodology.html', 'How we calculate'], ['data/', 'Data']];
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-nav">
  <div class="page">
    <a class="mark" href="${up}./" aria-label="CarFinder home">${MARK}CarFinder</a>
    <nav class="links" aria-label="Main">${L.map(([u, t]) => `<a href="${up}${u}"${u === current ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    <button class="theme" type="button" aria-label="Switch theme" hidden><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg></button>
    <a class="btn primary" href="${up}carfinder.html">Open CarFinder</a>
  </div>
</header>`;
}
function siteFoot(up, disclaimer){
  return `<footer class="site-foot">
  <div class="page">
    <div>
      <a class="mark" href="${up}./">${MARK}CarFinder 2026</a>
      <p>A free, open source project by <a href="${up}about.html">Destin Jones</a>, vibe coded with Claude. ${disclaimer} No accounts, no ads, no tracking.</p>
    </div>
    <div>
      <h2>Pages</h2>
      <ul><li><a href="${up}./">Home</a></li><li><a href="${up}carfinder.html">Open CarFinder</a></li><li><a href="${up}tax/">Car sales tax by state</a></li><li><a href="${up}trade-in-credit/">Trade-in tax credit by state</a></li><li><a href="${up}methodology.html">How we calculate</a></li><li><a href="${up}data/">Dataset</a></li></ul>
    </div>
    <div>
      <h2>Project</h2>
      <ul><li><a href="https://github.com/destinjones/carfinder">Source on GitHub</a></li><li><a href="https://github.com/destinjones/carfinder/issues/new?template=wrong-price.yml">Report a wrong figure</a></li><li><a href="https://github.com/destinjones/carfinder/blob/main/CHANGELOG.md">Changelog</a></li><li><a href="https://github.com/destinjones/carfinder/blob/main/LICENSE">MIT licence</a></li></ul>
    </div>
  </div>
</footer>
${THEME_JS}`;
}

/* a section: the heading sits in the left rail on wide screens, the body beside it */
const sec = (h, inner, id) => `<section class="sec"${id ? ` id="${id}"` : ''}><h2>${h}</h2><div class="sec-body">${inner}</div></section>`;
/* the sticker strip: [label, figure, accent?] */
const sticker = cells => `<dl class="sticker">${cells.map(([k, v, cls]) => `<div><dt>${k}</dt><dd${cls ? ` class="${cls === true ? 'hot' : cls}"` : ''}>${v}</dd></div>`).join('')}</dl>`;

function shell({title, desc, canonical, depth, crumbs, body, jsonld, kicker, code, h1, lede, current, wide}){
  const up = '../'.repeat(depth);
  const ld = [{'@context':'https://schema.org','@type':'BreadcrumbList', itemListElement: crumbs.map(([n, u], i) => ({'@type':'ListItem', position:i + 1, name:n, item:SITE + u}))}].concat(jsonld || []);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
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
${headLinks(up)}
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body>
${siteNav(up, current)}
<main id="main">
<div class="page">
<header class="mast">
  <nav aria-label="Breadcrumb"><ol class="crumbs">${crumbs.map(([n, u], i) => i === crumbs.length - 1 ? `<li><span aria-current="page">${esc(n)}</span></li>` : `<li><a href="${up}${u}">${esc(n)}</a></li>`).join('')}</ol></nav>
  <p class="kicker">${esc(kicker)}${code ? ` <span class="code">${esc(code)}</span>` : ''}</p>
  <h1${wide ? ' class="wide"' : ''}>${h1}</h1>
  ${lede}
</header>
${body}
</div>
</main>
${siteFoot(up, 'Estimates for awareness while shopping, not quotes, offers or tax advice: confirm the figures with the dealer and your state before you sign.')}
</body>
</html>
`.replace(/\{\{UP\}\}/g, up);
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
    const facts = sticker([[esc(rule.tax) + (T ? ' by city or county' : ''), noTax ? '0%' : code === 'DC' ? '1–11%' : T ? pct(Math.min(...rates)) + '–' + pct(Math.max(...rates)) : pct(st.rate)], ['Trade-in credit', tradeWord(rule), /^(Yes|No)$/.test(tradeWord(rule)) ? '' : 'txt'], ['Typical dealer doc fee', $(st.doc)], [`Drive-off, Toyota RAV4`, `${$(o.lo)}–${$(o.hi).slice(1)}`, true]]);
    let local = '';
    if (T){
      const rows = FEATURED[code].map(l => T.places.find(p => p[0] === l)).filter(Boolean);
      local = sec(`Local rates in ${esc(name)}`, `<p>${esc(T.basis.charAt(0).toUpperCase() + T.basis.slice(1))}. Combined state and local rates from ${link(T.src[0], T.src[1])}; ${T.places.length} cities and counties are in CarFinder’s picker. Some of the largest:</p>
<div class="tbl" tabindex="0" role="region" aria-label="Local rates in ${esc(name)}"><table><thead><tr><th>Where you register it</th><th class="num">Rate</th><th class="num">Tax on a ${$(40000)} car</th><th>Price it</th></tr></thead><tbody>${rows.map(([l, r]) => `<tr><td>${esc(l)}</td><td class="num">${pct(r)}</td><td class="num">${$(40000 * r / 100)}</td><td><a class="go" href="${appLink(code, l)}">open in CarFinder</a></td></tr>`).join('')}</tbody></table></div>`);
    } else if (hasLocal && !noTax){   // hasLocal ignores "no local tax" (Texas)
      local = sec(`Local taxes in ${esc(name)}`, `<p>${esc(st.note)}. CarFinder uses ${pct(st.rate)} as a typical combined rate for ${esc(name)} until its city and county table is added; your dealer will charge the rate for your address. California and New York already have every city and county.</p>`);
    }
    const ex = sec(`Worked example: a ${rav.year} Toyota RAV4`, `<p>The RAV4 lists at ${$(rav.price)} to ${$(rav.top)} plus a ${$(rav.dest)} destination charge. Dealers are selling it ${esc(E.BAND && rav.mkt ? ['at or above sticker','a little under sticker','well under sticker'][['hot','steady','deals'].indexOf(rav.mkt)] : 'around sticker')} this month (${$(o.dlo)} to ${$(o.dhi)} for the base trim), so in ${esc(name)}${T ? ' at the ' + pct(st.rate) + ' average' : ''}:</p>
<div class="receipt"><header><span>${rav.year} Toyota RAV4, base trim</span><span>${esc(name)}</span></header><dl>
<div><dt>Dealer price, base trim</dt><dd>${$(o.dlo)} – ${$(o.dhi)}</dd></div>
<div><dt>${esc(rule.tax)}${code === 'DC' ? ' (rate for this car: see the app)' : ''}</dt><dd>${$(taxLo)} – ${$(taxHi)}</dd></div>
<div><dt>Dealer doc fee (typical)</dt><dd>${$(st.doc)}</dd></div>
<div><dt>Title, registration, plates (estimate)</dt><dd>${$(350)}</dd></div>
<div class="total"><dt>Drive-off price</dt><dd>${$(o.lo)} – ${$(o.hi)}</dd></div>
<div class="after"><dt>Same car with a ${$(15000)} trade-in</dt><dd${noTax || !(saved > 0.5) ? ' class="word"' : ''}>${noTax ? 'no tax to reduce' : saved > 0.5 ? `${$(oT.lo)} – ${$(oT.hi)}<small>saves ${$(saved)} in tax</small>` : 'no tax saving'}</dd></div>
</dl></div><p>The trade-in pays part of the price as well; the drive-off figures above are before you hand it over. <a href="${appLink(code)}">Price any car in ${esc(name)}</a>, with your own trade-in under <i>Cost assumptions</i>.</p>`);
    const faq = [
      [`What is the car sales tax in ${name}?`, rateLine.replace(/<[^>]+>/g, '')],
      [`Does ${name} give a trade-in tax credit?`, noTax ? `There is no state tax on the purchase to reduce.` : (tradeLine.replace(/<[^>]+>/g, '').trim() + (saved > 0.5 ? ` On a Toyota RAV4 a $15,000 trade-in saves about ${$(saved)}.` : ''))],
      [`How much are dealer doc fees in ${name}?`, `Typically about ${$(st.doc)}${/doc fee capped/i.test(st.note) ? '; the state caps them' : '; it is a dealer charge, so ask for it before you sign'}.`]
    ];
    const srcs = [[st.src, st.srcName || st.src, `State rate · as of ${fmtDate(ratesAsOf)}`], rule.src && [rule.src[0], rule.src[1], `Trade-in rule · checked ${fmtDate(ruleAsOf)}`]].concat(T ? [[T.src[0], T.src[1], `Local rates · effective ${fmtDate(T.asof)}`]] : []).filter(x => x && x[0]);
    const body = `${ex}${local}
${sec('Common questions', `<dl class="faq">${faq.map(([q, a]) => `<div><dt>${esc(q)}</dt><dd>${esc(a)}</dd></div>`).join('')}</dl>`)}
${sec('Sources', `<ol class="sources">${srcs.map(([u, t, w]) => `<li><span class="when">${w}</span>${link(u, t)}</li>`).join('')}</ol><p>See also: <a href="{{UP}}trade-in-credit/${s.slug}/">Does ${esc(name)} give a trade-in tax credit?</a> · <a href="{{UP}}tax/">Car sales tax in every state</a> · <a href="{{UP}}methodology.html#us">How we calculate</a>. Spot something wrong? <a href="https://github.com/destinjones/carfinder/issues/new?template=wrong-price.yml">Tell us</a>.</p>`)}`;
    pages[`tax/${s.slug}/index.html`] = shell({
      title: `Car sales tax in ${name} (2026): rate, trade-in rule, fees | CarFinder`,
      desc: `${rateLine.replace(/<[^>]+>/g, '')}${tradeLine.replace(/<[^>]+>/g, '')}`.slice(0, 300),
      canonical: `tax/${s.slug}/`, depth: 2, kicker: 'Car sales tax', code, current: 'tax/',
      crumbs: [['CarFinder', ''], ['Car sales tax by state', 'tax/'], [name, `tax/${s.slug}/`]],
      h1: `Car sales tax in ${esc(name)}`, lede: answer + `<div class="actions"><a class="btn primary" href="${appLink(code)}">Price a car in ${esc(name)}</a><a class="btn" href="{{UP}}trade-in-credit/${s.slug}/">${esc(name)} trade-in rule</a></div>` + facts,
      body, jsonld: [{'@context':'https://schema.org','@type':'FAQPage', mainEntity: faq.map(([q, a]) => ({'@type':'Question', name:q, acceptedAnswer:{'@type':'Answer', text:a}}))}]
    });

    // trade-in page
    const sizes = [5000, 10000, 15000, 25000];
    const verdict = noTax ? `There is nothing to credit: ${esc(rule.why)}` : rule.trade === 'none' ? `<b>No.</b> ${esc(rule.why)} A trade-in still lowers what you pay, but not your tax.`
      : typeof rule.trade === 'number' ? `<b>Yes, up to a cap.</b> ${esc(rule.why)}` : `<b>Yes.</b> ${esc(rule.why || name + ' taxes the price less the trade-in.')}`;
    const s15 = saveAt(s, 40000, 15000);
    const tAnswer = `<p class="answer">${verdict}${!noTax ? ` On a ${$(40000)} car, a ${$(15000)} trade-in ${s15 > 0.5 ? `saves you about <b>${$(s15)}</b> in ${esc(rule.tax.toLowerCase().replace('(tavt)', '(TAVT)'))}` : 'saves no tax'}.` : ''}</p>`;
    const tFacts = sticker([['Trade-in credit', tradeWord(rule), /^(Yes|No)$/.test(tradeWord(rule)) ? '' : 'txt'], [esc(rule.tax), noTax ? '0%' : code === 'DC' ? '1–11%' : pct(st.rate)], [`Saved on a ${$(15000)} trade`, $(s15 > 0.5 ? s15 : 0), true], ['Rule checked', fmtDate(ruleAsOf), 'txt']]);
    const others = ST.filter(x => x.rule.trade === 'none' || typeof x.rule.trade === 'number').filter(x => x.code !== code);
    const tBody = `${noTax ? '' : sec(`What a trade-in saves in ${esc(name)}`, `<p>Tax at ${code === 'DC' ? 'the excise rate' : pct(st.rate)} on a ${$(40000)} purchase${code === 'SC' ? ', with South Carolina’s $500 cap on the fee' : ''}:</p>
<div class="tbl fit" tabindex="0" role="region" aria-label="Tax saved by trade-in size"><table><thead><tr><th>Trade-in value</th><th class="num">Taxed on</th><th class="num">Tax</th><th class="num">Saved</th></tr></thead><tbody>
<tr><td class="rate">No trade-in</td><td class="num">${$(40000)}</td><td class="num">${$(E.usTax(st, 40000, rav, 0))}</td><td class="num">–</td></tr>
${sizes.map(t => { const taxable = rule.trade === 'none' ? 40000 : 40000 - (typeof rule.trade === 'number' ? Math.min(t, rule.trade) : t); return `<tr><td class="rate">${$(t)}</td><td class="num">${$(taxable)}</td><td class="num">${$(E.usTax(st, 40000, rav, t))}</td><td class="num">${$(saveAt(s, 40000, t))}</td></tr>`; }).join('')}
</tbody></table></div><p>${code === 'DC' ? 'DC’s rate depends on the car’s weight and mpg; this table uses a mid-size car. ' : ''}The trade-in still pays for part of the car in every state; the difference is only whether it also cuts the tax. To see it on a real car, enter your trade-in under <i>Cost assumptions</i> in <a href="${appLink(code)}">CarFinder for ${esc(name)}</a>.</p>`)}
${sec('States that tax the full price', `<p>Most states tax the price less the trade-in. These don’t, or cap the credit:</p><ul class="index">${others.map(x => `<li><a href="{{UP}}trade-in-credit/${x.slug}/">${esc(x.name)}</a><span class="rule">${esc(tradeWord(x.rule).toLowerCase())}</span></li>`).join('')}</ul>`)}
${sec('Source', `<ol class="sources">${rule.src ? `<li><span class="when">Trade-in rule · checked ${fmtDate(ruleAsOf)}</span>${link(rule.src[0], rule.src[1])}</li>` : ''}</ol><p>Rules differ for private sales, leases and some vehicle types; ask the dealer to show the taxable amount on the buyer’s order. See also <a href="{{UP}}tax/${s.slug}/">car sales tax in ${esc(name)}</a> and <a href="{{UP}}trade-in-credit/">every state’s rule</a>.</p>`)}`;
    pages[`trade-in-credit/${s.slug}/index.html`] = shell({
      title: `Does ${name} give a trade-in tax credit? (2026) | CarFinder`,
      desc: tAnswer.replace(/<[^>]+>/g, '').trim().slice(0, 300),
      canonical: `trade-in-credit/${s.slug}/`, depth: 2, kicker: 'Trade-in tax credit', code, current: 'trade-in-credit/', wide: true,
      crumbs: [['CarFinder', ''], ['Trade-in tax credit by state', 'trade-in-credit/'], [name, `trade-in-credit/${s.slug}/`]],
      h1: `Does ${esc(name)} give a trade-in tax credit?`, lede: tAnswer + `<div class="actions"><a class="btn primary" href="${appLink(code)}">Price a car with your trade-in</a><a class="btn" href="{{UP}}tax/${s.slug}/">${esc(name)} car sales tax</a></div>` + tFacts,
      body: tBody, jsonld: [{'@context':'https://schema.org','@type':'FAQPage', mainEntity:[{'@type':'Question', name:`Does ${name} give a trade-in tax credit?`, acceptedAnswer:{'@type':'Answer', text:tAnswer.replace(/<[^>]+>/g, '').trim()}}]}]
    });
  }

  // hubs
  const hubTax = sec('Every state', `<div class="tbl pin" tabindex="0" role="region" aria-label="Car sales tax in every state"><table><thead><tr><th>State</th><th>Tax on a car</th><th class="num">Rate used</th><th>Trade-in credit</th><th class="num">Typical doc fee</th></tr></thead><tbody>${ST.map(s => `<tr><td><a href="${s.slug}/"><b>${esc(s.name)}</b></a> <small class="code">${s.code}</small></td><td>${esc(s.rule.tax)}${E.usLocalTable(s.code) ? ' <small>(every city and county)</small>' : ''}</td><td class="num">${s.code === 'DC' ? '1–11%' : pct(s.st.rate)}</td><td><a href="../trade-in-credit/${s.slug}/">${esc(tradeWord(s.rule))}</a></td><td class="num">${$(s.st.doc)}</td></tr>`).join('')}</tbody></table></div><p class="fine">Rates as of ${fmtDate(ratesAsOf)}; where a state also has county and city taxes the rate shown is a typical combined rate, and California and New York are priced by city or county. Every state page cites its sources. Generated from <a href="https://github.com/destinjones/carfinder/blob/main/data/states_us.json">data/states_us.json</a> and <a href="https://github.com/destinjones/carfinder/blob/main/data/us_tax.json">data/us_tax.json</a>.</p>`);
  pages['tax/index.html'] = shell({title:'Car sales tax by state (2026): rates, trade-in rules, fees | CarFinder', desc:'What every US state and DC charges on a car purchase: the tax and its name (sales tax, TAVT, highway use tax, excise), the rate, whether a trade-in reduces it, and typical doc fees, with sources.', canonical:'tax/', depth:1, kicker:'Car sales tax', code:'US', current:'tax/', crumbs:[['CarFinder', ''], ['Car sales tax by state', 'tax/']], h1:'Car sales tax by state', lede:`<p class="answer">Every state and DC taxes a car purchase differently: most charge sales tax, but Georgia charges a one-time TAVT, North Carolina a 3% highway use tax and South Carolina a fee capped at $500, while Alaska, Montana and New Hampshire charge nothing. ${ST.filter(s => s.rule.trade === 'none').length} states tax the full price even when you trade a car in. Pick a state for its rate, its trade-in rule, a worked example and the sources.</p>` + sticker([['States and DC', String(ST.length)], ['Credit the trade-in', String(ST.filter(s => s.rule.trade === 'full').length)], ['Tax the full price', String(ST.filter(s => s.rule.trade === 'none').length)], ['Rates as of', fmtDate(ratesAsOf), 'txt']]), body:hubTax});
  const group = (f, h) => { const L = ST.filter(f); return `<div class="group"><h3>${h}<span class="n">${L.length}</span></h3><ul class="cols">${L.map(s => `<li><a href="${s.slug}/">${esc(s.name)}</a></li>`).join('')}</ul></div>`; };
  pages['trade-in-credit/index.html'] = shell({title:'Trade-in tax credit by state (2026): which states tax the full price | CarFinder', desc:'Which US states let you subtract your trade-in before tax, which tax the full price (California, Virginia, Hawaii, Oregon, DC) and Michigan’s cap, with what a trade-in saves in each state.', canonical:'trade-in-credit/', depth:1, kicker:'Trade-in tax credit', code:'US', current:'trade-in-credit/', crumbs:[['CarFinder', ''], ['Trade-in tax credit by state', 'trade-in-credit/']], h1:'Trade-in tax credit by state', lede:`<p class="answer">${ST.filter(s => s.rule.trade === 'full').length} states tax the price of a car less your trade-in. ${ST.filter(s => s.rule.trade === 'none').map(s => s.name).join(', ').replace(/, ([^,]*)$/, ' and $1')} tax the full price, Michigan caps the credit at ${$(E.usRule('MI').trade)} in 2026, and Alaska, Montana and New Hampshire have no tax to reduce. On a $40,000 car with a $15,000 trade-in the difference is $900 to $1,500 in tax.</p>` + sticker([['Credit the trade-in', String(ST.filter(s => s.rule.trade === 'full').length)], ['Tax the full price', String(ST.filter(s => s.rule.trade === 'none').length)], ['Credit capped', String(ST.filter(s => typeof s.rule.trade === 'number').length)], ['No tax to reduce', String(ST.filter(s => s.rule.trade === 'notax').length)]]), body:sec('Every state, by rule', `${group(s => s.rule.trade === 'full', 'Tax the price less the trade-in')}${group(s => s.rule.trade === 'none', 'Tax the full price (no credit)')}${group(s => typeof s.rule.trade === 'number', 'Credit capped')}${group(s => s.rule.trade === 'notax', 'No tax to reduce')}<p class="fine">Rules checked ${fmtDate(ruleAsOf)}; each state page cites the state document or the compiled source it comes from. They cover a new car bought from a dealer; private sales and leases can differ.</p>`)});

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
  const body = `${sec('Price rows', `<p>One JSON array per vertical and country; each row is an array in the order documented in <a href="https://github.com/destinjones/carfinder/blob/main/docs/DATA.md">docs/DATA.md</a> (make, model, body, size, price from base to top trim, efficiency, power, seats, drivetrain, the market heat that sets the dealer band, a note and whether the price is an estimate). ${rows.toLocaleString('en-US')} rows in ${files.length} files.</p>
<div class="tbl" tabindex="0" role="region" aria-label="Price files"><table><thead><tr><th>File</th><th>What</th><th class="num">Rows</th></tr></thead><tbody>${files.map(([f, vt, cc, n]) => `<tr><td><a class="file" href="${f}">${f}</a></td><td>${VN[vt]}, ${cc}</td><td class="num">${n.toLocaleString('en-US')}</td></tr>`).join('')}</tbody></table></div>`)}
${sec('Rules and sources', `<div class="tbl" tabindex="0" role="region" aria-label="Rule files"><table><thead><tr><th>File</th><th>What</th></tr></thead><tbody>${rules.map(([f, d]) => `<tr><td><a class="file" href="${f}">${f}</a></td><td>${esc(d)}</td></tr>`).join('')}</tbody></table></div>
<p>How every figure is built from these files, with every table and its source: <a href="../methodology.html">How we calculate</a>. Coverage, measured at every build: <a href="https://github.com/destinjones/carfinder/blob/main/docs/DATA-QUALITY.md">the data-quality scorecard</a> and <a href="https://github.com/destinjones/carfinder/blob/main/docs/data-quality-history.csv">its history</a>.</p>`)}
${sec('Cite it', `<p>Every release is archived on Zenodo. To cite the dataset and app, use the concept DOI, which always resolves to the latest version.</p>
<div class="ref"><div><h3>Concept DOI</h3><p class="doi"><a href="https://doi.org/${doi}">doi.org/${doi}</a></p></div><div><h3>Suggested citation</h3><blockquote>Jones, D. (2026). <i>CarFinder 2026</i> [Data set and software]. Zenodo. https://doi.org/${doi}</blockquote></div><div><h3>Licence</h3><p>MIT, as for the whole repository. The repository’s <a href="https://github.com/destinjones/carfinder/blob/main/CITATION.cff">CITATION.cff</a> has the citation in machine-readable form.</p></div></div>
<p>The prices and rules are compiled from the public sources named in each file; check a figure against its source before relying on it, and <a href="https://github.com/destinjones/carfinder/issues/new?template=wrong-price.yml">report anything wrong</a>.</p>`)}`;
  return shell({title:'CarFinder dataset: vehicle prices and purchase taxes in 11 countries | CarFinder', desc:ld.description, canonical:'data/', depth:1, kicker:'Open data', current:'data/', crumbs:[['CarFinder', ''], ['Dataset', 'data/']], h1:'The dataset', lede:`<p class="answer">Everything CarFinder shows comes from these JSON files: ${rows.toLocaleString('en-US')} new-vehicle price rows in 11 countries and the tax and fee rules applied to them, each US and Indian state rule with its citation. Free to use under the MIT licence and citable by DOI.</p><div class="actions"><a class="btn primary" href="https://doi.org/${doi}">DOI ${doi}</a><a class="btn" href="https://github.com/destinjones/carfinder/tree/main/data">Browse on GitHub</a></div>` + sticker([['Price rows', rows.toLocaleString('en-US')], ['Files', String(files.length + rules.length)], ['Countries', '11'], ['Licence', 'MIT']]) + ``, body, jsonld:[ld]});
}

module.exports = {build, headLinks, siteNav, siteFoot};
