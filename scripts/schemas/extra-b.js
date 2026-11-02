'use strict';
// Extra illustraties voor hoofdstuk 6 t/m 9 (openbaar vervoer, plaats op de weg, autosnelweg, gedrag).
// Uitvoeren: node scripts/schemas/extra-b.js  -> schrijft site/img/schemas/schema-*.svg en data/schemas-extra-b.json
const fs = require('fs');
const path = require('path');
const { Svg, C, CAR, esc, f, ROOT } = require('./lib');

const GRN = '#1f9d55', RED = '#d63a3a', ORA = '#f08a1c', BLU = '#2f6fd6', INK = C.ink;
const PAPER = '#e9edf3', EDGE = '#c9d1de', MUTED = '#5b6577';

// ---- koppeling met data/theorie (voor bronnen)
const THEORIE = {};
for (const fn of fs.readdirSync(path.join(ROOT, 'data', 'theorie'))) {
  if (!fn.endsWith('.json')) continue;
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'theorie', fn), 'utf8'));
  for (const b of d.blokken || []) THEORIE[b.id] = b;
}
const LIST = [];
function mk(naam, title, desc, tb, draw, opt = {}) {
  if (tb && !THEORIE[tb]) throw new Error('theorieblok bestaat niet: ' + tb);
  const s = new Svg(naam, title, desc, opt);
  draw(s);
  const e = s.finish({ theorieblok: tb || undefined, bronnen: tb ? THEORIE[tb].bronnen : undefined });
  e.type = 'uitleg';
  LIST.push(e);
  return e;
}

