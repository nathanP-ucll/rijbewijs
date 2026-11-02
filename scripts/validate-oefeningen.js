// Valideert data/oefeningen/*.json. Gebruik: node scripts/validate-oefeningen.js [les3.json ...]
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'data', 'oefeningen');
const files = process.argv.length > 2 ? process.argv.slice(2) : fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const blokIds = new Set();
for (const f of fs.readdirSync(path.join(root, 'data', 'theorie'))) {
  for (const b of JSON.parse(fs.readFileSync(path.join(root, 'data', 'theorie', f), 'utf8')).blokken) blokIds.add(b.id);
}
const bronIds = new Set();
for (const f of fs.readdirSync(path.join(root, 'data', 'bronnen'))) {
  Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'data', 'bronnen', f), 'utf8'))).forEach(k => bronIds.add(k));
}
const curr = JSON.parse(fs.readFileSync(path.join(root, 'data', 'curriculum.json'), 'utf8'));
const currIds = new Set((curr.onderwerpen || curr).map(x => x.id));
const imgDirs = ['', 'borden', 'schemas'].map(d => path.join(root, 'site', 'img', d));
const imgExists = n => imgDirs.some(d => fs.existsSync(path.join(d, n + '.svg')) || fs.existsSync(path.join(d, n + '.png')) || fs.existsSync(path.join(d, n)));

const types = ['meerkeuze', 'invul', 'cloze', 'koppel', 'volgorde', 'waaronwaar', 'situatie', 'hotspot', 'tabel', 'bord', 'reken'];
const codeRe = /\b[A-F]\d{1,3}[a-z]?\b/;
const artRe = /\bart(ikel|\.)\s*\d/i;
let errors = 0;
const err = (id, m) => { errors++; console.log(`FOUT ${id}: ${m}`); };

for (const file of files) {
  const arr = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const ids = new Set();
  const stats = { type: {}, onderwerp: {}, blok: {}, examenMK: 0, eindtest: 0, mini: 0 };
  for (const o of arr) {
    const id = o.id || '?';
    if (ids.has(id)) err(id, 'dubbele id'); ids.add(id);
    for (const k of ['id', 'les', 'onderwerp', 'theorieblok', 'type', 'vraag', 'uitleg', 'bronnen', 'moeilijkheid', 'gewicht', 'examen', 'eindtest'])
      if (o[k] === undefined || o[k] === '') err(id, 'ontbreekt: ' + k);
    if (!types.includes(o.type)) err(id, 'onbekend type ' + o.type);
    if (!blokIds.has(o.theorieblok)) err(id, 'onbekend blok ' + o.theorieblok);
    if (!currIds.has(o.onderwerp)) err(id, 'onbekend onderwerp ' + o.onderwerp);
    (o.bronnen || []).forEach(b => { if (!bronIds.has(b)) err(id, 'onbekende bron ' + b); });
    if (![1, 2, 3].includes(o.moeilijkheid)) err(id, 'moeilijkheid');
    if (!['gewoon', 'zwaar'].includes(o.gewicht)) err(id, 'gewicht');
    if (o.afbeelding && !imgExists(o.afbeelding)) err(id, 'afbeelding bestaat niet: ' + o.afbeelding);
    for (const p of o.paren || []) if (p.linksAfb && !imgExists(p.linksAfb)) err(id, 'linksAfb bestaat niet: ' + p.linksAfb);
    const t = o.type;
    if (t === 'meerkeuze') {
      if (!Array.isArray(o.opties) || o.opties.length < 2) err(id, 'opties');
      else if (!Array.isArray(o.correct) || !o.correct.length || o.correct.some(i => !(i >= 0 && i < o.opties.length))) err(id, 'correct');
      if (o.meerdere !== (o.correct && o.correct.length > 1)) err(id, 'meerdere klopt niet met correct');
      if (o.examen && (o.correct.length !== 1 || o.opties.length < 3 || o.opties.length > 4)) err(id, 'examen vraagt 1 juist antwoord en 3-4 opties');
      if (o.examen) stats.examenMK++;
    } else if (o.examen) err(id, 'examen enkel voor meerkeuze');
    if (t === 'invul' && !(o.antwoorden && o.antwoorden.length)) err(id, 'antwoorden');
    if (t === 'cloze') {
      const n = (o.tekst || '').match(/\{\{\d+\}\}/g);
      if (!n || !Array.isArray(o.gaten) || o.gaten.length !== n.length) err(id, 'cloze gaten');
    }
    if (t === 'koppel' && !(Array.isArray(o.paren) && o.paren.length >= 2 && o.paren.every(p => p.links && p.rechts))) err(id, 'paren');
    if (t === 'volgorde' && !(Array.isArray(o.items) && o.items.length >= 3)) err(id, 'items');
    if (t === 'waaronwaar' && !(o.stelling && typeof o.juist === 'boolean' && o.motivatie && o.foutemotivaties && o.foutemotivaties.length === 2)) err(id, 'waaronwaar');
    if (t === 'situatie' && !(o.afbeelding && o.voertuigen && o.modus && o.correct !== undefined)) err(id, 'situatie');
    if (t === 'hotspot' && !(o.afbeelding && Array.isArray(o.zones) && o.zones.some(z => z.correct) && o.zones.every(z => ['x', 'y', 'w', 'h'].every(k => typeof z[k] === 'number')))) err(id, 'hotspot');
    if (t === 'tabel' && !(o.kolommen && o.rijen && o.rijen.every(r => r.label && r.cellen && r.cellen.length === o.kolommen.length && r.cellen.every(c => c.correct !== undefined)))) err(id, 'tabel');
    if (t === 'bord' && !(o.afbeelding && ['naam', 'categorie'].includes(o.modus) && o.antwoorden)) err(id, 'bord (enkel modus naam/categorie)');
    if (t === 'reken' && !(o.gegeven !== undefined && o.antwoord !== undefined)) err(id, 'reken');
    if (o.mini && (o.examen || o.eindtest)) err(id, 'mini mag niet examen/eindtest zijn');
    // verboden inhoud in tekst
    const txt = JSON.stringify({ ...o, afbeelding: undefined, paren: (o.paren || []).map(p => ({ links: p.links, rechts: p.rechts })), id: undefined, theorieblok: undefined, bronnen: undefined, zones: undefined });
    if (codeRe.test(txt)) err(id, 'bordcode in tekst: ' + txt.match(codeRe)[0]);
    if (artRe.test(txt)) err(id, 'artikelnummer in tekst');
    stats.type[t] = (stats.type[t] || 0) + 1;
    stats.onderwerp[o.onderwerp] = (stats.onderwerp[o.onderwerp] || 0) + 1;
    stats.blok[o.theorieblok] = (stats.blok[o.theorieblok] || 0) + 1;
    if (o.eindtest) stats.eindtest++;
    if (o.mini) stats.mini++;
  }
  console.log(`\n${file}: ${arr.length} oefeningen (${stats.mini} mini), eindtest ${stats.eindtest}, examen-meerkeuze ${stats.examenMK}`);
  console.log('types', stats.type);
  console.log('onderwerpen', stats.onderwerp);
  const les = arr[0] && arr[0].les;
  const missing = [...blokIds].filter(b => !stats.blok[b] && arr.length && curr && true);
  void les; void missing;
}
console.log(errors ? `\n${errors} fout(en)` : '\nOK');
process.exit(errors ? 1 : 0);
