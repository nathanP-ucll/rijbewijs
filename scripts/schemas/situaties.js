'use strict';
// Situatie-schema's (voorrang e.d.). Elk schema bestaat 2x:
//  <naam>.svg           = uitleg-versie (met aanwijzing wie eerst gaat, voor in de theorie)
//  <naam>-oefening.svg  = neutrale versie zonder antwoord (voor oefeningen)
const { Svg, C, CAR, register, pct, pbox } = require('./lib');

function drawVeh(s, v) {
  const o = { blink: v.blink, brake: v.brake };
  if (v.type === 'bus') s.bus(v.x, v.y, v.rot, v.nr, o);
  else if (v.type === 'tram') s.tram(v.x, v.y, v.rot, v.nr);
  else if (v.type === 'ped') s.ped(v.x, v.y, v.nr, v);
  else if (v.type === 'bike') s.bike(v.x, v.y, v.rot, v.nr, v);
  else if (v.type === 'ambulance') s.ambulance(v.x, v.y, v.rot, v.nr);
  else s.car(v.x, v.y, v.rot, v.kleur, v.nr, o);
}

function dual(def) {
  const out = [];
  for (const sol of [true, false]) {
    if (!sol && !def.oefening) continue;
    const naam = sol ? def.naam : def.naam + '-oefening';
    const desc = (sol && def.descUitleg ? def.descUitleg : def.desc);
    const s = new Svg(naam, (sol ? def.title : (def.titleOef || def.title) + ' (oefening)'), desc, def.opt || {});
    def.draw(s, sol);
    const entry = s.finish({
      theorieblok: def.theorieblok,
      voertuigen: (def.voertuigen || []).map((v) => ({ nr: v.nr, label: v.label, kleur: v.kleur || null, ...pct(s, v.x, v.y) })),
      bronnen: def.bronnen,
    });
    if (def.situatie) entry.situatie = def.situatie;
    if (def.hotspots) entry.hotspots = def.hotspots(s);
    if (def.oefening) { entry.type = sol ? 'uitleg' : 'oefening'; entry.partner = sol ? def.naam + '-oefening' : def.naam; }
    if (!entry.voertuigen.length) delete entry.voertuigen;
    register(entry);
    out.push(entry);
  }
  return out;
}

const tag = (s, x, y, txt, kind = 'go') => s.label(x, y, txt, kind === 'go'
  ? { bg: '#1f9d55', fg: '#fff', size: 17 } : kind === 'wait' ? { bg: '#d63a3a', fg: '#fff', size: 17 } : { bg: '#fff', fg: C.ink, size: 17 });

const HW = 60;
const col = (k) => CAR[k];
function V(nr, label, kleur, x, y, rot, extra = {}) { return { nr, label, kleur, x, y, rot, ...extra }; }

// ---------------------------------------------------------------- voorrang van rechts (3 auto's)
(function () {
  const vs = [V(1, 'auto 1 (komt van onder)', 'rood', 430, 475, 0), V(2, 'auto 2 (komt van rechts)', 'blauw', 650, 270, 270), V(3, 'auto 3 (komt van links)', 'geel', 150, 330, 90)];
  dual({
    naam: 'schema-voorrang-rechts', title: 'Voorrang van rechts: kruispunt zonder borden of lichten',
    desc: 'Bovenaanzicht van een kruispunt zonder verkeersborden, lichten of bevoegde persoon. Drie auto\'s rijden elk rechtdoor: auto 1 komt van onder (rijdt naar boven), auto 2 komt van rechts (rijdt naar links) en auto 3 komt van links (rijdt naar rechts).',
    descUitleg: 'Kruispunt zonder borden of lichten: voorrang van rechts. Auto 2 heeft niemand rechts van zich en rijdt eerst. Auto 1 moet auto 2 laten voorgaan (die komt van rechts) en rijdt als tweede. Auto 3 moet auto 1 laten voorgaan (die komt van zijn rechterkant, van onder) en rijdt als laatste.',
    theorieblok: 'voorrang-van-rechts', bronnen: ['VOOR-001', 'VOOR-002'], oefening: true, voertuigen: vs,
    situatie: { juisteVolgorde: [2, 1, 3], motivatie: 'Zonder borden of lichten geldt voorrang van rechts. Auto 2 heeft niemand aan zijn rechterkant, dus gaat eerst. Auto 1 heeft auto 2 aan zijn rechterkant, auto 3 heeft auto 1 aan zijn rechterkant.' },
    draw(s, sol) {
      s.crossroad(400, 300, HW);
      s.route('M430,430 L430,45', col('rood')); s.route('M610,270 L45,270', col('blauw')); s.route('M190,330 L755,330', col('geel'));
      vs.forEach((v) => drawVeh(s, v));
      if (sol) { s.titel('Voorrang van rechts', 'geen borden, geen lichten, geen agent'); tag(s, 650, 235, '1e: mag eerst', 'go'); tag(s, 520, 522, '2e: laat auto 2 voor', 'go'); tag(s, 150, 378, '3e: laat auto 1 voor', 'wait'); }
    },
  });
})();

