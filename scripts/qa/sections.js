// Paragraafpagina's: sectie-anker, inhoud-sprong, IntersectionObserver, scrollpositie onthouden. Draait tegen de echte build (--lenient).
const { chromium, url, SHOTS } = require('./lib');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
(async () => {
  const b = await chromium.launch();
  for (const [tag, vp] of [['desktop', { width: 1440, height: 900 }], ['mobiel', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.setDefaultTimeout(8000);
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(url('les1.html#p4')); await p.waitForSelector('.sectie');
    const n = await p.locator('.sectie[data-nr]').count();
    ok(n >= 2, tag + ': paragraafpagina toont ' + n + ' secties onder elkaar');
    ok((await p.textContent('.fb-count')).includes('van'), tag + ': teller telt paragrafen: ' + (await p.textContent('.fb-count')));
    // sectie-anker
    const nr = await p.locator('.sectie[data-nr]').nth(1).getAttribute('data-nr');
    await p.goto(url('les1.html#p4-' + nr)); await p.waitForSelector('.sectie'); await p.waitForTimeout(1800);
    const top = await p.evaluate((nr) => Math.round(document.getElementById('s-' + nr).getBoundingClientRect().top), nr);
    ok(top >= -5 && top < 160, tag + ': #p4-' + nr + ' scrolt naar de sectie (top ' + top + 'px)');
    // observer: huidige sectie gemarkeerd
    await p.getByRole('button', { name: /Inhoud/ }).click();
    ok(await p.locator('.pop-sec.sec-current').count() === 1, tag + ': inhoud markeert huidige sectie');
    ok(await p.locator('.pop-chapter[open] .pop-sec').count() >= n, tag + ': inhoud toont de secties per paragraaf');
    // sprong naar sectie van een andere paragraaf
    const target = p.locator('.pop-chapter[open] .pop-sec').last(); const href = await target.getAttribute('href');
    await target.click(); await p.waitForTimeout(700);
    ok(location_ok(p.url(), href), tag + ': sprong via inhoud naar ' + href + ' (' + p.url().split('/').pop() + ')');
    // scrollpositie onthouden
    await p.goto(url('les1.html#p4')); await p.waitForSelector('.sectie');
    await p.evaluate(() => window.scrollTo(0, 1500)); await p.waitForTimeout(900);
    await p.goto(url('index.html')); await p.goto(url('les1.html')); await p.waitForSelector('.sectie'); await p.waitForTimeout(500);
    const y = await p.evaluate(() => Math.round(window.pageYOffset));
    ok(y > 1000, tag + ': scrollpositie hersteld (' + y + 'px)');
    ok(errs.length === 0, tag + ': geen fouten ' + errs.join('|'));
    await ctx.close();
  }
  await b.close(); console.log('Klaar:', fails, 'mislukt'); process.exit(fails ? 1 : 0);
})();
function location_ok(u, href) { return u.includes(href.split('.html').pop().replace('#', '#')) || u.includes(href.replace(/^.*#/, '#').split('-')[0]); }
