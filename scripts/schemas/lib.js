'use strict';
// Helpers om originele SVG-schema's te tekenen (bovenaanzicht).
// Alle schema's: viewBox 0 0 800 600 (tenzij anders), eigen achtergrond, <title> + <desc>.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'site', 'img', 'schemas');
const BORDEN = path.join(ROOT, 'site', 'img', 'borden');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  grass: '#86b96b', grass2: '#74a85a', road: '#4a4f57', road2: '#5a606a', line: '#ffffff', yellow: '#f2c230',
  ink: '#1c2230', paper: '#fffdf7', rail: '#8a8f98', tie: '#6b5a48', sidewalk: '#c9c9c4', bike: '#b8574b',
  earth: '#b08a5a', red: '#d63a3a', green: '#2f9e5a', orange: '#f08a1c', blue: '#2f6fd6', purple: '#8e5bd1', water: '#7fb8e0'
};
const CAR = {
  rood: '#d64545', blauw: '#2f6fd6', geel: '#f0b429', groen: '#2ea36b', paars: '#8e5bd1', oranje: '#f08a2b', wit: '#ececec', grijs: '#9aa3ad'
};
const CARORDER = ['rood', 'blauw', 'geel', 'groen', 'paars', 'oranje'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = (n) => Math.round(n * 100) / 100;
const FONT = "font-family=\"Segoe UI, Helvetica, Arial, sans-serif\"";

const signCache = {};
function signData(code) {
  if (!signCache[code]) {
    const p = path.join(BORDEN, code + '.svg');
    if (!fs.existsSync(p)) throw new Error('bord ontbreekt: ' + code);
    signCache[code] = 'data:image/svg+xml;base64,' + fs.readFileSync(p).toString('base64');
  }
  return signCache[code];
}

// leesbare naam van een bord (zonder code), uit data/borden-index.json
let _bordenIndex = null;
function signNaam(code) {
  if (!_bordenIndex) {
    try { _bordenIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'borden-index.json'), 'utf8')); } catch (e) { _bordenIndex = {}; }
  }
  const n = _bordenIndex[code] && _bordenIndex[code].naam_nl;
  return (n || 'verkeersbord').replace(/s*([^)]*)s*$/, '');
}

