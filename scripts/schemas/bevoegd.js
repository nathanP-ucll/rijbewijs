'use strict';
// Bevoegde personen, rangorde, opstelvak.
const { Svg, C, CAR, register } = require('./lib');
const { figure, housing, BG, COL } = require('./lichten');

function mini(s, cx, cy) {
  s.rect(280, 80, 500, 500, C.grass);
  s.rect(cx - 55, 80, 110, 500, C.road); s.rect(280, cy - 55, 500, 110, C.road);
  s.circle(cx, cy, 16, '#2d57a8', 'stroke="#fff" stroke-width="3"'); s.circle(cx, cy, 7, '#f1c9a5');
}

// ---- armen horizontaal
(function () {
  const s = new Svg('schema-bevoegde-persoon-armen', 'Bevoegde persoon: arm of armen horizontaal',
    'Links een bevoegde persoon die je van voren ziet met beide armen horizontaal uitgestrekt. Rechts een kruispunt van boven gezien met de bevoegde persoon in het midden. De weggebruikers voor en achter hem (van onder en van boven) moeten stoppen, want de armen dwarsen hun richting. De weggebruikers die uit de richting van de uitgestrekte arm of armen komen (van links en van rechts) moeten voor dit teken niet stoppen.',
    { bg: BG });
  s.titel('Arm of armen horizontaal: voor en achter stoppen');
  figure(s, 140, 480, 1.2, 'horiz');
  s.label(140, 545, 'arm of armen\nhorizontaal', { size: 20, bg: '#fff' });
  const cx = 530, cy = 330;
  mini(s, cx, cy);
  // auto's: onder (voor de agent) en boven (achter hem) stoppen; links/rechts mogen door
  s.car(cx + 27, cy + 150, 0, 'rood', null); s.car(cx - 27, cy - 150, 180, 'blauw', null);
  s.rect(cx, cy + 75, 55, 6, '#d63a3a'); s.rect(cx - 55, cy - 81, 55, 6, '#d63a3a');
  s.car(cx - 170, cy + 27, 90, 'geel', null); s.car(cx + 170, cy - 27, 270, 'groen', null);
  s.arrow(cx - 120, cy + 27, cx - 80, cy + 27, '#1f9d55', 7); s.arrow(cx + 120, cy - 27, cx + 80, cy - 27, '#1f9d55', 7);
  s.label(cx + 120, cy + 170, 'stoppen', { size: 18, bg: '#d63a3a', fg: '#fff' });
  s.label(cx - 120, cy - 170, 'stoppen', { size: 18, bg: '#d63a3a', fg: '#fff' });
  s.label(cx - 150, cy + 80, 'hoeft niet\nte stoppen', { size: 18, bg: '#1f9d55', fg: '#fff' });
  s.label(cx + 150, cy - 80, 'hoeft niet\nte stoppen', { size: 18, bg: '#1f9d55', fg: '#fff' });
  s.arrow(cx - 40, cy + 2, cx - 24, cy + 2, '#2d57a8', 3);
  s.line(cx - 36, cy, cx + 36, cy, '#2d57a8', 4);
  s.label(cx + 40, 545, 'De agent kijkt naar onder;\nzijn armen wijzen naar links en rechts.', { size: 15, bg: '#fff' });
  register(s.finish({ theorieblok: 'bevoegde-personen-seinen', bronnen: ['LICH-001'] }));
})();

// ---- werfzeiger met schijf
(function () {
  const s = new Svg('schema-werfzeiger-schijf', 'Signaalgever of werfopzichter met schijf (verboden toegang)',
    'Links een werfopzichter die een ronde schijf met het verkeersbord verboden toegang omhoog houdt. Rechts een auto die stopt voor de signaalgever. Het bord op de schijf betekent: stoppen.',
    { bg: BG });
  s.titel('Schijf met bord verboden toegang: stoppen');
  s.line(246, 232, 246, 150, '#8d949e', 6);
  figure(s, 170, 500, 1.45, 'disc');
  s.sign('C3', 246, 120, 110, { pole: false });
  s.label(170, 570, 'signaalgever / werfopzichter', { size: 18, bg: '#fff' });
  s.rect(470, 70, 240, 530, C.road);
  s.line(590, 70, 590, 600, '#fff', 3, 'stroke-dasharray="16 14"');
  s.rect(590, 235, 120, 6, '#fff');
  s.car(650, 430, 0, 'rood', null, { brake: 1 });
  s.circle(722, 230, 14, '#2d57a8', 'stroke="#fff" stroke-width="3"'); s.circle(722, 230, 6, '#f1c9a5');
  s.sign('C3', 762, 230, 44);
  s.label(650, 190, 'auto stopt', { size: 20, bg: '#d63a3a', fg: '#fff' });
  s.label(600, 515, 'Zij geven alleen aanwijzingen\nin de gevallen die de wegcode\nvoorziet (bv. werven, evenementen).', { size: 14, bg: '#fff' });
  register(s.finish({ theorieblok: 'bevoegde-personen-signaalgevers-werf', bronnen: ['LICH-001'] }));
})();

