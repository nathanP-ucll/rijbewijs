#!/usr/bin/env node
/*
 * Build: data/*.json  ->  site/data/cursus.js (window.CURSUS) + HTML-pagina's in site/.
 * Geen dependencies. Gebruik:
 *   node scripts/build.js                 strikt (faalt als de curriculum-checklist niet groen is)
 *   node scripts/build.js --lenient       waarschuwt enkel
 *   node scripts/build.js --demo-only      alleen demo-oefeningen en demo-boek (voor de QA-scripts)
 *   node scripts/build.js --demo          bouwt mee met data/_demo (impliceert --lenient, schrijft curriculum.json niet bij)
 *   node scripts/build.js --lessen=1,2    checklist enkel voor die lessen afdwingen
 *   node scripts/build.js --allow-unverified   neemt ook oefeningen zonder 'ok' in verificatie.json op
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const SITE = path.join(ROOT, 'site');
const args = new Set(process.argv.slice(2));
const DEMO_ONLY = args.has('--demo-only');
const DEMO = args.has('--demo') || DEMO_ONLY;
const LENIENT = args.has('--lenient') || DEMO;
const ALLOW_UNVERIFIED = args.has('--allow-unverified');
const LESSEN = (process.argv.find((a) => a.startsWith('--lessen=')) || '').replace('--lessen=', '').split(',').filter(Boolean).map(Number); // bv. --lessen=1,2: checklist enkel voor die lessen afdwingen

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function readJSON(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    if (fallback !== undefined && e.code === 'ENOENT') return fallback;
    err('Kan ' + path.relative(ROOT, p) + ' niet lezen: ' + e.message);
    return fallback;
  }
}
function jsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(dir, f));
}

/* ---------- invoer ---------- */
const curriculum = readJSON(path.join(DATA, 'curriculum.json'), []);
const curIndex = new Map(curriculum.map((c, i) => [c.id, i]));

const THEMA_NAMEN = {
  borden: 'Verkeersborden en markeringen',
  snelheden: 'Snelheden en zones',
  voorrang: 'Voorrang',
  lichten: 'Verkeerslichten en bevoegde personen',
  kwetsbaar: 'Voetgangers en fietsers',
  openbaar: 'Tram, bus en overweg',
  plaats: 'Plaats op de weg en parkeren',
  snelwegen: 'Autosnelweg en autoweg',
  gedrag: 'Gedrag en veiligheid',
  ongeval: 'Ongeval en eerste hulp',
  rijbewijs: 'Rijbewijs en theorie-examen',
  techniek: 'Voertuig, dashboard en milieu',
};
const LES_TITELS = {
  1: 'Borden, markeringen en snelheden',
  2: 'Voorrang, lichten en weggebruikers',
  3: 'Plaats op de weg en snelwegen',
  4: 'Gedrag, ongeval, rijbewijs en techniek',
};
const LES_ONDERTITELS = {
  1: 'Alle verkeersborden, wegmarkeringen en de toegelaten snelheden per wegtype en gewest.',
  2: 'Wie heeft voorrang? Rotondes, verkeerslichten, bevoegde personen, voetgangers, fietsers, tram en bus.',
  3: 'Rijstroken, kruisen en inhalen, parkeren en keren, en de regels op autosnelwegen.',
  4: 'Alcohol en afleiding, remweg, ongeval en eerste hulp, het rijbewijs, het theorie-examen en je voertuig.',
};

// indeling in hoofdstukken (data/hoofdstukken.json): volgorde = hoofdstuknummer
const hoofdCfg = readJSON(path.join(DATA, 'hoofdstukken.json'), null);
const HOOFD = (hoofdCfg && hoofdCfg.hoofdstukken) || Object.keys(THEMA_NAMEN).map((t) => ({ thema: t, titel: THEMA_NAMEN[t] }));
const themaNr = {};
HOOFD.forEach((h, i) => { themaNr[h.thema] = i + 1; if (h.titel) THEMA_NAMEN[h.thema] = h.titel; });
if (hoofdCfg && hoofdCfg.lessen) for (const [k, v] of Object.entries(hoofdCfg.lessen)) { if (v.titel) LES_TITELS[k] = v.titel; if (v.ondertitel) LES_ONDERTITELS[k] = v.ondertitel; }

// theorie
const theorie = [];
for (const f of jsonFiles(path.join(DATA, 'theorie'))) {
  const d = readJSON(f);
  if (!d || !Array.isArray(d.blokken)) { err(path.relative(ROOT, f) + ': geen blokken'); continue; }
  d.blokken.forEach((b, i) => {
    b.thema = d.thema;
    b.les = b.les || d.les;
    b._ord = theorie.length;
    theorie.push(b);
  });
}
if (DEMO) {
  const extra = readJSON(path.join(DATA, '_demo', 'blokken-extra.json'), {});
  for (const b of theorie) if (extra[b.id]) Object.assign(b, extra[b.id]);
}
const blokIds = new Set();
for (const b of theorie) {
  if (!b.id) { err('Theorieblok zonder id in thema ' + b.thema); continue; }
  if (blokIds.has(b.id)) err('Dubbel theorieblok-id: ' + b.id);
  blokIds.add(b.id);
  for (const c of b.curriculum || []) if (!curIndex.has(c)) err(`Blok ${b.id}: onbekend curriculum-id ${c}`);
}

// bronnen
const bronnen = {};
for (const f of jsonFiles(path.join(DATA, 'bronnen'))) {
  const d = readJSON(f, {});
  for (const [k, v] of Object.entries(d)) {
    if (bronnen[k]) err('Dubbel bron-id ' + k + ' in ' + path.basename(f));
    bronnen[k] = v;
  }
}
Object.assign(bronnen, readJSON(path.join(DATA, 'bronnen.json'), {}));

