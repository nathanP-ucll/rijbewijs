'use strict';
// Extra illustraties (beeld-redacteur "a") voor H2 t/m H5.
// Gebruik: node scripts/schemas/extra-a.js
// Schrijft site/img/schemas/schema-*.svg en data/schemas-extra-a.json (raakt data/schemas-index.json NIET aan).
const fs = require('fs');
const path = require('path');
const { Svg, C, f, ROOT } = require('./lib');

const BG = '#eef1f6';
const INK = C.ink;
const REG = [];
const reg = (e) => { REG.push({ ...e, type: 'uitleg' }); return e; };
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
function weg(s, ox, met) {
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
    s.label(X(300), 512, 'Snelheid: 120 km/u,\nin elk gewest', { size: 20, bg: '#dff3e3', stroke: '#1f9d55' });
  }
}
(function () {
  const d1 = 'Bovenaanzicht van een weg buiten de bebouwde kom met twee rijstroken per richting. De twee rijrichtingen zijn alleen gescheiden door een witte lijn op het wegdek, er is geen middenberm. Auto\'s rijden in beide richtingen. Onderaan staat: de snelheid is de gewone limiet van het gewest.';
  const d2 = 'Bovenaanzicht van een weg buiten de bebouwde kom met twee rijstroken per richting. De twee rijrichtingen zijn gescheiden door een middenberm, een brede groene strook met een stoeprand en struiken. Auto\'s rijden in beide richtingen. Onderaan staat: de snelheid is 120 km/u in elk gewest.';
  let s = new Svg('schema-weg-zonder-middenberm', 'Weg zonder middenberm: alleen een witte lijn', d1, { w: 600, h: 560 });
  weg(s, 0, false); out(s, 'snelheden-buiten-bebouwde-kom', SNEL);
  s = new Svg('schema-weg-met-middenberm', 'Weg met middenberm: fysieke scheiding', d2, { w: 600, h: 560 });
  weg(s, 0, true); out(s, 'snelheden-buiten-bebouwde-kom', SNEL);
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
    { naam: 'Bebouwde kom', sign: 'F1a_horizontaal', v: [50, 50, 30] },
    { naam: 'Buiten de\nbebouwde kom', sign: 'F3a_horizontaal', v: [70, 90, 70], note: ['90 enkel met bord', '', ''] },
    { naam: 'Autosnelweg', sign: 'F5', v: [120, 120, 120] },
  ];
  rows.forEach((r, i) => {
    const y = 72 + i * 158;
    box(s, 24, y, 236, 144, '#fff');
    s.sign(r.sign, 78, y + 72, 74, { pole: false });
    s.text(124, y + (r.naam.includes('\n') ? 66 : 78), r.naam, { size: 21, anchor: 'start', weight: 800 });
    ['Vlaanderen', 'Wallonië', 'Brussel'].forEach((g, j) => gewChip(s, 276 + j * 170, y, 160, 144, g, r.v[j], r.note ? r.note[j] : ''));
  });
  s.text(400, 580, 'Een snelheidsbord gaat altijd voor op deze tabel.', { size: 17, weight: 600 });
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
  box(s, 30, 74, 740, 210, '#fff');
  s.rect(60, 150, 450, 54, '#2ea36b', 'rx="10" stroke="#1c2230" stroke-width="2.5"');
  s.rect(510, 150, 200, 54, '#f3b3ab', 'rx="10" stroke="#1c2230" stroke-width="2.5"');
  s.text(285, 185, 'aangepaste snelheid', { size: 22, fill: '#fff', weight: 800 });
  s.text(610, 185, 'te snel', { size: 22, fill: '#8a1f14', weight: 800 });
  s.line(710, 130, 710, 224, INK, 5);
  kmBadge(s, 710, 106, 70, { w: 96, h: 68, size: 30 });
  s.text(710, 250, 'limiet', { size: 17, weight: 700 });
  s.text(60, 250, 'langzaam', { size: 16, anchor: 'start', weight: 600 });
  s.text(60, 112, 'Mag je 70, maar is het mistig of glad?', { size: 21, anchor: 'start', weight: 800 });
  s.text(60, 136, 'Dan kan 70 te snel zijn.', { size: 18, anchor: 'start', weight: 600 });
  // weg in de mist
  s.rect(30, 310, 740, 210, C.grass, 'rx="14"');
  s.rect(30, 370, 740, 90, C.road); s.line(30, 415, 770, 415, '#fff', 3, 'stroke-dasharray="16 14"');
  s.car(250, 440, 90, 'rood', null);
  mist(s, 330, 330, 420, 170, '#ffffff', 0.55); mist(s, 120, 380, 320, 120, '#ffffff', 0.5);
  s.label(400, 548, 'Mist of een gladde weg: rij trager dan de limiet.', { size: 20, bg: '#fff' });
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
    ['Zoek een snelheidsbord', 'Een bord gaat altijd voor op de tabel.', '#c0261c'],
    ['Kijk naar plaats en gewest', 'Bebouwde kom of niet; Vlaanderen, Wallonië of Brussel.', '#1d5fa8'],
    ['Kijk naar je voertuig', 'Een bus, zwaar voertuig of bromfiets heeft een eigen limiet.', '#a85f00'],
    ['Pas je snelheid aan', 'Weer, zicht, drukte en wegdek bepalen hoe snel je echt rijdt.', '#1f7a46'],
  ];
  st.forEach(([t, sub, col], i) => {
    const y = 72 + i * 126;
    box(s, 40, y, 720, 96, col);
    s.badge(92, y + 48, i + 1, { r: 24 });
    s.text(140, y + 42, t, { size: 26, fill: '#fff', weight: 800, anchor: 'start' });
    s.text(140, y + 72, sub, { size: 16, fill: '#fff', weight: 500, anchor: 'start' });
    if (i < 3) s.arrow(400, y + 98, 400, y + 124, INK, 6);
    box(s, 650, y + 12, 96, 72, '#fff', { rx: 10 });
    if (i === 0) s.sign('C43_70', 698, y + 48, 62, { pole: false });
    if (i === 1) s.sign('F1a_horizontaal', 698, y + 48, 62, { pole: false });
    if (i === 2) s.car(698, y + 48, 90, 'blauw', null);
    if (i === 3) { mist(s, 654, y + 14, 88, 40, '#9aa3ad', 1); s.add(`<g stroke="#2f6fd6" stroke-width="4" stroke-linecap="round"><line x1="680" y1="${y + 58}" x2="674" y2="${y + 70}"/><line x1="700" y1="${y + 58}" x2="694" y2="${y + 70}"/><line x1="720" y1="${y + 58}" x2="714" y2="${y + 70}"/></g>`); }
  });
  out(s, 'snelheden-overzicht-gewest', SNEL);
})();

// @@DEEL3@@
