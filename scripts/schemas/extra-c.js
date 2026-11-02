'use strict';
// Extra illustraties (hoofdstukken 10, 11 en 12: ongeval, rijbewijs, techniek).
// Genereert site/img/schemas/schema-*.svg en data/schemas-extra-c.json.
// Gebruik: node scripts/schemas/extra-c.js
// Regels: alleen feiten uit data/boek (h10-h12); geen bordcodes in zichtbare tekst;
// lampjes waarvan de kleur per bron verschilt worden neutraal getekend ("kleur kan verschillen").
const fs = require('fs');
const path = require('path');
const lib = require('./lib');
const { Svg, C, esc, f, ROOT } = lib;

const INK = '#1c2230', RED = '#d63a3a', GRN = '#2f9e5a', ORG = '#f08a1c', BLU = '#2f6fd6', YEL = '#f2c230';
const SKIN = '#f1c9a5', GREY = '#8a8f98', LG = '#e6e8ec', GLASS = '#cfe6f7', MUTE = '#4d5668', PAPER = '#fffdf7', SOFT = '#f3f0e6', LINE = '#d9d4c4';
const FONTF = 'font-family="Segoe UI, Helvetica, Arial, sans-serif"';
const REG = [];

// ---------- tekstmeting (benadering) en omslag ----------
function tw(str, size, weight = 600) {
  let w = 0;
  for (const ch of String(str)) {
    if (" .,:;'|!ijl".includes(ch)) w += 0.29;
    else if ('ftrI()-/'.includes(ch)) w += 0.39;
    else if ('mwMW%@'.includes(ch)) w += 0.88;
    else if (ch >= 'A' && ch <= 'Z') w += 0.65;
    else if (ch >= '0' && ch <= '9') w += 0.57;
    else w += 0.54;
  }
  return w * size * (weight >= 700 ? 1.05 : 1);
}
function wrap(str, maxW, size, weight = 600) {
  const out = [];
  for (const par of String(str).split('\n')) {
    let cur = '';
    for (const wd of par.split(' ')) {
      const t = cur ? cur + ' ' + wd : wd;
      if (cur && tw(t, size, weight) > maxW) { out.push(cur); cur = wd; } else cur = t;
    }
    out.push(cur);
  }
  return out;
}
// tekst, met omslag; geeft onderrand (y) terug
function tx(s, x, y, str, o = {}) {
  const size = o.size || 17, weight = o.weight || 500, lh = o.lh || 1.22;
  const lines = o.maxW ? wrap(str, o.maxW, size, weight) : String(str).split('\n');
  const anchor = o.anchor || 'middle';
  const tspans = lines.map((l, i) => `<tspan x="${f(x)}" dy="${i === 0 ? 0 : f(size * lh)}">${esc(l)}</tspan>`).join('');
  s.add(`<text x="${f(x)}" y="${f(y)}" ${FONTF} font-size="${size}" font-weight="${weight}" fill="${o.fill || INK}" text-anchor="${anchor}">${tspans}</text>`);
  return y + (lines.length - 1) * size * lh;
}
const nlines = (str, maxW, size, weight) => wrap(str, maxW, size, weight).length;

// ---------- basis ----------
function make(naam, title, desc, h, o = {}) {
  const s = new Svg(naam, title, desc, { w: 800, h, bg: o.bg || PAPER });
  s.titel(title, o.sub);
  s.top = o.sub ? 66 : 48;
  return s;
}
function card(s, x, y, w, h, o = {}) {
  s.add(`<rect x="${f(x + 2)}" y="${f(y + 4)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 14}" fill="#1c2230" opacity=".10"/>`);
  s.add(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 14}" fill="${o.fill || '#fff'}" stroke="${o.stroke || LINE}" stroke-width="${o.sw || 2}"/>`);
}
function badge(s, x, y, n, col = INK, r = 15) {
  s.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${col}" stroke="#fff" stroke-width="2.5"/>`);
  tx(s, x, y + r * 0.37, String(n), { size: r * 1.15, weight: 800, fill: '#fff' });
}
function chevron(s, x, y, col = GREY) { s.add(`<path d="M${f(x - 5)} ${f(y - 11)} L${f(x + 6)} ${f(y)} L${f(x - 5)} ${f(y + 11)}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`); }
function pill(s, cx, cy, text, o = {}) {
  const size = o.size || 16, w = tw(text, size, 700) + 26, h = size + 14;
  s.add(`<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${h / 2}" fill="${o.fill || INK}"/>`);
  tx(s, cx, cy + size * 0.35, text, { size, weight: 700, fill: o.fg || '#fff' });
  return w;
}
// banner onderaan: kleurbalk met 1-2 regels tekst; geeft onderrand terug
function banner(s, y, text, col = INK, o = {}) {
  const size = o.size || 18, maxW = (o.w || 744) - 36, lines = wrap(text, maxW, size, 700);
  const h = lines.length * size * 1.22 + 22;
  s.add(`<rect x="${o.x || 28}" y="${f(y)}" width="${o.w || 744}" height="${f(h)}" rx="12" fill="${col}"/>`);
  tx(s, (o.x || 28) + (o.w || 744) / 2, y + 11 + size * 0.95, text, { size, weight: 700, fill: o.fg || '#fff', maxW });
  return y + h;
}
function pic(s, name, cx, cy, size = 64, arg) {
  const g = PIC[name];
  if (!g) throw new Error('pictogram ontbreekt: ' + name);
  s.add(`<g transform="translate(${f(cx - size / 2)} ${f(cy - size / 2)}) scale(${f(size / 100)})">${g(arg)}</g>`);
}
function tick(s, x, y, ok = true, r = 13) {
  if (ok) {
    s.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${GRN}"/><path d="M${f(x - r * 0.45)} ${f(y)} L${f(x - r * 0.1)} ${f(y + r * 0.38)} L${f(x + r * 0.5)} ${f(y - r * 0.38)}" fill="none" stroke="#fff" stroke-width="${r * 0.28}" stroke-linecap="round" stroke-linejoin="round"/>`);
  } else {
    s.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${RED}"/><path d="M${f(x - r * 0.4)} ${f(y - r * 0.4)} L${f(x + r * 0.4)} ${f(y + r * 0.4)} M${f(x + r * 0.4)} ${f(y - r * 0.4)} L${f(x - r * 0.4)} ${f(y + r * 0.4)}" fill="none" stroke="#fff" stroke-width="${r * 0.28}" stroke-linecap="round"/>`);
  }
}

// rij kaarten: items {n,pic,kop,tekst,kleur,fill}; geeft {bottom,H,w,xs}
function cards(s, y, items, o = {}) {
  const n = items.length, gap = o.gap == null ? 14 : o.gap, x0 = o.x == null ? 28 : o.x, W = o.w || 744;
  const w = (W - gap * (n - 1)) / n, pad = 12, hs = o.headSize || 19, bs = o.bodySize || 16, picH = o.pic == null ? 64 : o.pic;
  const m = items.map((it) => ({ hl: wrap(it.kop || '', w - 2 * pad, hs, 700), bl: it.tekst ? wrap(it.tekst, w - 2 * pad, bs, 500) : [] }));
  let H = 0;
  items.forEach((it, i) => {
    const top = (it.n != null ? 14 : 10) + (it.pic || it.picFn ? picH + 8 : 0);
    const hh = top + m[i].hl.length * hs * 1.2 + (m[i].bl.length ? 6 + m[i].bl.length * bs * 1.24 : 0) + pad + 2;
    H = Math.max(H, hh);
  });
  if (o.minH) H = Math.max(H, o.minH);
  const xs = [];
  items.forEach((it, i) => {
    const x = x0 + i * (w + gap);
    xs.push(x);
    card(s, x, y, w, H, { fill: it.fill || '#fff', stroke: it.kleur ? it.kleur : LINE, sw: it.kleur ? 3 : 2 });
    let cy = y + (it.n != null ? 14 : 10);
    if (it.pic) pic(s, it.pic, x + w / 2, cy + picH / 2, picH, it.picArg);
    if (it.picFn) it.picFn(s, x + w / 2, cy + picH / 2, picH);
    if (it.pic || it.picFn) cy += picH + 8;
    let by = tx(s, x + w / 2, cy + hs * 0.95, it.kop || '', { size: hs, weight: 700, maxW: w - 2 * pad, fill: it.kleur || INK });
    if (m[i].bl.length) tx(s, x + w / 2, by + 6 + bs * 1.05, it.tekst, { size: bs, weight: 500, maxW: w - 2 * pad, fill: MUTE });
    if (it.n != null) badge(s, x + 20, y + 20, it.n, it.kleur || INK);
    if (o.arrows && i < n - 1) chevron(s, x + w + gap / 2, y + H / 2);
  });
  return { bottom: y + H, H, w, xs };
}
// paneel met kopbalk en rijen {pic?,ok?,tekst}; geeft onderrand
function panel(s, x, y, w, o) {
  const size = o.size || 17, iconW = 44, pad = 14;
  const rows = o.rows.map((r) => ({ ...r, lines: wrap(r.tekst, w - 2 * pad - iconW - 4, size, 500) }));
  const rh = rows.map((r) => Math.max(40, r.lines.length * size * 1.22 + 16));
  const kopLines = wrap(o.kop, o.hpic ? w - 80 : w - 24, 20, 700);
  const hh = Math.max(kopLines.length * 24 + 16, o.hpic ? 52 : 0);
  const H = hh + rh.reduce((a, b) => a + b, 0) + 8 + (o.minH ? 0 : 0);
  const Hh = Math.max(H, o.minH || 0);
  card(s, x, y, w, Hh, { fill: o.fill || '#fff', stroke: o.kleur || LINE, sw: 2.5 });
  s.add(`<path d="M${f(x)} ${f(y + hh)} V${f(y + 14)} Q${f(x)} ${f(y)} ${f(x + 14)} ${f(y)} H${f(x + w - 14)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + 14)} V${f(y + hh)} Z" fill="${o.kleur || INK}"/>`);
  if (o.hpic) {
    s.add(`<circle cx="${f(x + 34)}" cy="${f(y + hh / 2)}" r="22" fill="#fff"/>`);
    pic(s, o.hpic, x + 34, y + hh / 2, 32, o.hpicArg);
    tx(s, x + 34 + 22 + (w - 56) / 2, y + hh / 2 + 7, o.kop, { size: 20, weight: 700, fill: '#fff', maxW: w - 80 });
  } else tx(s, x + w / 2, y + 8 + 19, o.kop, { size: 20, weight: 700, fill: '#fff', maxW: w - 24 });
  let cy = y + hh + 4;
  rows.forEach((r, i) => {
    const mid = cy + rh[i] / 2;
    if (r.ok != null) tick(s, x + pad + iconW / 2, mid, r.ok, 13);
    else if (r.pic) pic(s, r.pic, x + pad + iconW / 2, mid, 38, r.picArg);
    tx(s, x + pad + iconW + 4, mid - (r.lines.length - 1) * size * 0.61 + size * 0.34, r.tekst, { size, weight: r.vet ? 700 : 500, anchor: 'start', maxW: w - 2 * pad - iconW - 4 });
    cy += rh[i];
    if (i < rows.length - 1) s.add(`<line x1="${f(x + pad)}" y1="${f(cy)}" x2="${f(x + w - pad)}" y2="${f(cy)}" stroke="${LINE}" stroke-width="1.5"/>`);
  });
  return y + Hh;
}
// registratie
function done(s, meta) {
  const e = s.finish({ theorieblok: meta.blok, bronnen: meta.bron || ['ONGE-001'], type: 'uitleg' });
  REG.push(e);
  return e;
}
const star = (cx, cy, R, r) => { let p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; p.push(f(cx + rr * Math.cos(a)) + ',' + f(cy + rr * Math.sin(a))); } return p.join(' '); };

