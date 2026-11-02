'use strict';
// Dashboardlampjes: een SVG per symbool. Kleur enkel waar ze eenduidig is (zie docs/TE-CONTROLEREN-techniek.md punt 4).
const { Svg, register } = require('./lib');

const KL = { rood: '#ff3b30', oranje: '#ffa31a', groen: '#2fd36b', blauw: '#3d8bff', neutraal: '#d4dae4' };
// symbolen in een 64x64-vak, tekenstijl: lijnen, geen vulling (tenzij vermeld)
const SYM = {
  olie: (c) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27 H44 V47 a3 3 0 0 1-3 3 H19 a3 3 0 0 1-3-3 Z"/><path d="M44 31 H52 L58 24"/><path d="M16 31 L5 22"/><path d="M16 27 L22 21 H34"/></g><path d="M5 31 C2 36 2 40 5 40 C8 40 8 36 5 31 Z" fill="${c}"/>`,
  remmen: (c) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"><circle cx="32" cy="32" r="14"/><path d="M13 20 A22 22 0 0 0 13 44"/><path d="M51 20 A22 22 0 0 1 51 44"/><line x1="32" y1="24" x2="32" y2="34"/></g><circle cx="32" cy="40" r="2.4" fill="${c}"/>`,
  motor: (c) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 24 H22 L25 19 H39 V24 H46 L50 28 H56 V42 H50 L46 48 H20 L14 42 Z"/><path d="M6 30 V40"/><path d="M6 35 H14"/><path d="M30 19 V15 H36"/></g>`,
  grootlicht: (c) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M34 14 C22 14 14 22 14 32 C14 42 22 50 34 50 Z"/><line x1="42" y1="18" x2="58" y2="14"/><line x1="42" y1="26" x2="58" y2="24"/><line x1="42" y1="34" x2="58" y2="34"/><line x1="42" y1="42" x2="58" y2="44"/></g>`,
  richting: (c) => `<g fill="${c}"><path d="M6 32 L26 14 V24 H30 V40 H26 V50 Z"/><path d="M58 32 L38 14 V24 H34 V40 H38 V50 Z" opacity=".95"/></g>`,
  accu: (c) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="22" width="48" height="28" rx="3"/><path d="M16 22 V16 H24 V22"/><path d="M40 22 V16 H48 V22"/><path d="M15 36 H25"/><path d="M39 36 H49 M44 31 V41"/></g>`,
  koeling: (c) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M26 10 V34 a8 8 0 1 0 8 0 V10 Z" transform="translate(-4 0)"/><path d="M42 40 q4 -3 8 0 t8 0 M42 50 q4 -3 8 0 t8 0" transform="translate(-6 -6)"/></g>`,
  airbag: (c) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="16" r="5" fill="${c}"/><path d="M22 23 L26 38 H42"/><path d="M26 38 L22 52"/><path d="M24 28 L36 32"/><circle cx="46" cy="30" r="12"/></g>`,
  abs: (c) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"><circle cx="32" cy="32" r="14"/><path d="M13 20 A22 22 0 0 0 13 44"/><path d="M51 20 A22 22 0 0 1 51 44"/></g><text x="32" y="36.5" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="800" fill="${c}">ABS</text>`,
  banden: (c) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 12 C8 18 6 28 6 34 C6 46 18 52 32 52 C46 52 58 46 58 34 C58 28 56 18 46 12 C40 10 24 10 18 12 Z" transform="translate(0 -4) scale(1 .9) translate(0 4)" opacity="0"/><path d="M14 46 C8 40 8 26 16 18 C22 12 42 12 48 18 C56 26 56 40 50 46 Z" transform="translate(0 2)"/><line x1="32" y1="24" x2="32" y2="36"/></g><circle cx="32" cy="43" r="2.4" fill="${c}"/>`,
};

