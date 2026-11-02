// Controleert data/boek/h*.json (of de opgegeven bestanden).
// Gebruik: node scripts/validate-boek.js [data/boek/h1.json ...]
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const boekDir = path.join(root, 'data', 'boek');
const files = process.argv.slice(2).length
  ? process.argv.slice(2).map(f => path.resolve(f))
  : fs.readdirSync(boekDir).filter(f => /^h\d+\.json$/.test(f)).map(f => path.join(boekDir, f));

// bekende ids en afbeeldingen
const blokIds = new Set();
for (const f of fs.readdirSync(path.join(root, 'data', 'theorie'))) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(fs.readFileSync(path.join(root, 'data', 'theorie', f), 'utf8'));
  for (const b of d.blokken || []) blokIds.add(b.id);
}
const bordIndex = JSON.parse(fs.readFileSync(path.join(root, 'data', 'borden-index.json'), 'utf8'));
const bordOk = k => bordIndex[k] && bordIndex[k].gecontroleerd === true;
const bestaat = (map, afb) => fs.existsSync(path.join(root, 'site', 'img', map, afb + '.svg'));

const CODE = /(^|[^A-Za-z0-9])(?!M(12|18|36)\b)([A-F]|M|Z|G)\d{1,3}[a-z]?(\d)?(_|\b)/;
const ARTIKEL = /\bart(ikel|\.)\s*\d/i;
const eindigtNetjes = t => /[.?!)]$/.test(t.trim()) && !/\b(bv|o\.a|enz|etc|nr|vs)\.$/i.test(t.trim());
const woorden = t => t.trim().split(/\s+/).length;

let fouten = 0, waarsch = 0;
const fout = (ctx, m) => { fouten++; console.log(`FOUT  ${ctx}: ${m}`); };
const waarschuw = (ctx, m) => { waarsch++; console.log(`WAARSCHUWING  ${ctx}: ${m}`); };

function tekst(ctx, t, opts = {}) {
  if (typeof t !== 'string' || !t.trim()) return fout(ctx, 'lege of ontbrekende tekst');
  if (!opts.zonderEinde && !eindigtNetjes(t)) fout(ctx, `eindigt niet netjes: "${t.slice(-30)}"`);
  if (CODE.test(t)) fout(ctx, `bordcode in zichtbare tekst: "${t}"`);
  if (ARTIKEL.test(t)) fout(ctx, `artikelnummer in tekst: "${t}"`);
  if (opts.max && woorden(t) > opts.max) waarschuw(ctx, `${woorden(t)} woorden (max ${opts.max}): "${t}"`);
}
function kop(ctx, t) { // titels: geen eindpunt nodig
  tekst(ctx, t, { zonderEinde: true });
}
function afb(ctx, a, map) {
  if (!a) return fout(ctx, 'afb ontbreekt');
  if (!bestaat(map, a)) return fout(ctx, `afbeelding bestaat niet: ${map}/${a}.svg`);
  if (map === 'borden' && !bordOk(a)) fout(ctx, `bord niet gecontroleerd of niet in index: ${a}`);
}