// ---------- pictogrammen (100x100) ----------
const sk = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const person = (x, y, k, col) => `<g transform="translate(${x} ${y}) scale(${k})"><circle cx="0" cy="-30" r="11" fill="${SKIN}" ${sk(3 / k)}/><path d="M-22 22 V-6 A22 22 0 0 1 22 -6 V22 Z" fill="${col}" ${sk(3 / k)}/></g>`;
const lampSym = {
  olie: `<g fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27 H44 V47 a3 3 0 0 1-3 3 H19 a3 3 0 0 1-3-3 Z"/><path d="M44 31 H52 L58 24"/><path d="M16 31 L5 22"/><path d="M16 27 L22 21 H34"/></g><path d="M5 31 C2 36 2 40 5 40 C8 40 8 36 5 31 Z" fill="${INK}"/>`,
  accu: `<g fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="22" width="48" height="28" rx="3"/><path d="M16 22 V16 H24 V22"/><path d="M40 22 V16 H48 V22"/><path d="M15 36 H25"/><path d="M39 36 H49 M44 31 V41"/></g>`,
};
const PIC = {
  driehoek: () => `<polygon points="50,10 93,86 7,86" fill="${RED}" ${sk()}/><polygon points="50,36 72,75 28,75" fill="#fff" ${sk(2.5)}/>`,
  hesje: () => `<path d="M32 12 L42 12 Q50 26 58 12 L68 12 L90 32 L79 46 L72 41 L72 88 L28 88 L28 41 L21 46 L10 32 Z" fill="#e8f21f" ${sk()}/><rect x="28" y="56" width="44" height="8" fill="#f4f4f4"/><rect x="28" y="72" width="44" height="8" fill="#f4f4f4"/><path d="M42 12 Q50 26 58 12" fill="none" ${sk(2.5)}/>`,
  blusser: () => `<rect x="34" y="34" width="32" height="56" rx="9" fill="${RED}" ${sk()}/><rect x="42" y="18" width="16" height="16" rx="3" fill="${INK}"/><path d="M58 22 Q84 16 80 50" fill="none" ${sk(4)}/><path d="M42 20 H26" ${sk(4)} fill="none"/><rect x="40" y="52" width="20" height="18" rx="3" fill="#fff"/>`,
  verbanddoos: () => `<rect x="14" y="30" width="72" height="54" rx="9" fill="${GRN}" ${sk()}/><path d="M38 30 V22 H62 V30" fill="none" ${sk(4)}/><rect x="45" y="42" width="10" height="30" fill="#fff"/><rect x="35" y="52" width="30" height="10" fill="#fff"/>`,
  telefoon: () => `<rect x="30" y="6" width="40" height="88" rx="9" fill="${INK}"/><rect x="35" y="16" width="30" height="62" rx="2" fill="${GLASS}"/><circle cx="50" cy="86" r="3.5" fill="#888"/>`,
  tel112: () => `<rect x="26" y="6" width="48" height="88" rx="9" fill="${INK}"/><rect x="31" y="16" width="38" height="62" rx="2" fill="${GLASS}"/><text x="50" y="55" text-anchor="middle" ${FONTF} font-size="19" font-weight="800" fill="${INK}">112</text><circle cx="50" cy="86" r="3.5" fill="#888"/>`,
  ambulance: () => `<rect x="5" y="32" width="62" height="42" rx="5" fill="#fff" ${sk()}/><path d="M67 42 H85 L95 57 V74 H67 Z" fill="#fff" ${sk()}/><path d="M73 46 H83 L89 56 H73 Z" fill="${GLASS}"/><rect x="31" y="40" width="8" height="26" fill="${RED}"/><rect x="22" y="49" width="26" height="8" fill="${RED}"/><rect x="40" y="24" width="14" height="8" rx="2" fill="${BLU}"/><circle cx="24" cy="76" r="9" fill="${INK}"/><circle cx="24" cy="76" r="3.5" fill="#ccc"/><circle cx="80" cy="76" r="9" fill="${INK}"/><circle cx="80" cy="76" r="3.5" fill="#ccc"/>`,
  politie: () => `<path d="M50 6 L87 19 V48 C87 70 71 85 50 94 C29 85 13 70 13 48 V19 Z" fill="${BLU}" ${sk()}/><polygon points="${star(50, 48, 22, 9)}" fill="#fff"/>`,
  vlam: () => `<path d="M50 5 C55 27 80 38 80 62 C80 80 67 94 50 94 C33 94 20 80 20 62 C20 48 31 40 36 27 C42 35 44 39 47 46 C52 36 51 22 50 5 Z" fill="${ORG}" ${sk()}/><path d="M50 52 C56 62 64 66 64 76 C64 85 58 90 50 90 C42 90 36 85 36 76 C36 68 46 62 50 52 Z" fill="${YEL}"/>`,
  praatpaal: () => `<rect x="34" y="12" width="32" height="78" rx="6" fill="${ORG}" ${sk()}/><rect x="40" y="20" width="20" height="16" rx="3" fill="#fff"/><circle cx="50" cy="50" r="8" fill="#fff" ${sk(2.5)}/><rect x="40" y="64" width="20" height="14" rx="3" fill="${INK}"/>`,
  pin: () => `<path d="M50 94 C30 64 22 54 22 38 A28 28 0 0 1 78 38 C78 54 70 64 50 94 Z" fill="${RED}" ${sk()}/><circle cx="50" cy="38" r="11" fill="#fff"/>`,
  mensen: () => `${person(32, 56, 0.85, '#2d4a8a')}${person(68, 56, 0.85, '#c0562b')}`,
  persoon: (c) => `${person(50, 56, 1.1, c || '#2d4a8a')}`,
  vergrootglas: () => `<circle cx="42" cy="42" r="24" fill="${GLASS}" ${sk(5)}/><path d="M60 60 L88 88" ${sk(9)} fill="none"/>`,
  hart: () => `<path d="M50 88 C8 58 12 20 34 20 C44 20 50 28 50 32 C50 28 56 20 66 20 C88 20 92 58 50 88 Z" fill="${RED}" ${sk()}/>`,
  klok: () => `<circle cx="50" cy="50" r="40" fill="#fff" ${sk(4)}/><path d="M50 50 V24 M50 50 L68 60" fill="none" ${sk(5)}/><circle cx="50" cy="50" r="4" fill="${INK}"/>`,
  kalender: () => `<rect x="12" y="18" width="76" height="70" rx="9" fill="#fff" ${sk(3.5)}/><path d="M12 27 A9 9 0 0 1 21 18 H79 A9 9 0 0 1 88 27 V42 H12 Z" fill="${RED}"/><rect x="28" y="10" width="7" height="16" rx="3" fill="${INK}"/><rect x="65" y="10" width="7" height="16" rx="3" fill="${INK}"/><g fill="${GREY}"><rect x="24" y="52" width="10" height="9"/><rect x="45" y="52" width="10" height="9"/><rect x="66" y="52" width="10" height="9"/><rect x="24" y="68" width="10" height="9"/><rect x="45" y="68" width="10" height="9"/></g>`,
  euro: () => `<circle cx="50" cy="50" r="40" fill="${YEL}" ${sk(4)}/><text x="50" y="66" text-anchor="middle" ${FONTF} font-size="48" font-weight="800" fill="${INK}">€</text>`,
  monitor: () => `<rect x="8" y="14" width="84" height="56" rx="7" fill="${INK}"/><rect x="14" y="20" width="72" height="44" rx="2" fill="${GLASS}"/><text x="50" y="52" text-anchor="middle" ${FONTF} font-size="30" font-weight="800" fill="${INK}">?</text><rect x="43" y="70" width="14" height="10" fill="${INK}"/><rect x="30" y="80" width="40" height="7" rx="3.5" fill="${INK}"/>`,
  idkaart: () => `<rect x="6" y="22" width="88" height="56" rx="8" fill="#fff" ${sk(3.5)}/><rect x="14" y="32" width="26" height="32" rx="3" fill="${GLASS}" ${sk(2)}/><circle cx="27" cy="43" r="5.5" fill="${SKIN}"/><path d="M18 64 Q27 50 36 64 Z" fill="${SKIN}"/><path d="M50 36 H84 M50 48 H84 M50 60 H72" ${sk(3.5)} fill="none"/>`,
  document: () => `<path d="M20 8 H62 L82 28 V92 H20 Z" fill="#fff" ${sk(3.5)}/><path d="M62 8 V28 H82" fill="none" ${sk(3)}/><path d="M30 44 H70 M30 56 H70 M30 68 H70 M30 80 H54" ${sk(3.5)} fill="none"/>`,
  auto: (c) => `<path d="M6 64 V52 Q6 46 12 45 L24 42 L35 27 Q37 25 41 25 H63 Q67 25 69 28 L79 41 L89 44 Q95 45 95 52 V64 Z" fill="${c || '#d64545'}" ${sk()}/><path d="M39 30 H48 V41 H31 Z M54 30 H64 L72 41 H54 Z" fill="${GLASS}" ${sk(1.5)}/><circle cx="27" cy="67" r="10" fill="${INK}"/><circle cx="27" cy="67" r="4" fill="#ccc"/><circle cx="75" cy="67" r="10" fill="${INK}"/><circle cx="75" cy="67" r="4" fill="#ccc"/>`,
  autoachter: () => `<rect x="12" y="42" width="76" height="36" rx="10" fill="#d64545" ${sk()}/><path d="M24 42 L30 20 H70 L76 42 Z" fill="#d64545" ${sk()}/><path d="M33 24 H67 L71 40 H29 Z" fill="${GLASS}"/><rect x="10" y="52" width="16" height="12" rx="4" fill="${ORG}" ${sk(2)}/><rect x="74" y="52" width="16" height="12" rx="4" fill="${ORG}" ${sk(2)}/><rect x="38" y="58" width="24" height="12" rx="2" fill="#fff" ${sk(2)}/><rect x="18" y="78" width="14" height="10" rx="3" fill="${INK}"/><rect x="68" y="78" width="14" height="10" rx="3" fill="${INK}"/><g stroke="${ORG}" stroke-width="3.5" stroke-linecap="round"><path d="M4 50 L-2 46 M4 58 L-3 58 M96 50 L102 46 M96 58 L103 58"/></g>`,
  stuur: () => `<circle cx="50" cy="50" r="38" fill="none" ${sk(9)}/><circle cx="50" cy="50" r="9" fill="${INK}"/><path d="M50 50 L14 58 M50 50 L86 58 M50 50 V88" ${sk(7)} fill="none"/>`,
  lplaat: () => `<rect x="12" y="12" width="76" height="76" rx="7" fill="#fff" ${sk(5)}/><text x="50" y="74" text-anchor="middle" ${FONTF} font-size="68" font-weight="800" fill="${INK}">L</text>`,
  gebouw: () => `<polygon points="50,8 94,32 6,32" fill="#c9c9c4" ${sk()}/><rect x="14" y="36" width="72" height="8" fill="#e6e6e2" ${sk(2.5)}/><g fill="#f4f4f0" ${sk(2.5)}><rect x="20" y="46" width="10" height="32"/><rect x="40" y="46" width="10" height="32"/><rect x="60" y="46" width="10" height="32"/></g><rect x="8" y="78" width="84" height="10" fill="#c9c9c4" ${sk(2.5)}/>`,
  hamer: () => `<g transform="rotate(-35 50 50)"><rect x="46" y="30" width="8" height="62" rx="3" fill="#8a5a32" ${sk(2.5)}/><rect x="24" y="14" width="52" height="22" rx="5" fill="#6b4423" ${sk(3)}/></g><rect x="14" y="82" width="46" height="8" rx="3" fill="#6b4423" ${sk(2.5)}/>`,
  kraan: () => `<path d="M10 30 H52 Q66 30 66 44 V50" fill="none" ${sk(9)}/><rect x="52" y="48" width="28" height="9" rx="3" fill="${GREY}" ${sk(2.5)}/><path d="M22 30 V18 M12 18 H32" fill="none" ${sk(6)}/><g fill="${BLU}" ${sk(1.5)}><path d="M66 62 C60 72 60 78 66 78 C72 78 72 72 66 62 Z"/><path d="M66 82 C61 90 61 95 66 95 C71 95 71 90 66 82 Z"/><path d="M50 74 C46 80 46 85 50 85 C54 85 54 80 50 74 Z"/></g>`,
  verband: () => `<ellipse cx="50" cy="60" rx="34" ry="22" fill="#fff" ${sk(3.5)}/><ellipse cx="50" cy="52" rx="34" ry="22" fill="#fff" ${sk(3.5)}/><ellipse cx="50" cy="52" rx="14" ry="8" fill="${LG}" ${sk(2.5)}/><path d="M84 52 L96 80 L72 78" fill="#fff" ${sk(3)}/>`,
  ijs: () => `<path d="M24 36 L60 24 L82 40 V72 L46 84 L24 68 Z" fill="#dff3fb" ${sk(3)}/><path d="M24 36 L46 52 L82 40 M46 52 V84" fill="none" ${sk(2.5)}/>`,
  zalf: () => `<path d="M12 40 H64 L82 46 V64 L64 70 H12 Z" fill="#fff" ${sk(3)}/><rect x="64" y="42" width="22" height="26" rx="2" fill="${BLU}" ${sk(3)}/><rect x="12" y="40" width="10" height="30" fill="${LG}" ${sk(2.5)}/>`,
  blaar: () => `<ellipse cx="50" cy="56" rx="38" ry="26" fill="${SKIN}" ${sk(3)}/><ellipse cx="50" cy="52" rx="20" ry="14" fill="#fff" opacity=".85" ${sk(2.5)}/>`,
  verbod: () => `<circle cx="50" cy="50" r="42" fill="none" stroke="${RED}" stroke-width="9"/><path d="M20 80 L80 20" stroke="${RED}" stroke-width="9" stroke-linecap="round"/>`,
  handstop: () => `<rect x="22" y="44" width="56" height="42" rx="14" fill="${SKIN}" ${sk()}/><g fill="${SKIN}" ${sk(3)}><rect x="22" y="14" width="12" height="42" rx="6"/><rect x="36" y="8" width="12" height="46" rx="6"/><rect x="50" y="10" width="12" height="44" rx="6"/><rect x="64" y="18" width="12" height="38" rx="6"/></g><path d="M22 62 L8 50 Q4 44 12 44 L26 54" fill="${SKIN}" ${sk(3)}/>`,
  schild: () => `<path d="M50 6 L87 19 V48 C87 70 71 85 50 94 C29 85 13 70 13 48 V19 Z" fill="${GRN}" ${sk()}/><path d="M32 50 L45 63 L70 36" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  adem: () => `<g fill="none" stroke="${BLU}" stroke-width="7" stroke-linecap="round"><path d="M14 30 Q32 18 50 30 T86 30"/><path d="M14 52 Q32 40 50 52 T86 52"/><path d="M14 74 Q32 62 50 74 T86 74"/></g>`,
  aed: () => `<rect x="10" y="22" width="80" height="62" rx="10" fill="${GRN}" ${sk()}/><path d="M36 22 V14 H64 V22" fill="none" ${sk(4)}/><path d="M50 70 C28 54 30 38 40 38 C46 38 50 43 50 45 C50 43 54 38 60 38 C70 38 72 54 50 70 Z" fill="#fff"/><path d="M54 44 L46 54 H54 L46 64" fill="none" stroke="${YEL}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  liggend: () => `<circle cx="16" cy="58" r="10" fill="${SKIN}" ${sk()}/><rect x="28" y="50" width="36" height="16" rx="8" fill="#2d4a8a" ${sk()}/><rect x="62" y="52" width="32" height="12" rx="6" fill="#4a4f57" ${sk()}/>`,
  compressie: () => `<circle cx="16" cy="70" r="9" fill="${SKIN}" ${sk()}/><rect x="26" y="62" width="40" height="16" rx="8" fill="#2d4a8a" ${sk()}/><rect x="64" y="64" width="30" height="12" rx="6" fill="#4a4f57" ${sk()}/><path d="M44 8 V54" stroke="${RED}" stroke-width="9" stroke-linecap="round"/><path d="M30 40 L44 56 L58 40" fill="none" stroke="${RED}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  beademing: () => `<circle cx="30" cy="50" r="22" fill="${SKIN}" ${sk()}/><ellipse cx="42" cy="58" rx="9" ry="6" fill="#d85a5a" ${sk(2)}/><circle cx="24" cy="44" r="2.8" fill="${INK}"/><path d="M60 52 H88 M78 42 L90 52 L78 62" fill="none" stroke="${BLU}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  handschoen: () => `<rect x="26" y="46" width="48" height="42" rx="14" fill="#6cc4e8" ${sk()}/><g fill="#6cc4e8" ${sk(3)}><rect x="26" y="14" width="11" height="40" rx="5.5"/><rect x="39" y="8" width="11" height="44" rx="5.5"/><rect x="52" y="10" width="11" height="42" rx="5.5"/><rect x="65" y="18" width="11" height="36" rx="5.5"/></g>`,
  druk: () => `<circle cx="50" cy="66" r="18" fill="${RED}" opacity=".85"/><path d="M50 8 V44 M34 30 L50 46 L66 30" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="78" width="72" height="12" rx="6" fill="${SKIN}" ${sk(2.5)}/>`,
  druppel: (c) => `<path d="M50 8 C34 34 24 46 24 62 C24 80 36 92 50 92 C64 92 76 80 76 62 C76 46 66 34 50 8 Z" fill="${c || RED}" ${sk()}/>`,
  neus: () => `<path d="M30 14 C48 14 60 24 62 40 L74 58 Q66 64 60 62 C60 72 52 78 40 78 C26 78 20 66 22 52 C22 36 22 20 30 14 Z" fill="${SKIN}" ${sk()}/><path d="M64 70 C60 78 60 84 64 86 C68 86 70 78 64 70 Z" fill="${RED}" ${sk(1.5)}/>`,
  spraak: () => `<path d="M12 16 H88 Q94 16 94 22 V62 Q94 68 88 68 H46 L24 88 V68 H12 Q6 68 6 62 V22 Q6 16 12 16 Z" fill="#fff" ${sk(3.5)}/><path d="M22 34 H78 M22 48 H62" ${sk(3.5)} fill="none"/>`,
  vraag: () => `<circle cx="50" cy="50" r="40" fill="${BLU}" ${sk(3)}/><text x="50" y="70" text-anchor="middle" ${FONTF} font-size="60" font-weight="800" fill="#fff">?</text>`,
  uitroep: (c) => `<circle cx="50" cy="50" r="40" fill="${c || ORG}" ${sk(3)}/><rect x="45" y="22" width="10" height="34" rx="5" fill="#fff"/><circle cx="50" cy="70" r="6" fill="#fff"/>`,
  schild2: () => `<path d="M50 6 L87 19 V48 C87 70 71 85 50 94 C29 85 13 70 13 48 V19 Z" fill="#fff" ${sk()}/>`,
  bliksem: () => `<polygon points="58,6 22,56 46,56 38,94 78,40 54,40" fill="${YEL}" ${sk()}/>`,
  stekker: () => `<rect x="30" y="10" width="10" height="26" rx="3" fill="${GREY}" ${sk(2.5)}/><rect x="60" y="10" width="10" height="26" rx="3" fill="${GREY}" ${sk(2.5)}/><rect x="22" y="34" width="56" height="34" rx="12" fill="${GRN}" ${sk()}/><path d="M50 68 V84 Q50 92 60 92 H80" fill="none" ${sk(5)}/>`,
  blad: () => `<path d="M14 84 C10 40 40 10 88 12 C90 60 62 90 18 84 Z" fill="${GRN}" ${sk()}/><path d="M14 86 C34 62 52 44 72 30" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
  wolk: (t) => `<path d="M26 74 Q8 74 10 56 Q12 42 28 44 Q30 24 52 24 Q74 24 76 44 Q92 44 92 60 Q92 74 76 74 Z" fill="#c8ccd4" ${sk()}/><text x="50" y="62" text-anchor="middle" ${FONTF} font-size="22" font-weight="800" fill="${INK}">${t || ''}</text>`,
  uitlaat: () => `<rect x="6" y="40" width="46" height="20" rx="4" fill="${GREY}" ${sk()}/><rect x="48" y="36" width="16" height="28" rx="3" fill="#b7bcc6" ${sk()}/><g fill="#c8ccd4" ${sk(2.5)}><circle cx="74" cy="46" r="7"/><circle cx="85" cy="38" r="9"/><circle cx="90" cy="56" r="7"/></g>`,
  band: () => `<circle cx="50" cy="50" r="42" fill="${INK}"/><circle cx="50" cy="50" r="28" fill="#6b7280"/><circle cx="50" cy="50" r="16" fill="#c9ced8" ${sk(2)}/><circle cx="50" cy="50" r="5" fill="${INK}"/><g stroke="#4a4f57" stroke-width="3"><path d="M50 8 V14 M50 86 V92 M8 50 H14 M86 50 H92 M20 20 L24 24 M80 80 L76 76 M80 20 L76 24 M20 80 L24 76"/></g>`,
  manometer: () => `<circle cx="50" cy="50" r="40" fill="#fff" ${sk(4)}/><path d="M20 66 A34 34 0 1 1 80 66" fill="none" stroke="${LG}" stroke-width="10"/><path d="M20 66 A34 34 0 0 1 30 36" fill="none" stroke="${RED}" stroke-width="10"/><path d="M50 56 L70 34" ${sk(5)} fill="none"/><circle cx="50" cy="56" r="6" fill="${INK}"/>`,
  oliekan: () => `<g transform="translate(18 20) scale(1.0)">${lampSym.olie}</g>`,
  accusym: () => `<g transform="translate(6 18) scale(1.4) translate(-4 -6)">${lampSym.accu}</g>`,
  wisser: () => `<path d="M8 82 Q50 24 92 82" fill="none" ${sk(3)} stroke-dasharray="6 6"/><path d="M26 86 L80 34" ${sk(5)} fill="none"/><path d="M14 80 L38 90" ${sk(7)} fill="none"/><path d="M70 44 L82 38" ${sk(5)} fill="none"/>`,
  lamp: () => `<path d="M50 8 C26 8 20 30 32 46 C38 54 38 60 38 66 H62 C62 60 62 54 68 46 C80 30 74 8 50 8 Z" fill="${YEL}" ${sk()}/><rect x="38" y="66" width="24" height="8" rx="2" fill="${GREY}" ${sk(2.5)}/><rect x="40" y="74" width="20" height="8" rx="2" fill="${GREY}" ${sk(2.5)}/><g stroke="${YEL}" stroke-width="4" stroke-linecap="round"><path d="M10 28 L18 32 M90 28 L82 32 M50 -2 V0"/></g>`,
  sproeier: () => `<rect x="30" y="34" width="40" height="54" rx="8" fill="${BLU}" opacity=".9" ${sk()}/><rect x="40" y="20" width="20" height="14" rx="3" fill="${INK}"/><path d="M60 24 H78 L88 14" fill="none" ${sk(4)}/><g fill="${BLU}"><circle cx="88" cy="6" r="3"/><circle cx="94" cy="16" r="3"/><circle cx="82" cy="4" r="2.5"/></g><rect x="38" y="52" width="24" height="18" rx="3" fill="#fff"/>`,
  sneeuw: () => `<g stroke="${BLU}" stroke-width="6" stroke-linecap="round"><path d="M50 8 V92 M14 29 L86 71 M14 71 L86 29"/><path d="M40 14 L50 24 L60 14 M40 86 L50 76 L60 86"/></g>`,
  koffer: () => `<path d="M6 76 V62 Q6 56 12 55 L24 52 L35 38 Q37 36 41 36 H63 Q67 36 69 39 L79 52 L89 55 Q95 56 95 62 V76 Z" fill="#2f6fd6" ${sk()}/><circle cx="27" cy="78" r="9" fill="${INK}"/><circle cx="75" cy="78" r="9" fill="${INK}"/><rect x="26" y="14" width="52" height="20" rx="8" fill="#9aa3ad" ${sk()}/><path d="M34 34 V38 M70 34 V38" ${sk(3)} fill="none"/>`,
  gewicht: () => `<path d="M32 34 H68 L84 88 H16 Z" fill="${GREY}" ${sk()}/><circle cx="50" cy="26" r="9" fill="none" ${sk(5)}/><text x="50" y="76" text-anchor="middle" ${FONTF} font-size="22" font-weight="800" fill="#fff">kg</text>`,
  kruis: (c) => `<path d="M24 24 L76 76 M76 24 L24 76" stroke="${c || RED}" stroke-width="12" stroke-linecap="round"/>`,
  vink: (c) => `<path d="M20 52 L42 74 L82 28" fill="none" stroke="${c || GRN}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`,
  pijl: () => `<path d="M12 50 H80 M60 28 L84 50 L60 72" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  tandwiel: () => `<circle cx="50" cy="50" r="22" fill="${GREY}" ${sk(3)}/><circle cx="50" cy="50" r="9" fill="#fff"/><g stroke="${GREY}" stroke-width="14" stroke-linecap="round"><path d="M50 10 V20 M50 80 V90 M10 50 H20 M80 50 H90 M22 22 L29 29 M71 71 L78 78 M78 22 L71 29 M29 71 L22 78"/></g>`,
  toerenteller: () => `<circle cx="50" cy="50" r="40" fill="#fff" ${sk(4)}/><g stroke="${INK}" stroke-width="3" stroke-linecap="round"><path d="M18 68 L24 64 M14 50 H22 M22 30 L28 36 M50 14 V22 M78 30 L72 36 M86 50 H78 M82 68 L76 64"/></g><path d="M50 56 L34 36" ${sk(5)} fill="none"/><circle cx="50" cy="56" r="6" fill="${INK}"/>`,
  blikje: () => ``,
  oog: () => `<path d="M6 50 Q50 8 94 50 Q50 92 6 50 Z" fill="#fff" ${sk(4)}/><circle cx="50" cy="50" r="17" fill="${BLU}" ${sk(2.5)}/><circle cx="50" cy="50" r="7" fill="${INK}"/>`,
  boek: () => `<path d="M10 20 Q30 12 50 22 Q70 12 90 20 V82 Q70 74 50 84 Q30 74 10 82 Z" fill="#fff" ${sk(3.5)}/><path d="M50 22 V84" ${sk(3)} fill="none"/><path d="M20 34 Q32 30 42 36 M20 48 Q32 44 42 50 M58 36 Q68 30 80 34 M58 50 Q68 44 80 48" fill="none" ${sk(2.5)}/>`,
  handtekening: () => `<path d="M10 74 C20 40 30 40 28 62 C26 76 42 40 48 52 C52 62 58 62 64 50 C70 40 78 66 92 52" fill="none" ${sk(4)}/><path d="M10 86 H90" ${sk(3)} fill="none"/>`,
  slot: () => `<rect x="20" y="42" width="60" height="46" rx="8" fill="${YEL}" ${sk()}/><path d="M32 42 V30 A18 18 0 0 1 68 30 V42" fill="none" ${sk(6)}/><circle cx="50" cy="64" r="6" fill="${INK}"/>`,
  maan: () => `<path d="M62 8 A42 42 0 1 0 92 66 A34 34 0 0 1 62 8 Z" fill="${YEL}" ${sk()}/>`,
  aanhanger: () => `<rect x="30" y="34" width="62" height="38" rx="5" fill="#9aa3ad" ${sk()}/><path d="M30 60 H8" ${sk(5)} fill="none"/><circle cx="62" cy="76" r="10" fill="${INK}"/><circle cx="62" cy="76" r="4" fill="#ccc"/>`,
  vrachtje: () => `<rect x="6" y="30" width="54" height="42" rx="3" fill="#f1f1ee" ${sk()}/><path d="M60 42 H80 L94 58 V72 H60 Z" fill="${BLU}" ${sk()}/><circle cx="24" cy="76" r="9" fill="${INK}"/><circle cx="78" cy="76" r="9" fill="${INK}"/>`,
  kaart: () => `<rect x="6" y="20" width="88" height="60" rx="8" fill="#fff" ${sk(3.5)}/><rect x="14" y="30" width="28" height="34" rx="3" fill="${GLASS}" ${sk(2)}/><circle cx="28" cy="42" r="6" fill="${SKIN}"/><path d="M18 64 Q28 48 38 64 Z" fill="${SKIN}"/><path d="M52 34 H84 M52 46 H84 M52 58 H70" ${sk(3)} fill="none"/><rect x="72" y="58" width="14" height="12" rx="2" fill="${YEL}"/>`,
};
PIC.blikje = undefined; delete PIC.blikje;

// meerdere panelen naast elkaar met gelijke hoogte: lijst van {x,w,o}; geeft onderrand
function panels(s, y, list) {
  const dummy = { add() {} };
  const H = Math.max(...list.map((p) => panel(dummy, p.x, y, p.w, { ...p.o, minH: 0 }) - y));
  let bottom = y;
  list.forEach((p) => { bottom = Math.max(bottom, panel(s, p.x, y, p.w, { ...p.o, minH: H })); });
  return bottom;
}

// ---------- extra hulpjes en pictogrammen ----------
function fit(s, bottom) {
  s.h = Math.ceil(bottom + 18);
  s.b[0] = `<rect width="${s.w}" height="${s.h}" fill="${s.bg}"/>`;
}
function end(s, bottom, meta) { fit(s, bottom); return done(s, meta); }
Object.assign(PIC, {
  spiegel: () => `<rect x="14" y="26" width="72" height="42" rx="10" fill="#e8eef5" ${sk(4)}/><path d="M26 56 L44 36 M40 60 L58 40" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M50 68 V84 M36 86 H64" ${sk(5)} fill="none"/>`,
  scooter: () => `<circle cx="24" cy="72" r="12" fill="${INK}"/><circle cx="24" cy="72" r="5" fill="#ccc"/><circle cx="80" cy="72" r="12" fill="${INK}"/><circle cx="80" cy="72" r="5" fill="#ccc"/><path d="M24 72 H52 L60 40 H48 M60 40 L72 30 H84 M60 40 L80 72" fill="none" ${sk(6)}/><path d="M42 66 H62" ${sk(7)} fill="none"/><rect x="36" y="46" width="26" height="9" rx="4" fill="${BLU}" ${sk(2.5)}/>`,
  sleutel: () => `<circle cx="28" cy="50" r="18" fill="${YEL}" ${sk(4)}/><circle cx="28" cy="50" r="6" fill="#fff"/><path d="M46 50 H92 M76 50 V64 M88 50 V60" fill="none" ${sk(7)}/>`,
  nummerplaat: () => `<rect x="6" y="28" width="88" height="44" rx="7" fill="#fff" ${sk(4)}/><rect x="6" y="28" width="16" height="44" rx="6" fill="${BLU}" ${sk(3)}/><path d="M32 50 H84 M32 40 H70 M32 60 H76" ${sk(4)} fill="none" opacity=".55"/>`,
  gloeibougie: () => `<path d="M10 70 H30 M70 70 H90" fill="none" stroke="${MUTE}" stroke-width="7" stroke-linecap="round"/><path d="M30 70 C30 30 40 30 40 70 C40 30 50 30 50 70 C50 30 60 30 60 70 C60 30 70 30 70 70" fill="none" stroke="${MUTE}" stroke-width="7" stroke-linecap="round"/>`,
  motorlamp: (c) => `<g transform="translate(-4 -2) scale(1.7)"><g fill="none" stroke="${c || ORG}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 24 H22 L25 19 H39 V24 H46 L50 28 H56 V42 H50 L46 48 H20 L14 42 Z"/><path d="M6 30 V40"/><path d="M6 35 H14"/><path d="M30 19 V15 H36"/></g></g>`,
  dopcode: () => ``,
  scherm: () => ``,
});
delete PIC.dopcode; delete PIC.scherm;

