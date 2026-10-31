// The committed carfinder.html must match what src/ and data/ build to, and the page must be a complete document.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('carfinder.html, methodology.html and sw.js are the build of the current sources (run `node src/build.js` after editing src/, data/ or docs/tax-notes/)', () => {
  const r = spawnSync(process.execPath, ['src/build.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

test('the built page is a complete, self-contained document', () => {
  const html = fs.readFileSync(path.join(ROOT, 'carfinder.html'), 'utf8');
  assert.ok(html.startsWith('<!doctype html>'));
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<link rel="stylesheet" href="brand\/fonts\/fonts\.css">/);
  assert.ok(!/fonts\.googleapis\.com/.test(html), 'the website build makes no request to Google Fonts');
  assert.ok(!/__CARS_|__STATES_/.test(html), 'every data placeholder was filled');
  for (const f of html.match(/href="brand\/[^"]+"/g).map(m => m.slice(6, -1))) assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} exists`);
});

test('every page links to files that exist', () => {
  for (const page of ['index.html', 'about.html', 'methodology.html', '404.html']) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const refs = [...html.matchAll(/(?:href|src|srcset|poster)="([^"#?]+)/g)].map(m => m[1]).filter(u => !/^(https?:|mailto:|data:)/.test(u));
    for (const u of refs) for (const part of u.split(',')) { const f = part.trim().split(' ')[0].replace(/^\/carfinder\//, ''); if (f) assert.ok(fs.existsSync(path.join(ROOT, f)), `${page} -> ${f}`); }   // 404.html uses site-absolute paths
  }
});

test('the methodology page covers every country and vertical and carries no template residue', () => {
  const html = fs.readFileSync(path.join(ROOT, 'methodology.html'), 'utf8');
  for (const id of ['prices', 'dates', 'bands', 'us', 'ca', 'mx', 'br', 'uk', 'es', 'ru', 'in', 'cn', 'th', 'au', 'aircraft', 'world', 'corrections']) assert.match(html, new RegExp(`<section id="${id}"`), `section #${id}`);
  for (const vt of ['moto', 'boat', 'air']) assert.ok((html.match(new RegExp(`data/vfees\\.json → [A-Z]{2}\\.${vt}`, 'g')) || []).length === 11, `fee tables for ${vt} in all eleven countries`);
  assert.ok(!/\{\{|undefined|NaN|\[object Object\]/.test(html), 'no placeholder or undefined text');
  assert.ok((html.match(/https?:\/\//g) || []).length > 300, 'hundreds of source links');
  assert.match(html, /ECB euro foreign exchange reference rates/);
});

test('the service worker is stamped with the version and precaches only files that exist', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /const V = 'cf-\d+\.\d+\.\d+-[0-9a-f]{10}'/);
  const pre = sw.match(/const PRECACHE = \[([^\]]+)\]/)[1].match(/'([^']+)'/g).map(x => x.slice(1, -1));
  for (const f of pre) assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} exists`);
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(ROOT, i.src)), `${i.src} exists`);
  assert.equal(manifest.start_url, 'carfinder.html');
});
