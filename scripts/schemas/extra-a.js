'use strict';
// Extra illustraties (beeld-redacteur "a") voor H2 t/m H5.
// Gebruik: node scripts/schemas/extra-a.js
// Schrijft site/img/schemas/schema-*.svg en data/schemas-extra-a.json (raakt data/schemas-index.json NIET aan).
const fs = require('fs');
const path = require('path');
const { Svg, C, CAR, f, ROOT } = require('./lib');

const BG = '#eef1f6';
const INK = C.ink;
const REG = [];
const reg = (e) => { REG.push({ ...e, type: e.type || 'uitleg' }); return e; };
process.on('exit', () => {
  REG.sort((a, b) => a.naam.localeCompare(b.naam));
  fs.writeFileSync(path.join(ROOT, 'data', 'schemas-extra-a.json'), JSON.stringify(REG, null, 1) + '\n');
  console.log(REG.length + " schema's geschreven (data/schemas-extra-a.json)");
});

// ---------- hulpfuncties ----------
function box(s, x, y, w, h, fill, o = {}) {
  return s.add(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx == null ? 14 : o.rx}" fill="${fill}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 2.5}" ${o.extra || ''}/>`);
}
const GEW = { Vlaanderen: ['#f2c230', INK], 'Wallonië': ['#d63a3a', '#fff'], Brussel: ['#2f6fd6', '#fff'] };
function gewChip(s, x, y, w, h, g, num, note) {
  const [bg, fg] = GEW[g];
  box(s, x, y, w, h, bg);
  s.text(x + w / 2, y + 24, g, { size: 17, fill: fg, weight: 700 });
  s.text(x + w / 2, y + h / 2 + 18, String(num), { size: 40, fill: fg, weight: 800 });
  s.text(x + w / 2, y + h / 2 + 40, 'km/u', { size: 15, fill: fg, weight: 600 });
  if (note) s.text(x + w / 2, y + h - 8, note, { size: 13, fill: fg, weight: 600 });
}
function kmBadge(s, x, y, num, o = {}) { // afgeronde rechthoek met cijfer (geen bordlook)
  const w = o.w || 120, h = o.h || 72;
  box(s, x - w / 2, y - h / 2, w, h, o.fill || '#1c2230', { rx: 16 });
  s.text(x, y + 8, String(num), { size: o.size || 40, fill: '#fff', weight: 800 });
  s.text(x, y + h / 2 - 10, 'km/u', { size: 14, fill: '#d6dbe6', weight: 600 });
}
function pill(s, x, y, str, o = {}) { return s.label(x, y, str, { size: 17, bg: '#fff', ...o }); }
function sym(kind, x, y, r, fill) {
  if (kind === 'fiets') {
    const k = r / 20;
    return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="${fill}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="-11" cy="8" r="7"/><circle cx="11" cy="8" r="7"/><path d="M-11,8 L-3,-4 L6,-4 L11,8 M-3,-4 L0,8 L-11,8 M6,-4 L4,-9 M1,-9 L8,-9"/><circle cx="-3" cy="-13" r="3.2" fill="${fill}" stroke="none"/></g>`;
  }
  if (kind === 'voet') {
    const k = r / 20;
    return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="${fill}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="1" cy="-14" r="4.2" fill="${fill}" stroke="none"/><path d="M1,-8 L-1,4 M1,-8 L-6,-1 M1,-8 L7,-2 M-1,4 L-7,16 M-1,4 L6,10 L4,17"/></g>`;
  }
  return '';
}
// mens van voren (hoogte ca. 190*k), kleur = uniform
function person(s, x, y, k, pose, col = '#2d57a8') {
  const u = (v) => v * k;
  let g = `<g transform="translate(${x} ${y})">`;
  g += `<rect x="${-u(22)}" y="${-u(80)}" width="${u(17)}" height="${u(80)}" rx="${u(5)}" fill="#1c3b73"/><rect x="${u(5)}" y="${-u(80)}" width="${u(17)}" height="${u(80)}" rx="${u(5)}" fill="#1c3b73"/>`;
  g += `<rect x="${-u(25)}" y="${-u(8)}" width="${u(22)}" height="${u(8)}" rx="${u(3)}" fill="#111"/><rect x="${u(3)}" y="${-u(8)}" width="${u(22)}" height="${u(8)}" rx="${u(3)}" fill="#111"/>`;
  g += `<rect x="${-u(32)}" y="${-u(155)}" width="${u(64)}" height="${u(84)}" rx="${u(10)}" fill="${col}"/>`;
  g += `<rect x="${-u(32)}" y="${-u(98)}" width="${u(64)}" height="${u(7)}" fill="#e8e8e8"/>`;
  const arm = (x1, y1, x2, y2) => `<line x1="${u(x1)}" y1="${-u(y1)}" x2="${u(x2)}" y2="${-u(y2)}" stroke="${col}" stroke-width="${u(15)}" stroke-linecap="round"/><circle cx="${u(x2)}" cy="${-u(y2)}" r="${u(8)}" fill="#f1c9a5"/>`;
  if (pose === 'up') { g += arm(-30, 90, -42, 62); g += arm(30, 145, 36, 215); }
  else if (pose === 'horiz') { g += arm(-30, 145, -105, 148); g += arm(30, 145, 105, 148); }
  else if (pose === 'lamp') { g += arm(-30, 90, -42, 62); g += arm(30, 145, 92, 150); g += `<circle cx="${u(104)}" cy="${-u(150)}" r="${u(14)}" fill="#e5322d" stroke="#1c2230" stroke-width="${u(3)}"/>`; }
  else { g += arm(-30, 100, -42, 62); g += arm(30, 100, 42, 62); }
  g += `<circle cx="0" cy="${-u(172)}" r="${u(19)}" fill="#f1c9a5"/><path d="M${-u(21)},${-u(176)} a${u(21)},${u(21)} 0 0 1 ${u(42)},0 z" fill="#1c3b73"/><rect x="${-u(23)}" y="${-u(178)}" width="${u(46)}" height="${u(6)}" rx="${u(2)}" fill="#1c3b73"/>`;
  g += '</g>';
  return s.add(g);
}
// verkeerslicht (kleine kast), lampen van boven naar onder: 'rood'|'oranje'|'groen' = aan
const LCOL = { rood: '#e5322d', oranje: '#ff9d00', groen: '#1fbf5a' };
const LDIM = { rood: '#4a1d1d', oranje: '#4d3410', groen: '#143b24' };
function licht(s, x, y, aan, r = 22, pole = 30) {
  const gap = 10, w = r * 2 + 20, h = 3 * (r * 2 + gap) + gap;
  if (pole) s.add(`<rect x="${x - 5}" y="${y + h - 2}" width="10" height="${pole}" fill="#6b7280"/>`);
  s.add(`<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="14" fill="#1d2128" stroke="#000" stroke-width="3"/>`);
  ['rood', 'oranje', 'groen'].forEach((k, i) => {
    const cy = y + gap + r + i * (r * 2 + gap), on = aan === k;
    if (on) s.add(`<circle cx="${x}" cy="${cy}" r="${r + 7}" fill="${LCOL[k]}" opacity="0.28"/>`);
    s.add(`<circle cx="${x}" cy="${cy}" r="${r}" fill="#0b0d10" stroke="#2c323b" stroke-width="2"/><circle cx="${x}" cy="${cy}" r="${r * 0.8}" fill="${on ? LCOL[k] : LDIM[k]}"/>`);
  });
  return { w, h };
}
function cross(s, x, y, size = 40, col = '#d63a3a') {
  return s.add(`<g stroke="${col}" stroke-width="${size / 4}" stroke-linecap="round"><line x1="${x - size / 2}" y1="${y - size / 2}" x2="${x + size / 2}" y2="${y + size / 2}"/><line x1="${x + size / 2}" y1="${y - size / 2}" x2="${x - size / 2}" y2="${y + size / 2}"/></g>`);
}
function tick(s, x, y, size = 40, col = '#1f9d55') {
  return s.add(`<path d="M${x - size / 2},${y} L${x - size / 8},${y + size / 2.5} L${x + size / 2},${y - size / 2.5}" fill="none" stroke="${col}" stroke-width="${size / 4}" stroke-linecap="round" stroke-linejoin="round"/>`);
}
function mist(s, x, y, w, h, col = '#ffffff', op = 0.72) { // mistwolken
  s.add(`<g fill="${col}" opacity="${op}"><ellipse cx="${x + w * 0.25}" cy="${y + h * 0.4}" rx="${w * 0.28}" ry="${h * 0.3}"/><ellipse cx="${x + w * 0.55}" cy="${y + h * 0.55}" rx="${w * 0.34}" ry="${h * 0.34}"/><ellipse cx="${x + w * 0.8}" cy="${y + h * 0.35}" rx="${w * 0.22}" ry="${h * 0.28}"/></g>`);
}
// lokale scene in een afgekapte tegel: tekent met coördinaten relatief aan (x,y)
let clipN = 0;
function scene(s, x, y, w, h, fn) {
  const id = 'cl' + (++clipN);
  s.defs.push(`<clipPath id="${id}"><rect x="0" y="0" width="${w}" height="${h}" rx="10"/></clipPath>`);
  s.add(`<g transform="translate(${x} ${y})"><g clip-path="url(#${id})">`);
  fn(s);
  s.add('</g></g>');
}
function out(s, theorieblok, bronnen, extra = {}) { return reg(s.finish({ theorieblok, bronnen, ...extra })); }
const SNEL = ['SNEL-001', 'SNEL-003', 'SNEL-007'];