class Svg {
  constructor(naam, title, desc, opt = {}) {
    this.naam = naam; this.title = title; this.desc = desc;
    this.w = opt.w || 800; this.h = opt.h || 600;
    this.defs = []; this.b = []; this.markers = {}; this.borden = new Set(); this.nr = 0;
    this.bg = opt.bg || C.grass;
    if (opt.bg !== 'none') this.b.push(`<rect width="${this.w}" height="${this.h}" fill="${this.bg}"/>`);
  }
  add(s) { this.b.push(s); return this; }
  uid(p) { return p + (++this.nr); }
  marker(color) {
    if (!this.markers[color]) {
      const id = 'ah' + color.replace(/[^a-z0-9]/gi, '');
      this.markers[color] = id;
      this.defs.push(`<marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L10 5 L0 10 z" fill="${color}"/></marker>`);
    }
    return this.markers[color];
  }
  rect(x, y, w, h, fill, extra = '') { return this.add(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${extra}/>`); }
  line(x1, y1, x2, y2, stroke, w = 3, extra = '') { return this.add(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`); }
  circle(x, y, r, fill, extra = '') { return this.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" ${extra}/>`); }
  text(x, y, str, o = {}) {
    const size = o.size || 20;
    const lines = String(str).split('\n');
    const tspans = lines.map((l, i) => `<tspan x="${f(x)}" dy="${i === 0 ? 0 : f(size * 1.18)}">${esc(l)}</tspan>`).join('');
    return this.add(`<text x="${f(x)}" y="${f(y)}" ${FONT} font-size="${size}" font-weight="${o.weight || 600}" fill="${o.fill || C.ink}" text-anchor="${o.anchor || 'middle'}" ${o.extra || ''}>${tspans}</text>`);
  }
  // label met achtergrondpil. anchor = middle
  label(x, y, str, o = {}) {
    const size = o.size || 18;
    const lines = String(str).split('\n');
    const wmax = Math.max(...lines.map((l) => l.length));
    const w = wmax * size * 0.56 + 18, h = lines.length * size * 1.18 + 10;
    const bg = o.bg || '#ffffff', fg = o.fg || C.ink;
    const left = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
    this.add(`<rect x="${f(left)}" y="${f(y - size - 2)}" width="${f(w)}" height="${f(h)}" rx="${o.rx == null ? 9 : o.rx}" fill="${bg}" ${o.stroke ? `stroke="${o.stroke}" stroke-width="2"` : ''} opacity="${o.opacity || 0.95}"/>`);
    return this.text(left + w / 2, y, str, { size, fill: fg, weight: o.weight || 700 });
  }
  // titelbalk bovenaan
  titel(str, sub) { this._titel = { str, sub }; return this; }
  _drawTitel() {
    const { str, sub } = this._titel;
    this.add(`<rect x="0" y="0" width="${this.w}" height="${sub ? 66 : 48}" fill="#1c2230" opacity="0.9"/>`);
    this.text(this.w / 2, 33, str, { size: str.length > 46 ? 22 : 26, fill: '#fff', weight: 700 });
    if (sub) this.text(this.w / 2, 57, sub, { size: 16, fill: '#d6dbe6', weight: 500 });
  }
  // gestippelde baan met pijlpunt: pts = SVG path d-string
  route(d, color = '#fff', o = {}) {
    const m = this.marker(color);
    const w = o.w || 5;
    this.add(`<path d="${d}" fill="none" stroke="#fff" stroke-width="${w + 4}" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>`);
    return this.add(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${o.dash || '11 8'}" marker-end="url(#${m})"/>`);
  }
  arrow(x1, y1, x2, y2, color = C.ink, w = 5) {
    const m = this.marker(color);
    return this.add(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#${m})"/>`);
  }
  // bord uit site/img/borden, ingebed als data-URI (werkt ook als <img src>), gecentreerd op x,y
  sign(code, x, y, size = 64, o = {}) {
    this.borden.add(code);
    if (o.pole !== false) this.line(x, y + size / 2 - 2, x, y + size / 2 + 12, '#8d949e', 4);
    return this.add(`<image href="${signData(code)}" x="${f(x - size / 2)}" y="${f(y - size / 2)}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"><title>Verkeersbord: ${esc(signNaam(code))}</title></image>`);
  }
  // voertuigen
  car(x, y, rot, kleur, nr, o = {}) {
    const col = CAR[kleur] || kleur;
    const dark = '#1c2230';
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">`;
    s += `<rect x="-16" y="-30" width="32" height="60" rx="9" fill="${col}" stroke="${dark}" stroke-width="2.5"/>`;
    s += `<rect x="-11" y="-20" width="22" height="9" rx="3" fill="#cfe6f7" stroke="${dark}" stroke-width="1.5"/>`;
    s += `<rect x="-11" y="17" width="22" height="7" rx="3" fill="#b9d3e6" stroke="${dark}" stroke-width="1.5"/>`;
    s += `<rect x="-13" y="-31" width="7" height="4" rx="2" fill="#fff3a8"/><rect x="6" y="-31" width="7" height="4" rx="2" fill="#fff3a8"/>`;
    if (o.blink === 'L' || o.blink === 'W') s += `<circle cx="-15" cy="-27" r="5" fill="#ff9d00" stroke="#fff" stroke-width="1.5"/><circle cx="-15" cy="27" r="5" fill="#ff9d00" stroke="#fff" stroke-width="1.5"/>`;
    if (o.blink === 'R' || o.blink === 'W') s += `<circle cx="15" cy="-27" r="5" fill="#ff9d00" stroke="#fff" stroke-width="1.5"/><circle cx="15" cy="27" r="5" fill="#ff9d00" stroke="#fff" stroke-width="1.5"/>`;
    if (o.brake) s += `<rect x="-13" y="28" width="7" height="3" fill="#ff2d2d"/><rect x="6" y="28" width="7" height="3" fill="#ff2d2d"/>`;
    s += '</g>';
    this.add(s);
    if (nr != null) this.badge(x, y, nr, { r: 13 });
    return this;
  }
  badge(x, y, nr, o = {}) {
    const r = o.r || 13;
    this.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${o.fill || '#fff'}" stroke="${C.ink}" stroke-width="2.5"/>`);
    return this.text(x, y + r * 0.38, nr, { size: r * 1.35, fill: o.fg || C.ink, weight: 800 });
  }
  bus(x, y, rot, nr, o = {}) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">`;
    s += `<rect x="-19" y="-58" width="38" height="116" rx="8" fill="${o.color || '#f2c230'}" stroke="${C.ink}" stroke-width="2.5"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="-14" y="${-48 + i * 20}" width="28" height="12" rx="3" fill="#cfe6f7" stroke="${C.ink}" stroke-width="1.2"/>`;
    s += `<rect x="-15" y="-60" width="8" height="4" rx="2" fill="#fff3a8"/><rect x="7" y="-60" width="8" height="4" rx="2" fill="#fff3a8"/>`;
    if (o.blink === 'L') s += `<circle cx="-18" cy="-55" r="5" fill="#ff9d00" stroke="#fff" stroke-width="1.5"/><circle cx="-18" cy="55" r="5" fill="#ff9d00" stroke="#fff" stroke-width="1.5"/>`;
    s += '</g>';
    this.add(s);
    if (nr != null) this.badge(x, y, nr);
    return this;
  }
  tram(x, y, rot, nr, o = {}) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">`;
    s += `<rect x="-17" y="-85" width="34" height="170" rx="10" fill="#e8e8ec" stroke="${C.ink}" stroke-width="2.5"/>`;
    s += `<rect x="-17" y="-52" width="34" height="104" rx="2" fill="#2f6fd6" opacity="0.9"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="-12" y="${-76 + i * 27}" width="24" height="16" rx="3" fill="#cfe6f7" stroke="${C.ink}" stroke-width="1.2"/>`;
    s += `<line x1="-17" y1="0" x2="17" y2="0" stroke="${C.ink}" stroke-width="2"/>`;
    s += '</g>';
    this.add(s);
    if (nr != null) this.badge(x, y, nr);
    return this;
  }
  truck(x, y, rot, nr, o = {}) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">`;
    s += `<rect x="-19" y="-58" width="38" height="28" rx="6" fill="${o.cab || '#2f6fd6'}" stroke="${C.ink}" stroke-width="2.5"/>`;
    s += `<rect x="-13" y="-52" width="26" height="9" rx="3" fill="#cfe6f7" stroke="${C.ink}" stroke-width="1.2"/>`;
    s += `<rect x="-21" y="-28" width="42" height="86" rx="3" fill="${o.box || '#f1f1ee'}" stroke="${C.ink}" stroke-width="2.5"/>`;
    s += '</g>';
    this.add(s);
    if (nr != null) this.badge(x, y + 10, nr);
    return this;
  }
  ambulance(x, y, rot, nr) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">`;
    s += `<rect x="-18" y="-38" width="36" height="76" rx="8" fill="#fafafa" stroke="${C.ink}" stroke-width="2.5"/>`;
    s += `<rect x="-12" y="-28" width="24" height="10" rx="3" fill="#cfe6f7" stroke="${C.ink}" stroke-width="1.2"/>`;
    s += `<rect x="-4" y="2" width="8" height="24" fill="#d63a3a"/><rect x="-12" y="10" width="24" height="8" fill="#d63a3a"/>`;
    s += `<circle cx="-9" cy="-8" r="5" fill="#1f6fff" stroke="#fff" stroke-width="1.5"/><circle cx="9" cy="-8" r="5" fill="#1f6fff" stroke="#fff" stroke-width="1.5"/>`;
    s += '</g>';
    this.add(s);
    // blauw knipperlicht-stralen
    this.add(`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})" stroke="#1f6fff" stroke-width="3" stroke-linecap="round"><line x1="-17" y1="-14" x2="-27" y2="-20"/><line x1="-19" y1="-8" x2="-31" y2="-8"/><line x1="17" y1="-14" x2="27" y2="-20"/><line x1="19" y1="-8" x2="31" y2="-8"/></g>`);
    if (nr != null) this.badge(x, y + 18, nr, { r: 11 });
    return this;
  }
  ped(x, y, nr, o = {}) {
    const rot = o.rot || 0;
    this.add(`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><ellipse cx="0" cy="0" rx="12" ry="6.5" fill="${o.color || '#2d4a8a'}" stroke="#fff" stroke-width="1.5"/><circle cx="0" cy="0" r="6" fill="#f1c9a5" stroke="${C.ink}" stroke-width="1.5"/></g>`);
    if (nr != null) this.badge(x + 20, y - 14, nr, { r: 11 });
    return this;
  }
  bike(x, y, rot, nr, o = {}) {
    this.add(`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><rect x="-3" y="-20" width="6" height="40" rx="3" fill="#333" stroke="#fff" stroke-width="1.2"/><line x1="-11" y1="-13" x2="11" y2="-13" stroke="#333" stroke-width="3" stroke-linecap="round"/><ellipse cx="0" cy="0" rx="10" ry="6" fill="${o.color || '#e0782a'}" stroke="#fff" stroke-width="1.5"/><circle cx="0" cy="-3" r="5.5" fill="#f1c9a5" stroke="${C.ink}" stroke-width="1.5"/></g>`);
    if (nr != null) this.badge(x + 22, y, nr, { r: 11 });
    return this;
  }
  // ----- wegen -----
  // kruispunt met middelpunt (cx,cy), halve breedte hw. arms: n,e,s,w
  crossroad(cx, cy, hw = 60, arms = { n: 1, e: 1, s: 1, w: 1 }, o = {}) {
    const W = this.w, H = this.h;
    const road = o.road || C.road;
    if (arms.n) this.rect(cx - hw, 0, hw * 2, cy, road);
    if (arms.s) this.rect(cx - hw, cy, hw * 2, H - cy, road);
    if (arms.w) this.rect(0, cy - hw, cx, hw * 2, road);
    if (arms.e) this.rect(cx, cy - hw, W - cx, hw * 2, road);
    this.rect(cx - hw, cy - hw, hw * 2, hw * 2, road);
    const dash = 'stroke-dasharray="16 14"';
    const lc = o.lineColor || '#fff';
    if (!o.noLines) {
      if (arms.n) this.line(cx, 0, cx, cy - hw - 8, lc, 3, dash);
      if (arms.s) this.line(cx, cy + hw + 8, cx, H, lc, 3, dash);
      if (arms.w) this.line(0, cy, cx - hw - 8, cy, lc, 3, dash);
      if (arms.e) this.line(cx + hw + 8, cy, W, cy, lc, 3, dash);
    }
    return this;
  }
  // stopstreep (breedte over 1 rijstrook)
  stopline(x, y, orient = 'h', len = 56) {
    if (orient === 'h') return this.rect(x - len / 2, y - 3, len, 6, '#fff');
    return this.rect(x - 3, y - len / 2, 6, len, '#fff');
  }
  zebra(x, y, w, h, orient = 'v') {
    // x,y = linkerbovenhoek; streepjes lopen evenwijdig met de rijrichting
    this.rect(x, y, w, h, 'none');
    let s = '';
    if (orient === 'v') { // oversteek van links naar rechts (voetganger loopt horizontaal), strepen verticaal gestapeld
      for (let i = 0; i < h; i += 18) s += `<rect x="${f(x)}" y="${f(y + i)}" width="${f(w)}" height="9" fill="#fff"/>`;
    } else {
      for (let i = 0; i < w; i += 18) s += `<rect x="${f(x + i)}" y="${f(y)}" width="9" height="${f(h)}" fill="#fff"/>`;
    }
    return this.add(s);
  }
  // spoor: horizontaal of verticaal, van (x1,y1) naar (x2,y2) breedte 28
  track(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    let s = `<g transform="translate(${f(x1)} ${f(y1)}) rotate(${f(ang)})">`;
    for (let i = 0; i < len; i += 14) s += `<rect x="${i}" y="-15" width="6" height="30" fill="${C.tie}"/>`;
    s += `<line x1="0" y1="-8" x2="${f(len)}" y2="-8" stroke="${C.rail}" stroke-width="3.5"/><line x1="0" y1="8" x2="${f(len)}" y2="8" stroke="${C.rail}" stroke-width="3.5"/></g>`;
    return this.add(s);
  }
  // laat dit tekenstuk toe om een rechthoekig deel te knippen
  finish(info = {}) {
    if (this._titel) this._drawTitel();
    const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img" aria-labelledby="t d">\n<title id="t">${esc(this.title)}</title>\n<desc id="d">${esc(this.desc)}</desc>\n${defs}\n${this.b.join('\n')}\n</svg>\n`;
    fs.writeFileSync(path.join(OUT, this.naam + '.svg'), svg);
    return { naam: this.naam, bestand: 'img/schemas/' + this.naam + '.svg', titel: this.title, beschrijving: this.desc, borden: [...this.borden].map(signNaam), ...info };
  }
}

// registratie voor data/schemas-index.json
const REGISTRY = [];
function register(entry) { REGISTRY.push(entry); return entry; }

// percentages t.o.v. de afbeelding
const pct = (svg, x, y) => ({ x: f((x / svg.w) * 100), y: f((y / svg.h) * 100) });
const pbox = (svg, x, y, w, h) => ({ x: f((x / svg.w) * 100), y: f((y / svg.h) * 100), w: f((w / svg.w) * 100), h: f((h / svg.h) * 100) });

module.exports = { Svg, C, CAR, CARORDER, REGISTRY, register, pct, pbox, esc, f, OUT, ROOT };