// ---- kleine tekenhulpen
const wrap = (str, n) => {
  const out = []; let cur = '';
  for (const w of str.split(' ')) {
    if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out.join('\n');
};
const T = (s, x, y, str, size = 18, fill = INK, weight = 600, anchor = 'middle') => s.text(x, y, str, { size, fill, weight, anchor });
const card = (s, x, y, w, h, o = {}) => s.add(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 14}" fill="${o.fill || '#fff'}" stroke="${o.stroke || EDGE}" stroke-width="${o.sw || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
const G = (s, x, y, k, inner, rot = 0) => s.add(`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${k})">${inner}</g>`);
function mark(s, x, y, ok, r = 16) {
  s.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${ok ? GRN : RED}" stroke="#fff" stroke-width="2.5"/>`);
  const a = r * 0.45;
  if (ok) s.add(`<path d="M${f(x - a)},${f(y)} L${f(x - a / 3)},${f(y + a * 0.8)} L${f(x + a)},${f(y - a * 0.7)}" fill="none" stroke="#fff" stroke-width="${f(r / 4)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  else s.add(`<g stroke="#fff" stroke-width="${f(r / 4)}" stroke-linecap="round"><line x1="${f(x - a)}" y1="${f(y - a)}" x2="${f(x + a)}" y2="${f(y + a)}"/><line x1="${f(x + a)}" y1="${f(y - a)}" x2="${f(x - a)}" y2="${f(y + a)}"/></g>`);
}
function bigCross(s, x, y, size = 50) {
  s.add(`<g stroke="${RED}" stroke-width="${size / 4}" stroke-linecap="round" opacity="0.92"><line x1="${x - size / 2}" y1="${y - size / 2}" x2="${x + size / 2}" y2="${y + size / 2}"/><line x1="${x + size / 2}" y1="${y - size / 2}" x2="${x - size / 2}" y2="${y + size / 2}"/></g>`);
}
// rode ring met schuine streep (verbodsteken) om een gebied
function ban(s, x, y, r) {
  s.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="none" stroke="${RED}" stroke-width="${f(r / 6)}"/><line x1="${f(x - r * 0.7)}" y1="${f(y - r * 0.7)}" x2="${f(x + r * 0.7)}" y2="${f(y + r * 0.7)}" stroke="${RED}" stroke-width="${f(r / 6)}" stroke-linecap="round"/>`);
}
// pijl met eigen pad
function parrow(s, d, color = INK, w = 5, dash) {
  const m = s.marker(color);
  return s.add(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#${m})"/>`);
}
// schaal een bestaand lib-voertuig: fn tekent in (0,0)
function sc(s, x, y, k, fn, rot = 0) {
  const n = s.b.length; fn(); const parts = s.b.splice(n);
  s.add(`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${k})">${parts.join('')}</g>`);
}
// nummerbolletje
const nbadge = (s, x, y, n, r = 15, fill = INK, fg = '#fff') => { s.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="2"/>`); s.text(x, y + r * 0.38, n, { size: r * 1.3, fill: fg, weight: 800 }); };
// verticale weg
function vroad(s, x, w, o = {}) {
  s.rect(x, o.y0 || 0, w, (o.y1 || s.h) - (o.y0 || 0), o.color || C.road);
  if (o.mid !== false) s.line(x + w / 2, o.y0 || 0, x + w / 2, o.y1 || s.h, '#fff', 3, 'stroke-dasharray="16 14"');
}
// lichtbundel (bovenaanzicht, naar boven gericht vanaf 0,0)
function beam(len, wide, color = '#fff6b0', op = 0.75) {
  return `<polygon points="0,0 ${-wide / 2},${-len} ${wide / 2},${-len}" fill="${color}" opacity="${op}"/>`;
}

// ---- pictogrammen (lokale coördinaten rond 0,0, ongeveer 100 breed)
const ICON = {
  person: (col = '#2d4a8a') => `<circle cx="0" cy="-36" r="11" fill="${col}"/><rect x="-15" y="-22" width="30" height="42" rx="9" fill="${col}"/><rect x="-25" y="-20" width="9" height="36" rx="4.5" fill="${col}"/><rect x="16" y="-20" width="9" height="36" rx="4.5" fill="${col}"/><rect x="-13" y="18" width="11" height="34" rx="5" fill="${col}"/><rect x="2" y="18" width="11" height="34" rx="5" fill="${col}"/>`,
  bike: () => `<g fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="-32" cy="16" r="20"/><circle cx="32" cy="16" r="20"/><path d="M-32,16 L-8,-10 L18,-10 L32,16 M-8,-10 L4,16 L-32,16 M18,-10 L14,-24 L26,-24 M-12,-16 L-2,-16"/></g>`,
  moped: () => `<circle cx="-32" cy="22" r="15" fill="#333"/><circle cx="32" cy="22" r="15" fill="#333"/><circle cx="-32" cy="22" r="6" fill="#bbb"/><circle cx="32" cy="22" r="6" fill="#bbb"/><path d="M-42,12 Q-20,16 14,12 L24,-26 L36,-26 M24,-26 L16,-34" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M-44,6 Q-44,-8 -30,-8 L6,-8 L10,12 L-40,14 Z" fill="#d6572c" stroke="${INK}" stroke-width="2.5"/><rect x="-38" y="-16" width="38" height="9" rx="4.5" fill="${INK}"/>`,
  tractor: () => `<circle cx="-20" cy="14" r="27" fill="#2c2f36"/><circle cx="-20" cy="14" r="11" fill="#c9a227"/><circle cx="36" cy="28" r="14" fill="#2c2f36"/><circle cx="36" cy="28" r="6" fill="#c9a227"/><rect x="0" y="-8" width="48" height="26" rx="5" fill="#3a8f4a" stroke="${INK}" stroke-width="2.5"/><rect x="-40" y="-36" width="34" height="40" rx="5" fill="#3a8f4a" stroke="${INK}" stroke-width="2.5"/><rect x="-35" y="-31" width="24" height="20" rx="3" fill="#cfe6f7"/><rect x="38" y="-26" width="5" height="20" fill="${INK}"/>`,
  cow: () => `<rect x="-38" y="-18" width="64" height="36" rx="15" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="-18" cy="-4" r="7" fill="${INK}"/><circle cx="8" cy="6" r="8" fill="${INK}"/><ellipse cx="38" cy="-12" rx="13" ry="11" fill="#fff" stroke="${INK}" stroke-width="3"/><ellipse cx="46" cy="-8" rx="6" ry="5" fill="#f1c9a5"/><path d="M32,-23 l-3,-9 M42,-23 l4,-9" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><g fill="#fff" stroke="${INK}" stroke-width="3"><rect x="-32" y="14" width="9" height="30" rx="3"/><rect x="-14" y="14" width="9" height="30" rx="3"/><rect x="8" y="14" width="9" height="30" rx="3"/><rect x="18" y="14" width="9" height="30" rx="3"/></g><path d="M-38,-8 q-12,6 -8,24" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  quad: () => `<circle cx="-30" cy="22" r="18" fill="#2c2f36"/><circle cx="30" cy="22" r="18" fill="#2c2f36"/><circle cx="-30" cy="22" r="7" fill="#bbb"/><circle cx="30" cy="22" r="7" fill="#bbb"/><rect x="-40" y="-4" width="80" height="20" rx="8" fill="#c0392b" stroke="${INK}" stroke-width="2.5"/><rect x="-26" y="-14" width="30" height="10" rx="5" fill="${INK}"/><path d="M14,-4 L20,-24 M10,-24 L30,-24" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  car: (col = '#2f6fd6') => `<path d="M-52,12 L-52,-2 Q-50,-10 -38,-12 L-26,-14 L-14,-32 L22,-32 L38,-14 L48,-12 Q56,-8 56,4 L56,12 Z" fill="${col}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-12,-14 L-4,-27 L8,-27 L8,-14 Z M13,-14 L13,-27 L20,-27 L31,-14 Z" fill="#cfe6f7" stroke="${INK}" stroke-width="2"/><circle cx="-30" cy="14" r="12" fill="#2c2f36" stroke="#fff" stroke-width="2"/><circle cx="32" cy="14" r="12" fill="#2c2f36" stroke="#fff" stroke-width="2"/><circle cx="-30" cy="14" r="4.5" fill="#bbb"/><circle cx="32" cy="14" r="4.5" fill="#bbb"/>`,
  phone: () => `<rect x="-15" y="-28" width="30" height="56" rx="6" fill="#222" stroke="#000" stroke-width="2"/><rect x="-11.5" y="-22" width="23" height="42" rx="2" fill="#7fb8e0"/><circle cx="0" cy="24" r="2" fill="#777"/>`,
  tablet: () => `<rect x="-30" y="-22" width="60" height="44" rx="6" fill="#222" stroke="#000" stroke-width="2"/><rect x="-26" y="-18" width="52" height="36" rx="2" fill="#7fb8e0"/><path d="M-20,8 L-8,-4 L2,4 L12,-8 L22,6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  glass: () => `<path d="M-20,-30 L20,-30 L14,28 L-14,28 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-17,-8 L17,-8 L14,28 L-14,28 Z" fill="#e8a317" opacity="0.9"/><circle cx="-4" cy="6" r="3" fill="#fff" opacity="0.8"/><circle cx="5" cy="14" r="2.5" fill="#fff" opacity="0.8"/><rect x="-18" y="28" width="36" height="5" rx="2.5" fill="${INK}"/>`,
  tube: () => `<path d="M-10,-34 L10,-34 L10,22 A10,10 0 0 1 -10,22 Z" fill="#eef7ff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-10,0 L10,0 L10,22 A10,10 0 0 1 -10,22 Z" fill="#8bc34a"/><rect x="-14" y="-38" width="28" height="6" rx="3" fill="${INK}"/>`,
  pill: () => `<g transform="rotate(-35)"><rect x="-30" y="-13" width="60" height="26" rx="13" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M0,-13 L0,13 L17,13 A13,13 0 0 0 17,-13 Z" fill="${RED}"/><rect x="-30" y="-13" width="60" height="26" rx="13" fill="none" stroke="${INK}" stroke-width="3"/><line x1="0" y1="-13" x2="0" y2="13" stroke="${INK}" stroke-width="3"/></g>`,
  eye: () => `<path d="M-44,0 Q0,-40 44,0 Q0,40 -44,0 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><circle cx="0" cy="0" r="15" fill="#3f6fb5"/><circle cx="0" cy="0" r="7" fill="${INK}"/><circle cx="-5" cy="-5" r="3" fill="#fff"/>`,
  clock: () => `<circle cx="0" cy="0" r="36" fill="#fff" stroke="${INK}" stroke-width="5"/><path d="M0,-26 L0,0 L18,12" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="0" cy="0" r="4" fill="${INK}"/>`,
  sun: () => `<circle cx="0" cy="0" r="20" fill="#f2c230"/><g stroke="#f2c230" stroke-width="5" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="${f(Math.cos(a * Math.PI / 180) * 30)}" y1="${f(Math.sin(a * Math.PI / 180) * 30)}" x2="${f(Math.cos(a * Math.PI / 180) * 42)}" y2="${f(Math.sin(a * Math.PI / 180) * 42)}"/>`).join('')}</g>`,
  moon: () => `<path d="M12,-38 A38,38 0 1 0 38,12 A30,30 0 0 1 12,-38 Z" fill="#f2d98a" stroke="#d9b54a" stroke-width="2"/><circle cx="30" cy="-28" r="3" fill="#fff"/><circle cx="-34" cy="-26" r="2.5" fill="#fff"/>`,
  cloud: (col = '#b9c3d1') => `<g fill="${col}"><circle cx="-24" cy="6" r="18"/><circle cx="0" cy="-8" r="24"/><circle cx="26" cy="4" r="19"/><rect x="-42" y="6" width="86" height="18" rx="9"/></g>`,
  rain: () => `<g stroke="#4a8fd6" stroke-width="4" stroke-linecap="round">${[-30, -12, 6, 24].map((x, i) => `<line x1="${x}" y1="${34 + (i % 2) * 8}" x2="${x - 7}" y2="${52 + (i % 2) * 8}"/>`).join('')}</g>`,
  doc: () => `<rect x="-26" y="-36" width="52" height="72" rx="5" fill="#fff" stroke="${INK}" stroke-width="3"/><g stroke="#8d96a6" stroke-width="3" stroke-linecap="round"><line x1="-16" y1="-22" x2="16" y2="-22"/><line x1="-16" y1="-10" x2="16" y2="-10"/><line x1="-16" y1="2" x2="16" y2="2"/><line x1="-16" y1="14" x2="6" y2="14"/><line x1="-16" y1="26" x2="10" y2="26"/></g>`,
  doctor: () => `<circle cx="0" cy="-36" r="11" fill="#f1c9a5" stroke="${INK}" stroke-width="2"/><rect x="-20" y="-22" width="40" height="52" rx="10" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M-5,-10 h10 v7 h7 v10 h-7 v7 h-10 v-7 h-7 v-10 h7 z" fill="${RED}"/><rect x="-14" y="28" width="11" height="24" rx="5" fill="#4a5568"/><rect x="3" y="28" width="11" height="24" rx="5" fill="#4a5568"/>`,
  coffee: () => `<path d="M-24,-14 L20,-14 L16,26 Q15,32 8,32 L-12,32 Q-19,32 -20,26 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M20,-6 q16,0 14,14 q-2,12 -18,10" fill="none" stroke="${INK}" stroke-width="3.5"/><path d="M-12,-18 q-6,-10 0,-18 M0,-18 q-6,-10 0,-18 M12,-18 q-6,-10 0,-18" fill="none" stroke="#9aa3ad" stroke-width="3" stroke-linecap="round"/><rect x="-22" y="-14" width="42" height="8" fill="#7a4b2a"/>`,
  burger: () => `<path d="M-30,-6 Q-30,-30 0,-30 Q30,-30 30,-6 Z" fill="#d9993d" stroke="${INK}" stroke-width="3"/><rect x="-32" y="-3" width="64" height="8" rx="4" fill="#4aa44a"/><rect x="-30" y="5" width="60" height="10" rx="5" fill="#7a3b1e"/><path d="M-30,17 Q-30,30 0,30 Q30,30 30,17 Z" fill="#d9993d" stroke="${INK}" stroke-width="3"/>`,
  speech: () => `<path d="M-34,-26 H34 Q42,-26 42,-18 V12 Q42,20 34,20 H0 L-18,36 L-16,20 H-34 Q-42,20 -42,12 V-18 Q-42,-26 -34,-26 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><g fill="${INK}"><circle cx="-16" cy="-3" r="4"/><circle cx="0" cy="-3" r="4"/><circle cx="16" cy="-3" r="4"/></g>`,
  wheel: () => `<circle cx="0" cy="0" r="40" fill="none" stroke="${INK}" stroke-width="9"/><circle cx="0" cy="0" r="10" fill="${INK}"/><path d="M-38,0 L-10,0 M38,0 L10,0 M0,10 L0,38" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`,
  hand: () => `<path d="M-20,30 L-24,-4 Q-26,-14 -18,-14 Q-12,-14 -12,-6 L-12,-24 Q-12,-32 -5,-32 Q2,-32 2,-24 L2,-28 Q2,-36 9,-36 Q16,-36 16,-28 L16,-24 Q16,-30 23,-30 Q30,-30 30,-22 L30,14 Q30,30 14,34 L-8,34 Q-16,34 -20,30 Z" fill="#f1c9a5" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
  lamp: (col = '#fff3a8') => `<path d="M-14,-18 Q-14,-30 0,-30 Q14,-30 14,-18 L14,10 Q14,20 0,20 Q-14,20 -14,10 Z" fill="${col}" stroke="${INK}" stroke-width="3"/>`,
  snow: () => `<g stroke="#7fb8e0" stroke-width="3" stroke-linecap="round">${[0, 60, 120].map((a) => `<line x1="${f(Math.cos(a * Math.PI / 180) * 16)}" y1="${f(Math.sin(a * Math.PI / 180) * 16)}" x2="${f(-Math.cos(a * Math.PI / 180) * 16)}" y2="${f(-Math.sin(a * Math.PI / 180) * 16)}"/>`).join('')}</g>`,
  key: () => `<circle cx="-18" cy="0" r="14" fill="none" stroke="${INK}" stroke-width="6"/><path d="M-4,0 H34 M22,0 V12 M32,0 V10" stroke="${INK}" stroke-width="6" stroke-linecap="round" fill="none"/>`,
  warn: () => `<polygon points="0,-34 34,26 -34,26" fill="#fff" stroke="${RED}" stroke-width="9" stroke-linejoin="round"/><polygon points="0,-18 18,14 -18,14" fill="${RED}" opacity="0.18"/>`
};
const icon = (s, name, x, y, k = 1, arg, rot = 0) => G(s, x, y, k, ICON[name](arg), rot);

// ---- auto's van voren/achter (voor lichten)
function carFront(s, x, y, k, o = {}) {
  const col = o.color || '#d64545';
  const g = [];
  g.push(`<rect x="-62" y="-6" width="124" height="52" rx="14" fill="${col}" stroke="${INK}" stroke-width="3"/>`);
  g.push(`<path d="M-48,-6 L-36,-40 L36,-40 L48,-6 Z" fill="${col}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
  g.push(`<path d="M-40,-8 L-30,-34 L30,-34 L40,-8 Z" fill="#cfe6f7" stroke="${INK}" stroke-width="2"/>`);
  g.push(`<rect x="-70" y="34" width="22" height="26" rx="5" fill="#2c2f36"/><rect x="48" y="34" width="22" height="26" rx="5" fill="#2c2f36"/>`);
  g.push(`<rect x="-30" y="26" width="60" height="12" rx="4" fill="#2c2f36" opacity="0.8"/>`);
  const lamp = (cx, cy, on, c) => `<ellipse cx="${cx}" cy="${cy}" rx="13" ry="8" fill="${on ? c : '#e6e6e6'}" stroke="${INK}" stroke-width="2"/>`;
  g.push(lamp(-46, 12, o.front, o.frontColor || '#fff3a8'), lamp(46, 12, o.front, o.frontColor || '#fff3a8'));
  if (o.fog) g.push(`<ellipse cx="-34" cy="34" rx="7" ry="5" fill="${o.fogColor || '#ffe27a'}" stroke="${INK}" stroke-width="1.5"/><ellipse cx="34" cy="34" rx="7" ry="5" fill="${o.fogColor || '#ffe27a'}" stroke="${INK}" stroke-width="1.5"/>`);
  G(s, x, y, k, g.join(''));
}
function carRear(s, x, y, k, o = {}) {
  const col = o.color || '#2f6fd6';
  const g = [];
  g.push(`<rect x="-62" y="-6" width="124" height="52" rx="14" fill="${col}" stroke="${INK}" stroke-width="3"/>`);
  g.push(`<path d="M-48,-6 L-38,-40 L38,-40 L48,-6 Z" fill="${col}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
  g.push(`<path d="M-42,-8 L-33,-34 L33,-34 L42,-8 Z" fill="#b9d3e6" stroke="${INK}" stroke-width="2"/>`);
  g.push(`<rect x="-70" y="34" width="22" height="26" rx="5" fill="#2c2f36"/><rect x="48" y="34" width="22" height="26" rx="5" fill="#2c2f36"/>`);
  g.push(`<rect x="-20" y="24" width="40" height="16" rx="3" fill="#fff" stroke="${INK}" stroke-width="2"/>`);
  const lamp = (cx, on) => `<rect x="${cx - 14}" y="8" width="28" height="12" rx="4" fill="${on ? '#e8362f' : '#8a2a2a'}" stroke="${INK}" stroke-width="2"/>`;
  g.push(lamp(-46, o.rear !== false), lamp(46, o.rear !== false));
  if (o.fog) g.push(`<rect x="-8" y="8" width="16" height="12" rx="4" fill="#ff1a1a" stroke="${INK}" stroke-width="2"/>`);
  G(s, x, y, k, g.join(''));
}
// bovenaanzicht auto met stoelen. geeft stoelposities terug
function carTop(s, cx, cy, k, o = {}) {
  const g = [];
  [[-98, -140], [86, -140], [-98, 100], [86, 100]].forEach(([x, y]) => g.push(`<rect x="${x}" y="${y}" width="14" height="56" rx="6" fill="#2c2f36"/>`));
  g.push(`<rect x="-90" y="-215" width="180" height="430" rx="64" fill="${o.color || '#dfe4ec'}" stroke="${INK}" stroke-width="5"/>`);
  g.push(`<path d="M-72,-150 Q0,-186 72,-150 L66,-118 L-66,-118 Z" fill="#cfe6f7" stroke="${INK}" stroke-width="3"/>`);
  g.push(`<rect x="-66" y="150" width="132" height="26" rx="10" fill="#b9d3e6" stroke="${INK}" stroke-width="3"/>`);
  const seat = (x, y, c) => `<rect x="${x - 27}" y="${y - 30}" width="54" height="60" rx="12" fill="${c}" stroke="${INK}" stroke-width="3"/><rect x="${x - 27}" y="${y + 14}" width="54" height="16" rx="6" fill="#4b5563"/>`;
  const sc2 = o.seats || {};
  g.push(seat(-46, -50, sc2.fl || '#8d96a6'), seat(46, -50, sc2.fr || '#8d96a6'), seat(-56, 70, sc2.rl || '#8d96a6'), seat(0, 70, sc2.rm || '#8d96a6'), seat(56, 70, sc2.rr || '#8d96a6'));
  g.push(`<circle cx="-46" cy="-96" r="20" fill="none" stroke="${INK}" stroke-width="6"/>`);
  G(s, cx, cy, k, g.join(''));
  const P = (x, y) => ({ x: f(cx + x * k), y: f(cy + y * k) });
  return { fl: P(-46, -50), fr: P(46, -50), rl: P(-56, 70), rm: P(0, 70), rr: P(56, 70), front: P(0, -215), k };
}
// persoon op een stoel (bovenaanzicht): hoofd + schouders, optioneel gordel
function sitter(s, p, k, o = {}) {
  const col = o.color || '#2d4a8a';
  const g = [`<ellipse cx="0" cy="8" rx="22" ry="12" fill="${col}" stroke="#fff" stroke-width="2.5"/><circle cx="0" cy="-2" r="12" fill="#f1c9a5" stroke="${INK}" stroke-width="2.5"/>`];
  if (o.belt) g.push(`<line x1="${o.belt > 0 ? -18 : 18}" y1="-2" x2="${o.belt > 0 ? 20 : -20}" y2="24" stroke="${GRN}" stroke-width="6" stroke-linecap="round"/>`);
  G(s, p.x, p.y - 6 * k, k, g.join(''));
}

// label dat verticaal rond cy gecentreerd staat (s.label gebruikt de basislijn van de eerste regel)
function pill(s, cx, cy, str, o = {}) {
  const size = o.size || 16, n = String(str).split('\n').length;
  const h = n * size * 1.18 + 10;
  return s.label(cx, cy - h / 2 + size + 2, str, o);
}
const hatchId = (s) => {
  if (!s._hatch) { s._hatch = 1; s.defs.push(`<pattern id="hatchb" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="rgba(214,58,58,.22)"/><line x1="0" y1="0" x2="0" y2="12" stroke="${RED}" stroke-width="5"/></pattern>`); }
  return 'url(#hatchb)';
};

// =====================================================================  HOOFDSTUK 6
mk('schema-tramlichten-tekens', 'Tramlichten: witte tekens op een zwarte achtergrond',
  'Overzicht van zes tramlichten, elk een wit teken op een zwart vierkant: horizontale balk (zoals rood: stoppen), cirkel (zoals oranje: stoppen tenzij het niet meer veilig kan), omgekeerde driehoek (zoals groen: doorrijden toegelaten), verticale balk (enkel rechtdoor), schuine balk (enkel in de richting van de balk) en knipperende cirkel (zoals oranje knipperlicht).',
  'openbaar-tramlichten', (s) => {
    s.titel('Tramlichten: witte tekens op zwart');
    const items = [
      ['Horizontale balk', 'Zoals rood:\nstoppen', 'bar-h', RED],
      ['Cirkel', 'Zoals oranje: stoppen,\ntenzij dat niet meer\nveilig kan', 'circle', ORA],
      ['Omgekeerde driehoek', 'Zoals groen:\ndoorrijden toegelaten', 'tri', GRN],
      ['Verticale balk', 'Enkel rechtdoor\nrijden toegelaten', 'bar-v', BLU],
      ['Schuine balk', 'Enkel rijden in de\nrichting van de balk', 'bar-d', BLU],
      ['Knipperende cirkel', 'Zoals oranje\nknipperlicht', 'blink', ORA]];
    items.forEach(([naam, uitleg, vorm, kleur], i) => {
      const x0 = 20 + (i % 3) * 262, y0 = 76 + Math.floor(i / 3) * 230, cx = x0 + 118, cy = y0 + 62;
      card(s, x0, y0, 236, 218);
      s.add(`<rect x="${x0 + 14}" y="${y0 + 206}" width="208" height="6" rx="3" fill="${kleur}"/>`);
      s.add(`<rect x="${cx - 48}" y="${cy - 48}" width="96" height="96" rx="14" fill="#14171d" stroke="#000" stroke-width="3"/>`);
      const w = '#ffffff';
      if (vorm === 'bar-h') s.rect(cx - 32, cy - 7, 64, 14, w, 'rx="3"');
      if (vorm === 'circle') s.circle(cx, cy, 26, w);
      if (vorm === 'tri') s.add(`<polygon points="${cx - 30},${cy - 24} ${cx + 30},${cy - 24} ${cx},${cy + 30}" fill="${w}"/>`);
      if (vorm === 'bar-v') s.rect(cx - 7, cy - 32, 14, 64, w, 'rx="3"');
      if (vorm === 'bar-d') s.add(`<g transform="rotate(-45 ${cx} ${cy})"><rect x="${cx - 7}" y="${cy - 34}" width="14" height="68" rx="3" fill="${w}"/></g>`);
      if (vorm === 'blink') {
        s.circle(cx, cy, 20, w);
        for (let a = 0; a < 360; a += 45) s.line(cx + Math.cos(a * Math.PI / 180) * 27, cy + Math.sin(a * Math.PI / 180) * 27, cx + Math.cos(a * Math.PI / 180) * 36, cy + Math.sin(a * Math.PI / 180) * 36, w, 3.5, 'stroke-linecap="round"');
      }
      T(s, cx, y0 + 134, naam, 19, INK, 700);
      s.text(cx, y0 + 156, uitleg, { size: 15, fill: MUTED, weight: 600 });
    });
    s.label(400, 572, 'Jij volgt de gewone driekleurige verkeerslichten', { size: 18, bg: '#1c2230', fg: '#fff' });
  }, { bg: PAPER });

mk('schema-busstrook-toegang', 'Wie mag op de busstrook?',
  'Links een weg met een gewone rijstrook en een busstrook (afgebakend met een brede onderbroken witte streep) waarop een bus rijdt; een personenauto op de gewone rijstrook blijft ervan af. Rechts een overzicht: bus en tram altijd, taxi, fiets, bromfiets en motorfiets enkel als het bord of onderbord dat toont, een gewone personenauto nooit.',
  'openbaar-busstrook', (s) => {
    s.titel('Wie mag op de busstrook?');
    s.rect(30, 48, 270, 552, C.road);
    s.rect(165, 48, 135, 552, '#555b66');
    s.add(`<line x1="165" y1="48" x2="165" y2="600" stroke="#fff" stroke-width="9" stroke-dasharray="30 20"/>`);
    s.add(`<line x1="30" y1="48" x2="30" y2="600" stroke="#fff" stroke-width="4"/><line x1="300" y1="48" x2="300" y2="600" stroke="#fff" stroke-width="4"/>`);
    s.text(232, 430, 'BUS', { size: 38, fill: '#fff', weight: 800, extra: 'transform="rotate(-90 232 430)" opacity="0.9"' });
    s.bus(232, 190, 0, null);
    s.car(97, 400, 0, 'rood', null);
    bigCross(s, 97, 400, 46);
    pill(s, 97, 500, 'busstrook\nblijft vrij', { size: 15 });
    const rows = [
      ['Bus en tram', 'van geregelde diensten', 'Altijd', GRN, () => sc(s, 372, 0, 0.36, () => s.bus(0, 0, 0, null))],
      ['Taxi', 'met het woord TAXI op\nbord of onderbord', 'Enkel als het\nbord het zegt', ORA, () => { sc(s, 372, 0, 0.7, () => s.car(0, 0, 0, '#f0b429', null)); }],
      ['Fiets', 'met fietssymbool op\nbord of onderbord', 'Enkel als het\nbord het zegt', ORA, () => s.bike(372, 0, 0, null)],
      ['Bromfiets', 'met bromfietssymbool\nop bord of onderbord', 'Enkel als het\nbord het zegt', ORA, () => sc(s, 372, 0, 1.15, () => s.bike(0, 0, 0, null, { color: '#2f6fd6' }))],
      ['Motorfiets', 'met motorsymbool op\nbord of onderbord', 'Enkel als het\nbord het zegt', ORA, () => sc(s, 372, 0, 1.3, () => s.bike(0, 0, 0, null, { color: '#2c2f36' }))],
      ['Gewone personenauto', '', 'Nooit', RED, () => sc(s, 372, 0, 0.7, () => s.car(0, 0, 0, 'rood', null))]];
    rows.forEach(([naam, sub, status, kleur, drawIcon], i) => {
      const y0 = 66 + i * 88, cy = y0 + 38;
      card(s, 330, y0, 450, 76);
      s.add(`<rect x="330" y="${y0}" width="8" height="76" rx="3" fill="${kleur}"/>`);
      // icon: hertekenen op juiste hoogte
      const n = s.b.length; drawIcon(); const parts = s.b.splice(n);
      s.add(`<g transform="translate(0 ${cy})">${parts.join('')}</g>`);
      s.text(412, sub ? cy - 12 : cy + 7, naam, { size: 18, fill: INK, weight: 700, anchor: 'start' });
      if (sub) s.text(412, cy + 6, sub, { size: 13, fill: MUTED, weight: 600, anchor: 'start' });
      pill(s, 702, cy, status, { size: 15, bg: kleur, fg: '#fff' });
    });
  });

mk('schema-halte-parkeerverbod', 'Bij een halte: niet parkeren en niet oversteken over tramsporen',
  'Bovenaan een weg met een halte langs het trottoir. Aan weerszijden van het haltebord is een rode zone getekend van minder dan 15 meter waar parkeren verboden is; een auto in die zone staat fout, een auto ver erbuiten staat goed. Onderaan wacht een voetganger aan de rand van tramsporen omdat er een tram nadert.',
  'openbaar-tramhalte', (s) => {
    s.titel('Bij een halte: niet parkeren, niet oversteken');
    // deel A: bestuurder
    s.rect(0, 48, 800, 62, C.sidewalk);
    s.rect(0, 110, 800, 170, C.road);
    s.line(0, 195, 800, 195, '#fff', 3, 'stroke-dasharray="16 14"');
    s.add(`<rect x="250" y="110" width="300" height="85" fill="${hatchId(s)}" stroke="${RED}" stroke-width="2" stroke-dasharray="6 4"/>`);
    s.line(400, 82, 400, 110, '#8d949e', 5);
    s.add(`<rect x="364" y="52" width="72" height="34" rx="6" fill="#1c2230" stroke="#fff" stroke-width="2"/>`);
    T(s, 400, 76, 'HALTE', 18, '#fff', 800);
    s.car(120, 152, 90, 'blauw', null);
    mark(s, 120, 118, true, 14);
    s.car(335, 152, 90, 'rood', null);
    mark(s, 335, 118, false, 14);
    s.add(`<g stroke="#fff" stroke-width="3"><line x1="250" y1="236" x2="400" y2="236"/><line x1="400" y1="236" x2="550" y2="236"/><line x1="250" y1="228" x2="250" y2="244"/><line x1="400" y1="228" x2="400" y2="244"/><line x1="550" y1="228" x2="550" y2="244"/></g>`);
    pill(s, 325, 264, 'minder dan\n15 meter', { size: 15 });
    pill(s, 475, 264, 'minder dan\n15 meter', { size: 15 });
    s.label(670, 168, 'Parkeren verboden\nin de rode zone', { size: 16, bg: RED, fg: '#fff' });
    // deel B: voetganger en tram
    s.rect(0, 300, 800, 300, C.grass);
    s.rect(0, 300, 800, 85, C.sidewalk);
    s.track(0, 470, 800, 470);
    s.tram(600, 470, 270, null);
    sc(s, 210, 398, 1.9, () => s.ped(0, 0, null, { rot: 90 }));
    s.add(`<line x1="210" y1="410" x2="210" y2="445" stroke="${RED}" stroke-width="5" stroke-dasharray="6 6"/>`);
    bigCross(s, 210, 430, 26);
    pill(s, 210, 545, 'Voetganger wacht:\nniet oversteken\nover de sporen', { size: 16 });
    pill(s, 600, 545, 'Er nadert een tram', { size: 17, bg: '#1c2230', fg: '#fff' });
  });

mk('schema-schoolbus-alarmlichten', 'Schoolbus met knipperende richtingaanwijzers',
  'Een schoolbus staat langs de weg met alle vier de richtingaanwijzers knipperend (oranje stralen). Op het trottoir staan drie kinderen. Een auto komt van achteren en vertraagt sterk; zijn remlichten branden.',
  'openbaar-schoolvervoer', (s) => {
    s.titel('Schoolbus met alarmlichten: sterk vertragen');
    vroad(s, 230, 230);
    s.rect(460, 48, 120, 552, C.sidewalk);
    s.rect(30, 48, 200, 552, C.grass2);
    s.bus(400, 230, 0, null);
    // vier knipperende hoeken
    [[-19, -56], [19, -56], [-19, 56], [19, 56]].forEach(([dx, dy]) => {
      const x = 400 + dx, y = 230 + dy;
      s.add(`<circle cx="${x}" cy="${y}" r="8" fill="#ff9d00" stroke="#fff" stroke-width="2"/>`);
      const sx = dx < 0 ? -1 : 1;
      s.add(`<g stroke="#ffb02e" stroke-width="3.5" stroke-linecap="round"><line x1="${x + sx * 12}" y1="${y - 6}" x2="${x + sx * 22}" y2="${y - 12}"/><line x1="${x + sx * 13}" y1="${y}" x2="${x + sx * 25}" y2="${y}"/><line x1="${x + sx * 12}" y1="${y + 6}" x2="${x + sx * 22}" y2="${y + 12}"/></g>`);
    });
    [[510, 190, '#d64545'], [545, 235, '#2ea36b'], [515, 270, '#8e5bd1']].forEach(([x, y, c]) => sc(s, x, y, 1.7, () => s.ped(0, 0, null, { color: c, rot: 270 })));
    parrow(s, 'M425,230 L488,230', '#fff', 4, '2 8');
    s.car(400, 470, 0, 'blauw', null, { brake: true });
    s.add(`<g stroke="${RED}" stroke-width="4" stroke-linecap="round"><line x1="378" y1="508" x2="370" y2="520"/><line x1="400" y1="510" x2="400" y2="524"/><line x1="422" y1="508" x2="430" y2="520"/></g>`);
    s.label(130, 440, 'Vertraag sterk\nen stop zo nodig', { size: 18, bg: '#fff' });
    s.label(130, 190, 'Alle richtingaan-\nwijzers knipperen', { size: 18, bg: '#fff' });
    s.label(690, 235, 'Kinderen stappen\nin of uit', { size: 17, bg: '#fff' });
    s.label(690, 450, 'Kijk ook naar\nde stoep naast\nde bus', { size: 17, bg: '#fff' });
  });

mk('schema-overweg-pech', 'Pech op een overweg: eerst uit, dan bellen',
  'Een auto staat stil op de sporen van een overweg met zijn alarmlichten aan. Drie stappen: de inzittenden stappen uit, lopen weg van de sporen naar een veilige plaats achter de slagbomen, en bellen daarna het gratis noodnummer 1711 met de locatie die bij de overweg staat.',
  'openbaar-overweg-pech', (s) => {
    s.titel('Pech op een overweg: eerst uit, dan bellen');
    s.rect(340, 48, 120, 552, C.road);
    s.line(400, 48, 400, 600, '#fff', 3, 'stroke-dasharray="16 14"');
    s.track(0, 330, 800, 330);
    // slagbomen (open: naast de weg) en veilige zone
    s.add(`<rect x="480" y="80" width="290" height="190" rx="18" fill="rgba(31,157,85,.18)" stroke="${GRN}" stroke-width="3" stroke-dasharray="10 8"/>`);
    T(s, 625, 108, 'veilig, ver van de sporen', 17, '#14693a', 700);
    [[462, 258], [462, 402]].forEach(([x, y]) => {
      s.add(`<rect x="${x}" y="${y - 6}" width="12" height="12" rx="2" fill="#555"/><rect x="${x - 78}" y="${y - 5}" width="80" height="10" fill="#fff" stroke="${RED}" stroke-width="2"/>`);
      for (let i = 0; i < 4; i++) s.rect(x - 74 + i * 20, y - 5, 10, 10, RED);
    });
    s.car(400, 330, 0, 'rood', null, { blink: 'W' });
    s.ped(560, 170, null, { color: '#2d4a8a', rot: 270 }); s.ped(610, 200, null, { color: '#8e5bd1', rot: 270 });
    parrow(s, 'M440,340 L520,340 L520,240 L540,200', BLU, 6, '2 12');
    nbadge(s, 400, 262, 1, 17); pill(s, 245, 262, 'Stap uit de auto', { size: 17 });
    nbadge(s, 520, 380, 2, 17); pill(s, 650, 380, 'Weg van de sporen,\nachter de slagbomen', { size: 17 });
    // telefoon
    card(s, 470, 450, 300, 120, { stroke: BLU });
    icon(s, 'phone', 520, 510, 1.15);
    nbadge(s, 572, 468, 3, 16, BLU);
    s.text(650, 505, 'Bel 1711', { size: 26, fill: BLU, weight: 800 });
    s.text(650, 535, 'gratis noodnummer', { size: 15, fill: MUTED, weight: 600 });
    pill(s, 190, 505, 'Geef de locatie door die\nbij de overweg staat', { size: 16 });
  });

// ---- registratie
LIST.sort((a, b) => a.naam.localeCompare(b.naam));
fs.writeFileSync(path.join(ROOT, 'data', 'schemas-extra-b.json'), JSON.stringify(LIST, null, 1) + '\n');
console.log(LIST.length + " extra schema's (b) geschreven");
