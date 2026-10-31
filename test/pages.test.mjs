// The generated pages (tax/<state>/, trade-in-credit/<state>/, their hubs, data/, sitemap.xml) answer their question up front,
// carry valid JSON-LD and a canonical URL, cite their sources, and never print a broken value.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const states = Object.keys(JSON.parse(read('data/states_us.json'))).filter(k => k !== 'US');
const dirs = d => fs.readdirSync(path.join(ROOT, d), {withFileTypes: true}).filter(e => e.isDirectory()).map(e => e.name);

test('a tax page and a trade-in page for every state and DC, each answering in its first paragraph', () => {
  for (const d of ['tax', 'trade-in-credit']) {
    const subs = dirs(d); assert.equal(subs.length, states.length, `${d}/ has one page per state`);
    for (const s of subs) {
      const f = `${d}/${s}/index.html`, h = read(f);
      const answer = (h.match(/<p class="answer">([\s\S]*?)<\/p>/) || [])[1];
      assert.ok(answer, `${f}: an answer paragraph`);
      const words = answer.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean);
      assert.ok(words.length >= 12 && words.length <= 130, `${f}: answer is ${words.length} words`);
      if (d === 'tax') assert.match(answer, /\d+(\.\d+)?%|no state sales tax/, `${f}: the answer names the rate`);
      else assert.match(answer, /<b>(Yes|No|Yes, up to a cap)\.<\/b>|nothing to credit/, `${f}: the answer starts with the verdict`);
      assert.ok(!/undefined|NaN|\[object/.test(h), `${f}: no broken values`);
      assert.match(h, new RegExp(`<link rel="canonical" href="https://destinjones\\.github\\.io/carfinder/${d}/${s}/">`), `${f}: canonical`);
      const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
      assert.ok(ld.some(o => o['@type'] === 'BreadcrumbList') && ld.some(o => o['@type'] === 'FAQPage'), `${f}: breadcrumb and FAQ JSON-LD`);
      assert.match(h, /target="_blank" rel="noopener">[^<]+<\/a><\/li>|<h2>Source<\/h2><p><a /, `${f}: cites a source`);
    }
  }
});

test('the hubs, the dataset page and the sitemap list everything', () => {
  const sm = read('sitemap.xml');
  for (const d of ['tax', 'trade-in-credit']) for (const s of dirs(d)) assert.ok(sm.includes(`/carfinder/${d}/${s}/</loc>`), `sitemap has ${d}/${s}/`);
  assert.equal(new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])).size, [...sm.matchAll(/<loc>/g)].length, 'no duplicate URLs');
  for (const s of dirs('tax')) assert.ok(read('tax/index.html').includes(`href="${s}/"`), `tax hub links ${s}`);
  const data = read('data/index.html');
  const ds = [...data.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])).find(o => o['@type'] === 'Dataset');
  assert.ok(ds && /zenodo/.test(ds.identifier) && ds.distribution.length > 40, 'Dataset JSON-LD with the DOI and every file');
  for (const d of ds.distribution) assert.ok(fs.existsSync(path.join(ROOT, 'data', d.contentUrl.split('/data/')[1])), `${d.contentUrl} exists`);
});
