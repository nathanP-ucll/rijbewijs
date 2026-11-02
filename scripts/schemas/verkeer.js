'use strict';
// Openbaar vervoer: tram, overweg, busstrook.
const { Svg, C, CAR, register } = require('./lib');
const RED = '#d63a3a', GRN = '#1f9d55';
const cross = (s, x, y, size = 40) => s.add(`<g stroke="${RED}" stroke-width="${size / 4}" stroke-linecap="round"><line x1="${x - size / 2}" y1="${y - size / 2}" x2="${x + size / 2}" y2="${y + size / 2}"/><line x1="${x + size / 2}" y1="${y - size / 2}" x2="${x - size / 2}" y2="${y + size / 2}"/></g>`);
const tick = (s, x, y, size = 40) => s.add(`<path d="M${x - size / 2},${y} L${x - size / 8},${y + size / 2.5} L${x + size / 2},${y - size / 2.5}" fill="none" stroke="${GRN}" stroke-width="${size / 4}" stroke-linecap="round" stroke-linejoin="round"/>`);

(function () {
  const s = new Svg('schema-tram-inhalen-rechts', 'Een tram in de rijbaan haal je rechts in',
    'Een straat met een tramspoor in het midden. Een tram staat stil aan een halte. Een auto rijdt rechts langs de tram voorbij (groen vinkje). Links langs de tram voorbijrijden is fout (rood kruis); links is de rijstrook van het tegemoetkomende verkeer, waar een tegenligger rijdt.',
    {});
  s.rect(220, 0, 360, 600, C.road); s.track(400, 0, 400, 600);
  s.tram(400, 250, 0, null);
  s.car(500, 480, 0, 'blauw', null);
  s.route('M500,430 L500,330 Q500,150 500,60', CAR.blauw); tick(s, 540, 200, 40);
  s.car(300, 120, 180, 'rood', null);
  s.route('M300,190 L300,360 Q300,380 300,420', '#bbb', { dash: '4 8' }); cross(s, 300, 420, 34);
  s.label(650, 250, 'Tram haal je\nrechts in, ook\nals hij stilstaat', { size: 19, bg: '#fff' });
  s.label(135, 300, 'Links is het\ntegemoetkomend\nverkeer', { size: 17, bg: '#fff' });
  s.titel('Tram inhalen: rechts');
  register(s.finish({ theorieblok: 'openbaar-spoorvoertuigen-voorrang', bronnen: ['OPEN-001'] }));
})();

