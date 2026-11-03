// Volledige paginascreenshots (fullPage) van opgegeven lespagina's, licht + donker, 1440 en 390.
const { chromium, url, SHOTS } = require('./lib');
const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const scheme of ['light', 'dark']) for (const [n, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, colorScheme: scheme }); const p = await ctx.newPage();
    for (const f of process.argv.slice(2)) { await p.goto(url(f)); await p.waitForTimeout(900); await p.screenshot({ path: `${SHOTS}/full-${scheme}-${n}-${f.replace(/[#.]/g, '_')}.png`, fullPage: true }); }
    await ctx.close();
  }
  await b.close();
})();
