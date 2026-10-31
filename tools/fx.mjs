#!/usr/bin/env node
/* Pull the exchange rates for a compile date into data/sources.json → fx.perEur[date] and fx.rubPerUsd[date].

     node tools/fx.mjs 2026-10-14          # the ECB rates of that day (a TARGET working day) and the Bank of Russia rate for it
     node tools/fx.mjs 2026-10-14 --set    # also make it the World tab's table (fx.date)

   Sources: the ECB 90-day history (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml, rates per euro)
   and the Bank of Russia daily XML (https://www.cbr.ru/scripts/XML_daily.asp?date_req=DD/MM/YYYY, rubles per dollar),
   because the ECB has not published a ruble reference rate since March 2022. Then set fx.compiledAt[vt] or
   fx.convertedAt[vt] by hand, regenerate the aircraft rows (python3 tools/air.py) and run node src/build.js. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'data/sources.json');
const CCYS = ['USD','GBP','INR','CNY','AUD','MXN','THB','BRL','CAD'];

export function parseEcb(xml, day){
  const block = xml.split(/<Cube time="/).find(s => s.startsWith(day + '"'));
  if (!block) return null;
  const out = {};
  for (const m of block.matchAll(/<Cube currency="([A-Z]{3})" rate="([\d.]+)"/g)) if (CCYS.includes(m[1])) out[m[1]] = parseFloat(m[2]);
  return CCYS.every(c => out[c] > 0) ? out : null;
}
export function parseCbr(xml){
  const m = xml.match(/<Valute[^>]*>\s*<NumCode>840<\/NumCode>[\s\S]*?<Nominal>(\d+)<\/Nominal>[\s\S]*?<Value>([\d,]+)<\/Value>/);
  if (!m) return null;
  return parseFloat(m[2].replace(',', '.')) / parseInt(m[1], 10);
}

async function main(){
  const date = process.argv[2];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) { console.error('usage: node tools/fx.mjs YYYY-MM-DD [--set]'); process.exit(2); }
  const ecbXml = await (await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml')).text();
  const e = parseEcb(ecbXml, date);
  if (!e) { console.error(`no ECB rates for ${date}: not a TARGET working day, or older than 90 days (use eurofxref-hist.xml by hand)`); process.exit(1); }
  const [y, mo, d] = date.split('-');
  const cbrXml = await (await fetch(`https://www.cbr.ru/scripts/XML_daily.asp?date_req=${d}/${mo}/${y}`)).text();
  const rub = parseCbr(cbrXml);
  if (!rub) { console.error('could not read the Bank of Russia USD rate'); process.exit(1); }
  const S = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  S.fx.perEur[date] = e; S.fx.rubPerUsd[date] = rub;
  if (process.argv.includes('--set')) S.fx.date = date;
  // keep the file's hand layout for the fx block only: rewrite that block, leave the rest of the text untouched
  const text = fs.readFileSync(FILE, 'utf8');
  const start = text.indexOf(' "fx": {'), end = text.indexOf('\n },', start) + 4;
  const fxBlock = ' "fx": {\n' + Object.entries(S.fx).map(([k, v]) => {
    if (k === 'perEur') return `  "perEur": {\n${Object.entries(v).sort().map(([dd, r]) => `   ${JSON.stringify(dd)}: ${JSON.stringify(r).replace(/,/g, ', ').replace(/":/g, '": ')}`).join(',\n')}\n  }`;
    if (k === 'rubPerUsd') return `  "rubPerUsd": ${JSON.stringify(Object.fromEntries(Object.entries(v).sort())).replace(/,/g, ', ').replace(/":/g, '": ')}`;
    return `  ${JSON.stringify(k)}: ${JSON.stringify(v).replace(/,/g, ', ').replace(/":/g, '": ')}`;
  }).join(',\n') + '\n },';
  fs.writeFileSync(FILE, text.slice(0, start) + fxBlock + text.slice(end));
  JSON.parse(fs.readFileSync(FILE, 'utf8'));
  console.log(`${date}: ${CCYS.map(c => c + ' ' + e[c]).join(', ')} per euro; RUB ${rub} per dollar${process.argv.includes('--set') ? ' (now the World tab’s table)' : ''}`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch(err => { console.error(err.message); process.exit(1); });
