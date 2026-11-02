/* Gedeelde hulpfuncties: opslag, thema, DOM, markdown-light, iconen, afbeeldingen. Klassiek script (werkt via file://). */
(function () {
  'use strict';
  var C = window.CURSUS || { oefeningen: [], theorie: [], boeken: {}, curriculum: [], afb: {}, bronnen: {}, borden: {}, credits: [], themaNamen: {}, blokPagina: {} };
  var App = (window.App = window.App || {});
  App.C = C;

  /* ---------- opslag (altijd in try/catch; valt terug op geheugen) ---------- */
  var KEY = 'rbc.v1';
  var state = { v: 1, done: {}, last: {}, res: {}, fouten: {}, eind: {}, exam: [] };
  var storageOK = true;
  try {
    var raw = window.localStorage.getItem(KEY);
    if (raw) {
      var p = JSON.parse(raw);
      if (p && typeof p === 'object') for (var k in p) state[k] = p[k];
    }
  } catch (e) { storageOK = false; }
  App.state = state;
  App.storageOK = function () { return storageOK; };
  App.save = function () {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { storageOK = false; }
  };
  App.markDone = function (les, idx) {
    var d = (state.done[les] = state.done[les] || {});
    if (!d[idx]) { d[idx] = 1; App.save(); }
  };
  App.isDone = function (les, idx) { return !!(state.done[les] && state.done[les][idx]); };
  App.recordResult = function (id, ok) {
    state.res[id] = ok ? 1 : 0;
    if (ok) delete state.fouten[id];
    else state.fouten[id] = (state.fouten[id] || 0) + 1;
    App.save();
  };
  App.foutIds = function () { return Object.keys(state.fouten); };

  /* ---------- thema ---------- */
  var root = document.documentElement;
  function applyTheme(t) {
    if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
  }
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('theme-btn');
    if (b) b.addEventListener('click', function () {
      var n = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(n);
      try { localStorage.setItem('rbc.theme', n); } catch (e) { /* geblokkeerd: dan enkel voor deze pagina */ }
    });
    var m = document.getElementById('menu-btn');
    var nav = document.getElementById('site-nav');
    if (m && nav) m.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      m.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- helpers ---------- */
  var uidN = 0;
  App.uid = function (p) { return (p || 'u') + (++uidN); };
  App.esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  App.shuffle = function (a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  App.norm = function (s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/(\d),(\d)/g, '$1.$2').replace(/[’'`´"]/g, '').replace(/\s+/g, ' ').trim();
  };
  App.normCompact = function (s) { return App.norm(s).replace(/[\s.\-_]/g, ''); };
  App.matchAny = function (input, list) {
    var a = App.norm(input), b = App.normCompact(input);
    if (!a) return false;
    for (var i = 0; i < list.length; i++) {
      if (App.norm(list[i]) === a || App.normCompact(list[i]) === b) return true;
    }
    return false;
  };

  /** el('div', {class:'x', on:{click:fn}, html:'..', text:'..', data:{a:1}, aria-label:'..'}, ...kinderen) */
  App.el = function (tag, attrs) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'on') for (var ev in v) n.addEventListener(ev, v[ev]);
      else if (k === 'data') for (var d in v) n.dataset[d] = v[d];
      else if (v === true) n.setAttribute(k, '');
      else n.setAttribute(k, v);
    }
    for (var i = 2; i < arguments.length; i++) append(n, arguments[i]);
    return n;
  };
  function append(n, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { append(n, x); });
    else if (typeof c === 'string' || typeof c === 'number') n.appendChild(document.createTextNode(c));
    else n.appendChild(c);
  }

  /* inline markdown-light: **vet**, `code` */
  /* Toon geen bordcodes of artikelnummers in de leerinhoud. */
  var CODE = '(?:Z)?[A-GZ]\\d{1,2}[a-z]?(?:[_-]\\d+)?';
  var RE_CODES = new RegExp('\\s*\\((?:\\s*(?:' + CODE + '|…|\\.\\.\\.|en|of|t\\.e\\.m\\.|[,/;–-])\\s*)+\\)', 'g');
  App.clean = function (s) {
    return String(s == null ? '' : s).replace(RE_CODES, '')
      .replace(/\s*\((?:art\.|artikel)[^)]*\)/gi, '')
      .replace(/,?\s*\bart(?:ikel|\.)\s*\d+[\d.a-z°]*(?:\s*(?:lid|§)\s*\d+)?/gi, '')
      .replace(/[ \t]{2,}/g, ' ').trim();
  };
  App.inline = function (s) {
    return App.esc(App.clean(s)).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  };
  /* blok-markdown-light: alinea's, "- " lijsten, "1. " lijsten */
  App.md = function (text) {
    if (!text) return '';
    text = String(text).split('\n').map(function (l) { return App.clean(l); }).join('\n');
    var out = [];
    String(text).split(/\n\s*\n/).forEach(function (para) {
      var lines = para.split('\n');
      var buf = [], list = null;
      function flush() {
        if (buf.length) { out.push('<p>' + buf.map(App.inline).join('<br>') + '</p>'); buf = []; }
        if (list) { out.push('<' + list.t + '>' + list.items.map(function (i) { return '<li>' + App.inline(i) + '</li>'; }).join('') + '</' + list.t + '>'); list = null; }
      }
      lines.forEach(function (ln) {
        var m = /^\s*[-•]\s+(.*)$/.exec(ln), o = /^\s*\d+[.)]\s+(.*)$/.exec(ln);
        if (m || o) {
          var t = m ? 'ul' : 'ol';
          if (buf.length) { out.push('<p>' + buf.map(App.inline).join('<br>') + '</p>'); buf = []; }
          if (list && list.t !== t) flush();
          list = list || { t: t, items: [] };
          list.items.push((m || o)[1]);
        } else {
          if (list) flush();
          if (ln.trim()) buf.push(ln.trim());
        }
      });
      flush();
    });
    return out.join('');
  };
  App.plain = function (s) { return App.clean(s || '').replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim(); };

  /* ---------- iconen ---------- */
  var ICONS = {
    regel: '<path d="M4 5h16M4 10h16M4 15h10"/><path d="M17 17l2 2 3-4"/>',
    letop: '<path d="M12 3l10 17H2z"/><path d="M12 10v4M12 17v.5"/>',
    zwarefout: '<circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/>',
    tip: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
    gewest: '<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    uitzondering: '<path d="M4 7h12M4 12h8M4 17h12"/><circle cx="19" cy="12" r="2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    up: '<path d="M5 15l7-7 7 7"/>',
    down: '<path d="M5 9l7 7 7-7"/>',
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    theory: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M9 8h6M9 12h6"/>',
    retry: '<path d="M4 12a8 8 0 108-8H7"/><path d="M7 1v6H1"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    car: '<path d="M5 16V12l2-5h10l2 5v4M3 16h18M7 16v2M17 16v2"/><circle cx="8" cy="13" r=".5"/><circle cx="16" cy="13" r=".5"/>',
    flame: '<path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>',
    grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3"/>'
  };
  App.icon = function (name, size) {
    size = size || 20;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  };

  /* ---------- afbeeldingen ---------- */
  App.CAT_NAMEN = { A: 'Gevaar', B: 'Voorrang', C: 'Verbod', D: 'Gebod', E: 'Parkeren', F: 'Aanwijzing' };
  App.imgInfo = function (name) { return (C.afb && C.afb[name]) || null; };
  /** <img>-element; verbergt zichzelf als het bestand ontbreekt. */
  App.img = function (name, opts) {
    opts = opts || {};
    var info = App.imgInfo(name);
    if (!info) return null;
    var im = App.el('img', {
      src: info.src, alt: opts.alt != null ? opts.alt : info.alt, loading: 'lazy', decoding: 'async',
      class: opts.class || ''
    });
    im.addEventListener('error', function () { im.classList.add('img-missing'); im.removeAttribute('src'); im.hidden = true; });
    return im;
  };
  App.figure = function (name, opts) {
    opts = opts || {};
    var info = App.imgInfo(name);
    if (!info) return null;
    var img = App.img(name, { alt: opts.alt });
    var fig = App.el('figure', { class: 'fig fig-' + info.soort + (opts.class ? ' ' + opts.class : '') });
    fig.appendChild(img);
    if (opts.caption !== false) {
      var cap = App.el('figcaption');
      if (info.soort === 'bord') {
        cap.innerHTML = info.naam ? '<span class="sign-name">' + App.esc(info.naam) + '</span>' : '';
      } else {
        cap.textContent = info.alt || '';
      }
      if (info.credit) cap.innerHTML += ' <span class="credit">Afbeelding: ' + App.esc(info.credit.auteur) + ', ' + App.esc(info.credit.licentie) + '</span>';
      fig.appendChild(cap);
    }
    return fig;
  };

  /* ---------- diversen ---------- */
  App.cur = function (id) { for (var i = 0; i < C.curriculum.length; i++) if (C.curriculum[i].id === id) return C.curriculum[i]; return null; };
  App.exById = function (id) {
    if (!App._exMap) { App._exMap = {}; C.oefeningen.forEach(function (o) { App._exMap[o.id] = o; }); }
    return App._exMap[id];
  };
  App.blokById = function (id) {
    if (!App._blokMap) { App._blokMap = {}; C.theorie.forEach(function (b) { App._blokMap[b.id] = b; }); }
    return App._blokMap[id];
  };
  App.theorieHref = function (blokId) {
    var p = C.blokPagina && C.blokPagina[blokId];
    return p ? 'les' + p.les + '.html#p' + p.pagina : null;
  };
  App.fmtTime = function (sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  };
  App.reducedMotion = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  App.announce = function (msg) {
    var r = document.getElementById('sr-live');
    if (!r) { r = App.el('div', { id: 'sr-live', class: 'sr', 'aria-live': 'polite', role: 'status' }); document.body.appendChild(r); }
    r.textContent = '';
    setTimeout(function () { r.textContent = msg; }, 30);
  };
  App.ready = function (fn) {
    if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn);
  };
})();
