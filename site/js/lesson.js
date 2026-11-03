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
    if (!k.genummerd) return el('div', { class: 'tekst' }, k.items.map(function (t) { return el('p', { html: App.inline(t) }); }));
    return el('ol', { class: 'plain-list numbered' }, k.items.map(function (t) { return el('li', { html: App.inline(t) }); }));
  }
  function bordKaart(c) {
    var info = App.imgInfo(c.afb);
    var cell = el('article', { class: 'cell' });
    cell.appendChild(el('div', { class: 'cell-media' }, App.img(c.afb, { alt: c.naam || (info && info.naam) || 'Afbeelding', class: 'cell-img' })));
    cell.appendChild(el('h3', { class: 'cell-name', html: App.inline(String(c.naam || (info && info.naam) || '')) }));
    if (c.uitleg) cell.appendChild(el('p', { class: 'cell-text', html: App.inline(String(c.uitleg)) }));
    if (c.letop) cell.appendChild(el('p', { class: 'cell-letop' }, el('strong', {}, 'Let op: '), el('span', { html: App.inline(String(c.letop)) })));
    var cr = creditLine(info); if (cr) cell.appendChild(cr);
    return cell;
  }
  function rKaarten(k) {
    var cols = Math.max(1, Math.min(k.kolommen || 3, 4, k.items.length));
    var grid = el('div', { class: 'cell-grid', style: '--cols:' + cols }, k.items.map(bordKaart));
    Array.prototype.forEach.call(grid.children, function (c, i) { if ((i + 1) % cols === 0) c.classList.add('c-last'); });
    return grid;
  }
  function vcol(side) {
    var info = App.imgInfo(side.afb);
    return el('figure', { class: 'vcol' }, el('div', { class: 'vcol-media' }, App.img(side.afb, { alt: (info && info.naam) || 'Afbeelding', class: 'vcol-img' })),
      el('figcaption', { html: App.inline(side.tekst || '') }), creditLine(info));
  }
  function rVergelijk(k) {
    var cols = [k.links, k.midden, k.rechts].filter(Boolean);
    var box = el('article', { class: 'vkaart' }, k.titel ? el('h3', { class: 'vkaart-title', html: App.inline(k.titel) }) : null);
    var row = el('div', { class: 'vkaart-cols vk-' + cols.length });
    cols.forEach(function (c) { row.appendChild(vcol(c)); });
    box.appendChild(row);
    box.appendChild(el('p', { class: 'vkaart-diff' }, el('strong', {}, 'Het verschil: '), el('span', { html: App.inline(k.verschil || '') })));
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
    var box = el('aside', { class: 'kader kader-' + (KADER[k.soort] ? k.soort : 'regel') }, el('span', { class: 'kader-icon', html: App.icon(t.icon, 20) }), main);
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
  function rTekst(k) {
    var ts = Array.isArray(k.alineas) ? k.alineas : (Array.isArray(k.items) ? k.items : [k.tekst]);
    return el('div', { class: 'tekst' }, ts.map(function (t) { return el('p', { html: App.inline(t) }); }));
  }
  function rTip(k) { return rKader({ soort: 'tip', titel: k.titel || '', tekst: k.tekst }); }
  var RENDER = { grid: rKaarten, tekst: rTekst, tip: rTip, oefening: function () { return el('span'); }, punten: rPunten, kaarten: rKaarten, vergelijk: rVergelijk, schema: rSchema, kader: rKader, tabel: rTabel, voorbeeld: rVoorbeeld };
  var RANG = { kaarten: 0, grid: 0, vergelijk: 0, schema: 0, punten: 1, tekst: 1, tabel: 2, voorbeeld: 3, kader: 4 };
  function rang(k) { return (k.type === 'kader' && k.soort === 'tip') || k.type === 'tip' ? 5 : (RANG[k.type] == null ? 4 : RANG[k.type]); }
  /** Volgorde van de paginaspec: beelden/grid, tekst, tabel, voorbeeld, kader, tip (gemarkeerd, volle breedte). */
  function layoutBlokken(blokken) {
    var wrap = el('div', { class: 'blocks' });
    blokken.filter(function (k) { return k.type !== 'oefening'; }).map(function (k, i) { return [k, i]; }).sort(function (a, b) { return (rang(a[0]) - rang(b[0])) || (a[1] - b[1]); }).forEach(function (x) {
      var node = RENDER[x[0].type](x[0]);
      node.classList.add('b-' + x[0].type);
      wrap.appendChild(node);
    });
    return wrap;
  }

  function onthoudVan(p) {
    var punten = p.blokken.filter(function (b) { return b.type === 'punten'; })[0];
    var items = punten ? punten.items.slice(0, 3) : [];
    if (!items.length) { var kad = p.blokken.filter(function (b) { return b.type === 'kader'; })[0]; if (kad) items = [kad.tekst]; }
    if (!items.length) return null;
    return el('aside', { class: 'onthoud' }, el('p', { class: 'onthoud-l' }, 'Onthoud dit'),
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
    var contentIdx = []; pages.forEach(function (p, i) { if (p.t === 'paragraaf') contentIdx.push(i); });
    var NC = contentIdx.length;
    var totalEx = pages.reduce(function (n, p) { return n + (p.t === 'paragraaf' ? p.oefeningen.length + p.secties.reduce(function (m, sc) { return m + sc.mini.length; }, 0) : 0); }, 0);
    var eindPool = (function () {
      var all = C.oefeningen.filter(function (o) { return o.les === les && !o.mini; });
      var ex = all.filter(function (o) { return o.examen !== false; });
      return ex.length >= 5 ? ex : all;
    })();
    var tocIdx = []; pages.forEach(function (p, i) { if (p.toc) tocIdx.push(i); });
    function rangeEnd(k) { return (k + 1 < tocIdx.length ? tocIdx[k + 1] : N) - 1; }
    function tocOf(i) { var k = 0; tocIdx.forEach(function (t, q) { if (t <= i) k = q; }); return k; }

    function kopband(d, p, label) {
      d.appendChild(el('p', { class: 'pnr' }, (p.nr || '') + (label ? (p.nr ? ' · ' : '') + label : '')));
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
      d.appendChild(el('p', { class: 'pnr' }, 'Hoofdstuk ' + p.hn));
      d.appendChild(el('h1', { class: 'page-title opener-title', tabindex: '-1', id: 'page-title' }, p.titel));
      if (p.intro) d.appendChild(el('p', { class: 'opener-intro', html: App.inline(p.intro) }));
      var two = el('div', { class: 'opener-two' });
      if (p.doelen && p.doelen.length) two.appendChild(el('section', { class: 'opener-col' }, el('h2', {}, 'Dit leer je'), el('ul', { class: 'plain-list' }, p.doelen.map(function (t) { return el('li', { html: App.inline(t) }); }))));
      var pars = [];
      pages.forEach(function (q, i) { if (q.hn === p.hn && q.t === 'paragraaf') pars.push([i, q]); });
      if (pars.length) two.appendChild(el('section', { class: 'opener-col' }, el('h2', {}, 'In dit hoofdstuk'), el('ol', { class: 'par-list' }, pars.map(function (x) { return el('li', {}, el('a', { href: '#p' + (x[0] + 1) }, el('span', { class: 'par-nr' }, x[1].par), ' ', App.clean(x[1].parTitel))); }))));
      d.appendChild(two);
      return d;
    }

    function firstSentence(t) { var m = /^(.+?[.!?])(\s|$)/.exec(String(t || '').trim()); return m ? m[1] : String(t || ''); }

    function miniSection(sc, idx) {
      var exs = (sc.mini || []).map(App.exById).filter(Boolean);
      if (!exs.length) return null;
      var sec = el('div', { class: 'mini-ex', 'aria-label': 'Al eens oefenen' }, el('h3', { class: 'mini-title' }, 'Al eens oefenen'));
      if (sc.reeks) { var box = el('div', { class: 'series' }); sec.appendChild(box); App.runSeries(box, exs); return sec; }
      exs.forEach(function (ex) { App.mountExercise(ex, sec, { plain: true, mini: true, nolink: true, onResult: function () { sectionDone(idx); } }); });
      return sec;
    }
    function sectionDone() { /* paragraaf geldt als gedaan bij 'Volgende' of onderaan scrollen */ }

    function pageParagraaf(p, idx) {
      var d = el('article', { class: 'slide slide-par' });
      d.appendChild(el('p', { class: 'pnr' }, p.nr));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, App.clean(p.parTitel)));
      var fallback = !p.parIntro && p.secties[0] && p.secties[0].intro;
      var intro = p.parIntro || (p.secties[0] ? firstSentence(p.secties[0].intro || '') : '');
      if (intro) d.appendChild(el('p', { class: 'lead-sent', html: App.inline(intro) }));
      p.secties.forEach(function (sc, si) {
        var sec = el('section', { class: 'sectie', id: 's-' + sc.nr, 'data-nr': sc.nr, 'aria-labelledby': 'st-' + sc.nr });
        sec.appendChild(el('p', { class: 'pnr' }, sc.nr));
        sec.appendChild(el('h2', { class: 'page-title sec-title', id: 'st-' + sc.nr }, App.clean(sc.titel)));
        if (sc.intro && !(fallback && si === 0 && firstSentence(sc.intro) === sc.intro)) sec.appendChild(el('p', { class: 'lead-sent', html: App.inline(sc.intro) }));
        sec.appendChild(layoutBlokken(sc.blokken));
        var mini = miniSection(sc, idx);
        if (mini) sec.appendChild(mini); else { var o = onthoudVan(sc); if (o) sec.appendChild(o); }
        d.appendChild(sec);
      });
      if (p.oefeningen.length) {
        var os = el('section', { class: 'sectie oef-sectie', id: 's-oef-' + p.par }, el('h2', { class: 'page-title sec-title' }, 'Oefeningen bij ' + p.par));
        p.oefeningen.forEach(function (o) {
          var ex = App.exById(o.ex); if (!ex) return;
          var w = el('div', { class: 'oef-item', id: 's-' + o.nr, 'data-nr': o.nr }, el('p', { class: 'pnr' }, o.nr));
          App.mountExercise(ex, w, { plain: true, nolink: true, onResult: function () { /* gedaan */ } });
          os.appendChild(w);
        });
        d.appendChild(os);
      }
      d.appendChild(el('div', { class: 'end-sentinel', 'aria-hidden': 'true' }));
      return d;
    }

    function pageSamenvatting(p) {
      var d = el('section', { class: 'slide slide-sum' });
      d.appendChild(el('p', { class: 'pnr' }, 'Samenvatting'));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, 'Samenvatting: ' + p.hoofdstuk));
      d.appendChild(el('ol', { class: 'plain-list numbered' }, p.punten.map(function (t) { return el('li', { html: App.inline(t) }); })));
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
    var userMoved = false;
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, function () { userMoved = true; }, { passive: true }); });
    var openChap = {}, curSec = null, secObs = null, endObs = null;
    function paintToc() {
      bar.tocPop.innerHTML = '';
      bar.tocPop.appendChild(el('p', { class: 'pop-title' }, 'Les ' + les + ': ' + book.titel));
      var curK = tocOf(cur), curP = pages[cur];
      var body = el('div', { class: 'pop-body' });
      function entry(i, k, label, num, secs) {
        var done = App.isDone(les, rangeEnd(k));
        var li = el('li', {}, el('a', { href: '#p' + (i + 1), class: 'pop-link' + (k === curK ? ' current' : '') + (done ? ' done' : ''), 'aria-current': k === curK ? 'page' : null },
          el('span', { class: 'pop-n', html: done ? App.icon('check', 14) : '' }), el('span', { class: 'pop-num' }, num || ''), el('span', { class: 'pop-t' }, label), done ? el('span', { class: 'sr' }, ' (gedaan)') : null));
        if (secs && secs.length) li.appendChild(el('ul', { class: 'pop-secs' }, secs.map(function (x) {
          return el('li', {}, el('a', { href: '#p' + (i + 1) + '-' + x.nr, class: 'pop-sec' + (k === curK && curSec === x.nr ? ' sec-current' : ''), 'data-nr': x.nr }, el('span', { class: 'pop-num' }, x.nr), el('span', { class: 'pop-t' }, App.clean(x.titel))));
        })));
        return li;
      }
      var chapters = {}, order = [], end = [];
      tocIdx.forEach(function (i, k) {
        var p = pages[i];
        if (p.t === 'intro') body.appendChild(el('ul', { class: 'pop-list' }, entry(i, k, 'Inleiding')));
        else if (p.t === 'opener' || p.t === 'paragraaf') {
          var h = p.hn; if (!chapters[h]) { chapters[h] = { hn: h, titel: p.hoofdstuk, items: [] }; order.push(h); }
          if (p.t === 'opener') chapters[h].items.push(entry(i, k, 'Overzicht van het hoofdstuk'));
          else {
            var secs = p.secties.map(function (sc) { return { nr: sc.nr, titel: sc.titel }; });
            if (p.oefeningen.length) secs.push({ nr: p.oefeningen[0].nr, titel: 'Oefeningen bij ' + p.par });
            chapters[h].items.push(entry(i, k, App.clean(p.parTitel), p.par, secs));
          }
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
      if (p.t === 'paragraaf') lbl = 'Pagina <strong>' + before + '</strong> van ' + NC;
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

    /* ----- huidige sectie volgen tijdens het scrollen ----- */
    function markSec(nr) {
      if (!nr || nr === curSec) return;
      curSec = nr;
      Array.prototype.forEach.call(bar.tocPop.querySelectorAll('.pop-sec'), function (a) { a.classList.toggle('sec-current', a.getAttribute('data-nr') === nr); });
      try { history.replaceState(null, '', '#p' + (cur + 1) + '-' + nr); } catch (e) { /* file:// of geblokkeerd */ }
    }
    function setupObservers() {
      if (secObs) { secObs.disconnect(); secObs = null; }
      if (endObs) { endObs.disconnect(); endObs = null; }
      curSec = null;
      if (!('IntersectionObserver' in window)) return;
      var secs = wrap.querySelectorAll('.sectie[data-nr], .oef-item[data-nr]');
      if (secs.length) {
        secObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) markSec(en.target.getAttribute('data-nr')); });
        }, { rootMargin: '-25% 0px -65% 0px' });
        Array.prototype.forEach.call(secs, function (n) { secObs.observe(n); });
      }
      var sent = wrap.querySelector('.end-sentinel');
      if (sent) {
        var pageIdx = cur;
        endObs = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { App.markDone(les, pageIdx); paintToc(); } }); });
        endObs.observe(sent);
      }
    }
    function scrollToSec(nr, instant) {
      var t = document.getElementById('s-' + nr) || document.getElementById('s-oef-' + nr);
      if (!t) return false;
      t.scrollIntoView({ behavior: (instant || App.reducedMotion()) ? 'auto' : 'smooth', block: 'start' });
      return true;
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
      else if (p.t === 'paragraaf') content = pageParagraaf(p, i);
      else if (p.t === 'samenvatting') content = pageSamenvatting(p);
      else content = pageEind(i);
      wrap.appendChild(content);
      Array.prototype.forEach.call(wrap.querySelectorAll('.cell, .vcol, .chap-card, .opener-col'), function (n, k) { n.style.setProperty('--i', Math.min(k % 9, 8)); });
      wrap.classList.remove('enter-next', 'enter-prev'); void wrap.offsetWidth; wrap.classList.add('enter-' + dir);
      if (p.t === 'samenvatting' || p.t === 'opener') App.markDone(les, i);
      App.state.last[les] = i + 1; App.state.recent = les; App.save();
      document.title = p.titel + ' · Les ' + les + ' · Theorie rijbewijs B';
      paintBar();
      setupObservers();
      if (opts.scroll !== false) {
        if (opts.sec && scrollToSec(opts.sec, true)) { userMoved = false; [250, 700, 1400].forEach(function (ms) { setTimeout(function () { if (!userMoved && cur === i) scrollToSec(opts.sec, true); }, ms); }); }
        else if (opts.restoreY != null) window.scrollTo({ top: opts.restoreY, behavior: 'auto' });
        else window.scrollTo({ top: 0, behavior: 'auto' });
        var h = document.getElementById('page-title'); if (h && !opts.sec) h.focus({ preventScroll: true });
      }
    }
    function parseHash() {
      var m = /^#p(\d+)(?:-([\w.\-]+))?$/.exec(location.hash);
      return m ? { i: Number(m[1]) - 1, sec: m[2] || null } : null;
    }
    window.addEventListener('hashchange', function () {
      var h = parseHash(); if (!h) return;
      if (h.i === cur) { if (h.sec) { scrollToSec(h.sec, false); } else window.scrollTo({ top: 0, behavior: App.reducedMotion() ? 'auto' : 'smooth' }); return; }
      show(h.i, { fromNav: true, sec: h.sec });
    });
    buildBar();
    var h0 = parseHash(), sv = App.state.scroll && App.state.scroll[les];
    var startI = h0 ? h0.i : (function () { var l = App.state.last[les]; return l && l > 1 && l <= N ? l - 1 : 0; })();
    var restoreY = (!h0 || !h0.sec) && sv && sv.p === startI + 1 ? sv.y : null;
    if (!h0) { try { history.replaceState(null, '', '#p' + (startI + 1)); } catch (e) { /* file:// of geblokkeerd */ } }
    show(startI, { sec: h0 && h0.sec, restoreY: restoreY, scroll: !!(restoreY != null || (h0 && h0.sec)) });
    var scrollTimer = null;
    window.addEventListener('scroll', function () {
      if (scrollTimer) return;
      scrollTimer = setTimeout(function () {
        scrollTimer = null;
        App.state.scroll = App.state.scroll || {};
        App.state.scroll[les] = { p: cur + 1, y: Math.round(window.pageYOffset) };
        App.save();
      }, 500);
    }, { passive: true });

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