for (const file of files) {
  let d;
  try { d = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { fout(file, 'ongeldige JSON: ' + e.message); continue; }
  const naam = path.basename(file);
  const ids = new Set();
  let aantal = 0;
  if (!d.hoofdstuk || !d.titel || !d.les) fout(naam, 'hoofdstuk/titel/les ontbreekt');
  if (!d.intro || !Array.isArray(d.intro.doelen) || !d.intro.doelen.length) fout(naam, 'intro.doelen ontbreekt');
  else { tekst(naam + ' intro', d.intro.tekst); d.intro.doelen.forEach((x, i) => tekst(`${naam} doel ${i + 1}`, x)); }
  if (!Array.isArray(d.samenvatting) || !d.samenvatting.length || d.samenvatting.length > 8) fout(naam, 'samenvatting moet 1-8 punten hebben');
  else d.samenvatting.forEach((x, i) => tekst(`${naam} samenvatting ${i + 1}`, x, { max: 16 }));
  const gebruiktBlok = new Map();
  for (const p of d.paragrafen || []) {
    kop(`${naam} ${p.nr}`, p.titel);
    if (!p.nr || !p.nr.startsWith(d.hoofdstuk + '.')) fout(naam, `paragraafnummer ${p.nr} past niet bij hoofdstuk`);
    if (!p.paginas || p.paginas.length < 1 || p.paginas.length > 8) waarschuw(`${naam} ${p.nr}`, `aantal pagina's: ${(p.paginas || []).length}`);
    for (const pg of p.paginas || []) {
      aantal++;
      const c = `${naam} ${pg.id}`;
      if (!pg.id || ids.has(pg.id)) fout(c, 'id ontbreekt of dubbel'); ids.add(pg.id);
      kop(c + ' titel', pg.titel);
      tekst(c + ' intro', pg.intro, { max: 25 });
      const bl = pg.blokken || [];
      if (bl.length < 3 || bl.length > 6) fout(c, `${bl.length} blokken (moet 3-6 zijn)`);
      if (bl.filter(b => b.type === 'kader').length > 1) fout(c, 'meer dan 1 kader');
      for (const [i, b] of bl.entries()) {
        const bc = `${c} blok ${i + 1} (${b.type})`;
        switch (b.type) {
          case 'punten':
            if (!b.items || !b.items.length || b.items.length > 5) fout(bc, 'items moeten 1-5 zijn');
            (b.items || []).forEach((t, j) => tekst(`${bc} #${j + 1}`, t, { max: 12 }));
            break;
          case 'kaarten':
            if (!b.items || !b.items.length || b.items.length > 6) fout(bc, 'kaarten moeten 1-6 zijn');
            for (const k of b.items || []) {
              afb(bc, k.afb, 'borden'); kop(bc + ' naam', k.naam);
              tekst(bc + ' uitleg ' + k.afb, k.uitleg, { max: 12 });
              if (k.letop) tekst(bc + ' letop ' + k.afb, k.letop, { max: 10, zonderEinde: true });
            }
            break;
          case 'vergelijk':
            kop(bc + ' titel', b.titel);
            for (const z of ['links', 'rechts']) {
              if (!b[z]) { fout(bc, z + ' ontbreekt'); continue; }
              afb(bc, b[z].afb, 'borden'); tekst(bc + ' ' + z, b[z].tekst, { max: 12, zonderEinde: true }); // bijschrift-label
            }
            tekst(bc + ' verschil', b.verschil, { max: 25 });
            break;
          case 'schema':
            afb(bc, b.afb, 'schemas');
            tekst(bc + ' bijschrift', b.bijschrift, { max: 25 });
            (b.punten || []).forEach((t, j) => tekst(`${bc} #${j + 1}`, t, { max: 12 }));
            break;
          case 'kader':
            if (!['regel', 'letop', 'zwarefout', 'tip', 'gewest'].includes(b.soort)) fout(bc, 'onbekende soort');
            kop(bc + ' titel', b.titel);
            tekst(bc + ' tekst', b.tekst, { max: 35 });
            if (b.soort === 'gewest') {
              if (!b.gewest || !b.gewest.vlaanderen || !b.gewest.wallonie || !b.gewest.brussel) fout(bc, 'gewest-velden ontbreken');
              else for (const g of ['vlaanderen', 'wallonie', 'brussel']) tekst(`${bc} ${g}`, b.gewest[g]);
            }
            break;
          case 'tabel':
            if (!b.kolommen || !b.rijen || b.rijen.length > 6 || !b.rijen.length) fout(bc, 'tabel: kolommen of 1-6 rijen ontbreken');
            (b.kolommen || []).forEach(k => kop(bc + ' kolom', k));
            for (const r of b.rijen || []) {
              if (r.length !== (b.kolommen || []).length) fout(bc, 'rij met verkeerd aantal cellen');
              r.forEach(cel => tekst(bc + ' cel', cel, { zonderEinde: true }));
            }
            break;
          case 'voorbeeld':
            tekst(bc, b.tekst, { max: 40 });
            break;
          default:
            fout(bc, 'onbekend bloktype');
        }
      }
      for (const t of pg.theorieblokken || []) {
        if (!blokIds.has(t)) fout(c, `theorieblok bestaat niet: ${t}`);
        if (gebruiktBlok.has(t)) waarschuw(c, `theorieblok ${t} ook gebruikt op ${gebruiktBlok.get(t)} (mini-oefening dubbel)`);
        gebruiktBlok.set(t, pg.id);
      }
    }
  }
  console.log(`${naam}: ${aantal} pagina's, ${gebruiktBlok.size} theorieblokken gekoppeld`);
}
console.log(`\n${fouten} fouten, ${waarsch} waarschuwingen`);
process.exit(fouten ? 1 : 0);
