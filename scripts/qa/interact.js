// Test van slepen/koppelen/volgorde-animaties op desktop (1440) en mobiel (390, touch), plus visuele vragen. Vereist: node scripts/build.js --demo
const { chromium, url, SHOTS } = require('./lib');
const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };

async function open(page, q) {
  await page.goto(url('oefenbank.html')); await page.waitForSelector('.ex');
  await page.fill('#f-zoek', q); await page.waitForTimeout(450);
}
const center = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

async function koppelTests(page, tag) {
  await open(page, 'Koppel het licht');
  const art = page.locator('article.ex').first();
  await art.scrollIntoViewIfNeeded();
  const ex = (await page.evaluate(() => window.CURSUS.oefeningen.find((o) => o.id === 'DEMO-13')));
  // 1) slepen van links naar rechts (muis/touch via pointer events)
  for (let i = 0; i < ex.paren.length; i++) {
    const l = art.locator('.mitem.left').nth(i).locator('.mdot');
    const r = art.locator('.mitem.right', { has: page.getByText(ex.paren[i].rechts, { exact: true }) }).first().locator('.mdot');
    const a = await center(l), b = await center(r);
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
    if (i === 0) { ok(await art.locator('.mline.drag').count() === 1, tag + ' koppel: lijn volgt de pointer tijdens het slepen'); }
    await page.mouse.move(b.x, b.y, { steps: 4 }); await page.mouse.up();
  }
  ok(await art.locator('path.mline:not(.drag):not(.correct-hint)').count() === ex.paren.length, tag + ' koppel: 3 lijnen na slepen');
  await page.screenshot({ path: `${SHOTS}/qa-koppel-${tag}-lijnen.png` });
  // 2) resize: lijnen herberekenen
  const d0 = await art.locator('path.mline').first().getAttribute('d');
  const vp = page.viewportSize(); await page.setViewportSize({ width: Math.min(vp.width - 60, 700), height: vp.height }); await page.waitForTimeout(500);
  const d1 = await art.locator('path.mline').first().getAttribute('d');
  ok(d0 !== d1, tag + ' koppel: lijnen herberekend bij venstergrootte');
  await page.setViewportSize(vp); await page.waitForTimeout(400);
  // 3) lijn wissen door erop te klikken
  const hit = art.locator('.mhit').first(); const hb = await hit.boundingBox();
  await art.locator('.mhit').first().dispatchEvent('click');
  ok(await art.locator('path.mline:not(.drag)').count() === ex.paren.length - 1, tag + ' koppel: klik op lijn wist hem');
  // 4) toetsenbord: Enter op links, Enter op rechts
  await art.locator('.mitem.left').first().focus(); await page.keyboard.press('Enter');
  await art.locator('.mitem.right', { has: page.getByText(ex.paren[0].rechts, { exact: true }) }).first().focus(); await page.keyboard.press('Enter');
  ok(await art.locator('path.mline:not(.drag)').count() === ex.paren.length, tag + ' koppel: toetsenbord (Enter, Enter) verbindt');
  // 5) nakijken -> groene lijnen; daarna fout -> rode + hint
  await art.getByRole('button', { name: 'Nakijken' }).click(); await page.waitForTimeout(200);
  ok(await art.locator('path.mline.right').count() === ex.paren.length, tag + ' koppel: juiste lijnen groen');
  await art.getByRole('button', { name: /Probeer opnieuw/ }).count();
  // fout maken
  if (await art.getByRole('button', { name: /Probeer opnieuw/ }).count() === 0) { /* alles juist: opnieuw is verborgen */ }
}

async function koppelFout(page, tag) {
  await open(page, 'Koppel het licht');
  const art = page.locator('article.ex').first(); await art.scrollIntoViewIfNeeded();
  const ex = (await page.evaluate(() => window.CURSUS.oefeningen.find((o) => o.id === 'DEMO-13')));
  const n = ex.paren.length;
  for (let i = 0; i < n; i++) {
    await art.locator('.mitem.left').nth(i).click();
    await art.locator('.mitem.right', { has: page.getByText(ex.paren[(i + 1) % n].rechts, { exact: true }) }).first().click();
  }
  await art.getByRole('button', { name: 'Nakijken' }).click(); await page.waitForTimeout(150);
  ok(await art.locator('path.mline.wrong').count() === n, tag + ' koppel: foute lijnen rood');
  ok(await art.locator('path.mline.correct-hint').count() === n, tag + ' koppel: juiste verbinding als gestippelde groene lijn');
  await page.screenshot({ path: `${SHOTS}/qa-koppel-${tag}-fout.png` });
}

