'use strict';
// Extra illustraties voor de eindtest van les 1 (vragen over markeringen, plaatsen en gewesten).
// Genereert site/img/schemas/schema-*.svg en data/schemas-extra-eindtest.json (type 'oefening').
// Gebruik: node scripts/schemas/extra-eindtest.js
// Regels: geen tekst die het antwoord geeft, geen bordcodes in zichtbare tekst; elke SVG heeft <title> + <desc>.
const fs = require('fs');
const path = require('path');
const lib = require('./lib');
const { Svg, C, f, ROOT } = lib;

const INK = '#1c2230';
const REG = [];

function done(s, meta) {
  const e = s.finish({ theorieblok: meta.blok, bronnen: meta.bron, type: 'oefening' });
  REG.push(e);
  return e;
}
const tree = (s, x, y, r = 12) => {
  s.circle(x + 2, y + 3, r, '#1c2230', 'opacity=".12"');
  s.circle(x, y, r, '#3f8f4a', 'stroke="#2f6e38" stroke-width="2"');
  s.circle(x - r * 0.25, y - r * 0.25, r * 0.5, '#58ad62');
};
// huis (bovenaanzicht): dak met nok
const house = (s, x, y, w, h, col = '#c8553d') => {
  s.rect(x + 3, y + 4, w, h, '#1c2230', 'opacity=".14"');
  s.rect(x, y, w, h, col, 'stroke="#7a2e1f" stroke-width="2"');
  s.rect(x, y, w, h / 2, '#00000022');
  s.line(x, y + h / 2, x + w, y + h / 2, '#7a2e1f', 2);
};

// ---------- 1. streepmarkering: korte dichte trekken (kolom 3 van les 1, T10) ----------
(function () {
  const W = 600, H = 560;
  const s = new Svg('schema-streep-aankondiging-oefening', 'Streepmarkering op de weg',
    'Bovenaanzicht van een weg met twee rijrichtingen waarop een auto naar boven rijdt. Onderaan ligt een middenlijn met lange trekken en grote tussenruimten. Daarboven ligt een stuk met korte trekken dicht bij elkaar; een accolade op het gras naast de weg wijst dat stuk aan. Verder vooruit is de middenlijn onzichtbaar en staat er een vraagteken.', { w: W, h: H, bg: C.grass });
  const rx = 150, rw = 300, cx = rx + rw / 2;
  s.rect(0, 0, W, H, C.grass);
  for (let y = 0; y < H; y += 60) s.rect(0, y, W, 30, C.grass2, 'opacity=".35"');
  s.rect(rx, 0, rw, H, C.road);
  // randlijnen (doorlopend)
  s.rect(rx + 8, 0, 4, H, '#fff'); s.rect(rx + rw - 12, 0, 4, H, '#fff');
  // gewone onderbroken middenlijn (onderaan)
  for (let y = H - 30; y > 380; y -= 60) s.rect(cx - 3, y - 36, 6, 36, '#fff');
  // korte dichte trekken (gemarkeerd stuk)
  const zoneTop = 190, zoneBot = 350;
  for (let y = zoneBot; y > zoneTop; y -= 17) s.rect(cx - 3, y - 9, 6, 9, '#fff');
  // neutrale accolade naast de weg (op het gras, dus geen wegmarkering) rond het stuk met korte trekken
  { const bx = rx - 18, y1 = zoneTop - 8, y2 = zoneBot + 8, ym = (y1 + y2) / 2, r = 14;
    s.add(`<path d="M ${bx} ${y1} Q ${bx - r} ${y1} ${bx - r} ${y1 + r} L ${bx - r} ${ym - r} Q ${bx - r} ${ym} ${bx - 2 * r} ${ym} Q ${bx - r} ${ym} ${bx - r} ${ym + r} L ${bx - r} ${y2 - r} Q ${bx - r} ${y2} ${bx} ${y2}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`); }
  // vraagteken verder vooruit
  s.circle(cx, 95, 42, '#fff', `stroke="${INK}" stroke-width="4"`);
  s.text(cx, 118, '?', { size: 68, weight: 800, fill: INK });
  // auto in rechterrijstrook (rijdt naar boven)
  s.car(cx + 75, 470, 0, 'blauw', null);
  s.arrow(cx + 75, 420, cx + 75, 395, '#fff', 5);
  done(s, { blok: 'markeringen-strepen', bron: ['BORD-001'] });
})();

