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
    sc(s, 570, 165, 1.9, () => s.ped(0, 0, null, { color: '#2d4a8a', rot: 270 })); sc(s, 625, 205, 1.9, () => s.ped(0, 0, null, { color: '#8e5bd1', rot: 270 }));
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

// =====================================================================  HOOFDSTUK 7
mk('schema-rijstrookmarkeringen', 'Rijstrookmarkeringen: drie soorten strepen',
  'Bovenaanzicht van een weg met twee rijrichtingen. Onderaan ligt een onderbroken witte middenlijn (overschrijden mag), daarboven korte dichte strepen die een doorlopende streep aankondigen, en bovenaan een doorlopende witte streep die je niet mag overschrijden. Een blauwe auto rijdt naar boven, een rode auto komt van boven.',
  null, (s) => {
    s.titel('Rijstrookmarkeringen: drie soorten strepen');
    s.rect(260, 48, 280, 552, C.road);
    s.line(260, 48, 260, 600, '#fff', 4); s.line(540, 48, 540, 600, '#fff', 4);
    s.line(400, 420, 400, 600, '#fff', 5, 'stroke-dasharray="30 22"');
    s.line(400, 300, 400, 420, '#fff', 5, 'stroke-dasharray="10 9"');
    s.line(400, 48, 400, 300, '#fff', 5);
    s.car(470, 515, 0, 'blauw', null);
    s.car(330, 150, 180, 'rood', null);
    s.arrow(660, 560, 660, 480, '#fff', 6);
    s.text(660, 585, 'jouw rijrichting', { size: 15, fill: '#fff', weight: 700 });
    s.label(135, 420, 'Onderbroken streep:\noverschrijden mag', { size: 18, bg: GRN, fg: '#fff' });
    s.text(135, 490, 'om in te halen, links af te\nslaan, te keren of van\nrijstrook te veranderen', { size: 14, fill: '#fff', weight: 600 });
    s.label(665, 345, 'Korte, dichte\nstrepen: er volgt\neen doorlopende\nstreep', { size: 17, bg: ORA, fg: '#fff' });
    s.label(135, 190, 'Doorlopende\nstreep: niet\noverschrijden', { size: 18, bg: RED, fg: '#fff' });
    s.text(135, 275, 'en niet links ervan rijden', { size: 14, fill: '#fff', weight: 600 });
  });

mk('schema-rijstrook-kiezen', 'Een rijstrook kiezen: drie situaties',
  'Drie stroken met een weg in zijaanzicht van bovenaf. Eerste: een eenrichtingsrijbaan met drie rijstroken in de bebouwde kom, auto\'s rijden in alle stroken (vrij te kiezen). Tweede: een weg met vier rijstroken en twee richtingen; je kiest vrij maar enkel in je eigen richting. Derde: een gewone weg buiten de bebouwde kom, de auto rijdt zo dicht mogelijk bij de rechterrand.',
  'plaats-rijstroken-bebouwde-kom', (s) => {
    s.titel('Een rijstrook kiezen');
    const tekst = (x, y, titel, sub, kleur) => {
      s.text(x, y, wrap(titel, 24), { size: 17, fill: INK, weight: 700, anchor: 'start' });
      const n = wrap(titel, 24).split('\n').length;
      s.text(x, y + n * 20 + 12, wrap(sub, 26), { size: 16, fill: kleur, weight: 700, anchor: 'start' });
    };
    const panels = [
      { y: 70, t: 'Eenrichtingsrijbaan met rijstroken', sub: 'Vrij te kiezen, in de bebouwde kom', k: GRN, lanes: 3, dir: 'e' },
      { y: 242, t: 'Tweerichtingsrijbaan met minstens vier rijstroken', sub: 'Vrij te kiezen, enkel in je eigen richting', k: GRN, lanes: 4, dir: 'two' },
      { y: 414, t: 'Gewone weg buiten de bebouwde kom', sub: 'Zo dicht mogelijk bij de rechterrand', k: ORA, lanes: 2, dir: 'two' }];
    panels.forEach((p, i) => {
      card(s, 20, p.y, 760, 162);
      tekst(38, p.y + 36, p.t, p.sub, p.k);
      const lh = p.lanes === 4 ? 34 : p.lanes === 3 ? 40 : 44;
      const top = p.y + 81 - (p.lanes * lh) / 2, rx0 = 310, rw = 450;
      if (i === 2) s.rect(rx0, top + p.lanes * lh, rw, 22, C.grass); // berm
      s.rect(rx0, top, rw, p.lanes * lh, C.road);
      for (let l = 1; l < p.lanes; l++) {
        const y = top + l * lh;
        if (p.dir === 'two' && l === p.lanes / 2) s.line(rx0, y, rx0 + rw, y, '#fff', 4);
        else s.line(rx0, y, rx0 + rw, y, '#fff', 3, 'stroke-dasharray="18 14"');
      }
      const K = 0.58;
      const car = (x, lane, rot, kl) => sc(s, x, top + lane * lh + lh / 2, K, () => s.car(0, 0, rot, kl, null), 0);
      const carR = (x, lane, rot, kl) => { sc(s, x, top + lane * lh + lh / 2, K, () => s.car(0, 0, 0, kl, null), rot); };
      if (i === 0) { carR(380, 0, 90, 'rood'); carR(470, 1, 90, 'blauw'); carR(560, 2, 90, 'geel'); carR(650, 0, 90, 'groen'); carR(700, 1, 90, 'paars'); carR(420, 2, 90, 'oranje'); }
      if (i === 1) { carR(380, 0, 270, 'rood'); carR(560, 1, 270, 'wit'); carR(450, 2, 90, 'blauw'); carR(640, 3, 90, 'geel'); carR(700, 0, 270, 'groen'); carR(350, 3, 90, 'paars'); }
      if (i === 2) { sc(s, 430, top + lh + lh / 2 + 9, K, () => s.car(0, 0, 0, 'blauw', null), 90); carR(620, 0, 270, 'rood'); }
      if (i === 2) { s.arrow(500, top + lh + lh / 2 + 9, 540, top + lh + lh / 2 + 9, '#fff', 4); }
    });
  });

