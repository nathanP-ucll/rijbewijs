// Meet hoe vol elke pagina is (desktop 1440x900 en mobiel 390): meldt (bijna) lege en overvolle pagina's.
const { chromium, url, SHOTS } = require('./lib');
const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const out = { empty: [], full: [], total: 0 };
  for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobiel', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    for (const les of [1, 2, 3, 4]) {
      await page.goto(url(`les${les}.html#p1`)); await page.waitForSelector('.slide');
      const n = await page.evaluate(() => window.CURSUS.boeken[window.document.body.dataset.les].pages.length);
      for (let i = 1; i <= n; i++) {
        await page.evaluate((i) => { location.hash = '#p' + i; }, i);
        const m = await page.evaluate(() => { const s = document.querySelector('.slide'); const r = s.getBoundingClientRect(); return { h: Math.round(r.height), t: s.querySelector('h1') ? s.querySelector('h1').innerText.slice(0, 40) : '', type: window.CURSUS.boeken[document.body.dataset.les].pages[(+location.hash.slice(2)) - 1].t }; });
        out.total++;
        const lim = name === 'desktop' ? { min: 330, max: 800 } : { min: 330, max: 2600 };
        if (m.type !== 'intro' && m.type !== 'oef' && m.type !== 'extra' && m.type !== 'eindtest' && m.h < lim.min) out.empty.push(`${name} les${les} p${i} ${m.type} ${m.h}px ${m.t}`);
        if (m.h > lim.max && m.type !== 'oef' && m.type !== 'eindtest') out.full.push(`${name} les${les} p${i} ${m.type} ${m.h}px ${m.t}`);
      }
    }
    console.log(name, 'errors:', errs.length, errs.slice(0, 3));
    await ctx.close();
  }
  console.log('pagina-metingen:', out.total, '| (bijna) leeg:', out.empty.length, '| overvol:', out.full.length);
  console.log(out.empty.slice(0, 40).join('\n')); console.log('--'); console.log(out.full.slice(0, 40).join('\n'));
  await browser.close();
})();
