"""Product video and GIFs for the website, recorded from the built app in headless Chromium.

    python3 brand/tools/record.py          (needs: pip install playwright && playwright install chromium; ffmpeg on PATH)

Writes brand/video/hero.mp4 + hero-poster.jpg (the loop in the landing-page hero), and three GIFs for the
"See it in action" section: state.gif (pick a state, every price moves), verticals.gif (cars → bikes → boats)
and phone.gif (a card, the trim slider and the cost breakdown on a phone). Photos come from Wikimedia Commons,
so the machine recording needs internet access; .github/workflows/record.yml runs this on a GitHub runner.

A fake cursor is drawn into the page so the viewer can follow the clicks (Playwright's video has no pointer)."""
import asyncio, http.server, pathlib, socketserver, subprocess, threading, shutil, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'brand/video'; OUT.mkdir(exist_ok=True)
TMP = OUT / '_raw'; TMP.mkdir(exist_ok=True)
PORT = 8796

CURSOR_JS = """() => {
  const c = document.createElement('div'); c.id = '__cur';
  c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;z-index:99999;pointer-events:none;transition:transform .45s cubic-bezier(.2,.7,.2,1);transform:translate(640px,360px)';
  c.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 3l14 9-6 1.5L9.5 20 7 13.5 5 3z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.appendChild(c);
  window.__cur = (x, y) => { c.style.transform = `translate(${x}px,${y}px)`; };
  window.__pulse = (x, y) => { const p = document.createElement('div'); p.style.cssText = `position:fixed;left:${x-14}px;top:${y-14}px;width:28px;height:28px;border-radius:50%;border:3px solid #2957d6;z-index:99998;pointer-events:none;animation:__pl .5s ease-out forwards`; document.body.appendChild(p); setTimeout(()=>p.remove(), 600); };
  const st = document.createElement('style'); st.textContent = '@keyframes __pl{from{transform:scale(.4);opacity:.9}to{transform:scale(1.8);opacity:0}}'; document.head.appendChild(st);
}"""


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(('127.0.0.1', PORT), lambda *a, **k: Quiet(*a, directory=str(ROOT), **k))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


class Actor:
    """glide the fake cursor to an element or point, then click; pause between steps so the viewer can read"""
    def __init__(self, page): self.page = page

    async def setup(self):
        await self.page.evaluate(CURSOR_JS)

    async def glide(self, sel_or_xy, hold=0.55):
        if isinstance(sel_or_xy, str):
            el = self.page.locator(sel_or_xy).first
            await el.scroll_into_view_if_needed()
            box = await el.bounding_box()
            x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
        else:
            x, y = sel_or_xy
        await self.page.evaluate('([x,y]) => window.__cur(x,y)', [x, y])
        await self.page.wait_for_timeout(int(hold * 1000))
        return x, y

    async def click(self, sel_or_xy, hold=0.55, after=0.9):
        x, y = await self.glide(sel_or_xy, hold)
        await self.page.evaluate('([x,y]) => window.__pulse(x,y)', [x, y])
        await self.page.mouse.click(x, y)
        await self.page.wait_for_timeout(int(after * 1000))

    async def pause(self, s): await self.page.wait_for_timeout(int(s * 1000))

    async def scroll(self, px, steps=12, step_ms=40):
        for _ in range(steps):
            await self.page.mouse.wheel(0, px / steps)
            await self.page.wait_for_timeout(step_ms)

    async def wait_photos(self, timeout=2500):
        try:
            await self.page.wait_for_function("() => [...document.querySelectorAll('.card img')].slice(0,9).every(i => i.complete)", timeout=timeout)
        except Exception:
            pass
        await self.pause(0.4)


async def record(browser, name, width, height, mobile, scheme, steps):
    ctx = await browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1, is_mobile=mobile, has_touch=mobile,
                                    color_scheme=scheme, record_video_dir=str(TMP), record_video_size={'width': width, 'height': height})
    page = await ctx.new_page()
    await page.goto(f'http://127.0.0.1:{PORT}/carfinder.html'); await page.wait_for_selector('.card'); await page.evaluate('document.fonts.ready')
    a = Actor(page); await a.setup(); await a.wait_photos()
    await steps(page, a)
    video = page.video
    await ctx.close()
    path = pathlib.Path(await video.path())
    dst = TMP / f'{name}.webm'; shutil.move(str(path), dst)
    print('recorded', dst, f'{dst.stat().st_size // 1024} KB')
    return dst