mk('schema-ingehaald-worden', 'Word je ingehaald? Naar rechts en niet versnellen',
  'Bovenaanzicht van een weg met twee rijrichtingen. De blauwe auto rijdt op de rechterhelft zo ver mogelijk naar rechts terwijl de rode auto met linker richtingaanwijzer hem links inhaalt. De blauwe auto versnelt niet.',
  null, (s) => {
    s.titel('Je wordt links ingehaald');
    vroad(s, 250, 300);
    s.car(520, 360, 0, 'blauw', null);
    pill(s, 520, 420, 'jij', { size: 17, bg: BLU, fg: '#fff' });
    s.car(330, 440, 0, 'rood', null, { blink: 'L' });
    s.route('M330,380 L330,200 Q330,150 330,80', CAR.rood);
    parrow(s, 'M500,300 L534,300', '#fff', 6);
    s.label(655, 250, 'Wijk zo ver\nmogelijk naar\nrechts', { size: 19, bg: '#fff' });
    s.label(655, 440, 'Versnel niet\nterwijl hij\nvoorbijrijdt', { size: 19, bg: '#fff' });
    s.label(135, 360, 'De auto die inhaalt\nzet zijn linker\nrichtingaanwijzer aan', { size: 17, bg: '#fff' });
  });

mk('schema-richtingaanwijzers-overzicht', 'Wanneer geef je welk sein?',
  'Zes kleine kruispuntschema\'s met een auto en zijn richtingaanwijzer: links inhalen (linker richtingaanwijzer), terugkeren naar rechts na het inhalen (rechter), rechts afslaan (rechter), links afslaan (linker), een rotonde oprijden (geen sein) en een rotonde verlaten (rechter).',
  'richtingaanwijzers-gebruik', (s) => {
    s.titel('Wanneer geef je welk sein?');
    const K = 0.62;
    const kaarten = [
      ['Links inhalen', 'L', 'Sein: links'],
      ['Terugkeren naar rechts', 'R', 'Sein: rechts'],
      ['Rechts afslaan', 'R', 'Sein: rechts'],
      ['Links afslaan', 'L', 'Sein: links'],
      ['Een rotonde oprijden', '', 'Geen sein'],
      ['Een rotonde verlaten', 'R', 'Sein: rechts']];
    kaarten.forEach(([naam, bl, sein], i) => {
      const x0 = 20 + (i % 3) * 262, y0 = 74 + Math.floor(i / 3) * 242;
      card(s, x0, y0, 236, 228);
      const n = s.b.length;
      s.rect(10, 10, 216, 148, C.road, 'rx="10"');
      let car, path, gray;
      if (i === 0) { s.line(120, 10, 120, 158, '#fff', 3, 'stroke-dasharray="14 12"'); car = [150, 122]; gray = [150, 50]; path = 'M150,92 C150,68 90,80 90,34'; }
      if (i === 1) { s.line(120, 10, 120, 158, '#fff', 3, 'stroke-dasharray="14 12"'); car = [90, 82]; gray = [150, 126]; path = 'M90,52 C90,30 150,40 150,16'; }
      if (i === 2) { s.rect(160, 50, 66, 62, C.road2); s.rect(80, 10, 80, 148, C.road); s.line(120, 10, 120, 158, '#fff', 3, 'stroke-dasharray="14 12"'); car = [140, 126]; path = 'M140,96 C140,76 170,82 210,81'; }
      if (i === 3) { s.rect(10, 50, 70, 62, C.road2); s.rect(80, 10, 80, 148, C.road); s.line(120, 10, 120, 158, '#fff', 3, 'stroke-dasharray="14 12"'); car = [140, 126]; path = 'M140,96 C140,78 120,80 90,81 L28,81'; }
      if (i >= 4) {
        s.rect(10, 10, 216, 148, C.grass);
        s.rect(100, 90, 40, 68, C.road); s.circle(120, 74, 52, C.road); s.circle(120, 74, 26, C.grass2, 'stroke="#fff" stroke-width="3"');
        if (i === 5) { s.rect(158, 56, 68, 36, C.road); car = [152, 112]; path = 'M152,86 C164,80 168,76 206,72'; }
        else { car = [120, 134]; path = 'M120,104 C128,98 150,92 150,70'; }
      }
      if (gray) sc(s, gray[0], gray[1], K, () => s.car(0, 0, 0, 'grijs', null));
      sc(s, car[0], car[1], K, () => s.car(0, 0, i === 5 ? 340 : 0, 'blauw', null));
      if (bl) {
        const sx = bl === 'L' ? -1 : 1, cr = i === 5 ? -20 : 0;
        [[sx * 15, -27], [sx * 15, 27]].forEach(([dx, dy]) => {
          const a = cr * Math.PI / 180;
          const px = car[0] + (dx * Math.cos(a) - dy * Math.sin(a)) * K, py = car[1] + (dx * Math.sin(a) + dy * Math.cos(a)) * K;
          s.circle(px, py, 8, '#ffb02e', 'opacity="0.55"'); s.circle(px, py, 4, '#ff9d00', 'stroke="#fff" stroke-width="1.5"');
        });
      }
      parrow(s, path, '#fff', 4, '8 7');
      const parts = s.b.splice(n);
      s.add(`<g transform="translate(${x0} ${y0})">${parts.join('')}</g>`);
      T(s, x0 + 118, y0 + 184, naam, 17, INK, 700);
      pill(s, x0 + 118, y0 + 208, sein, { size: 15, bg: bl === 'L' ? ORA : bl === 'R' ? BLU : '#7b8494', fg: '#fff' });
    });
    s.label(400, 570, 'Een richtingaanwijzer geeft je geen voorrang', { size: 18, bg: '#1c2230', fg: '#fff' });
  }, { bg: PAPER });

