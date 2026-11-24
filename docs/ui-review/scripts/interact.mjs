import { chromium } from 'playwright';
const D='./qa-output/final/interactions'; import fs from 'fs'; fs.mkdirSync(D,{recursive:true});
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const base='http://127.0.0.1:8200';
// Desktop mega menu + industries dropdown
let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base+'/', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Services', exact: true }).click(); await p.waitForTimeout(400);
await p.screenshot({ path: `${D}/mega-menu.png` });
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.getByRole('button', { name: 'Industries', exact: true }).click(); await p.waitForTimeout(400);
await p.screenshot({ path: `${D}/industries-menu.png`, clip: { x: 0, y: 0, width: 1440, height: 520 } });
await p.keyboard.press('Escape');
// sticky compact header
await p.mouse.wheel(0, 1600); await p.waitForTimeout(500);
await p.screenshot({ path: `${D}/sticky-header.png`, clip: { x: 0, y: 0, width: 1440, height: 200 } });
// industry explorer keyboard
await p.goto(base+'/', { waitUntil: 'networkidle' });
const tab = p.getByRole('tab', { name: 'Manufacturing' }); await tab.scrollIntoViewIfNeeded(); await tab.click(); await p.waitForTimeout(500);
console.log('active tab panel heading:', await p.locator('[role=tabpanel] h3').first().textContent());
await p.keyboard.press('ArrowDown'); await p.waitForTimeout(300);
console.log('after ArrowDown:', await p.locator('[role=tabpanel] h3').first().textContent());
await p.close();
// Mobile menu
p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(base+'/', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Open menu' }).click(); await p.waitForTimeout(400);
await p.getByRole('button', { name: 'Services', exact: true }).click(); await p.waitForTimeout(400);
await p.screenshot({ path: `${D}/mobile-menu.png` });
await p.close();
// Assessment end-to-end
p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base+'/assessment/', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Start the assessment' }).click(); await p.waitForTimeout(300);
await p.screenshot({ path: `${D}/assessment-step1.png`, fullPage: false });
const pattern=[[3,2,1],[3,3,2],[2,2,1],[1,0,0],[2,1,2],[0,1,0],[1,2,0]];
for (let s=0;s<7;s++){
  const fs2 = p.locator('fieldset');
  for (let q=0;q<3;q++){ await fs2.nth(q).locator('label').nth(pattern[s][q]).click(); }
  if (s===0) await p.screenshot({ path: `${D}/assessment-step1-answered.png` });
  await p.getByRole('button', { name: s===6 ? 'See my results' : 'Next', exact: true }).click(); await p.waitForTimeout(300);
}
await p.waitForTimeout(600);
await p.screenshot({ path: `${D}/assessment-results.png`, fullPage: true });
console.log('results heading:', await p.locator('h2').filter({hasText:/Initial|Developing|Established|Advanced/}).first().textContent());
await p.close();
p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(base+'/assessment/', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Start the assessment' }).click(); await p.waitForTimeout(500);
await p.screenshot({ path: `${D}/assessment-mobile.png`, fullPage: false });
await b.close();