// =====================================================================
// H2 — wegen met en zonder middenberm
// =====================================================================
function weg(s, ox, met, oef) {
  const X = (x) => ox + x;
  s.rect(ox, 0, 600, 560, C.grass);
  s.rect(ox, 0, 600, 62, '#1c2230');
  s.text(X(300), 30, met ? 'Met middenberm' : 'Zonder middenberm', { size: 26, fill: '#fff', weight: 800 });
  s.text(X(300), 52, 'buiten de bebouwde kom, twee rijstroken per richting', { size: 15, fill: '#d6dbe6', weight: 500 });
  const dash = 'stroke-dasharray="18 14"';
  if (!met) {
    s.rect(X(74), 62, 232, 498, C.road);
    s.line(X(80), 62, X(80), 560, '#fff', 3); s.line(X(300), 62, X(300), 560, '#fff', 3);
    s.line(X(132), 62, X(132), 560, '#fff', 3, dash); s.line(X(248), 62, X(248), 560, '#fff', 3, dash);
    s.line(X(190), 62, X(190), 560, '#fff', 5);
    s.car(X(161), 200, 180, 'blauw', null); s.car(X(103), 380, 180, 'geel', null);
    s.car(X(219), 430, 0, 'rood', null); s.car(X(277), 300, 0, 'groen', null);
    s.arrow(X(103), 100, X(103), 150, '#fff', 4); s.arrow(X(161), 290, X(161), 340, '#fff', 4);
    s.arrow(X(219), 300, X(219), 250, '#fff', 4); s.arrow(X(277), 430, X(277), 380, '#fff', 4);
    // labels
    s.line(X(192), 118, X(365), 118, INK, 3); s.circle(X(190), 118, 6, INK, 'stroke="#fff" stroke-width="2"');
    s.label(X(365), 124, 'alleen een witte\nlijn tussen de\nrijrichtingen', { size: 18, anchor: 'start' });
    s.line(X(277), 360, X(365), 360, INK, 3); s.circle(X(277), 360, 6, INK, 'stroke="#fff" stroke-width="2"');
    s.label(X(365), 366, 'twee rijstroken\nper richting', { size: 18, anchor: 'start' });
    s.label(X(300), 512, 'Snelheid: de gewone\nlimiet van het gewest', { size: 20, bg: '#fff3d6', stroke: '#f08a1c' });
  } else {
    s.rect(X(40), 62, 120, 498, C.road); s.rect(X(220), 62, 120, 498, C.road);
    s.rect(X(158), 62, 64, 498, '#d9d9d3'); s.rect(X(164), 62, 52, 498, C.grass2);
    for (let y = 100; y < 560; y += 80) { s.circle(X(190), y, 13, '#4f8a3d'); s.circle(X(184), y + 6, 8, '#5e9c49'); }
    s.line(X(46), 62, X(46), 560, '#fff', 3); s.line(X(334), 62, X(334), 560, '#fff', 3);
    s.line(X(100), 62, X(100), 560, '#fff', 3, dash); s.line(X(280), 62, X(280), 560, '#fff', 3, dash);
    s.car(X(130), 200, 180, 'blauw', null); s.car(X(70), 380, 180, 'geel', null);
    s.car(X(250), 300, 0, 'rood', null); s.car(X(310), 430, 0, 'groen', null);
    s.arrow(X(70), 100, X(70), 150, '#fff', 4); s.arrow(X(130), 290, X(130), 340, '#fff', 4);
    s.arrow(X(250), 200, X(250), 150, '#fff', 4); s.arrow(X(310), 300, X(310), 250, '#fff', 4);
    s.line(X(192), 118, X(365), 118, INK, 3); s.circle(X(190), 118, 6, INK, 'stroke="#fff" stroke-width="2"');
    s.label(X(365), 124, 'middenberm:\nfysieke scheiding\ntussen de\nrijrichtingen', { size: 18, anchor: 'start' });
    s.line(X(310), 360, X(365), 360, INK, 3); s.circle(X(310), 360, 6, INK, 'stroke="#fff" stroke-width="2"');
    s.label(X(365), 366, 'twee rijstroken\nper richting', { size: 18, anchor: 'start' });
    if (!oef) s.label(X(300), 512, 'Snelheid: 120 km/u,\nin elk gewest', { size: 20, bg: '#dff3e3', stroke: '#1f9d55' });
  }
}
(function () {
  const d1 = 'Bovenaanzicht van een weg buiten de bebouwde kom met twee rijstroken per richting. De twee rijrichtingen zijn alleen gescheiden door een witte lijn op het wegdek, er is geen middenberm. Auto\'s rijden in beide richtingen. Onderaan staat: de snelheid is de gewone limiet van het gewest.';
  const d2 = 'Bovenaanzicht van een weg buiten de bebouwde kom met twee rijstroken per richting. De twee rijrichtingen zijn gescheiden door een middenberm, een brede groene strook met een stoeprand en struiken. Auto\'s rijden in beide richtingen. Onderaan staat: de snelheid is 120 km/u in elk gewest.';
  let s = new Svg('schema-weg-zonder-middenberm', 'Weg zonder middenberm: alleen een witte lijn', d1, { w: 600, h: 560 });
  weg(s, 0, false); out(s, 'snelheden-buiten-bebouwde-kom', SNEL);
  s = new Svg('schema-weg-met-middenberm', 'Weg met middenberm: fysieke scheiding', d2, { w: 600, h: 560 });
  weg(s, 0, true); out(s, 'snelheden-buiten-bebouwde-kom', SNEL, { partner: 'schema-weg-met-middenberm-oefening' });
  const d3 = 'Bovenaanzicht van een weg buiten de bebouwde kom met twee rijstroken per richting. De twee rijrichtingen zijn gescheiden door een middenberm, een brede groene strook met een stoeprand en struiken. Auto\'s rijden in beide richtingen.';
  s = new Svg('schema-weg-met-middenberm-oefening', 'Weg met middenberm (oefening)', d3, { w: 600, h: 560 });
  weg(s, 0, true, true); out(s, 'snelheden-buiten-bebouwde-kom', SNEL, { type: 'oefening', partner: 'schema-weg-met-middenberm' });
  s = new Svg('schema-weg-middenberm-vergelijk', 'Zonder of met middenberm: twee rijstroken per richting',
    'Twee bovenaanzichten naast elkaar van een weg buiten de bebouwde kom met twee rijstroken per richting. Links zonder middenberm: de rijrichtingen zijn alleen gescheiden door een witte lijn en de snelheid is de gewone limiet van het gewest. Rechts met middenberm: de rijrichtingen zijn gescheiden door een fysieke middenberm en de snelheid is 120 km/u in elk gewest.', { w: 1200, h: 560 });
  weg(s, 0, false); weg(s, 600, true); s.rect(597, 0, 6, 560, '#fff');
  out(s, 'snelheden-buiten-bebouwde-kom', SNEL);
})();

// =====================================================================
// H2 — overige illustraties
// =====================================================================
(function () { // 2.1.1 snelheid zonder bord: drie plaatsen x drie gewesten
  const s = new Svg('schema-snelheid-drie-plaatsen', 'Snelheid zonder bord: plaats en gewest',
    'Overzicht met drie rijen. Bebouwde kom: Vlaanderen 50, Wallonië 50, Brussel 30 km/u. Buiten de bebouwde kom op een gewone weg: Vlaanderen 70 (90 enkel met een bord), Wallonië 90, Brussel 70 km/u. Autosnelweg: in alle drie de gewesten 120 km/u.', { bg: BG });
  s.titel('Snelheid zonder bord: plaats én gewest');
  const rows = [
    { naam: 'Bebouwde\nkom', sign: 'F1a_horizontaal', v: [50, 50, 30] },
    { naam: 'Buiten de\nbebouwde kom', sign: 'F3a_horizontaal', v: [70, 90, 70], note: ['90 enkel met bord', '', ''] },
    { naam: 'Autosnelweg', sign: 'F5', v: [120, 120, 120] },
  ];
  rows.forEach((r, i) => {
    const y = 72 + i * 158;
    box(s, 24, y, 236, 144, '#fff');
    s.sign(r.sign, 58, y + 72, 62, { pole: false });
    s.text(98, y + (r.naam.includes('\n') ? 66 : 78), r.naam, { size: 18, anchor: 'start', weight: 800 });
    ['Vlaanderen', 'Wallonië', 'Brussel'].forEach((g, j) => gewChip(s, 276 + j * 170, y, 160, 144, g, r.v[j], r.note ? r.note[j] : ''));
  });
  s.text(400, 560, 'Een snelheidsbord gaat voor op de gewestregel.\nVoor je voertuig kan een lagere limiet gelden: de laagste telt.', { size: 17, weight: 600 });
  out(s, 'snelheden-overzicht-gewest', SNEL);
})();

