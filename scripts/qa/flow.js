// Doorklik-test: alle oefeningtypes (juist + fout + toon antwoord + opnieuw), paginering, zijbalk, examen, localStorage-geblokkeerd.
// Vereist een demo-build: node scripts/build.js --demo
const { chromium, url, SHOTS } = require('./lib');
const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });
let fails = 0, errs = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };

async function solve(page, art, ex, right) {
  const L = (s, o) => art.locator(s, o);
  switch (ex.type) {
    case 'meerkeuze': {
      const labs = L('label.opt');
      const n = await labs.count();
      const firstWrong = [...Array(n).keys()].find((k) => !ex.correct.includes(k));
      for (let i = 0; i < n; i++) { if (right ? ex.correct.includes(i) : i === firstWrong) await labs.nth(i).click(); }
      break;
    }
    case 'invul': await L('input.txt').fill(right ? ex.antwoorden[0].toUpperCase() + (ex.eenheid ? ' ' + ex.eenheid : '') : 'xx'); break;
    case 'reken': await L('input.txt').fill(right ? String(ex.antwoord).replace('.', ',') : '1'); break;
    case 'cloze': {
      for (let i = 0; i < ex.gaten.length; i++) {
        const g = ex.gaten[i];
        const node = L('.cloze').locator('select, input').nth(i);
        if (g.opties && g.opties.length) { const idx = typeof g.correct === 'number' ? g.correct : g.opties.indexOf(g.correct); await node.selectOption({ index: 1 + (right ? idx : (idx + 1) % g.opties.length) }); }
        else await node.fill(right ? g.antwoorden[0] : 'zzz');
      }
      break;
    }
    case 'koppel': {
      const n = ex.paren.length;
      for (let i = 0; i < n; i++) {
        const want = right ? ex.paren[i].rechts : ex.paren[(i + 1) % n].rechts;
        await L('.match-slot').nth(i).click();
        await L('.match-pool .chip-item', { hasText: want }).first().click();
      }
      break;
    }
    case 'volgorde': {
      if (right) {
        for (let pass = 0; pass < 20; pass++) {
          const texts = await L('.seq-text').allTextContents();
          let moved = false;
          for (let k = 0; k < ex.items.length; k++) if (texts[k] !== ex.items[k]) { const from = texts.indexOf(ex.items[k]); await L('.seq-item').nth(from).locator('.up').click(); moved = true; break; }
          if (!moved) break;
        }
      } else {
        // zeker fout: begin vanuit juiste volgorde en wissel eerste twee
        for (let pass = 0; pass < 20; pass++) {
          const texts = await L('.seq-text').allTextContents();
          let moved = false;
          for (let k = 0; k < ex.items.length; k++) if (texts[k] !== ex.items[k]) { const from = texts.indexOf(ex.items[k]); await L('.seq-item').nth(from).locator('.up').click(); moved = true; break; }
          if (!moved) break;
        }
        await L('.seq-item').nth(0).locator('.down').click();
      }
      break;
    }
    case 'waaronwaar': {
      await L('.opts-row label').nth(ex.juist ? 0 : 1).click();
      const mot = L('.opts[aria-label="Verklaring"] label'); const n = await mot.count();
      for (let i = 0; i < n; i++) { const t = (await mot.nth(i).innerText()).trim(); if ((t === ex.motivatie) === right) { await mot.nth(i).click(); break; } }
      break;
    }
    case 'situatie': {
      const veh = L('.veh');
      if (ex.modus === 'klik') { const want = right ? ex.correct : (ex.correct % ex.voertuigen.length) + 1; await veh.nth(ex.voertuigen.findIndex((v) => v.nr === want)).click(); }
      else { const order = right ? ex.correct : ex.correct.slice().reverse(); for (const nr of order) await veh.nth(ex.voertuigen.findIndex((v) => v.nr === nr)).click(); }
      break;
    }
    case 'hotspot': {
      for (let i = 0; i < ex.zones.length; i++) if (right ? ex.zones[i].correct : !ex.zones[i].correct) await L('.zone').nth(i).click();
      break;
    }
    case 'tabel': {
      let idx = 0;
      for (const r of ex.rijen) for (const c of r.cellen) {
        const td = L('tbody td').nth(idx++);
        if (typeof c.correct === 'boolean') { if (right ? c.correct : !c.correct) await td.locator('input').check(); }
        else if (c.opties) await td.locator('select').selectOption(right ? c.correct : c.opties.find((o) => o !== c.correct));
        else await td.locator('input').fill(right ? c.correct : 'x');
      }
      break;
    }
    case 'bord': {
      if (ex.modus === 'categorie') await L('.cat-opt', { hasText: new RegExp('^' + (right ? ex.categorie : (ex.categorie === 'B' ? 'C' : 'B'))) }).first().click();
      else if (ex.opties) { const labs = L('label.opt'); const n = await labs.count(); for (let i = 0; i < n; i++) { const t = (await labs.nth(i).innerText()).trim(); if ((ex.antwoorden.includes(t)) === right) { await labs.nth(i).click(); break; } } }
      else await L('input.txt').fill(right ? ex.antwoorden[0] : 'nee');
      break;
    }
  }
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  page.on('console', (m) => { if (m.type() === 'error') { errs++; console.log('CONSOLE ERROR', m.text()); } });
  page.on('pageerror', (e) => { errs++; console.log('PAGE ERROR', e.message); });
  await page.goto(url('oefenbank.html'));
  await page.waitForSelector('.ex');
  const exs = await page.evaluate(() => window.CURSUS.oefeningen);
  for (let i = 0; i < 10; i++) { const b = page.locator('.more-btn:visible'); if (await b.count()) await b.click(); else break; }
  ok((await page.locator('article.ex').count()) === exs.length, `oefenbank toont alle ${exs.length} oefeningen`);
  for (const right of [true, false]) {
    for (const ex of exs) {
      const art = page.locator(`article.ex[data-id="${ex.id}"]`);
      await art.scrollIntoViewIfNeeded();
      try {
        await solve(page, art, ex, right);
        await art.getByRole('button', { name: 'Nakijken' }).click();
        const cls = await art.getAttribute('class');
        ok(right ? cls.includes('is-correct') : cls.includes('is-incorrect'), `${ex.type} ${ex.id} ${right ? 'juist' : 'fout'} -> ${right ? 'groen' : 'rood'}`);
        if (!right) {
          await art.getByRole('button', { name: /Toon het juiste antwoord/ }).click();
          ok(await art.locator('.fb-info').count() === 1, `${ex.id} toon antwoord`);
          await art.getByRole('button', { name: /Probeer opnieuw/ }).click();
          ok(await art.getByRole('button', { name: 'Nakijken' }).isVisible(), `${ex.id} opnieuw`);
          await solve(page, art, ex, true);
          await art.getByRole('button', { name: 'Nakijken' }).click();
          ok((await art.getAttribute('class')).includes('is-correct'), `${ex.id} na opnieuw juist`);
        }
      } catch (e) { fails++; console.log('FAIL', ex.type, ex.id, right, e.message.split('\n')[0]); }
    }
    if (right) await page.screenshot({ path: SHOTS + '/qa-bank-right.png' });
  }
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('rbc.v1')));
  ok(Object.keys(st.res).length === exs.length, 'resultaten bewaard in localStorage');
  ok(Object.keys(st.fouten).length === 0, 'fouten leeg na juiste antwoorden');

  // boek: paginering + zwevende balk (geen zijbalk)
  await page.goto(url('les1.html'));
  await page.waitForSelector('.float-bar .fb-count');
  ok((await page.locator('.toc, aside').count()) === 0, 'geen zijbalk');
  ok((await page.textContent('.fb-count')).startsWith('Pagina 1 van'), 'les1 start op pagina 1');
  await page.getByRole('link', { name: /Volgende/ }).click();
  ok(page.url().endsWith('#p2'), 'Volgende -> #p2');
  await page.keyboard.press('ArrowRight');
  ok(page.url().endsWith('#p3'), 'pijl rechts -> #p3');
  await page.keyboard.press('ArrowLeft');
  ok(page.url().endsWith('#p2'), 'pijl links -> #p2');
  await page.getByRole('button', { name: /Inhoud/ }).click();
  ok(await page.locator('#pop-toc').isVisible(), 'inhoudspaneel opent');
  await page.locator('#pop-toc a', { hasText: 'Samenvatting' }).first().click();
  ok(/Samenvatting/.test(await page.title()), 'sprong via inhoud naar samenvatting');
  await page.getByRole('button', { name: /Les 1/ }).click();
  ok(await page.locator('#pop-les a', { hasText: 'Proefexamen' }).isVisible(), 'lesmenu bevat proefexamen');
  await page.keyboard.press('Escape');
  ok(!(await page.locator('#pop-les').isVisible()), 'Escape sluit menu');
  const cnt = await page.evaluate(() => window.CURSUS.boeken[1].pages.length);
  await page.goto(url('les1.html')); await page.waitForSelector('.fb-count');
  const hashNow = page.url().split('#p')[1];
  ok(Number(hashNow) > 2, 'terug naar laatst bezochte pagina (localStorage): p' + hashNow + ' van ' + cnt);
  await page.getByRole('button', { name: /Inhoud/ }).click();
  ok((await page.locator('#pop-toc .pop-link.done').count()) >= 1, "vinkjes voor gedane onderdelen");
  await page.keyboard.press('Escape');
  const noCode = await page.evaluate(() => !/\(\s*[A-F]\d+/.test(document.querySelector('#book-page').innerText));
  ok(noCode, 'geen (bordcode)-lijsten in zichtbare tekst');

  // eindtest
  const total2 = await page.evaluate(() => window.CURSUS.boeken[2].pages.length);
  await page.goto(url('les2.html#p' + total2));
  await page.getByRole('button', { name: 'Start de eindtest' }).click();
  await page.waitForSelector('.quiz-stage .ex');
  await page.getByRole('button', { name: 'Afronden' }).click();
  await page.getByRole('button', { name: 'Toch afronden' }).click();
  await page.waitForSelector('.result-verdict');
  ok(true, 'eindtest levert resultaatscherm');
  await page.screenshot({ path: SHOTS + '/qa-eindtest.png' });

  // proefexamen
  await page.goto(url('examen.html'));
  await page.getByRole('button', { name: 'Start het proefexamen' }).click();
  await page.waitForSelector('.quiz-stage .ex');
  const n = await page.locator('.quiz-stage article').count();
  ok(n === exs.length, `examen toont ${n} vragen`);
  await page.screenshot({ path: SHOTS + '/qa-exam.png' });
  await page.getByRole('button', { name: 'Afronden' }).click();
  await page.getByRole('button', { name: 'Toch afronden' }).click();
  await page.waitForSelector('.result-verdict');
  ok(/Niet geslaagd/.test(await page.textContent('.result-verdict')), 'leeg examen = niet geslaagd');
  await page.getByRole('button', { name: /Herhaal je foute vragen/ }).click();
  ok((await page.locator('.review article.ex').count()) > 0, 'herhaal foute vragen');
  await page.screenshot({ path: SHOTS + '/qa-exam-result.png' });
  await page.goto(url('mijnfouten.html'));
  await page.waitForSelector('.ex');
  ok((await page.locator('article.ex').count()) > 0, 'mijn fouten bevat de fouten');
  await ctx.close();

  // localStorage geblokkeerd
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx2.addInitScript(() => {
    const thrower = () => { throw new DOMException('blocked', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: thrower });
    Object.defineProperty(window, 'sessionStorage', { get: thrower });
  });
  const p2 = await ctx2.newPage();
  p2.on('console', (m) => { if (m.type() === 'error') { errs++; console.log('CONSOLE ERROR (geblokkeerd)', m.text()); } });
  p2.on('pageerror', (e) => { errs++; console.log('PAGE ERROR (geblokkeerd)', e.message); });
  for (const f of ['index.html', 'les1.html', 'les3.html#p4', 'examen.html', 'oefenbank.html', 'mijnfouten.html', 'spiekbrief.html', 'bronnen.html']) {
    await p2.goto(url(f)); await p2.waitForTimeout(400);
    ok((await p2.locator('#main').innerText()).length > 50, `geblokkeerde opslag: ${f} rendert`);
  }
  await p2.goto(url('les1.html#p1')); await p2.waitForSelector('.fb-count'); await p2.getByRole('link', { name: /Volgende/ }).click();
  ok(p2.url().endsWith('#p2'), 'geblokkeerde opslag: bladeren werkt');
  await p2.goto(url('index.html')); ok(await p2.locator('.notice.warn').count() > 0, 'melding bij geblokkeerde opslag');
  await ctx2.close();
  await browser.close();
  console.log(`\nKlaar: ${fails} mislukt, ${errs} console-errors.`);
  process.exit(fails || errs ? 1 : 0);
})();
