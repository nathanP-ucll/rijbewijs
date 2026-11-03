// Screenshots per paragraafpagina in stukken (desktop 1440 / mobiel 390), en van de oefenreeks. Gebruik: node paras.js les1.html#p3 ...
const { chromium, url, SHOTS } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const [n, vp, seg] of [['d', { width: 1440, height: 900 }, 1800], ['m', { width: 390, height: 844 }, 2400]]) {
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage();
    for (const f of process.argv.slice(2)) {
      await p.goto(url(f)); await p.waitForSelector('.sectie, .slide'); await p.waitForTimeout(1200);
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      const tag = f.replace(/[#.]/g, '_');
      for (let k = 0, y = 0; y < H && k < 4; k++, y += seg) await p.screenshot({ path: `${SHOTS}/${n}-${tag}-${k + 1}.png`, clip: { x: 0, y, width: vp.width, height: Math.min(seg, H - y) }, fullPage: true });
      if (await p.locator('.series').count()) { await p.locator('.series').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.screenshot({ path: `${SHOTS}/${n}-${tag}-reeks.png` }); }
    }
    await ctx.close();
  }
  await b.close();
})();