// ---- rangorde (trap)
function trap(naam, title, desc, theorieblok, steps) {
  const s = new Svg(naam, title, desc, { bg: BG });
  s.titel(title);
  const n = steps.length, top = 80, hh = Math.min(120, (470 / n) - 10);
  steps.forEach((st, i) => {
    const x = 40 + i * 70, y = top + i * (hh + 10), w = 720 - i * 70;
    s.add(`<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="14" fill="${st.fill}" stroke="#1c2230" stroke-width="2.5"/>`);
    s.badge(x + 34, y + hh / 2, i + 1, { r: 20 });
    s.text(x + 80, y + hh / 2 - 6, st.titel, { size: 24, anchor: 'start', fill: st.fg || '#fff', weight: 800 });
    s.text(x + 80, y + hh / 2 + 22, st.sub, { size: 16, anchor: 'start', fill: st.fg || '#fff', weight: 500 });
    st.icon(s, x + w - 70, y + hh / 2);
  });
  s.text(400, 588, 'Hoger op de trap = gaat voor. Je volgt de eerste die van toepassing is.', { size: 17, weight: 600 });
  register(s.finish({ theorieblok, bronnen: ['VOOR-001', 'VOOR-002', 'LICH-001'] }));
}
const iconAgent = (s, x, y) => { figure(s, x - 8, y + 36, 0.42, 'up'); };
const iconLicht = (s, x, y) => { s.add(`<rect x="${x - 14}" y="${y - 38}" width="28" height="76" rx="8" fill="#1d2128" stroke="#000" stroke-width="2"/>`); s.circle(x, y - 22, 9, COL.rood); s.circle(x, y, 9, '#4d3410'); s.circle(x, y + 22, 9, '#143b24'); };
const iconBord = (s, x, y) => { s.sign('B1', x, y, 62, { pole: false }); };
const iconRegel = (s, x, y) => { s.rect(x - 38, y - 9, 76, 18, '#2b2f36', 'rx="4"'); s.rect(x - 9, y - 38, 18, 76, '#2b2f36', 'rx="4"'); s.arrow(x + 54, y, x + 4, y, '#fff', 4); s.text(x + 22, y + 32, 'van rechts', { size: 11, fill: '#fff', weight: 600 }); };
trap('schema-rangorde-voorrang', 'Rangorde: wie of wat bepaalt de voorrang?',
  'Een trap met vier treden van boven naar onder: 1 bevoegde persoon, 2 verkeerslichten, 3 verkeersborden, 4 algemene verkeersregels (voorrang van rechts). Wat hoger staat, gaat voor wat lager staat.',
  'voorrang-rangorde', [
    { titel: 'Bevoegde persoon', sub: 'bv. politie: zijn bevel gaat voor alles', fill: '#2d57a8', icon: iconAgent },
    { titel: 'Verkeerslichten', sub: 'gaan voor de voorrangsborden op dezelfde weg', fill: '#1f9d55', icon: iconLicht },
    { titel: 'Verkeersborden', sub: 'voorrangsborden gaan voor de gewone regels', fill: '#c27d00', icon: iconBord },
    { titel: 'Algemene verkeersregels', sub: 'zonder licht of bord: voorrang van rechts', fill: '#6b7280', icon: iconRegel },
  ]);
trap('schema-rangorde-lichten', 'Rangorde: bevoegde persoon, lichten, borden en regels',
  'Een trap met drie treden: 1 bevelen van een bevoegde persoon, 2 verkeerstekens (lichten, borden, wegmarkeringen), 3 verkeersregels zoals voorrang van rechts. Een agent die je laat stoppen bij groen licht gaat voor: je stopt.',
  'lichten-rangorde', [
    { titel: 'Bevoegde persoon', sub: 'ook als het licht groen is: je volgt de agent', fill: '#2d57a8', icon: iconAgent },
    { titel: 'Verkeerstekens', sub: 'lichten, borden, markeringen', fill: '#1f9d55', icon: iconLicht },
    { titel: 'Verkeersregels', sub: 'bv. voorrang van rechts', fill: '#6b7280', icon: iconRegel },
  ]);

// ---- opstelvak
(function () {
  const s = new Svg('schema-opstelvak', 'Opstelvak voor fietsers bij verkeerslichten',
    'Een rijbaan van onder naar boven met twee stopstrepen achter elkaar en daartussen een wit fietssymbool: het opstelvak. Een fietser staat in het vak, een auto staat achter de eerste stopstreep. Het verkeerslicht staat op rood.',
    { bg: C.grass });
  s.titel('Opstelvak voor fietsers');
  s.rect(250, 48, 300, 552, C.road); s.line(400, 48, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
  s.rect(400, 410, 150, 8, '#fff'); s.rect(400, 290, 150, 8, '#fff');
  s.add(`<g transform="translate(475 355) scale(1.4)" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="-11" cy="8" r="7"/><circle cx="11" cy="8" r="7"/><path d="M-11,8 L-3,-4 L6,-4 L11,8 M-3,-4 L0,8 L-11,8 M6,-4 L4,-9 M1,-9 L8,-9"/><circle cx="-3" cy="-13" r="3.2" fill="#fff" stroke="none"/></g>`);
  s.bike(440, 350, 0, null);
  s.car(475, 520, 0, 'rood', null, { brake: 1 });
  housing(s, 600, 250, [{ kleur: 'rood', aan: true }, { kleur: 'oranje', aan: false }, { kleur: 'groen', aan: false }], { r: 22, pole: 30 });
  s.label(150, 370, 'opstelvak: enkel voor\nfietsers en tweewielige\nbromfietsen, tijdens rood', { size: 17, bg: '#fff' });
  s.label(150, 520, 'andere bestuurders\nstoppen voor de\neerste stopstreep', { size: 17, bg: '#fff' });
  s.arrow(250, 430, 400, 455, '#fff', 3);
  register(s.finish({ theorieblok: 'lichten-fietslichten', bronnen: ['LICH-001'], hotspots: [
    { id: 'opstelvak', x: 50, y: 48.3, w: 18.75, h: 20, label: 'Het opstelvak (hier mogen fietsers tijdens rood staan)', correct: true },
    { id: 'auto', x: 56.9, y: 80, w: 5.4, h: 10, label: 'Hier staat de auto (voor de eerste stopstreep)', correct: false },
  ] }));
})();