// ---------- 2. rij witte driehoeken op de weg (T10) ----------
(function () {
  const W = 600, H = 520;
  const s = new Svg('schema-markering-driehoeken-oefening', 'Markering voor een kruispunt',
    'Bovenaanzicht van een smalle weg die van onder op een brede dwarsweg uitkomt. Een blauwe auto rijdt in de rechterrijstrook naar het kruispunt. Vlak voor het kruispunt staat in die rijstrook een rij witte driehoeken met de punt naar de auto. Op de dwarsweg rijdt een rode auto van links naar rechts.', { w: W, h: H, bg: C.grass });
  s.rect(0, 0, W, H, C.grass);
  for (let y = 0; y < H; y += 60) s.rect(0, y, W, 30, C.grass2, 'opacity=".35"');
  const mx0 = 190, mx1 = 410; // minder brede weg
  const my0 = 40, my1 = 170;  // dwarsweg
  s.rect(0, my0, W, my1 - my0, C.road);
  s.rect(mx0, my1, mx1 - mx0, H - my1, C.road);
  // hoeken afronden met gras is niet nodig; lijnen
  s.rect(0, my0 + 6, W, 4, '#fff', 'opacity=".9"'); s.rect(0, my1 - 10, W, 4, '#fff', 'opacity=".9"');
  for (let x = 20; x < W; x += 70) s.rect(x, (my0 + my1) / 2 - 2.5, 36, 5, '#fff');
  const cx = (mx0 + mx1) / 2;
  for (let y = H - 30; y > my1 + 20; y -= 60) s.rect(cx - 2.5, y - 34, 5, 34, '#fff');
  s.rect(mx0 + 6, my1, 4, H - my1, '#fff'); s.rect(mx1 - 10, my1, 4, H - my1, '#fff');
  // driehoeken in de rechterrijstrook (punt naar de bestuurder = naar beneden)
  const lx0 = cx + 8, lx1 = mx1 - 14, n = 3, tw = (lx1 - lx0) / n;
  for (let i = 0; i < n; i++) {
    const x0 = lx0 + i * tw + 3, x1 = lx0 + (i + 1) * tw - 3;
    s.add(`<polygon points="${f(x0)},${my1 + 14} ${f(x1)},${my1 + 14} ${f((x0 + x1) / 2)},${my1 + 64}" fill="#fff"/>`);
  }
  s.car((cx + mx1) / 2, 400, 0, 'blauw', null);
  s.car(110, (my0 + my1) / 2 + 22, 90, 'rood', null);
  tree(s, 90, 260, 18); tree(s, 70, 340, 14); tree(s, 520, 300, 18); tree(s, 545, 390, 13); tree(s, 500, 460, 16);
  done(s, { blok: 'markeringen-dwars-pijlen', bron: ['BORD-001'] });
})();

