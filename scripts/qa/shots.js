// Screenshots (desktop 1440 + mobiel 390) van alle pagina's + console-errors tellen.
const { chromium, url, SHOTS } = require('./lib');
const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html', 'les1.html#p1', 'les1.html#p2', 'les2.html#p3', 'examen.html', 'oefenbank.html', 'spiekbrief.html', 'bronnen.html', 'mijnfouten.html'];
(async () => {
  const browser = await chromium.launch();
  let errs = 0;
  for (const [name, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') { errs++; console.log('CONSOLE ERROR', m.text()); } });
    page.on('pageerror', (e) => { errs++; console.log('PAGE ERROR', e.message); });
    for (const p of pages) {
      await page.goto(url(p)); await page.waitForTimeout(500);
      await page.screenshot({ path: `${SHOTS}/${name}-${p.replace(/[#.]/g, '_')}.png`, fullPage: false });
    }
    await ctx.close();
  }
  await browser.close();
  console.log('errors:', errs, 'shots in', SHOTS);
})();
