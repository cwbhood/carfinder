"""Layout audit: every country tab (cars) plus four tabs of the motorcycle, boat and aircraft verticals, at phone, tablet and
desktop widths, light and dark.

    python3 test/browser/audit.py [360 390 430 768 1280]     (default: all five)

Fails if any page or element overflows horizontally, any rendered text contains NaN/undefined/null, or the console
reports an error. Prints the controls under 44 px tall as information. Screenshots go to test/browser/_out/.
Needs: pip install playwright && playwright install chromium."""
import asyncio, json, sys
from playwright.async_api import async_playwright
from _serve import serve, OUT

TABS = ['ALL', 'US', 'CA', 'MX', 'BR', 'UK', 'ES', 'RU', 'IN', 'CN', 'TH', 'AU']

JS_TEXT_CHECK = """() => {
  const bad = []; const re = /\\b(NaN|undefined|null)\\b/;
  document.querySelectorAll('.card, .dlg-body, .filters, .toolbar, .results-head').forEach(el => { const t = el.innerText || ''; if (re.test(t)) bad.push(t.slice(0,140).replace(/\\n/g,' | ')); });
  return bad.slice(0,5);
}"""
JS_TAP = """(minPx) => {
  const out = {};
  document.querySelectorAll('button, a, input, select, [role=tab], summary').forEach(el => {
    if (el.closest('[hidden]') || el.hidden) return;
    const cs = getComputedStyle(el); if (cs.display==='none' || cs.visibility==='hidden') return;
    const r = el.getBoundingClientRect(); if (r.width===0 || r.height===0) return;
    const f = el.closest('.filters'); if (f && !f.classList.contains('open') && innerWidth < 960) return;
    const d = el.closest('dialog'); if (d && !d.open) return;
    if (r.height < minPx - 0.5) { const k = (el.className||el.tagName).toString().split(' ').slice(0,2).join('.'); out[k] = (out[k]||0)+1; }
  });
  return out;
}"""
JS_OVERFLOW = """() => {
  const res = {page: [document.documentElement.scrollWidth, innerWidth], els: []};
  const cands = document.querySelectorAll('.card, .card *, .toolbar, .toolbar *, .masthead, .masthead *, .results-head, .cmpbar, .cmpbar *, dialog[open] .dlg-body, dialog[open] .dlg-body *, .filters.open, .filters.open *');
  const seen = new Set();
  cands.forEach(el => {
    if (seen.has(el)) return; seen.add(el);
    const cs = getComputedStyle(el); if (cs.overflowX !== 'visible' && cs.overflowX !== '') return;
    if (el.closest('.cmp-wrap') || el.closest('.chips') || el.closest('.country') || el.closest('.makes')) return;
    const sw = el.scrollWidth, cw = el.clientWidth;
    if (sw > cw + 1 && cw > 0) res.els.push({tag: el.tagName + '.' + (el.className||'').toString().split(' ').join('.'), sw, cw, text: (el.innerText||'').slice(0,60).replace(/\\n/g,' | ')});
    const r = el.getBoundingClientRect();
    if (r.right > innerWidth + 1 && r.width > 0 && cs.position !== 'fixed') res.els.push({tag: el.tagName + '.' + (el.className||'').toString().split(' ').join('.'), right: Math.round(r.right), vw: innerWidth, text: (el.innerText||'').slice(0,60).replace(/\\n/g,' | ')});
  });
  return res;
}"""