mk('schema-voorsorteren', 'Voorsorteren: kies je rijstrook ruim voor het kruispunt',
  'Een eenrichtingsweg met drie rijstroken die naar een kruispunt loopt. Op elke strook staat een pijl op het wegdek: links, rechtdoor en rechts. Een rode auto in de linkerstrook gaat links af met linker richtingaanwijzer, een blauwe auto in het midden rijdt rechtdoor en een gele auto in de rechterstrook gaat rechts af met rechter richtingaanwijzer.',
  'voorsorteren', (s) => {
    s.titel('Voorsorteren: tijdig de juiste rijstrook');
    s.rect(0, 150, 800, 130, C.road);
    s.rect(250, 48, 300, 552, C.road);
    s.line(0, 215, 235, 215, '#fff', 3, 'stroke-dasharray="16 14"'); s.line(565, 215, 800, 215, '#fff', 3, 'stroke-dasharray="16 14"');
    s.line(350, 300, 350, 600, '#fff', 3, 'stroke-dasharray="18 16"'); s.line(450, 300, 450, 600, '#fff', 3, 'stroke-dasharray="18 16"');
    s.rect(250, 296, 300, 6, '#fff');
    const wm = '#fff';
    parrow(s, 'M300,470 L300,430 Q300,405 270,405', wm, 9);
    parrow(s, 'M400,470 L400,395', wm, 9);
    parrow(s, 'M500,470 L500,430 Q500,405 530,405', wm, 9);
    s.route('M300,505 L300,330 Q300,215 200,215 L60,215', CAR.rood);
    s.route('M400,505 L400,70', CAR.blauw);
    s.route('M500,505 L500,330 Q500,215 600,215 L740,215', CAR.geel);
    s.car(300, 545, 0, 'rood', null, { blink: 'L' });
    s.car(400, 545, 0, 'blauw', null);
    s.car(500, 545, 0, 'geel', null, { blink: 'R' });
    s.label(300, 345, 'links', { size: 17, bg: '#fff' }); s.label(400, 345, 'rechtdoor', { size: 17, bg: '#fff' }); s.label(500, 345, 'rechts', { size: 17, bg: '#fff' });
    s.label(125, 450, 'Kies je strook\nruim vóór het\nkruispunt', { size: 18, bg: '#fff' });
    s.label(675, 450, 'Volg de pijlen op\nhet wegdek en de\nborden boven of\nlangs de rijstroken', { size: 17, bg: '#fff' });
  });

mk('schema-rijstrook-wisselen', 'Van rijstrook veranderen: spiegel, sein, schouder, beweeg',
  'Boven vier stappen met pictogrammen: eerst in de spiegel kijken, dan de richtingaanwijzer, dan over de schouder kijken en tot slot van rijstrook veranderen. Onder een weg met twee rijstroken waarop een blauwe auto naar de linkerstrook wil en eerst een rode auto laat voorgaan die al op die strook rijdt.',
  'van-rijstrook-veranderen', (s) => {
    s.titel('Van rijstrook veranderen in vier stappen');
    const stappen = [['Spiegel', 'kijk eerst achter je'], ['Richtingaanwijzer', 'geef tijdig sein'], ['Schouderblik', 'kijk over je schouder'], ['Beweeg', 'als er plaats is']];
    stappen.forEach(([t, sub], i) => {
      const x0 = 20 + i * 192, cx = x0 + 89;
      card(s, x0, 74, 178, 210);
      nbadge(s, x0 + 24, 98, i + 1, 15, INK);
      const cy = 160;
      if (i === 0) {
        G(s, cx, cy, 1.3, `<rect x="-40" y="-26" width="80" height="52" rx="12" fill="#2c2f36"/><rect x="-34" y="-20" width="68" height="40" rx="7" fill="#cfe6f7"/><rect x="-13" y="-8" width="26" height="22" rx="6" fill="${CAR.rood}" stroke="${INK}" stroke-width="2"/><rect x="-9" y="-12" width="18" height="9" rx="3" fill="#b9d3e6"/>`);
      }
      if (i === 1) {
        G(s, cx, cy, 1, `<circle r="40" fill="${ORA}" stroke="${INK}" stroke-width="3"/><path d="M-24,0 L2,-24 L2,-10 L24,-10 L24,10 L2,10 L2,24 Z" fill="#fff"/>`);
      }
      if (i === 2) {
        G(s, cx, cy, 1.2, `<ellipse cx="0" cy="18" rx="40" ry="16" fill="#2d4a8a" stroke="#fff" stroke-width="3"/><circle cx="0" cy="0" r="17" fill="#f1c9a5" stroke="${INK}" stroke-width="3"/><polygon points="-15,-4 -30,6 -12,10" fill="#e8b690" stroke="${INK}" stroke-width="2"/><path d="M-26,-12 L-50,-34 M-34,-4 L-56,-14" stroke="${BLU}" stroke-width="3" stroke-dasharray="5 5" stroke-linecap="round"/>`);
      }
      if (i === 3) {
        sc(s, cx - 14, cy + 6, 0.95, () => s.car(0, 0, 0, 'blauw', null));
        parrow(s, `M${cx - 14},${cy - 32} C${cx - 14},${cy - 52} ${cx + 28},${cy - 44} ${cx + 28},${cy - 66}`, INK, 5);
      }
      T(s, cx, 238, t, 17, INK, 700);
      T(s, cx, 262, sub, 14, MUTED, 600);
    });
    // wegdeel
    s.rect(0, 340, 800, 140, C.road);
    s.line(0, 410, 800, 410, '#fff', 4, 'stroke-dasharray="26 20"');
    s.rect(0, 480, 800, 120, C.grass);
    sc(s, 330, 375, 0.9, () => s.car(0, 0, 0, 'rood', null), 90);
    sc(s, 470, 445, 0.9, () => s.car(0, 0, 0, 'blauw', null, { blink: 'L' }), 90);
    parrow(s, 'M520,445 C580,445 590,375 670,375', '#fff', 6, '12 9');
    s.label(160, 520, 'Geef voorrang aan wie\nop de andere rijstrook rijdt', { size: 17, bg: '#fff' });
    s.label(465, 520, 'Onderbroken streep:\nmag je overschrijden', { size: 17, bg: GRN, fg: '#fff' });
    s.label(670, 520, 'Doorlopende streep:\nniet overschrijden', { size: 17, bg: RED, fg: '#fff' });
  });