// schets-hulp: wegscene met onderrand-fit niet nodig (vaste hoogte)
const PERSOON = (s, x, y, kleur, rot = 0, k = 1.7) => s.add(`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${k})"><ellipse cx="0" cy="0" rx="12" ry="6.5" fill="${kleur}" stroke="#fff" stroke-width="1.4"/>${kleur === '#e8f21f' ? '<rect x="-12" y="-1" width="24" height="2.6" fill="#fff" opacity=".8"/>' : ''}<circle cx="0" cy="0" r="6" fill="#f1c9a5" stroke="#1c2230" stroke-width="1.4"/></g>`);
function driehoekBoven(s, x, y, k = 1) {
  s.add(`<polygon points="${f(x)},${f(y - 26 * k)} ${f(x + 24 * k)},${f(y + 16 * k)} ${f(x - 24 * k)},${f(y + 16 * k)}" fill="#fff" stroke="${RED}" stroke-width="${9 * k}" stroke-linejoin="round"/>`);
  s.add(`<polygon points="${f(x)},${f(y - 9 * k)} ${f(x + 11 * k)},${f(y + 9 * k)} ${f(x - 11 * k)},${f(y + 9 * k)}" fill="${RED}" opacity=".55"/>`);
}
function wegVert(s, x0, x1, y0, y1) {
  s.rect(x0, y0, x1 - x0, y1 - y0, C.road);
  s.line((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, '#fff', 3, 'stroke-dasharray="16 14"');
}
function vangrail(s, x, y0, y1) {
  s.line(x, y0, x, y1, '#c3c8d0', 9);
  s.line(x, y0, x, y1, '#8b919b', 2.5);
  for (let y = y0 + 12; y < y1; y += 44) s.line(x + 6, y, x + 17, y, '#6b717b', 4);
}
function labelkaart(s, x, y, w, nr, tekst, kleur = INK) {
  const lines = wrap(tekst, w - 62, 17, 700), h = Math.max(46, lines.length * 21 + 18);
  card(s, x, y, w, h, { rx: 12 });
  badge(s, x + 26, y + h / 2, nr, kleur, 15);
  tx(s, x + 52, y + h / 2 - (lines.length - 1) * 10.5 + 6, tekst, { size: 17, weight: 700, anchor: 'start', maxW: w - 62 });
  return y + h;
}

// =====================================================================
// HOOFDSTUK 10 - ONGEVAL EN EHBO
// =====================================================================
// 10.1.1
(function () {
  const s = make('schema-ongeval-stappenplan', 'Het stappenplan bij een ongeval',
    'Vijf genummerde stappen met pictogrammen, van links naar rechts: 1 beveilig de plaats (gevarendriehoek), 2 breng mensen in veiligheid, 3 alarmeer 112, 4 verleen eerste hulp, 5 blijf ter plaatse. Onderaan: eerst veiligheid, dan hulp roepen, dan zelf verder helpen.', 400);
  const r = cards(s, s.top + 18, [
    { n: 1, pic: 'driehoek', kop: 'Beveilig de plaats' }, { n: 2, pic: 'mensen', kop: 'Breng mensen in veiligheid' },
    { n: 3, pic: 'tel112', kop: 'Alarmeer 112' }, { n: 4, pic: 'verbanddoos', kop: 'Verleen eerste hulp' }, { n: 5, pic: 'pin', kop: 'Blijf ter plaatse' }], { gap: 22, arrows: true, pic: 76, headSize: 18 });
  const b = banner(s, r.bottom + 18, 'Eerst veiligheid, dan hulp roepen, dan zelf verder helpen.', GRN);
  end(s, b, { blok: 'ongeval-stappenplan' });
})();

// 10.1.2 beveiligen (bovenaanzicht)
(function () {
  const s = new Svg('schema-ongeval-beveiligen', 'Stap 1 en 2: beveilig de plaats',
    'Bovenaanzicht van een weg met een stilstaande auto met alarmlichten, een gevarendriehoek achter de auto, een persoon met fluohesje op de berm en enkele mensen die achter de vangrail wachten. Een naderende auto komt van onderen. Vier genummerde punten: alarmlichten aan, fluohesje aan, gevarendriehoek plaatsen, wachten achter de vangrail.',
    { w: 800, h: 500 });
  s.titel('Stap 1 en 2: beveilig de plaats');
  wegVert(s, 40, 260, 0, 500);
  s.rect(260, 0, 22, 500, '#6f757e');
  vangrail(s, 292, 48, 500);
  s.car(205, 170, 0, 'rood', null, { blink: 'W' });
  driehoekBoven(s, 205, 310);
  s.car(100, 440, 0, 'blauw', null);
  s.arrow(100, 392, 100, 345, '#fff', 4);
  PERSOON(s, 271, 262, '#e8f21f');
  PERSOON(s, 345, 160, '#2d4a8a'); PERSOON(s, 372, 188, '#c0562b'); PERSOON(s, 336, 205, '#4a8a5a');
  s.badge(160, 140, 1, { r: 13 }); s.badge(262, 236, 2, { r: 13 }); s.badge(245, 296, 3, { r: 13 }); s.badge(372, 140, 4, { r: 13 });
  let y = 76;
  y = labelkaart(s, 420, y, 352, 1, 'Zet je auto veilig en schakel de alarmlichten in', RED) + 12;
  y = labelkaart(s, 420, y, 352, 2, 'Trek een fluohesje aan', ORG) + 12;
  y = labelkaart(s, 420, y, 352, 3, 'Plaats zo nodig de gevarendriehoek', RED) + 12;
  y = labelkaart(s, 420, y, 352, 4, 'Passagiers en omstanders wachten achter de vangrail', GRN) + 18;
  card(s, 420, y, 352, 104, { fill: '#fff4f0', stroke: RED, sw: 2.5 });
  pic(s, 'uitroep', 456, y + 52, 40, RED);
  tx(s, 486, y + 40, 'Gewonden? Verplaats het voertuig niet. Bij enkel blikschade haal je de voertuigen indien mogelijk uit het verkeer.', { size: 15.5, weight: 600, anchor: 'start', maxW: 276 });
  done(s, { blok: 'ongeval-stappenplan' });
})();

// 10.1.3 plichten
(function () {
  const s = make('schema-ongeval-plichten', 'Je plichten na een ongeval',
    'Twee kolommen. Enkel stoffelijke schade: zorg voor de veiligheid van het verkeer, toon je identiteitskaart, blijf ter plaatse. Lichamelijk letsel: dezelfde plichten, verleen of haal hulp, verplaats het voertuig niet. Onderaan: even weggaan om hulp te halen mag als je eerst naam en adres geeft.', 400);
  const y = s.top + 16;
  const pb = panels(s, y, [
    { x: 28, w: 364, o: { kop: 'Enkel stoffelijke schade', kleur: BLU, hpic: 'auto', rows: [
      { ok: true, tekst: 'Zorg voor de veiligheid van het verkeer' }, { ok: true, tekst: 'Toon je identiteitskaart (ouder dan 15)' }, { ok: true, tekst: 'Blijf ter plaatse tot de vaststellingen gedaan zijn' }] } },
    { x: 408, w: 364, o: { kop: 'Lichamelijk letsel', kleur: RED, hpic: 'ambulance', rows: [
      { ok: true, tekst: 'Dezelfde plichten als links' }, { ok: true, tekst: 'Verleen hulp of haal hulp' }, { ok: false, tekst: 'Verplaats het voertuig niet' }] } }]);
  const bb = banner(s, pb + 14, 'Even weggaan om hulp te halen mag, als je eerst naam en adres aan een aanwezige geeft.', INK);
  end(s, bb, { blok: 'ongeval-hulpverlening-blijven' });
})();

// 10.1.4 aangifte
(function () {
  const s = make('schema-ongeval-aangifte', 'Aangifte bij de politie',
    'Boven: drie stappen. Niemand van de politie te bereiken, ga naar het dichtstbijzijnde politiebureau of dat van je woonplaats, meld het zo snel mogelijk. Onder: twee termijnen. Enkel stoffelijke schade: zodra mogelijk. Met gewonden: binnen 24 uur.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'politie', kop: 'Niemand van de politie te bereiken?', tekst: 'Dan doe je aangifte.' },
    { n: 2, pic: 'gebouw', kop: 'Ga naar het politiebureau', tekst: 'Het dichtstbijzijnde of dat van je woonplaats.' },
    { n: 3, pic: 'persoon', kop: 'Benadeelde niet aanwezig?', tekst: 'Geef naam en adres op.' }], { gap: 24, arrows: true, pic: 64, bodySize: 16 });
  const r2 = cards(s, r.bottom + 26, [
    { pic: 'klok', kop: 'Enkel stoffelijke schade', tekst: 'Aangifte zodra mogelijk.', kleur: BLU },
    { pic: 'klok', kop: 'Met gewonden', tekst: 'Aangifte binnen 24 uur.', kleur: RED }], { gap: 24, pic: 56, headSize: 20, bodySize: 18 });
  end(s, r2.bottom, { blok: 'ongeval-hulpverlening-blijven' });
})();

