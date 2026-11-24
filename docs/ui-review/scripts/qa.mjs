import { chromium } from 'playwright';
import fs from 'fs';
const round = process.argv[2] || 'round1';
const shots = (process.argv[3] || 'full');
const base = 'http://127.0.0.1:8200';
const pages = ['/', '/services/', '/cybersecurity-health-check/', '/nis2-readiness/', '/virtual-ciso/', '/managed-security/', '/security-awareness-training/', '/incident-response-readiness/', '/supplier-security-assurance/', '/industries/', '/assessment/', '/about/', '/resources/', '/resources/nis2-and-the-dutch-cybersecurity-act-what-suppliers-should-prepare/', '/contact/', '/privacy-policy/', '/does-not-exist/'];
const widths = (process.argv[4] || '320,375,390,430,768,1024,1440,1920').split(',').map(Number);
const dir = `./qa-output/${round}`; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const report = [];
for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 800 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push(String(e)));
  for (const u of pages) {
    errs.length = 0;
    await p.goto(base + u, { waitUntil: 'networkidle' });
    // trigger scroll-driven animations to completion
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)); });
    await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    const o = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const over = [];
      document.querySelectorAll('body *').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width && (r.right > vw + 1 || r.left < -1)) {
          // ignore elements inside an overflow-x scroll container or clipped by overflow hidden ancestors
          let a = el.parentElement, clipped = false;
          while (a && a !== document.body) { const cs = getComputedStyle(a); if (['auto','scroll','hidden','clip'].includes(cs.overflowX)) { clipped = true; break; } a = a.parentElement; }
          if (!clipped) over.push(el.tagName + '.' + (el.className?.baseVal ?? el.className).toString().slice(0, 60));
        }
        // clipped text: visible text elements cut off by the viewport edge (ignores intentional horizontal scrollers)
        if (r.width && r.right > vw + 1 && ['H1','H2','H3','P','A','BUTTON','LABEL','LI'].includes(el.tagName) && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden') {
          let a = el.parentElement, scroller = false;
          while (a && a !== document.body) { const ox = getComputedStyle(a).overflowX; if (ox === 'auto' || ox === 'scroll') { scroller = true; break; } a = a.parentElement; }
          if (!scroller) over.push('CLIPPED ' + el.tagName + ':' + (el.textContent || '').trim().slice(0, 40));
        }
      });
      return { scrollW: document.documentElement.scrollWidth, vw, over: [...new Set(over)].slice(0, 6) };
    });
    const name = u === '/' ? 'home' : u.replaceAll('/', '_').replace(/^_|_$/g, '').slice(0, 40);
    if (shots === 'full' && ([390, 1440].includes(w) || (name === 'home'))) {
      await p.screenshot({ path: `${dir}/${name}-${w}.png`, fullPage: true });
    }
    report.push({ w, u, hScroll: o.scrollW > o.vw, scrollW: o.scrollW, over: o.over, errors: [...errs] });
  }
  await ctx.close();
}
await b.close();
fs.writeFileSync(`${dir}/report-${widths.join('_')}.json`, JSON.stringify(report, null, 1));
const bad = report.filter(r => r.hScroll || r.over.length || r.errors.length);
console.log(`checked ${report.length} page×width combos; issues: ${bad.length}`);
for (const r of bad) console.log(r.w, r.u, r.hScroll ? `HSCROLL ${r.scrollW}` : '', r.over.join(' | '), r.errors.join(' | ').slice(0, 200));