# ---------- scenes ----------
async def hero(page, a):
    await a.pause(1.2)
    await a.scroll(420, steps=16); await a.pause(0.6); await a.wait_photos(4000)
    await a.scroll(-420, steps=16); await a.pause(0.4)
    await a.click('#state', after=0.3)
    await page.select_option('#state', 'TX'); await page.keyboard.press('Escape'); await a.pause(1.4)
    await a.click('.card:nth-child(1) [data-detail]', after=1.3)
    await a.glide(('#trimRange')); await page.evaluate("() => { const t = document.getElementById('trimRange'); let v = 0; const id = setInterval(() => { v += 5; t.value = v; t.dispatchEvent(new Event('input', {bubbles:true})); if (v >= 100) clearInterval(id); }, 45); }")
    await a.pause(2.2)
    await page.evaluate("() => document.getElementById('dBody').scrollTo({top: 420, behavior: 'smooth'})"); await a.pause(1.6)
    await a.click('#dlgDetail [data-close]', after=0.6)
    await a.click('.vtab[data-vt="moto"]', after=0.8); await a.wait_photos(5000); await a.pause(0.6)
    await a.click('.ctab[data-country="IN"]', after=0.8); await a.wait_photos(5000); await a.scroll(300, steps=12); await a.pause(0.8)
    await a.click('.vtab[data-vt="boat"]', after=0.8); await a.wait_photos(5000); await a.scroll(300, steps=12); await a.pause(1.2)
    await a.click('.vtab[data-vt="car"]', after=0.8); await a.wait_photos(4000); await a.pause(1.0)


async def state_scene(page, a):
    await a.pause(0.8)
    await a.click('#state', after=0.3); await page.select_option('#state', 'CA'); await page.keyboard.press('Escape'); await a.pause(1.6)
    await a.click('#state', after=0.3); await page.select_option('#state', 'TX'); await page.keyboard.press('Escape'); await a.pause(1.6)
    await a.click('#state', after=0.3); await page.select_option('#state', 'OR'); await page.keyboard.press('Escape'); await a.pause(1.6)
    await a.click('#bodyChips .chip[data-body="SUV"]', after=1.0); await a.wait_photos(4000)
    await a.click('#fuelChips .chip[data-fuel="Hybrid"]', after=1.4); await a.wait_photos(4000); await a.pause(0.8)


async def verticals_scene(page, a):
    await a.pause(0.8)
    await a.click('.vtab[data-vt="moto"]', after=1.0); await a.wait_photos(5000); await a.pause(0.6)
    await a.click('#bodyChips .chip[data-body="Scooter"]', after=1.4); await a.wait_photos(4000)
    await a.click('.vtab[data-vt="boat"]', after=1.0); await a.wait_photos(5000); await a.pause(0.6)
    await a.click('#bodyChips .chip[data-body="PWC"]', after=1.4); await a.wait_photos(4000)
    await a.click('.vtab[data-vt="car"]', after=1.0); await a.wait_photos(4000); await a.pause(0.6)


async def phone_scene(page, a):
    await a.pause(0.8)
    await a.scroll(260, steps=10); await a.pause(0.6)
    await a.click('.card:nth-child(1) .specs', after=1.2)
    await page.evaluate("() => { const t = document.getElementById('trimRange'); let v = 0; const id = setInterval(() => { v += 5; t.value = v; t.dispatchEvent(new Event('input', {bubbles:true})); if (v >= 100) clearInterval(id); }, 45); }")
    await a.pause(2.0)
    await page.evaluate("() => document.getElementById('dBody').scrollTo({top: 520, behavior: 'smooth'})"); await a.pause(1.8)
    await page.evaluate("() => document.getElementById('dBody').scrollTo({top: 1100, behavior: 'smooth'})"); await a.pause(1.8)
    await a.click('#dlgDetail [data-close]', after=0.8)
    await a.click('#btnFilters', after=1.2)
    await a.click('#pricePresets .opt:nth-child(2)', after=1.2)
    await a.click('#applyFilters', after=1.2); await a.wait_photos(4000)


def ffmpeg(*args):
    cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + [str(a) for a in args]
    subprocess.run(cmd, check=True)


def encode(src, name, kind, fps=12, width=720, start=1.2, dur=None):
    """the first second of every recording is the page before its fonts arrive, so it is cut"""
    if kind == 'mp4':
        ffmpeg('-ss', str(start), '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', '-r', '30', '-vf', 'scale=1280:-2', OUT / f'{name}.mp4')
        ffmpeg('-ss', '2', '-i', OUT / f'{name}.mp4', '-frames:v', '1', '-q:v', '3', OUT / f'{name}-poster.jpg')
    else:
        seg = ['-ss', str(start)] + (['-t', str(dur)] if dur else [])
        vf = f'fps={fps},scale={width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle'
        ffmpeg(*seg, '-i', src, '-vf', vf, '-loop', '0', OUT / f'{name}.gif')
    out = OUT / (f'{name}.mp4' if kind == 'mp4' else f'{name}.gif')
    print('wrote', out, f'{out.stat().st_size // 1024} KB')


async def main():
    httpd = serve()
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        h = await record(browser, 'hero', 1280, 720, False, 'light', hero)
        s = await record(browser, 'state', 1280, 720, False, 'light', state_scene)
        v = await record(browser, 'verticals', 1280, 720, False, 'dark', verticals_scene)
        p = await record(browser, 'phone', 390, 844, True, 'light', phone_scene)
        await browser.close()
    httpd.shutdown()
    encode(h, 'hero', 'mp4')
    encode(s, 'state', 'gif', fps=8, width=640)
    encode(v, 'verticals', 'gif', fps=8, width=640)
    encode(p, 'phone', 'gif', fps=10, width=300)
    shutil.rmtree(TMP, ignore_errors=True)

if __name__ == '__main__':
    asyncio.run(main())