// 10.1.5 vluchtmisdrijf
(function () {
  const s = make('schema-vluchtmisdrijf', 'Vluchtmisdrijf: nooit doorrijden',
    'Twee kolommen. Links, rood: niet doen, doorrijden na een ongeval; dat is strafbaar en kan gevangenisstraf, geldboete en rijverbod geven. Rechts, groen: wel doen, ter plaatse blijven, naam en identiteit geven en hulp verlenen of halen.', 400);
  const y = s.top + 16;
  const pb = panels(s, y, [
    { x: 28, w: 364, o: { kop: 'Niet doen: doorrijden', kleur: RED, hpic: 'verbod', rows: [
      { ok: false, tekst: 'Gewonden zonder hulp achterlaten' }, { ok: false, tekst: 'Vluchtmisdrijf is strafbaar' }, { pic: 'hamer', tekst: 'Mogelijk: gevangenisstraf, geldboete en rijverbod' }] } },
    { x: 408, w: 364, o: { kop: 'Wel doen: blijf ter plaatse', kleur: GRN, hpic: 'schild', rows: [
      { ok: true, tekst: 'Blijf, zeker als er gewonden zijn' }, { ok: true, tekst: 'Geef je naam en identiteit' }, { ok: true, tekst: 'Verleen of haal hulp' }] } }]);
  const bb = banner(s, pb + 14, 'Niet ter plaatse blijven is een zware fout.', RED);
  end(s, bb, { blok: 'ongeval-vluchtmisdrijf' });
})();

// 10.2.1 driehoek wanneer
(function () {
  const s = new Svg('schema-driehoek-zichtbaar', 'De gevarendriehoek: wanneer en waar?',
    'Bovenaanzicht: een stilstaande auto met alarmlichten, daarachter een gevarendriehoek tussen de auto en het naderende verkeer. Een blauwe auto nadert van onderen; een stippellijn toont dat de driehoek van ongeveer 50 meter zichtbaar moet zijn. Rechts drie situaties waarin je de driehoek plaatst.',
    { w: 800, h: 480 });
  s.titel('De gevarendriehoek: wanneer en waar?');
  wegVert(s, 40, 260, 0, 480);
  s.car(200, 150, 0, 'rood', null, { blink: 'W' });
  driehoekBoven(s, 200, 262);
  s.car(110, 420, 0, 'blauw', null);
  s.add(`<g stroke="#fff" stroke-width="3"><line x1="150" y1="285" x2="150" y2="380" stroke-dasharray="8 6"/><line x1="142" y1="285" x2="158" y2="285"/><line x1="142" y1="380" x2="158" y2="380"/></g>`);
  s.label(95, 336, 'ongeveer\n50 m zicht', { size: 16 });
  const b1 = panel(s, 300, 72, 472, { kop: 'Wanneer plaats je hem?', kleur: RED, hpic: 'driehoek', rows: [
    { pic: 'auto', tekst: 'Je auto kan niet verplaatst worden' },
    { pic: 'pin', tekst: 'Je staat waar stilstaan verboden is' },
    { pic: 'lamp', tekst: 'De verlichting is defect en niet duidelijk zichtbaar van op ongeveer 100 m' }], size: 17 });
  card(s, 300, b1 + 14, 472, 74, { fill: '#fff8e6', stroke: ORG, sw: 2.5 });
  tx(s, 536, b1 + 14 + 32, 'Zet hem ongeveer rechtop, zodat bestuurders hem van ongeveer 50 meter zien.', { size: 16, weight: 600, maxW: 440 });
  done(s, { blok: 'ongeval-gevarendriehoek' });
})();

// 10.2.3 uitrusting (ongeval)
(function () {
  const s = make('schema-uitrusting-ongeval', 'Uitrusting in de auto',
    'Drie pictogrammen: gevaarsdriehoek (voertuig of hindernis op afstand signaleren), blustoestel (een beginnende brand blussen) en verbandkist of -etui (eerste hulp bij kleine verwondingen). Onderaan: dit materiaal moet aan het technisch reglement voldoen.', 400);
  const r = cards(s, s.top + 18, [
    { pic: 'driehoek', kop: 'Gevaarsdriehoek', tekst: 'Voertuig of hindernis op afstand signaleren.' },
    { pic: 'blusser', kop: 'Blustoestel', tekst: 'Een beginnende brand blussen.' },
    { pic: 'verbanddoos', kop: 'Verbandkist of -etui', tekst: 'Eerste hulp bij kleine verwondingen.' }], { gap: 18, pic: 90, headSize: 20, bodySize: 17 });
  const b = banner(s, r.bottom + 16, 'Dit materiaal moet aan het technisch reglement voldoen.', INK);
  end(s, b, { blok: 'ongeval-uitrusting' });
})();

// 10.2.4 alarmlichten en hesje
(function () {
  const s = make('schema-alarmlichten-hesje', 'Alarmlichten en fluohesje',
    'Drie kaarten: de achterkant van een auto met alle richtingaanwijzers knipperend (alarmlichten), een fluohesje dat je aantrekt voor je uitstapt, en een gevarendriehoek die door de alarmlichten niet vervangen wordt.', 400);
  const r = cards(s, s.top + 18, [
    { pic: 'autoachter', kop: 'Alarmlichten', tekst: 'Alle richtingaanwijzers knipperen tegelijk.' },
    { pic: 'hesje', kop: 'Fluohesje', tekst: 'Op een autosnelweg of autoweg aan zodra je uitstapt.' },
    { pic: 'driehoek', kop: 'Driehoek blijft nodig', tekst: 'Alarmlichten vervangen de gevarendriehoek niet.' }], { gap: 18, pic: 96, headSize: 20, bodySize: 17 });
  const b = banner(s, r.bottom + 16, 'Houd het hesje binnen handbereik, niet in de koffer.', ORG);
  end(s, b, { blok: 'ongeval-alarmlichten-hesje' });
})();

// 10.2.5 alarmnummers
(function () {
  const s = make('schema-alarmnummers', 'Alarmnummers: 112, 100 en 101',
    'Drie kaarten met een groot nummer: 112 (ambulance en brandweer, gratis), 100 (komt bij dezelfde noodcentrale uit als 112) en 101 (dringende politiehulp, gratis). Daaronder hoe je belt: vast toestel, gsm, 112-app of praatpaal. Het nummer 1722 is geen noodnummer.', 400);
  const nummer = (p, num, col) => (s2, cx, cy) => { pic(s2, p, cx - 52, cy, 62); tx(s2, cx + 28, cy + 16, num, { size: 46, weight: 800, fill: col }); };
  const r = cards(s, s.top + 18, [
    { picFn: nummer('ambulance', '112', RED), kop: 'Ambulance en brandweer', tekst: 'Gratis Europees noodnummer.', kleur: RED },
    { picFn: nummer('ambulance', '100', ORG), kop: 'Zelfde noodcentrale', tekst: 'Komt uit bij dezelfde centrale als 112.', kleur: ORG },
    { picFn: nummer('politie', '101', BLU), kop: 'Dringende politiehulp', tekst: 'Gratis. Bij een zuivere politievraag bel je liefst rechtstreeks 101.', kleur: BLU }], { gap: 16, pic: 62, headSize: 18, bodySize: 16 });
  const y = r.bottom + 20;
  card(s, 28, y, 744, 112, { fill: SOFT });
  tx(s, 400, y + 28, 'Zo kan je bellen', { size: 18, weight: 700 });
  const it = [['telefoon', 'Vast toestel of gsm'], ['tel112', 'De 112-app'], ['praatpaal', 'Praatpaal langs de weg']];
  it.forEach(([p, t], i) => { const cx = 28 + 124 + i * 248; pic(s, p, cx - 70, y + 72, 52); tx(s, cx - 38, y + 77, t, { size: 16, weight: 600, anchor: 'start', maxW: 110 }); });
  const b = banner(s, y + 124, '1722 is geen noodnummer: het is voor niet-dringende brandweerinterventies bij extreem weer.', MUTE, { size: 16 });
  end(s, b, { blok: 'ongeval-alarmnummers' });
})();

// 10.2.6 noodoproep
(function () {
  const s = make('schema-noodoproep', 'Wat vertel je bij een noodoproep?',
    'Vier kaarten: waar (de exacte locatie), wat (wat er gebeurd is en hoeveel voertuigen), wie (gewonden, hoeveel en hoe ze eraan toe zijn) en jij (wie je bent). Onder: op de autosnelweg geef je kilometerpaal, dichtstbijzijnde afrit en rijrichting; op een gewone weg gemeente, straat of kruispunt. Hang niet op voor de operator klaar is.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'pin', kop: 'Waar?', tekst: 'De exacte locatie.' },
    { n: 2, pic: 'auto', kop: 'Wat?', tekst: 'Wat er gebeurd is en hoeveel voertuigen betrokken zijn.' },
    { n: 3, pic: 'mensen', kop: 'Wie?', tekst: 'Zijn er gewonden, hoeveel en hoe zijn ze eraan toe?' },
    { n: 4, pic: 'persoon', kop: 'Jij', tekst: 'Wie je bent.' }], { gap: 14, pic: 60, headSize: 20, bodySize: 15.5 });
  const r2 = cards(s, r.bottom + 14, [
    { kop: 'Op de autosnelweg', tekst: 'Kilometerpaal, dichtstbijzijnde afrit en rijrichting.', fill: SOFT },
    { kop: 'Op een gewone weg', tekst: 'Gemeente, straat of kruispunt.', fill: SOFT }], { gap: 14, headSize: 18, bodySize: 16 });
  const b = banner(s, r2.bottom + 14, 'Hang niet op voor de operator klaar is.', RED);
  end(s, b, { blok: 'ongeval-noodoproep' });
})();

// 10.3.1 EHBO vier stappen
(function () {
  const s = make('schema-ehbo-vier-stappen', 'EHBO: de vier stappen',
    'Vier genummerde stappen van het Rode Kruis: 1 zorg voor veiligheid, 2 beoordeel de toestand van het slachtoffer, 3 alarmeer 112, 4 verleen verdere hulp. Daaronder drie controles: bewustzijn, luchtweg en ademhaling (kijken, luisteren en voelen, maximaal 10 seconden).', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'schild', kop: 'Veiligheid', tekst: 'Van jezelf, het slachtoffer en de omstanders.' },
    { n: 2, pic: 'vergrootglas', kop: 'Beoordeel', tekst: 'Hoe is het slachtoffer eraan toe?' },
    { n: 3, pic: 'tel112', kop: 'Alarmeer 112', tekst: 'Roep de hulpdiensten.' },
    { n: 4, pic: 'verbanddoos', kop: 'Verleen hulp', tekst: 'Geef verdere hulp.' }], { gap: 22, arrows: true, pic: 60, headSize: 19, bodySize: 15.5 });
  const y = r.bottom + 16;
  tx(s, 400, y + 18, 'Stap 2: de drie controles', { size: 18, weight: 700 });
  const r2 = cards(s, y + 30, [
    { kop: 'Bewustzijn', tekst: 'Reageert het slachtoffer?', fill: SOFT },
    { kop: 'Luchtweg', tekst: 'Open de luchtweg.', fill: SOFT },
    { kop: 'Ademhaling', tekst: 'Kijken, luisteren en voelen, maximaal 10 seconden.', fill: SOFT }], { gap: 14, headSize: 18, bodySize: 15.5 });
  const b = banner(s, r2.bottom + 14, 'Begin pas als de plaats beveiligd is.', GRN);
  end(s, b, { blok: 'ongeval-ehbo-stappen' });
})();

// 10.3.2 stabiele zijligging (beslissing, geen handgrepen)
(function () {
  const s = make('schema-zijligging-beslissing', 'Wanneer stabiele zijligging?',
    'Beslissingsschema. Het slachtoffer reageert niet, daarna de vraag: ademt het normaal? Bij ja: stabiele zijligging, de luchtweg blijft open, laat 112 alarmeren en controleer elke minuut de ademhaling. Bij nee: reanimeren met 112 en een AED. Niet in zijligging bij vermoeden van wervelletsel.', 400);
  const r = cards(s, s.top + 16, [
    { pic: 'liggend', kop: 'Het slachtoffer reageert niet', tekst: 'Bewusteloos.' },
    { pic: 'adem', kop: 'Ademt het normaal?', tekst: 'Kijken, luisteren en voelen, maximaal 10 seconden.' }], { gap: 40, arrows: true, pic: 64, x: 150, w: 500, headSize: 19, bodySize: 16 });
  const y = r.bottom + 16;
  const pb = panels(s, y, [
    { x: 28, w: 400, o: { kop: 'Ja: zijligging', kleur: GRN, hpic: 'schild', rows: [
      { pic: 'adem', tekst: 'De luchtweg blijft open, geen stikken in braaksel of speeksel' },
      { pic: 'tel112', tekst: 'Laat 112 alarmeren' }, { pic: 'klok', tekst: 'Controleer elke minuut de ademhaling' }] } },
    { x: 444, w: 328, o: { kop: 'Nee: reanimeren', kleur: RED, hpic: 'hart', rows: [
      { pic: 'tel112', tekst: 'Alarmeer 112 en laat een AED halen' }, { pic: 'compressie', tekst: '30 borstcompressies, dan 2 beademingen' }] } }]);
  const b = banner(s, pb + 14, 'Niet in zijligging bij vermoeden van wervelletsel, bijvoorbeeld na een zware val of botsing.', ORG, { size: 17 });
  end(s, b, { blok: 'ongeval-stabiele-zijligging' });
})();

