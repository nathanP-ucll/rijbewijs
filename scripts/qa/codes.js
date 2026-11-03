// Zoekt zichtbare bordcodes/artikelnummers in tekst en in alt/title/aria-label/placeholder-attributen op alle paragraafpagina's van de opgegeven lessen.
const { chromium, url } = require('./lib');
const lessen = (process.argv[2] || '1,2').split(',').map(Number);
const RE = /(?<![\w.])(?:Z)?[A-GZ]\d{1,2}[a-z]?(?:[_-]\d+)?(?![\w])|\bart(?:ikel|\.)\s*\d/g;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const hits = []; let pagesN = 0;
  for (const les of lessen) {
    await p.goto(url(`les${les}.html#p1`)); await p.waitForSelector('.slide');
    const idx = await p.evaluate(() => window.CURSUS.boeken[document.body.dataset.les].pages.map((q, i) => q.t === 'paragraaf' || q.t === 'opener' || q.t === 'samenvatting' ? i + 1 : 0).filter(Boolean));
    for (const i of idx) {
      await p.evaluate((i) => { location.hash = '#p' + i; }, i); await p.waitForTimeout(60); pagesN++;
      const found = await p.evaluate((src) => {
        const re = new RegExp(src, 'g'); const out = [];
        const root = document.getElementById('book-page');
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) { const t = w.currentNode.nodeValue; let m; re.lastIndex = 0; while ((m = re.exec(t))) out.push('tekst: ' + m[0] + ' in "' + t.trim().slice(0, 50) + '"'); }
        root.querySelectorAll('[alt],[title],[aria-label],[placeholder]').forEach((n) => ['alt', 'title', 'aria-label', 'placeholder'].forEach((a) => { const v = n.getAttribute(a); if (v) { re.lastIndex = 0; const m = re.exec(v); if (m) out.push(a + ': ' + m[0] + ' in "' + v.slice(0, 50) + '"'); } }));
        return out;
      }, RE.source);
      found.forEach((f) => hits.push(`les${les} p${i}: ${f}`));
    }
  }
  console.log('pagina\'s gecontroleerd:', pagesN, '| gevonden codes/artikelnummers:', hits.length);
  console.log(hits.slice(0, 30).join('\n'));
  await b.close();
})();