function lamp(naam, symKey, kleur, titel, desc, caption, extra = {}) {
  const s = new Svg(naam, titel, desc, { w: 200, h: 220, bg: 'none' });
  const c = KL[kleur];
  s.add('<rect width="200" height="220" rx="22" fill="#171b22"/>');
  s.add('<rect x="6" y="6" width="188" height="208" rx="18" fill="none" stroke="#2c323d" stroke-width="2"/>');
  if (kleur !== 'neutraal') s.add(`<circle cx="100" cy="100" r="62" fill="${c}" opacity=".13"/>`);
  s.add(`<g transform="translate(100 100) scale(2.1) translate(-32 -32)">${SYM[symKey](c)}</g>`);
  s.text(100, 190, caption, { size: 17, fill: '#e8ecf3', weight: 700 });
  if (extra.sub) s.text(100, 208, extra.sub, { size: 11, fill: '#9aa3b2', weight: 500 });
  register(s.finish({ theorieblok: 'techniek-dashboard-symbolen', bronnen: ['TECH-001'], kleurEenduidig: kleur !== 'neutraal', kleur: kleur === 'neutraal' ? null : kleur, symbool: extra.symbool }));
}
// eenduidige kleur
lamp('tech-lampje-olie', 'olie', 'rood', 'Dashboardlampje oliedruk (rood)', 'Een rood oliekannetje met een druppel op een donker dashboardvlak: te lage oliedruk. Stoppen en het oliepeil controleren.', 'Oliedruk', { sub: 'rood: veilig stoppen', symbool: 'Oliedruk' });
lamp('tech-lampje-remmen', 'remmen', 'rood', 'Dashboardlampje remmen (rood)', 'Een rood uitroepteken in een cirkel tussen twee haakjes op een donker dashboardvlak: probleem met het remsysteem of handrem nog aan.', 'Remmen', { sub: 'rood: eerst handrem controleren', symbool: 'Remmen' });
lamp('tech-lampje-motor', 'motor', 'oranje', 'Dashboardlampje motorstoring (oranje)', 'Een oranje motorblok op een donker dashboardvlak: storing in het motorsysteem. Naar de garage; als het lampje knippert veilig stoppen.', 'Motorstoring', { sub: 'oranje: laten nakijken', symbool: 'Motorstoring' });
lamp('tech-lampje-grootlicht', 'grootlicht', 'blauw', 'Dashboardlampje grootlicht (blauw)', 'Een blauw koplamp-symbool met vier lichtstralen op een donker dashboardvlak: het grootlicht brandt. Geen waarschuwing; schakel het uit bij tegenliggers.', 'Grootlicht', { sub: 'blauw: grootlicht aan', symbool: 'Grootlicht' });
lamp('tech-lampje-richtingaanwijzer', 'richting', 'groen', 'Dashboardlampje richtingaanwijzer (groen)', 'Twee groene pijlen naar links en naar rechts op een donker dashboardvlak: de richtingaanwijzer of alarmlichten staan aan. Groen betekent: het systeem werkt.', 'Richtingaanwijzer', { sub: 'groen: staat aan', symbool: 'Richtingaanwijzer' });
// kleur verschilt per bron/merk -> neutraal
const NEUTRAAL = { sub: 'kleur verschilt per merk' };
lamp('tech-lampje-accu', 'accu', 'neutraal', 'Dashboardlampje accu en laadcircuit', 'Een accu-symbool met plus- en minpool op een donker dashboardvlak: probleem met accu of laadcircuit. De kleur van dit lampje verschilt per merk, daarom is het in neutrale kleur getekend.', 'Accu / laadcircuit', { ...NEUTRAAL, symbool: 'Accu' });
lamp('tech-lampje-koelvloeistof', 'koeling', 'neutraal', 'Dashboardlampje koelvloeistof en temperatuur', 'Een thermometer in golvende vloeistof op een donker dashboardvlak: motor te warm of koelvloeistof op. De kleur verschilt per merk, daarom neutraal getekend.', 'Koelvloeistof', { ...NEUTRAAL, symbool: 'Koelvloeistof' });
lamp('tech-lampje-airbag', 'airbag', 'neutraal', 'Dashboardlampje airbag', 'Een zittende persoon met een grote cirkel (airbag) voor zich op een donker dashboardvlak: storing in airbag of gordelspanner. De kleur verschilt per bron, daarom neutraal getekend.', 'Airbag', { ...NEUTRAAL, symbool: 'Airbag' });
lamp('tech-lampje-abs', 'abs', 'neutraal', 'Dashboardlampje ABS', 'De letters ABS in een cirkel tussen haakjes op een donker dashboardvlak: storing in het antiblokkeersysteem. De kleur verschilt per bron, daarom neutraal getekend.', 'ABS', { ...NEUTRAAL, symbool: 'ABS' });
lamp('tech-lampje-bandenspanning', 'banden', 'neutraal', 'Dashboardlampje bandenspanning', 'Een doorsnede van een band met een uitroepteken op een donker dashboardvlak: de bandenspanning is te laag. De kleur verschilt per bron, daarom neutraal getekend.', 'Bandenspanning', { ...NEUTRAAL, symbool: 'Bandenspanning' });