(function () { // 2.2.2 bebouwde kom
  const s = new Svg('schema-bebouwde-kom-snelheid', 'In de bebouwde kom zonder bord: 50 of 30',
    'Bovenaanzicht van een straat die door een bebouwde kom loopt, met aan het begin het bord begin van de bebouwde kom en aan het einde het bord einde van de bebouwde kom. Onderaan de snelheid zonder bord in de bebouwde kom: Vlaanderen 50, Wallonië 50, Brussel 30 km/u.', { bg: C.grass });
  s.titel('Zonder bord in de bebouwde kom');
  s.rect(0, 250, 800, 100, C.road); s.line(0, 300, 800, 300, '#fff', 3, 'stroke-dasharray="16 14"');
  for (let i = 0; i < 4; i++) {
    const x = 270 + i * 72;
    s.add(`<rect x="${x}" y="150" width="58" height="72" rx="4" fill="#c9694b" stroke="#7a3b28" stroke-width="2.5"/><line x1="${x + 29}" y1="150" x2="${x + 29}" y2="222" stroke="#7a3b28" stroke-width="2"/>`);
    s.add(`<rect x="${x}" y="380" width="58" height="72" rx="4" fill="${i % 2 ? '#d8b25a' : '#c9694b'}" stroke="#7a3b28" stroke-width="2.5"/><line x1="${x + 29}" y1="380" x2="${x + 29}" y2="452" stroke="#7a3b28" stroke-width="2"/>`);
  }
  s.sign('F1a_horizontaal', 215, 392, 78); s.sign('F3a_horizontaal', 585, 392, 78);
  s.car(110, 325, 90, 'rood', null); s.car(690, 275, 270, 'blauw', null);
  s.arrow(190, 118, 610, 118, '#fff', 4); s.arrow(610, 118, 190, 118, '#fff', 4);
  s.label(400, 112, 'bebouwde kom', { size: 22, bg: '#fff' });
  s.label(215, 160, 'begin', { size: 17, bg: '#1c2230', fg: '#fff' }); s.label(585, 160, 'einde', { size: 17, bg: '#1c2230', fg: '#fff' });
  s.rect(0, 486, 800, 114, '#eef1f6');
  s.text(400, 508, 'Snelheid in de bebouwde kom, zonder bord', { size: 19, weight: 700 });
  ['Vlaanderen', 'Wallonië', 'Brussel'].forEach((g, j) => {
    const [bg, fg] = GEW[g], x = 70 + j * 230;
    box(s, x, 522, 210, 68, bg); s.text(x + 105, 543, g, { size: 16, fill: fg, weight: 700 });
    s.text(x + 105, 578, (j === 2 ? '30' : '50') + ' km/u', { size: 28, fill: fg, weight: 800 });
  });
  out(s, 'snelheden-bebouwde-kom', ['SNEL-001', 'SNEL-002', 'SNEL-004']);
})();

(function () { // 2.6.1 laagste limiet wint
  const s = new Svg('schema-laagste-limiet', 'De laagste limiet wint: weg of voertuig',
    'Twee kaarten boven elkaar naar een resultaat: de weg (voorbeeld Wallonië, gewone weg buiten de bebouwde kom, 90 km/u) en je voertuig (voorbeeld bus of autocar op een gewone weg, 75 km/u). Samen volgt daaruit dat je maximaal 75 km/u mag, de laagste van de twee.', { bg: BG });
  s.titel('De laagste limiet wint');
  box(s, 30, 74, 350, 230, '#fff');
  s.text(205, 112, 'De weg', { size: 26, weight: 800 });
  s.add(`<rect x="130" y="128" width="150" height="40" fill="${C.road}"/><line x1="130" y1="148" x2="280" y2="148" stroke="#fff" stroke-width="3" stroke-dasharray="14 10"/>`);
  kmBadge(s, 205, 218, 90, { w: 130, h: 70 });
  s.text(205, 280, 'Wallonië, gewone weg\nbuiten de bebouwde kom', { size: 15, weight: 600 });
  box(s, 420, 74, 350, 230, '#fff');
  s.text(595, 112, 'Je voertuig', { size: 26, weight: 800 });
  s.bus(595, 148, 90, null);
  kmBadge(s, 595, 218, 75, { w: 130, h: 70 });
  s.text(595, 280, 'Bus of autocar\nop gewone wegen', { size: 15, weight: 600 });
  s.arrow(205, 308, 330, 368, INK, 6); s.arrow(595, 308, 470, 368, INK, 6);
  box(s, 150, 372, 500, 150, '#1f9d55');
  s.text(400, 420, 'Jij mag maximaal', { size: 24, fill: '#fff', weight: 700 });
  s.text(400, 480, '75 km/u', { size: 54, fill: '#fff', weight: 800 });
  s.text(400, 566, 'Je volgt altijd de laagste limiet, van de weg of van je voertuig.', { size: 18, weight: 600 });
  out(s, 'snelheden-voertuigtype', ['SNEL-001', 'SNEL-002']);
})();

(function () { // 2.6.2 combinatie telt
  const s = new Svg('schema-combinatie-massa', 'Auto met aanhangwagen: de combinatie telt',
    'Twee rijen. Boven: een auto met een kleine aanhangwagen waarvan de combinatie samen tot 3,5 ton blijft: de gewone limiet van de weg. Onder: een auto met een grote aanhangwagen waarvan de combinatie samen boven 3,5 ton komt: de lagere limiet van zwaardere voertuigen, 90 km/u op de autosnelweg.', { bg: BG });
  s.titel('Auto met aanhangwagen: de combinatie telt');
  const rij = (y, trailW, trailH, kleur, kop, sub, fill) => {
    box(s, 30, y, 740, 200, '#fff');
    const cy = y + 100;
    s.rect(60, cy - 38, 340, 76, C.road, 'rx="6"');
    s.line(60, cy, 400, cy, '#fff', 3, 'stroke-dasharray="14 10"');
    const tx = 250 - trailW; // aanhangwagen links van de auto
    s.add(`<rect x="${tx}" y="${cy - trailH / 2}" width="${trailW}" height="${trailH}" rx="6" fill="${kleur}" stroke="${INK}" stroke-width="2.5"/>`);
    s.line(250, cy, 262, cy, INK, 4);
    s.car(300, cy, 90, 'blauw', null);
    s.add(`<path d="M${tx} ${cy + trailH / 2 + 14} L330 ${cy + trailH / 2 + 14}" stroke="${INK}" stroke-width="2"/><path d="M${tx} ${cy + trailH / 2 + 8} v12 M330 ${cy + trailH / 2 + 8} v12" stroke="${INK}" stroke-width="2"/>`);
    s.text((tx + 330) / 2, cy + trailH / 2 + 36, 'samen gewogen (maximaal toegelaten massa)', { size: 14, weight: 600 });
    box(s, 430, y + 20, 320, 160, fill, { stroke: INK });
    s.text(590, y + 62, kop, { size: 21, fill: '#fff', weight: 800 });
    s.text(590, y + 112, sub, { size: 19, fill: '#fff', weight: 600 });
  };
  rij(70, 80, 36, '#e8e8ec', 'Samen tot 3,5 ton', 'gewone limiet\nvan de weg', '#1f9d55');
  rij(290, 130, 52, '#e8e8ec', 'Samen boven 3,5 ton', 'lagere limiet van zwaardere\nvoertuigen: 90 km/u op\nde autosnelweg', '#c27d00');
  s.text(400, 526, 'Wat telt: de maximaal toegelaten massa van de hele combinatie.', { size: 18, weight: 700 });
  out(s, 'snelheden-voertuigtype', ['SNEL-001', 'SNEL-002']);
})();

(function () { // 2.6.3 staafdiagram voertuiglimieten
  const s = new Svg('schema-voertuig-limieten', 'Maximumsnelheid per voertuigtype',
    'Staafdiagram van maximumsnelheden: bromfiets klasse A 25 km/u, bromfiets klasse B 45 km/u, voertuig boven 7,5 ton op luchtbanden op gewone wegen 60 km/u, bus of autocar op gewone wegen 75 km/u, bus op de autosnelweg 90 km/u, autocar met gordels en snelheidsbegrenzer op de autosnelweg 100 km/u.', { bg: BG });
  s.titel('Maximumsnelheid per voertuigtype');
  const rows = [
    ['Bromfiets klasse A', 25, '#f08a1c'], ['Bromfiets klasse B', 45, '#f08a1c'],
    ['Voertuig boven 7,5 ton op\nluchtbanden, gewone weg', 60, '#6b7280'], ['Bus of autocar,\ngewone weg', 75, '#c27d00'],
    ['Bus,\nautosnelweg', 90, '#c27d00'], ['Autocar met gordels en\nbegrenzer, autosnelweg', 100, '#c27d00'],
  ];
  const x0 = 318, k = 3.3;
  rows.forEach(([naam, v, col], i) => {
    const y = 76 + i * 80;
    s.text(24, y + 30 - (naam.includes('\n') ? 8 : 0), naam, { size: 17, anchor: 'start', weight: 700 });
    s.rect(x0, y + 4, v * k, 52, col, 'rx="8" stroke="#1c2230" stroke-width="2.5"');
    s.text(x0 + v * k + 10, y + 42, v + ' km/u', { size: 22, anchor: 'start', weight: 800 });
  });
  s.line(x0, 70, x0, 556, INK, 3);
  out(s, 'snelheden-voertuigtype', ['SNEL-001', 'SNEL-002']);
})();

