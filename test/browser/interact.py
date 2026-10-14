"""Interaction checks on a phone viewport: filters, sort, search, state change, detail sheet and trim slider, compare
flow, show-more and auto-load, wizard, World-tab currency and units, the cars / motorcycles / boats / aircraft switch, persistence
across reload, and the data pass (every card, efficiency string, breakdown and detail sheet for every vehicle in every
vertical renders without NaN/undefined/null).

    python3 test/browser/interact.py        (needs: pip install playwright && playwright install chromium)

Exits 1 if any check fails."""
import asyncio, sys
from playwright.async_api import async_playwright
from _serve import serve, OUT

fails = []
def check(name, cond, info=''):
    print(('  ok   ' if cond else '  FAIL ') + name + ('' if cond else '  -> ' + str(info)))
    if not cond: fails.append(name)

async def main():
    httpd, url = serve(8789)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append('pageerror: '+str(e)))
        # photos come from Wikimedia Commons; the audit runs offline and aborts those requests, which is not a page error
        page.on('console', lambda m: errors.append(m.text) if m.type=='error' and not (m.text.startswith('Failed to load resource') and '127.0.0.1' not in ((m.location or {}).get('url') or '')) else None)
        await page.route('**/*', lambda r: r.continue_() if '127.0.0.1' in r.request.url else r.abort())
        await page.goto(url); await page.wait_for_selector('.card'); await page.evaluate('document.fonts.ready')

        # ---- data pass: every card, every tab of every vertical renders without NaN/undefined/null and effShort is sane
        bad = await page.evaluate("""() => {
          const out = []; const re = /\\b(NaN|undefined|null)\\b/; let n = 0;
          for (const vt of VERTS) for (const cc of Object.keys(DATA[vt])) {
            if (!DATA[vt][cc].length) { out.push(vt+'/'+cc+' has no rows'); continue; }
            setLive(cc, vt); buildChrome(); syncChips(); render();
            for (const c of CARS) {
              n++;
              const h = cardHTML(c); if (re.test(h)) out.push(vt+'/'+cc+' card '+c.make+' '+c.model+': '+h.match(re)[0]);
              const e = effShort(c, CC); if (!e || re.test(e)) out.push(vt+'/'+cc+' eff '+c.make+' '+c.model+': '+e);
              detailCar = c; detailT = 0.5; const p = effPanel(c); if (re.test(p)) out.push(vt+'/'+cc+' effPanel '+c.make+' '+c.model);
              const d = detailDynamic(); if (re.test(d.sticker+d.pay+d.trimVal+d.world)) out.push(vt+'/'+cc+' detail '+c.make+' '+c.model);
              if (!(c.hp>=0) || !(c.seats>0) || !(c.price>0) || !(c.top>=c.price) || (vt!=='boat' && vt!=='air' && !(c.hp>0))) out.push(vt+'/'+cc+' fields '+c.make+' '+c.model+' hp='+c.hp+' seats='+c.seats+' price='+c.price+' top='+c.top);
              const o = bd(c, c.price); if (!(o.lo>0 && o.hi>=o.lo && isFinite(o.hi))) out.push(vt+'/'+cc+' breakdown '+c.make+' '+c.model);
            }
            compare = [0, 1]; openCompare(); if (re.test(document.getElementById('cBody').innerHTML)) out.push(vt+'/'+cc+' compare'); document.getElementById('dlgCompare').close(); compare = [];
          }
          setLive('US', 'car'); document.getElementById('countryTabs').innerHTML = countryTabsHTML(); buildChrome(); syncChips(); render(); return out.slice(0,20).concat(['rows:'+n]);
        }""")
        rows = bad.pop()
        check(f'no NaN/undefined/null in any card, efficiency string, breakdown, compare table or detail sheet ({rows[5:]} vehicles, 4 verticals x 12 tabs)', not bad, bad)

        # ---- vertical switch: bikes and boats get their own filters, chips, wizard and glossary
        await page.click('.vtab[data-vt="moto"]'); await page.wait_for_timeout(200)
        check('bikes: tab counts and title switch', await page.evaluate("() => VT==='moto' && CARS.length > 200 && /Motorcycles/.test(document.title) && document.querySelector('.ctab[data-country=\"US\"] small').textContent.replace(',','') == String(DATA.moto.US.length)"))
        check('bikes: engine-size filter, transmission select, no seats group', await page.evaluate("() => document.getElementById('sizeLbl').textContent==='Engine size' && document.getElementById('driveLbl').textContent==='Transmission' && getComputedStyle(document.getElementById('seatsGroup')).display==='none' && [...document.querySelectorAll('#sizeOpts .opt')].some(b=>b.dataset.v==='Under 125cc')"))
        check('bikes: body chips are bike types', await page.evaluate("() => [...document.querySelectorAll('#bodyChips .chip')].map(b=>b.dataset.body).includes('Scooter') && ![...document.querySelectorAll('#bodyChips .chip')].map(b=>b.dataset.body).includes('SUV')"))
        check('bikes: wizard asks about learner licences', 'learner' in (await page.evaluate("() => document.getElementById('wBody').textContent")))
        check('bikes: glossary has bike terms', 'Twist-and-go' in (await page.evaluate("() => document.getElementById('gBody').textContent")))
        await page.click('#bodyChips .chip[data-body="Scooter"]'); await page.wait_for_timeout(50)
        check('bikes: scooter chip filters', await page.evaluate("() => lastList.length > 5 && lastList.every(c => c.body==='Scooter')"))
        await page.click('#bodyChips .chip[data-body=""]'); await page.wait_for_timeout(50)
        await page.click('.vtab[data-vt="boat"]'); await page.wait_for_timeout(200)
        check('boats: length filter, propulsion select, capacity label, boat sort options', await page.evaluate("() => VT==='boat' && document.getElementById('sizeLbl').textContent==='Length' && document.getElementById('driveLbl').textContent==='Propulsion' && document.getElementById('seatsLbl').textContent==='Capacity' && document.getElementById('optRng').textContent==='Longest boat' && document.getElementById('rngLbl').textContent==='Minimum length'"))
        check('boats: fuel chips say Gas/Sail and cards show length', await page.evaluate("() => [...document.querySelectorAll('#fuelChips .chip')].map(b=>b.textContent).includes('Sail') && /ft \\//.test(document.querySelector('.card .specs').textContent)"))
        await page.evaluate("() => { const r = document.getElementById('rng'); r.value = 26; r.dispatchEvent(new Event('input', {bubbles:true})); }"); await page.wait_for_timeout(80)
        check('boats: minimum-length slider filters and reads in ft/m', await page.evaluate("() => lastList.length > 0 && lastList.every(c => c.len >= 26)") and 'ft /' in (await page.text_content('#rngOut')))
        await page.evaluate("() => document.getElementById('resetAll').click()"); await page.wait_for_timeout(50)
        await page.click('.card [data-detail]'); await page.wait_for_timeout(150)
        check('boats: detail shows on-the-water breakdown with engine hours', await page.evaluate("() => document.getElementById('dlgDetail').open && /on-the-water/i.test(document.getElementById('dBody').textContent) && /hours/i.test(document.getElementById('dBody').textContent)"))
        await page.keyboard.press('Escape'); await page.wait_for_timeout(100)
        await page.click('.vtab[data-vt="air"]'); await page.wait_for_timeout(200)
        check('aircraft: seats filter, engines select, no seats group, range and power sort labels', await page.evaluate("() => VT==='air' && CARS.length > 50 && /Planes, jets/.test(document.title) && document.getElementById('sizeLbl').textContent==='Seats' && document.getElementById('driveLbl').textContent==='Engines' && getComputedStyle(document.getElementById('seatsGroup')).display==='none' && document.getElementById('optRng').textContent==='Longest range' && document.getElementById('optPerhp').textContent==='Cheapest per seat' && document.getElementById('rngLbl').textContent==='Minimum range'"))
        check('aircraft: body chips are aircraft types, fuel chips avgas / Jet-A, price presets in millions', await page.evaluate("() => [...document.querySelectorAll('#bodyChips .chip')].map(b=>b.dataset.body).includes('Helicopter') && [...document.querySelectorAll('#fuelChips .chip')].map(b=>b.textContent).includes('Jet-A') && [...document.querySelectorAll('#pricePresets .opt')].some(b => /M/.test(b.textContent))"))
        check('aircraft: cards show knots with mph and nautical miles with miles', await page.evaluate("() => / kt \\/ \\d+ mph/.test(document.querySelector('.card .specs').textContent) && / nm \\/ /.test(document.querySelector('.card .specs').textContent)"))
        await page.evaluate("() => { const r = document.getElementById('rng'); r.value = 1500; r.dispatchEvent(new Event('input', {bubbles:true})); }"); await page.wait_for_timeout(80)
        check('aircraft: minimum-range slider filters in nautical miles and reads nm/km', await page.evaluate("() => lastList.length > 0 && lastList.every(c => c.rng/1.852 >= 1500)") and 'nm /' in (await page.text_content('#rngOut')))
        await page.evaluate("() => document.getElementById('resetAll').click()"); await page.wait_for_timeout(50)
        await page.click('#bodyChips .chip[data-body="Helicopter"]'); await page.wait_for_timeout(50)
        check('aircraft: helicopter chip filters', await page.evaluate("() => lastList.length > 5 && lastList.every(c => c.body==='Helicopter')"))
        await page.click('#bodyChips .chip[data-body=""]'); await page.wait_for_timeout(50)
        await page.click('.card [data-detail]'); await page.wait_for_timeout(150)
        check('aircraft: detail shows the delivered breakdown with flight hours and avgas or Jet-A', await page.evaluate("() => document.getElementById('dlgDetail').open && /Factory list price/.test(document.getElementById('dBody').textContent) && /flight hours/i.test(document.getElementById('dBody').textContent) && /(avgas|Jet-A|kWh)/.test(document.getElementById('dBody').textContent)"))
        await page.keyboard.press('Escape'); await page.wait_for_timeout(100)
        check('aircraft: wizard asks about flying it yourself and the glossary knows knots', await page.evaluate("() => /fly it yourself/.test(document.getElementById('wBody').textContent) && /nautical/.test(document.getElementById('gBody').textContent)"))
        await page.click('.vtab[data-vt="boat"]'); await page.wait_for_timeout(200)
        await page.reload(); await page.wait_for_selector('.card'); await page.wait_for_timeout(100)
        check('reload restores the vertical', await page.evaluate("() => VT==='boat'"))
        await page.click('.vtab[data-vt="car"]'); await page.wait_for_timeout(200)
        check('back to cars restores car filters', await page.evaluate("() => VT==='car' && document.getElementById('sizeLbl').textContent==='Size' && document.getElementById('driveLbl').textContent==='Drivetrain'"))

        # ---- provenance panel, corrections link and permalinks
        await page.evaluate("() => { S.q = 'rav4'; render(); }"); await page.wait_for_timeout(100)
        await page.click('.card [data-detail]'); await page.wait_for_timeout(150)
        check('detail sheet shows where the price comes from: a build-and-price link, the compile date, a status, the state citation and a prefilled issue link', await page.evaluate("() => { const p = document.querySelector('#dBody .prov'); return !!p && /Price list/.test(p.textContent) && /build & price/.test(p.textContent) && /toyota\\.com\\/configurator/.test(p.querySelector('dd a').href) && /Compiled/.test(p.textContent) && !/Verified/.test(p.textContent) && /(Confirmed|Estimate)/.test(p.textContent) && /Sept 2026/.test(p.textContent) && /source:/.test(p.textContent) && /issues\\/new\\?template=wrong-price/.test(p.querySelector('a[href*=issues]').href) && /vehicle=Toyota/.test(p.querySelector('a[href*=issues]').href) && !!document.getElementById('dCopyBtn'); }"))
        check('the sheet\'s report buttons are tappable (44 px)', await page.evaluate("() => [...document.querySelectorAll('#dBody .prov-act .btn')].every(b => b.offsetHeight >= 44)"))   # offsetHeight: the sheet's slide-in transform scales the client rect for a moment
        check('unlinked sources are marked as such instead of reading like citations', await page.evaluate("() => { const p = document.querySelector('#dBody .prov'); return !!p.querySelector('.nolink') && /not linked/.test(p.textContent); }"))
        check('the copied report carries the vehicle, the region, the figures, the source, the status and the link', await page.evaluate("() => { const t = reportText(detailCar); return /^Wrong price report · CarFinder \\d+\\.\\d+\\.\\d+/.test(t) && /Vehicle: Toyota RAV4/.test(t) && /Region: /.test(t) && /Shown: /.test(t) && /Source: Toyota \\(https:\\/\\/www\\.toyota\\.com/.test(t) && /Compiled: .*(Confirmed|Estimate)/.test(t) && /Link: http.*#v=car/.test(t); }"))
        check('masthead shows the data-as-of date, the version and links to the methodology page', await page.evaluate("() => /as of/.test(document.getElementById('asof').textContent) && !!document.querySelector('#asof a[href^=\"methodology.html\"]') && /v\\d+\\.\\d+\\.\\d+/.test(document.getElementById('asof').textContent) && /estimates/.test(document.getElementById('asof').textContent)"))
        check('the preliminary-pricing filter counts the estimates', await page.evaluate("() => /Include the \\d+ models with preliminary/.test(document.getElementById('showEstLbl').textContent)"))
        check('hash carries the open sheet, the search and the tab', await page.evaluate("() => /^#v=car&cc=US&/.test(location.hash) && /q=rav4/.test(location.hash) && /d=toyota-rav4/.test(location.hash)"))
        hlen = await page.evaluate("() => history.length")
        await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
        check('closing the sheet drops it from the hash and goes back over the entry it added', await page.evaluate("(n) => !/d=/.test(location.hash) && history.length === n", hlen))
        await page.click('.card [data-detail]'); await page.wait_for_timeout(150)
        check('opening a sheet adds one history entry', await page.evaluate("(n) => /d=toyota-rav4/.test(location.hash) && history.length === n", hlen))
        await page.go_back(); await page.wait_for_timeout(300)
        check('the Back button closes the sheet without rebuilding the view', await page.evaluate("() => !document.getElementById('dlgDetail').open && !/d=/.test(location.hash) && S.q === 'rav4' && lastList.every(c => /rav4/i.test(c.model))"))
        await page.go_forward(); await page.wait_for_timeout(300)
        check('Forward reopens it', await page.evaluate("() => document.getElementById('dlgDetail').open && detailCar && /RAV4/.test(detailCar.model) && /d=toyota-rav4/.test(location.hash)"))
        await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
        await page.evaluate("() => { const q = document.getElementById('q'); q.value = 'rav'; q.dispatchEvent(new Event('input')); }"); await page.wait_for_timeout(300)
        check('typing in the search rewrites the entry instead of adding history', await page.evaluate("(n) => /q=rav(&|$)/.test(location.hash) && history.length === n", hlen))
        await page.evaluate("() => { const q = document.getElementById('q'); q.value = 'rav4'; q.dispatchEvent(new Event('input')); }"); await page.wait_for_timeout(300)
        await page.evaluate("() => { S.q = ''; S.body.add('SUV'); S.fuel.add('Hybrid'); S.sort = 'fuel'; compare = [lastList[0].id, lastList[1].id]; render(); }"); await page.wait_for_timeout(100)
        link = await page.evaluate("() => permalink()")
        await page.goto('about:blank'); await page.goto(link); await page.wait_for_selector('.card'); await page.wait_for_timeout(300)   # a genuinely fresh load (a hash-only goto would not reload)
        check('a permalink restores filters, sort and the comparison set on a fresh load', await page.evaluate("() => S.body.has('SUV') && S.fuel.has('Hybrid') && S.sort === 'fuel' && compare.length === 2 && document.getElementById('sort').value === 'fuel' && document.querySelector('#bodyChips .chip[data-body=\"SUV\"]').getAttribute('aria-pressed') === 'true' && lastList.every(c => c.body === 'SUV')"))
        await page.evaluate("() => { location.hash = '#v=boat&cc=AU&r=QLD&b=PWC&est=0'; }"); await page.wait_for_timeout(400)
        check('changing the hash in place switches vertical, country, region and filters', await page.evaluate("() => VT === 'boat' && CC === 'AU' && S.state === 'QLD' && S.body.has('PWC') && S.est === false && lastList.every(c => c.body === 'PWC' && !c.est)"))
        # back to a clean cars/USA page for the rest (a hash-only goto would not reload, and the permalink stored a comparison)
        await page.evaluate("() => { localStorage.removeItem('cf_cmp_US'); localStorage.removeItem('cf_cmp_boat_AU'); localStorage.setItem('cf_vt', JSON.stringify('car')); localStorage.setItem('cf_country', JSON.stringify('US')); }")
        await page.goto('about:blank'); await page.goto(url); await page.wait_for_selector('.card'); await page.wait_for_timeout(200)

        # ---- compare bar hidden with nothing selected
        check('compare bar hidden at start', await page.evaluate("() => getComputedStyle(document.getElementById('cmpbar')).display === 'none'"))
        check('hidden filter groups really hidden (country/units on US tab)', await page.evaluate("() => ['countryGroup','unitsGroup','newGroup'].every(id => getComputedStyle(document.getElementById(id)).display==='none')"))
        check('state select sits in its own row on phones', await page.evaluate("() => document.getElementById('stateWrap').parentElement.id === 'stateRow'"))
        check('inputs are 16px (no iOS zoom)', await page.evaluate("() => [...document.querySelectorAll('input:not([type=range]):not([type=checkbox]), select')].every(el => parseFloat(getComputedStyle(el).fontSize) >= 16)"))

        # ---- filters: preset, slider, brand, reset
        n0 = await page.evaluate("() => lastList.length")
        await page.click('#btnFilters'); await page.wait_for_timeout(350)
        check('filter sheet open and body locked', await page.evaluate("() => document.getElementById('filters').classList.contains('open') && getComputedStyle(document.body).overflow==='hidden'"))
        await page.click('#pricePresets .opt:nth-child(1)'); await page.wait_for_timeout(50)
        n1 = await page.evaluate("() => lastList.length")
        check(f'price preset narrows list ({n0} -> {n1})', 0 < n1 < n0)
        check('apply button shows count', (await page.inner_text('#applyCount')).replace(',','') == str(n1))
        await page.evaluate("() => { const r = document.getElementById('mpg'); r.value = 35; r.dispatchEvent(new Event('input', {bubbles:true})); }")
        await page.wait_for_timeout(80)
        n2 = await page.evaluate("() => lastList.length")
        check(f'mpg slider narrows further ({n1} -> {n2}) and all shown pass', n2 < n1 and await page.evaluate("() => lastList.every(c => c.fuel==='EV' || c.fuel==='Hydrogen' || c.mpg>=35)"))
        check('slider readout text', (await page.inner_text('#mpgOut')) == '35 mpg')
        await page.click('#makes label:nth-child(3) input'); await page.wait_for_timeout(50)
        mk = await page.evaluate("() => [...S.make][0]")
        check('brand checkbox filters to that brand', await page.evaluate("() => lastList.every(c => S.make.has(c.make))"), mk)
        check('filter count badge', (await page.inner_text('#fcount')) == '3')
        await page.click('#resetAll'); await page.wait_for_timeout(50)
        check('reset all restores full list', await page.evaluate("() => lastList.length") == n0)
        await page.keyboard.press('Escape'); await page.wait_for_timeout(350)
        check('Escape closes the sheet and unlocks scroll', await page.evaluate("() => !document.getElementById('filters').classList.contains('open') && getComputedStyle(document.body).overflow!=='hidden'"))

        # ---- chips + sort + search
        await page.click('#bodyChips .chip[data-body="SUV"]'); await page.wait_for_timeout(50)
        check('SUV chip filters', await page.evaluate("() => lastList.every(c => c.body==='SUV') && lastList.length > 50"))
        await page.select_option('#sort', 'hp'); await page.wait_for_timeout(50)
        check('sort by hp is descending', await page.evaluate("() => lastList.every((c,i,a) => i===0 || a[i-1].hp >= c.hp)"))
        check('sorted-by label on phones', 'Sorted by most horsepower' == (await page.inner_text('#sortedLbl')))
        await page.select_option('#sort', 'perhp'); await page.wait_for_timeout(50)
        check('sort per hp ascending', await page.evaluate("() => lastList.every((c,i,a) => i===0 || P(a[i-1])/a[i-1].hp <= P(c)/c.hp + 1e-9)"))
        await page.click('#bodyChips .chip[data-body=""]'); await page.select_option('#sort', 'price-asc')
        await page.fill('#q', 'toyota rav'); await page.wait_for_timeout(300)
        check('search finds the RAV4', await page.evaluate("() => lastList.length>=1 && lastList.every(c => /toyota/i.test(c.make))"))
        check('result title shows query', 'rav' in (await page.inner_text('#resTitle')))
        await page.fill('#q', ''); await page.wait_for_timeout(300)

        # ---- state change updates card price
        before = await page.inner_text('.card .pbox.otd .val')
        await page.select_option('#state', 'TX'); await page.wait_for_timeout(80)
        after = await page.inner_text('.card .pbox.otd .val')
        check(f'state change alters drive-off price ({before} -> {after})', before != after and 'TX' in (await page.inner_text('.card .pbox.otd .lbl')))
        check('region shown in results count', 'Texas' in (await page.inner_text('#resCount')))

        # ---- card tap opens detail; trim slider updates in place
        await page.click('.card .specs'); await page.wait_for_timeout(150)
        check('tapping the card body opens the detail sheet', await page.evaluate("() => document.getElementById('dlgDetail').open"))
        tid = await page.evaluate("() => { const t = document.getElementById('trimRange'); t.dataset.marker='same'; return !!t; }")
        tot0 = await page.inner_text('#dSticker .st-row.total .v')
        await page.evaluate("() => { const t = document.getElementById('trimRange'); t.value = 100; t.dispatchEvent(new Event('input', {bubbles:true})); }")
        await page.wait_for_timeout(50)
        tot1 = await page.inner_text('#dSticker .st-row.total .v')
        check(f'trim slider raises the total ({tot0} -> {tot1}) without rebuilding the slider', tot0 != tot1 and await page.evaluate("() => document.getElementById('trimRange').dataset.marker==='same'"))
        check('detail body not overflowing', await page.evaluate("() => { const b = document.getElementById('dBody'); return b.scrollWidth <= b.clientWidth + 1; }"))
        await page.click('#dCmpBtn'); await page.wait_for_timeout(50)
        check('add to compare from detail', await page.evaluate("() => compare.length===1") and 'Remove' in (await page.inner_text('#dCmpBtn')))
        await page.click('#dlgDetail [data-close]'); await page.wait_for_timeout(100)
        check('detail closes', await page.evaluate("() => !document.getElementById('dlgDetail').open"))
        check('compare bar now visible', await page.evaluate("() => getComputedStyle(document.getElementById('cmpbar')).display !== 'none'"))

        # ---- compare flow
        await page.click('.card:nth-child(2) [data-cmp]'); await page.click('.card:nth-child(3) [data-cmp]'); await page.wait_for_timeout(50)
        check('three selected', (await page.inner_text('#cmpMsg')) == '3 of 4 selected')
        await page.click('#btnCompare'); await page.wait_for_timeout(150)
        check('compare dialog open with 3 columns + swipe hint', await page.evaluate("() => document.getElementById('dlgCompare').open && document.querySelectorAll('.cmp-t thead th').length===4 && !!document.querySelector('.cmp-hint')"))
        await page.click('.cmp-t [data-rm]'); await page.wait_for_timeout(100)
        check('remove inside compare keeps dialog with 2', await page.evaluate("() => document.getElementById('dlgCompare').open && compare.length===2"))
        await page.click('.cmp-t [data-rm]'); await page.wait_for_timeout(100)
        check('dropping below 2 closes compare', await page.evaluate("() => !document.getElementById('dlgCompare').open && compare.length===1"))
        await page.click('#btnClearCmp'); await page.wait_for_timeout(50)
        check('clear hides bar', await page.evaluate("() => getComputedStyle(document.getElementById('cmpbar')).display === 'none'"))

        # ---- show more appends (identity of first card preserved) and auto-load caps at 150
        first_id = await page.evaluate("() => document.querySelector('.card').dataset.id")
        await page.evaluate("() => { document.querySelector('.card').dataset.keep = '1'; }")
        await page.click('#btnMore'); await page.wait_for_timeout(100)
        check('show more appends without rebuilding earlier cards', await page.evaluate("() => document.querySelectorAll('.card').length >= 60 && document.querySelector('.card').dataset.keep==='1'"))
        await page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)"); await page.wait_for_timeout(400)
        await page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)"); await page.wait_for_timeout(400)
        cnt = await page.evaluate("() => document.querySelectorAll('.card').length")
        check(f'scrolling auto-loads more cards ({cnt}) but stops at 150', 90 <= cnt <= 150)
        check('back-to-top button shown after long scroll', await page.evaluate("() => document.getElementById('toTop').classList.contains('show')"))
        await page.click('#toTop'); await page.wait_for_timeout(1800)
        check('back to top scrolls up', await page.evaluate("() => scrollY < 50"), await page.evaluate("() => scrollY"))

        # ---- wizard
        await page.click('#btnWizard'); await page.wait_for_timeout(100)
        await page.click('#wBudget .opt:nth-child(2)'); await page.click('#wUse .opt[data-v="family"]'); await page.click('#wFuel .opt[data-v="Hybrid"]'); await page.click('#wAwd .opt[data-v="awd"]')
        await page.click('#wGo'); await page.wait_for_timeout(150)
        check('wizard applies filters', await page.evaluate("() => !document.getElementById('dlgWizard').open && S.pmax>0 && S.seats===7 && S.fuel.has('Hybrid') && S.drive==='awd' && lastList.every(c => c.seats>=7 && c.fuels.includes('Hybrid') && /AWD|4WD/.test(c.drive) && c.price <= S.pmax)"))
        check('toast shown', await page.evaluate("() => { const t = document.querySelector('.toast'); return t && !t.hidden; }"))
        await page.evaluate("() => document.getElementById('resetAll').click()")

        # ---- World tab: currency presets, units
        await page.click('.ctab[data-country="ALL"]'); await page.wait_for_timeout(200)
        check('world: USD presets', (await page.evaluate("() => document.querySelector('#pricePresets .opt:nth-child(1)').textContent")) == 'Under $20k')
        await page.select_option('#state', 'INR'); await page.wait_for_timeout(200)
        p1 = await page.evaluate("() => [...document.querySelectorAll('#pricePresets .opt')].map(b=>b.textContent).join(' | ')")
        check(f'world: presets follow currency ({p1})', p1.startswith('Under ₹') and 'L' in p1)
        check('world: placeholder shows currency', (await page.get_attribute('#pmin', 'placeholder')) == 'Min INR')
        await page.evaluate("() => document.querySelector('#pricePresets .opt:nth-child(1)').click()"); await page.wait_for_timeout(80)
        check('world: INR preset yields a sensible subset', await page.evaluate("() => lastList.length > 100 && lastList.length < 1500 && lastList.every(c => c.wprice <= S.pmax)"))
        await page.click('#btnWizard'); await page.wait_for_timeout(50)
        wb = await page.inner_text('#wBudget .opt:nth-child(1)')
        check(f'world: wizard budgets in currency ({wb})', wb.startswith('Under ₹'))
        await page.keyboard.press('Escape'); await page.wait_for_timeout(50)
        await page.select_option('#state', 'USD'); await page.wait_for_timeout(150)
        await page.click('#btnFilters'); await page.wait_for_timeout(350)
        await page.select_option('#wunit', 'mpg'); await page.wait_for_timeout(150)
        eff = await page.evaluate("() => effShort(lastList.find(c=>c.fuel==='EV'), 'ALL') + ' | ' + effShort(lastList.find(c=>c.fuel==='Petrol' && c.l100), 'ALL')")
        check(f'world: mpg units ({eff})', ' mi range' in eff and 'mpg' in eff and 'km' not in eff)
        await page.select_option('#wunit', 'l100'); await page.wait_for_timeout(150)
        await page.click('#closeFilters'); await page.wait_for_timeout(350)
        check('active tab scrolled into view (World is first)', await page.evaluate("() => { const t = document.querySelector('.ctab[aria-selected=true]').getBoundingClientRect(); return t.left >= 0 && t.right <= innerWidth; }"))
        await page.click('.ctab[data-country="AU"]'); await page.wait_for_timeout(200)
        check('Australia tab (last) scrolled into view', await page.evaluate("() => { const t = document.querySelector('.ctab[aria-selected=true]').getBoundingClientRect(); return t.left >= 0 && t.right <= innerWidth; }"))

        # ---- persistence
        await page.select_option('#state', 'VIC'); await page.wait_for_timeout(100)
        await page.reload(); await page.wait_for_selector('.card'); await page.wait_for_timeout(100)
        check('reload restores tab and state', await page.evaluate("() => CC==='AU' && S.state==='VIC'"))

        # ---- rotate to desktop while sheet open -> unlocked
        await page.click('#btnFilters'); await page.wait_for_timeout(350)
        await page.set_viewport_size({'width':1100,'height':800}); await page.wait_for_timeout(200)
        check('widening to desktop closes sheet and unlocks scroll', await page.evaluate("() => !document.getElementById('filters').classList.contains('open') && getComputedStyle(document.body).overflow!=='hidden' && document.getElementById('stateWrap').parentElement.id==='toolbar'"))
        check('desktop: no horizontal overflow', await page.evaluate("() => document.documentElement.scrollWidth <= innerWidth"))

        check('no console/page errors', not errors, errors[:5])
        await browser.close()
    httpd.shutdown()
    print('\nFAILURES:', fails if fails else 'none')
    sys.exit(1 if fails else 0)

asyncio.run(main())