// ---------------------------------------------------------------- B1 / B5 op kruispunt
(function () {
  const vs = [V(1, 'auto 1 (van onder, geen bord)', 'rood', 430, 485, 0), V(2, 'auto 2 (van rechts, voorrang verlenen)', 'blauw', 660, 270, 270), V(3, 'auto 3 (van links, stopbord)', 'geel', 140, 330, 90)];
  dual({
    naam: 'schema-b1-b5-kruispunt', title: 'Voorrang verlenen en stopbord op een kruispunt', titleOef: 'Kruispunt met voorrangsborden',
    desc: 'Kruispunt met drie auto\'s. Auto 1 komt van onder en heeft geen bord. Auto 2 komt van rechts en heeft het bord voorrang verlenen aan zijn kant. Auto 3 komt van links en heeft het stopbord aan zijn kant met een stopstreep. Alle auto\'s rijden rechtdoor.',
    descUitleg: 'Voorrangsborden gaan voor voorrang van rechts. Auto 1 rijdt op de weg zonder bord en heeft voorrang op beide andere auto\'s, ook al komt auto 2 van rechts. Auto 2 (bord voorrang verlenen) moet voorrang verlenen. Auto 3 (stopbord) moet eerst volledig stoppen en voorrang verlenen.',
    theorieblok: 'voorrang-borden-b1-b5', bronnen: ['VOOR-001', 'VOOR-002', 'VOOR-003'], oefening: true, voertuigen: vs,
    situatie: { juisteVoorrang: 1, moetWachten: [2, 3], motivatie: 'Auto 2 en auto 3 hebben het bord voorrang verlenen en het stopbord (stoppen en voorrang verlenen) aan hun kant. Auto 1 rijdt op de weg zonder bord en heeft voorrang. Het bord gaat voor voorrang van rechts.' },
    draw(s, sol) {
      s.crossroad(400, 300, HW);
      s.stopline(332, 330, 'v', 56);
      s.route('M430,440 L430,45', col('rood')); s.route('M620,270 L45,270', col('blauw')); s.route('M180,330 L755,330', col('geel'));
      s.sign('B1', 505, 205, 64); s.sign('B5', 292, 395, 64);
      vs.forEach((v) => drawVeh(s, v));
      if (sol) { s.titel('Borden gaan voor voorrang van rechts'); tag(s, 540, 528, '1e: heeft voorrang', 'go'); tag(s, 660, 218, 'voorrang verlenen', 'wait'); tag(s, 150, 450, 'stoppen,\nvoorrang verlenen', 'wait'); }
    },
  });
})();

// ---------------------------------------------------------------- T-kruispunt
(function () {
  const vs = [V(1, 'auto 1 (van de zijstraat, slaat links af)', 'rood', 430, 490, 0, { blink: 'L' }), V(2, 'auto 2 (van rechts)', 'blauw', 660, 220, 270), V(3, 'auto 3 (van links)', 'geel', 140, 280, 90)];
  const base = (b1) => ({
    title: b1 ? 'T-kruispunt met bord voorrang verlenen op de zijtak' : 'T-kruispunt zonder borden',
    voertuigen: vs,
    draw(s, sol) {
      s.crossroad(400, 250, HW, { w: 1, e: 1, s: 1 });
      s.route('M430,445 L430,310 Q430,220 345,220 L45,220', col('rood')); s.route('M620,220 L330,220', col('blauw')); s.route('M180,280 L755,280', col('geel'));
      if (b1) { s.stopline(430, 322, 'h', 56); s.sign('B1', 495, 400, 64); }
      vs.forEach((v) => drawVeh(s, v));
    },
  });
  const a = base(false), b = base(true);
  dual({
    naam: 'schema-t-kruispunt', title: a.title, voertuigen: vs, oefening: true, theorieblok: 'voorrang-t-kruispunt', bronnen: ['VOOR-001', 'VOOR-007'],
    desc: 'T-kruispunt zonder borden of lichten. Een weg loopt van links naar rechts, een zijstraat komt van onder uit op die weg. Auto 1 komt uit de zijstraat en slaat links af (richting links). Auto 2 komt van rechts en rijdt naar links. Auto 3 komt van links en rijdt naar rechts.',
    descUitleg: 'T-kruispunt zonder borden: voorrang van rechts. Auto 2 heeft niemand rechts van zich en rijdt eerst. Auto 1 heeft auto 2 aan zijn rechterkant en wacht. Auto 3 heeft auto 1 (uit de zijstraat) aan zijn rechterkant en wacht als laatste.',
    situatie: { juisteVolgorde: [2, 1, 3], motivatie: 'Er zijn geen borden of lichten, dus voorrang van rechts. Auto 2 heeft niemand rechts. Auto 1 komt uit de zijstraat en heeft auto 2 aan zijn rechterkant. Auto 3 heeft de zijstraat (auto 1) aan zijn rechterkant.' },
    draw(s, sol) { a.draw(s, sol); if (sol) { s.titel('T-kruispunt: eerst borden en lichten zoeken', 'geen borden = voorrang van rechts'); tag(s, 650, 180, '1e', 'go'); tag(s, 520, 540, '2e', 'go'); tag(s, 150, 335, '3e', 'wait'); } },
  });
  dual({
    naam: 'schema-t-kruispunt-b1', title: b.title, voertuigen: vs, oefening: true, theorieblok: 'voorrang-t-kruispunt', bronnen: ['VOOR-001', 'VOOR-007', 'VOOR-003'],
    desc: 'T-kruispunt. Auto 1 komt uit de zijstraat en slaat links af; bij de zijstraat staat het bord voorrang verlenen met een stopstreep. Auto 2 komt van rechts, auto 3 van links, beide rijden rechtdoor op de doorlopende weg.',
    descUitleg: 'Met het bord voorrang verlenen op de zijtak moet auto 1 voorrang verlenen aan al het verkeer op de doorlopende weg: zowel aan auto 2 als aan auto 3. Auto 1 rijdt als laatste.',
    situatie: { moetWachten: [1], motivatie: 'Het bord voorrang verlenen staat op de zijstraat: auto 1 verleent voorrang aan het verkeer op de doorlopende weg (auto 2 en auto 3).' },
    draw(s, sol) { b.draw(s, sol); if (sol) { s.titel('T-kruispunt met bord voorrang verlenen op de zijtak'); tag(s, 650, 180, 'heeft voorrang', 'go'); tag(s, 150, 335, 'heeft voorrang', 'go'); tag(s, 555, 480, 'wacht: voorrang verlenen', 'wait'); } },
  });
})();