mk('schema-parkeerschijf-betalen', 'Blauwe zone en betalend parkeren',
  'Vier kaarten. Blauwe zone: de parkeerschijf ligt achter de voorruit. Betalende zone: je betaalt aan de parkeerautomaat of met een kaart. Defecte parkeerautomaat: je gebruikt de parkeerschijf. Plaats voor personen met een handicap: de speciale kaart achter de voorruit vervangt de schijf.',
  'blauwe-zone-betalend-parkeren', (s) => {
    s.titel('Blauwe zone en betalend parkeren');
    const disc = `<rect x="-36" y="-36" width="72" height="72" rx="9" fill="${BLU}" stroke="#1c3f8a" stroke-width="3"/><circle r="26" fill="#fff"/><g stroke="${INK}" stroke-width="2.5" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => `<line x1="${f(Math.cos(i * Math.PI / 6) * 19)}" y1="${f(Math.sin(i * Math.PI / 6) * 19)}" x2="${f(Math.cos(i * Math.PI / 6) * 24)}" y2="${f(Math.sin(i * Math.PI / 6) * 24)}"/>`).join('')}</g><path d="M0,0 L14,-12" stroke="${RED}" stroke-width="4" stroke-linecap="round"/><circle r="3.5" fill="${RED}"/>`;
    const machine = `<rect x="-30" y="-50" width="60" height="100" rx="9" fill="#6b7280" stroke="${INK}" stroke-width="3"/><rect x="-21" y="-40" width="42" height="26" rx="3" fill="#bfe3b4"/><text x="0" y="-21" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">P</text><rect x="-16" y="-4" width="32" height="8" rx="3" fill="#2c2f36"/><rect x="-14" y="14" width="28" height="22" rx="3" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
    const kaart = `<rect x="-42" y="-28" width="84" height="56" rx="8" fill="${BLU}" stroke="#1c3f8a" stroke-width="3"/><circle cx="-14" cy="-9" r="8" fill="#fff"/><rect x="-22" y="1" width="16" height="18" rx="6" fill="#fff"/><rect x="6" y="-14" width="26" height="6" rx="3" fill="#fff"/><rect x="6" y="-2" width="26" height="6" rx="3" fill="#fff"/><rect x="6" y="10" width="18" height="6" rx="3" fill="#fff"/>`;
    const windscreen = `<path d="M-110,56 L-84,-44 L84,-44 L110,56 Z" fill="#cfe6f7" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="-118" y="56" width="236" height="12" rx="5" fill="#4b5563"/>`;
    const kaarten = [
      ['Blauwe zone', 'Parkeerschijf achter de voorruit', GRN],
      ['Betalende zone', 'Betalen aan de automaat of met een kaart', GRN],
      ['Defecte automaat', 'Gebruik de parkeerschijf', ORA],
      ['Plaats voor personen\nmet een handicap', 'De speciale kaart achter de voorruit\nvervangt de schijf', BLU]];
    kaarten.forEach(([t, sub, kl], i) => {
      const x0 = 20 + (i % 2) * 388, y0 = 76 + Math.floor(i / 2) * 252, cx = x0 + 186, cy = y0 + 66;
      card(s, x0, y0, 372, 238);
      s.add(`<rect x="${x0 + 20}" y="${y0}" width="332" height="6" rx="3" fill="${kl}"/>`);
      if (i === 0) { G(s, cx, cy, 0.95, windscreen); G(s, cx - 56, cy + 14, 0.8, disc); }
      if (i === 1) { G(s, cx - 60, cy, 1, machine); G(s, cx + 60, cy - 6, 0.9, `<rect x="-36" y="-26" width="72" height="50" rx="7" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="-36" y="-14" width="72" height="12" fill="${INK}"/><rect x="-26" y="8" width="30" height="6" rx="3" fill="#8d96a6"/>`); }
      if (i === 2) { G(s, cx - 56, cy, 1, machine); bigCross(s, cx - 56, cy, 56); parrow(s, `M${cx - 8},${cy} L${cx + 26},${cy}`, INK, 5); G(s, cx + 76, cy, 0.9, disc); }
      if (i === 3) { G(s, cx, cy, 0.95, windscreen); G(s, cx - 10, cy + 8, 0.9, kaart); }
      s.text(cx, y0 + 164, t, { size: 19, fill: INK, weight: 700 });
      const n = t.split('\n').length;
      s.text(cx, y0 + 164 + n * 22 + 2, sub, { size: 15, fill: MUTED, weight: 600 });
    });
  }, { bg: PAPER });

mk('schema-keren', 'Keren: waar mag het en waar niet?',
  'Drie wegdelen met een keerbeweging van een auto. Over een onderbroken witte streep is keren toegelaten (groen vinkje). Over een doorlopende witte streep niet (rood kruis). Op een autosnelweg of autoweg is keren altijd verboden (rood kruis).',
  'keren-achteruitrijden', (s) => {
    s.titel('Keren: waar mag het en waar niet?');
    const uturn = (cx, kleur, ok) => {
      s.car(cx + 32, 440, 0, 'blauw', null);
      parrow(s, `M${cx + 32},395 L${cx + 32},290 C${cx + 32},200 ${cx - 32},200 ${cx - 32},290 L${cx - 32},370`, kleur, 7);
      mark(s, cx, 150, ok, 22);
    };
    [0, 1, 2].forEach((i) => {
      const x0 = 18 + i * 264, cx = x0 + 122;
      card(s, x0, 70, 244, 515);
      s.rect(x0 + 8, 78, 228, 380, C.grass, 'rx="10"');
      if (i < 2) {
        s.rect(cx - 70, 78, 140, 380, C.road);
        s.line(cx - 70, 78, cx - 70, 458, '#fff', 3); s.line(cx + 70, 78, cx + 70, 458, '#fff', 3);
        if (i === 0) s.line(cx, 78, cx, 458, '#fff', 4, 'stroke-dasharray="22 16"');
        else s.line(cx, 78, cx, 458, '#fff', 5);
        uturn(cx, i === 0 ? GRN : RED, i === 0);
      } else {
        s.rect(cx - 90, 78, 70, 380, C.road); s.rect(cx + 20, 78, 70, 380, C.road);
        s.line(cx - 55, 78, cx - 55, 458, '#fff', 3, 'stroke-dasharray="22 16"'); s.line(cx + 55, 78, cx + 55, 458, '#fff', 3, 'stroke-dasharray="22 16"');
        s.car(cx + 55, 440, 0, 'blauw', null);
        parrow(s, `M${cx + 55},395 L${cx + 55},295 C${cx + 55},205 ${cx - 55},205 ${cx - 55},295 L${cx - 55},370`, RED, 7);
        mark(s, cx, 150, false, 22);
        s.sign('F5', x0 + 40, 118, 46, { pole: false });
      }
      const titel = ['Onderbroken streep', 'Doorlopende streep', 'Autosnelweg en autoweg'][i];
      const sub = ['Keren is toegelaten, met voorrang aan iedereen', 'Keren is niet toegelaten', 'Keren is altijd verboden'][i];
      T(s, x0 + 122, 500, titel, i === 2 ? 17 : 19, INK, 700);
      s.text(x0 + 122, 528, wrap(sub, 26), { size: 16, fill: i === 0 ? '#14693a' : '#a52a2a', weight: 700 });
    });
  }, { bg: PAPER });

// ---- tijdlijn "Wat verandert er in 2027?" (hoofdstuk 7, 8 en 9)
function tijdlijn(naam, onderwerpen, tb) {
  mk(naam, 'De nieuwe wegcode begint op 1 juni 2027',
    'Een tijdlijn. Tot 1 juni 2027 gelden de regels uit dit boek. De nieuwe Code van de openbare weg was voorzien voor 1 september 2026 en is uitgesteld tot 1 juni 2027. Onderaan staan de onderwerpen waarop de nieuwe code iets verandert.',
    tb, (s) => {
      s.titel('Wat verandert er in 2027?');
      const y = 215;
      s.rect(70, y - 9, 400, 18, BLU, 'rx="9"');
      s.add(`<path d="M470,${y - 9} H690 L730,${y} L690,${y + 9} H470 Z" fill="${ORA}"/>`);
      s.circle(70, y, 16, '#fff', `stroke="${BLU}" stroke-width="6"`);
      s.circle(470, y, 22, '#fff', `stroke="${INK}" stroke-width="7"`);
      T(s, 70, y + 52, 'Nu', 20, BLU, 800);
      T(s, 470, y + 62, '1 juni 2027', 22, INK, 800);
      pill(s, 250, y + 125, 'Tot 1 juni 2027 gelden\nde regels uit dit boek', { size: 18, bg: BLU, fg: '#fff' });
      pill(s, 620, y + 125, 'Daarna geldt de nieuwe Code\nvan de openbare weg', { size: 18, bg: ORA, fg: '#fff' });
      // oorspronkelijke datum
      s.circle(250, y, 11, '#fff', `stroke="#8d96a6" stroke-width="5"`);
      T(s, 250, y + 46, '1 september 2026', 16, MUTED, 700);
      T(s, 250, y + 66, 'oorspronkelijk gepland', 14, MUTED, 600);
      parrow(s, `M250,${y - 20} C250,${y - 120} 450,${y - 120} 462,${y - 30}`, '#8d96a6', 4, '8 7');
      s.add(`<text x="356" y="${y - 98}" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="700" fill="${MUTED}" text-anchor="middle">uitgesteld</text>`);
      // onderwerpen
      card(s, 40, 385, 720, 150);
      T(s, 400, 420, 'Onderwerpen waarop de nieuwe code iets verandert', 19, INK, 700);
      const n = onderwerpen.length, per = n > 3 ? 2 : n, rows = Math.ceil(n / per);
      onderwerpen.forEach((o, i) => {
        const r = Math.floor(i / per), c = i % per, cnt = Math.min(per, n - r * per);
        const w = 680 / cnt, cx = 60 + c * w + w / 2 - 0, cy = 462 + r * 50;
        pill(s, 40 + (720 - w * cnt) / 2 + c * w + w / 2, cy, o, { size: 18, bg: '#eef3ff', fg: '#1c3f8a', stroke: '#9db7ee' });
      });
      pill(s, 400, 568, 'Voor het examen leer je de regels zoals ze nu gelden', { size: 17, bg: '#1c2230', fg: '#fff' });
    }, { bg: PAPER });
}
tijdlijn('schema-nieuwe-wegcode-2027-plaats', ['Beurtelings parkeren', 'Verbod links in te halen', 'Tripleren', 'Motorfiets op de reddingsstrook']);

// =====================================================================  HOOFDSTUK 8
mk('schema-snelweg-toegang', 'Wie mag op de autosnelweg en de autoweg?',
  'Twee kaarten naast elkaar. Autosnelweg: toegelaten zijn motorvoertuigen die 70 km/u kunnen halen; voetgangers, fietsers, bromfietsers, dieren en landbouwvoertuigen zijn niet toegelaten (rode doorstreepte pictogrammen). Autoweg: toegelaten zijn motorvoertuigen en hun aanhangwagens; bromfietsen, landbouwvoertuigen en vierwielers zonder passagiersruimte zijn niet toegelaten.',
  'snelweg-toegelaten-voertuigen', (s) => {
    s.titel('Wie mag er op?', 'Je rijdt er enkel op en af op de ingerichte plaatsen');
    const nietIcoon = (x, y, naam, lbl, k) => {
      s.circle(x, y, 34, '#fff', `stroke="${EDGE}" stroke-width="2"`);
      G(s, x, y + 2, k * 0.82, ICON[naam]());
      ban(s, x, y, 34);
      s.text(x, y + 56, lbl, { size: 14, fill: INK, weight: 700 });
    };
    const kolommen = [
      { x0: 20, bord: 'F5', naam: 'Autosnelweg', toe: 'Motorvoertuigen die\n70 km/u kunnen halen', niet: [['person', 'Voetgangers', 0.62], ['bike', 'Fietsers', 0.5], ['moped', 'Bromfietsers', 0.5], ['cow', 'Dieren', 0.5], ['tractor', 'Landbouw-\nvoertuigen', 0.5]] },
      { x0: 408, bord: 'F9', naam: 'Autoweg', toe: 'Motorvoertuigen en\nhun aanhangwagens', niet: [['moped', 'Bromfietsen', 0.5], ['tractor', 'Landbouw-\nvoertuigen', 0.5], ['quad', 'Vierwielers zonder\npassagiersruimte', 0.5]] }];
    kolommen.forEach((k) => {
      card(s, k.x0, 76, 372, 510);
      s.sign(k.bord, k.x0 + 52, 130, 64, { pole: false });
      s.text(k.x0 + 98, 140, k.naam, { size: 26, fill: INK, weight: 800, anchor: 'start' });
      pill(s, k.x0 + 70, 200, 'Toegelaten', { size: 17, bg: GRN, fg: '#fff' });
      G(s, k.x0 + 70, 258, 0.95, ICON.car('#2f6fd6'));
      s.text(k.x0 + 135, 256, k.toe, { size: 17, fill: INK, weight: 700, anchor: 'start' });
      pill(s, k.x0 + 84, 336, 'Niet toegelaten', { size: 17, bg: RED, fg: '#fff' });
      k.niet.forEach(([ic, lbl, sk], i) => {
        const per = 3, r = Math.floor(i / per), c = i % per, cnt = Math.min(per, k.niet.length - r * per);
        const x = k.x0 + 186 + (c - (cnt - 1) / 2) * 118, y = 408 + r * 112;
        nietIcoon(x, y, ic, lbl, sk);
      });
    });
  }, { bg: PAPER });

mk('schema-snelweg-rijstroken', 'Autosnelweg: rijstroken en inhalen',
  'Bovenaanzicht van een autosnelweg met drie rijstroken. Een blauwe personenwagen haalt een gele auto links in en keert daarna terug naar de rechterstrook. In de middelste strook rijdt een vrachtwagen (toegelaten); in de linkerstrook staat een vrachtwagen met een rood kruis: die mag daar niet rijden.',
  'snelweg-rijstroken-inhalen', (s) => {
    s.titel('Autosnelweg: rechts rijden, links inhalen');
    s.rect(50, 48, 300, 552, C.road);
    s.line(50, 48, 50, 600, '#fff', 4); s.line(350, 48, 350, 600, '#fff', 4);
    s.line(150, 48, 150, 600, '#fff', 3, 'stroke-dasharray="22 18"'); s.line(250, 48, 250, 600, '#fff', 3, 'stroke-dasharray="22 18"');
    s.label(100, 95, 'links', { size: 16 }); s.label(200, 95, 'midden', { size: 16 }); s.label(300, 95, 'rechts', { size: 16 });
    s.truck(200, 260, 0, null);
    mark(s, 262, 215, true, 15);
    s.truck(100, 470, 0, null);
    bigCross(s, 100, 470, 56);
    s.car(300, 320, 0, 'geel', null);
    s.car(300, 530, 0, 'blauw', null, { blink: 'L' });
    s.route('M300,490 C300,420 100,430 100,360 L100,200 C100,140 300,150 300,100', CAR.blauw);
    card(s, 385, 70, 405, 520, { fill: 'rgba(255,255,255,.95)' });
    const regels = [
      [GRN, 'Personenwagen', 'Rechterrijstrook. Links enkel om in te halen, daarna terug naar rechts.'],
      [ORA, 'Bus, autocar en voertuigen boven 3,5 ton', 'Bij drie of meer rijstroken enkel de twee rechtse rijstroken.'],
      [RED, 'Middenstrookrijden', 'Op de middelste strook blijven rijden terwijl rechts vrij is, is een overtreding.']];
    regels.forEach(([kl, t, sub], i) => {
      const y0 = 92 + i * 160;
      s.add(`<rect x="402" y="${y0}" width="8" height="132" rx="4" fill="${kl}"/>`);
      s.text(424, y0 + 26, wrap(t, 28), { size: 19, fill: INK, weight: 800, anchor: 'start' });
      const n = wrap(t, 28).split('\n').length;
      s.text(424, y0 + 26 + n * 23 + 8, wrap(sub, 32), { size: 16, fill: MUTED, weight: 600, anchor: 'start' });
    });
  });

mk('schema-snelweg-ritsen-file', 'Ritsen, oprit en file: drie situaties',
  'Drie kleine scènes. Links: een rijstrook eindigt en het verkeer is sterk vertraagd, dus de auto\'s ritsen en voegen beurtelings in. Midden: een auto op een oprit verleent voorrang aan het verkeer op de autosnelweg (bord voorrang verlenen). Rechts: bij file op twee rijstroken vormen de auto\'s een reddingsstrook waar een ziekenwagen doorrijdt.',
  'snelweg-ritsen-file', (s) => {
    s.titel('Ritsen, oprit en file');
    const titels = [['Rijstrook eindigt', 'Sterk vertraagd verkeer: ritsen, om beurten invoegen'], ['Je rijdt de autosnelweg op', 'Niet ritsen: voorrang verlenen aan wie er al rijdt'], ['File op twee of meer rijstroken', 'Een reddingsstrook vormen']];
    [0, 1, 2].forEach((i) => {
      const x0 = 18 + i * 264, cx = x0 + 122;
      card(s, x0, 70, 244, 520);
      s.rect(x0 + 8, 78, 228, 380, C.grass, 'rx="10"');
      if (i === 0) {
        s.rect(cx - 70, 78, 140, 380, C.road);
        s.add(`<polygon points="${cx - 70},260 ${cx},170 ${cx},78 ${cx - 70},78" fill="${C.grass}"/>`);
        s.line(cx, 170, cx, 458, '#fff', 3, 'stroke-dasharray="16 12"');
        s.add(`<path d="M${cx - 70},260 L${cx},170" stroke="#fff" stroke-width="4"/>`);
        sc(s, cx + 35, 120, 0.8, () => s.car(0, 0, 0, 'rood', null));
        sc(s, cx - 35, 245, 0.8, () => s.car(0, 0, 0, 'blauw', null));
        parrow(s, `M${cx - 35},210 Q${cx - 35},180 ${cx + 25},170`, '#fff', 4, '8 7');
        sc(s, cx + 35, 330, 0.8, () => s.car(0, 0, 0, 'geel', null));
        sc(s, cx - 35, 400, 0.8, () => s.car(0, 0, 0, 'groen', null));
        s.label(x0 + 62, 150, 'strook\neindigt', { size: 14 });
      }
      if (i === 1) {
        s.rect(cx - 50, 78, 100, 380, C.road);
        s.rect(cx + 50, 290, 62, 168, C.road);
        s.add(`<polygon points="${cx + 112},290 ${cx + 50},225 ${cx + 50},290" fill="${C.road}"/>`);
        s.line(cx, 78, cx, 458, '#fff', 3, 'stroke-dasharray="16 12"');
        sc(s, cx + 25, 330, 0.8, () => s.car(0, 0, 0, 'groen', null));
        sc(s, cx + 80, 410, 0.8, () => s.car(0, 0, 0, 'blauw', null));
        s.sign('B1', cx - 95, 400, 50);
        s.label(cx - 62, 160, 'verkeer op de\nautosnelweg', { size: 14 });
      }
      if (i === 2) {
        s.rect(cx - 70, 78, 140, 380, C.road);
        s.line(cx, 78, cx, 458, '#fff', 3, 'stroke-dasharray="16 12"');
        s.rect(cx - 36, 78, 72, 380, 'rgba(255,214,64,.28)', 'stroke="#f2c230" stroke-width="3" stroke-dasharray="12 8"');
        [130, 240, 350].forEach((y, j) => {
          sc(s, cx - 53, y, 0.8, () => s.car(0, 0, 0, ['rood', 'wit', 'groen'][j], null));
          sc(s, cx + 53, y + 40, 0.8, () => s.car(0, 0, 0, ['blauw', 'paars', 'grijs'][j], null));
        });
        sc(s, cx, 420, 0.85, () => s.ambulance(0, 0, 0, null));
      }
      T(s, x0 + 122, 494, wrap(titels[i][0], 24).split('\n')[0], 17, INK, 700);
      const rest = wrap(titels[i][0], 24).split('\n').slice(1).join(' ');
      let y = 494; if (rest) { y += 20; T(s, x0 + 122, y, rest, 17, INK, 700); }
      s.text(x0 + 122, y + 26, wrap(titels[i][1], 28), { size: 15, fill: MUTED, weight: 600 });
    });
  }, { bg: PAPER });

mk('schema-snelweg-verboden', 'Wat is op de autosnelweg en autoweg verboden?',
  'Vier verbodskaarten met een rode doorgestreepte cirkel: keren, achteruit rijden of tegen de rijrichting in rijden, stilstaan of parkeren, en een dwarsverbinding gebruiken. Onderaan staat dat je bij een gemiste afrit doorrijdt tot de volgende.',
  'snelweg-verboden-manoeuvres', (s) => {
    s.titel('Verboden op autosnelweg en autoweg');
    const kaarten = [
      ['Keren', 'Altijd verboden', 'keren'],
      ['Achteruit rijden of\ntegen de rijrichting in', 'Altijd verboden', 'achteruit'],
      ['Stilstaan of parkeren', 'Enkel op parkeerstroken waar parkeren is toegelaten', 'parkeren'],
      ['Een dwarsverbinding\ngebruiken', 'Niet toegelaten', 'dwars']];
    kaarten.forEach(([t, sub, soort], i) => {
      const x0 = 20 + (i % 2) * 388, y0 = 72 + Math.floor(i / 2) * 238, cx = x0 + 90, cy = y0 + 108;
      card(s, x0, y0, 372, 224);
      s.circle(cx, cy, 70, '#fff', `stroke="${EDGE}" stroke-width="2"`);
      if (soort === 'keren') parrow(s, `M${cx - 22},${cy + 42} L${cx - 22},${cy - 8} C${cx - 22},${cy - 52} ${cx + 22},${cy - 52} ${cx + 22},${cy - 8} L${cx + 22},${cy + 20}`, INK, 10);
      if (soort === 'achteruit') parrow(s, `M${cx},${cy - 40} L${cx},${cy + 38}`, INK, 12);
      if (soort === 'parkeren') { G(s, cx, cy + 14, 0.62, ICON.car('#2f6fd6')); s.add(`<rect x="${cx - 22}" y="${cy - 52}" width="44" height="44" rx="8" fill="${BLU}"/>`); T(s, cx, cy - 18, 'P', 36, '#fff', 800); }
      if (soort === 'dwars') {
        s.add(`<g transform="translate(${cx} ${cy})"><rect x="-52" y="-52" width="40" height="104" fill="${C.road}"/><rect x="12" y="-52" width="40" height="104" fill="${C.road}"/><rect x="-12" y="-52" width="24" height="104" fill="${C.grass}"/><rect x="-14" y="-9" width="28" height="18" fill="${C.road}"/></g>`);
        s.add(`<circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="#fff" stroke-width="10"/>`);
        s.add(`<circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="${EDGE}" stroke-width="2"/>`);
      }
      ban(s, cx, cy, 70);
      const tt = wrap(t.split('\n').join(' '), 15);
      s.text(x0 + 178, y0 + 70, tt, { size: 20, fill: INK, weight: 800, anchor: 'start' });
      const n = tt.split('\n').length;
      s.text(x0 + 178, y0 + 70 + n * 24 + 8, wrap(sub, 20), { size: 16, fill: '#a52a2a', weight: 700, anchor: 'start' });
    });
    pill(s, 400, 568, 'Afrit gemist? Rij door tot de volgende afrit', { size: 19, bg: '#1c2230', fg: '#fff' });
  }, { bg: PAPER });

mk('schema-pech-snelweg', 'Pech op de autosnelweg: vijf stappen',
  'Bovenaanzicht van een autosnelweg met pechstrook en vangrail. Een auto staat op de pechstrook met alarmlichten aan. Een gevarendriehoek staat minstens 100 meter achter de auto. De bestuurder is uitgestapt aan de kant van de vangrail met een fluohesje en staat ver van de rijbaan. Links staat de lijst met de vijf stappen, de laatste is 112 bellen.',
  'snelweg-pech', (s) => {
    s.titel('Pech op de autosnelweg');
    card(s, 12, 66, 245, 524);
    const stappen = ['Alarmlichten en fluohesje aan', 'Zo ver mogelijk naar rechts, bij voorkeur op de pechstrook', 'Uitstappen aan de kant van de vangrail, ver van de rijbaan', 'Gevarendriehoek op minstens 100 meter achter je voertuig', 'Bel 112'];
    stappen.forEach((t, i) => {
      const y = 112 + i * 100;
      nbadge(s, 42, y, i + 1, 16);
      s.text(68, y - 6, wrap(t, 20), { size: 16, fill: INK, weight: 700, anchor: 'start' });
    });
    s.rect(270, 48, 160, 552, C.road);
    s.rect(430, 48, 70, 552, '#6b717c');
    s.line(270, 48, 270, 600, '#fff', 4); s.line(430, 48, 430, 600, '#fff', 4);
    s.line(350, 48, 350, 600, '#fff', 3, 'stroke-dasharray="22 18"');
    s.line(520, 48, 520, 600, '#8d949e', 7, 'stroke-dasharray="3 22"');
    s.line(520, 48, 520, 600, '#b7bcc4', 3);
    s.car(465, 300, 0, 'rood', null, { blink: 'W' });
    nbadge(s, 440, 262, 1, 14); nbadge(s, 497, 340, 2, 14);
    // gevarendriehoek
    s.add(`<g transform="translate(465 510)"><polygon points="0,-24 24,18 -24,18" fill="#fff" stroke="${RED}" stroke-width="7" stroke-linejoin="round"/></g>`);
    nbadge(s, 440, 535, 4, 14);
    s.add(`<g stroke="#fff" stroke-width="3"><line x1="486" y1="335" x2="486" y2="500"/><line x1="478" y1="335" x2="494" y2="335"/><line x1="478" y1="500" x2="494" y2="500"/></g>`);
    pill(s, 650, 440, 'minstens\n100 meter', { size: 18 });
    s.line(536, 418, 596, 430, '#fff', 3, 'stroke-dasharray="5 6"');
    // persoon achter vangrail
    G(s, 600, 262, 0.8, ICON.person('#f0b429'));
    nbadge(s, 645, 215, 3, 14);
    pill(s, 680, 330, 'Uitstappen aan de\nkant van de vangrail', { size: 16 });
    card(s, 560, 505, 225, 80, { stroke: BLU });
    icon(s, 'phone', 596, 545, 0.7);
    nbadge(s, 632, 523, 5, 14, BLU);
    s.text(700, 560, 'Bel 112', { size: 28, fill: BLU, weight: 800 });
    parrow(s, 'M310,560 L310,490', '#fff', 6);
    s.text(310, 585, 'verkeer', { size: 14, fill: '#fff', weight: 700 });
  });

tijdlijn('schema-nieuwe-wegcode-2027-snelweg', ['Motorfiets op de reddingsstrook', 'Gevarendriehoek bij pech']);

// ---- registratie
LIST.sort((a, b) => a.naam.localeCompare(b.naam));
fs.writeFileSync(path.join(ROOT, 'data', 'schemas-extra-b.json'), JSON.stringify(LIST, null, 1) + '\n');
console.log(LIST.length + " extra schema's (b) geschreven");