// afbeeldingen
const bordenIndex = readJSON(path.join(DATA, 'borden-index.json'), {});
const creditsRaw = readJSON(path.join(DATA, 'credits.json'), []);
const schemaInfo = {}; // naam -> beschrijving (samengevoegd uit schemas-index.json en schemas-extra-a/b/c.json; ontbrekende bestanden worden overgeslagen)
function verwerkSchemaIndex(raw) {
  if (!raw) return;
  const put = (naam, o) => {
    if (!naam) return;
    schemaInfo[naam] = (o && (o.beschrijving || o.alt || o.omschrijving || o.titel || o.naam_nl)) || schemaInfo[naam] || '';
  };
  const arr = Array.isArray(raw) ? raw : (raw.schemas || null);
  if (Array.isArray(arr)) {
    arr.forEach((o) => {
      const n = typeof o === 'string' ? o : (o.naam || o.id || (o.bestand || '').replace(/^.*\//, '').replace(/\.\w+$/, ''));
      put(n, typeof o === 'string' ? null : o);
    });
  } else {
    Object.entries(raw.schemas || raw).forEach(([k, o]) => put(k.replace(/\.\w+$/, ''), typeof o === 'object' ? o : { beschrijving: String(o) }));
  }
}
['schemas-index.json', 'schemas-extra-a.json', 'schemas-extra-b.json', 'schemas-extra-c.json', 'schemas-extra-eindtest.json'].forEach((f) => {
  const p = path.join(DATA, f);
  if (fs.existsSync(p)) verwerkSchemaIndex(readJSON(p, null));
});
function dirBases(dir) {
  const m = {};
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) {
    const ext = path.extname(f).toLowerCase();
    if (['.svg', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) m[path.basename(f, ext)] = f;
  }
  return m;
}
const bordFiles = dirBases(path.join(SITE, 'img', 'borden'));
const schemaFiles = dirBases(path.join(SITE, 'img', 'schemas'));
const demoImgDir = path.join(DATA, '_demo', 'img');
const demoFiles = DEMO ? dirBases(demoImgDir) : {};
const afb = {};
const warnedImg = new Set();
function resolveImg(name) {
  if (!name) return null;
  if (name in afb) return afb[name];
  let r = null;
  if (bordFiles[name]) {
    const bi = bordenIndex[name] || {};
    r = { src: 'img/borden/' + bordFiles[name], soort: 'bord', alt: bi.naam_nl || 'Verkeersbord', cat: bi.categorie || null, naam: bi.naam_nl || null };
  } else if (schemaFiles[name]) {
    r = { src: 'img/schemas/' + schemaFiles[name], soort: 'schema', alt: schemaInfo[name] || humanize(name) };
  } else if (demoFiles[name]) {
    r = { src: 'img/_demo/' + demoFiles[name], soort: 'schema', alt: 'Demo-afbeelding ' + name };
  } else if (name in schemaInfo) {
    // staat in de index maar het bestand is er (nog) niet
    r = null;
    if (!warnedImg.has(name)) { warn(`Afbeelding '${name}' staat in schemas-index maar het bestand ontbreekt in site/img/schemas`); warnedImg.add(name); }
  } else if (!warnedImg.has(name)) {
    warn(`Afbeelding '${name}' niet gevonden (borden/schemas)`);
    warnedImg.add(name);
  }
  afb[name] = r;
  return r;
}
function humanize(n) {
  return n.replace(/^(schema|markering|tech)-/, '').replace(/[-_]/g, ' ');
}

// credits: enkel niet-publiek-domein in afb-map, alles in credits-lijst
const credits = creditsRaw.map((c) => ({
  code: c.bordcode,
  auteur: c.auteur,
  licentie: c.licentie,
  url: c.bron_url,
  bestand: (c.bestand || '').replace(/^site\//, ''),
  opmerking: c.opmerking || '',
}));
const creditByCode = Object.fromEntries(credits.map((c) => [c.code, c]));

// oefeningen
let verif = null;
const verifFiles = [path.join(DATA, 'verificatie.json')]; // alleen het samengevoegde bestand (scripts/merge-verificatie.js)
for (const vf of verifFiles) {
  if (fs.existsSync(vf)) {
    verif = verif || {};
    Object.assign(verif, readJSON(vf, {}));
  }
}
let oefRaw = [];
for (const f of (DEMO_ONLY ? [] : jsonFiles(path.join(DATA, 'oefeningen')))) {
  const d = readJSON(f, []);
  const arr = Array.isArray(d) ? d : (d.oefeningen || []);
  arr.forEach((o) => { o._bron = path.basename(f); oefRaw.push(o); });
}
let demoCount = 0;
if (DEMO) {
  for (const f of jsonFiles(path.join(DATA, '_demo'))) {
    const d = readJSON(f, []);
    const arr = Array.isArray(d) ? d : (d.oefeningen || []);
    arr.forEach((o) => { o._bron = '_demo/' + path.basename(f); o._demo = true; oefRaw.push(o); demoCount++; });
  }
}
const verifActive = !!verif && !ALLOW_UNVERIFIED;
if (!verif) console.log('[info] data/verificatie.json ontbreekt: alle oefeningen worden opgenomen (niet getoond aan gebruiker).');
else if (ALLOW_UNVERIFIED) console.log('[info] --allow-unverified: verificatie genegeerd.');

const TYPES = ['meerkeuze', 'invul', 'cloze', 'koppel', 'volgorde', 'waaronwaar', 'situatie', 'hotspot', 'tabel', 'bord', 'reken'];
function validateEx(o) {
  const e = [];
  const need = (c, m) => { if (!c) e.push(m); };
  need(o.id, 'id ontbreekt');
  need(TYPES.includes(o.type), 'onbekend type ' + o.type);
  need(o.vraag || o.type === 'cloze' || o.type === 'waaronwaar', 'vraag ontbreekt');
  need(o.uitleg, 'uitleg ontbreekt');
  need(o.onderwerp && curIndex.has(o.onderwerp), 'onderwerp ontbreekt of onbekend: ' + o.onderwerp);
  need(!o.theorieblok || blokIds.has(o.theorieblok), 'theorieblok onbekend: ' + o.theorieblok);
  const arr = (x) => Array.isArray(x) && x.length > 0;
  switch (o.type) {
    case 'meerkeuze': need(arr(o.opties) && o.opties.length >= 2, 'opties'); need(arr(o.correct) && o.correct.every((i) => Number.isInteger(i) && i >= 0 && i < (o.opties || []).length), 'correct (indices)'); break;
    case 'invul': need(arr(o.antwoorden), 'antwoorden'); break;
    case 'cloze': need(typeof o.tekst === 'string' && arr(o.gaten), 'tekst/gaten'); if (o.tekst && o.gaten) { const n = (o.tekst.match(/\{\{\d+\}\}/g) || []).length; need(n === o.gaten.length, `aantal gaten (${n}) <> gaten[] (${o.gaten.length})`); } break;
    case 'koppel': need(arr(o.paren) && o.paren.length >= 2 && o.paren.every((p) => p.links != null && p.rechts != null), 'paren'); break;
    case 'volgorde': need(arr(o.items) && o.items.length >= 2, 'items'); break;
    case 'waaronwaar': need(o.stelling && typeof o.juist === 'boolean' && o.motivatie && arr(o.foutemotivaties), 'stelling/juist/motivatie/foutemotivaties'); break;
    case 'situatie': need(o.afbeelding && arr(o.voertuigen) && (o.modus === 'volgorde' || o.modus === 'klik') && o.correct != null, 'afbeelding/voertuigen/modus/correct'); break;
    case 'hotspot': need(o.afbeelding && arr(o.zones) && o.zones.some((z) => z.correct), 'afbeelding/zones'); break;
    case 'tabel': need(arr(o.kolommen) && arr(o.rijen) && o.rijen.every((r) => arr(r.cellen)), 'kolommen/rijen'); break;
    case 'bord': need(o.afbeelding && ['naam', 'categorie'].includes(o.modus), 'afbeelding/modus (alleen naam of categorie; geen codes leren)'); need(o.modus === 'categorie' ? !!o.categorie : arr(o.antwoorden), 'antwoorden/categorie'); break;
    case 'reken': need(typeof o.antwoord === 'number', 'antwoord (getal)'); break;
  }
  return e;
}
const oefeningen = [];
const seenEx = new Set();
let uitVerificatie = 0;
for (const o of oefRaw) {
  const e = validateEx(o);
  if (e.length) { err(`Oefening ${o.id || '?'} (${o._bron}): ${e.join('; ')}`); continue; }
  if (seenEx.has(o.id)) { err('Dubbel oefening-id ' + o.id); continue; }
  seenEx.add(o.id);
  if (verifActive && !o._demo) {
    const v = verif[o.id];
    if (!v || v.status !== 'ok') { uitVerificatie++; continue; }
  }
  const x = Object.assign({}, o);
  delete x._bron; delete x._demo;
  x.les = x.les || (curriculum[curIndex.get(x.onderwerp)] || {}).les;
  x.gewicht = x.gewicht || 'gewoon';
  x.moeilijkheid = x.moeilijkheid || 1;
  oefeningen.push(x);
  if (x.afbeelding) resolveImg(x.afbeelding);
}
if (uitVerificatie) console.log(`[info] ${uitVerificatie} oefening(en) niet opgenomen (verificatie niet 'ok').`);

/* ---------- boeken (pagina's per les) ---------- */
function blokOrder(b) {
  const ix = (b.curriculum || []).map((c) => curIndex.has(c) ? curIndex.get(c) : 9999);
  return ix.length ? Math.min(...ix) : 9999;
}
function lesVanBlok(b) { return b.les; }
/* ----- het boek: met de hand geschreven in data/boek/h<N>.json (demo: data/_demo/boek) ----- */
const boekFiles = DEMO_ONLY ? [] : jsonFiles(path.join(DATA, 'boek'));
const boekDir = (DEMO && !boekFiles.length) ? path.join(DATA, '_demo', 'boek') : path.join(DATA, 'boek');
const hoofdstukken = [];
for (const f of jsonFiles(boekDir)) {
  const d = readJSON(f);
  if (!d || !Array.isArray(d.paragrafen)) { err(path.relative(ROOT, f) + ': geen paragrafen'); continue; }
  d._file = path.basename(f);
  // nummering volgt data/hoofdstukken.json via het veld 'thema' (hoofdstuk- en paragraafnummers in het bestand zijn dan de bestandseigen nummers)
  if (d.thema) {
    if (!themaNr[d.thema]) err(path.relative(ROOT, f) + ": onbekend thema '" + d.thema + "' (staat niet in data/hoofdstukken.json)");
    else if (d.hoofdstuk !== themaNr[d.thema]) {
      const oud = String(d.hoofdstuk), nw = themaNr[d.thema];
      d.hoofdstuk = nw;
      d.paragrafen.forEach((p) => { if (typeof p.nr === 'string' && p.nr.startsWith(oud + '.')) p.nr = nw + p.nr.slice(oud.length); });
    }
  }
  hoofdstukken.push(d);
}
hoofdstukken.sort((x, y) => x.hoofdstuk - y.hoofdstuk);
if (!hoofdstukken.length) {
  const m = 'Geen boekbestanden gevonden in data/boek (h<N>.json). Het boek wordt met de hand geschreven; draai met --demo voor voorbeeldpagina\'s.';
  if (LENIENT) warn(m); else err(m);
}
const THEMA_VAN_H = {};
HOOFD.forEach((h, i) => { THEMA_VAN_H[i + 1] = h; });

/* validatie van pagina's */
const BLOK_TYPES = ['punten', 'kaarten', 'vergelijk', 'schema', 'kader', 'tabel', 'voorbeeld', 'grid', 'tekst', 'tip', 'oefening'];
const KADER_SOORTEN = ['regel', 'letop', 'zwarefout', 'tip', 'gewest'];
function zin(where, t, opts) {
  opts = opts || {};
  if (typeof t !== 'string' || !t.trim()) { err(where + ': lege of ontbrekende tekst'); return; }
  const x = t.trim();
  if (!opts.titel && !/[.?!)…"”]$/.test(x)) err(where + ': zin eindigt niet op . ? ! of ) -> "' + x.slice(-40) + '"');
  if (/\b(bv|o\.a|enz|d\.w\.z|t\.o\.v|nl|bijv|vb)\.$/i.test(x) || /:$/.test(x)) err(where + ': afgebroken zin -> "' + x.slice(-40) + '"');
  if (/\((?:\s*[A-GZ]\d{1,2}[a-z]?(?:[_-]\d+)?\s*[,)])/.test(x) || /\bart(?:ikel|\.)\s*\d/i.test(x)) warn(where + ': bordcode of artikelnummer in zichtbare tekst -> "' + x.slice(0, 60) + '"');
  if (opts.maxWoorden && x.split(/\s+/).length > opts.maxWoorden) warn(where + ': langer dan ' + opts.maxWoorden + ' woorden -> "' + x.slice(0, 50) + '"');
}
function img(where, naam) {
  if (!naam) { err(where + ': afbeelding ontbreekt'); return; }
  if (!resolveImg(naam)) err(where + ": onbekende afbeelding '" + naam + "'");
}
function valideerPagina(pg, where) {
  if (!pg.id || !pg.titel) err(where + ': id of titel ontbreekt');
  if (pg.intro) zin(where + ' intro', pg.intro);
  const bl = Array.isArray(pg.blokken) ? pg.blokken : [];
  if (bl.length < 3) warn(where + ' (' + (pg.titel || '?') + '): slechts ' + bl.length + ' inhoudsblok(ken); minimum is 3');
  if (bl.filter((x) => x.type === 'kader' || x.type === 'tip').length > 1) warn(where + ' (' + (pg.titel || '?') + '): meer dan 1 kader op de pagina');
  bl.forEach((k, i) => {
    const w = where + ' blok ' + (i + 1) + ' (' + k.type + ')';
    if (!BLOK_TYPES.includes(k.type)) { err(w + ': onbekend type'); return; }
    switch (k.type) {
      case 'punten': if (!Array.isArray(k.items) || !k.items.length) err(w + ': geen items'); else { if (k.items.length > 5) warn(w + ': meer dan 5 punten'); k.items.forEach((t) => zin(w, t)); } break;
      case 'kaarten': if (!Array.isArray(k.items) || !k.items.length) err(w + ': geen items'); else { if (k.items.length > 6) warn(w + ': meer dan 6 kaarten'); k.items.forEach((c) => { img(w, c.afb); if (!c.naam) err(w + ': kaart zonder naam'); if (c.uitleg) zin(w + ' uitleg', c.uitleg, { maxWoorden: 16 }); if (c.letop) zin(w + ' letop', c.letop); }); } break;
      case 'vergelijk': ['links', 'rechts'].forEach((z) => { if (!k[z]) err(w + ': ' + z + ' ontbreekt'); else { img(w, k[z].afb); zin(w + ' ' + z, k[z].tekst, { titel: true }); } }); if (k.midden) { img(w, k.midden.afb); zin(w + ' midden', k.midden.tekst, { titel: true }); } zin(w + ' verschil', k.verschil); break;
      case 'schema': img(w, k.afb); zin(w + ' bijschrift', k.bijschrift); (k.punten || []).forEach((t) => zin(w, t)); break;
      case 'kader': if (!KADER_SOORTEN.includes(k.soort)) err(w + ': onbekende soort ' + k.soort); zin(w + ' tekst', k.tekst); if (k.soort === 'gewest') { if (!k.gewest) err(w + ': gewest-object ontbreekt'); else Object.values(k.gewest).forEach((t) => zin(w + ' gewest', t)); } break;
      case 'tabel': if (!Array.isArray(k.kolommen) || !Array.isArray(k.rijen) || !k.rijen.length) err(w + ': kolommen/rijen'); else if (k.rijen.length > 6) warn(w + ': meer dan 6 rijen'); break;
      case 'voorbeeld': zin(w, k.tekst); break;
      case 'grid': if (!Array.isArray(k.items) || !k.items.length) err(w + ': geen items'); else { if (k.items.length > 9) warn(w + ': meer dan 9 cellen'); k.items.forEach((c) => { img(w, c.afb); if (!c.naam) err(w + ': cel zonder naam'); if (c.uitleg) zin(w + ' uitleg', c.uitleg, { maxWoorden: 16 }); if (c.letop) zin(w + ' letop', c.letop); }); } break;
      case 'tekst': { const ts = Array.isArray(k.alineas) ? k.alineas : (Array.isArray(k.items) ? k.items : [k.tekst]); ts.forEach((t) => zin(w, t)); break; }
      case 'tip': zin(w + ' tekst', k.tekst); break;
      case 'oefening': (k.ids || [k.id]).forEach((id) => { if (!id || !exLookup.has(id)) err(w + ': onbekende oefening ' + id); }); break;
    }
  });
  (pg.theorieblokken || []).forEach((id) => { if (!blokIds.has(id)) err(where + ': onbekend theorieblok ' + id); });
}

const expliciet = new Set(); // ids die een boekpagina zelf via een 'oefening'-blok aanwijst
hoofdstukken.forEach((h) => h.paragrafen.forEach((par) => (par.paginas || []).forEach((pg) => (pg.blokken || []).filter((x) => x.type === 'oefening').forEach((x) => (x.ids || [x.id]).forEach((id) => expliciet.add(id))))));
const boeken = {};
const exLoc = {};
const blokPagina = {};
const paginaIds = new Set();
const gekoppeld = new Set();
const exLookup = new Map(oefeningen.map((o) => [o.id, o]));
const oefPerBlok = {};
oefeningen.forEach((o) => { if (o.theorieblok && blokIds.has(o.theorieblok)) (oefPerBlok[o.theorieblok] = oefPerBlok[o.theorieblok] || []).push(o.id); });
for (const les of [1, 2, 3, 4]) {
  const chs = hoofdstukken.filter((h) => h.les === les);
  const pages = [{ t: 'intro', titel: 'Inleiding', toc: true }];
  for (const h of chs) {
    const hn = h.hoofdstuk, hoofdstuk = h.titel || (THEMA_VAN_H[hn] || {}).titel || ('Hoofdstuk ' + hn);
    if (h.intro && h.intro.tekst) zin('H' + hn + ' intro', h.intro.tekst);
    (h.intro && h.intro.doelen || []).forEach((t) => zin('H' + hn + ' doel', t));
    pages.push({ t: 'opener', hn, hoofdstuk, titel: hoofdstuk, nr: String(hn), intro: (h.intro || {}).tekst || '', doelen: (h.intro || {}).doelen || [], toc: true, par: String(hn) });
    for (const par of h.paragrafen) {
      let k = 0;
      const parBlokken = new Set();
      const secties = [];
      if (par.intro !== undefined) { if (!String(par.intro).trim()) err('h' + hn + ' ' + par.nr + ': lege intro'); else zin('h' + hn + ' ' + par.nr + ' intro', par.intro); }
      (par.paginas || []).forEach((pg, pi) => {
        const where = 'h' + hn + ' ' + par.nr + ' sectie ' + (pi + 1);
        if (paginaIds.has(pg.id)) err('Dubbele pagina-id ' + pg.id); paginaIds.add(pg.id);
        valideerPagina(pg, where);
        k++;
        const minis = [];
        let reeks = false;
        const oefBlokken = (pg.blokken || []).filter((x) => x.type === 'oefening');
        oefBlokken.forEach((x) => { const ids = x.ids || [x.id]; if (ids.length >= 3) reeks = true; ids.forEach((id) => { if (exLookup.has(id) && !gekoppeld.has(id)) { minis.push(id); gekoppeld.add(id); } }); });
        (pg.theorieblokken || []).forEach((id) => {
          parBlokken.add(id);
          if (oefBlokken.length) return; // pagina met een eigen oefening-blok: geen extra mini's van de theorieblokken
          (oefPerBlok[id] || []).forEach((eid) => { const e = exLookup.get(eid); if (e && e.mini && !gekoppeld.has(eid) && !expliciet.has(eid)) { minis.push(eid); gekoppeld.add(eid); } });
        });
        secties.push({ id: pg.id, nr: par.nr + '.' + k, titel: pg.titel, intro: pg.intro || '', blokken: pg.blokken || [], theorieblokken: pg.theorieblokken || [], mini: minis, reeks });
      });
      // gewone oefeningen van deze paragraaf: onderaan dezelfde pagina
      const oefs = [];
      for (const id of parBlokken) {
        for (const eid of oefPerBlok[id] || []) {
          const e = exLookup.get(eid);
          if (!e || e.mini || gekoppeld.has(eid) || expliciet.has(eid)) continue;
          gekoppeld.add(eid); k++;
          oefs.push({ ex: eid, blok: id, nr: par.nr + '.' + k });
        }
      }
      const pageNr = pages.length + 1;
      secties.forEach((sc) => sc.theorieblokken.forEach((id) => { if (!blokPagina[id]) blokPagina[id] = { les, pagina: pageNr, sectie: sc.nr }; }));
      pages.push({ t: 'paragraaf', hn, hoofdstuk, par: par.nr, parTitel: par.titel, parIntro: par.intro || '', titel: par.titel, nr: par.nr + '.0', secties, oefeningen: oefs, toc: true });
    }
  }
  chs.forEach((h, ti) => {
    if (h.samenvatting && h.samenvatting.length) {
      h.samenvatting.forEach((t) => zin('H' + h.hoofdstuk + ' samenvatting', t));
      pages.push({ t: 'samenvatting', hn: h.hoofdstuk, hoofdstuk: h.titel, titel: 'Samenvatting: ' + h.titel, punten: h.samenvatting, toc: !pages.some((p) => p.t === 'samenvatting') });
    }
  });
  pages.push({ t: 'eindtest', titel: 'Eindtest les ' + les, toc: true });
  pages.forEach((p, i) => {
    if (p.t === 'paragraaf') {
      p.secties.forEach((sc) => sc.mini.forEach((id) => { exLoc[id] = { les, pagina: i + 1, nr: sc.nr }; }));
      p.oefeningen.forEach((o) => { exLoc[o.ex] = { les, pagina: i + 1, nr: o.nr }; });
    }
  });
  boeken[les] = { les, titel: LES_TITELS[les], ondertitel: LES_ONDERTITELS[les], themas: chs.map((h) => ({ id: 'h' + h.hoofdstuk, naam: h.titel, nr: h.hoofdstuk })), pages, leeg: chs.length === 0 };
}
// oefeningen die nergens in het boek staan (waarschuwing, enkel in oefenbank)
const losse = oefeningen.filter((o) => !gekoppeld.has(o.id) && hoofdstukken.length);
if (losse.length) warn(losse.length + " oefening(en) niet aan een boekpagina gekoppeld (via 'theorieblokken'): enkel zichtbaar in de oefenbank, bv. " + losse.slice(0, 4).map((o) => o.id + '->' + o.theorieblok).join(', '));

// afbeeldingen van blokken resolven + bronnen controleren
for (const b of theorie) {
  (b.afbeeldingen || []).forEach(resolveImg);
  (b.kaarten || []).forEach((k) => resolveImg(k.afb));
  (b.vergelijk || []).forEach((v) => (v.afbs || []).forEach(resolveImg));
  for (const r of b.regels || []) {
    for (const v of Object.values(r)) if (typeof v === 'string' && bordenIndex[v]) resolveImg(v);
  }
  for (const s of b.bronnen || []) if (!bronnen[s]) err(`Blok ${b.id}: onbekende bron ${s}`);
}
// regel-tabellen: codes in regels altijd resolven (voor miniaturen)
const alleBordCodes = Object.keys(bordenIndex);
alleBordCodes.forEach((c) => { if (bordFiles[c] && !afb[c]) resolveImg(c); });
// credits voor niet-pd afbeeldingen
Object.keys(afb).forEach((n) => {
  const c = creditByCode[n];
  if (afb[n] && c && !/public domain/i.test(c.licentie)) afb[n].credit = { auteur: c.auteur, licentie: c.licentie, url: c.url };
});

/* ---------- curriculum-checklist ---------- */
const checklistFouten = [];
const nieuweCurriculum = curriculum.map((c) => {
  const blokken = theorie.filter((b) => (b.curriculum || []).includes(c.id));
  const nOef = oefeningen.filter((o) => o.onderwerp === c.id).length;
  const heeftAfb = blokken.some((b) => (b.afbeeldingen || []).concat((b.kaarten || []).map((k) => k.afb)).some((a) => afb[a]));
  const heeftBron = blokken.some((b) => (b.bronnen || []).some((s) => bronnen[s]));
  const nc = Object.assign({}, c, {
    theorie: blokken.length > 0,
    oefeningen3: nOef >= 3,
    afbeelding: heeftAfb,
    bron: heeftBron,
  });
  const missing = ['theorie', 'oefeningen3', 'afbeelding', 'bron'].filter((k) => !nc[k]);
  if (missing.length && (!LESSEN.length || LESSEN.includes(c.les))) checklistFouten.push(`${c.id} (${c.naam}): ontbreekt ${missing.join(', ')}${nOef < 3 ? ` [${nOef} oefeningen]` : ''}`);
  return nc;
});
if (!DEMO) {
  fs.writeFileSync(path.join(DATA, 'curriculum.json'), JSON.stringify(nieuweCurriculum, null, 1) + '\n');
}
if (checklistFouten.length) {
  const msg = 'Curriculum-checklist onvolledig:\n  - ' + checklistFouten.join('\n  - ');
  if (LENIENT) warn(msg); else err(msg);
}

/* ---------- uitvoer ---------- */
function report() {
  warnings.forEach((w) => console.warn('[waarschuwing] ' + w));
  errors.forEach((e) => console.error('[FOUT] ' + e));
}
if (errors.length && !LENIENT) {
  report();
  console.error(`\nBuild MISLUKT: ${errors.length} fout(en).`);
  process.exit(1);
}
if (errors.length) console.warn(`[lenient] ${errors.length} fout(en) genegeerd (zie onder).`);

const cursus = {
  meta: { gebouwd: new Date().toISOString(), demo: DEMO },
  curriculum: nieuweCurriculum.map((c) => ({ id: c.id, les: c.les, naam: c.naam, thema: c.thema })),
  themaNamen: THEMA_NAMEN,
  themaNr,
  exLoc,
  boeken,
  blokPagina,
  theorie: theorie.map((b) => { const x = Object.assign({}, b); delete x._ord; return x; }),
  oefeningen,
  bronnen,
  borden: Object.fromEntries(Object.entries(bordenIndex).map(([k, v]) => [k, { naam: v.naam_nl, cat: v.categorie }])),
  afb: Object.fromEntries(Object.entries(afb).filter(([, v]) => v)),
  credits,
};
fs.mkdirSync(path.join(SITE, 'data'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'data', 'cursus.js'), '/* gegenereerd door scripts/build.js, niet met de hand aanpassen */\nwindow.CURSUS = ' + JSON.stringify(cursus) + ';\n');

// demo-afbeeldingen
const demoOut = path.join(SITE, 'img', '_demo');
fs.rmSync(demoOut, { recursive: true, force: true });
if (DEMO && fs.existsSync(demoImgDir)) {
  fs.mkdirSync(demoOut, { recursive: true });
  for (const f of fs.readdirSync(demoImgDir)) fs.copyFileSync(path.join(demoImgDir, f), path.join(demoOut, f));
}

/* ---------- HTML ---------- */
const NAV = [
  ['index.html', 'Start'],
  ['les1.html', 'Les 1'],
  ['les2.html', 'Les 2'],
  ['les3.html', 'Les 3'],
  ['les4.html', 'Les 4'],
  ['examen.html', 'Proefexamen'],
  ['oefenbank.html', 'Oefenbank'],
  ['spiekbrief.html', 'Spiekbrief'],
  ['mijnfouten.html', 'Mijn fouten'],
  ['bronnen.html', 'Bronnen'],
];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231d4e89'/%3E%3Cpath d='M16 5l9 17H7z' fill='%23f5b800' stroke='%23fff' stroke-width='2' stroke-linejoin='round'/%3E%3Crect x='15' y='11' width='2' height='6' fill='%231d4e89'/%3E%3Crect x='15' y='19' width='2' height='2' fill='%231d4e89'/%3E%3C/svg%3E";

function shell({ file, title, page, les, main, scripts = [], extraClass = '' }) {
  const navHtml = NAV.map(([href, label]) => {
    const cur = href === file ? ' aria-current="page"' : '';
    return `<li><a href="${href}"${cur}>${esc(label)}</a></li>`;
  }).join('');
  return `<!doctype html>
<html lang="nl-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Theorie rijbewijs B Vlaanderen</title>
<meta name="description" content="Gratis online cursus voor het theorie-examen rijbewijs B in Vlaanderen: uitleg, oefeningen en proefexamen.">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap">
<script>(function(){try{var t=localStorage.getItem('rbc.theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
<link rel="stylesheet" href="css/style.css">
</head>
<body data-page="${page}"${les ? ` data-les="${les}"` : ''} class="${extraClass}">
<a class="skip" href="#main">Naar de inhoud</a>
<header class="topbar">
  <div class="topbar-in">
    <a class="brand" href="index.html" aria-label="Theorie rijbewijs B, startpagina">
      <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="currentColor"/><path d="M16 6l9 16.5H7z" fill="#f5b800" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><rect x="15" y="11.5" width="2" height="5.5" fill="#1d4e89"/><rect x="15" y="19" width="2" height="2" fill="#1d4e89"/></svg>
      <span class="brand-text">Theorie rijbewijs B<small>Vlaanderen</small></span>
    </a>
    <button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="site-nav"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg><span class="sr">Menu</span></button>
    <nav class="sitenav" id="site-nav" aria-label="Hoofdmenu"><ul>${navHtml}</ul></nav>
    <button class="theme-btn" id="theme-btn" type="button" aria-label="Wissel tussen lichte en donkere modus" title="Licht / donker"><svg class="ic-moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" fill="currentColor"/></svg><svg class="ic-sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
  </div>
</header>
${main}
<footer class="footer">
  <p>Gratis leermiddel, geen officiële uitgave van de overheid. Controleer belangrijke regels altijd bij de <a href="bronnen.html">bronnen</a>. Afbeeldingen: <a href="bronnen.html#afbeeldingen">auteurs en licenties</a>. Je voortgang blijft enkel in je eigen browser.</p>
</footer>
<noscript><p class="noscript">Voor deze cursus is JavaScript nodig (voor de oefeningen en het bladeren door de pagina's).</p></noscript>
<script defer src="data/cursus.js"></script>
<script defer src="js/common.js"></script>
${scripts.map((s) => `<script defer src="js/${s}"></script>`).join('\n')}
</body>
</html>
`;
}

const pages = {};

// index
pages['index.html'] = shell({
  file: 'index.html', title: 'Start', page: 'home',
  scripts: ['exercises.js', 'quiz.js', 'pages.js'],
  main: `<main id="main" class="wrap home">
  <section class="hero">
    <div class="hero-text">
      <p class="eyebrow">Gratis online cursus</p>
      <h1>Theorie rijbewijs B <span>in Vlaanderen</span></h1>
      <p class="lead">Vier lessen, opgebouwd als een boek: eerst de uitleg, meteen daarna oefeningen. Sluit elke les af met een eindtest en test jezelf in het proefexamen.</p>
      <div class="hero-actions" id="hero-actions"><a class="btn btn-primary btn-lg" href="les1.html">Begin met les 1</a><a class="btn btn-lg" href="#inleiding">Hoe werkt het?</a></div>
    </div>
    <div class="hero-progress card" id="home-progress" aria-live="polite"></div>
  </section>

  <section aria-labelledby="h-lessen">
    <h2 id="h-lessen" class="section-title">De vier lessen</h2>
    <div class="lesson-grid" id="lesson-grid"></div>
  </section>

  <section aria-labelledby="h-tools">
    <h2 id="h-tools" class="section-title">Oefenen en opzoeken</h2>
    <div class="tool-grid">
      <a class="tool card" href="examen.html"><span class="tool-ic" aria-hidden="true">${'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>'}</span><h3>Proefexamen</h3><p>Zoals het echte examen: 50 vragen, 50 punten, min 1 of min 5 per fout. Slagen vanaf 41.</p></a>
      <a class="tool card" href="oefenbank.html"><span class="tool-ic" aria-hidden="true">${'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2"/></svg>'}</span><h3>Oefenbank</h3><p>Alle oefeningen op één plaats. Filter op les, onderwerp of type en oefen waar je wilt.</p></a>
      <a class="tool card" href="mijnfouten.html"><span class="tool-ic" aria-hidden="true">${'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/></svg>'}</span><h3>Mijn fouten <span class="count-badge" id="fouten-count" hidden></span></h3><p>Alle vragen die je fout had, bij elkaar. Herhaal ze tot ze zitten.</p></a>
      <a class="tool card" href="spiekbrief.html"><span class="tool-ic" aria-hidden="true">${'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/></svg>'}</span><h3>Spiekbrief</h3><p>De belangrijkste regels op één afdrukbaar blad, per les te kiezen.</p></a>
    </div>
  </section>

  <section id="inleiding" class="intro-sec" aria-labelledby="h-intro">
    <h2 id="h-intro" class="section-title">Inleiding: zo werkt de cursus</h2>
    <div class="steps">
      <article class="step card"><span class="step-n">1</span><h3>Lees een pagina</h3><p>Elke les is een boek. Je ziet telkens één klein onderwerp met korte regels en grote afbeeldingen. Onderaan blader je met <kbd>Volgende</kbd> of met de pijltjestoetsen <kbd>←</kbd> <kbd>→</kbd>.</p></article>
      <article class="step card"><span class="step-n">2</span><h3>Oefen meteen</h3><p>Na de uitleg komen oefeningen over precies die stof, elk op een eigen pagina. Klik op <em>Nakijken</em>, lees de uitleg en probeer opnieuw als het fout was. Twijfel je? Met <em>Toon theorie</em> spring je terug naar de uitleg.</p></article>
      <article class="step card"><span class="step-n">3</span><h3>Herhaal en test</h3><p>Sluit een les af met de samenvatting en een eindtest van 20 vragen. Je ziet wat je moet herhalen. Foute vragen komen automatisch in <a href="mijnfouten.html">Mijn fouten</a> terecht.</p></article>
      <article class="step card"><span class="step-n">4</span><h3>Doe het proefexamen</h3><p>Pas als de lessen goed zitten, doe je het <a href="examen.html">proefexamen</a> met 50 vragen en dezelfde puntentelling als het echte examen.</p></article>
    </div>

    <div class="two-col">
      <article class="card prose">
        <h3>Het theorie-examen in Vlaanderen</h3>
        <ul class="ticks">
          <li>Je mag het theorie-examen afleggen vanaf <strong>17 jaar</strong>.</li>
          <li>Het examen bestaat uit <strong>50 meerkeuzevragen</strong>. Je start met <strong>50 punten</strong>.</li>
          <li>Elk fout of onbeantwoord antwoord kost <strong>1 punt</strong>. Een fout antwoord op een vraag over een zware overtreding (3de of 4de graad) of over de maximumsnelheid kost <strong>5 punten</strong>.</li>
          <li>Je bent <strong>geslaagd vanaf 41 op 50</strong>.</li>
          <li>Volgens Vlaanderen.be heb je <strong>15 seconden per vraag</strong>, nadat de vraag volledig is voorgelezen.</li>
          <li>Na het examen kun je je foute antwoorden bekijken. Een geslaagd examen is <strong>3 jaar</strong> geldig.</li>
        </ul>
        <p class="small muted">Bron: Vlaanderen.be, <a href="bronnen.html">zie bronnen</a>. Regels kunnen wijzigen: controleer ze vóór je examen.</p>
      </article>
      <article class="card prose">
        <h3>Zo gebruik je deze site</h3>
        <ul class="ticks">
          <li><strong>Onderaan</strong> zit een kleine balk: vorige, volgende, <em>Inhoud</em> om naar een onderwerp te springen en een knop om van les te wisselen.</li>
          <li><strong>Onthouden</strong>: je plek en je resultaten worden in je eigen browser bewaard, zonder account.</li>
          <li><strong>Gewestverschillen</strong> staan in een kader met drie badges: Vlaanderen, Wallonië en Brussel. Voor je examen telt Vlaanderen.</li>
          <li><strong>Kaders</strong>: <span class="chip chip-regel">Regel</span> <span class="chip chip-letop">Let op</span> <span class="chip chip-zwarefout">Zware fout</span> <span class="chip chip-tip">Tip</span>.</li>
          <li><strong>Donkere modus</strong> met de knop rechtsboven. <strong>Afdrukken</strong> kan het best via de <a href="spiekbrief.html">spiekbrief</a>.</li>
        </ul>
      </article>
    </div>
    <p class="notice" id="wegcode-note">De huidige wegcode blijft gelden tot 31 mei 2027; op 1 juni 2027 volgt de nieuwe Code van de openbare weg. In deze cursus leer je de regels die nu gelden, met een opmerking waar de nieuwe code iets wijzigt.</p>
  </section>
</main>`,
});

// lessen
for (const les of [1, 2, 3, 4]) {
  pages[`les${les}.html`] = shell({
    file: `les${les}.html`, title: `Les ${les}: ${LES_TITELS[les]}`, page: 'les', les,
    scripts: ['exercises.js', 'quiz.js', 'lesson.js'],
    main: `<main id="main" class="reader" tabindex="-1">
  <div class="slide-wrap" id="book-page"><p class="loading">Les ${les} wordt geladen…</p></div>
</main>
<div class="float-bar" id="float-bar" role="navigation" aria-label="Bladeren"></div>`,
  });
}

pages['examen.html'] = shell({
  file: 'examen.html', title: 'Proefexamen', page: 'exam', scripts: ['exercises.js', 'quiz.js', 'pages.js'],
  main: `<main id="main" class="wrap narrow"><div id="exam-root"><p class="loading">Proefexamen wordt geladen…</p></div></main>`,
});
pages['oefenbank.html'] = shell({
  file: 'oefenbank.html', title: 'Oefenbank', page: 'bank', scripts: ['exercises.js', 'quiz.js', 'pages.js'],
  main: `<main id="main" class="wrap narrow"><header class="page-head"><p class="eyebrow">Oefenen</p><h1>Oefenbank</h1><p class="lead">Alle oefeningen van de cursus. Kies een les, onderwerp of type en oefen zo lang je wilt.</p></header><div id="bank-root"><p class="loading">Oefeningen worden geladen…</p></div></main>`,
});
pages['mijnfouten.html'] = shell({
  file: 'mijnfouten.html', title: 'Mijn fouten', page: 'fouten', scripts: ['exercises.js', 'quiz.js', 'pages.js'],
  main: `<main id="main" class="wrap narrow"><header class="page-head"><p class="eyebrow">Herhalen</p><h1>Mijn fouten</h1><p class="lead">Elke vraag die je fout beantwoordde, staat hier. Beantwoord ze goed en ze verdwijnen uit de lijst.</p></header><div id="fouten-root"><p class="loading">Even laden…</p></div></main>`,
});
pages['spiekbrief.html'] = shell({
  file: 'spiekbrief.html', title: 'Spiekbrief', page: 'spiek', scripts: ['pages.js'],
  main: `<main id="main" class="wrap spiek"><header class="page-head no-print"><p class="eyebrow">Samenvatting</p><h1>Spiekbrief</h1><p class="lead">De belangrijkste regels, borden en snelheden op één blad. Kies welke lessen je wilt zien en druk af (Ctrl+P).</p><div id="spiek-controls" class="spiek-controls"></div></header><div id="spiek-root"></div></main>`,
});
pages['bronnen.html'] = shell({
  file: 'bronnen.html', title: 'Bronnen en afbeeldingen', page: 'bronnen', scripts: ['pages.js'],
  main: `<main id="main" class="wrap narrow"><header class="page-head"><p class="eyebrow">Transparantie</p><h1>Bronnen &amp; afbeeldingen</h1><p class="lead">Waar komt de leerstof vandaan, en wie maakte de afbeeldingen? Alles hier is controleerbaar.</p></header><div id="bronnen-root"><p class="loading">Even laden…</p></div></main>`,
});

for (const [f, html] of Object.entries(pages)) fs.writeFileSync(path.join(SITE, f), html);

report();
const nOef = oefeningen.length;
console.log(`Build OK${DEMO ? ' (DEMO)' : ''}${LENIENT ? ' (lenient)' : ''}: ${theorie.length} theorieblokken, ${nOef} oefeningen${DEMO ? ` (waarvan ${demoCount} demo)` : ''}, ${Object.keys(bronnen).length} bronnen, ${Object.keys(afb).filter((k) => afb[k]).length} afbeeldingen gebruikt, ${credits.length} credits.`);
