#!/usr/bin/env node
/* Assemble the app from its three parts: src/head.html (markup + CSS), src/script.html (the code) and data/*.json.

     node src/build.js               -> carfinder.html   (complete page for the website; self-hosted fonts)
     node src/build.js --artifact    -> dist/carfinder-artifact.html  (bare fragment for a claude.ai artifact,
                                         which supplies its own document skeleton; fonts from Google Fonts)
     node src/build.js --check       -> build to memory and exit 1 if carfinder.html on disk is out of date

   Also writes methodology.html (the "How we calculate" page) from the same data (src/methodology.js), sw.js and the
   measured data-quality scorecard docs/DATA-QUALITY.md (src/quality.js).
   The data is inlined so the page works from a file:// URL and offline once loaded. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SITE = 'https://destinjones.github.io/carfinder/';
const DESC = 'Every new car, truck, motorcycle, scooter, boat, plane, jet and helicopter on sale in the USA, India, China, the UK, Australia, Mexico, Spain, Thailand, Russia, Brazil and Canada: list price, what dealers really charge, and the on-road price for your state or city. Photos, filters, compare, fuel economy and EV range. Free, open source, no account.';

const VERSION = '1.3.0';                 // bump with CHANGELOG.md and the git tag
const crypto = require('crypto');
const CCS = ['US','IN','CN','UK','AU','MX','ES','TH','RU','BR','CA'];
const exists = p => fs.existsSync(path.join(ROOT, p));

function assemble(){
  let script = read('src/script.html');
  /* four verticals × eleven countries; a missing motorcycle, boat or aircraft file is an empty tab, a missing car file is an error */
  for (const [tag, file, required] of [['CARS','cars',true], ['MOTO','moto',false], ['BOAT','boat',false], ['AIR','air',false]]){
    for (const cc of CCS){
      const ph = `/*__${tag}_${cc}__*/[]`;
      if (!script.includes(ph)) throw new Error('placeholder missing: ' + ph);
      const f = `data/${file}_${cc.toLowerCase()}.json`;
      if (!exists(f)){ if (required) throw new Error('missing ' + f); continue; }
      script = script.replace(ph, JSON.stringify(JSON.parse(read(f))));
    }
  }
  const obj = (ph, f) => { if (!script.includes(ph)) throw new Error('placeholder missing: ' + ph); if (exists(f)) script = script.replace(ph, JSON.stringify(JSON.parse(read(f)))); };
  obj('/*__STATES_US__*/{}', 'data/states_us.json');
  obj('/*__STATES_IN__*/{}', 'data/states_in.json');
  obj('/*__US_TAX__*/{}', 'data/us_tax.json');
  obj('/*__US_LOCAL__*/{}', 'data/us_local.json');
  obj('/*__VFEES__*/{}', 'data/vfees.json');
  obj('/*__IMAGES__*/{}', 'data/images.json');
  obj('/*__SOURCES__*/{}', 'data/sources.json');
  if (!script.includes('/*__APP_VERSION__*/')) throw new Error('placeholder missing: /*__APP_VERSION__*/');
  script = script.replace('/*__APP_VERSION__*/', VERSION);
  const body = read('src/head.html').replace('/*__VERSION__*/', 'v' + VERSION) + script;
  const js = body.match(/<script>([\s\S]*)<\/script>/)[1];
  new Function(js);                                   // syntax check; throws on a parse error
  return body;
}

const GOOGLE_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap">`;