// ---------- 3. drie soorten plaatsen (zonder cijfers) ----------
(function () {
  const W = 800, H = 540, rh = 172, gap = 12;
  const s = new Svg('schema-plaatsen-drie-oefening', 'Drie soorten plaatsen langs de weg',
    'Drie stroken onder elkaar, in bovenaanzicht. Boven: een straat in een bebouwde kom met huizen, trottoirs en het bord begin van de bebouwde kom. Midden: een gewone weg buiten de bebouwde kom tussen weilanden en bomen. Onder: een autosnelweg met een middenberm, twee rijstroken per richting en het bord begin van een autosnelweg.', { w: W, h: H, bg: '#eef0f3' });
  const strip = (i) => i * (rh + gap);
  // --- strook 1: bebouwde kom
  let y0 = strip(0);
  s.rect(0, y0, W, rh, '#a9c99a');
  s.rect(0, y0 + 56, W, 60, C.road);
  s.rect(0, y0 + 40, W, 16, C.sidewalk); s.rect(0, y0 + 116, W, 16, C.sidewalk);
  for (let x = 20; x < W; x += 60) s.rect(x, y0 + 84, 34, 4, '#fff');
  const cols = ['#c8553d', '#b8814f', '#a04a3a', '#d08a4a', '#c8553d', '#9c6a55', '#b8814f'];
  for (let i = 0; i < 7; i++) {
    house(s, 118 + i * 96, y0 + 4, 76, 34, cols[i]);
    house(s, 128 + i * 96 - (i % 2) * 8, y0 + 134, 72, 34, cols[(i + 3) % 7]);
  }
  s.car(560, y0 + 100, 90, 'rood', null);
  s.sign('F1b_horizontaal', 54, y0 + 28, 52, { pole: false });
  // --- strook 2: gewone weg buiten de kom
  y0 = strip(1);
  s.rect(0, y0, W, rh, '#86b96b');
  s.rect(0, y0, W, 40, '#a3cd7a'); s.rect(0, y0 + 132, W, 40, '#b7a35a', 'opacity=".55"');
  s.rect(0, y0 + 62, W, 48, C.road);
  s.rect(0, y0 + 66, W, 3, '#fff'); s.rect(0, y0 + 103, W, 3, '#fff');
  for (let x = 20; x < W; x += 70) s.rect(x, y0 + 84, 38, 4, '#fff');
  [[120, 22], [200, 128], [290, 24], [400, 146], [520, 20], [610, 140], [730, 26], [680, 24]].forEach(([x, y]) => tree(s, x, y0 + y, 13));
  house(s, 330, y0 + 128, 60, 30, '#b8814f');
  s.car(340, y0 + 74, 270, 'blauw', null); // rechts rijdend verkeer: naar het westen = noordelijke helft
  // --- strook 3: autosnelweg met middenberm
  y0 = strip(2);
  s.rect(0, y0, W, rh, '#86b96b');
  s.rect(0, y0 + 12, W, 148, C.road);
  s.rect(0, y0 + 12, W, 4, '#fff'); s.rect(0, y0 + 156, W, 4, '#fff');
  s.rect(0, y0 + 76, W, 20, '#74a85a', 'stroke="#c9c9c4" stroke-width="3"');
  for (let x = 6; x < W; x += 44) s.circle(x + 10, y0 + 86, 6, '#3f8f4a');
  for (let x = 20; x < W; x += 70) { s.rect(x, y0 + 45, 36, 4, '#fff'); s.rect(x, y0 + 124, 36, 4, '#fff'); }
  s.car(360, y0 + 142, 90, 'geel', null); // oost-rijdend = zuidelijke rijbaan (rechts rijdend verkeer)
  s.car(520, y0 + 30, 270, 'rood', null); // west-rijdend = noordelijke rijbaan
  s.car(180, y0 + 110, 90, 'groen', null);
  s.sign('F5', 62, y0 + 86, 66, { pole: false });
  // scheiding tussen de stroken
  for (let i = 1; i < 3; i++) s.rect(0, strip(i) - gap, W, gap, '#eef0f3');
  done(s, { blok: 'snelheden-overzicht-gewest', bron: ['SNEL-001', 'SNEL-002', 'SNEL-003', 'SNEL-007'] });
})();