function overweg(s, hoek) {
  s.rect(340, 0, 120, 600, C.road); s.line(400, 0, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
  // spoor horizontaal, tussen y 270 en 330
  s.track(0, 300, 340, 300); s.track(460, 300, 800, 300); s.track(340, 300, 460, 300);
  s.rect(340, 280, 120, 40, 'rgba(60,60,60,.0)');
}
(function () {
  const s = new Svg('schema-overweg-lichten', 'Overweg met knipperende rode lichten en slagbomen',
    'Een weg die een spoor kruist (overweg). Aan beide kanten staan twee beurtelings knipperende rode lichten en slagbomen die dichtgaan; het Andreaskruis staat bij de overweg. Een auto stopt voor de stopstreep en rijdt niet verder zolang de lichten knipperen, de slagbomen bewegen of dicht zijn.',
    {});
  overweg(s);
  // stoplijn en slagbomen
  s.rect(400, 395, 60, 6, '#fff'); s.rect(340, 205, 60, 6, '#fff');
  s.add(`<g><rect x="400" y="372" width="88" height="10" fill="#fff" stroke="${RED}" stroke-width="2"/><g stroke="${RED}" stroke-width="5">${[0, 1, 2, 3].map((i) => `<line x1="${408 + i * 22}" y1="372" x2="${420 + i * 22}" y2="382"/>`).join('')}</g></g>`);
  s.add(`<g><rect x="312" y="218" width="88" height="10" fill="#fff" stroke="${RED}" stroke-width="2"/><g stroke="${RED}" stroke-width="5">${[0, 1, 2, 3].map((i) => `<line x1="${320 + i * 22}" y1="218" x2="${332 + i * 22}" y2="228"/>`).join('')}</g></g>`);
  for (const [x, y] of [[490, 352], [310, 248]]) {
    s.add(`<rect x="${x - 18}" y="${y - 44}" width="36" height="66" rx="8" fill="#1d2128" stroke="#000" stroke-width="2"/>`);
    s.circle(x, y - 24, 11, '#ff2d1d'); s.circle(x, y + 2, 11, '#4a1d1d');
    s.add(`<g stroke="#ff2d1d" stroke-width="3" stroke-linecap="round"><line x1="${x - 24}" y1="${y - 32}" x2="${x - 32}" y2="${y - 38}"/><line x1="${x + 24}" y1="${y - 32}" x2="${x + 32}" y2="${y - 38}"/></g>`);
  }
  s.car(430, 470, 0, 'rood', null, { brake: 1 });
  s.sign('A45', 560, 450, 70);
  s.label(645, 175, 'Rode lichten knipperen,\nslagbomen dicht:\nniet voorbij de stopstreep', { size: 18, bg: '#fff' });
  s.label(150, 450, 'Auto stopt\nvoor de\nstopstreep', { size: 18, bg: '#d63a3a', fg: '#fff' });
  s.titel('Overweg: rode lichten = stoppen');
  register(s.finish({ theorieblok: 'openbaar-overweg-signalisatie', bronnen: ['OPEN-001'] }));
})();

(function () {
  const s = new Svg('schema-overweg-file', 'Overweg: niet oprijden als je er moet stilstaan',
    'Een weg die een spoor kruist, zonder werkende slagbomen, met file. Aan de overkant staat het verkeer stil en is er geen plaats. Een auto staat voor de overweg en rijdt niet op, want hij zou op de sporen moeten stilstaan. Stilstaan op een overweg is verboden.',
    {});
  overweg(s);
  s.car(430, 140, 0, 'grijs', null); s.car(430, 70, 0, 'wit', null); s.car(370, 120, 180, 'geel', null);
  s.car(430, 480, 0, 'rood', 1, { brake: 1 });
  cross(s, 430, 330, 56);
  s.label(645, 160, 'Aan de overkant is\ngeen plaats: file', { size: 18, bg: '#fff' });
  s.label(645, 450, 'Wacht voor de overweg tot\nje aan de andere kant\nplaats hebt.', { size: 18, bg: '#fff' });
  s.label(150, 160, 'Stilstaan of\nparkeren op de\noverweg: verboden', { size: 17, bg: '#fff' });
  s.titel('Overweg: niet oprijden in de file');
  register(s.finish({ theorieblok: 'openbaar-overweg-gedrag', bronnen: ['OPEN-001'] }));
})();

(function () {
  const s = new Svg('schema-busstrook-rechtsaf', 'Busstrook: rechtsaf slaan vlak voor het kruispunt',
    'Een straat met rechts een busstrook (bruinrood) en een zijstraat naar rechts. Een auto op de gewone rijstrook slaat rechts af en rijdt daarvoor vlak voor het kruispunt even op de busstrook; verder terug op de busstrook rijden mag niet. Het bord busstrook duidt de busstrook aan.',
    {});
  s.rect(250, 0, 220, 600, C.road); s.rect(470, 190, 330, 80, C.road);
  s.line(360, 0, 360, 600, '#fff', 3, 'stroke-dasharray="16 14"');
  s.rect(415, 270, 55, 330, '#a65e4a'); s.rect(415, 0, 55, 190, '#a65e4a');
  s.add('<text x="442" y="340" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="800" fill="#fff" text-anchor="middle" transform="rotate(-90 442 340)">BUS</text>');
  s.add('<text x="442" y="470" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="800" fill="#fff" text-anchor="middle" transform="rotate(-90 442 470)">BUS</text>');
  s.car(388, 520, 0, 'blauw', null, { blink: 'R' });
  s.route('M388,460 L388,340 Q388,238 470,232 L640,232', CAR.blauw);
  s.sign('F17', 530, 540, 80);
  s.label(150, 330, 'Zolang de strook niet\nnodig is: op de gewone\nrijstrook blijven', { size: 17, bg: '#fff' });
  s.label(620, 400, 'Enkel vlak voor het kruispunt\nmag je de busstrook op\nom rechts af te slaan', { size: 17, bg: '#fff' });
  s.titel('Busstrook: rechtsaf in de onmiddellijke nabijheid');
  register(s.finish({ theorieblok: 'openbaar-busstrook-afslaan', bronnen: ['OPEN-001'] }));
})();