// ---------------------------------------------------------------- aardeweg
(function () {
  const vs = [V(1, 'auto 1 (op de aardeweg)', 'rood', 430, 490, 0), V(2, 'auto 2 (op de verharde weg, van links)', 'blauw', 140, 280, 90)];
  dual({
    naam: 'schema-aardeweg', title: 'Aardeweg komt uit op een verharde weg',
    desc: 'T-kruispunt: een bruine aardeweg (zandweg) komt van onder uit op een grijze verharde weg. Auto 1 rijdt op de aardeweg richting de verharde weg en rijdt rechtdoor het kruispunt op. Auto 2 rijdt op de verharde weg en komt van links (vanuit de gezichtshoek van auto 1) en rijdt naar rechts. Er staan geen borden.',
    descUitleg: 'Wie uit een aardeweg of pad op een openbare weg met rijbaan komt, verleent voorrang aan alle bestuurders op die weg, ook als ze van links komen. Auto 1 wacht dus op auto 2.',
    theorieblok: 'voorrang-aardeweg-pad', bronnen: ['VOOR-001'], oefening: true, voertuigen: vs,
    situatie: { juisteVoorrang: 2, moetWachten: [1], motivatie: 'Auto 1 komt uit een aardeweg: hij verleent voorrang aan alle verkeer op de verharde weg, ook aan wie van links komt.' },
    draw(s, sol) {
      s.crossroad(400, 250, HW, { w: 1, e: 1 });
      s.rect(350, 310, 100, 300, C.earth);
      for (let i = 0; i < 30; i++) s.circle(358 + ((i * 37) % 85), 318 + ((i * 53) % 280), 3, '#9b7647');
      s.rect(350, 310, 100, 14, C.road);
      s.route('M430,445 L430,340', col('rood'));
      s.route('M180,280 L755,280', col('blauw'));
      vs.forEach((v) => drawVeh(s, v));
      s.label(520, 560, 'aardeweg', { size: 18, bg: C.earth, fg: '#fff' });
      if (sol) { s.titel('Uit een aardeweg of pad: altijd voorrang verlenen'); tag(s, 150, 335, 'heeft voorrang', 'go'); tag(s, 540, 470, 'wacht', 'wait'); }
    },
  });
})();