// 10.3.3 reanimatie en AED
(function () {
  const s = make('schema-reanimatie-aed', 'Reanimatie en AED',
    'Eerst vier stappen: alarmeer 112 en laat een AED halen, 30 borstcompressies in het midden van de borstkas, 2 beademingen, daarna 30 en 2 blijven afwisselen. Daaronder de AED: activeren en de aanwijzingen volgen, 2 elektroden op de ontblote borstkas, tijdens analyse of schok raakt niemand het slachtoffer aan.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'tel112', kop: 'Alarmeer 112', tekst: 'Laat een AED halen.' },
    { n: 2, pic: 'compressie', kop: '30 borstcompressies', tekst: 'In het midden van de borstkas.' },
    { n: 3, pic: 'beademing', kop: '2 beademingen', tekst: 'Daarna weer compressies.' },
    { n: 4, pic: 'hart', kop: 'Blijf afwisselen', tekst: '30 compressies, dan 2 beademingen.' }], { gap: 22, arrows: true, pic: 60, headSize: 18, bodySize: 15.5 });
  const y = r.bottom + 16;
  const b1 = panel(s, 28, y, 744, { kop: 'De AED', kleur: GRN, hpic: 'aed', size: 17, rows: [
    { pic: 'aed', tekst: 'Activeer de AED en volg de aanwijzingen' }, { pic: 'hart', tekst: 'Plak 2 elektroden op de ontblote borstkas' },
    { pic: 'handstop', tekst: 'Tijdens analyse of schok raakt niemand het slachtoffer aan' }] });
  const b = banner(s, b1 + 14, 'Volg de instructies van de operator van de noodcentrale.', INK);
  end(s, b, { blok: 'ongeval-reanimatie-aed' });
})();

// 10.3.4 brandwonden
(function () {
  const s = make('schema-brandwonden', 'Brandwonden: zo help je',
    'Vier stappen: handschoenen aan, 20 minuten koelen met stromend water, bedekken met verband of plastic folie, bij een ernstige brandwonde 112 bellen. Daaronder drie dingen die je niet doet: ijs of ijskoud water, zalf, blaren openprikken.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'handschoen', kop: 'Handen schoon', tekst: 'Was of ontsmet je handen en trek handschoenen aan.' },
    { n: 2, pic: 'kraan', kop: '20 minuten koelen', tekst: 'Met stromend water.' },
    { n: 3, pic: 'verband', kop: 'Bedekken', tekst: 'Met verband, nat verband of plastic folie.' },
    { n: 4, pic: 'tel112', kop: 'Ernstig? Bel 112', tekst: 'Bij een ernstige brandwonde.' }], { gap: 22, arrows: true, pic: 60, headSize: 18, bodySize: 15.5 });
  const y = r.bottom + 16;
  tx(s, 400, y + 18, 'Dit doe je niet', { size: 19, weight: 700, fill: RED });
  const ov = (p) => (s2, cx, cy, sz) => { pic(s2, p, cx, cy, sz * 0.9); s2.add(`<g opacity=".85"><g transform="translate(${f(cx - sz / 2)} ${f(cy - sz / 2)}) scale(${f(sz / 100)})">${PIC.verbod()}</g></g>`); };
  const r2 = cards(s, y + 30, [
    { picFn: ov('ijs'), kop: 'Geen ijs', tekst: 'Ook geen ijskoud water.', kleur: RED },
    { picFn: ov('zalf'), kop: 'Geen zalf', tekst: 'Op de brandwonde.', kleur: RED },
    { picFn: ov('blaar'), kop: 'Geen blaren openprikken', tekst: 'Laat ze dicht.', kleur: RED }], { gap: 16, pic: 58, headSize: 17, bodySize: 15.5 });
  end(s, r2.bottom, { blok: 'ongeval-brandwonden' });
})();

// 10.3.5 bloeding
(function () {
  const s = make('schema-bloeding', 'Ernstige bloeding en bloedneus',
    'Vier stappen bij een ernstige bloeding: handschoenen aan en het slachtoffer laten neerliggen, 112 alarmeren, 10 minuten op de wonde drukken met een drukverband of propere doek, blijven drukken tot de hulpdiensten aankomen. Onder: bij een bloedneus voorovergebogen zitten en de neus 10 minuten dichtknijpen.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'handschoen', kop: 'Handschoenen aan', tekst: 'Laat het slachtoffer neerliggen.' },
    { n: 2, pic: 'tel112', kop: 'Alarmeer 112', tekst: 'Roep de hulpdiensten.' },
    { n: 3, pic: 'druk', kop: '10 minuten drukken', tekst: 'Met een drukverband of propere doek.' },
    { n: 4, pic: 'klok', kop: 'Blijf drukken', tekst: 'Tot de hulpdiensten aankomen.' }], { gap: 22, arrows: true, pic: 60, headSize: 18, bodySize: 15.5 });
  const y = r.bottom + 16;
  const b1 = panel(s, 28, y, 744, { kop: 'Bloedneus', kleur: BLU, hpic: 'neus', rows: [
    { pic: 'persoon', tekst: 'Laat het slachtoffer voorovergebogen zitten' }, { pic: 'klok', tekst: 'Knijp de neus 10 minuten dichtgeknepen' }] });
  end(s, b1, { blok: 'ongeval-bloeding' });
})();

// 10.4.1 aanrijdingsformulier-schets
(function () {
  const s = make('schema-aanrijdingsformulier', 'Het aanrijdingsformulier',
    'Een schets van een leeg aanrijdingsformulier met twee kolommen voor partij A en partij B, een schetsvak en twee handtekeningvakken, zonder ingevulde waarden. Rechts uitleg: de voorzijde vul je samen in en onderteken je, de keerzijde vul je apart in, op papier of in de Crashform-app, en feiten vermelden is geen erkenning van aansprakelijkheid.', 400);
  const top = s.top + 16, px = 28, pw = 372;
  // papier
  s.add(`<rect x="${px + 4}" y="${top + 5}" width="${pw}" height="440" rx="8" fill="#1c2230" opacity=".12"/>`);
  s.add(`<rect x="${px}" y="${top}" width="${pw}" height="440" rx="8" fill="#fff" stroke="${LINE}" stroke-width="2"/>`);
  s.add(`<rect x="${px}" y="${top}" width="${pw}" height="34" rx="8" fill="${INK}"/><rect x="${px}" y="${top + 20}" width="${pw}" height="14" fill="${INK}"/>`);
  tx(s, px + pw / 2, top + 24, 'Aanrijdingsformulier (leeg)', { size: 16, weight: 700, fill: '#fff' });
  const colA = px + 14, colB = px + pw - 14 - 140;
  s.add(`<rect x="${colA}" y="${top + 46}" width="140" height="26" rx="6" fill="#cfe0fb"/><rect x="${colB}" y="${top + 46}" width="140" height="26" rx="6" fill="#fbefc2"/>`);
  tx(s, colA + 70, top + 64, 'Partij A', { size: 15, weight: 700 }); tx(s, colB + 70, top + 64, 'Partij B', { size: 15, weight: 700 });
  const velden = ['Verzekering', 'Bestuurder', 'Voertuig', 'Schade'];
  velden.forEach((v, i) => {
    const yy = top + 82 + i * 44;
    [colA, colB].forEach((cx, k) => {
      s.add(`<rect x="${cx}" y="${yy}" width="140" height="34" rx="5" fill="${k ? '#fdf8e3' : '#eef4fd'}" stroke="${LINE}"/>`);
      tx(s, cx + 8, yy + 13, v, { size: 12, weight: 600, fill: MUTE, anchor: 'start' });
      s.add(`<line x1="${cx + 8}" y1="${yy + 25}" x2="${cx + 120}" y2="${yy + 25}" stroke="#c4c9d2" stroke-width="2.5" stroke-linecap="round"/>`);
    });
  });
  const my = top + 82 + 4 * 44 + 4;
  tx(s, px + pw / 2, my + 14, 'Schets', { size: 14, weight: 700, fill: MUTE });
  s.add(`<rect x="${colA}" y="${my + 20}" width="${pw - 28}" height="92" rx="6" fill="#f6f7f4" stroke="${LINE}"/>`);
  s.add(`<rect x="${px + 30}" y="${my + 62}" width="${pw - 60}" height="24" fill="#d5d8de"/><rect x="${px + pw / 2 - 12}" y="${my + 24}" width="24" height="84" fill="#d5d8de"/>`);
  s.add(`<g transform="translate(${px + pw / 2 - 40} ${my + 74}) rotate(90)"><rect x="-8" y="-14" width="16" height="28" rx="4" fill="#9db9ea" stroke="${INK}" stroke-width="1.5"/></g><g transform="translate(${px + pw / 2 + 2} ${my + 92})"><rect x="-8" y="-14" width="16" height="28" rx="4" fill="#f0d36b" stroke="${INK}" stroke-width="1.5"/></g>`);
  const sy = my + 122;
  [colA, colB].forEach((cx) => { s.add(`<line x1="${cx}" y1="${sy + 24}" x2="${cx + 140}" y2="${sy + 24}" stroke="#9aa3b2" stroke-width="2"/>`); tx(s, cx + 70, sy + 42, 'Handtekening', { size: 12, weight: 600, fill: MUTE }); });
  // uitleg
  const b1 = panel(s, 420, top, 352, { kop: 'Zo werkt het', kleur: BLU, size: 16, rows: [
    { pic: 'document', tekst: 'Voorzijde: samen invullen en ondertekenen' },
    { pic: 'persoon', tekst: 'Keerzijde: elke partij vult zijn eigen deel apart in' },
    { pic: 'telefoon', tekst: 'Op papier of digitaal in de Crashform-app' },
    { pic: 'schild', tekst: 'Feiten vermelden is geen erkenning van aansprakelijkheid' }] });
  const b2 = banner(s, b1 + 14, 'Niet wettelijk verplicht, wel sterk aanbevolen.', INK, { x: 420, w: 352, size: 17 });
  end(s, Math.max(b2, top + 440), { blok: 'ongeval-aanrijdingsformulier' });
})();

// 10.4.2 formulier voor- en keerzijde
(function () {
  const s = make('schema-formulier-voor-keer', 'Zo vul je het formulier in',
    'Twee paneel naast elkaar. Voorzijde, de feiten: datum en plaats, voertuigen en verzekeringen, bestuurders, getuigen en omstandigheden, zichtbare schade en een schets. Keerzijde, jouw deel: politiegegevens, technische gegevens en je eigen mening. Onderaan: neem foto\'s en noteer naam en adres van getuigen.', 400);
  const y = s.top + 16;
  const pb = panels(s, y, [
    { x: 28, w: 364, o: { kop: 'Voorzijde: de feiten (samen)', kleur: GRN, hpic: 'document', size: 16, rows: [
      { pic: 'kalender', tekst: 'Datum en plaats' }, { pic: 'auto', tekst: 'Voertuigen, verzekeringen en bestuurders' },
      { pic: 'mensen', tekst: 'Getuigen en omstandigheden' }, { pic: 'verbanddoos', tekst: 'Zichtbare schade en een schets' }] } },
    { x: 408, w: 364, o: { kop: 'Keerzijde: jouw deel (apart)', kleur: BLU, hpic: 'persoon', size: 16, rows: [
      { pic: 'politie', tekst: 'Politiegegevens' }, { pic: 'tandwiel', tekst: 'Technische gegevens' }, { pic: 'spraak', tekst: 'Je eigen mening' }] } }]);
  const b = banner(s, pb + 14, 'Neem foto\'s van de situatie, de nummerplaten, de schade en de verkeersborden. Noteer naam en adres van getuigen.', INK, { size: 16.5 });
  end(s, b, { blok: 'ongeval-aanrijdingsformulier' });
})();

// 10.4.3 formulier volstaat niet
(function () {
  const s = make('schema-formulier-beslissing', 'Wanneer volstaat het formulier niet?',
    'Beslissingsschema met de vraag wat er gebeurd is en drie antwoorden. Enkel blikschade: formulier samen invullen. Gewonden: 112 bellen, politie erbij, proces-verbaal. Onbekende of onverzekerde tegenpartij: vraag uitleg aan je verzekeraar.', 400);
  const top = s.top + 14;
  pill(s, 400, top + 18, 'Wat is er gebeurd?', { size: 19, fill: INK });
  const cy = top + 56;
  s.add(`<path d="M400 ${top + 38} V${cy - 12} M139 ${cy - 12} H661 M139 ${cy - 12} V${cy} M400 ${cy - 12} V${cy} M661 ${cy - 12} V${cy}" fill="none" stroke="${GREY}" stroke-width="3.5" stroke-linecap="round"/>`);
  const r = cards(s, cy, [
    { pic: 'auto', kop: 'Enkel blikschade', tekst: 'Vul het formulier samen in.', kleur: GRN },
    { pic: 'ambulance', kop: 'Gewonden', tekst: 'Bel 112, haal de politie erbij. Zij maakt een proces-verbaal op.', kleur: RED },
    { pic: 'vraag', kop: 'Onbekende of onverzekerde tegenpartij', tekst: 'Vraag uitleg aan je verzekeraar.', kleur: ORG }], { gap: 18, pic: 64, headSize: 18, bodySize: 16 });
  const b = banner(s, r.bottom + 16, 'Meld de schade zo snel mogelijk aan je verzekeraar.', INK);
  end(s, b, { blok: 'ongeval-formulier-wanneer-niet' });
})();

// 10.4.4 verzekeringen
(function () {
  const s = make('schema-verzekeringen', 'BA, omnium en bestuurdersverzekering',
    'Links een rode auto die tegen een geparkeerde blauwe auto rijdt. Daaronder drie verzekeringen: de verplichte BA-verzekering vergoedt de schade die jij aan anderen veroorzaakt (de geparkeerde auto), omnium dekt je eigen voertuigschade volgens contract, en een bestuurders- of ongevallenverzekering dekt je eigen letsels.', 400);
  const top = s.top + 16;
  card(s, 28, top, 744, 150, { fill: SOFT });
  pic(s, 'auto', 150, top + 78, 130, '#d64545');
  s.arrow(222, top + 84, 410, top + 84, RED, 6);
  s.add(`<polygon points="${star(440, top + 70, 26, 14)}" fill="${YEL}" stroke="${INK}" stroke-width="3"/>`);
  pic(s, 'auto', 580, top + 78, 130, '#2f6fd6');
  tx(s, 150, top + 142, 'Jij rijdt', { size: 16, weight: 700 }); tx(s, 580, top + 142, 'Geparkeerde auto', { size: 16, weight: 700 });
  const r = cards(s, top + 170, [
    { pic: 'schild', kop: 'BA-verzekering (verplicht)', tekst: 'Betaalt de schade die jij aan anderen veroorzaakt, hier de geparkeerde auto.', kleur: GRN },
    { pic: 'auto', picArg: '#d64545', kop: 'Omnium', tekst: 'Je eigen voertuigschade, volgens contract.', kleur: BLU },
    { pic: 'persoon', kop: 'Bestuurdersverzekering', tekst: 'Je eigen letsels (ook: ongevallenverzekering).', kleur: ORG }], { gap: 14, pic: 54, headSize: 17, bodySize: 15.5 });
  end(s, r.bottom, { blok: 'ongeval-verzekering' });
})();