(function () { // 2.7.1 limiet is een maximum
  const s = new Svg('schema-limiet-is-maximum', 'De limiet is een maximum, geen streefsnelheid',
    'Een balk die de toegelaten snelheid voorstelt tot het maximum van 70 km/u. Het eerste deel, een aangepaste snelheid, is groen. Het laatste deel is rood: dat mag volgens het bord, maar is te snel bij mist of op een gladde weg. Onder de balk een auto op een mistige weg.', { bg: BG });
  s.titel('De limiet is een maximum');
  box(s, 30, 74, 740, 230, '#fff');
  s.rect(60, 176, 450, 54, '#2ea36b', 'rx="10" stroke="#1c2230" stroke-width="2.5"');
  s.rect(510, 176, 200, 54, '#f3b3ab', 'rx="10" stroke="#1c2230" stroke-width="2.5"');
  s.text(285, 211, 'aangepaste snelheid', { size: 22, fill: '#fff', weight: 800 });
  s.text(610, 211, 'te snel', { size: 22, fill: '#8a1f14', weight: 800 });
  s.line(710, 156, 710, 250, INK, 5);
  kmBadge(s, 710, 122, 70, { w: 96, h: 66, size: 30 });
  s.text(710, 276, 'limiet', { size: 17, weight: 700 });
  s.text(60, 276, 'langzaam', { size: 16, anchor: 'start', weight: 600 });
  s.text(60, 120, 'Mag je 70, maar is het mistig of glad?', { size: 21, anchor: 'start', weight: 800 });
  s.text(60, 146, 'Dan kan 70 te snel zijn.', { size: 18, anchor: 'start', weight: 600 });
  // weg in de mist
  s.rect(30, 326, 740, 196, C.grass, 'rx="14"');
  s.rect(30, 380, 740, 90, C.road); s.line(30, 425, 770, 425, '#fff', 3, 'stroke-dasharray="16 14"');
  s.car(250, 450, 90, 'rood', null);
  mist(s, 330, 342, 420, 170, '#ffffff', 0.55); mist(s, 120, 390, 320, 120, '#ffffff', 0.5);
  s.label(400, 552, 'Mist of een gladde weg: rij trager dan de limiet.', { size: 20, bg: '#fff' });
  out(s, 'snelheden-aangepast', ['SNEL-001', 'SNEL-003']);
})();

(function () { // 2.7.2 waar moet je rekening mee houden
  const s = new Svg('schema-snelheid-aanpassen', 'Waar je je snelheid aan aanpast',
    'Een auto in het midden met vijf kaartjes errond: andere weggebruikers (vooral de kwetsbaarste), weer, zicht en verkeersdichtheid, de plaats en de staat van de weg, de staat en de lading van je voertuig, en een voldoende veiligheidsafstand tot je voorligger.', { bg: BG });
  s.titel('Pas je snelheid aan');
  const cx = 400, cy = 318;
  const items = [
    [400, 118, 'Andere weggebruikers,\nvooral de kwetsbaarste', '#2d57a8'],
    [666, 232, 'Weer, zicht en\nverkeersdichtheid', '#1f9d55'],
    [586, 482, 'Plaats en staat\nvan de weg', '#c27d00'],
    [214, 482, 'Staat en lading\nvan je voertuig', '#8e5bd1'],
    [134, 232, 'Voldoende afstand\ntot je voorligger', '#d63a3a'],
  ];
  items.forEach(([x, y]) => s.line(cx, cy, x, y, '#9aa3ad', 4));
  s.circle(cx, cy, 78, '#fff', 'stroke="#1c2230" stroke-width="3"');
  s.car(cx, cy, 0, 'rood', null);
  items.forEach(([x, y, t, col]) => {
    box(s, x - 112, y - 36, 224, 72, col);
    s.text(x, y - 5, t, { size: 17, fill: '#fff', weight: 700 });
  });
  s.text(400, 576, 'Een goede bestuurder past zijn snelheid steeds aan.', { size: 18, weight: 600 });
  out(s, 'snelheden-aangepast', ['SNEL-001', 'SNEL-003']);
})();

(function () { // 2.7.3 stappenplan snelheid
  const s = new Svg('schema-snelheid-stappen', 'Zo kom je tot de juiste snelheid',
    'Vier stappen onder elkaar met pijlen ertussen: 1 zoek een snelheidsbord, 2 kijk naar de plaats en het gewest, 3 kijk naar je voertuig, 4 pas je snelheid aan de omstandigheden aan.', { bg: BG });
  s.titel('Zo kom je tot de juiste snelheid');
  const st = [
    ['Zoek een snelheidsbord', 'Een bord gaat voor op de gewestregel.\nVoor je voertuig kan een lagere limiet gelden: de laagste telt.', '#c0261c'],
    ['Kijk naar plaats en gewest', 'Bebouwde kom of niet; Vlaanderen, Wallonië of Brussel.', '#1d5fa8'],
    ['Kijk naar je voertuig', 'Een bus, zwaar voertuig of bromfiets heeft een eigen limiet.', '#a85f00'],
    ['Pas je snelheid aan', 'Weer, zicht, drukte en wegdek bepalen hoe snel je echt rijdt.', '#1f7a46'],
  ];
  st.forEach(([t, sub, col], i) => {
    const y = 72 + i * 126;
    box(s, 40, y, 720, 96, col);
    s.badge(92, y + 48, i + 1, { r: 24 });
    s.text(140, y + (sub.includes('\n') ? 34 : 42), t, { size: 26, fill: '#fff', weight: 800, anchor: 'start' });
    s.text(140, y + (sub.includes('\n') ? 60 : 72), sub, { size: sub.includes('\n') ? 15 : 16, fill: '#fff', weight: 500, anchor: 'start' });
    if (i < 3) s.arrow(400, y + 98, 400, y + 124, INK, 6);
    box(s, 650, y + 12, 96, 72, '#fff', { rx: 10 });
    if (i === 0) s.sign('C43_70', 698, y + 48, 62, { pole: false });
    if (i === 1) s.sign('F1a_horizontaal', 698, y + 48, 62, { pole: false });
    if (i === 2) s.car(698, y + 48, 90, 'blauw', null);
    if (i === 3) { mist(s, 654, y + 14, 88, 40, '#9aa3ad', 1); s.add(`<g stroke="#2f6fd6" stroke-width="4" stroke-linecap="round"><line x1="680" y1="${y + 58}" x2="674" y2="${y + 70}"/><line x1="700" y1="${y + 58}" x2="694" y2="${y + 70}"/><line x1="720" y1="${y + 58}" x2="714" y2="${y + 70}"/></g>`); }
  });
  out(s, 'snelheden-overzicht-gewest', SNEL);
})();

// =====================================================================
// H3 — voorrang en kruispunten
// =====================================================================
const VOOR = ['VOOR-001', 'VOOR-002'];
(function () { // 3.1.1
  const s = new Svg('schema-voorrang-verlenen', 'Voorrang verlenen: de ander laat je doorrijden',
    'Een kruispunt zonder borden of lichten. Een blauwe auto komt van rechts en rijdt door. De rode auto uit de onderste weg verleent voorrang: hij wacht tot de blauwe auto voorbij is.', {});
  s.titel('Voorrang verlenen', 'kruispunt zonder borden of lichten');
  s.crossroad(400, 340, 60);
  s.car(620, 310, 270, 'blauw', null); s.route('M575,310 L225,310', CAR.blauw);
  s.car(430, 500, 0, 'rood', null, { brake: true });
  s.label(620, 262, 'van rechts: rijdt door', { size: 18, bg: '#1f9d55', fg: '#fff' });
  s.label(650, 520, 'jij: voorrang verlenen,\nrij pas verder\nals het veilig is', { size: 17, bg: '#d63a3a', fg: '#fff' });
  out(s, 'voorrang-van-rechts', VOOR);
})();

(function () { // 3.2.3
  const s = new Svg('schema-voorrang-houden', 'Wie voorrang heeft en even stopt, behoudt zijn voorrang',
    'Een kruispunt zonder borden of lichten. De blauwe auto komt van rechts en heeft voorrang, maar staat even stil voor het kruispunt (remlichten). De rode auto uit de onderste weg wacht: de blauwe auto behoudt zijn voorrang.', {});
  s.titel('Even stoppen kost je geen voorrang', 'de blauwe auto komt van rechts');
  s.crossroad(400, 340, 60);
  s.car(520, 310, 270, 'blauw', null, { brake: true });
  s.car(430, 500, 0, 'rood', null);
  s.label(600, 262, 'stopt even,\nmaar houdt voorrang', { size: 17, bg: '#1f9d55', fg: '#fff' });
  s.label(650, 520, 'wacht: de blauwe auto\nbehoudt zijn voorrang', { size: 17, bg: '#d63a3a', fg: '#fff' });
  out(s, 'voorrang-van-rechts', VOOR);
})();

(function () { // 3.1.3
  const s = new Svg('schema-drie-vragen', 'Bij elk kruispunt dezelfde drie vragen',
    'Drie vragen onder elkaar met het antwoord ernaast. 1: is er een bevoegde persoon of een werkend verkeerslicht? Dan volg je die. 2: staan er borden? Dan volg je de borden. 3: is er niets van dat alles? Dan geldt voorrang van rechts.', { bg: BG });
  s.titel('Bij elk kruispunt dezelfde drie vragen');
  const rows = [
    ['Is er een bevoegde persoon\nof een werkend verkeerslicht?', 'Dan volg\nje die.', '#2d57a8'],
    ['Staan er borden?', 'Dan volg je\nde borden.', '#c27d00'],
    ['Is er niets van dat alles?', 'Dan geldt voorrang\nvan rechts.', '#6b7280'],
  ];
  rows.forEach(([q, a, col], i) => {
    const y = 76 + i * 150;
    box(s, 30, y, 470, 126, '#fff');
    s.badge(62, y + 63, i + 1, { r: 20 });
    s.text(90, y + (q.includes('\n') ? 56 : 70), q, { size: 19, anchor: 'start', weight: 800 });
    s.arrow(504, y + 63, 540, y + 63, INK, 6);
    box(s, 544, y, 226, 126, col);
    s.text(657, y + 58, a, { size: 20, fill: '#fff', weight: 800 });
    if (i === 0) { licht(s, 424, y + 10, 'groen', 11, 0); person(s, 472, y + 116, 0.46, 'up'); }
    if (i === 1) s.sign('B1', 440, y + 63, 80, { pole: false });
    if (i === 2) { s.rect(402, y + 54, 76, 18, '#2b2f36', 'rx="4"'); s.rect(431, y + 25, 18, 76, '#2b2f36', 'rx="4"'); s.arrow(472, y + 108, 472, y + 80, '#d63a3a', 4); }
  });
  s.text(400, 562, 'Altijd in deze volgorde: eerst personen en lichten, dan borden, dan voorrang van rechts.', { size: 16, weight: 600 });
  out(s, 'voorrang-t-kruispunt', ['VOOR-001', 'VOOR-002', 'LICH-001']);
})();

