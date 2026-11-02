// Rendert site/img/borden/*.svg naar contactsheets (PNG) in een uitvoermap (buiten de repo).
// Gebruik: node scripts/contactsheet-borden.js <uitvoermap> [per-pagina=36]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'site', 'img', 'borden');
const out = process.argv[2];
const per = Number(process.argv[3] || 36);
fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
for (let i = 0; i * per < files.length; i++) {
  const chunk = files.slice(i * per, (i + 1) * per);
  const cells = chunk.map((f) => `<div class="c"><div class="l">${f.replace('.svg', '')}</div><img src="${pathToFileURL(path.join(DIR, f)).href}"></div>`).join('');
  const html = `<html><body style="margin:0;background:#ddd;font-family:Arial"><style>.g{display:grid;grid-template-columns:repeat(6,190px);gap:6px;padding:6px}.c{background:#fff;height:155px;text-align:center}.l{font:bold 15px Arial;background:#ffe;padding:2px}img{max-width:170px;max-height:120px}</style><div class="g">${cells}</div></body></html>`;
  fs.writeFileSync(path.join(out, `sheet-src-${i + 1}.html`), html);
  await page.goto(pathToFileURL(path.join(out, `sheet-src-${i + 1}.html`)).href);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, `sheet-${String(i + 1).padStart(2, '0')}.png`), fullPage: true });
}
await browser.close();
console.log('sheets:', Math.ceil(files.length / per), 'bestanden:', files.length);