// ---------- 4. kaartje van de drie gewesten ----------
(function () {
  const W = 800, H = 540;
  const s = new Svg('schema-belgie-gewesten-oefening', 'De drie gewesten van België',
    'Een vereenvoudigd kaartje van België met drie gekleurde delen: Vlaanderen in het noorden (geel), Wallonië in het zuiden (rood) en het Brussels Hoofdstedelijk Gewest als klein deel in het midden (blauw). Op elk deel staat de naam.', { w: W, h: H, bg: '#eaf2f8' });
  const k = 2.15; // px per km
  const x0lon = 2.45, y0lat = 51.55;
  const px = (lon, lat) => [f(110 + (lon - x0lon) * 71 * k), f(14 + (y0lat - lat) * 111 * k)];
  const pts = (arr) => arr.map(([lon, lat]) => px(lon, lat).join(',')).join(' ');
  const grens = [[3.0, 50.76], [3.3, 50.74], [3.6, 50.72], [3.9, 50.75], [4.15, 50.72], [4.38, 50.7], [4.6, 50.77], [4.85, 50.78], [5.1, 50.73], [5.45, 50.74], [5.72, 50.76]];
  const noord = [[2.55, 51.09], [3.37, 51.37], [3.9, 51.26], [4.25, 51.38], [4.4, 51.49], [4.78, 51.47], [5.1, 51.3], [5.5, 51.3], [5.8, 51.05], ...grens.slice().reverse(), [2.95, 50.74], [2.65, 50.84]];
  const zuid = [...grens, [5.95, 50.75], [6.03, 50.5], [6.4, 50.32], [6.12, 50.12], [5.85, 49.8], [5.8, 49.55], [5.4, 49.52], [5.0, 49.8], [4.85, 50.13], [4.3, 49.95], [4.15, 50.3], [3.65, 50.45], [3.2, 50.55], [3.05, 50.68]];
  s.add(`<polygon points="${pts(noord)}" fill="#f6d86a" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`);
  s.add(`<polygon points="${pts(zuid)}" fill="#e98a7e" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`);
  // Brussels Hoofdstedelijk Gewest (iets vergroot zodat het zichtbaar blijft)
  const cL = 4.36, cB = 50.84, sc = 1.5;
  const bru = [[4.25, 50.82], [4.3, 50.9], [4.38, 50.91], [4.45, 50.89], [4.48, 50.84], [4.43, 50.78], [4.33, 50.77], [4.26, 50.79]].map(([lo, la]) => [cL + (lo - cL) * sc, cB + (la - cB) * sc]);
  s.add(`<polygon points="${pts(bru)}" fill="#5b8fd9" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>`);
  const [nx, ny] = px(2.55, 51.28);
  s.text(nx + 10, ny, 'Noordzee', { size: 20, fill: '#5d8aa8', weight: 600 });
  const [vx, vy] = px(4.2, 51.2), [wx, wy] = px(4.95, 50.25), [bx, by] = px(cL, cB);
  s.text(vx, vy, 'Vlaanderen', { size: 34, weight: 800, fill: '#5c4a00' });
  s.text(wx, wy, 'Wallonië', { size: 34, weight: 800, fill: '#6b1f14' });
  // Brussel: label buiten de kaart met lijn naar het gewest
  const lx = 690, ly = 78;
  s.line(lx - 70, ly + 12, bx + 6, by - 4, INK, 3);
  s.circle(bx + 6, by - 4, 5, INK);
  s.add(`<rect x="${lx - 98}" y="${ly - 36}" width="196" height="52" rx="12" fill="#fff" stroke="#5b8fd9" stroke-width="3"/>`);
  s.text(lx, ly + 2, 'Brussel', { size: 28, weight: 800, fill: '#1f4a99' });
  done(s, { blok: 'snelheden-brussel-30', bron: ['SNEL-001', 'SNEL-004', 'SNEL-006'] });
})();

// ---------- 5. bordkaarten als antwoordoptie (L1-026) ----------
// Het bord zelf, groot en zonder tekst. Aparte bestandsnamen, zodat de oefening geen bordcode als bestandsnaam hoeft te bevatten.
[
  ['schema-optie-parkeerverbod', 'E1', 'Parkeerverbod'],
  ['schema-optie-stilstaan-parkeerverbod', 'E3', 'Stilstaan- en parkeerverbod'],
  ['schema-optie-verbod-keren', 'C33', 'Verbod te keren'],
  ['schema-optie-verboden-richting', 'C1', 'Verboden richting']
].forEach(([naam, code, label]) => {
  const s = new Svg(naam, 'Verkeersbord: ' + label, 'Het verkeersbord ' + label.toLowerCase() + ', groot afgebeeld op een witte achtergrond.', { w: 300, h: 300, bg: 'none' });
  s.sign(code, 150, 150, 270, { pole: false });
  done(s, { blok: 'borden-zonale-geldigheid', bron: ['BORD-001', 'BORD-002', 'BORD-007'] });
});

// ---------- registratie ----------
const idx = REG.slice().sort((a, b) => a.naam.localeCompare(b.naam));
fs.writeFileSync(path.join(ROOT, 'data', 'schemas-extra-eindtest.json'), JSON.stringify(idx, null, 1) + '\n');
console.log(idx.length + " extra schema's (eindtest) geschreven");