(function () { // 3.2.2
  const s = new Svg('schema-geen-voorrang-rechts', 'Wanneer geldt voorrang van rechts niet?',
    'Vier kaartjes. Een bord of een werkend licht gaat voor. Een bevoegde persoon gaat voor. Wie al op een rotonde rijdt, verleent geen voorrang meer aan rechts. Wie van rechts uit een verboden rijrichting komt, heeft geen voorrang.', { bg: BG });
  s.titel('Wanneer geldt voorrang van rechts niet?');
  const tegels = [
    ['Een bord of een werkend\nlicht gaat voor', (x, y) => { s.sign('B1', x + 112, y + 74, 80, { pole: false }); licht(s, x + 252, y + 20, 'groen', 12, 0); }],
    ['Een bevoegde persoon\ngaat voor', (x, y) => { person(s, x + 182, y + 140, 0.6, 'up'); }],
    ['Wie al op een rotonde rijdt,\nverleent geen voorrang aan rechts', (x, y) => { s.sign('D5', x + 182, y + 74, 92, { pole: false }); }],
    ['Wie van rechts uit een verboden\nrijrichting komt, heeft geen voorrang', (x, y) => { s.sign('C1', x + 110, y + 74, 84, { pole: false }); s.car(x + 255, y + 74, 270, 'blauw', null); }],
  ];
  tegels.forEach(([t, fn], i) => {
    const x = 24 + (i % 2) * 380, y = 72 + Math.floor(i / 2) * 226;
    box(s, x, y, 372, 212, '#fff');
    fn(x, y);
    s.text(x + 186, y + 168, t, { size: 17, weight: 700 });
  });
  s.text(400, 562, 'Voorrang van rechts geldt enkel op een kruispunt.', { size: 17, weight: 600 });
  out(s, 'voorrang-van-rechts', VOOR);
})();

(function () { // 3.4.1 manoeuvres
  const s = new Svg('schema-manoeuvres', 'Manoeuvres: jij geeft voorrang',
    'Vier kleine bovenaanzichten: van rijstrook veranderen (de rode auto voegt in voor de blauwe), keren (de rode auto draait terwijl een blauwe auto nadert), een parkeerplaats verlaten (de groene auto rijdt weg terwijl een blauwe auto nadert) en uit een oprit komen (de gele auto rijdt de weg op terwijl een blauwe auto nadert). Bij een manoeuvre geef je voorrang aan de andere weggebruikers.', { bg: BG });
  s.titel('Manoeuvres: jij geeft voorrang');
  const W = 370, H = 236, HD = 34;
  const tegel = (x, y, kop, fn) => {
    box(s, x, y, W, H, '#1c2230');
    s.text(x + W / 2, y + 24, kop, { size: 19, fill: '#fff', weight: 700 });
    scene(s, x, y + HD, W, H - HD, fn);
  };
  const weg2 = (x0, x1, mid) => { s.rect(0, 0, 370, 210, C.grass); s.rect(x0, 0, x1 - x0, 210, C.road); s.line(mid, 0, mid, 210, '#fff', 3, 'stroke-dasharray="16 12"'); };
  tegel(14, 72, 'Van rijstrook veranderen', () => {
    weg2(85, 285, 185);
    s.car(235, 165, 0, 'blauw', null); s.car(135, 140, 0, 'rood', null);
    s.route('M135,100 Q135,50 232,38', CAR.rood, { w: 4 });
  });
  tegel(386, 72, 'Keren', () => {
    weg2(85, 285, 185);
    s.car(235, 168, 0, 'rood', null); s.car(135, 30, 180, 'blauw', null);
    s.route('M235,132 L235,98 Q235,64 185,64 Q135,64 135,98 L135,128', CAR.rood, { w: 4 });
  });
  tegel(14, 322, 'Een parkeerplaats verlaten', () => {
    weg2(50, 210, 130);
    s.rect(210, 0, 90, 210, '#8b9099'); s.line(210, 0, 210, 210, '#fff', 3);
    s.car(255, 30, 0, 'geel', null); s.car(255, 175, 0, 'wit', null); s.car(255, 108, 0, 'groen', null);
    s.car(170, 170, 0, 'blauw', null);
    s.route('M255,74 Q248,52 195,40 L175,12', CAR.groen, { w: 4 });
  });
  tegel(386, 322, 'Uit een oprit komen', () => {
    weg2(50, 210, 130);
    s.rect(210, 70, 160, 58, '#8b9099');
    s.car(300, 99, 270, 'geel', null); s.car(170, 175, 0, 'blauw', null);
    s.route('M262,99 L205,99 Q170,99 170,66 L170,14', CAR.geel, { w: 4 });
  });
  out(s, 'voorrang-manoeuvres-uitritten', VOOR);
})();

// rotonde: ring + armen
function rotonde(s, cx, cy, ringR, ringW) {
  s.rect(cx - 40, 48, 80, 552, C.road); s.rect(0, cy - 40, 800, 80, C.road);
  s.line(cx, 48, cx, cy - ringR - ringW / 2, '#fff', 3, 'stroke-dasharray="14 12"'); s.line(cx, cy + ringR + ringW / 2, cx, 600, '#fff', 3, 'stroke-dasharray="14 12"');
  s.line(0, cy, cx - ringR - ringW / 2, cy, '#fff', 3, 'stroke-dasharray="14 12"'); s.line(cx + ringR + ringW / 2, cy, 800, cy, '#fff', 3, 'stroke-dasharray="14 12"');
  s.circle(cx, cy, ringR, 'none', `stroke="${C.road}" stroke-width="${ringW}"`);
  s.circle(cx, cy, ringR, 'none', 'stroke="#fff" stroke-width="2.5" stroke-dasharray="12 10"');
  s.circle(cx, cy - 0, ringR - ringW / 2, C.grass2, 'stroke="#d9d9d3" stroke-width="5"');
}
(function () { // 3.5.3
  const s = new Svg('schema-rotonde-aanwijzen', 'Op de rotonde: oprijden en verlaten',
    'Bovenaanzicht van een rotonde met vier armen. Een rode auto rijdt de rotonde op zonder richtingaanwijzer. Een blauwe auto verlaat de rotonde met de rechter richtingaanwijzer aan.', {});
  s.titel('Op de rotonde aanwijzen', 'bovenaanzicht');
  const cx = 400, cy = 340;
  rotonde(s, cx, cy, 112, 76);
  s.car(cx + 20, 520, 0, 'rood', null);
  s.car(cx + 150, cy + 20, 90, 'blauw', null, { blink: 'R' });
  s.label(215, 520, 'Oprijden: je hoeft geen\nrichtingaanwijzer te gebruiken', { size: 16, bg: '#fff' });
  s.line(600, 440, cx + 168, cy + 34, INK, 2);
  s.label(655, 470, 'Verlaten: je gebruikt\nde rechter richtingaanwijzer', { size: 16, bg: '#ff9d00', fg: INK });
  out(s, 'voorrang-rotonde', VOOR);
})();

(function () { // 3.5.4
  const s = new Svg('schema-rotonde-fietsers', 'Verlaat je de rotonde, geef dan voorrang aan fietsers',
    'Bovenaanzicht van een rotonde met een fietspad errond. Een blauwe auto wil de rotonde verlaten en wacht voor het fietspad. Een fietser komt over het fietspad. De bestuurder geeft bij het verlaten voorrang aan voetgangers en fietsers.', {});
  s.titel('Rotonde met fietspad errond', 'bovenaanzicht');
  const cx = 400, cy = 340;
  rotonde(s, cx, cy, 92, 66);
  s.circle(cx, cy, 160, 'none', `stroke="${C.bike}" stroke-width="26"`);
  s.circle(cx, cy, 160, 'none', 'stroke="#f3d3cd" stroke-width="2" stroke-dasharray="10 12"');
  s.car(cx + 118, cy + 20, 90, 'blauw', null, { blink: 'R' });
  s.add(`<g transform="translate(${cx + 160} ${cy - 64}) scale(1.7)">`); s.bike(0, 0, 180, null); s.add('</g>');
  s.arrow(cx + 160, cy - 25, cx + 160, cy + 95, '#fff', 4);
  s.label(660, 500, 'Auto die de rotonde verlaat:\nvoorrang aan voetgangers\nen fietsers', { size: 16, bg: '#fff' });
  s.label(150, 150, 'fietspad rond\nde rotonde', { size: 16, bg: '#fff' });
  s.line(205, 160, cx - 114, cy - 112, INK, 2);
  out(s, 'voorrang-rotonde-fietsers', ['VOOR-001', 'VOOR-002', 'KWET-001']);
})();

