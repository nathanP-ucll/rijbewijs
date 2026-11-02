// Screenshots in lichte en donkere modus van een steekproef paginasjablonen (desktop + mobiel).
const { chromium, url, SHOTS } = require('./lib');
const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['les2.html#p3', 'les2.html#p4'];
(async () => {
  const b = await chromium.launch();
  for (const scheme of ['light', 'dark']) for (const [n, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, colorScheme: scheme }); const p = await ctx.newPage();
    for (const f of pages) { await p.goto(url(f)); await p.waitForTimeout(600); await p.screenshot({ path: `${SHOTS}/theme-${scheme}-${n}-${f.replace(/[#.]/g, '_')}.png` }); }
    await ctx.close();
  }
  await b.close();
})();
