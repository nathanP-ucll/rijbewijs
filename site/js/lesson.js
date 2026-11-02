/* Lesboek (lezer): met de hand geschreven pagina's uit data/boek, volledig scherm, zwevende balk onderaan. */
(function () {
  'use strict';
  var App = window.App, C = App.C, el = App.el;

  /* ---------- hoofdstukken: kleur + icoon ---------- */
  var HCOL = { 1: '#c0261c', 2: '#a85f00', 3: '#1d5fa8', 4: '#1f7a46', 5: '#7b3fa0', 6: '#0b7a7a', 7: '#6d4c41', 8: '#3a3f9e', 9: '#a31d56', 10: '#bf360c', 11: '#4e6b1f', 12: '#455a64' };
  var HICON = {
    1: '<path d="M12 3l10 17H2z"/><path d="M12 10v4M12 17v.5"/>',
    2: '<circle cx="12" cy="12" r="9"/><path d="M12 12l4-3"/>',
    3: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
    4: '<rect x="8" y="2" width="8" height="20" rx="3"/><path d="M12 7h.01M12 12h.01M12 17h.01" stroke-width="3"/>',
    5: '<circle cx="12" cy="4" r="2"/><path d="M12 8v6M12 14l-3 7M12 14l3 7M8 11l4-3 4 3"/>',
    6: '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M7 20v-3M17 20v-3"/>',
    7: '<path d="M8 3L4 21M16 3l4 18M12 4v3M12 10v4M12 17v3"/>',
    8: '<path d="M4 20L10 4M20 20L14 4M12 6v3M12 12v3"/>',
    9: '<path d="M7 3h10l-1 7a4 4 0 01-8 0zM12 14v7M8 21h8"/>',
    10: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    11: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h4M7 14h6M16 10h2"/>',
    12: '<path d="M14 6a4 4 0 105 5l-9 9a2 2 0 01-3-3l9-9"/>'
  };
  function hcol(hn) { return HCOL[hn] || '#1d4e89'; }
  function hicon(hn, size) {
    size = size || 24;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (HICON[hn] || HICON[1]) + '</svg>';
  }

  var KADER = {
    regel: { label: 'Regel', icon: 'regel' }, letop: { label: 'Let op', icon: 'letop' }, zwarefout: { label: 'Zware fout', icon: 'zwarefout' },
    tip: { label: 'Tip', icon: 'tip' }, gewest: { label: 'Gewestverschil', icon: 'gewest' }
  };
  var KOP = { wallonie: 'Wallonië', vlaanderen: 'Vlaanderen', brussel: 'Brussel' };

  /* ---------- blok-renderers ---------- */
  function creditLine(info) { return info && info.credit ? el('span', { class: 'credit' }, 'Afbeelding: ' + info.credit.auteur + ', ' + info.credit.licentie) : null; }

  function rPunten(k) {
    return el(k.genummerd ? 'ol' : 'ul', { class: 'big-list' + (k.genummerd ? ' steps-list' : '') }, k.items.map(function (t) { return el('li', { html: App.inline(t) }); }));
  }
  function bordKaart(c) {
    var info = App.imgInfo(c.afb);
    var card = el('article', { class: 'bkaart' });
    card.appendChild(el('div', { class: 'bkaart-media' + (info && info.cat ? ' cat-bg-' + info.cat : '') }, App.img(c.afb, { alt: c.naam || (info && info.naam) || 'Afbeelding', class: 'bkaart-img' })));
    var body = el('div', { class: 'bkaart-body' });
    body.appendChild(el('h3', { class: 'bkaart-title', html: App.inline(String(c.naam || (info && info.naam) || '')) }));
    if (c.uitleg) body.appendChild(el('p', { class: 'bkaart-text', html: App.inline(String(c.uitleg)) }));
    if (c.letop) body.appendChild(el('p', { class: 'bkaart-letop' }, el('span', { class: 'bkaart-tag' }, 'Let op'), ' ', el('span', { html: App.inline(String(c.letop)) })));
    card.appendChild(body);
    var cr = creditLine(info); if (cr) card.appendChild(cr);
    return card;
  }
  function rKaarten(k) { return el('div', { class: 'kaart-grid kg-' + Math.min(k.items.length, 6) }, k.items.map(bordKaart)); }
  function vcol(side) {
    var info = App.imgInfo(side.afb);
    return el('figure', { class: 'vcol' }, el('div', { class: 'vcol-media' + (info && info.cat ? ' cat-bg-' + info.cat : '') }, App.img(side.afb, { alt: (info && info.naam) || 'Afbeelding', class: 'vcol-img' })),
      el('figcaption', { html: App.inline(side.tekst || '') }), creditLine(info));
  }
  function rVergelijk(k) {
    var cols = [k.links, k.midden, k.rechts].filter(Boolean);
    var box = el('article', { class: 'vkaart' }, k.titel ? el('h3', { class: 'vkaart-title', html: App.inline(k.titel) }) : null);
    var row = el('div', { class: 'vkaart-cols vk-' + cols.length });
    cols.forEach(function (c, i) { if (i > 0) row.appendChild(el('span', { class: 'vs', 'aria-hidden': 'true' }, 'vs')); row.appendChild(vcol(c)); });
    box.appendChild(row);
    box.appendChild(el('p', { class: 'vkaart-diff' }, el('span', { class: 'vd-tag' }, 'Het verschil'), ' ', el('span', { html: App.inline(k.verschil || '') })));
    return box;
  }
  function rSchema(k) {
    var info = App.imgInfo(k.afb);
    var fig = el('figure', { class: 'schema-fig' }, App.img(k.afb, { alt: (info && info.alt) || k.bijschrift || 'Schema', class: 'schema-img' }),
      k.bijschrift ? el('figcaption', { html: App.inline(k.bijschrift) }) : null, creditLine(info));
    var side = el('div', { class: 'schema-punten' }, (k.punten || []).length ? el('ol', { class: 'steps-list' }, k.punten.map(function (t) { return el('li', { html: App.inline(t) }); })) : null);
    return el('div', { class: 'schema-blok' + ((k.punten || []).length ? '' : ' solo') }, fig, side);
  }
  function rKader(k) {
    var t = KADER[k.soort] || KADER.regel;
    var main = el('div', { class: 'kader-main' }, el('p', { class: 'kader-label' }, t.label + (k.titel ? ' · ' + App.clean(k.titel) : '')), k.tekst ? el('p', { class: 'kader-text', html: App.inline(k.tekst) }) : null);
    var box = el('aside', { class: 'kader kader-' + (KADER[k.soort] ? k.soort : 'regel') }, el('span', { class: 'kader-icon', html: App.icon(t.icon, 40) }), main);
    if (k.soort === 'gewest' && k.gewest) {
      var g = el('div', { class: 'gewest-grid' });
      ['vlaanderen', 'wallonie', 'brussel'].forEach(function (key) {
        if (!k.gewest[key]) return;
        g.appendChild(el('div', { class: 'gewest' + (key === 'vlaanderen' ? ' is-main' : '') }, el('span', { class: 'badge badge-' + key }, KOP[key]), el('p', { html: App.inline(k.gewest[key]) })));
      });
      main.appendChild(g);
    }
    return box;
  }
  function rTabel(k) {
    var t = el('table', { class: 'tbl tbl-book' }, el('thead', {}, el('tr', {}, k.kolommen.map(function (c) { return el('th', { scope: 'col' }, App.clean(c)); }))),
      el('tbody', {}, k.rijen.map(function (r) { return el('tr', {}, r.map(function (c, i) { return el(i === 0 ? 'th' : 'td', i === 0 ? { scope: 'row' } : { 'data-label': k.kolommen[i] || '' }, App.clean(String(c))); })); })));
    return el('div', { class: 'tbl-wrap' }, t);
  }
  function rVoorbeeld(k) {
    return el('aside', { class: 'voorbeeld' }, el('span', { class: 'voorbeeld-ic', html: App.icon('car', 34) }), el('div', {}, el('p', { class: 'voorbeeld-l' }, 'In de praktijk'), el('p', { class: 'voorbeeld-t', html: App.inline(k.tekst) })));
  }
  var RENDER = { punten: rPunten, kaarten: rKaarten, vergelijk: rVergelijk, schema: rSchema, kader: rKader, tabel: rTabel, voorbeeld: rVoorbeeld };
  var BASIS = { punten: 7, kader: 5, voorbeeld: 5 };

  /** Zet blokken in een 12-koloms raster; losse smalle blokken worden volle breedte. */
  function layoutBlokken(blokken) {
    var wrap = el('div', { class: 'blocks' });
    var rows = [], row = [], used = 0;
    blokken.forEach(function (k) {
      var w = BASIS[k.type] || 12;
      if (used + w > 12 && row.length) { rows.push(row); row = []; used = 0; }
      row.push({ k: k, w: w }); used += w;
      if (used >= 12) { rows.push(row); row = []; used = 0; }
    });
    if (row.length) rows.push(row);
    rows.forEach(function (r) {
      var tot = r.reduce(function (a, x) { return a + x.w; }, 0);
      if (r.length === 1) r[0].w = 12; else if (tot < 12) r[r.length - 1].w += 12 - tot;
      r.forEach(function (x) {
        var node = RENDER[x.k.type](x.k);
        node.classList.add('b-' + x.k.type); node.style.setProperty('--span', x.w);
        wrap.appendChild(node);
      });
    });
    return wrap;
  }

  function onthoudVan(p) {
    var punten = p.blokken.filter(function (b) { return b.type === 'punten'; })[0];
    var items = punten ? punten.items.slice(0, 3) : [];
    if (!items.length) { var kad = p.blokken.filter(function (b) { return b.type === 'kader'; })[0]; if (kad) items = [kad.tekst]; }
    if (!items.length) return null;
    return el('aside', { class: 'onthoud' }, el('div', { class: 'onthoud-head' }, el('span', { class: 'onthoud-ic', html: App.icon('tip', 26) }), el('p', { class: 'onthoud-l' }, 'Onthoud dit')),
      el('ul', { class: 'onthoud-list' }, items.map(function (t) { return el('li', { html: App.inline(t) }); })));
  }

  /* ---------- hoofdlogica ---------- */
  App.ready(function () {
    var wrap = document.getElementById('book-page'), barEl = document.getElementById('float-bar');
    if (!wrap || !barEl) return;
    var les = Number(document.body.getAttribute('data-les'));
    var book = C.boeken && C.boeken[les];
    if (!book) { wrap.textContent = 'Deze les is nog niet beschikbaar.'; return; }
    var pages = book.pages, N = pages.length, cur = 0;
    var contentIdx = []; pages.forEach(function (p, i) { if (p.t === 'pagina') contentIdx.push(i); });
    var NC = contentIdx.length;
    var totalEx = pages.filter(function (p) { return p.t === 'oef'; }).length + pages.reduce(function (n, p) { return n + (p.mini ? p.mini.length : 0); }, 0);
    var eindPool = (function () {
      var all = C.oefeningen.filter(function (o) { return o.les === les && !o.mini; });
      var ex = all.filter(function (o) { return o.examen !== false; });
      return ex.length >= 5 ? ex : all;
    })();
    var tocIdx = []; pages.forEach(function (p, i) { if (p.toc) tocIdx.push(i); });
    function rangeEnd(k) { return (k + 1 < tocIdx.length ? tocIdx[k + 1] : N) - 1; }
    function tocOf(i) { var k = 0; tocIdx.forEach(function (t, q) { if (t <= i) k = q; }); return k; }

    function kopband(d, p, label) {
      d.appendChild(el('header', { class: 'kopband' },
        el('span', { class: 'kopband-ic', html: hicon(p.hn, 26) }),
        el('span', { class: 'kopband-h' }, 'Hoofdstuk ' + p.hn + ' · ' + p.hoofdstuk),
        p.par && p.parTitel ? el('span', { class: 'kopband-p' }, '§ ' + p.par + ' ' + App.clean(p.parTitel)) : (label ? el('span', { class: 'kopband-p' }, label) : null)));
    }

    function pageIntro() {
      var minutes = Math.max(10, Math.round((NC * 2 + totalEx * 0.75 + 5) / 5) * 5);
      var d = el('section', { class: 'slide slide-intro' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Les ' + les));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, book.titel));
      if (book.ondertitel) d.appendChild(el('p', { class: 'lead-sent' }, book.ondertitel));
      d.appendChild(el('div', { class: 'facts' },
        el('div', { class: 'fact' }, el('span', { class: 'fact-ic', html: App.icon('book', 26) }), el('strong', {}, String(NC)), el('span', {}, 'pagina’s')),
        el('div', { class: 'fact' }, el('span', { class: 'fact-ic', html: App.icon('target', 26) }), el('strong', {}, String(totalEx)), el('span', {}, 'oefeningen')),
        el('div', { class: 'fact' }, el('span', { class: 'fact-ic', html: App.icon('clock', 26) }), el('strong', {}, '± ' + minutes), el('span', {}, 'minuten'))));
      if (book.leeg) {
        d.appendChild(el('p', { class: 'big-note' }, 'De pagina’s van deze les worden nog geschreven. Je kunt intussen al oefenen in de oefenbank.'));
        d.appendChild(el('a', { class: 'btn btn-primary btn-xl', href: 'oefenbank.html' }, 'Naar de oefenbank'));
        return d;
      }
      var grid = el('div', { class: 'chap-grid' });
      pages.forEach(function (p, i) {
        if (p.t !== 'opener') return;
        grid.appendChild(el('a', { class: 'chap-card', href: '#p' + (i + 1), style: '--hc:' + hcol(p.hn) }, el('span', { class: 'chap-ic', html: hicon(p.hn, 30) }), el('span', { class: 'chap-n' }, 'Hoofdstuk ' + p.hn), el('strong', {}, p.titel)));
      });
      d.appendChild(el('h2', { class: 'mini-h' }, 'Dit leer je in deze les'));
      d.appendChild(grid);
      d.appendChild(el('a', { class: 'btn btn-primary btn-xl', href: '#p2', html: 'Start ' + App.icon('right', 22) }));
      return d;
    }

    function pageOpener(p) {
      var d = el('section', { class: 'slide slide-opener' });
      d.appendChild(el('div', { class: 'opener-hero' },
        el('span', { class: 'opener-n', 'aria-hidden': 'true' }, String(p.hn)),
        el('div', { class: 'opener-t' }, el('p', { class: 'eyebrow-w' }, 'Hoofdstuk ' + p.hn), el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, p.titel), p.intro ? el('p', { class: 'opener-intro', html: App.inline(p.intro) }) : null),
        el('span', { class: 'opener-ic', html: hicon(p.hn, 120) })));
      var two = el('div', { class: 'opener-two' });
      if (p.doelen && p.doelen.length) two.appendChild(el('section', { class: 'opener-card' }, el('h2', {}, 'Dit leer je'), el('ul', { class: 'goal-list' }, p.doelen.map(function (t) { return el('li', {}, el('span', { class: 'goal-ic', html: App.icon('check', 18) }), el('span', { html: App.inline(t) })); }))));
      var pars = [];
      pages.forEach(function (q, i) { if (q.hn === p.hn && q.t === 'pagina' && q.parEerste) pars.push([i, q]); });
      if (pars.length) two.appendChild(el('section', { class: 'opener-card' }, el('h2', {}, 'In dit hoofdstuk'), el('ol', { class: 'par-list' }, pars.map(function (x) { return el('li', {}, el('a', { href: '#p' + (x[0] + 1) }, el('span', { class: 'nr' }, x[1].par), ' ', App.clean(x[1].parTitel))); }))));
      d.appendChild(two);
      return d;
    }

    function pagePagina(p) {
      var d = el('section', { class: 'slide slide-pagina' });
      kopband(d, p);
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, el('span', { class: 'nr' }, p.nr), ' ', App.clean(p.titel)));
      if (p.intro) d.appendChild(el('p', { class: 'lead-sent', html: App.inline(p.intro) }));
      d.appendChild(layoutBlokken(p.blokken));
      return d;
    }

    function pageOef(p, idx) {
      var ex = App.exById(p.ex);
      var d = el('section', { class: 'slide slide-oef' });
      kopband(d, p, 'Oefening ' + p.nr);
      d.appendChild(el('h1', { class: 'sr', tabindex: '-1', id: 'page-title' }, 'Oefening ' + (p.nr || '')));
      if (!ex) { d.appendChild(el('p', {}, 'Deze oefening ontbreekt.')); return d; }
      var nr = pages.slice(0, idx + 1).filter(function (q) { return q.t === 'oef' && q.par === p.par; }).length;
      App.mountExercise(ex, d, { nr: nr, nolink: true, onResult: function () { App.markDone(les, idx); paintBar(); } });
      return d;
    }

    function miniSection(p, idx) {
      var exs = (p.mini || []).map(App.exById).filter(Boolean);
      if (!exs.length) return null;
      var sec = el('section', { class: 'mini-ex', 'aria-label': 'Probeer het zelf' },
        el('div', { class: 'mini-head' }, el('span', { class: 'mini-ic', html: App.icon('target', 28) }), el('h2', { class: 'mini-title' }, 'Probeer het zelf')));
      exs.forEach(function (ex, i) { App.mountExercise(ex, sec, { nr: i + 1, mini: true, nolink: true, onResult: function () { App.markDone(les, idx); paintBar(); } }); });
      return sec;
    }

    function pageSamenvatting(p) {
      var d = el('section', { class: 'slide slide-sum' });
      kopband(d, p, 'Samenvatting');
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, 'Samenvatting: ' + p.hoofdstuk));
      d.appendChild(el('p', { class: 'lead-sent' }, 'Dit zijn de belangrijkste punten van dit hoofdstuk.'));
      d.appendChild(el('ol', { class: 'sum-grid' }, p.punten.map(function (t, i) { return el('li', {}, el('span', { class: 'sum-n' }, String(i + 1)), el('span', { html: App.inline(t) })); })));
      return d;
    }

    function pageEind(idx) {
      var d = el('section', { class: 'slide slide-eind' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Les ' + les));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, 'Eindtest'));
      var root = el('div', { id: 'quiz-root' });
      var n = Math.min(20, eindPool.length), last = App.state.eind[les], box;
      function start() {
        root.innerHTML = ''; if (box) box.remove();
        App.runQuiz(root, {
          exercises: App.shuffle(eindPool).slice(0, n), scoring: 'simple', showTimer: true, restart: start, restartLabel: 'Eindtest opnieuw',
          onFinish: function (res) { App.state.eind[les] = { score: res.juist, total: res.total, ts: Date.now() }; App.markDone(les, idx); App.save(); paintBar(); }
        });
      }
      if (!n) { d.appendChild(el('p', { class: 'big-note' }, 'Voor deze les zijn er nog geen oefeningen, dus ook nog geen eindtest.')); return d; }
      box = el('div', { class: 'eind-start' },
        el('p', { class: 'big-note' }, n + ' vragen over deze les. Je ziet je score en wat je moet herhalen.'),
        last ? el('p', { class: 'muted' }, 'Vorige score: ' + last.score + ' op ' + last.total + '.') : null,
        el('button', { type: 'button', class: 'btn btn-primary btn-xl', on: { click: start } }, 'Start de eindtest'));
      d.appendChild(box); d.appendChild(root);
      return d;
    }

    /* ----- zwevende balk ----- */
    var bar = {};
    function buildBar() {
      barEl.innerHTML = '';
      bar.prev = el('a', { class: 'fb-btn fb-nav', rel: 'prev', href: '#p1', html: App.icon('left', 26) + '<span class="fb-lbl">Vorige</span>' });
      bar.next = el('a', { class: 'fb-btn fb-nav fb-next', rel: 'next', href: '#p2', html: '<span class="fb-lbl">Volgende</span>' + App.icon('right', 26) });
      bar.count = el('p', { class: 'fb-count' });
      bar.prog = el('span', { class: 'progress-fill' });
      var mid = el('div', { class: 'fb-mid' }, bar.count, el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 1, 'aria-valuemax': N, 'aria-label': 'Voortgang in deze les' }, bar.prog));
      bar.bProg = mid.querySelector('.progress');
      bar.tocBtn = el('button', { type: 'button', class: 'fb-btn fb-tool', 'aria-expanded': 'false', 'aria-haspopup': 'true', 'aria-controls': 'pop-toc', html: App.icon('list', 24) + '<span class="fb-lbl">Inhoud</span>' });
      bar.lesBtn = el('button', { type: 'button', class: 'fb-btn fb-tool', 'aria-expanded': 'false', 'aria-haspopup': 'true', 'aria-controls': 'pop-les', html: App.icon('book', 24) + '<span class="fb-lbl">Les ' + les + '</span>' + App.icon('down', 16) });
      bar.tocPop = el('div', { class: 'pop pop-toc', id: 'pop-toc', hidden: true, role: 'dialog', 'aria-label': 'Inhoud van deze les' });
      bar.lesPop = el('div', { class: 'pop pop-les', id: 'pop-les', hidden: true, role: 'dialog', 'aria-label': 'Naar een andere les' });
      var lesList = el('ul', { class: 'pop-list' });
      [1, 2, 3, 4].forEach(function (l) {
        var b = C.boeken[l]; if (!b) return;
        lesList.appendChild(el('li', {}, el('a', { href: 'les' + l + '.html' + (App.state.last[l] > 1 ? '#p' + App.state.last[l] : ''), class: 'pop-link' + (l === les ? ' current' : ''), 'aria-current': l === les ? 'page' : null }, el('strong', {}, 'Les ' + l), ' ', el('span', { class: 'muted' }, b.titel))));
      });
      lesList.appendChild(el('li', {}, el('a', { href: 'examen.html', class: 'pop-link' }, el('strong', {}, 'Proefexamen'))));
      lesList.appendChild(el('li', {}, el('a', { href: 'index.html', class: 'pop-link' }, el('strong', {}, 'Startpagina'))));
      bar.lesPop.appendChild(lesList);
      barEl.appendChild(bar.tocPop); barEl.appendChild(bar.lesPop);
      barEl.appendChild(el('div', { class: 'fb-row' }, bar.prev, mid, bar.next, el('span', { class: 'fb-sep', 'aria-hidden': 'true' }), bar.tocBtn, bar.lesBtn));
      function toggle(btn, pop, other, otherBtn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var open = pop.hidden;
          other.hidden = true; otherBtn.setAttribute('aria-expanded', 'false');
          pop.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          if (open) { var t = pop.querySelector('.current') || pop.querySelector('a'); if (t) { t.focus({ preventScroll: true }); if (t.scrollIntoView) t.scrollIntoView({ block: 'center' }); } }
        });
      }
      toggle(bar.tocBtn, bar.tocPop, bar.lesPop, bar.lesBtn);
      toggle(bar.lesBtn, bar.lesPop, bar.tocPop, bar.tocBtn);
      function closeAll(focusBtn) {
        var was = !bar.tocPop.hidden ? bar.tocBtn : (!bar.lesPop.hidden ? bar.lesBtn : null);
        bar.tocPop.hidden = true; bar.lesPop.hidden = true;
        bar.tocBtn.setAttribute('aria-expanded', 'false'); bar.lesBtn.setAttribute('aria-expanded', 'false');
        if (focusBtn && was) was.focus();
      }
      document.addEventListener('click', function (e) { if (!barEl.contains(e.target) || e.target.closest('.pop a')) closeAll(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(true); });
      bar.next.addEventListener('click', function () { if (cur < N - 1) App.markDone(les, cur); });
    }
    var openChap = {};
    function paintToc() {
      bar.tocPop.innerHTML = '';
      bar.tocPop.appendChild(el('p', { class: 'pop-title' }, 'Les ' + les + ': ' + book.titel));
      var curK = tocOf(cur), curP = pages[cur];
      var body = el('div', { class: 'pop-body' });
      function entry(i, k, label, num) {
        var done = App.isDone(les, rangeEnd(k));
        return el('li', {}, el('a', { href: '#p' + (i + 1), class: 'pop-link' + (k === curK ? ' current' : '') + (done ? ' done' : ''), 'aria-current': k === curK ? 'page' : null },
          el('span', { class: 'pop-n', html: done ? App.icon('check', 14) : '' }), el('span', { class: 'pop-num' }, num || ''), el('span', { class: 'pop-t' }, label), done ? el('span', { class: 'sr' }, ' (gedaan)') : null));
      }
      var chapters = {}, order = [], end = [];
      tocIdx.forEach(function (i, k) {
        var p = pages[i];
        if (p.t === 'intro') body.appendChild(el('ul', { class: 'pop-list' }, entry(i, k, 'Inleiding')));
        else if (p.t === 'opener' || p.t === 'pagina') {
          var h = p.hn; if (!chapters[h]) { chapters[h] = { hn: h, titel: p.hoofdstuk, items: [] }; order.push(h); }
          chapters[h].items.push(p.t === 'opener' ? entry(i, k, 'Overzicht van het hoofdstuk') : entry(i, k, App.clean(p.parTitel || p.titel), p.par));
        } else end.push(entry(i, k, p.t === 'samenvatting' ? 'Samenvatting' : p.titel));
      });
      order.forEach(function (h) {
        var c = chapters[h];
        var det = el('details', { class: 'pop-chapter', style: '--hc:' + hcol(h) }, el('summary', {}, el('span', { class: 'pop-hn' }, String(h)), ' ', c.titel));
        if ((curP.hn === h && curP.t !== 'samenvatting') || openChap[h]) det.open = true;
        det.addEventListener('toggle', function () { openChap[h] = det.open; });
        det.appendChild(el('ul', { class: 'pop-list' }, c.items));
        body.appendChild(det);
      });
      if (end.length) { body.appendChild(el('p', { class: 'pop-chap' }, 'Afsluiting')); body.appendChild(el('ul', { class: 'pop-list' }, end)); }
      bar.tocPop.appendChild(body);
    }
    function paintBar() {
      var p = pages[cur], before = contentIdx.filter(function (i) { return i <= cur; }).length, lbl;
      if (p.t === 'pagina') lbl = 'Pagina <strong>' + before + '</strong> van ' + NC;
      else if (p.t === 'oef') lbl = 'Oefening <strong>' + p.nr + '</strong>';
      else if (p.t === 'opener') lbl = 'Hoofdstuk <strong>' + p.hn + '</strong>';
      else if (p.t === 'samenvatting') lbl = '<strong>Samenvatting</strong>';
      else if (p.t === 'eindtest') lbl = '<strong>Eindtest</strong>';
      else lbl = '<strong>Inleiding</strong>';
      bar.count.innerHTML = lbl;
      bar.prog.style.transform = 'scaleX(' + ((cur + 1) / N).toFixed(4) + ')';
      bar.bProg.setAttribute('aria-valuenow', cur + 1); bar.bProg.setAttribute('aria-valuemax', N);
      bar.prev.setAttribute('href', '#p' + Math.max(1, cur));
      bar.prev.classList.toggle('disabled', cur === 0); bar.prev.setAttribute('aria-disabled', cur === 0 ? 'true' : 'false'); bar.prev.tabIndex = cur === 0 ? -1 : 0;
      if (cur < N - 1) { bar.next.setAttribute('href', '#p' + (cur + 2)); bar.next.querySelector('.fb-lbl').textContent = 'Volgende'; }
      else { bar.next.setAttribute('href', les < 4 ? 'les' + (les + 1) + '.html' : 'examen.html'); bar.next.querySelector('.fb-lbl').textContent = les < 4 ? 'Les ' + (les + 1) : 'Proefexamen'; }
      paintToc();
    }

    /* ----- tonen ----- */
    function show(i, opts) {
      opts = opts || {};
      i = Math.max(0, Math.min(N - 1, i));
      if (opts.fromNav && i === cur + 1) App.markDone(les, cur);
      var dir = i >= cur ? 'next' : 'prev'; cur = i;
      var p = pages[i], content;
      wrap.innerHTML = '';
      document.body.style.setProperty('--hc', p.hn ? hcol(p.hn) : '#1d4e89');
      document.body.setAttribute('data-h', p.hn || '0');
      if (p.t === 'intro') content = pageIntro();
      else if (p.t === 'opener') content = pageOpener(p);
      else if (p.t === 'pagina') content = pagePagina(p);
      else if (p.t === 'oef') content = pageOef(p, i);
      else if (p.t === 'samenvatting') content = pageSamenvatting(p);
      else content = pageEind(i);
      if (p.t === 'pagina') {
        var mini = miniSection(p, i);
        if (mini) content.appendChild(mini); else { var o = onthoudVan(p); if (o) content.appendChild(o); }
      }
      wrap.appendChild(content);
      // gespreide start van kaarten e.d. (stagger)
      Array.prototype.forEach.call(wrap.querySelectorAll('.blocks > *, .bkaart, .vcol, .chap-card, .opener-card, .sum-grid li, .mini-ex, .onthoud'), function (n, k) { n.style.setProperty('--i', Math.min(k, 12)); });
      wrap.classList.remove('enter-next', 'enter-prev'); void wrap.offsetWidth; wrap.classList.add('enter-' + dir);
      if (p.t === 'samenvatting' || p.t === 'opener') App.markDone(les, i);
      App.state.last[les] = i + 1; App.state.recent = les; App.save();
      document.title = (p.t === 'oef' ? 'Oefening ' + p.nr : p.titel) + ' · Les ' + les + ' · Theorie rijbewijs B';
      paintBar();
      if (opts.scroll !== false) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        var h = document.getElementById('page-title'); if (h) h.focus({ preventScroll: true });
      }
    }
    function fromHash() { var m = /^#p(\d+)$/.exec(location.hash); return m ? Number(m[1]) - 1 : null; }
    window.addEventListener('hashchange', function () { var h = fromHash(); if (h != null) show(h, { fromNav: true }); });
    buildBar();
    var start = fromHash();
    if (start == null) {
      var l = App.state.last[les];
      start = l && l > 1 && l <= N ? l - 1 : 0;
      try { history.replaceState(null, '', '#p' + (start + 1)); } catch (e) { /* file:// of geblokkeerd */ }
    }
    show(start, { scroll: false });

    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
      if (!bar.tocPop.hidden || !bar.lesPop.hidden) return;
      if (e.key === 'ArrowRight' && cur < N - 1) location.hash = '#p' + (cur + 2);
      else if (e.key === 'ArrowLeft' && cur > 0) location.hash = '#p' + cur;
    });
  });
})();