// 10.4.5 verzekeringsbewijs
(function () {
  const s = make('schema-verzekeringsbewijs', 'Het verzekeringsbewijs',
    'Links een schets van een verzekeringsbewijs (vroeger de groene kaart) met vakken voor landen en periode, zonder ingevulde waarden. Rechts vier punten: verplicht boorddocument, toon het bij een controle, mag ook elektronisch, vermeldt in welke landen en welke periode je gedekt bent. Onderaan het alcoholkader: de BA betaalt de slachtoffers, de verzekeraar kan het bedrag op jou verhalen.', 400);
  const top = s.top + 18;
  card(s, 28, top, 330, 220, { fill: '#fff' });
  s.add(`<path d="M28 ${top + 14} Q28 ${top} 42 ${top} H344 Q358 ${top} 358 ${top + 14} V${top + 56} H28 Z" fill="${GRN}"/>`);
  tx(s, 193, top + 28, 'Verzekeringsbewijs', { size: 21, weight: 700, fill: '#fff' });
  tx(s, 193, top + 48, 'vroeger: de groene kaart', { size: 14, weight: 500, fill: '#e6f5ea' });
  [['Landen', 70], ['Periode', 126]].forEach(([l, dy]) => {
    s.add(`<rect x="46" y="${top + dy}" width="294" height="44" rx="6" fill="#f3f5f2" stroke="${LINE}"/>`);
    tx(s, 58, top + dy + 18, l, { size: 14, weight: 700, fill: MUTE, anchor: 'start' });
    s.add(`<line x1="58" y1="${top + dy + 32}" x2="300" y2="${top + dy + 32}" stroke="#c4c9d2" stroke-width="3" stroke-linecap="round"/>`);
  });
  const b1 = panel(s, 380, top, 392, { kop: 'Wat moet je weten?', kleur: BLU, size: 16, rows: [
    { pic: 'document', tekst: 'Een verplicht boorddocument' }, { pic: 'politie', tekst: 'Toon het bij een controle' },
    { pic: 'telefoon', tekst: 'Mag ook elektronisch' }, { pic: 'kalender', tekst: 'Vermeldt landen en periode van dekking' }] });
  const b = banner(s, Math.max(b1, top + 220) + 16, 'Alcohol: de BA betaalt de slachtoffers, maar de verzekeraar kan het bedrag nadien op jou verhalen als dronkenschap de oorzaak was.', RED, { size: 16.5 });
  end(s, b, { blok: 'ongeval-verzekering' });
})();

// 10.5.1 driehoek 2027
(function () {
  const s = make('schema-driehoek-2027', 'Gevarendriehoek: nu en vanaf 1 juni 2027',
    'Twee kolommen. Nu, tot 1 juni 2027: je plaatst de gevarendriehoek als je niet weg kan. Vanaf 1 juni 2027 volgens de nieuwe wegcode: eerst gebruik je alle alarmlichten, kan dat niet dan plaats je nog een driehoek, op autosnelwegen op 100 meter. Onderaan: leer voor het examen de huidige regels.', 400);
  const y = s.top + 16;
  const pb = panels(s, y, [
    { x: 28, w: 364, o: { kop: 'Nu (tot 1 juni 2027)', kleur: INK, hpic: 'driehoek', rows: [
      { pic: 'auto', tekst: 'Je kan niet weg met je auto' }, { pic: 'driehoek', tekst: 'Plaats de gevarendriehoek' }] } },
    { x: 408, w: 364, o: { kop: 'Vanaf 1 juni 2027', kleur: ORG, hpic: 'kalender', rows: [
      { pic: 'autoachter', tekst: 'Eerst gebruik je alle alarmlichten' }, { pic: 'driehoek', tekst: 'Kan dat niet? Dan plaats je nog een driehoek' }, { pic: 'pin', tekst: 'Op autosnelwegen op 100 meter' }] } }]);
  const b = banner(s, pb + 14, 'Leer voor het examen de huidige regels.', RED);
  end(s, b, { blok: 'ongeval-gevarendriehoek' });
})();

// =====================================================================
// HOOFDSTUK 11 - RIJBEWIJS EN EXAMEN
// =====================================================================
const RB = ['RIJB-001'];
// 11.1.1 traject
(function () {
  const s = make('schema-traject-rijbewijs', 'Van theorie naar rijbewijs B',
    'Zes genummerde stappen in twee rijen: 1 theorie-examen vanaf 17 jaar (3 jaar geldig), 2 voorlopig rijbewijs (M36 vanaf 17 jaar, M18 vanaf 18 jaar), 3 minstens 5 maanden oefenen op de openbare weg, 4 praktijkexamen vanaf 18 jaar, 5 definitief rijbewijs aanvragen, 6 terugkommoment van 4 uur, 6 tot 9 maanden na het definitieve rijbewijs.', 400);
  const r1 = cards(s, s.top + 16, [
    { n: 1, pic: 'monitor', kop: 'Theorie-examen', tekst: 'Vanaf 17 jaar. Het resultaat blijft 3 jaar geldig.' },
    { n: 2, pic: 'kaart', kop: 'Voorlopig rijbewijs', tekst: 'M36 vanaf 17 jaar, M18 vanaf 18 jaar.' },
    { n: 3, pic: 'lplaat', kop: 'Oefenen', tekst: 'Minstens 5 maanden op de openbare weg.' }], { gap: 32, arrows: true, pic: 60, bodySize: 16 });
  const r2 = cards(s, r1.bottom + 18, [
    { n: 4, pic: 'stuur', kop: 'Praktijkexamen', tekst: 'Vanaf 18 jaar.' },
    { n: 5, pic: 'gebouw', kop: 'Definitief rijbewijs', tekst: 'Aanvragen bij je gemeente of via BelDrive.' },
    { n: 6, pic: 'boek', kop: 'Terugkommoment', tekst: '4 uur, 6 tot 9 maanden na je definitieve rijbewijs.' }], { gap: 32, arrows: true, pic: 60, bodySize: 16 });
  end(s, r2.bottom, { blok: 'rijbewijs-traject', bron: RB });
})();

