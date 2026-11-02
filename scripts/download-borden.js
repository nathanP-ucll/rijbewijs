// Downloadt Belgische verkeersborden (SVG) van Wikimedia Commons naar site/img/borden/
// en schrijft data/credits.json. Gebruik: node scripts/download-borden.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'site', 'img', 'borden');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'rijbewijs-cursus/1.0 (ntnthefirst@gmail.com; educatief project)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = API + '?' + new URLSearchParams({ format: 'json', ...params });
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) return r.json();
    await sleep(1500 * (i + 1));
  }
  throw new Error('API faalt: ' + url);
}

async function listPrefix(prefix) {
  const out = [];
  let cont = {};
  do {
    const j = await api({ action: 'query', list: 'allpages', apnamespace: '6', apprefix: prefix, aplimit: '500', ...cont });
    out.push(...j.query.allpages.map((p) => p.title));
    cont = j.continue || null;
    await sleep(300);
  } while (cont);
  return out;
}

// bestandsnaam -> {code, prio}; lagere prio wint (2024-versie = actuele wetgeving)
function parse(title) {
  const m = title.match(/^File:Belgian (traffic|road) sign (.+)\.svg$/);
  if (!m) return null;
  let rest = m[2];
  let prio = m[1] === 'traffic' ? 2 : 3;
  if (/ KB-AR 03-06-2024$/.test(rest)) { rest = rest.replace(/ KB-AR 03-06-2024$/, ''); prio = 1; }
  else if (/KB ?-AR/.test(rest)) return null; // 03-04-2024 en andere varianten overslaan
  if (/ \d\d$/.test(rest) && /^B1 /.test(rest)) return null; // B1 genummerde varianten
  rest = rest.replace(/^([A-Z])0(\d)/, '$1$2'); // D01a -> D1a
  // enkel eenvoudige codes en bekende numerieke varianten (snelheid/tonnage)
  let code = null;
  let mm;
  if ((mm = rest.match(/^([ABDEFM]\d{1,3}[a-z]?\d?)$/))) code = mm[1];
  else if ((mm = rest.match(/^(C\d{1,2}[a-z]?)$/))) code = mm[1];
  else if ((mm = rest.match(/^(C(?:21|22|24|26|27|29|43|45)) (\d+(?:[.,]\d)?)$/))) code = mm[1] + '_' + mm[2].replace(/[.,]/g, '_');
  else if ((mm = rest.match(/^(G[IVX]+[a-z]?) (.+)$/))) code = mm[1] + '_' + mm[2].replace(/[^A-Za-z0-9+\-]+/g, '_');
  else if ((mm = rest.match(/^(G[IVX]+[a-z]?)$/))) code = mm[1];
  else if ((mm = rest.match(/^(D1b|D4) (links|rechts|rechtdoor)$/))) code = mm[1] + '_' + mm[2];
  else if ((mm = rest.match(/^(E9[a-j]) (Handicap|Parkeerschijf)$/))) code = mm[1] + '_' + mm[2];
  else if ((mm = rest.match(/^(F63) (CNG|Elektrisch|H2|LNG|LPG)$/))) code = mm[1] + '_' + mm[2];
  else if ((mm = rest.match(/^(F[13][ab]) (horizontaal|verticaal)$/))) code = mm[1] + '_' + mm[2];
  else if ((mm = rest.match(/^(B22) (Li|Rd|Re|LiRd|LiRe|RdRe|LiRdRe)$/))) code = mm[1] + '_' + mm[2];
  else if ((mm = rest.match(/^(C47) (NL|FR|DE)$/))) code = mm[1] + '_' + mm[2];
  else if ((mm = rest.match(/^(C47) \(douane\)$/))) code = 'C47_douane';
  else if ((mm = rest.match(/^(A27) (big game|livestock)$/))) code = mm[1] + '_' + mm[2].replace(' ', '_');
  else if ((mm = rest.match(/^(A51) \+ (file|mist|zachte berm)$/))) code = mm[1] + '_' + mm[2].replace(' ', '_');
  if (!code) return null;
  return { code, prio };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const prefixes = ['Belgian traffic sign ', 'Belgian road sign '];
  let titles = [];
  for (const p of prefixes) titles.push(...(await listPrefix(p)));
  titles = [...new Set(titles)];
  const best = {};
  for (const t of titles) {
    const p = parse(t);
    if (!p) continue;
    if (!best[p.code] || p.prio < best[p.code].prio) best[p.code] = { title: t, prio: p.prio };
  }
  const codes = Object.keys(best);
  console.log('kandidaten:', codes.length);

  // imageinfo in batches van 40
  const info = {};
  const ts = codes.map((c) => best[c].title);
  for (let i = 0; i < ts.length; i += 40) {
    const j = await api({ action: 'query', titles: ts.slice(i, i + 40).join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata', iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|Credit' });
    for (const pg of Object.values(j.query.pages)) if (pg.imageinfo) info[pg.title] = pg.imageinfo[0];
    await sleep(400);
  }

  const strip = (s) => (s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const free = (l) => /public domain|^pd|cc0|cc[ -]by|cc-zero/i.test(l) && !/\bNC\b|\bND\b|-nc|-nd/i.test(l);
  const credits = [];
  const rejected = [];
  for (const code of codes.sort()) {
    const t = best[code].title;
    const ii = info[t];
    if (!ii) { rejected.push([code, 'geen imageinfo']); continue; }
    const md = ii.extmetadata || {};
    const lic = strip(md.LicenseShortName?.value);
    const auteur = strip(md.Artist?.value) || 'onbekend (zie bron)';
    if (!free(lic)) { rejected.push([code, 'licentie: ' + lic]); continue; }
    const file = code + '.svg';
    const dest = path.join(OUT, file);
    if (!fs.existsSync(dest)) {
      let ok = false;
      for (let i = 0; i < 4 && !ok; i++) {
        const r = await fetch(ii.url, { headers: { 'User-Agent': UA } });
        if (r.ok) {
          const txt = await r.text();
          if (txt.includes('<svg')) { fs.writeFileSync(dest, txt); ok = true; }
        } else await sleep(2000 * (i + 1));
      }
      if (!ok) { rejected.push([code, 'download faalt']); continue; }
      await sleep(350);
    }
    credits.push({ bestand: 'site/img/borden/' + file, bordcode: code, auteur, licentie: lic, bron_url: 'https://commons.wikimedia.org/wiki/' + encodeURI(t.replace(/ /g, '_')), opmerking: 'Commons-bestand: ' + t.replace(/^File:/, '') });
  }
  fs.writeFileSync(path.join(ROOT, 'data', 'credits.json'), JSON.stringify(credits, null, 1));
  fs.writeFileSync(path.join(ROOT, 'data', 'borden-afgewezen.json'), JSON.stringify(rejected, null, 1));
  console.log('gedownload/aanwezig:', credits.length, 'afgewezen:', rejected.length);
  console.log(rejected.map((r) => r.join(': ')).join('\n'));
}
main().catch((e) => { console.error(e); process.exit(1); });