// ---------------------------------------------------------------- tram voorrang
(function () {
  const vs = [V(1, 'tram', null, 150, 330, 90, { type: 'tram' }), V(2, 'auto (van onder)', 'rood', 430, 480, 0)];
  dual({
    naam: 'schema-tram-voorrang', title: 'Tram heeft voorrang op de auto',
    desc: 'Kruispunt zonder borden of lichten met een tramspoor in de weg van links naar rechts. De tram (1) rijdt van links naar rechts over het kruispunt. Auto 2 komt van onder en rijdt rechtdoor naar boven.',
    descUitleg: 'Spoorvoertuigen hebben voorrang op alle andere weggebruikers, ook als ze van links komen. De auto laat de tram eerst passeren.',
    theorieblok: 'voorrang-tram-spoorvoertuigen', bronnen: ['VOOR-001', 'VOOR-002', 'VOOR-007'], oefening: true, voertuigen: vs,
    situatie: { juisteVoorrang: 1, moetWachten: [2], motivatie: 'Elke weggebruiker verleent voorrang aan spoorvoertuigen, dus ook aan een tram die van links komt (zolang er geen bevoegde persoon of werkend licht anders bepaalt).' },
    draw(s, sol) {
      s.crossroad(400, 300, HW);
      s.track(0, 330, 800, 330);
      s.route('M240,330 L755,330', '#fff', { dash: '3 9' });
      s.route('M430,430 L430,45', col('rood'));
      vs.forEach((v) => drawVeh(s, v));
      if (sol) { s.titel('Voorrang voor spoorvoertuigen'); tag(s, 150, 255, 'tram: voorrang', 'go'); tag(s, 540, 528, 'auto wacht', 'wait'); }
    },
  });
})();

// ---------------------------------------------------------------- linksaf met tegenligger
(function () {
  const vs = [V(1, 'auto 1 (slaat links af)', 'rood', 430, 480, 0, { blink: 'L' }), V(2, 'auto 2 (tegenligger, rijdt rechtdoor)', 'blauw', 370, 120, 180)];
  dual({
    naam: 'schema-linksaf-tegenligger', title: 'Linksaf slaan en een tegenligger',
    desc: 'Kruispunt zonder borden of lichten. Auto 1 komt van onder en slaat links af (linker richtingaanwijzer knippert). Auto 2 komt van boven, dus als tegenligger, en rijdt rechtdoor naar beneden.',
    descUitleg: 'Wie links afslaat, verleent voorrang aan de tegenliggers op de rijbaan die hij verlaat. Auto 2 rijdt rechtdoor en heeft voorrang; auto 1 wacht.',
    theorieblok: 'voorrang-linksaf-tegenliggers', bronnen: ['VOOR-001', 'VOOR-008', 'VOOR-009'], oefening: true, voertuigen: vs,
    situatie: { juisteVoorrang: 2, moetWachten: [1], motivatie: 'Wie links afslaat verleent voorrang aan de tegenliggers (rechtdoor of rechtsaf).' },
    draw(s, sol) {
      s.crossroad(400, 300, HW);
      s.route('M430,435 L430,350 Q430,270 345,270 L45,270', col('rood'));
      s.route('M370,165 L370,555', col('blauw'));
      vs.forEach((v) => drawVeh(s, v));
      if (sol) { s.titel('Linksaf: tegenliggers hebben voorrang'); tag(s, 490, 120, 'auto 2: voorrang', 'go'); tag(s, 540, 528, 'auto 1 wacht', 'wait'); }
    },
  });
})();

// ---------------------------------------------------------------- afslaan met voetgangers en fietser
(function () {
  const vs = [V(1, 'auto (slaat rechts af)', 'rood', 220, 280, 90, { blink: 'R' }), V(2, 'voetganger (steekt de zijstraat over)', null, 430, 395, 0, { type: 'ped' }), V(3, 'fietser op het fietspad (rijdt rechtdoor)', null, 160, 325, 90, { type: 'bike' })];
  dual({
    naam: 'schema-afslaan-voetgangers', title: 'Rechts afslaan: voetgangers en fietsers gaan voor',
    desc: 'Bovenaanzicht van een T-kruispunt met een fietspad (rood) langs de hoofdweg. Auto 1 rijdt van links naar rechts en slaat rechts af naar de zijstraat (rechter richtingaanwijzer). Een fietser (3) rijdt rechtdoor op het fietspad rechts van de auto. Een voetganger (2) steekt de zijstraat over.',
    descUitleg: 'Wie afslaat, verleent voorrang aan voetgangers die de zijstraat oversteken en aan fietsers op het fietspad dat hij kruist. De auto wacht op de fietser en de voetganger. Kijk ook over je rechterschouder: de dode hoek.',
    theorieblok: 'afslaan-voorrang-voetgangers', bronnen: ['KWET-001'], oefening: true, voertuigen: vs,
    situatie: { moetWachten: [1], voorrangVoor: [2, 3], motivatie: 'De auto die afslaat verleent voorrang aan de voetgangers die de zijstraat oversteken en aan de fietsers op het fietspad dat hij oversteekt.' },
    draw(s, sol) {
      s.crossroad(400, 250, HW, { w: 1, e: 1, s: 1 });
      s.rect(0, 310, 340, 30, C.bike); s.rect(460, 310, 340, 30, C.bike); s.rect(340, 310, 120, 30, C.bike, 'opacity=".85"');
      for (let i = 0; i < 12; i++) s.rect(345 + i * 10, 322, 5, 6, '#fff');
      s.route('M255,280 L335,280 Q372,282 372,345 L372,560', col('rood'));
      s.route('M200,325 L720,325', '#f0b429');
      s.route('M455,395 L345,395', '#fff', { dash: '4 8' });
      vs.forEach((v) => drawVeh(s, v));
      s.label(630, 372, 'fietspad', { size: 16, bg: C.bike, fg: '#fff' });
      if (sol) { s.titel('Afslaan: voetgangers en fietsers hebben voorrang'); tag(s, 130, 215, 'auto wacht', 'wait'); tag(s, 160, 380, 'fietser: voorrang', 'go'); tag(s, 620, 440, 'voetganger: voorrang', 'go'); }
    },
  });
})();