async def audit(pw, url, width, height, mobile, scheme):
    browser = await pw.chromium.launch()
    ctx = await browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile, color_scheme=scheme)
    page = await ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    # photos come from Wikimedia Commons; the audit runs offline and aborts those requests, which is not a page error
    page.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type == 'error' and not (m.text.startswith('Failed to load resource') and '127.0.0.1' not in ((m.location or {}).get('url') or '')) else None)
    await page.route('**/*', lambda route: route.continue_() if '127.0.0.1' in route.request.url else route.abort())
    await page.goto(url); await page.wait_for_selector('.card'); await page.evaluate('document.fonts.ready')
    problems = []
    # the car tabs at every width; the motorcycle, boat and aircraft verticals on four tabs (each tab name prefixed with the vertical)
    plan = [('car', cc) for cc in TABS] + [(vt, cc) for vt in ('moto', 'boat', 'air') for cc in ('ALL', 'US', 'IN', 'UK')]
    for vt, cc in plan:
        if (await page.evaluate('VT')) != vt: await page.click(f'.vtab[data-vt="{vt}"]'); await page.wait_for_timeout(150)
        cc_label = cc if vt == 'car' else f'{vt}/{cc}'
        await page.click(f'.ctab[data-country="{cc}"]'); await page.wait_for_timeout(120)
        cc = cc_label
        ov = await page.evaluate(JS_OVERFLOW)
        if ov['page'][0] > ov['page'][1]: problems.append(f'{cc}: page scrollWidth {ov["page"]}')
        if ov['els']: problems.append(f'{cc}: overflow ' + json.dumps(ov['els'][:3]))
        bad = await page.evaluate(JS_TEXT_CHECK)
        if bad: problems.append(f'{cc}: bad text ' + json.dumps(bad))
        taps = await page.evaluate(JS_TAP, 44)
        shot = cc.replace('/', '-')
        if cc in ('ALL', 'US', 'IN', 'moto/US', 'boat/US', 'air/US'): await page.screenshot(path=OUT / f'{shot}-{width}-{scheme}-list.png')
        # detail sheet
        await page.click('.card [data-detail]'); await page.wait_for_timeout(350)
        ov = await page.evaluate(JS_OVERFLOW)
        if ov['els']: problems.append(f'{cc} detail: overflow ' + json.dumps(ov['els'][:3]))
        bad = await page.evaluate(JS_TEXT_CHECK)
        if bad: problems.append(f'{cc} detail: bad text ' + json.dumps(bad))
        if cc in ('ALL', 'US', 'IN', 'moto/US', 'boat/US', 'air/US'): await page.screenshot(path=OUT / f'{shot}-{width}-{scheme}-detail.png')
        await page.keyboard.press('Escape'); await page.wait_for_timeout(60)
        # filter sheet on narrow screens
        if width < 960:
            await page.click('#btnFilters'); await page.wait_for_timeout(350)
            ov = await page.evaluate(JS_OVERFLOW)
            if ov['els']: problems.append(f'{cc} filters: overflow ' + json.dumps(ov['els'][:3]))
            if cc in ('US', 'moto/US', 'boat/US', 'air/US'): await page.screenshot(path=OUT / f'{shot}-{width}-{scheme}-filters.png')
            await page.click('#closeFilters'); await page.wait_for_timeout(350)
        # compare two
        cards = await page.query_selector_all('.card [data-cmp]')
        await cards[0].click(); await cards[1].click(); await page.wait_for_timeout(80)
        await page.click('#btnCompare'); await page.wait_for_timeout(350)
        bad = await page.evaluate(JS_TEXT_CHECK)
        if bad: problems.append(f'{cc} compare: bad text ' + json.dumps(bad))
        await page.keyboard.press('Escape'); await page.wait_for_timeout(60)
        await page.click('#btnClearCmp')
        print(f'  {cc}: ok' if not any(p.startswith(cc + ':') or p.startswith(cc + ' ') for p in problems) else f'  {cc}: PROBLEMS', '· under-44px:', json.dumps(taps) if taps else 'none')
    await page.click('#btnWizard'); await page.wait_for_timeout(200)
    await page.screenshot(path=OUT / f'wizard-{width}-{scheme}.png')
    await page.keyboard.press('Escape')
    await browser.close()
    return problems + errors


async def main():
    combos = [(360, 740, True, 'light'), (390, 844, True, 'dark'), (430, 932, True, 'light'), (768, 1024, True, 'light'), (1280, 800, False, 'light')]
    if len(sys.argv) > 1: combos = [c for c in combos if str(c[0]) in sys.argv[1:]]
    httpd, url = serve()
    failed = False
    async with async_playwright() as pw:
        for c in combos:
            print('=' * 12, f'{c[0]}x{c[1]} {c[3]}')
            problems = await audit(pw, url, *c)
            for p in problems: print('   -', p)
            failed = failed or bool(problems)
    httpd.shutdown()
    print('\nRESULT:', 'FAIL' if failed else 'PASS')
    sys.exit(1 if failed else 0)

asyncio.run(main())