// 11.1.2 leeftijden
(function () {
  const s = make('schema-leeftijden', 'Wat doe je op welke leeftijd?',
    'Tijdlijn met twee leeftijden. Vanaf 17 jaar: theorie-examen, voorlopig rijbewijs M36 aanvragen en altijd oefenen met een begeleider. Vanaf 18 jaar: praktijkexamen, voorlopig rijbewijs M18 aanvragen en zonder begeleider rijden.', 400);
  const y = s.top + 36;
  s.add(`<line x1="60" y1="${y}" x2="720" y2="${y}" stroke="${GREY}" stroke-width="6" stroke-linecap="round"/><path d="M716 ${y - 12} L736 ${y} L716 ${y + 12}" fill="none" stroke="${GREY}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
  [[210, '17', BLU], [590, '18', GRN]].forEach(([x, t, c]) => {
    s.add(`<circle cx="${x}" cy="${y}" r="30" fill="${c}" stroke="#fff" stroke-width="5"/>`);
    tx(s, x, y + 10, t, { size: 30, weight: 800, fill: '#fff' });
  });
  tx(s, 400, y - 12, '1 jaar later', { size: 15, weight: 600, fill: MUTE });
  const pb = panels(s, y + 52, [
    { x: 28, w: 364, o: { kop: 'Vanaf 17 jaar', kleur: BLU, hpic: 'monitor', rows: [
      { pic: 'monitor', tekst: 'Theorie-examen afleggen' }, { pic: 'kaart', tekst: 'Voorlopig rijbewijs M36 aanvragen' }, { pic: 'mensen', tekst: 'Altijd oefenen met een begeleider' }] } },
    { x: 408, w: 364, o: { kop: 'Vanaf 18 jaar', kleur: GRN, hpic: 'stuur', rows: [
      { pic: 'stuur', tekst: 'Praktijkexamen afleggen' }, { pic: 'kaart', tekst: 'Voorlopig rijbewijs M18 aanvragen' }, { pic: 'auto', tekst: 'Met M18 zonder begeleider rijden' }] } }]);
  end(s, pb, { blok: 'rijbewijs-traject', bron: RB });
})();

// 11.2.1 theorie-examen verloop
(function () {
  const s = make('schema-theorie-examen', 'Zo verloopt het theorie-examen',
    'Vier kaarten: 50 meerkeuzevragen die voorgelezen en getoond worden, 15 seconden per vraag nadat de vraag volledig is voorgelezen, identiteitskaart meenemen (een kopie volstaat niet) en de kostprijs van 19 euro. Onderaan: oefenen kan op het officiële platform Mijn rijbewijs B.', 400);
  const r = cards(s, s.top + 16, [
    { pic: 'monitor', kop: '50 vragen', tekst: 'Meerkeuze, voorgelezen en getoond op het scherm.' },
    { pic: 'klok', kop: '15 seconden', tekst: 'Per vraag, nadat ze volledig is voorgelezen.' },
    { pic: 'idkaart', kop: 'Identiteitskaart', tekst: 'Neem ze mee, een kopie volstaat niet.' },
    { pic: 'euro', kop: '19 euro', tekst: 'Kostprijs. Je bent minstens 17 jaar.' }], { gap: 14, pic: 64, headSize: 20, bodySize: 15.5 });
  const b = banner(s, r.bottom + 16, 'Oefenen kan op het officiële platform Mijn rijbewijs B. Rijschoollessen zijn optioneel.', BLU, { size: 17 });
  end(s, b, { blok: 'rijbewijs-theorie-examen-verloop', bron: RB });
})();

// 11.2.2 andere taal of meer tijd
(function () {
  const s = make('schema-theorie-hulp', 'Andere taal of meer tijd',
    'Twee paneel. Audiovertaling in het Frans, Duits of Engels: je hoort eerst Nederlands en dan je taal, een eigen tolk kan niet meer, 43 euro extra. Vertraagd examen voor leer- of leesstoornissen of analfabetisme: een examinator leest de vragen voor en je krijgt meer tijd, 19 euro, met attest of na 5 keer falen.', 400);
  const pb = panels(s, s.top + 16, [
    { x: 28, w: 364, o: { kop: 'Audiovertaling', kleur: BLU, hpic: 'spraak', rows: [
      { pic: 'spraak', tekst: 'Frans, Duits of Engels' }, { pic: 'adem', tekst: 'Je hoort eerst het Nederlands, dan jouw taal' },
      { ok: false, tekst: 'Een eigen tolk meebrengen kan niet meer' }, { pic: 'euro', tekst: '43 euro extra' }] } },
    { x: 408, w: 364, o: { kop: 'Vertraagd examen', kleur: GRN, hpic: 'klok', rows: [
      { pic: 'boek', tekst: 'Voor leer- of leesstoornissen of analfabetisme' }, { pic: 'persoon', tekst: 'Een examinator leest de vragen voor' },
      { pic: 'klok', tekst: 'Je krijgt meer tijd' }, { pic: 'euro', tekst: '19 euro' }] } }]);
  const b = banner(s, pb + 14, 'Voor het vertraagd examen heb je een attest nodig, of je hebt al 5 keer gefaald.', INK, { size: 17 });
  end(s, b, { blok: 'rijbewijs-theorie-examen-verloop', bron: RB });
})();

// 11.2.3 examenpunten
(function () {
  const s = make('schema-examenpunten', 'Zo tellen de punten',
    'Een balk van 50 punten. Je start met 50 punten. Een gewone fout of onbeantwoorde vraag kost 1 punt, een zware fout 5 punten. Met 41 tot 50 punten ben je geslaagd, met 40 of minder niet. Onder de balk drie kaarten: gewone fout min 1, zware fout min 5, geslaagd vanaf 41.', 400);
  const top = s.top + 16, x0 = 40, u = 14.4, by = top + 110, bh = 46;
  tx(s, 400, top + 18, 'Je start met 50 punten', { size: 22, weight: 700 });
  // verlies-blokjes boven het einde van de balk
  s.add(`<rect x="${x0 + 49 * u}" y="${by - 40}" width="${u}" height="22" rx="3" fill="${ORG}"/>`);
  tx(s, x0 + 49 * u - 10, by - 23, '−1  gewone fout of onbeantwoord', { size: 16, weight: 700, anchor: 'end', fill: '#b25f00' });
  s.add(`<rect x="${x0 + 45 * u}" y="${by - 72}" width="${5 * u}" height="22" rx="3" fill="${RED}"/>`);
  tx(s, x0 + 45 * u - 10, by - 55, '−5  zware fout', { size: 16, weight: 700, anchor: 'end', fill: RED });
  // balk
  s.add(`<rect x="${x0}" y="${by}" width="${40 * u}" height="${bh}" rx="8" fill="#f3b9b9"/><rect x="${x0 + 40 * u}" y="${by}" width="${10 * u}" height="${bh}" rx="8" fill="${GRN}"/><rect x="${x0 + 40 * u}" y="${by}" width="14" height="${bh}" fill="${GRN}"/><rect x="${x0 + 40 * u - 14}" y="${by}" width="14" height="${bh}" fill="#f3b9b9"/>`);
  for (let i = 1; i < 50; i++) s.add(`<line x1="${f(x0 + i * u)}" y1="${by}" x2="${f(x0 + i * u)}" y2="${by + bh}" stroke="#fff" stroke-width="1.2" opacity=".7"/>`);
  tx(s, x0 + 20 * u, by + 30, '40 punten of minder: niet geslaagd', { size: 19, weight: 700, fill: '#8a1f1f' });
  tx(s, x0 + 45 * u, by + 30, 'geslaagd', { size: 18, weight: 700, fill: '#fff' });
  s.add(`<path d="M${x0 + 40 * u} ${by + bh + 6} V${by + bh + 22} M${x0 + 50 * u} ${by + bh + 6} V${by + bh + 22} M${x0 + 40 * u} ${by + bh + 14} H${x0 + 50 * u}" stroke="${INK}" stroke-width="2.5" fill="none"/>`);
  tx(s, x0 + 40 * u, by + bh + 42, '41', { size: 20, weight: 800 });
  tx(s, x0 + 50 * u - 4, by + bh + 42, '50', { size: 20, weight: 800 });
  tx(s, x0 + 45 * u - 30, by + bh + 64, 'minstens 41 punten', { size: 15, weight: 600, fill: '#1f6d3b' });
  const r = cards(s, by + bh + 84, [
    { pic: 'uitroep', picArg: ORG, kop: 'Gewone fout of onbeantwoord', tekst: 'Je verliest 1 punt.', kleur: ORG },
    { pic: 'uitroep', picArg: RED, kop: 'Zware fout', tekst: 'Je verliest 5 punten.', kleur: RED },
    { pic: 'vink', kop: 'Geslaagd', tekst: 'Met minstens 41 van de 50 punten.', kleur: GRN }], { gap: 14, pic: 48, headSize: 17, bodySize: 16 });
  end(s, r.bottom, { blok: 'rijbewijs-theorie-examen-puntentelling', bron: RB });
})();

// 11.2.4 rekenvoorbeelden
(function () {
  const s = make('schema-examenpunten-voorbeelden', 'Zware fouten en rekenvoorbeelden',
    'Vijf voorbeelden met een balk van 50 punten. 9 gewone fouten geeft 41 punten: geslaagd. 10 gewone fouten geeft 40: niet geslaagd. 1 zware fout en 4 gewone fouten geeft 41: geslaagd. 1 zware fout en 5 gewone fouten geeft 40: niet geslaagd. 2 zware fouten geeft 40: niet geslaagd.', 400);
  const top = s.top + 14, bx = 300, u = 5.2, rowH = 54;
  // legenda
  [[GRN, 'behouden punten', 40], ['#f19b9b', 'gewone fout (−1)', 214], ['#a42020', 'zware fout (−5)', 410]].forEach(([c, t, x]) => {
    s.add(`<rect x="${x}" y="${top + 6}" width="18" height="18" rx="3" fill="${c}"/>`); tx(s, x + 26, top + 21, t, { size: 15, weight: 600, anchor: 'start' });
  });
  const rows = [['9 gewone fouten', 0, 9], ['10 gewone fouten', 0, 10], ['1 zware fout en 4 gewone fouten', 1, 4], ['1 zware fout en 5 gewone fouten', 1, 5], ['2 zware fouten', 2, 0]];
  const y0 = top + 56;
  rows.forEach(([t, z, g], i) => {
    const y = y0 + i * rowH, lost = z * 5 + g, score = 50 - lost, ok = score >= 41;
    card(s, 28, y, 744, rowH - 8, { rx: 10, fill: ok ? '#f2faf4' : '#fdf3f3', stroke: ok ? '#bfe3c9' : '#efc4c4' });
    tx(s, 42, y + (rowH - 8) / 2 + 6 - (nlines(t, 240, 16, 700) - 1) * 9.8, t, { size: 16, weight: 700, anchor: 'start', maxW: 240 });
    s.add(`<rect x="${bx}" y="${y + 8}" width="${f(score * u)}" height="${rowH - 24}" rx="3" fill="${GRN}"/>`);
    let x = bx + score * u;
    for (let k = 0; k < z; k++) { s.add(`<rect x="${f(x)}" y="${y + 8}" width="${f(5 * u - 1.4)}" height="${rowH - 24}" rx="3" fill="#a42020"/>`); x += 5 * u; }
    for (let k = 0; k < g; k++) { s.add(`<rect x="${f(x)}" y="${y + 8}" width="${f(u - 1.4)}" height="${rowH - 24}" rx="2" fill="#f19b9b"/>`); x += u; }
    tick(s, 590, y + (rowH - 8) / 2, ok, 13);
    tx(s, 610, y + (rowH - 8) / 2 + 6, `${score} punten`, { size: 16, weight: 800, anchor: 'start' });
    tx(s, 764, y + (rowH - 8) / 2 + 6, ok ? 'geslaagd' : 'gezakt', { size: 14.5, weight: 700, anchor: 'end', fill: ok ? '#1f6d3b' : '#a42020' });
  });
  const lx = bx + 41 * u;
  s.add(`<line x1="${f(lx)}" y1="${y0 - 6}" x2="${f(lx)}" y2="${y0 + rows.length * rowH - 4}" stroke="${INK}" stroke-width="2.5" stroke-dasharray="6 4"/>`);
  tx(s, lx, y0 - 10, '41', { size: 15, weight: 800 });
  const b = banner(s, y0 + rows.length * rowH + 6, 'Twee zware fouten betekent altijd gezakt, want 50 min 10 is 40.', RED, { size: 17 });
  end(s, b, { blok: 'rijbewijs-theorie-examen-puntentelling', bron: RB });
})();

// 11.2.5 herkansen
(function () {
  const s = make('schema-herkansen', 'Gezakt? Herkansen en geldigheid',
    'Een reeks van vijf mislukte pogingen met drie gevolgen. Na 2 keer: 12 uur theorieopleiding en een getuigschrift voor je derde poging. Na 4 keer: je volgt die lessen niet opnieuw. Na 5 keer: je kan ook zonder attest een vertraagd examen vragen. Onderaan: een geslaagd theorie-examen blijft 3 jaar geldig.', 400);
  const top = s.top + 16;
  pill(s, 400, top + 14, 'Herkansen kan, maar niet op dezelfde dag', { size: 17, fill: INK });
  const cx = [110, 255, 400, 545, 690], cy = top + 78;
  s.add(`<line x1="70" y1="${cy}" x2="730" y2="${cy}" stroke="${GREY}" stroke-width="5" stroke-linecap="round"/>`);
  cx.forEach((x, i) => {
    const hot = [1, 3, 4].includes(i);
    s.add(`<circle cx="${x}" cy="${cy}" r="26" fill="${hot ? RED : '#fff'}" stroke="${hot ? '#fff' : GREY}" stroke-width="${hot ? 4 : 4}"/>`);
    tx(s, x, cy + 8, String(i + 1), { size: 24, weight: 800, fill: hot ? '#fff' : MUTE });
  });
  tx(s, 70, cy + 52, 'aantal mislukte pogingen', { size: 15, weight: 600, fill: MUTE, anchor: 'start' });
  const r = cards(s, cy + 70, [
    { pic: 'boek', kop: 'Na 2 keer', tekst: '12 uur theorieopleiding en een getuigschrift voor je 3de poging.', kleur: BLU },
    { pic: 'vink', kop: 'Na 4 keer', tekst: 'Je moet die lessen niet opnieuw volgen.', kleur: ORG },
    { pic: 'klok', kop: 'Na 5 keer', tekst: 'Je kan ook zonder attest een vertraagd examen vragen.', kleur: GRN }], { gap: 14, pic: 52, headSize: 19, bodySize: 16 });
  // verbindingslijnen
  [[255, r.xs[0] + r.w / 2], [545, r.xs[1] + r.w / 2], [690, r.xs[2] + r.w / 2]].forEach(([a, b]) => s.add(`<path d="M${a} ${cy + 26} C${a} ${cy + 56} ${b} ${cy + 40} ${b} ${cy + 68}" fill="none" stroke="${GREY}" stroke-width="2.5" stroke-dasharray="5 5"/>`));
  const b = banner(s, r.bottom + 16, 'Een geslaagd theorie-examen blijft 3 jaar geldig. Doe in die tijd je praktijkexamen.', GRN, { size: 17 });
  end(s, b, { blok: 'rijbewijs-theorie-examen-herkansing-geldigheid', bron: RB });
})();

// 11.2.6 oogtest en foute antwoorden
(function () {
  const s = make('schema-na-het-examen', 'Oogtest en je foute antwoorden',
    'Drie stappen na het theorie-examen: direct na het examen kun je je foute antwoorden bekijken (later niet meer), na het geslaagde examen volgt een oogtest in het examencentrum, en slaag je daar niet voor dan raadpleeg je een oogarts. Onderaan: op het aanvraagdocument verklaar je zelf dat je medisch in staat bent om veilig te rijden.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'document', kop: 'Foute antwoorden', tekst: 'Je bekijkt ze meteen na het examen. Later kan dat niet meer.' },
    { n: 2, pic: 'oog', kop: 'Oogtest', tekst: 'Direct na het geslaagde examen, in het examencentrum.' },
    { n: 3, pic: 'persoon', kop: 'Niet geslaagd?', tekst: 'Dan raadpleeg je een oogarts.' }], { gap: 30, arrows: true, pic: 64, headSize: 19, bodySize: 16 });
  const b = banner(s, r.bottom + 16, 'Op het aanvraagdocument verklaar je zelf dat je medisch in staat bent om veilig te rijden.', INK, { size: 17 });
  end(s, b, { blok: 'rijbewijs-geldigheid-verlies', bron: RB });
})();

// 11.3.1 M36, M18, M12 (balken op schaal in maanden)
(function () {
  const s = make('schema-voorlopig-tijdlijn', 'Voorlopig rijbewijs: M36, M18 en M12',
    'Drie balken op dezelfde schaal in maanden. M36: 36 maanden geldig, vanaf 17 jaar, met 1 of 2 begeleiders. M18: 18 maanden geldig, vanaf 18 jaar, zonder begeleider. M12: 12 maanden geldig, eenmalig, aan te vragen na een verlopen voorlopig rijbewijs, met begeleider. Geen enkel voorlopig rijbewijs is verlengbaar.', 400);
  const top = s.top + 18, x0 = 150, mu = 15;
  const data = [['M36', 36, BLU, 'Vanaf 17 jaar, met 1 of 2 begeleiders'], ['M18', 18, GRN, 'Vanaf 18 jaar, zonder begeleider'], ['M12', 12, ORG, 'Eenmalig, na een verlopen voorlopig rijbewijs, met begeleider']];
  [12, 18, 36].forEach((m) => { s.add(`<line x1="${x0 + m * mu}" y1="${top}" x2="${x0 + m * mu}" y2="${top + 3 * 96 + 6}" stroke="${LINE}" stroke-width="2" stroke-dasharray="6 5"/>`); });
  data.forEach(([naam, m, col, uitleg], i) => {
    const y = top + 14 + i * 96;
    tx(s, 100, y + 38, naam, { size: 34, weight: 800, fill: col });
    s.add(`<rect x="${x0}" y="${y}" width="${m * mu}" height="48" rx="10" fill="${col}"/>`);
    tx(s, x0 + (m * mu) / 2, y + 31, m + ' maanden geldig', { size: 17.5, weight: 700, fill: '#fff' });
    tx(s, x0, y + 74, uitleg, { size: 16, weight: 600, anchor: 'start', fill: MUTE, maxW: 600 });
  });
  const b = banner(s, top + 3 * 96 + 22, 'Alle voorlopige rijbewijzen zijn niet verlengbaar.', INK, { size: 18 });
  end(s, b, { blok: 'rijbewijs-voorlopig-modellen', bron: RB });
})();

// 11.3.2 M36
(function () {
  const s = make('schema-m36', 'M36: oefenen met begeleider',
    'Vier kaarten: een M36 is 36 maanden geldig en kan vanaf 17 jaar; je oefent met 1 of 2 begeleiders; het voertuig heeft een extra achteruitkijkspiegel voor de begeleider; andere passagiers zijn niet toegestaan. Rijlessen bij een rijschool zijn niet verplicht.', 400);
  const r = cards(s, s.top + 16, [
    { pic: 'kalender', kop: '36 maanden', tekst: 'Aan te vragen vanaf 17 jaar.' },
    { pic: 'mensen', kop: '1 of 2 begeleiders', tekst: 'Je oefent altijd samen met een begeleider.' },
    { pic: 'spiegel', kop: 'Tweede spiegel', tekst: 'Een extra achteruitkijkspiegel voor de begeleider.' },
    { picFn: (s2, cx, cy, sz) => { pic(s2, 'persoon', cx, cy, sz); s2.add(`<g transform="translate(${f(cx - sz / 2)} ${f(cy - sz / 2)}) scale(${f(sz / 100)})">${PIC.verbod()}</g>`); }, kop: 'Geen andere passagiers', tekst: 'Andere passagiers zijn niet toegestaan.' }], { gap: 14, pic: 64, headSize: 18, bodySize: 15.5 });
  const b = banner(s, r.bottom + 16, 'Rijlessen bij een rijschool zijn niet verplicht.', BLU, { size: 17 });
  end(s, b, { blok: 'rijbewijs-voorlopig-modellen', bron: RB });
})();

// 11.3.3 M18
(function () {
  const s = make('schema-m18', 'M18: zonder begeleider',
    'Vier stappen: eerst minstens 20 uur rijles bij een erkende rijschool, dan een bekwaamheidsattest dat 3 jaar geldig is, dan de M18 aanvragen vanaf 18 jaar (18 maanden geldig), daarna zonder begeleider rijden met maximaal 2 passagiers. De passagiers voldoen aan dezelfde voorwaarden als een begeleider.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'stuur', kop: 'Rijles', tekst: 'Minstens 20 uur bij een erkende rijschool.' },
    { n: 2, pic: 'document', kop: 'Attest', tekst: 'Bekwaamheidsattest, 3 jaar geldig.' },
    { n: 3, pic: 'kaart', kop: 'M18 aanvragen', tekst: 'Vanaf 18 jaar, 18 maanden geldig.' },
    { n: 4, pic: 'mensen', kop: 'Zonder begeleider', tekst: 'Je mag maximaal 2 passagiers meenemen.' }], { gap: 24, arrows: true, pic: 60, headSize: 18, bodySize: 15.5 });
  const b = banner(s, r.bottom + 16, 'Je passagiers moeten aan dezelfde voorwaarden voldoen als een begeleider.', INK, { size: 17 });
  end(s, b, { blok: 'rijbewijs-voorlopig-modellen', bron: RB });
})();

// 11.3.4 M12 en wisselen
(function () {
  const s = make('schema-m12-wisselen', 'M12 en wisselen van model',
    'Twee paneel. Omwisselen: je mag één keer wisselen tussen M36 en M18, zolang je voorlopig rijbewijs en je theorie-examen nog geldig zijn. M12: aan te vragen nadat een eerder voorlopig rijbewijs is verlopen, met 6 uur rijles bij een erkende rijschool, 12 maanden geldig, met begeleider en maar één keer.', 400);
  const pb = panels(s, s.top + 16, [
    { x: 28, w: 364, o: { kop: 'Omwisselen: M36 en M18', kleur: BLU, hpic: 'pijl', rows: [
      { pic: 'pijl', tekst: 'Eén keer wisselen tussen M36 en M18' }, { pic: 'kaart', tekst: 'Zolang je voorlopig rijbewijs nog geldig is' }, { pic: 'monitor', tekst: 'En je theorie-examen nog geldig is' }] } },
    { x: 408, w: 364, o: { kop: 'Een extra kans: M12', kleur: ORG, hpic: 'kalender', rows: [
      { pic: 'kalender', tekst: 'Je vraagt hem aan nadat een voorlopig rijbewijs is verlopen' }, { pic: 'stuur', tekst: 'Je volgt 6 uur rijles bij een erkende rijschool' },
      { pic: 'mensen', tekst: '12 maanden geldig, met begeleider' }, { pic: 'slot', tekst: 'Je kan hem maar één keer aanvragen' }] } }]);
  end(s, pb, { blok: 'rijbewijs-voorlopig-modellen', bron: RB });
})();

// 11.3.5 begeleider
(function () {
  const s = make('schema-begeleider-voorwaarden', 'De begeleider: wie mag het zijn?',
    'Twee paneel. Links de voorwaarden voor een begeleider: ingeschreven in België met een Belgisch identiteitsdocument, minstens 8 jaar rijbewijs voor dat voertuig, niet vervallen verklaard van het recht tot sturen (ook niet in de laatste 3 jaar) en geen andere leerling begeleid in het afgelopen jaar. Rechts: maximaal 2 begeleiders, registratie bij het gemeentebestuur en de uitzondering voor familie.', 400);
  const pb = panels(s, s.top + 16, [
    { x: 28, w: 420, o: { kop: 'Een begeleider', kleur: GRN, hpic: 'persoon', size: 16.5, rows: [
      { ok: true, tekst: 'Ingeschreven in België, met een Belgisch identiteitsdocument' }, { ok: true, tekst: 'Minstens 8 jaar rijbewijs voor dat voertuig' },
      { ok: true, tekst: 'Niet vervallen verklaard van het recht tot sturen, ook niet in de laatste 3 jaar' }, { ok: true, tekst: 'Geen andere leerling begeleid in het afgelopen jaar' }] } },
    { x: 464, w: 308, o: { kop: 'Goed om te weten', kleur: BLU, hpic: 'mensen', size: 16.5, rows: [
      { pic: 'mensen', tekst: 'Je kiest maximaal 2 begeleiders' }, { pic: 'gebouw', tekst: 'Zij laten zich registreren bij het gemeentebestuur' },
      { pic: 'hart', tekst: 'Familie telt niet als andere leerling (kinderen, kleinkinderen, broers, zussen, pleegkinderen)' }] } }]);
  end(s, pb, { blok: 'rijbewijs-begeleider', bron: RB });
})();

// 11.3.6 vormingsmoment
(function () {
  const s = make('schema-vormingsmoment', 'Het vormingsmoment voor begeleiders',
    'Vier kaarten: het vormingsmoment duurt 3 uur en is geen verkeersexamen; een erkende rijschool of lesgever geeft het ter plaatse of live online; het attest is 10 jaar geldig; je volgt het minstens 5 maanden voor het praktijkexamen. Een attest uit Wallonië wordt niet aanvaard.', 400);
  const r = cards(s, s.top + 16, [
    { pic: 'klok', kop: '3 uur', tekst: 'Het is geen verkeersexamen.' },
    { pic: 'monitor', kop: 'Erkende rijschool of lesgever', tekst: 'Ter plaatse of live online.' },
    { pic: 'document', kop: 'Attest', tekst: '10 jaar geldig.' },
    { pic: 'kalender', kop: 'Minstens 5 maanden vooraf', tekst: 'Voor het praktijkexamen. Niet bij M12 of bij wisselen van M18 naar M36.' }], { gap: 12, pic: 60, headSize: 17, bodySize: 15 });
  const b = banner(s, r.bottom + 16, 'Een attest uit Wallonië wordt niet aanvaard.', RED, { size: 18 });
  end(s, b, { blok: 'rijbewijs-begeleider', bron: RB });
})();

// 11.3.7 oefenperiode
(function () {
  const s = make('schema-oefenperiode', 'De oefenperiode',
    'Een tijdlijn van minstens 5 maanden oefenen op de openbare weg tot het praktijkexamen, in vijf maandvakken. Daaronder drie kaarten: M12-houders zijn vrijgesteld, je theorie-examen moet bij het praktijkexamen nog geldig zijn, en je oefent alleen met je begeleider(s) of een erkende rij-instructeur.', 400);
  const top = s.top + 20, x0 = 60;
  tx(s, 400, top + 8, 'Minstens 5 maanden oefenen op de openbare weg', { size: 21, weight: 700 });
  for (let i = 0; i < 5; i++) {
    s.add(`<rect x="${x0 + i * 116}" y="${top + 28}" width="110" height="52" rx="${i === 0 ? 14 : 4}" fill="${BLU}" opacity="${0.55 + i * 0.1}"/>`);
    tx(s, x0 + i * 116 + 55, top + 62, 'maand ' + (i + 1), { size: 18, weight: 700, fill: '#fff' });
  }
  s.add(`<path d="M${x0 + 5 * 116 + 4} ${top + 54} H${x0 + 5 * 116 + 24}" stroke="${GREY}" stroke-width="5" stroke-linecap="round"/>`);
  pic(s, 'stuur', 700, top + 54, 56);
  tx(s, 700, top + 98, 'Praktijkexamen', { size: 16, weight: 700 });
  const r = cards(s, top + 116, [
    { pic: 'vink', kop: 'M12: vrijgesteld', tekst: 'Houders van een M12 moeten niet 5 maanden oefenen.' },
    { pic: 'monitor', kop: 'Theorie-examen geldig', tekst: 'Het moet bij het praktijkexamen nog geldig zijn.' },
    { pic: 'mensen', kop: 'Met wie?', tekst: 'Met je begeleider(s) of een erkende rij-instructeur.' }], { gap: 14, pic: 52, headSize: 18, bodySize: 15.5 });
  end(s, r.bottom, { blok: 'rijbewijs-oefenperiode-beperkingen', bron: RB });
})();

// 11.3.8 beperkingen
(function () {
  const s = make('schema-voorlopig-beperkingen', 'Wat mag je niet met een voorlopig rijbewijs?',
    'Vijf pictogrammen. Een L-teken staat goed zichtbaar op de achterruit. Niet rijden van 22 u tot 6 u op vrijdag, zaterdag, zondag, de vooravond van een feestdag en op feestdagen. Geen commercieel goederenvervoer. Geen aanhangwagen. Enkel rijden in België.', 400);
  const nee = (p) => (s2, cx, cy, sz) => { pic(s2, p, cx, cy, sz * 0.92); s2.add(`<g transform="translate(${f(cx - sz / 2)} ${f(cy - sz / 2)}) scale(${f(sz / 100)})">${PIC.verbod()}</g>`); };
  const r1 = cards(s, s.top + 16, [
    { pic: 'lplaat', kop: 'L-teken', tekst: 'Goed zichtbaar op de achterruit.', kleur: GRN },
    { picFn: nee('maan'), kop: 'Niet van 22 u tot 6 u', tekst: 'Op vr, za, zo, de vooravond van een feestdag en op feestdagen.', kleur: RED },
    { picFn: nee('vrachtje'), kop: 'Geen goederenvervoer', tekst: 'Niet commercieel.', kleur: RED }], { gap: 14, pic: 64, headSize: 18, bodySize: 15.5 });
  const r2 = cards(s, r1.bottom + 14, [
    { picFn: nee('aanhanger'), kop: 'Geen aanhangwagen', tekst: 'Je trekt er geen.', kleur: RED },
    { pic: 'pin', kop: 'Enkel in België', tekst: 'Het hele Belgische grondgebied, maar niet in het buitenland.', kleur: BLU }], { gap: 14, pic: 64, headSize: 18, bodySize: 15.5, x: 28, w: 744 });
  end(s, r2.bottom, { blok: 'rijbewijs-oefenperiode-beperkingen', bron: RB });
})();

// 11.4.1 praktijkexamen
(function () {
  const s = make('schema-praktijkexamen', 'Het praktijkexamen',
    'Drie kaarten: voorwaarden (vanaf 18 jaar, geldig theorie-examen en voorlopig rijbewijs; kostprijs 51 euro), onderdeel 1 een gevaarherkenningstest op de computer en onderdeel 2 de proef op de openbare weg. Onderaan: twee keer na elkaar gezakt betekent minstens 6 uur rijles bij een erkende rijschool voor je opnieuw mag.', 400);
  const r = cards(s, s.top + 16, [
    { pic: 'kaart', kop: 'Voorwaarden', tekst: 'Vanaf 18 jaar, met een geldig theorie-examen en voorlopig rijbewijs. Kostprijs: 51 euro.' },
    { n: 1, pic: 'monitor', kop: 'Gevaarherkenningstest', tekst: 'Eerst op de computer.' },
    { n: 2, pic: 'auto', kop: 'Proef op de weg', tekst: 'Daarna rijd je op de openbare weg.' }], { gap: 30, arrows: true, pic: 64, headSize: 18, bodySize: 15.5 });
  const b = banner(s, r.bottom + 16, 'Twee keer na elkaar gezakt? Dan volg je minstens 6 uur rijles bij een erkende rijschool voor je opnieuw mag.', RED, { size: 16.5 });
  end(s, b, { blok: 'rijbewijs-praktijkexamen-terugkommoment', bron: RB });
})();

// 11.4.2 na het praktijkexamen
(function () {
  const s = make('schema-na-praktijkexamen', 'Slagen: definitief rijbewijs en terugkommoment',
    'Drie stappen na een geslaagd praktijkexamen: je krijgt het formulier Aanvraag om een rijbewijs (3 jaar geldig, maar nog geen rijbewijs), je vraagt het rijbewijs aan bij je gemeente of via BelDrive en daarna volgt het verplichte terugkommoment van 4 uur, 6 tot 9 maanden na je definitieve rijbewijs.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'document', kop: 'Formulier', tekst: 'Aanvraag om een rijbewijs: 3 jaar geldig, maar nog geen rijbewijs.' },
    { n: 2, pic: 'gebouw', kop: 'Rijbewijs aanvragen', tekst: 'Bij je gemeente of via BelDrive.' },
    { n: 3, pic: 'boek', kop: 'Terugkommoment', tekst: 'Verplicht: 4 uur, 6 tot 9 maanden na je definitieve rijbewijs.' }], { gap: 30, arrows: true, pic: 64, headSize: 19, bodySize: 16 });
  const b = banner(s, r.bottom + 16, 'Het formulier na je examen is nog geen rijbewijs.', ORG, { size: 17 });
  end(s, b, { blok: 'rijbewijs-praktijkexamen-terugkommoment', bron: RB });
})();

// 11.5.1 geldigheid
(function () {
  const s = make('schema-rijbewijs-geldigheid', 'Geldigheid, vernieuwen en verlies',
    'Een tijdlijn van 10 jaar (kaartmodel) met de laatste 3 maanden gemarkeerd als moment om te vernieuwen. Daaronder drie kaarten: vernieuwen online via BelDrive of bij je gemeente, gestolen rijbewijs (eerst naar de politie, dan naar je gemeente) en een rijgeschiktheidsattest of verval (geen BelDrive, ga naar het gemeentebestuur).', 400);
  const top = s.top + 20, x0 = 40, mu = 6;
  tx(s, 400, top + 8, 'Een rijbewijs in kaartmodel is 10 jaar geldig', { size: 20, weight: 700 });
  s.add(`<rect x="${x0}" y="${top + 28}" width="${120 * mu}" height="40" rx="8" fill="${BLU}"/><rect x="${x0 + 117 * mu}" y="${top + 28}" width="${3 * mu}" height="40" fill="${RED}"/><rect x="${x0 + 117 * mu - 10}" y="${top + 28}" width="10" height="40" fill="${BLU}"/>`);
  tx(s, x0 + 55 * mu, top + 55, '10 jaar', { size: 20, weight: 700, fill: '#fff' });
  s.add(`<path d="M${x0 + 118.5 * mu} ${top + 74} V${top + 92}" stroke="${RED}" stroke-width="3"/>`);
  tx(s, x0 + 118.5 * mu, top + 110, 'Vernieuw minstens 3 maanden voor de einddatum', { size: 16, weight: 700, anchor: 'end', fill: RED, extra: '' });
  const r = cards(s, top + 128, [
    { pic: 'kaart', kop: 'Vernieuwen', tekst: 'Online via BelDrive of bij je gemeente.' },
    { pic: 'politie', kop: 'Gestolen', tekst: 'Eerst naar de politie, dan naar je gemeente.' },
    { pic: 'gebouw', kop: 'Attest of verval', tekst: 'Geen BelDrive: ga naar het gemeentebestuur.' }], { gap: 14, pic: 56, headSize: 19, bodySize: 16 });
  end(s, r.bottom, { blok: 'rijbewijs-geldigheid-verlies', bron: RB });
})();

// 11.5.2 verval
(function () {
  const s = make('schema-verval', 'Verval van het recht tot sturen',
    'Vier stappen: een rechter spreekt het verval uit (een straf, of je bent niet geschikt), het duurt minstens 8 dagen tot levenslang, je levert je rijbewijs in bij de griffier, en de rechter kan het herstel laten afhangen van een theorie-examen, een praktijkexamen of een medisch of psychologisch onderzoek.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'hamer', kop: 'De rechter', tekst: 'Spreekt het verval uit, ook rijverbod genoemd.' },
    { n: 2, pic: 'kalender', kop: 'Duur', tekst: 'Minstens 8 dagen tot levenslang.' },
    { n: 3, pic: 'kaart', kop: 'Inleveren', tekst: 'Je levert je rijbewijs in bij de griffier.' }], { gap: 30, arrows: true, pic: 60, headSize: 19, bodySize: 16 });
  const y = r.bottom + 16;
  tx(s, 400, y + 18, 'Herstel kan afhangen van', { size: 19, weight: 700 });
  const r2 = cards(s, y + 30, [
    { pic: 'monitor', kop: 'Theorie-examen', tekst: 'Opnieuw slagen.', fill: SOFT },
    { pic: 'stuur', kop: 'Praktijkexamen', tekst: 'Opnieuw slagen.', fill: SOFT },
    { pic: 'persoon', kop: 'Onderzoek', tekst: 'Medisch of psychologisch.', fill: SOFT }], { gap: 14, pic: 48, headSize: 18, bodySize: 16 });
  end(s, r2.bottom, { blok: 'rijbewijs-verval-intrekking', bron: RB });
})();

// 11.5.3 intrekking
(function () {
  const s = make('schema-intrekking', 'Onmiddellijke intrekking',
    'Drie stappen: in de regel beveelt de procureur de intrekking (soms een officier van gerechtelijke politie), de politie vraagt je rijbewijs af, na 15 dagen krijg je het terug tenzij de politierechtbank de intrekking met maximaal 3 maanden verlengt. Onder de stappen een tijdlijn op schaal met 15 dagen en een mogelijke verlenging van maximaal 3 maanden.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'gebouw', kop: 'Procureur', tekst: 'Beveelt de intrekking in de regel. Soms doet een officier van gerechtelijke politie dat.' },
    { n: 2, pic: 'politie', kop: 'Rijbewijs afgeven', tekst: 'De politie kan vragen dat je het meteen afgeeft.' },
    { n: 3, pic: 'kaart', kop: 'Na 15 dagen terug', tekst: 'Tenzij de intrekking verlengd wordt.' }], { gap: 30, arrows: true, pic: 56, headSize: 18, bodySize: 15 });
  const top = r.bottom + 22, x0 = 50, du = 6.6;
  s.add(`<rect x="${x0}" y="${top + 34}" width="${15 * du}" height="42" rx="8" fill="${ORG}"/><rect x="${x0 + 15 * du}" y="${top + 34}" width="${90 * du}" height="42" rx="8" fill="#cfdcf6" stroke="${BLU}" stroke-width="2.5" stroke-dasharray="7 5"/><rect x="${x0 + 15 * du - 10}" y="${top + 34}" width="10" height="42" fill="${ORG}"/>`);
  tx(s, x0 + 7.5 * du, top + 62, '15 dagen', { size: 17, weight: 700, fill: '#fff' });
  tx(s, x0 + 15 * du + 45 * du, top + 62, 'verlenging: maximaal 3 maanden', { size: 17, weight: 700, fill: BLU });
  tx(s, x0 + 7.5 * du, top + 22, 'intrekking', { size: 16, weight: 700, fill: '#b25f00' });
  tx(s, x0 + 15 * du + 45 * du, top + 22, 'alleen door de politierechtbank', { size: 16, weight: 600, fill: MUTE });
  const b = banner(s, top + 94, 'Intrekking is een tijdelijke maatregel: je krijgt je rijbewijs terug.', INK, { size: 17 });
  end(s, b, { blok: 'rijbewijs-verval-intrekking', bron: RB });
})();

// 11.5.4 verval of intrekking
(function () {
  const s = make('schema-verval-intrekking', 'Verval of intrekking: het verschil',
    'Twee paneel naast elkaar. Verval: beslist door de rechter, minstens 8 dagen tot levenslang, een straf of maatregel, soms herstel na een examen of onderzoek. Intrekking: beslist door de procureur of soms de gerechtelijke politie, 15 dagen tenzij verlengd tot maximaal 3 maanden, een tijdelijke maatregel, je krijgt je rijbewijs terug.', 400);
  const pb = panels(s, s.top + 16, [
    { x: 28, w: 364, o: { kop: 'Verval', kleur: RED, hpic: 'hamer', rows: [
      { pic: 'hamer', tekst: 'Beslist door de rechter' }, { pic: 'kalender', tekst: 'Minstens 8 dagen tot levenslang' },
      { pic: 'uitroep', picArg: RED, tekst: 'Een straf of maatregel' }, { pic: 'monitor', tekst: 'Soms herstel na een examen of onderzoek' }] } },
    { x: 408, w: 364, o: { kop: 'Intrekking', kleur: BLU, hpic: 'klok', rows: [
      { pic: 'gebouw', tekst: 'Beslist door de procureur, soms de gerechtelijke politie' }, { pic: 'kalender', tekst: '15 dagen, tenzij verlengd tot maximaal 3 maanden' },
      { pic: 'klok', tekst: 'Een tijdelijke maatregel' }, { pic: 'kaart', tekst: 'Je krijgt je rijbewijs terug' }] } }]);
  end(s, pb, { blok: 'rijbewijs-verval-intrekking', bron: RB });
})();

// 11.5.5 beginnende bestuurders
(function () {
  const s = make('schema-beginner-verval', 'Beginnende bestuurders',
    'Vier stappen: je hebt minder dan 2 jaar rijbewijs B, je wordt veroordeeld voor een overtreding die tot verval kan leiden, de rechter spreekt het verval uit en herstel kan pas na opnieuw slagen voor een theorie- of praktijkexamen. Sinds 1 juli 2026 geldt dit ook voor een voorlopig rijbewijs.', 400);
  const r = cards(s, s.top + 16, [
    { n: 1, pic: 'kaart', kop: 'Minder dan 2 jaar', tekst: 'Je bent minder dan 2 jaar houder van rijbewijs B.' },
    { n: 2, pic: 'uitroep', picArg: ORG, kop: 'Veroordeeld', tekst: 'Voor een overtreding die tot verval kan leiden.' },
    { n: 3, pic: 'hamer', kop: 'Verval', tekst: 'De rechter spreekt het verval uit.' },
    { n: 4, pic: 'monitor', kop: 'Opnieuw slagen', tekst: 'Herstel pas na een nieuw theorie- of praktijkexamen.' }], { gap: 22, arrows: true, pic: 56, headSize: 17, bodySize: 15 });
  const b = banner(s, r.bottom + 16, 'Sinds 1 juli 2026 geldt dit ook voor een voorlopig rijbewijs.', ORG, { size: 17 });
  end(s, b, { blok: 'rijbewijs-verval-intrekking', bron: RB });
})();

// 11.6.1 2027
(function () {
  const s = make('schema-theorie-2027', 'Wat verandert er in 2027?',
    'Drie kaarten over de aangekondigde wijziging: vanaf 1 januari 2027 moet je theorie-examen in een Vlaams examencentrum gebeuren, dat geldt als je in Vlaanderen praktijkexamen wilt doen, en er zijn geen overgangsmaatregelen. Onderaan: principieel goedgekeurd, maar nog niet definitief bevestigd.', 400);
  const r = cards(s, s.top + 16, [
    { pic: 'kalender', kop: '1 januari 2027', tekst: 'Vanaf dan geldt de aangekondigde regel.' },
    { pic: 'monitor', kop: 'Vlaams examencentrum', tekst: 'Je theorie-examen moet daar gebeuren.' },
    { pic: 'stuur', kop: 'Praktijkexamen in Vlaanderen', tekst: 'Dat geldt als je in Vlaanderen praktijkexamen wilt doen.' }], { gap: 14, pic: 60, headSize: 18, bodySize: 15.5 });
  const y = r.bottom + 14;
  pill(s, 400, y + 16, 'Er zijn geen overgangsmaatregelen', { size: 16, fill: MUTE });
  const b = banner(s, y + 44, 'Principieel goedgekeurd, maar nog niet definitief bevestigd. Controleer de actuele regels op vlaanderen.be.', ORG, { size: 16.5 });
  end(s, b, { blok: 'rijbewijs-theorie-examen-verloop', bron: RB });
})();

// ---------- registratie ----------
const idx = REG.slice().sort((a, b) => a.naam.localeCompare(b.naam));
fs.writeFileSync(path.join(ROOT, 'data', 'schemas-extra-c.json'), JSON.stringify(idx, null, 1) + '\n');
console.log(idx.length + " extra schema's (c) geschreven");