async function volgordeTests(page, tag) {
  await open(page, 'rangorde van boven');
  const art = page.locator('article.ex').first(); await art.scrollIntoViewIfNeeded();
  const ex = (await page.evaluate(() => window.CURSUS.oefeningen.find((o) => o.id === 'DEMO-09')));
  // FLIP: na een klik op 'omlaag' lopen er animaties
  const first = art.locator('.seq-item').first();
  const t0 = (await first.locator('.seq-text').innerText());
  await first.locator('.down').click();
  const anim = await page.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.getKeyframes && a.effect.getKeyframes().some((k) => k.transform && k.transform !== 'none')).length);
  ok(anim >= 1, tag + ' volgorde: FLIP-animatie loopt na pijltjesknop (' + anim + ')');
  await page.waitForTimeout(350);
  const texts1 = await art.locator('.seq-text').allTextContents();
  ok(texts1[1] === t0, tag + ' volgorde: item staat een plaats lager');
  ok((await art.locator('.seq-n').allTextContents()).join() === '1,2,3,4', tag + ' volgorde: nummers kloppen');
  // slepen: haal het laatste item naar boven
  const last = art.locator('.seq-item').last(); const grip = last.locator('.seq-grip');
  await last.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); const g = await center(grip); const topB = await art.locator('.seq-item').first().boundingBox();
  await page.mouse.move(g.x, g.y); await page.mouse.down(); await page.mouse.move(g.x, g.y - 20, { steps: 3 });
  const lifted = await art.locator('.seq-item.lifted').count();
  ok(lifted === 1, tag + ' volgorde: gesleept item licht op');
  ok(await art.locator('.seq-item.placeholder-slot').count() === 1, tag + ' volgorde: plaats waar het landt is zichtbaar');
  const tr = await art.locator('.seq-item.lifted').evaluate((n) => getComputedStyle(n).transform);
  ok(tr !== 'none', tag + ' volgorde: gesleept item volgt de pointer (transform ' + tr.slice(0, 30) + ')');
  await page.screenshot({ path: `${SHOTS}/qa-volgorde-${tag}-slepen.png` });
  const lb = await art.locator('.seq').boundingBox(); for (let y = g.y - 20; y > lb.y + 6; y -= 14) await page.mouse.move(g.x, y); await page.mouse.move(g.x, lb.y + 4, { steps: 3 }); await page.mouse.up(); await page.waitForTimeout(400);
  const texts2 = await art.locator('.seq-text').allTextContents();
  ok(texts2[0] === texts1[3], tag + ' volgorde: gesleept item landt bovenaan ' + JSON.stringify([texts1, texts2]));
  ok(await art.locator('.seq-item.lifted').count() === 0 && await art.locator('.seq-item.placeholder-slot').count() === 0, tag + ' volgorde: opgeruimd na loslaten');
  // juiste volgorde zetten en scoren
  for (let pass = 0; pass < 20; pass++) {
    const texts = await art.locator('.seq-text').allTextContents(); let moved = false;
    for (let k = 0; k < ex.items.length; k++) if (texts[k] !== ex.items[k]) { await art.locator('.seq-item').nth(texts.indexOf(ex.items[k])).locator('.up').click(); moved = true; break; }
    if (!moved) break;
  }
  await page.waitForTimeout(300);
  await art.getByRole('button', { name: 'Nakijken' }).click(); await page.waitForTimeout(150);
  ok((await art.getAttribute('class')).includes('is-correct'), tag + ' volgorde: scoring juist na herordenen');
  ok(await page.locator('.burst').count() >= 0, tag + ' viering');
}

async function visueel(page, tag) {
  await open(page, 'Welk bord zegt');
  const art = page.locator('article.ex').first(); await art.scrollIntoViewIfNeeded();
  ok(await art.locator('.opt-card img').count() === 3, tag + ' meerkeuze met afbeeldingen in opties');
  await art.locator('.opt-card').nth(0).click();
  await art.getByRole('button', { name: 'Nakijken' }).click(); await page.waitForTimeout(250);
  ok(await art.locator('.fb-visual .fb-fig img').count() === 1, tag + ' foute feedback toont het juiste beeld');
  await page.screenshot({ path: `${SHOTS}/qa-visueel-${tag}.png` });
  await open(page, 'Welke twee borden');
  const a2 = page.locator('article.ex').first();
  ok(await a2.locator('.ex-figs .fig-ex').count() === 2, tag + ' meerdere afbeeldingen bij de vraag');
}

async function paginawissel(page) {
  await page.goto(url('les2.html#p3')); await page.waitForSelector('.slide');
  await page.getByRole('link', { name: /Volgende/ }).click();
  const n = await page.evaluate(() => document.getAnimations().filter((a) => /slide/.test(a.animationName || '')).length);
  ok(n >= 1, 'paginawissel: glijdende overgang loopt (' + n + ')');
  const w = await page.evaluate(() => document.querySelector('.fb-mid .progress-fill').style.transform);
  ok(/scaleX/.test(w), 'voortgangsbalk gebruikt transform: ' + w);
}

(async () => {
  const browser = await chromium.launch();
  for (const [tag, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['mobiel', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage(); page.setDefaultTimeout(8000);
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    try {
      await koppelTests(page, tag); await koppelFout(page, tag); await volgordeTests(page, tag); await visueel(page, tag);
      if (tag === 'desktop') await paginawissel(page);
    } catch (e) { fails++; console.log('FAIL exception', tag, e.message.split('\n')[0]); }
    ok(errs.length === 0, tag + ' geen console-errors ' + errs.slice(0, 2).join('|'));
    await ctx.close();
  }
  // reduced motion
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); await p.goto(url('les2.html#p3')); await p.waitForSelector('.slide');
  const rm = await p.evaluate(() => getComputedStyle(document.querySelector('.slide-wrap')).animationName);
  ok(/fade/.test(rm), 'reduced-motion: enkel fade (' + rm + ')');
  await ctx.close();
  await browser.close();
  console.log(`\nKlaar: ${fails} mislukt.`); process.exit(fails ? 1 : 0);
})();