// ---------------------------------------------------------------- uitrit
(function () {
  const vs = [V(1, 'auto die de oprit verlaat', 'rood', 560, 535, 0, { blink: 'R' }), V(2, 'voetganger op het trottoir', null, 600, 468, 0, { type: 'ped' }), V(3, 'fietser op het fietspad', null, 700, 420, 270, { type: 'bike' }), V(4, 'auto op de rijbaan', 'blauw', 150, 340, 90)];
  dual({
    naam: 'schema-uitrit-parkeerplaats', title: 'Uit een oprit of parking: altijd voorrang verlenen',
    desc: 'Een auto (1) verlaat een oprit en moet over een trottoir (met voetganger 2) en een fietspad (met fietser 3) naar de rijbaan. Op de rijbaan rijdt auto 4 van links naar rechts. Alle weggebruikers rijden voorbij de oprit.',
    descUitleg: 'Wie een oprit, garage, parkeerplaats of tankstation verlaat, voert een manoeuvre uit: hij verleent voorrang aan de voetgangers op het trottoir, de fietsers op het fietspad en het verkeer op de rijbaan.',
    theorieblok: 'voorrang-manoeuvres-uitritten', bronnen: ['VOOR-001', 'VOOR-002', 'VOOR-007'], oefening: true, voertuigen: vs,
    situatie: { moetWachten: [1], voorrangVoor: [2, 3, 4], motivatie: 'Wie een eigendom verlaat voert een manoeuvre uit en verleent voorrang aan voetgangers, fietsers en het verkeer op de rijbaan.' },
    draw(s, sol) {
      s.rect(0, 250, 800, 120, C.road);
      s.line(0, 310, 800, 310, '#fff', 3, 'stroke-dasharray="16 14"');
      s.rect(0, 370, 800, 38, C.bike); s.rect(0, 408, 800, 44, C.sidewalk);
      s.rect(480, 452, 160, 148, '#9aa0a6'); s.rect(540, 440, 60, 14, '#9aa0a6');
      s.rect(30, 470, 250, 110, '#d9c8a8', 'stroke="#8a7a5a" stroke-width="3"'); s.text(155, 535, 'woning', { size: 18, fill: '#6a5a3a' });
      s.route('M560,500 L560,410 Q560,350 625,340 L755,340', col('rood'));
      s.route('M680,420 L400,420', '#f0b429');
      s.route('M650,468 L480,468', '#fff', { dash: '4 8' });
      s.route('M200,340 L450,340', col('blauw'));
      vs.forEach((v) => drawVeh(s, v));
      s.label(130, 400, 'fietspad', { size: 16, bg: C.bike, fg: '#fff' }); s.label(130, 445, 'trottoir', { size: 16, bg: '#888', fg: '#fff' });
      if (sol) { s.titel('Oprit verlaten = manoeuvre: voorrang verlenen'); tag(s, 700, 540, 'auto 1 wacht', 'wait'); tag(s, 330, 300, 'auto 4: voorrang', 'go'); }
    },
  });
})();

