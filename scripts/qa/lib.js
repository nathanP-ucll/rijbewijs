// Gedeelde QA-hulp: laadt playwright (lokaal of globaal) en geeft site-URL's.
const path = require('path');
const { pathToFileURL } = require('url');
function loadPlaywright() {
  const tries = ['playwright', path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'playwright'), '/usr/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright'];
  for (const t of tries) { try { return require(t); } catch (e) { /* volgende */ } }
  throw new Error('playwright niet gevonden (npm i -g playwright)');
}
const SITE = path.resolve(__dirname, '..', '..', 'site');
const url = (f) => { const [p, h] = f.split('#'); return pathToFileURL(path.join(SITE, p)).href + (h ? '#' + h : ''); };
const SHOTS = process.env.QA_SHOTS || path.resolve(__dirname, '..', '..', '.qa-shots');
module.exports = { chromium: loadPlaywright().chromium, url, SITE, SHOTS };
