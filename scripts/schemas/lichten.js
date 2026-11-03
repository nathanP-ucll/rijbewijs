'use strict';
// Illustraties: verkeerslichten, bevoegde personen, rangorde.
const { Svg, C, CAR, register, pct } = require('./lib');

const BG = '#eef1f6';
const COL = { rood: '#e5322d', oranje: '#ff9d00', groen: '#1fbf5a', wit: '#f4f4f4' };
const DIM = { rood: '#4a1d1d', oranje: '#4d3410', groen: '#143b24', wit: '#3a3d44' };

function sym(kind, x, y, r, fill) {
  const k = kind;
  if (k === 'rond') return `<circle cx="${x}" cy="${y}" r="${r * 0.8}" fill="${fill}"/>`;
  const rot = { 'pijl-boven': 0, 'pijl-rechts': 90, 'pijl-onder': 180, 'pijl-links': 270, 'pijl-schuin-onder-links': 225, 'pijl-schuin-onder-rechts': 135 }[k];
  if (rot !== undefined) {
    const a = r * 0.9;
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0,${-a} L${a * 0.7},${-a * 0.05} L${a * 0.26},${-a * 0.05} L${a * 0.26},${a} L${-a * 0.26},${a} L${-a * 0.26},${-a * 0.05} L${-a * 0.7},${-a * 0.05} Z" fill="${fill}"/></g>`;
  }
  if (k === 'combi') return sym('fiets', x - r * 0.42, y, r * 0.72, fill) + sym('voet-stil', x + r * 0.5, y, r * 0.72, fill);
  if (k === 'kruis') return `<g stroke="${fill}" stroke-width="${r * 0.28}" stroke-linecap="round"><line x1="${x - r * 0.6}" y1="${y - r * 0.6}" x2="${x + r * 0.6}" y2="${y + r * 0.6}"/><line x1="${x + r * 0.6}" y1="${y - r * 0.6}" x2="${x - r * 0.6}" y2="${y + r * 0.6}"/></g>`;
  if (k === 'fiets') {
    const s = r / 20;
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${fill}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="-11" cy="8" r="7"/><circle cx="11" cy="8" r="7"/><path d="M-11,8 L-3,-4 L6,-4 L11,8 M-3,-4 L0,8 L-11,8 M6,-4 L4,-9 M1,-9 L8,-9"/><circle cx="-3" cy="-13" r="3.2" fill="${fill}" stroke="none"/></g>`;
  }
  if (k === 'voet-stil') {
    const s = r / 20;
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}" stroke="${fill}" stroke-width="3.4" stroke-linecap="round"><circle cx="0" cy="-14" r="4.6" stroke="none"/><path d="M-8,-7 L8,-7 L7,6 L-7,6 Z" stroke-linejoin="round"/><line x1="-3.5" y1="7" x2="-3.5" y2="17"/><line x1="3.5" y1="7" x2="3.5" y2="17"/></g>`;
  }
  if (k === 'voet-stap') {
    const s = r / 20;
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${fill}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="1" cy="-14" r="4.2" fill="${fill}" stroke="none"/><path d="M1,-8 L-1,4 M1,-8 L-6,-1 M1,-8 L7,-2 M-1,4 L-7,16 M-1,4 L6,10 L4,17"/></g>`;
  }
  return '';
}

// lamps: [{kind, kleur, aan}] van boven naar onder. Retourneert breedte/hoogte.
function housing(s, x, y, lamps, o = {}) {
  const r = o.r || 30, gap = 12;
  const w = r * 2 + 22, h = lamps.length * (r * 2 + gap) + gap + 4;
  s.add(`<rect x="${x - 6}" y="${y + h - 2}" width="12" height="${o.pole || 40}" fill="#6b7280"/>`);
  s.add(`<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="16" fill="#1d2128" stroke="#000" stroke-width="3"/>`);
  lamps.forEach((l, i) => {
    const cy = y + gap + 2 + r + i * (r * 2 + gap);
    const col = COL[l.kleur];
    const on = l.aan !== false;
    if (on) s.add(`<circle cx="${x}" cy="${cy}" r="${r + 7}" fill="${col}" opacity="0.28"/>`);
    s.add(`<circle cx="${x}" cy="${cy}" r="${r}" fill="#0b0d10" stroke="#2c323b" stroke-width="2"/>`);
    s.add(sym(l.kind || 'rond', x, cy, r, on ? col : DIM[l.kleur]));
    if (l.knipper && on) {
      s.add(`<g stroke="${col}" stroke-width="4" stroke-linecap="round"><line x1="${x + r + 12}" y1="${cy - 12}" x2="${x + r + 26}" y2="${cy - 20}"/><line x1="${x + r + 14}" y1="${cy}" x2="${x + r + 30}" y2="${cy}"/><line x1="${x + r + 12}" y1="${cy + 12}" x2="${x + r + 26}" y2="${cy + 20}"/><line x1="${x - r - 12}" y1="${cy - 12}" x2="${x - r - 26}" y2="${cy - 20}"/><line x1="${x - r - 14}" y1="${cy}" x2="${x - r - 30}" y2="${cy}"/><line x1="${x - r - 12}" y1="${cy + 12}" x2="${x - r - 26}" y2="${cy + 20}"/></g>`);
    }
  });
  return { w, h };
}
const L3 = (aan) => [{ kleur: 'rood', aan: aan === 'rood' }, { kleur: 'oranje', aan: aan === 'oranje' }, { kleur: 'groen', aan: aan === 'groen' }];

function arrowRight(s, x1, y, x2, color = C.ink) { s.arrow(x1, y, x2, y, color, 6); }

function mk(naam, title, desc, theorieblok, bronnen, draw, extra = {}) {
  const s = new Svg(naam, title, desc, { bg: BG, ...(extra.opt || {}) });
  draw(s);
  register(s.finish({ theorieblok, bronnen, ...(extra.entry || {}) }));
}

// ---- 3 kleuren
mk('schema-lichten-3kleuren', 'Driekleurig verkeerslicht: groen, oranje, rood, groen',
  'Een verkeerslicht met rood bovenaan, oranje in het midden en groen onderaan. Daarnaast vier stappen van de volgorde: groen, dan oranje, dan rood, dan weer groen. Onderaan de betekenis: rood stoppen voor de stopstreep, oranje stoppen tenzij je niet meer veilig kunt stoppen, groen mag voorbij.',
  'lichten-driekleurig', ['LICH-001'], (s) => {
    s.titel('Verkeerslicht: rood boven, oranje midden, groen onder');
    housing(s, 110, 110, L3('groen'), { r: 32 });
    s.text(110, 425, 'rood boven\noranje midden\ngroen onder', { size: 18 });
    const seq = ['groen', 'oranje', 'rood', 'groen'];
    seq.forEach((k, i) => {
      const x = 290 + i * 150;
      housing(s, x, 100, L3(k), { r: 24, pole: 24 });
      s.text(x, 345, ['1', '2', '3', '4'][i], { size: 20, fill: '#6b7280' });
      if (i < 3) arrowRight(s, x + 44, 190, x + 104);
    });
    s.text(485, 90, 'Volgorde: groen, oranje, rood, groen', { size: 20 });
    s.label(250, 548, 'ROOD: stoppen\nvoor de stopstreep', { size: 16, bg: '#e5322d', fg: '#fff' });
    s.label(485, 548, 'ORANJE: stoppen, tenzij\nje niet meer veilig\nkunt stoppen', { size: 16, bg: '#ff9d00', fg: '#1c2230' });
    s.label(700, 548, 'GROEN:\nje mag voorbij', { size: 16, bg: '#1fbf5a', fg: '#fff' });
  });

// ---- knipperoranje
mk('schema-lichten-knipperoranje', 'Knipperend oranje: dubbel voorzichtig, voorrang blijft',
  'Links een driekleurig verkeerslicht waarvan alleen het oranje licht knippert. Rechts de borden voorrang verlenen en voorrangsweg met de tekst dat de voorrangsborden blijven gelden. Betekenis: je mag voorbij, maar dubbel voorzichtig; je hebt niet automatisch voorrang.',
  'lichten-oranje-knipperlicht', ['LICH-001'], (s) => {
    s.titel('Knipperend oranje licht');
    housing(s, 170, 110, [{ kleur: 'rood', aan: false }, { kleur: 'oranje', aan: true, knipper: true }, { kleur: 'groen', aan: false }], { r: 38 });
    s.label(170, 470, 'knipperend oranje', { size: 20, bg: '#ff9d00', fg: '#1c2230' });
    s.arrow(300, 250, 380, 250, C.ink, 6);
    s.label(570, 160, 'Je mag voorbij, maar\ndubbel voorzichtig', { size: 22, bg: '#fff' });
    s.text(570, 300, 'De voorrangsborden blijven gelden:', { size: 20 });
    s.sign('B1', 480, 380, 90); s.sign('B9', 660, 380, 90);
    s.label(570, 500, 'Geen bord? Dan voorrang van rechts.\nKnipperoranje geeft jou nooit voorrang.', { size: 18, bg: '#fff' });
  });

// ---- pijlen
mk('schema-lichten-pijlen', 'Pijllichten en groene pijl naast rood',
  'Drie voorbeelden: (1) een rood licht met een groene pijl naar links eronder: je mag enkel naar links, met voorrang voor wie regelmatig uit andere richtingen komt en voor voetgangers; (2) een rode pijl naar links: links afslaan is verboden, rechtdoor volgt het gewone licht; (3) een apart groene pijl naar links bij het uitrijden van een kruispunt: het tegenliggend verkeer staat stil (ontruimingspijl).',
  'lichten-pijlen', ['LICH-001'], (s) => {
    s.titel('Lichten met pijlen');
    housing(s, 140, 100, [{ kleur: 'rood', aan: true }, { kleur: 'oranje', aan: false }, { kleur: 'groen', aan: true, kind: 'pijl-links' }], { r: 30 });
    s.label(140, 440, 'Rood + groene pijl', { size: 17 });
    s.text(140, 485, 'Enkel in de richting van\nde pijl, met voorrang voor\nandere richtingen en\nvoetgangers', { size: 15, weight: 500 });
    housing(s, 400, 100, [{ kleur: 'rood', aan: true, kind: 'pijl-links' }, { kleur: 'oranje', aan: false, kind: 'pijl-links' }, { kleur: 'groen', aan: false, kind: 'pijl-links' }], { r: 30 });
    s.label(400, 440, 'Rode pijl', { size: 17 });
    s.text(400, 485, 'Verboden in de richting\nvan de pijl (zelfde als\nhet ronde licht)', { size: 15, weight: 500 });
    housing(s, 660, 100, [{ kleur: 'rood', aan: false, kind: 'pijl-links' }, { kleur: 'oranje', aan: false, kind: 'pijl-links' }, { kleur: 'groen', aan: true, kind: 'pijl-links' }], { r: 30 });
    s.label(660, 440, 'Ontruimingspijl', { size: 17 });
    s.text(660, 485, 'Apart groene pijl links:\ntegenliggers staan stil,\nlinks afslaan kan', { size: 15, weight: 500 });
  });

// ---- fietslichten
mk('schema-lichten-fiets', 'Fietslichten',
  'Vier voorbeelden: (1) een fietslicht met een fietssilhouet in rood, oranje en groen: geldt alleen voor fietsers en tweewielige bromfietsen; (2) een fietslicht met pijltjes rond het fietsje: dezelfde kleur geldt tegelijk voor de dwarsrichting; (3) een combinatielicht fiets en voetganger; (4) een knipperend oranje fietslicht met een knipperende oranje pijl, samen met rood: alleen in de richting van de pijl verder, met voorrang voor anderen.',
  'lichten-fietslichten', ['LICH-001'], (s) => {
    s.titel('Lichten voor fietsers');
    housing(s, 110, 90, [{ kleur: 'rood', kind: 'fiets', aan: false }, { kleur: 'oranje', kind: 'fiets', aan: false }, { kleur: 'groen', kind: 'fiets', aan: true }], { r: 28 });
    s.text(110, 410, 'Fietslicht:\nenkel voor fietsers\nen tweewielige\nbromfietsen', { size: 15, weight: 500 });
    housing(s, 310, 90, [{ kleur: 'rood', kind: 'fiets', aan: true }, { kleur: 'oranje', kind: 'fiets', aan: false }, { kleur: 'groen', kind: 'fiets', aan: false }], { r: 28 });
    // pijltjes rond het fietsje (links/rechts van het bovenste lampje)
    s.add(`<g fill="${COL.rood}"><path d="M${310 - 52},108 l-14,-10 v20 z"/><path d="M${310 + 52},108 l14,-10 v20 z"/></g>`);
    s.text(310, 410, 'Met pijltjes rond\nhet fietsje: dezelfde\nkleur geldt ook voor\nde dwarsrichting', { size: 15, weight: 500 });
    housing(s, 510, 90, [{ kleur: 'rood', kind: 'combi', aan: true }, { kleur: 'groen', kind: 'combi', aan: false }], { r: 28 });
    s.text(510, 355, 'Combinatielicht fiets\nen voetganger', { size: 15, weight: 500 });
    housing(s, 700, 90, [{ kleur: 'rood', kind: 'fiets', aan: true }, { kleur: 'oranje', kind: 'pijl-rechts', aan: true, knipper: true }], { r: 28 });
    s.text(700, 355, 'Knipperende oranje pijl\n+ rood: enkel in de pijl-\nrichting, met voorrang\nvoor anderen', { size: 15, weight: 500 });
    s.label(400, 525, 'Geen fietslicht? Dan volgt een fietser het gewone licht.', { size: 18, bg: '#fff' });
  });

// ---- voetgangerslichten
mk('schema-lichten-voetgangers', 'Voetgangerslichten',
  'Een tweekleurig voetgangerslicht: rood met een stilstaand mannetje bovenaan en groen met een stappend mannetje onderaan. Drie toestanden: rood (niet de rijbaan op), groen (je mag oversteken) en knipperend groen (de toelating eindigt binnenkort). Een variant met pijltjes rond het mannetje geldt ook voor de dwarsrichting.',
  'lichten-voetgangers', ['LICH-001', 'KWET-001'], (s) => {
    s.titel('Voetgangerslichten');
    const st = [['rood', 'Rood, stilstaand mannetje:\nniet de rijbaan op'], ['groen', 'Groen, stappend mannetje:\nje mag oversteken'], ['knip', 'Groen dat knippert:\nde toelating eindigt\nbinnenkort']];
    st.forEach(([k, t], i) => {
      const x = 140 + i * 260;
      housing(s, x, 90, [{ kleur: 'rood', kind: 'voet-stil', aan: k === 'rood' }, { kleur: 'groen', kind: 'voet-stap', aan: k !== 'rood', knipper: k === 'knip' }], { r: 36 });
      s.text(x, 380, t, { size: 17, weight: 600 });
    });
    s.label(400, 520, 'Pijltjes rond het mannetje: dezelfde kleur geldt ook voor de dwarsrichting.', { size: 17, bg: '#fff' });
  });

// ---- lichten boven de rijstroken
mk('schema-lichten-rijstrook', 'Lichten boven de rijstroken',
  'Een rijbaan met drie rijstroken van onder naar boven gezien, met boven elke rijstrook een signaal: boven de linkse strook een rood kruis (verboden), boven de middelste een groene pijl naar onder (toegelaten) en boven de rechtse een oranje schuine pijl (verlaat deze rijstrook naar de aangeduide strook).',
  'lichten-boven-rijstroken', ['LICH-001'], (s) => {
    s.titel('Lichten boven de rijstroken');
    s.rect(200, 70, 400, 530, C.road);
    s.line(333, 70, 333, 600, '#fff', 3, 'stroke-dasharray="16 14"'); s.line(466, 70, 466, 600, '#fff', 3, 'stroke-dasharray="16 14"');
    s.rect(180, 78, 440, 12, '#6b7280');
    const lamps = [[266, 'kruis', 'rood', 'Rood kruis:\nverboden'], [400, 'pijl-onder', 'groen', 'Groene pijl:\ntoegelaten'], [533, 'pijl-schuin-onder-links', 'oranje', 'Oranje pijl:\nverlaat de strook\nnaar de pijl']];
    lamps.forEach(([x, kind, kleur, tekst]) => {
      s.add(`<rect x="${x - 36}" y="94" width="72" height="72" rx="10" fill="#1d2128" stroke="#000" stroke-width="3"/><circle cx="${x}" cy="130" r="30" fill="#0b0d10"/>`);
      s.add(sym(kind, x, 130, 30, COL[kleur]));
      s.label(x, 215, tekst, { size: 14, bg: '#fff' });
    });
    s.car(400, 450, 0, 'blauw', null); s.car(533, 520, 0, 'geel', null);
    s.label(100, 500, 'Elk licht geldt\nenkel voor de\nstrook eronder', { size: 14, bg: '#fff' });
  }, { opt: { bg: '#d8dde5' } });

// ---- kruispunt vrijmaken
(function () {
  const s = new Svg('schema-lichten-kruispunt', 'Kruispunt met lichten: niet oprijden als je er vast komt te staan',
    'Een kruispunt met verkeerslichten. Auto 1 heeft groen en staat vlak voor het kruispunt, maar de weg aan de overkant staat vol: drie auto\'s staan er stil in de file. Auto 1 mag het kruispunt niet oprijden want hij zou er blijven staan en het dwarsverkeer hinderen. Het dwarsverkeer heeft rood maar zou anders niet kunnen doorrijden.',
    { bg: C.grass });
  s.crossroad(400, 300, 60);
  // file aan overkant (noord, rijdt naar boven in x=430)
  s.car(430, 205, 0, 'grijs', null); s.car(430, 135, 0, 'wit', null); s.car(430, 65, 0, 'grijs', null);
  s.car(430, 500, 0, 'rood', 1);
  s.route('M430,440 L430,370', CAR.rood);
  s.add(`<g stroke="#d63a3a" stroke-width="9" stroke-linecap="round"><line x1="410" y1="345" x2="450" y2="385"/><line x1="450" y1="345" x2="410" y2="385"/></g>`);
  housing(s, 520, 380, L3('groen'), { r: 16, pole: 20 });
  housing(s, 285, 385, L3('rood'), { r: 16, pole: 20 });
  s.stopline(430, 365, 'h', 56);
  s.titel('Groen licht, maar geen plaats aan de overkant');
  s.label(640, 190, 'File aan de overkant:\ngeen plaats\nom door te rijden', { size: 18, bg: '#fff' });
  s.label(150, 540, 'Auto 1 blijft wachten:\nhij zou op het kruispunt\nmoeten stilstaan en het\ndwarsverkeer hinderen.', { size: 17, bg: '#fff' });
  s.car(150, 330, 90, 'blauw', null); s.car(60, 330, 90, 'oranje', null);
  register(s.finish({ theorieblok: 'lichten-kruispunt-vrijmaken', bronnen: ['LICH-001'] }));
})();

// ---- mensfiguur
function figure(s, x, y, k, pose) {
  // front view, hoogte ca 190*k, voeten op y
  const u = (v) => v * k;
  let g = `<g transform="translate(${x} ${y})">`;
  g += `<rect x="${-u(22)}" y="${-u(80)}" width="${u(17)}" height="${u(80)}" rx="${u(5)}" fill="#1c3b73"/><rect x="${u(5)}" y="${-u(80)}" width="${u(17)}" height="${u(80)}" rx="${u(5)}" fill="#1c3b73"/>`;
  g += `<rect x="${-u(25)}" y="${-u(8)}" width="${u(22)}" height="${u(8)}" rx="${u(3)}" fill="#111"/><rect x="${u(3)}" y="${-u(8)}" width="${u(22)}" height="${u(8)}" rx="${u(3)}" fill="#111"/>`;
  g += `<rect x="${-u(32)}" y="${-u(155)}" width="${u(64)}" height="${u(84)}" rx="${u(10)}" fill="#2d57a8"/>`;
  g += `<rect x="${-u(32)}" y="${-u(98)}" width="${u(64)}" height="${u(7)}" fill="#e8e8e8"/>`;
  // armen
  const arm = (x1, y1, x2, y2) => `<line x1="${u(x1)}" y1="${-u(y1)}" x2="${u(x2)}" y2="${-u(y2)}" stroke="#2d57a8" stroke-width="${u(15)}" stroke-linecap="round"/><circle cx="${u(x2)}" cy="${-u(y2)}" r="${u(8)}" fill="#f1c9a5"/>`;
  if (pose === 'up') { g += arm(-30, 90, -42, 62); g += arm(30, 145, 36, 215); g += `<rect x="${u(26)}" y="${-u(160)}" width="${u(16)}" height="${u(12)}" fill="#fff" opacity=".85"/>`; }
  else if (pose === 'horiz') { g += arm(-30, 145, -105, 148); g += arm(30, 145, 105, 148); }
  else if (pose === 'disc') { g += arm(-30, 90, -42, 62); g += arm(30, 145, 52, 188); }
  g += `<circle cx="0" cy="${-u(172)}" r="${u(19)}" fill="#f1c9a5"/><path d="M${-u(21)},${-u(176)} a${u(21)},${u(21)} 0 0 1 ${u(42)},0 z" fill="#1c3b73"/><rect x="${-u(23)}" y="${-u(178)}" width="${u(46)}" height="${u(6)}" rx="${u(2)}" fill="#1c3b73"/>`;
  g += '</g>';
  return s.add(g);
}

(function () {
  const s = new Svg('schema-bevoegde-persoon-stop', 'Bevoegde persoon: arm rechtop betekent stoppen voor iedereen',
    'Links een bevoegde persoon (agent) met één arm rechtop. Rechts een kruispunt van boven gezien met in het midden de agent en op elk van de vier takken een auto met een rode stopstreep: alle weggebruikers uit alle richtingen moeten stoppen, wie al op het kruispunt staat maakt het vrij.',
    { bg: BG });
  s.titel('Arm rechtop: iedereen stopt');
  figure(s, 140, 480, 1.45, 'up');
  s.label(140, 560, 'arm rechtop', { size: 20, bg: '#fff' });
  // kruispunt-minimap
  s.rect(280, 80, 500, 500, C.grass);
  const cx = 530, cy = 330;
  s.rect(cx - 55, 80, 110, 500, C.road); s.rect(280, cy - 55, 500, 110, C.road);
  s.circle(cx, cy, 16, '#2d57a8', `stroke="#fff" stroke-width="3"`); s.circle(cx, cy, 7, '#f1c9a5');
  // rechtsrijdend verkeer: noord op de oostelijke helft, zuid op de westelijke, west op de noordelijke, oost op de zuidelijke
  const stops = [[cx + 27, cy + 130, 0], [cx - 27, cy - 130, 180], [cx + 130, cy - 27, 270], [cx - 130, cy + 27, 90]];
  stops.forEach(([x, y, r], i) => {
    s.car(x, y + (i === 0 ? 40 : i === 1 ? -40 : 0), r, ['rood', 'blauw', 'geel', 'groen'][i], null);
  });
  s.rect(cx, cy + 70, 55, 6, '#d63a3a'); s.rect(cx - 55, cy - 76, 55, 6, '#d63a3a');
  s.rect(cx + 70, cy - 55, 6, 55, '#d63a3a'); s.rect(cx - 76, cy, 6, 55, '#d63a3a');
  s.label(cx, 108, 'Alle richtingen: stoppen', { size: 20, bg: '#d63a3a', fg: '#fff' });
  s.label(cx, 565, 'Wie al op het kruispunt staat, maakt het vrij.', { size: 17, bg: '#fff' });
  register(s.finish({ theorieblok: 'bevoegde-personen-seinen', bronnen: ['LICH-001'] }));
})();

module.exports = { figure, housing, BG, COL, sym };