// ---------------------------------------------------------------- rotonde
function ring(s, withSigns) {
  const cx = 400, cy = 300;
  s.crossroad(cx, cy, 50, { n: 1, e: 1, s: 1, w: 1 }, { noLines: true });
  s.circle(cx, cy, 150, C.road);
  s.circle(cx, cy, 74, '#d8d8d0', 'stroke="#fff" stroke-width="3"');
  s.circle(cx, cy, 66, C.grass2);
  // pijltjes ring (tegen de klok in)
  for (const a of [200, 290, 20, 110]) {
    const r = 112, ph = a * Math.PI / 180;
    const px = cx + r * Math.cos(ph), py = cy + r * Math.sin(ph);
    const dx = Math.sin(ph), dy = -Math.cos(ph);
    s.arrow(px - dx * 11, py - dy * 11, px + dx * 11, py + dy * 11, 'rgba(255,255,255,.55)', 4);
  }
  if (withSigns) { s.sign('D5', cx, cy, 70, { pole: false }); }
}
(function () {
  const vs = [V(1, 'auto 1 (rijdt op de rotonde)', 'rood', 311, 362, 145), V(2, 'auto 2 (rijdt de rotonde op)', 'blauw', 430, 500, 0, { blink: 'R' })];
  dual({
    naam: 'schema-rotonde', title: 'Rotonde: wie op de rotonde rijdt, heeft voorrang', titleOef: 'Rotonde met voorrangsborden',
    desc: 'Bovenaanzicht van een rotonde met het rotonde-bord op het middeneiland en het bord voorrang verlenen aan elke toegang. Het verkeer draait tegen de wijzers van de klok rond het eiland. Auto 1 rijdt al op de rotonde en nadert de toegang van onderen. Auto 2 komt van onder de rotonde op en wil de eerste afrit rechts nemen.',
    descUitleg: 'Met het rotonde-bord en het bord voorrang verlenen aan de toegangen: wie op de rotonde rijdt, heeft voorrang op wie oprijdt. Auto 2 verleent voorrang aan auto 1. Bij het oprijden is een richtingaanwijzer niet verplicht; bij het verlaten gebruik je de rechter richtingaanwijzer.',
    theorieblok: 'voorrang-rotonde', bronnen: ['VOOR-001', 'VOOR-003', 'VOOR-004'], oefening: true, voertuigen: vs,
    situatie: { juisteVoorrang: 1, moetWachten: [2], motivatie: 'Bij een rotonde met rotonde-bord en voorrang-verlenen-borden verleent wie oprijdt voorrang aan wie al op de rotonde rijdt.' },
    draw(s, sol) {
      ring(s, true);
      s.route('M311.5,362 A108,108 0 1 0 428,196 L430,40', col('rood'));
      s.route('M430,470 L430,445 Q432,395 480,352 Q505,332 545,330 L755,330', col('blauw'));
      s.sign('B1', 505, 470, 56); s.sign('B1', 295, 130, 56); s.sign('B1', 590, 205, 56); s.sign('B1', 210, 395, 56);
      vs.forEach((v) => drawVeh(s, v));
      if (sol) { s.titel('Rotonde: wie op de rotonde rijdt, heeft voorrang'); tag(s, 190, 300, 'auto 1: voorrang', 'go'); tag(s, 640, 520, 'auto 2 wacht', 'wait'); }
    },
  });
  // verkeersplein zonder borden: gewone regels
  const vs2 = [V(1, 'auto 1 (op het plein)', 'rood', 311, 362, 145), V(2, 'auto 2 (komt van onder het plein op)', 'blauw', 430, 500, 0)];
  dual({
    naam: 'schema-verkeersplein', title: 'Rond plein zonder rotonde-bord en zonder voorrangsborden',
    desc: 'Bovenaanzicht van een rond plein (verkeersplein) zonder rotonde-bord in het midden en zonder voorrangsborden aan de toegangen. Auto 1 rijdt op het plein, auto 2 komt van onder het plein op. Er zijn geen borden of lichten.',
    descUitleg: 'Zonder rotonde-bord en zonder voorrangsborden is het geen rotonde in de zin van de wegcode maar een plein of kruispunt in de vorm van een cirkel: er geldt voorrang van rechts. Controleer bij elke toegang of er een bord staat.',
    theorieblok: 'voorrang-rotonde-zonder-borden-verkeersplein', bronnen: ['VOOR-001', 'VOOR-007'], voertuigen: vs2,
    draw(s, sol) {
      ring(s, false);
      s.route('M311.5,362 A108,108 0 0 0 428,408', col('rood'));
      s.route('M430,470 L430,445', col('blauw'));
      vs2.forEach((v) => drawVeh(s, v));
      s.titel('Plein zonder rotonde-bord en voorrangsborden', 'geen rotonde: voorrang van rechts, per toegang kijken');
    },
  });
})();