function page(body){
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#eef1f4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1317" media="(prefers-color-scheme: dark)">
<title>CarFinder 2026 · every new car, bike, boat and plane, what it really costs</title>
<meta name="description" content="${DESC}">
<meta name="author" content="Destin Jones">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${SITE}carfinder.html">
<link rel="icon" href="brand/emblem/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="brand/emblem/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CarFinder 2026">
<meta property="og:url" content="${SITE}carfinder.html">
<meta property="og:title" content="CarFinder 2026 · every new car, bike, boat and plane, what it really costs">
<meta property="og:description" content="${DESC}">
<meta property="og:image" content="${SITE}brand/social/og-1200x630.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="CarFinder 2026 · every new car, bike, boat and plane, what it really costs">
<meta name="twitter:description" content="${DESC}">
<meta name="twitter:image" content="${SITE}brand/social/og-1200x630.png">
<link rel="stylesheet" href="brand/fonts/fonts.css">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebApplication","name":"CarFinder 2026","url":"${SITE}carfinder.html","applicationCategory":"ReferenceApplication","operatingSystem":"Any (web browser)","browserRequirements":"Requires JavaScript","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"description":"${DESC}","creator":{"@type":"Person","name":"Destin Jones","url":"${SITE}about.html"},"codeRepository":"https://github.com/destinjones/carfinder","license":"https://opensource.org/licenses/MIT"}
</script>
</head>
<body>
${body}
</body>
</html>
`;
}

const mode = process.argv[2] || '';
const body = assemble();
const methodology = () => require('./methodology.js').build(body);
const staticPages = () => require('./pages.js').build(body);       // tax/<state>/, trade-in-credit/<state>/, their hubs, data/ and sitemap.xml
const quality = () => { const Q = require('./quality.js'); const m = Q.measure(); const hist = exists('docs/data-quality-history.csv') ? read('docs/data-quality-history.csv') : ''; return {md:Q.markdown(m, JSON.parse(read('data/quality-floor.json'))), csv:Q.historyCsv(hist, m, VERSION)}; };
const serviceWorker = pageHTML => read('src/sw.js').replace('/*__SW_VERSION__*/', VERSION + '-' + crypto.createHash('sha1').update(pageHTML).digest('hex').slice(0, 10));
if (mode === '--artifact'){
  fs.mkdirSync(path.join(ROOT, 'dist'), {recursive: true});
  // the artifact lives on another host: site links go absolute and there is no service worker to register
  const out = '<title>CarFinder 2026</title>\n' + GOOGLE_FONTS + '\n' + body
    .replace(/href="(methodology\.html|about\.html|\.\/)/g, (m, f) => `href="${SITE}${f === './' ? '' : f}`)
    .replace(/if \('serviceWorker' in navigator[^\n]*\n/, '');
  fs.writeFileSync(path.join(ROOT, 'dist/carfinder-artifact.html'), out);
  console.log('wrote dist/carfinder-artifact.html', (out.length/1024).toFixed(0), 'KB');
} else if (mode === '--check'){
  const fresh = page(body), onDisk = fs.existsSync(path.join(ROOT, 'carfinder.html')) ? read('carfinder.html') : '';
  if (fresh !== onDisk){ console.error('carfinder.html is out of date: run `node src/build.js` and commit the result'); process.exit(1); }
  const m = methodology(), mDisk = fs.existsSync(path.join(ROOT, 'methodology.html')) ? read('methodology.html') : '';
  if (m !== mDisk){ console.error('methodology.html is out of date: run `node src/build.js` and commit the result'); process.exit(1); }
  const sw = serviceWorker(fresh), swDisk = fs.existsSync(path.join(ROOT, 'sw.js')) ? read('sw.js') : '';
  if (sw !== swDisk){ console.error('sw.js is out of date: run `node src/build.js` and commit the result'); process.exit(1); }
  const q = quality(), qDisk = fs.existsSync(path.join(ROOT, 'docs/DATA-QUALITY.md')) ? read('docs/DATA-QUALITY.md') : '';
  if (q.md !== qDisk){ console.error('docs/DATA-QUALITY.md is out of date: run `node src/build.js` and commit the result'); process.exit(1); }
  const hDisk = exists('docs/data-quality-history.csv') ? read('docs/data-quality-history.csv') : '';
  if (q.csv !== hDisk){ console.error('docs/data-quality-history.csv is out of date: run `node src/build.js` and commit the result'); process.exit(1); }
  const P = staticPages(); const stale = Object.entries(P).filter(([f, h]) => !exists(f) || read(f) !== h).map(([f]) => f);
  if (stale.length){ console.error(`${stale.length} generated pages are out of date (${stale.slice(0, 3).join(', ')}…): run \`node src/build.js\` and commit the result`); process.exit(1); }
  console.log(`carfinder.html, methodology.html, sw.js, docs/DATA-QUALITY.md, docs/data-quality-history.csv and ${Object.keys(P).length} generated pages are up to date`);
} else {
  const out = page(body);
  fs.writeFileSync(path.join(ROOT, 'carfinder.html'), out);
  console.log('wrote carfinder.html', (out.length/1024).toFixed(0), 'KB');
  const m = methodology();
  fs.writeFileSync(path.join(ROOT, 'methodology.html'), m);
  console.log('wrote methodology.html', (m.length/1024).toFixed(0), 'KB');
  fs.writeFileSync(path.join(ROOT, 'sw.js'), serviceWorker(out));
  console.log('wrote sw.js');
  const q = quality();
  fs.writeFileSync(path.join(ROOT, 'docs/DATA-QUALITY.md'), q.md);
  fs.writeFileSync(path.join(ROOT, 'docs/data-quality-history.csv'), q.csv);
  console.log('wrote docs/DATA-QUALITY.md and docs/data-quality-history.csv');
  const P = staticPages();
  for (const [f, h] of Object.entries(P)){ fs.mkdirSync(path.dirname(path.join(ROOT, f)), {recursive: true}); fs.writeFileSync(path.join(ROOT, f), h); }
  console.log('wrote', Object.keys(P).length, 'generated pages (tax/, trade-in-credit/, data/, sitemap.xml)');
}