// ---- kleurcode
(function () {
  const s = new Svg('tech-dashboard-kleuren', 'Dashboardlampjes: de kleurcode',
    'Vier gekleurde lampjes met hun betekenis. Rood: gevaar of veiligheid, veilig stoppen en nagaan. Oranje of geel: storing of nazicht nodig, snel naar de garage. Groen: een systeem staat aan en werkt. Blauw: het grootlicht is aan.',
    { w: 800, h: 460, bg: '#171b22' });
  s.text(400, 46, 'Dashboardlampjes: de kleur zegt hoe dringend het is', { size: 26, fill: '#fff', weight: 700 });
  const rows = [['rood', 'ROOD', 'Gevaar of veiligheid: veilig stoppen en nagaan'], ['oranje', 'ORANJE / GEEL', 'Storing of nazicht nodig: snel naar de garage'], ['groen', 'GROEN', 'Systeem staat aan en werkt (bv. richtingaanwijzer)'], ['blauw', 'BLAUW', 'Enkel het grootlicht is aan']];
  rows.forEach(([k, t, d], i) => {
    const y = 120 + i * 85;
    s.add(`<circle cx="90" cy="${y}" r="42" fill="${KL[k]}" opacity=".16"/><circle cx="90" cy="${y}" r="26" fill="${KL[k]}"/>`);
    s.text(170, y - 4, t, { size: 24, fill: KL[k], weight: 800, anchor: 'start' });
    s.text(170, y + 24, d, { size: 19, fill: '#e8ecf3', weight: 500, anchor: 'start' });
  });
  s.text(400, 445, 'Een knipperend motorlampje is ernstiger dan een brandend lampje.', { size: 16, fill: '#9aa3b2', weight: 500 });
  register(s.finish({ theorieblok: 'techniek-dashboard-kleuren', bronnen: ['TECH-001'] }));
})();

// ---- overzichtsplaten
function plaat(naam, titel, desc, kleur, items) {
  const s = new Svg(naam, titel, desc, { w: 800, h: 360, bg: '#171b22' });
  s.text(400, 42, titel, { size: 24, fill: KL[kleur] || '#fff', weight: 800 });
  const n = items.length, step = 760 / n;
  items.forEach(([sym, kl, naamTxt], i) => {
    const x = 20 + step * i + step / 2;
    s.add(`<circle cx="${x}" cy="170" r="70" fill="${KL[kl]}" opacity=".12"/>`);
    s.add(`<g transform="translate(${x} 170) scale(2.4) translate(-32 -32)">${SYM[sym](KL[kl])}</g>`);
    s.text(x, 290, naamTxt, { size: 19, fill: '#e8ecf3', weight: 700 });
  });
  register(s.finish({ theorieblok: 'techniek-dashboard-symbolen', bronnen: ['TECH-001'] }));
}
plaat('tech-dashboard-rood', 'Rood: veilig stoppen', 'Overzicht van twee rode dashboardlampjes: oliedruk (oliekannetje) en remmen (uitroepteken tussen haakjes). Rood betekent gevaar of veiligheid: veilig stoppen en nagaan.', 'rood', [['olie', 'rood', 'Oliedruk'], ['remmen', 'rood', 'Remmen']]);
plaat('tech-dashboard-oranje', 'Oranje: laten nakijken', 'Overzicht van een oranje dashboardlampje: motorstoring (motorblok). Oranje betekent: storing of nazicht nodig, snel naar de garage.', 'oranje', [['motor', 'oranje', 'Motorstoring']]);
plaat('tech-dashboard-groen-blauw', 'Groen en blauw', 'Overzicht van een groen en een blauw dashboardlampje: groen de richtingaanwijzer (systeem staat aan en werkt), blauw het grootlicht (enkel het grootlicht is aan).', 'groen', [['richting', 'groen', 'Richtingaanwijzer (groen)'], ['grootlicht', 'blauw', 'Grootlicht (blauw)']]);