// ---------------------------------------------------------------- voorrangsweg B9 / B11
(function () {
  dual({
    naam: 'schema-voorrangsweg-b9-b11', title: 'Voorrangsweg: bord aan het begin, einde-bord aan het einde',
    desc: 'Een rechte weg van onder naar boven. Onderaan staat het bord voorrangsweg, daarna volgt een kruispunt met zijwegen waar de weg voorrang heeft. Halverwege staat het bord einde voorrangsweg. Bij het volgende kruispunt komt een auto van rechts uit de zijweg: daar geldt weer voorrang van rechts.',
    theorieblok: 'voorrang-voorrangsweg-b9-b11-b15', bronnen: ['VOOR-001', 'VOOR-002'],
    voertuigen: [V(1, 'auto op de voorrangsweg', 'rood', 450, 560, 0), V(2, 'auto uit de zijweg (onderste kruispunt)', 'blauw', 660, 420, 270), V(3, 'auto uit de zijweg (bovenste kruispunt)', 'geel', 660, 110, 270)],
    draw(s) {
      const hw = 50, x = 400;
      s.rect(x - hw, 0, hw * 2, 600, C.road);
      for (const cy of [450, 140]) { s.rect(0, cy - hw, 800, hw * 2, C.road); }
      s.line(x, 0, x, 85, '#fff', 3, 'stroke-dasharray="16 14"'); s.line(x, 195, x, 395, '#fff', 3, 'stroke-dasharray="16 14"'); s.line(x, 505, x, 600, '#fff', 3, 'stroke-dasharray="16 14"');
      for (const cy of [450, 140]) { s.line(0, cy, x - hw - 8, cy, '#fff', 3, 'stroke-dasharray="16 14"'); s.line(x + hw + 8, cy, 800, cy, '#fff', 3, 'stroke-dasharray="16 14"'); }
      s.route('M450,520 L450,25', col('rood')); s.route('M610,420 L45,420', col('blauw')); s.route('M610,110 L45,110', col('geel'));
      s.sign('B9', 505, 545, 60); s.sign('B11', 505, 280, 60);
      [V(1, '', 'rood', 450, 560, 0), V(2, '', 'blauw', 660, 420, 270), V(3, '', 'geel', 660, 110, 270)].forEach((v) => drawVeh(s, v));
      s.label(150, 490, 'Hier begint\nde voorrangsweg', { size: 17, bg: '#f2c230', fg: C.ink });
      s.label(150, 330, 'De voorrangsweg\neindigt hier', { size: 17, bg: '#fff', fg: C.ink });
      s.label(150, 215, 'Hier geldt weer\nvoorrang van rechts', { size: 17, bg: '#1f9d55', fg: '#fff' });
      s.titel('Voorrangsweg: begin en einde');
    },
  });
})();

// ---------------------------------------------------------------- middenberm
(function () {
  dual({
    naam: 'schema-middenberm', title: 'Weg met middenberm: past je auto op de berm?',
    desc: 'Twee bovenaanzichten van een weg met twee gescheiden rijbanen en een middenberm waarop een auto die de weg wil oversteken tussen de rijbanen wacht. Links: de middenberm is smal en de auto steekt er met zijn achterkant naar buiten in de rijbaan, de auto hindert het verkeer en dit mag niet. Rechts: de middenberm is breed genoeg en de auto staat er volledig op, zonder het verkeer te hinderen.',
    theorieblok: 'voorrang-middenberm-gescheiden-rijbanen', bronnen: ['VOOR-001', 'VOOR-002', 'VOOR-007'],
    draw(s) {
      s.titel('Middenberm: blijf niet staan als je auto er niet op past');
      for (const [ox, smal] of [[0, true], [400, false]]) {
        const bw = smal ? 26 : 90;
        const mx = ox + 200 - bw / 2;
        s.rect(ox + 20, 70, 160 + (200 - 180) , 520, C.road, 'opacity="0"');
        // twee rijbanen
        s.rect(ox + 30, 70, 140, 530, C.road); s.rect(ox + 230, 70, 140, 530, C.road);
        // dwarse weg onderaan
        s.rect(ox + 0, 300, 400, 140, C.road);
        // middenberm
        s.rect(mx, 70, bw, 530, C.grass2, 'stroke="#fff" stroke-width="3"');
        s.rect(mx, 300, bw, 140, C.grass2, 'stroke="#fff" stroke-width="3"');
        s.rect(mx - 1, 301, bw + 2, 138, C.grass2);
        // auto dwars op de berm
        const cxm = ox + 200;
        s.car(cxm, 370, 270, smal ? 'rood' : 'blauw', null);
        s.route(`M${ox + 360},${smal ? 410 : 410} L${ox + 40},410`, '#fff', { dash: '2 9', w: 3 });
        if (smal) {
          s.label(ox + 200, 540, 'Past niet: auto steekt\nin de rijbaan', { size: 17, bg: '#d63a3a', fg: '#fff' });
          s.label(ox + 200, 130, 'smalle berm', { size: 18, bg: '#fff' });
        } else {
          s.label(ox + 200, 540, 'Past volledig op de berm', { size: 17, bg: '#1f9d55', fg: '#fff' });
          s.label(ox + 200, 130, 'brede berm', { size: 18, bg: '#fff' });
        }
        s.car(ox + 100, 190, 180, 'geel', null); s.car(ox + 300, 200, 0, 'groen', null);
      }
      s.line(400, 70, 400, 600, '#fff', 4, 'stroke-dasharray="3 8"');
    },
  });
})();

