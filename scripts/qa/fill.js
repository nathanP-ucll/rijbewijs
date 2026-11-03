// Meet per SECTIE van elke paragraafpagina hoe vol ze is (desktop 1440x900 en mobiel 390): meldt (bijna) lege secties.
const { chromium, url } = require('./lib');
(async () => {
  const browser = await chromium.launch();
  const out = { empty: [], total: 0, pages: 0, heights: [] };
  for (const [name, vp, min] of [['desktop', { width: 1440, height: 900 }, 230], ['mobiel', { width: 390, height: 844 }, 260]]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    for (const les of [1, 2, 3, 4]) {
      await page.goto(url(`les${les}.html#p1`)); await page.waitForSelector('.slide');
      const idx = await page.evaluate(() => { const b = window.CURSUS.boeken[document.body.dataset.les].pages; return b.map((p, i) => p.t === 'paragraaf' ? i + 1 : 0).filter(Boolean); });
      for (const i of idx) {
        await page.evaluate((i) => { location.hash = '#p' + i; }, i);
        await page.waitForTimeout(40);
        const m = await page.evaluate(() => Array.from(document.querySelectorAll('.sectie[data-nr]')).map((s) => [s.dataset.nr, Math.round(s.getBoundingClientRect().height), s.querySelector('h2') ? s.querySelector('h2').innerText.slice(0, 30) : '']));
        out.pages++;
        m.forEach(([nr, h, t]) => { out.total++; out.heights.push(h); if (h < min) out.empty.push(`${name} les${les} ${nr} ${h}px ${t}`); });
      }
    }
    console.log(name, 'console-errors:', errs.length, errs.slice(0, 3));
    await ctx.close();
  }
  out.heights.sort((a, b) => a - b);
  console.log('paragraafpagina-metingen:', out.pages, '| secties:', out.total, '| min/mediaan/max hoogte:', out.heights[0], out.heights[Math.floor(out.heights.length / 2)], out.heights[out.heights.length - 1], '| bijna leeg:', out.empty.length);
  console.log(out.empty.slice(0, 40).join('\n'));
  await browser.close();
})();