(function () { // 3.6.2
  const s = new Svg('schema-links-afslaan', 'Zo sla je links af',
    'Een kruispunt. Een rode auto uit de onderste weg slaat links af met de linker richtingaanwijzer aan en neemt een ruime bocht. Op de linkertak steekt een voetganger over: voetgangers gaan ook voor.', {});
  s.titel('Links afslaan', 'tijdig aankondigen, matige snelheid, ruime bocht');
  s.crossroad(400, 340, 60);
  s.car(430, 490, 0, 'rood', null, { blink: 'L' });
  s.route('M430,445 L430,395 Q430,312 345,312 L225,312', CAR.rood);
  s.ped(285, 372, null); s.arrow(285, 366, 285, 330, '#fff', 3);
  s.label(610, 460, 'Kondig tijdig aan met\nde linker richtingaanwijzer', { size: 16, bg: '#fff' });
  s.label(610, 548, 'Matige snelheid en\neen zo ruim mogelijke bocht', { size: 16, bg: '#fff' });
  s.label(155, 460, 'voetgangers\ngaan ook voor', { size: 16, bg: '#fff' });
  s.line(180, 440, 280, 380, INK, 2);
  out(s, 'voorrang-linksaf-tegenliggers', VOOR);
})();

(function () { // 3.7.1
  const s = new Svg('schema-voorrangsvoertuig-kenmerken', 'Zo herken je een voorrangsvoertuig',
    'Een ziekenwagen van boven gezien met blauwe knipperlichten en geluidsgolven van de sirene. Een voorrangsvoertuig op dringende opdracht heeft blauwe knipperlichten en een sirene; jij verleent voorrang.', { bg: BG });
  s.titel('Zo herken je een voorrangsvoertuig');
  s.add('<g transform="translate(230 330) scale(3.3)">'); s.ambulance(0, 0, 0, null); s.add('</g>');
  { const arcs = [60, 85, 110].map((r) => { const a1 = -75 * Math.PI / 180, a2 = -15 * Math.PI / 180; return `<path d="M${f(262 + r * Math.cos(a1))} ${f(303 + r * Math.sin(a1))} A${r} ${r} 0 0 1 ${f(262 + r * Math.cos(a2))} ${f(303 + r * Math.sin(a2))}"/>`; }).join(''); s.add(`<g fill="none" stroke="#1f6fff" stroke-width="5" stroke-linecap="round" opacity="0.85">${arcs}</g>`); }
  s.line(262, 303, 520, 150, INK, 3); s.circle(262, 303, 6, INK, 'stroke="#fff" stroke-width="2"');
  s.label(520, 150, 'blauwe\nknipperlichten', { size: 20, anchor: 'start', bg: '#fff', stroke: '#1f6fff' });
  s.label(520, 270, 'sirene', { size: 20, anchor: 'start', bg: '#fff', stroke: '#1f6fff' });
  s.line(372, 236, 518, 270, INK, 3); s.circle(372, 236, 5, INK);
  box(s, 440, 360, 330, 170, '#1f9d55');
  s.text(605, 410, 'Dringende opdracht?', { size: 22, fill: '#fff', weight: 800 });
  s.text(605, 450, 'Dan verleen jij voorrang.', { size: 20, fill: '#fff', weight: 700 });
  s.text(605, 496, 'bv. politie, brandweer,\nziekenwagen', { size: 16, fill: '#fff', weight: 500 });
  out(s, 'voorrang-voorrangsvoertuigen', VOOR);
})();

(function () { // 3.7.3
  const s = new Svg('schema-blauw-oranje-licht', 'Blauw of oranje knipperlicht?',
    'Twee kaarten naast elkaar. Links een ziekenwagen met blauwe knipperlichten en sirene: dringende opdracht, doorgang vrijmaken en voorrang verlenen. Rechts een vrachtwagen (bijvoorbeeld een takelwagen) met oranjegele knipperlichten: een waarschuwing, geen voorrang, rij voorzichtig.', { bg: BG });
  s.titel('Blauw of oranje knipperlicht?');
  box(s, 24, 72, 372, 440, '#dbe8ff'); box(s, 404, 72, 372, 440, '#ffe8c7');
  s.add('<g transform="translate(210 262) scale(2.3)">'); s.ambulance(0, 0, 0, null); s.add('</g>');
  s.add('<g transform="translate(590 262) scale(1.9)">'); s.truck(0, 0, 0, null, { cab: '#f0b429' });
  s.add('<g stroke="#ff9d00" stroke-width="3" stroke-linecap="round"><circle cx="-10" cy="-63" r="5" fill="#ff9d00" stroke="#fff"/><circle cx="10" cy="-63" r="5" fill="#ff9d00" stroke="#fff"/><line x1="-20" y1="-68" x2="-31" y2="-76"/><line x1="-23" y1="-60" x2="-36" y2="-60"/><line x1="20" y1="-68" x2="31" y2="-76"/><line x1="23" y1="-60" x2="36" y2="-60"/></g></g>');
  s.text(210, 422, 'Blauw licht en sirene', { size: 20, weight: 800 });
  s.text(210, 452, 'Dringende opdracht:\ndoorgang vrijmaken, voorrang\nverlenen, zo nodig stoppen.', { size: 15, weight: 600 });
  s.text(590, 422, 'Oranjegele knipperlichten', { size: 20, weight: 800 });
  s.text(590, 452, 'Een waarschuwing, geen\nvoorrang. Rij voorzichtig.\nBijvoorbeeld bij een takelwagen.', { size: 15, weight: 600 });
  s.text(400, 556, 'Blauw met sirene: voorrang geven. Oranje: opletten, geen voorrang.', { size: 18, weight: 700 });
  out(s, 'voorrang-bijzondere-voertuigen', VOOR);
})();