// ---------------------------------------------------------------- voorrangsvoertuig
(function () {
  const vs = [V(1, 'ziekenwagen met blauw licht en sirene', null, 400, 500, 0, { type: 'ambulance' }), V(2, 'auto', 'rood', 485, 300, 10), V(3, 'auto', 'blauw', 488, 170, 10)];
  dual({
    naam: 'schema-voorrangsvoertuig', title: 'Voorrangsvoertuig: doorgang vrijmaken',
    desc: 'Een tweerichtingsweg met twee rijstroken in dezelfde richting. Een ziekenwagen met blauwe knipperlichten en sirene nadert van achteren over de middenlijn. De twee auto\'s voor hem sturen naar rechts en maken de doorgang vrij.',
    descUitleg: 'Zodra de sirene van een prioritair voertuig te horen is, maakt elke weggebruiker onmiddellijk de doorgang vrij en verleent voorrang, zo nodig door te stoppen. Dat geldt ook als je zelf voorrang zou hebben.',
    theorieblok: 'voorrang-reageren-op-hulpdiensten', bronnen: ['VOOR-001', 'VOOR-007'], voertuigen: vs,
    draw(s) {
      s.rect(280, 0, 240, 600, C.road); s.line(400, 0, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
      s.route('M400,440 L400,40', '#1f6fff', { dash: '3 9', w: 6 });
      s.car(485, 300, 10, 'rood', 2); s.car(488, 170, 10, 'blauw', 3);
      s.arrow(445, 305, 470, 300, '#fff', 4); s.arrow(445, 175, 470, 170, '#fff', 4);
      s.ambulance(400, 500, 0, null);
      s.titel('Sirene hoorbaar: maak de doorgang vrij');
      s.label(640, 300, 'Naar rechts sturen,\nzo nodig stoppen', { size: 20, bg: '#fff' });
    },
  });
})();

// ---------------------------------------------------------------- bus halte
(function () {
  dual({
    naam: 'schema-bus-verlaat-halte', title: 'Bus verlaat zijn halte (binnen de bebouwde kom)',
    desc: 'Een weg met een bushalte rechts. Een bus staat aan de halte met de linker richtingaanwijzer aan (hij wil vertrekken). Een auto komt van achteren aan, remt en laat de bus vertrekken.',
    descUitleg: 'Binnen de bebouwde kom laat je een bus of trolleybus in dezelfde rijrichting vertrekken uit zijn halte zodra hij zijn richtingaanwijzer links aan zet. Je vertraagt en stopt zo nodig. Buiten de bebouwde kom geldt dit niet.',
    theorieblok: 'openbaar-bushalte-vertrek', bronnen: ['OPEN-001'],
    voertuigen: [V(1, 'bus aan de halte', null, 460, 250, 0, { type: 'bus', blink: 'L' }), V(2, 'auto achter de bus', 'rood', 450, 470, 0, { brake: 1 })],
    draw(s) {
      s.rect(300, 0, 200, 600, C.road); s.line(400, 0, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
      s.rect(500, 120, 40, 300, C.sidewalk); s.rect(520, 160, 70, 70, '#9bd0e8', 'rx="6" stroke="#333" stroke-width="2"'); s.text(555, 202, 'HALTE', { size: 14, fill: '#1c2230' });
      s.ped(520, 300, null); s.ped(515, 340, null);
      s.bus(455, 250, 0, 1, { blink: 'L' });
      s.car(450, 470, 0, 'rood', 2, { brake: 1 });
      s.route('M470,195 Q470,160 410,120 L410,50', '#f0b429');
      s.titel('Bus vertrekt uit halte: laat hem voorgaan', 'binnen de bebouwde kom');
      s.label(650, 460, 'auto 2 vertraagt\nen laat de bus\nvertrekken', { size: 19, bg: '#fff' });
    },
  });
})();

// ---------------------------------------------------------------- tramhalte zonder vluchtheuvel
(function () {
  dual({
    naam: 'schema-tramhalte-zonder-vluchtheuvel', title: 'Tramhalte zonder vluchtheuvel: stoppen',
    desc: 'Een weg met tramsporen in de rijbaan. Een tram staat stil aan een halte zonder vluchtheuvel; reizigers stappen uit richting het trottoir rechts. Een auto komt van achteren aan de kant van de uitstappende reizigers en stopt achter de tram.',
    descUitleg: 'Is er geen vluchtheuvel aan de halte, dan stop je aan de kant waar reizigers in- of uitstappen. Je vertrekt pas weer met matige snelheid als iedereen veilig is.',
    theorieblok: 'openbaar-tramhalte', bronnen: ['OPEN-001'],
    voertuigen: [V(1, 'tram aan de halte', null, 440, 230, 0, { type: 'tram' }), V(2, 'auto', 'rood', 440, 470, 0)],
    draw(s) {
      s.rect(280, 0, 240, 600, C.road); s.track(440, 0, 440, 600);
      s.rect(520, 0, 50, 600, C.sidewalk);
      s.tram(440, 230, 0, 1);
      s.ped(500, 230, null); s.ped(505, 275, null); s.ped(535, 205, null);
      s.route('M500,240 L545,240', '#fff', { dash: '4 7', w: 4 });
      s.car(440, 470, 0, 'rood', 2, { brake: 1 });
      s.titel('Tramhalte zonder vluchtheuvel: stoppen');
      s.label(650, 470, 'Auto stopt: reizigers\nlopen naar het trottoir', { size: 19, bg: '#fff' });
    },
  });
})();

module.exports = {};
