'use strict';
// Plaats op de weg, inhalen, ritsen, parkeren, snelweg (bovenaanzicht).
const { Svg, C, CAR, register, pct, pbox } = require('./lib');

const COLRED = '#e5322d';
const RED = '#d63a3a', GRN = '#1f9d55';
const cross = (s, x, y, size = 40) => s.add(`<g stroke="${RED}" stroke-width="${size / 4}" stroke-linecap="round"><line x1="${x - size / 2}" y1="${y - size / 2}" x2="${x + size / 2}" y2="${y + size / 2}"/><line x1="${x + size / 2}" y1="${y - size / 2}" x2="${x - size / 2}" y2="${y + size / 2}"/></g>`);
const tick = (s, x, y, size = 40) => s.add(`<path d="M${x - size / 2},${y} L${x - size / 8},${y + size / 2.5} L${x + size / 2},${y - size / 2.5}" fill="none" stroke="${GRN}" stroke-width="${size / 4}" stroke-linecap="round" stroke-linejoin="round"/>`);
function hatch(s) {
  if (!s.hasHatch) { s.hasHatch = 1; s.defs.push(`<pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="rgba(214,58,58,.22)"/><line x1="0" y1="0" x2="0" y2="12" stroke="${RED}" stroke-width="5"/></pattern>`); }
  return 'url(#hatch)';
}
function zone(s, x, y, w, h) { s.add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${hatch(s)}" stroke="${RED}" stroke-width="2" stroke-dasharray="6 4"/>`); }
function vroad(s, x, w, lines = true) {
  s.rect(x, 0, w, 600, C.road);
  if (lines) s.line(x + w / 2, 0, x + w / 2, 600, '#fff', 3, 'stroke-dasharray="16 14"');
}
function hroad(s, y, h, x0 = 0, x1 = 800) { s.rect(x0, y, x1 - x0, h, C.road); s.line(x0, y + h / 2, x1, y + h / 2, '#fff', 3, 'stroke-dasharray="16 14"'); }
function dim(s, x1, y, x2, txt, o = {}) {
  s.add(`<g stroke="#fff" stroke-width="3"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 8}" x2="${x1}" y2="${y + 8}"/><line x1="${x2}" y1="${y - 8}" x2="${x2}" y2="${y + 8}"/></g>`);
  s.label((x1 + x2) / 2, y - 14, txt, { size: o.size || 17, bg: o.bg || '#fff' });
}
function mk(naam, title, desc, theorieblok, bronnen, draw, entry = {}) {
  const s = new Svg(naam, title, desc, entry.opt || {});
  draw(s);
  const e = s.finish({ theorieblok, bronnen });
  if (entry.hotspots) e.hotspots = entry.hotspots;
  register(e);
  return e;
}

// ---- rechts rijden
mk('schema-plaats-rechts-rijden', 'Rechts rijden op een tweerichtingsweg',
  'Een weg met twee rijrichtingen van onder naar boven gezien. De auto die naar boven rijdt, rijdt rechts van de middenlijn; de tegenligger die naar beneden rijdt, rijdt aan de andere kant van de middenlijn, dus ook rechts voor zijn eigen rijrichting.',
  'plaats-rechts-rijden', ['PLAA-001'], (s) => {
    s.titel('Rechts rijden, tegenliggers kruis je rechts');
    vroad(s, 250, 300);
    s.car(475, 440, 0, 'blauw', null); s.car(325, 170, 180, 'rood', null);
    s.route('M475,380 L475,120', CAR.blauw); s.route('M325,230 L325,500', CAR.rood);
    s.label(640, 300, 'Jij rijdt aan\nje rechterkant', { size: 20, bg: '#fff' });
    s.label(150, 300, 'Tegenligger\nrijdt aan zijn\nrechterkant', { size: 20, bg: '#fff' });
  });

// ---- kruisen
mk('schema-kruisen', 'Kruisen: rechts, met voldoende zijdelingse afstand',
  'Twee auto\'s kruisen elkaar op een tweerichtingsweg. Elk blijft rechts en houdt een ruime zijdelingse afstand tot de tegenligger (aangeduid met een dubbele pijl). Rechts langs de weg staat een geparkeerde auto als hindernis; de auto op die kant vertraagt.',
  'kruisen', ['PLAA-001'], (s) => {
    s.titel('Kruisen doe je rechts, met ruimte opzij');
    vroad(s, 250, 300);
    s.car(475, 330, 0, 'blauw', null); s.car(325, 330, 180, 'rood', null);
    dim(s, 341, 330, 459, 'ruimte');
    s.route('M475,260 L475,110', CAR.blauw); s.route('M325,400 L325,540', CAR.rood);
    s.car(520, 470, 0, 'grijs', null); s.label(655, 475, 'hindernis rechts:\nvertragen of stoppen', { size: 17, bg: '#fff' });
    s.car(475, 560, 0, 'geel', null);
    s.label(150, 160, 'Je kruist\ntegenliggers\naan je rechterkant', { size: 18, bg: '#fff' });
  });

// ---- inhalen links
mk('schema-inhalen-links', 'Inhalen: links, veilig en met richtingaanwijzer',
  'Een auto (blauw) haalt een tragere auto (rood) links in op een tweerichtingsweg. Vier stappen met nummers: eerst controleren dat de weg vrij is, dan de linker richtingaanwijzer, dan voorbijrijden met voldoende zijdelingse afstand, en tot slot rechts terugkeren met de rechter richtingaanwijzer.',
  'inhalen-regels', ['PLAA-001'], (s) => {
    s.titel('Inhalen in vier stappen');
    vroad(s, 250, 300);
    s.car(475, 290, 0, 'rood', null);
    s.car(475, 520, 0, 'blauw', null, { blink: 'L' });
    s.route('M475,460 L475,400 Q475,380 400,350 Q330,320 330,260 Q330,190 400,150 Q470,115 475,70', CAR.blauw);
    const st = [[600, 520, '1. Controleren: weg vrij,\nniemand die jou inhaalt'], [600, 420, '2. Linker richtingaanwijzer,\ntijdig'], [600, 300, '3. Voorbijrijden met\nzijdelingse afstand'], [600, 150, '4. Rechter richtingaanwijzer,\nterugkeren naar rechts']];
    st.forEach(([x, y, t], i) => { s.label(x + 20, y, t, { size: 16, bg: '#fff', anchor: 'middle' }); });
    s.text(150, 330, 'vrije weg\nvoor je', { size: 18, fill: '#fff' });
  });

// ---- inhaalverbod zicht
mk('schema-inhaalverbod-zicht', 'Geen zicht: niet links inhalen',
  'Een weg die over een heuvelkruin loopt. Een auto rijdt achter een tragere voorligger, maar achter de kruin ziet hij niet of er een tegenligger aankomt (die zit achter de kruin, weergegeven als een vage auto met vraagteken). Daarom mag hij niet inhalen.',
  'inhaalverbod', ['PLAA-001'], (s) => {
    s.titel('Je ziet niet of de weg vrij is: niet inhalen');
    vroad(s, 250, 300);
    s.defs.push('<linearGradient id="fog2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d9e8cf" stop-opacity="0"/><stop offset="0.6" stop-color="#d9e8cf" stop-opacity="0.92"/></linearGradient>');
    s.car(325, 110, 180, 'oranje', null); s.text(325, 118, '?', { size: 40, fill: '#fff' });
    s.rect(240, 48, 320, 250, 'url(#fog2)');
    s.label(400, 175, 'heuvelkruin: geen zicht', { size: 20, bg: '#fff' });
    s.car(475, 340, 0, 'rood', null); s.car(475, 500, 0, 'blauw', null, { blink: 'L' });
    s.route('M475,445 L475,420 Q410,380 410,340', '#999', { dash: '4 8' });
    cross(s, 410, 330, 36);
    s.label(150, 450, 'Kun je niet ver\ngenoeg zien dat\nde weg vrij is?\nDan haal je niet in.', { size: 17, bg: '#fff' });
  });

// ---- ritsen
function ritsScene(s) {
  s.rect(250, 0, 300, 600, C.road); s.line(400, 0, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
  // linkerrijstrook eindigt: schuine versmalling
  s.add(`<polygon points="250,230 400,160 400,0 250,0" fill="${C.grass}"/>`);
  s.add('<polygon points="250,230 400,160 400,170 250,240" fill="#fff" opacity="0"/>');
  for (let i = 0; i < 4; i++) s.add(`<polygon points="${268 + i * 30},${262 - i * 14} ${278 + i * 30},${262 - i * 14} ${273 + i * 30},${240 - i * 14}" fill="#ff7a1a" stroke="#fff" stroke-width="2"/>`);
  s.add(`<path d="M250,230 L400,160" stroke="#fff" stroke-width="4"/>`);
}
mk('schema-ritsen', 'Ritsen: invoegen vlak voor de versmalling, om beurten',
  'Een weg met twee rijstroken waarvan de linker eindigt (afgezet met pylonen). Vier auto\'s voegen om beurten in: eerst auto 1 op de rechterstrook, dan auto 2 van de linkerstrook, dan auto 3 rechts, dan auto 4 links. Wie op de doorlopende strook rijdt, laat beurtelings één invoegen. Er wordt pas vlak voor de versmalling ingevoegd.',
  'ritsen', ['PLAA-001'], (s) => {
    s.titel('Ritsen: om beurten één auto');
    ritsScene(s);
    s.car(475, 105, 0, 'rood', 1); s.car(325, 330, 0, 'blauw', 2);
    s.car(475, 400, 0, 'geel', 3); s.car(325, 510, 0, 'groen', 4);
    s.route('M325,285 Q325,225 400,205 Q462,190 475,150', CAR.blauw, { w: 4 });
    s.label(655, 300, 'Rij door tot vlak\nvoor de versmalling\nen voeg daar in', { size: 17, bg: '#fff' });
    s.label(655, 440, 'De volgorde:\n1, 2, 3, 4', { size: 17, bg: '#fff' });
    s.label(110, 170, 'strook\neindigt', { size: 17, bg: '#fff' });
  });

// ---- reddingsstrook
mk('schema-reddingsstrook-2', 'Reddingsstrook bij file: twee rijstroken',
  'Een weg met twee rijstroken in dezelfde richting en file. De auto\'s op de linkse strook rijden uiterst links, de auto\'s op de rechtse strook uiterst rechts, zodat er in het midden een vrije strook ontstaat (geel gearceerd). Onderaan nadert een ziekenwagen via die strook.',
  'plaats-reddingsstrook-file', ['PLAA-001'], (s) => {
    s.titel('Twee rijstroken: links uiterst links, rechts uiterst rechts');
    s.rect(250, 0, 300, 600, C.road); s.line(400, 0, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
    s.rect(285, 0, 230, 600, 'rgba(255,214,64,.22)', 'stroke="#f2c230" stroke-width="3" stroke-dasharray="14 8"');
    [90, 230, 370].forEach((y) => { s.car(268, y, 0, ['rood', 'wit', 'groen'][y % 3], null); s.car(532, y + 60, 0, ['blauw', 'paars', 'grijs'][y % 3], null); });
    s.ambulance(400, 520, 0, null);
    s.label(655, 250, 'reddingsstrook:\nvrij laten', { size: 20, bg: '#f2c230' });
    s.arrow(300, 140, 270, 140, '#fff', 5); s.arrow(500, 140, 530, 140, '#fff', 5);
  });
mk('schema-reddingsstrook-3', 'Reddingsstrook bij file: drie of meer rijstroken',
  'Een weg met drie rijstroken in dezelfde richting en file. De auto\'s op de linkse strook rijden uiterst links; de auto\'s op de middelste en rechtse strook rijden zo ver mogelijk naar rechts. Tussen de linkse en de middelste strook ontstaat een vrije strook (geel gearceerd) waar een ziekenwagen doorrijdt.',
  'plaats-reddingsstrook-file', ['PLAA-001'], (s) => {
    s.titel('Drie rijstroken: links uiterst links, de rest uiterst rechts');
    s.rect(175, 0, 450, 600, C.road); s.line(325, 0, 325, 600, '#fff', 3, 'stroke-dasharray="16 14"'); s.line(475, 0, 475, 600, '#fff', 3, 'stroke-dasharray="16 14"');
    s.rect(220, 0, 235, 600, 'rgba(255,214,64,.22)', 'stroke="#f2c230" stroke-width="3" stroke-dasharray="14 8"');
    [90, 230, 370].forEach((y, i) => { s.car(195, y, 0, ['rood', 'wit', 'groen'][i], null); s.car(455, y + 50, 0, ['blauw', 'paars', 'grijs'][i], null); s.car(605, y + 10, 0, ['geel', 'oranje', 'wit'][i], null); });
    s.ambulance(330, 520, 0, null);
    s.label(715, 250, 'reddingsstrook:\nvrij laten', { size: 17, bg: '#f2c230' });
  });

// ---- parkeren
function street(s, y = 230, h = 150) { hroad(s, y, h); }
mk('schema-stilstaanverbod-zebrapad', 'Stilstaan en parkeren: niet op en niet vlak voor een zebrapad',
  'Een straat met een zebrapad. Op de rijbaan in minder dan 5 meter voor het zebrapad (in de rijrichting) is stilstaan en parkeren verboden: rode gearceerde zones. Een auto die in zo\'n zone staat is fout; een auto die verder weg staat (meer dan 5 meter) mag er staan.',
  'stilstaan-parkeerverbod-plaatsen', ['PLAA-001'], (s) => {
    s.titel('Zebrapad: minder dan 5 m ervoor geen stilstaan of parkeren');
    street(s, 230, 150);
    s.zebra(400, 230, 60, 150, 'v');
    zone(s, 335, 305, 65, 75); zone(s, 460, 230, 65, 75);
    s.car(365, 345, 90, 'rood', null); cross(s, 365, 345, 34);
    s.car(150, 345, 90, 'groen', null); tick(s, 150, 345, 34);
    dim(s, 335, 440, 400, '5 m'); dim(s, 460, 190, 525, '5 m');
    s.ped(430, 300, null);
    s.label(400, 520, 'In de rijrichting gezien: geen stilstaan of parkeren\nop het zebrapad en minder dan 5 m ervoor.', { size: 17, bg: '#fff' });
  }, { hotspots: [
    { id: 'zone-links', x: 41.9, y: 50.8, w: 8.1, h: 12.5, label: 'Verboden zone voor het zebrapad (rijrichting naar rechts)', correct: true },
    { id: 'zone-west', x: 57.5, y: 38.3, w: 8.1, h: 12.5, label: 'Verboden zone voor het zebrapad (rijrichting naar links)', correct: true },
    { id: 'ver-weg', x: 12, y: 51, w: 13, h: 14, label: 'Hier staat een auto ver van het zebrapad', correct: false },
  ] });

mk('schema-parkeerafstanden', 'Afstanden bij stilstaan en parkeren',
  'Vier kleine schema\'s van een straat met rode gearceerde zones. Linksboven: 5 meter voor een zebrapad (stilstaan en parkeren verboden). Rechtsboven: 20 meter voor verkeerslichten (stilstaan en parkeren verboden). Linksonder: 15 meter aan weerszijden van het bord van een bus- of tramhalte (parkeren verboden). Rechtsonder: minder dan 1 meter vóór of achter een ander geparkeerd voertuig (parkeren verboden).',
  'stilstaan-parkeerverbod-plaatsen', ['PLAA-001'], (s) => {
    const cell = (ox, oy, titel, draw) => {
      s.add(`<g transform="translate(${ox} ${oy})">`);
      s.rect(0, 0, 396, 296, C.grass2, 'rx="10"');
      s.add('<rect x="0" y="95" width="396" height="90" fill="' + C.road + '"/><line x1="0" y1="140" x2="396" y2="140" stroke="#fff" stroke-width="2.5" stroke-dasharray="14 12"/>');
      draw();
      s.add('</g>');
      s.label(ox + 198, oy + 30, titel, { size: 17, bg: '#fff' });
    };
    const S = 9; // px per meter
    cell(2, 2, 'Zebrapad: 5 m ervoor', () => {
      s.zebra(150, 95, 40, 90, 'v'); zone(s, 150 - 5 * S, 140, 5 * S, 45); zone(s, 190, 95, 5 * S, 45);
      dimm(s, 150 - 5 * S, 205, 150, '5 m'); dimm(s, 190, 82, 190 + 5 * S, '5 m');
      s.car(270, 163, 90, 'rood', null, {}); tick(s, 270, 163, 22);
    });
    cell(402, 2, 'Verkeerslichten: 20 m ervoor', () => {
      zone(s, 380 - 20 * S, 140, 20 * S, 45); s.stopline(380, 162, 'v', 45);
      s.add(`<rect x="372" y="60" width="16" height="36" rx="5" fill="#1d2128"/><circle cx="380" cy="70" r="4.5" fill="${COLRED}"/><circle cx="380" cy="86" r="4.5" fill="#1fbf5a" opacity=".5"/>`);
      dimm(s, 380 - 20 * S, 215, 380, '20 m');
    });
    cell(2, 302, 'Halte: 15 m aan weerszijden', () => {
      zone(s, 198 - 15 * S, 140, 15 * S, 45); zone(s, 198, 140, 15 * S, 45);
      s.rect(190, 60, 16, 28, '#2f6fd6'); s.text(198, 80, 'H', { size: 16, fill: '#fff', weight: 800 });
      dimm(s, 198 - 15 * S, 215, 198, '15 m'); dimm(s, 198, 215, 198 + 15 * S, '15 m');
    });
    cell(402, 302, 'Tot ander voertuig: 1 m', () => {
      s.car(130, 163, 90, 'rood', null); s.car(300, 163, 90, 'blauw', null);
      zone(s, 160, 150, 9, 30); zone(s, 260, 150, 9, 30);
      s.add(`<g stroke="#fff" stroke-width="2.5"><line x1="161" y1="205" x2="170" y2="205"/></g>`);
      s.label(215, 240, 'minder dan 1 m vrij laten\nvóór of achter: parkeerverbod', { size: 14, bg: '#fff' });
    });
  }, { opt: { bg: '#2c3a2a' } });
function dimm(s, x1, y, x2, txt) { s.add(`<g stroke="#fff" stroke-width="2.5"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 6}" x2="${x1}" y2="${y + 6}"/><line x1="${x2}" y1="${y - 6}" x2="${x2}" y2="${y + 6}"/></g>`); s.text((x1 + x2) / 2, y - 10, txt, { size: 16, fill: '#fff' }); }

mk('schema-gele-streep', 'Gele onderbroken streep op de rand van de rijbaan',
  'Een straat met een gele onderbroken streep langs de rand van de rijbaan. Een auto die langs die streep geparkeerd staat, staat fout: parkeren op de rijbaan langs die streep is verboden. Een auto die op een stuk zonder gele streep geparkeerd staat, staat goed (indien niets anders het verbiedt).',
  'parkeerverbod-plaatsen', ['PLAA-001'], (s) => {
    s.titel('Gele onderbroken streep: parkeerverbod');
    street(s, 230, 150);
    s.add(`<line x1="380" y1="372" x2="800" y2="372" stroke="${C.yellow}" stroke-width="6" stroke-dasharray="26 20"/>`);
    s.car(560, 345, 90, 'rood', null); cross(s, 560, 345, 34);
    s.car(190, 345, 90, 'groen', null); tick(s, 190, 345, 34);
    s.label(590, 460, 'gele onderbroken streep\nlangs de rand', { size: 18, bg: C.yellow });
    s.label(190, 460, 'zonder gele streep', { size: 18, bg: '#fff' });
    s.label(400, 130, 'Stilstaan om iets in of uit te laden of iemand te laten\nuitstappen blijft mogelijk; parkeren niet.', { size: 15, bg: '#fff' });
  });

mk('schema-parkeren-rijbaan', 'Parkeren op de rijbaan: rechts, in één rij',
  'Een tweerichtingsstraat. Een auto staat geparkeerd aan de rechterkant van de rijbaan, zo ver mogelijk van de middenlijn en evenwijdig met de rand. Een tweede auto die ernaast dubbel geparkeerd staat is fout.',
  'parkeren-plaats-en-manier', ['PLAA-001'], (s) => {
    s.titel('Parkeren op de rijbaan: één rij, rechts');
    street(s, 220, 170);
    s.car(250, 365, 90, 'groen', null); tick(s, 250, 395, 30);
    s.car(520, 365, 90, 'blauw', null); s.car(520, 322, 90, 'rood', null); cross(s, 520, 322, 34);
    s.label(520, 460, 'dubbel parkeren\nis verboden', { size: 18, bg: '#fff' });
    s.label(250, 460, 'zo ver mogelijk van de\nmiddenlijn, evenwijdig\nmet de rand', { size: 17, bg: '#fff' });
    s.car(200, 250, 270, 'geel', null);
  });

mk('schema-parkeren-berm', 'Parkeren op de berm: 1,50 m doorgang voor voetgangers',
  'Een straat met een gelijkgrondse berm waarop een auto geparkeerd staat. Tussen de auto en de buitenrand van de weg blijft minstens 1,50 meter vrij voor voetgangers (aangeduid met een dubbele pijl).',
  'parkeren-plaats-en-manier', ['PLAA-001'], (s) => {
    s.titel('Parkeren op de berm: laat doorgang voor voetgangers');
    street(s, 130, 150);
    s.rect(0, 280, 800, 260, '#9bbf86');
    s.rect(0, 440, 800, 60, C.sidewalk); s.line(0, 440, 800, 440, '#fff', 3);
    s.car(400, 335, 90, 'blauw', null);
    s.ped(150, 470, null); s.ped(640, 470, null);
    s.add(`<g stroke="#fff" stroke-width="3"><line x1="520" y1="352" x2="520" y2="500"/><line x1="508" y1="352" x2="532" y2="352"/><line x1="508" y1="500" x2="532" y2="500"/></g>`);
    s.label(640, 420, 'minstens 1,50 m\nvrij voor voetgangers', { size: 19, bg: '#fff' });
    s.label(400, 575, 'Moet de berm door voetgangers gebruikt worden? Laat dan minstens 1,50 m doorgang vrij.', { size: 15, bg: '#fff' });
  });

// ---- snelweg: oprit (dual met oefening)
(function () {
  const vs = [
    { nr: 1, label: 'auto 1 (op de autosnelweg)', kleur: 'rood', x: 580, y: 480, rot: 0 },
    { nr: 2, label: 'auto 2 (op de oprit)', kleur: 'blauw', x: 276, y: 545, rot: 25, blink: 'R' },
  ];
  for (const sol of [true, false]) {
    const naam = sol ? 'schema-oprit-snelweg' : 'schema-oprit-snelweg-oefening';
    const s = new Svg(naam, 'Oprit van de autosnelweg: voorrang verlenen' + (sol ? '' : ' (oefening)'),
      sol ? 'Een autosnelweg met twee rijstroken van onder naar boven en een oprit die schuin van linksonder invoegt. Auto 1 rijdt op de autosnelweg, auto 2 rijdt de oprit op (bord B1 aan de oprit). Wie oprijdt verleent altijd voorrang aan wie al op de autosnelweg rijdt, ook bij file; een bestuurder die je laat invoegen doet dat uit hoffelijkheid.'
        : 'Een autosnelweg met twee rijstroken van onder naar boven en een oprit die schuin van linksonder invoegt, met bord B1 aan de oprit. Auto 1 rijdt op de autosnelweg (rechterstrook), auto 2 komt van de oprit en wil invoegen.');
    s.rect(660, 0, 70, 600, '#6a707a');
    s.rect(400, 0, 260, 600, C.road); s.line(530, 0, 530, 600, '#fff', 3, 'stroke-dasharray="16 14"'); s.line(660, 0, 660, 600, '#fff', 3);
    s.add(`<path d="M230,640 Q330,400 590,170" fill="none" stroke="${C.road}" stroke-width="92" stroke-linecap="butt"/>`);
    s.add(`<path d="M257,640 Q357,400 640,160" fill="none" stroke="#fff" stroke-width="0"/>`);
    s.route('M334,451 Q440,330 590,190 L590,40', CAR.blauw); s.route('M580,420 L580,40', CAR.rood);
    s.sign('B1', 335, 590, 56);
    s.car(580, 480, 0, 'rood', 1); s.car(276, 545, 25, 'blauw', 2, { blink: 'R' });
    if (sol) { s.titel('Oprit: altijd voorrang verlenen aan wie al rijdt'); s.label(470, 330, 'auto 1: voorrang', { size: 17, bg: GRN, fg: '#fff' }); s.label(180, 470, 'auto 2 wacht\nen voegt in\nzonder te hinderen', { size: 17, bg: RED, fg: '#fff' }); }
    const e = s.finish({ theorieblok: 'snelweg-op-en-afrit', bronnen: ['SNEL-001'], voertuigen: vs.map((v) => ({ nr: v.nr, label: v.label, kleur: v.kleur, ...pct(s, v.x, v.y) })), situatie: { juisteVoorrang: 1, moetWachten: [2], motivatie: 'Bij het oprijden van de autosnelweg verleen je altijd voorrang aan de bestuurders die al op de autosnelweg rijden.' }, type: sol ? 'uitleg' : 'oefening', partner: sol ? 'schema-oprit-snelweg-oefening' : 'schema-oprit-snelweg' });
    register(e);
  }
})();

// ---- gevarendriehoek-afstand
function driehoek(s, x, y, k = 1) {
  const a = 18 * k;
  s.add(`<polygon points="${x},${y - a} ${x + a * 0.9},${y + a * 0.6} ${x - a * 0.9},${y + a * 0.6}" fill="#fff" stroke="${RED}" stroke-width="${6 * k}" stroke-linejoin="round"/>`);
  s.add(`<polygon points="${x},${y - a * 0.35} ${x + a * 0.4},${y + a * 0.35} ${x - a * 0.4},${y + a * 0.35}" fill="${RED}" opacity=".55"/>`);
}
mk('schema-gevarendriehoek-afstand', 'Gevarendriehoek: 30 m op een gewone weg, 100 m op de autosnelweg',
  'Twee wegen naast elkaar, op dezelfde schaal. Links een gewone weg met een stilstaande auto met alarmlichten en een gevarendriehoek op 30 meter achter de auto (in de richting vanwaar het verkeer komt). Rechts een autosnelweg met een auto op de pechstrook en de gevarendriehoek op minstens 100 meter achter de auto. Naderend verkeer komt van onder.',
  'ongeval-gevarendriehoek', ['ONGE-001', 'TECH-001'], (s) => {
    s.titel('Gevarendriehoek: hoe ver achter je voertuig?');
    const k = 4; // px per meter
    for (const [ox, afst, txt, snel] of [[0, 30, 'Gewone weg: minstens 30 m', false], [400, 100, 'Autosnelweg: minstens 100 m', true]]) {
      s.add(`<g transform="translate(${ox} 0)">`);
      if (snel) { s.rect(20, 0, 220, 600, C.road); s.line(130, 0, 130, 600, '#fff', 3, 'stroke-dasharray="16 14"'); s.rect(240, 0, 80, 600, '#6a707a'); s.line(240, 0, 240, 600, '#fff', 3); }
      else { s.rect(100, 0, 220, 600, C.road); s.line(210, 0, 210, 600, '#fff', 3, 'stroke-dasharray="16 14"'); }
      const cx = snel ? 280 : 285, cy = 110;
      s.car(cx, cy, 0, 'rood', null, { blink: 'W' });
      driehoek(s, cx, cy + afst * k + 30, 1.5);
      s.add(`<g stroke="#fff" stroke-width="3"><line x1="${cx + 40}" y1="${cy + 30}" x2="${cx + 40}" y2="${cy + 30 + afst * k}" stroke-dasharray="8 6"/><line x1="${cx + 32}" y1="${cy + 30}" x2="${cx + 48}" y2="${cy + 30}"/><line x1="${cx + 32}" y1="${cy + 30 + afst * k}" x2="${cx + 48}" y2="${cy + 30 + afst * k}"/></g>`);
      s.label(snel ? 150 : 150, cy + 30 + afst * k / 2 + 6, afst + ' m', { size: 22, bg: '#fff' });
      s.label(200, 82, txt, { size: 18, bg: '#fff' });
      s.add('</g>');
    }
    s.arrow(200, 590, 200, 560, '#fff', 4); s.arrow(600, 590, 600, 560, '#fff', 4);
    s.text(400, 596, 'verkeer komt van onder', { size: 14, fill: '#fff', weight: 500 });
  }, { opt: { bg: '#5d8f48' } });

// ---- zijdelingse afstand
mk('schema-zijdelingse-afstand', 'Een fietser voorbijrijden: 1 m of 1,5 m afstand',
  'Twee wegen naast elkaar, van onder naar boven. Links: binnen de bebouwde kom rijdt een auto een fietser voorbij met minstens 1 meter zijdelingse afstand. Rechts: buiten de bebouwde kom is de afstand minstens 1,5 meter. De afstanden zijn niet op schaal getekend.',
  'inhalen-fietser-afstand', ['KWET-001'], (s) => {
    s.titel('Zijdelingse afstand tot een fietser');
    for (const [ox, d, txt, t2] of [[0, 56, '1 m', 'Binnen de bebouwde kom'], [400, 84, '1,5 m', 'Buiten de bebouwde kom']]) {
      s.add(`<g transform="translate(${ox} 0)">`);
      s.rect(80, 60, 240, 540, C.road); s.line(200, 60, 200, 600, '#fff', 3, 'stroke-dasharray="16 14"');
      const bx = 295, cx = bx - d - 16 - 8;
      s.car(cx, 330, 0, 'blauw', null);
      s.bike(bx, 320, 0, null);
      s.add(`<g stroke="#fff" stroke-width="3"><line x1="${cx + 16}" y1="260" x2="${bx - 8}" y2="260"/><line x1="${cx + 16}" y1="252" x2="${cx + 16}" y2="268"/><line x1="${bx - 8}" y1="252" x2="${bx - 8}" y2="268"/></g>`);
      s.label(200, 238, 'minstens ' + txt, { size: 20, bg: '#fff' });
      s.route(`M${cx},260 L${cx},110`, CAR.blauw);
      s.label(200, 120, t2, { size: 18, bg: '#fff' });
      s.add('</g>');
    }
    s.label(400, 585, 'Niet op schaal. Past het niet? Dan haal je niet in.', { size: 15, bg: '#fff' });
  });

// ---- portier
mk('schema-portier', 'Portier openen: eerst kijken',
  'Een straat met een geparkeerde auto waarvan het portier aan de rijbaanzijde open gaat. Een fietser rijdt vlak langs de auto en zou tegen het open portier botsen. Een rood kruis en de tekst: kijk in je spiegel en over je schouder voor je het portier opent.',
  'portier-openen', ['KWET-001'], (s) => {
    s.titel('Portier openen: kijk in spiegel en over je schouder');
    s.rect(250, 0, 300, 600, C.road); s.line(400, 0, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
    s.car(500, 330, 0, 'rood', null);
    s.add(`<g transform="translate(484 322)"><line x1="0" y1="0" x2="-38" y2="-30" stroke="#222" stroke-width="7" stroke-linecap="round"/><line x1="0" y1="0" x2="-38" y2="-30" stroke="${CAR.rood}" stroke-width="4" stroke-linecap="round"/></g>`);
    s.bike(450, 470, 0, null); s.route('M450,430 L450,330', '#f0b429');
    cross(s, 440, 300, 36);
    s.label(655, 250, 'Kijk eerst: spiegel\nen schouderblik', { size: 19, bg: '#fff' });
    s.label(150, 400, 'Fietsers en\nvoetgangers lopen\nhet meeste gevaar', { size: 17, bg: '#fff' });
  });

// ---- dode hoek
mk('schema-dode-hoek', 'Dode hoek van een vrachtwagen',
  'Een vrachtwagen van bovenaf, rijdend naar boven, met drie gearceerde oranje zones waar de bestuurder niet goed kan zien: een zone vlak voor de cabine, een lange zone langs de rechterzijde en een kleinere zone links. Een fietser rijdt rechts naast de vrachtwagen in de dode hoek. De zones zijn schematisch, niet op schaal.',
  'dode-hoek', ['KWET-001'], (s) => {
    s.titel('Dode hoek: de chauffeur ziet je niet');
    s.rect(250, 0, 300, 600, C.road); s.line(400, 0, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
    const z = 'fill="rgba(255,140,0,.38)" stroke="#ff8c00" stroke-width="3" stroke-dasharray="8 6"';
    s.add(`<rect x="501" y="310" width="60" height="190" rx="8" ${z}/>`);
    s.add(`<rect x="455" y="205" width="60" height="95" rx="8" ${z}/>`);
    s.add(`<rect x="405" y="330" width="54" height="90" rx="8" ${z}/>`);
    s.truck(480, 360, 0, null, { cab: '#2f6fd6' });
    s.bike(535, 400, 0, null);
    s.label(655, 400, 'Fietser rechts\nnaast de vracht-\nwagen: niet\nzichtbaar', { size: 17, bg: '#fff' });
    s.label(155, 300, 'Rechts afslaan:\nspiegels én over\nde schouder kijken', { size: 17, bg: '#fff' });
    s.label(480, 190, 'ook vlak voor de cabine', { size: 15, bg: '#fff' });
  });

// ---- fietszone
mk('schema-fietszone', 'Fietszone: fietsers voorop, 30 km/u, niet inhalen',
  'Een straat met twee rijrichtingen waar het begin van een fietszone met bord F111 is aangeduid en de snelheid beperkt is tot 30 km/u (bord C43). Twee fietsers rijden samen op de rechterhelft van de rijbaan. Een auto rijdt erachter en mag de fietsers niet inhalen; een doorgestreepte inhaalbeweging is aangeduid met een rood kruis.',
  'fietszone-fietsstraat', ['KWET-001'], (s) => {
    s.titel('Fietszone: motorvoertuigen halen fietsers niet in');
    s.rect(250, 0, 300, 600, C.road); s.line(400, 0, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
    s.bike(450, 250, 0, null); s.bike(495, 290, 0, null);
    s.car(475, 440, 0, 'rood', null);
    s.route('M475,385 L475,350 Q380,330 360,260 Q340,200 340,150', '#bbb', { dash: '4 8' });
    cross(s, 365, 300, 34);
    s.sign('F111', 190, 130, 90); s.sign('C43_30', 190, 280, 80);
    s.label(655, 250, 'Fietsers: rechterhelft\n(bij eenrichting de\nhele breedte)', { size: 17, bg: '#fff' });
    s.label(655, 440, 'Max. 30 km/u\nvoor iedereen', { size: 18, bg: '#fff' });
  });

// ---- zebrapad
mk('schema-zebrapad', 'Zebrapad: voorrang verlenen aan voetgangers',
  'Een zebrapad over een straat met borden F49 en A21. Een voetganger staat op het punt het zebrapad op te stappen. De auto nadert met matige snelheid, remt en verleent voorrang aan de voetganger.',
  'zebrapad-voorrang-bestuurder', ['KWET-001'], (s) => {
    s.titel('Zebrapad: matig naderen, voorrang verlenen');
    s.rect(0, 220, 800, 160, C.road); s.line(0, 300, 800, 300, '#fff', 3, 'stroke-dasharray="16 14"');
    s.zebra(400, 220, 70, 160, 'v');
    s.ped(435, 205, null);
    s.car(250, 340, 90, 'blauw', null, { brake: 1 });
    s.route('M300,340 L370,340', CAR.blauw, { dash: '3 8' });
    s.sign('F49', 520, 160, 70); s.sign('A21', 320, 160, 70);
    s.label(400, 470, 'Voetganger staat op het punt over te steken:\nstoppen voor het zebrapad', { size: 19, bg: '#fff' });
  });

module.exports = {};