// =====================================================================
// H4 — verkeerslichten en bevoegde personen
// =====================================================================
(function () { // 4.1.2
  const s = new Svg('schema-oranje-doorrijden', 'Oranje: in de regel stoppen',
    'Een rijbaan met een stopstreep en een verkeerslicht dat oranje is. Een blauwe auto is nog ver van de streep en kan veilig stoppen: hij stopt. Een rode auto is vlak bij de streep en kan niet meer veilig stoppen: hij rijdt door. Gas geven om oranje te halen is fout.', {});
  s.titel('Oranje: in de regel stoppen', 'rij je door oranje, dan omdat stoppen niet meer veilig kan');
  s.rect(320, 66, 160, 534, C.road); s.line(400, 66, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
  s.rect(320, 300, 160, 8, '#fff');
  licht(s, 560, 190, 'oranje', 22, 60);
  s.car(360, 510, 0, 'blauw', null, { brake: true }); s.car(440, 356, 0, 'rood', null);
  s.arrow(440, 318, 440, 250, '#1f9d55', 6);
  s.label(160, 510, 'kan nog veilig\nstoppen: stop', { size: 18, bg: '#d63a3a', fg: '#fff' });
  s.label(160, 360, 'vlak bij de streep en\nniet meer veilig te\nstoppen: rij door', { size: 18, bg: '#1f9d55', fg: '#fff' });
  s.label(645, 520, 'Gas geven om oranje\nte halen is fout', { size: 17, bg: '#fff', stroke: '#d63a3a' });
  out(s, 'lichten-oranje-doorrijden', ['LICH-001']);
})();

(function () { // 4.4.1
  const s = new Svg('schema-bevoegde-personen-wie', 'Wie is een bevoegde persoon?',
    'Vier kaartjes met een persoon in uniform: de federale en lokale politie, personeel van de wegbeheerders dat toezicht houdt op de weg, douanepersoneel tijdens hun dienst, en personeel dat bruggen bewaakt of bedient, voor het verkeer op en vlak bij die brug. Ook de brandweer is bevoegd bij een interventie, maar alleen voor bevelen en als de politie er niet is.', { bg: BG });
  s.titel('Wie is een bevoegde persoon?');
  const t = [
    ['Politie', 'federale en lokale politie', '#2d57a8'],
    ['Wegbeheerder', 'personeel dat toezicht\nhoudt op de weg', '#f08a1c'],
    ['Douane', 'douanepersoneel\ntijdens hun dienst', '#2e7d4f'],
    ['Brugbediening', 'personeel dat een brug\nbewaakt of bedient,\nop en vlak bij de brug', '#6b7280'],
  ];
  t.forEach(([naam, sub, col], i) => {
    const x = 24 + (i % 2) * 380, y = 72 + Math.floor(i / 2) * 226;
    box(s, x, y, 372, 212, '#fff');
    person(s, x + 76, y + 196, 0.82, 'down', col);
    s.text(x + 150, y + 90, naam, { size: 24, anchor: 'start', weight: 800 });
    s.text(x + 150, y + 124, sub, { size: 17, anchor: 'start', weight: 600 });
  });
  s.text(400, 556, 'Ook de brandweer is bevoegd bij een interventie,\nmaar alleen voor bevelen en als de politie er niet is.', { size: 17, weight: 600 });
  out(s, 'bevoegde-personen-wie', ['LICH-001']);
})();

(function () { // 4.4.4
  const s = new Svg('schema-bevoegde-seinen-overzicht', 'Wat de seinen van een bevoegde persoon betekenen',
    'Drie kaartjes met een bevoegde persoon. Arm rechtop: alle weggebruikers stoppen. Arm of armen horizontaal: stoppen als je uit een richting komt die de arm of armen dwarst. Een rood licht heen en weer zwaaien: stoppen als het licht naar jou gericht is.', { bg: BG });
  s.titel('De seinen van een bevoegde persoon');
  const t = [
    ['Arm rechtop', 'Alle weggebruikers\nstoppen.', 'up'],
    ['Arm of armen\nhorizontaal', 'Stoppen als je uit een\nrichting komt die de\narmen dwarst.', 'horiz'],
    ['Rood licht heen\nen weer zwaaien', 'Stoppen als het licht\nnaar jou gericht is.', 'lamp'],
  ];
  t.forEach(([naam, sub, pose], i) => {
    const x = 24 + i * 254, y = 72;
    box(s, x, y, 240, 478, '#fff');
    person(s, x + (pose === 'lamp' ? 100 : 120), y + 290, 0.95, pose);
    if (pose === 'lamp') s.add(`<g fill="none" stroke="#e5322d" stroke-width="4" stroke-linecap="round"><path d="M${x + 205} ${y + 128} q12 14 0 28"/><path d="M${x + 218} ${y + 120} q16 22 0 44"/></g>`);
    s.text(x + 120, y + 348, naam, { size: 21, weight: 800 });
    s.text(x + 120, y + (naam.includes('\n') ? 418 : 388), sub, { size: 18, weight: 600 });
  });
  out(s, 'bevoegde-personen-seinen', ['LICH-001']);
})();

(function () { // 4.5.2
  const s = new Svg('schema-lichten-werken-borden', 'Werkende lichten gaan voor op voorrangsborden',
    'Twee kaarten naast elkaar. Links werken de verkeerslichten (groen licht): het voorrangsbord is doorgekruist en speelt daar geen rol. Rechts zijn de lichten uitgevallen (alle lampen uit): het voorrangsbord en de regels gelden weer.', { bg: BG });
  s.titel('Werkende lichten en voorrangsborden');
  const paneel = (x, kleur, kop, werkt, tekst) => {
    box(s, x, 72, 372, 428, kleur);
    s.text(x + 186, 112, kop, { size: 24, weight: 800 });
    licht(s, x + 100, 140, werkt ? 'groen' : null, 24, 40);
    if (werkt) {
      s.add('<g opacity="0.3">'); s.sign('B1', x + 270, 230, 100, { pole: false }); s.add('</g>');
      cross(s, x + 270, 230, 64);
    } else s.sign('B1', x + 270, 230, 100, { pole: false });
    s.text(x + 186, 420, tekst, { size: 20, weight: 700 });
  };
  paneel(24, '#dff3e3', 'De lichten werken', true, 'De voorrangsborden spelen\ndaar geen rol.');
  paneel(404, '#e3e6ec', 'De lichten vallen uit', false, 'De borden en regels\ngelden weer.');
  s.text(400, 540, 'Bij knipperend oranje en bij lichten boven de rijstroken blijven de borden wel gelden.', { size: 16, weight: 600 });
  out(s, 'lichten-rangorde', ['LICH-001']);
})();

function tijdlijn(naam, title, desc, theorieblok) {
  const s = new Svg(naam, title, desc, { bg: BG });
  s.titel('Van nu naar 1 juni 2027');
  s.rect(60, 320, 680, 10, '#9aa3ad', 'rx="5"'); s.rect(60, 320, 350, 10, '#1f9d55', 'rx="5"');
  box(s, 40, 100, 350, 170, '#1f9d55');
  s.text(215, 150, 'Nu', { size: 34, fill: '#fff', weight: 800 });
  s.text(215, 196, 'Het huidige verkeersreglement\ngeldt.', { size: 20, fill: '#fff', weight: 600 });
  box(s, 430, 100, 330, 170, '#2d57a8');
  s.text(595, 146, 'Vanaf 1 juni 2027', { size: 28, fill: '#fff', weight: 800 });
  s.text(595, 190, 'Een federale code en een\nVlaamse, Brusselse en\nWaalse code', { size: 19, fill: '#fff', weight: 600 });
  s.circle(410, 325, 22, '#fff', `stroke="${INK}" stroke-width="4"`); s.circle(410, 325, 9, '#2d57a8');
  s.arrow(215, 272, 215, 312, INK, 5); s.arrow(595, 272, 595, 312, INK, 5);
  box(s, 40, 380, 350, 120, '#fff'); box(s, 430, 380, 330, 120, '#fff');
  s.text(215, 430, 'Voor een examen vandaag\ngelden de regels van nu.', { size: 19, weight: 700 });
  s.text(595, 430, 'Controleer vlak voor je examen\nwelke code geldt.', { size: 19, weight: 700 });
  out(s, theorieblok, ['LICH-001', 'KWET-001']);
}
tijdlijn('schema-wegcode-2027', 'Van het huidige reglement naar nieuwe codes op 1 juni 2027',
  'Een tijdlijn. Links: nu geldt het huidige verkeersreglement. Rechts: vanaf 1 juni 2027 komen een federale code en een Vlaamse, Brusselse en Waalse code. Voor een examen vandaag gelden de regels van nu; controleer vlak voor je examen welke code geldt.', 'lichten-wijzigingen-2027');

// =====================================================================
// H5 — voetgangers en fietsers
// =====================================================================
const KWET = ['KWET-001'];
(function () { // 5.1.2
  const s = new Svg('schema-gelijkgesteld-voetganger-fietser', 'Telt als voetganger of als fietser',
    'Twee kolommen. Telt als voetganger: een step zonder motor stapvoets, een persoon met beperkte mobiliteit op een toestel dat voor hem bestemd is stapvoets, en wie een fiets of tweewielige bromfiets aan de hand leidt. Telt als fietser: een step zonder motor sneller dan stapvoets, een elektrische step (maximaal 25 km/u) en een elektrische fiets tot 25 km/u.', { bg: BG });
  s.titel('Telt als voetganger of als fietser');
  const kol = (x, kleur, kop, icoon, items) => {
    box(s, x, 72, 372, 420, kleur);
    s.add(sym(icoon, x + 56, 120, 36, INK));
    s.text(x + 100, 130, kop, { size: 24, anchor: 'start', weight: 800 });
    items.forEach((t, i) => { box(s, x + 16, 168 + i * 106, 340, 92, '#fff', { rx: 10 }); s.text(x + 186, 206 + i * 106 - (t.split('\n').length > 2 ? 8 : 0), t, { size: 17, weight: 700 }); });
  };
  kol(24, '#dce8f8', 'Telt als voetganger', 'voet', ['Step zonder motor,\nstapvoets', 'Persoon met beperkte mobiliteit\nop een toestel voor hen\nbestemd, stapvoets', 'Wie een fiets of tweewielige\nbromfiets aan de hand leidt']);
  kol(404, '#fde6cf', 'Telt als fietser', 'fiets', ['Step zonder motor,\nsneller dan stapvoets', 'Elektrische step\n(maximaal 25 km/u)', 'Elektrische fiets\ntot 25 km/u']);
  s.text(400, 538, 'Een elektrische step telt als fietser, niet als voetganger.', { size: 18, weight: 700 });
  out(s, 'kwetsbaar-algemeen', KWET);
})();

function voetganger(s, x, y, k = 1.8, col = '#2d57a8') {
  s.add(`<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="0" rx="12" ry="6.5" fill="${col}" stroke="#fff" stroke-width="1.5"/><circle cx="0" cy="0" r="6" fill="#f1c9a5" stroke="${INK}" stroke-width="1.5"/></g>`);
}
(function () { // 5.1.3
  const s = new Svg('schema-kinderen-oversteken', 'Kinderen steken onverwacht over',
    'Bovenaanzicht van een straat met geparkeerde auto\'s langs de rand. Tussen twee geparkeerde auto\'s komen kinderen plots de rijbaan op. Een blauwe auto nadert en rijdt traag. Links boven het waarschuwingsbord voor een plaats waar veel kinderen komen.', {});
  s.titel('Kinderen steken onverwacht over');
  s.rect(0, 160, 800, 50, C.sidewalk); s.rect(0, 210, 800, 40, '#6b717b'); s.rect(0, 250, 800, 120, C.road);
  s.line(0, 310, 800, 310, '#fff', 3, 'stroke-dasharray="16 14"');
  [150, 250, 540, 640].forEach((x, i) => s.car(x, 232, 90, ['geel', 'wit', 'oranje', 'paars'][i], null));
  [[372, 224], [428, 224], [400, 244]].forEach(([x, y], i) => voetganger(s, x, y, 1.6, ['#d63a3a', '#2f6fd6', '#f2c230'][i]));
  s.arrow(372, 234, 372, 318, '#fff', 3); s.arrow(428, 234, 428, 330, '#fff', 3); s.arrow(400, 254, 400, 335, '#fff', 3);
  s.car(200, 342, 90, 'blauw', null);
  s.sign('A23', 720, 112, 76);
  s.label(400, 112, 'Kinderen kunnen plots tussen geparkeerde\nauto\'s de rijbaan op rennen.', { size: 18, bg: '#fff' });
  s.label(400, 470, 'Rij daarom traag in de buurt van\nscholen en speelplaatsen.', { size: 19, bg: '#1f9d55', fg: '#fff' });
  out(s, 'voetgangers-kinderen-handicap', KWET);
})();

(function () { // 5.2.2
  const s = new Svg('schema-veilig-oversteken', 'Veilig oversteken als voetganger',
    'Bovenaanzicht van een straat met aan de rechterkant een zebrapad. Links steekt een voetganger haaks over (goed). In het midden steekt een voetganger schuin over vlak bij het zebrapad (fout). Rechts gebruikt een voetganger het zebrapad.', {});
  s.titel('Veilig oversteken', 'haaks op de weg, en gebruik het zebrapad in de buurt');
  s.rect(0, 160, 800, 56, C.sidewalk); s.rect(0, 216, 800, 130, C.road); s.rect(0, 346, 800, 56, C.sidewalk);
  s.line(0, 281, 800, 281, '#fff', 3, 'stroke-dasharray="16 14"');
  s.zebra(560, 216, 90, 130, 'v');
  voetganger(s, 150, 188, 1.8); s.arrow(150, 200, 150, 355, '#1f9d55', 5); tick(s, 150, 425, 44);
  voetganger(s, 380, 188, 1.8, '#d63a3a'); s.arrow(380, 200, 460, 355, '#d63a3a', 5); cross(s, 420, 425, 40);
  voetganger(s, 605, 188, 1.8, '#2f6fd6'); s.arrow(605, 200, 605, 355, '#1f9d55', 5);
  s.sign('F49', 700, 190, 60);
  s.label(150, 475, 'haaks oversteken', { size: 18, bg: '#fff' });
  s.label(420, 475, 'niet schuin', { size: 18, bg: '#fff' });
  s.label(605, 475, 'zebrapad in de buurt\n(ongeveer 20 m)?\nGebruik het.', { size: 17, bg: '#fff' });
  out(s, 'voetganger-oversteken', KWET);
})();

(function () { // 5.3.2
  const s = new Svg('schema-zebrapad-situaties', 'Het zebrapad en jij als bestuurder',
    'Drie kleine scènes. Zebrapad zonder agent of licht: matig naderen en voorrang geven. Voetganger is al bezig terwijl jouw licht groen wordt: laat hem uitlopen. Het licht of de agent sluit jouw richting: stop voor het zebrapad. Onderaan: extra attent bij een bus of grote auto voor het zebrapad.', { bg: BG });
  s.titel('Het zebrapad en jij als bestuurder');
  const scenes = [
    ['Zebrapad zonder agent\nof licht', 'Matig naderen en voorrang\ngeven aan voetgangers\nerop of ertegen.', (sc) => { sc.car(110, 200, 0, 'blauw', null); voetganger(sc, 90, 118, 1.6); sc.arrow(90, 118, 150, 118, '#fff', 3); }],
    ['Voetganger is al bezig,\njouw licht wordt groen', 'Hem met normale gang\nlaten uitlopen.', (sc) => { sc.car(110, 200, 0, 'blauw', null); voetganger(sc, 135, 118, 1.6); sc.arrow(135, 118, 165, 118, '#fff', 3); licht(sc, 192, 30, 'groen', 12, 0); }],
    ['Licht of agent sluit\njouw richting', 'Stoppen voor het\nzebrapad.', (sc) => { sc.car(110, 200, 0, 'blauw', null, { brake: true }); licht(sc, 192, 30, 'rood', 12, 0); }],
  ];
  scenes.forEach(([kop, sub, fn], i) => {
    const x = 24 + i * 254, y = 72;
    box(s, x, y, 240, 392, '#fff');
    scene(s, x + 12, y + 12, 216, 250, (sc) => {
      sc.rect(0, 0, 216, 250, C.grass); sc.rect(48, 0, 120, 250, C.road); sc.line(108, 0, 108, 250, '#fff', 3, 'stroke-dasharray="14 12"');
      sc.zebra(48, 90, 120, 56, 'h');
      fn(sc);
    });
    s.text(x + 120, y + 292, kop, { size: 17, weight: 800 });
    s.text(x + 120, y + 336, sub, { size: 15, weight: 600 });
  });
  s.label(400, 530, 'Extra attent bij een bus of grote auto voor het zebrapad:\nzij kunnen voetgangers aan het zicht onttrekken.', { size: 17, bg: '#fff', stroke: '#c27d00' });
  out(s, 'zebrapad-voorrang-bestuurder', KWET);
})();

(function () { // 5.6.2
  const s = new Svg('schema-fietsen-zonder-fietspad', 'Fietsen zonder fietspad',
    'Twee bovenaanzichten van een straat zonder fietspad. Boven: twee fietsers rijden naast elkaar dicht bij de rechterrand van de rijbaan, dat mag. Onder: er komt een auto aan en kruisen is niet mogelijk, dus rijden de fietsers achter elkaar.', {});
  s.titel('Fietsen zonder fietspad', 'fietsers rijden op de rijbaan, dicht bij de rechterrand');
  const paneel = (y, kop, enkel) => {
    box(s, 24, y, 752, 214, '#1c2230');
    s.text(400, y + 28, kop, { size: 20, fill: '#fff', weight: 700 });
    scene(s, 24, y + 40, 752, 174, (sc) => {
      sc.rect(0, 0, 752, 174, C.grass); sc.rect(0, 10, 752, 140, C.road);
      sc.line(0, 70, 752, 70, '#fff', 3, 'stroke-dasharray="16 14"');
      sc.line(0, 140, 752, 140, '#fff', 2);
    });
  };
  paneel(70, 'Er komt niemand aan: twee naast elkaar mag.', false);
  paneel(300, 'Kruisen niet mogelijk: achter elkaar.', true);
  // fietsers (buiten clip getekend, bovenop de panelen)
  const bikeS = (x, y) => { s.add(`<g transform="translate(${x} ${y}) scale(1.4)">`); s.bike(0, 0, 90, null); s.add('</g>'); };
  bikeS(330, 203); bikeS(330, 233);
  bikeS(360, 447); bikeS(450, 447);
  s.car(640, 380, 270, 'blauw', null);
  s.line(170, 258, 170, 252, INK, 2); s.label(170, 276, 'rechterrand van de rijbaan', { size: 14, bg: '#fff' });
  s.text(400, 556, 'Met een aanhangwagen rijd je altijd achter elkaar.', { size: 18, weight: 700 });
  out(s, 'fietsers-zonder-fietspad', KWET);
})();

(function () { // 5.7.2
  const s = new Svg('schema-bromfiets-soorten', 'Soorten bromfietsen en elektrische fietsen',
    'Vier kaartjes: een gewone elektrische fiets (tot 25 km/u, telt als fiets), bromfiets klasse A (maximaal 25 km/u), bromfiets klasse B (maximaal 45 km/u) en een speed pedelec (ondersteuning tot 45 km/u, telt als bromfiets).', { bg: BG });
  s.titel('Soorten bromfietsen');
  const t = [
    ['Gewone elektrische\nfiets', 'tot 25 km/u', 'telt als fiets', '#1f9d55'],
    ['Bromfiets\nklasse A', 'max. 25 km/u', 'telt als bromfiets A', '#f08a1c'],
    ['Bromfiets\nklasse B', 'max. 45 km/u', 'telt als bromfiets B', '#d63a3a'],
    ['Speed\npedelec', 'ondersteuning\ntot 45 km/u', 'telt als bromfiets', '#8e5bd1'],
  ];
  t.forEach(([naam, snel, telt, col], i) => {
    const x = 24 + (i % 2) * 380, y = 72 + Math.floor(i / 2) * 226;
    box(s, x, y, 372, 212, col);
    s.circle(x + 60, y + 106, 40, '#fff', `stroke="${INK}" stroke-width="3"`);
    s.add(sym('fiets', x + 60, y + 106, 34, INK));
    s.text(x + 118, y + 56, naam, { size: 22, anchor: 'start', fill: '#fff', weight: 800 });
    s.text(x + 118, y + 118, snel, { size: 24, anchor: 'start', fill: '#fff', weight: 800 });
    s.text(x + 118, y + 178, telt, { size: 18, anchor: 'start', fill: '#fff', weight: 600 });
  });
  s.text(400, 562, 'Voor een bromfiets geldt een minimumleeftijd van 16 jaar en een helm is verplicht.', { size: 17, weight: 600 });
  out(s, 'bromfiets-klassen-speed-pedelec', KWET);
})();

(function () { // 5.7.3
  const s = new Svg('schema-bromfiets-fietspad', 'Bromfietsen op het fietspad',
    'Een tabel met drie rijen en twee kolommen. Weg tot 50 km/u: bromfiets klasse A volgt het fietspad, bromfiets klasse B en speed pedelec mogen het fietspad volgen. Weg boven 50 km/u: bromfiets klasse A volgt het fietspad, bromfiets klasse B en speed pedelec moeten het volgen.', { bg: BG });
  s.titel('Bromfietsen op het fietspad');
  const X = [24, 284, 540], Wd = [250, 246, 236];
  ['', 'Weg tot 50 km/u', 'Weg boven 50 km/u'].forEach((h, j) => { if (h) { box(s, X[j], 72, Wd[j], 62, '#1c2230'); s.text(X[j] + Wd[j] / 2, 111, h, { size: 20, fill: '#fff', weight: 800 }); } });
  const GR = '#1f9d55', BL = '#2d57a8';
  const rows = [['Bromfiets klasse A', ['fietspad volgen', BL], ['fietspad volgen', BL]], ['Bromfiets klasse B', ['mag het\nfietspad volgen', GR], ['moet het\nfietspad volgen', BL]], ['Speed pedelec', ['mag het\nfietspad volgen', GR], ['moet het\nfietspad volgen', BL]]];
  rows.forEach(([naam, a, b], i) => {
    const y = 148 + i * 120;
    box(s, X[0], y, Wd[0], 108, '#fff'); s.add(sym('fiets', X[0] + 40, y + 54, 26, INK));
    s.text(X[0] + 76, y + 62, naam, { size: 18, anchor: 'start', weight: 800 });
    [a, b].forEach(([t, col], j) => { box(s, X[j + 1], y, Wd[j + 1], 108, col); s.text(X[j + 1] + Wd[j + 1] / 2, y + (t.includes('\n') ? 50 : 62), t, { size: 21, fill: '#fff', weight: 800 }); });
  });
  s.text(400, 540, 'Bromfiets klasse B en speed pedelec: tot en met 50 km/u mag het, erboven moet het.', { size: 17, weight: 700 });
  s.text(400, 566, 'Is er geen bruikbaar fietspad, dan volg je de rijbaan.', { size: 17, weight: 600 });
  out(s, 'bromfiets-fietspad-gebruik', KWET);
})();
