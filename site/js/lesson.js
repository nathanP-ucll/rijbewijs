/* Lesboek: één pagina tegelijk met inhoudsopgave, pager, theorie + oefeningen, samenvatting en eindtest. */
(function () {
  'use strict';
  var App = window.App, C = App.C, el = App.el;

  /* ---------- theorie renderen ---------- */
  var KADER = {
    regel: { label: 'Regel', icon: 'regel' },
    letop: { label: 'Let op', icon: 'letop' },
    zwarefout: { label: 'Zware fout', icon: 'zwarefout' },
    tip: { label: 'Tip', icon: 'tip' },
    gewest: { label: 'Gewestverschil', icon: 'gewest' }
  };
  var KOP = { wallonie: 'Wallonië', vlaanderen: 'Vlaanderen', brussel: 'Brussel' };
  function kopLabel(k) {
    if (KOP[k]) return KOP[k];
    var s = k.replace(/_/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function regelTabel(rows) {
    var keys = [];
    rows.forEach(function (r) { Object.keys(r).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
    var table = el('table', { class: 'tbl' });
    table.appendChild(el('thead', {}, el('tr', {}, keys.map(function (k) { return el('th', { scope: 'col', class: 'col-' + k }, kopLabel(k)); }))));
    var tb = el('tbody');
    rows.forEach(function (r) {
      var tr = el('tr');
      keys.forEach(function (k, i) {
        var v = r[k];
        var td = el(i === 0 ? 'th' : 'td', i === 0 ? { scope: 'row', 'data-label': kopLabel(k) } : { 'data-label': kopLabel(k) });
        if (v == null) { td.textContent = ''; }
        else if ((k === 'code' || k === 'bord') && typeof v === 'string' && App.imgInfo(v) && App.imgInfo(v).soort === 'bord') {
          var info = App.imgInfo(v);
          td.className = 'cell-sign';
          td.appendChild(App.img(v, { alt: info.alt, class: 'sign-thumb' }));
          td.appendChild(el('span', { class: 'sign-code cat-' + (info.cat || '') }, v.replace(/_/g, ' ')));
          if (info.credit) td.appendChild(el('span', { class: 'sr' }, 'Afbeelding: ' + info.credit.auteur + ', ' + info.credit.licentie));
        } else td.innerHTML = App.inline(String(v));
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    return el('div', { class: 'tbl-wrap', tabindex: '0', role: 'region', 'aria-label': 'Tabel (scrolbaar)' }, table);
  }

  function kader(k) {
    var t = KADER[k.type] || KADER.regel;
    var box = el('aside', { class: 'kader kader-' + (KADER[k.type] ? k.type : 'regel') },
      el('div', { class: 'kader-head' },
        el('span', { class: 'kader-icon', html: App.icon(t.icon, 20) }),
        el('span', { class: 'kader-label' }, t.label),
        k.titel ? el('h3', { class: 'kader-title' }, k.titel) : null));
    if (k.tekst) box.appendChild(el('div', { class: 'kader-body', html: App.md(k.tekst) }));
    if (k.type === 'gewest' && k.gewest) {
      var g = el('div', { class: 'gewest-grid' });
      ['vlaanderen', 'wallonie', 'brussel'].forEach(function (key) {
        if (!k.gewest[key]) return;
        g.appendChild(el('div', { class: 'gewest gewest-' + key + (key === 'vlaanderen' ? ' is-main' : '') },
          el('span', { class: 'badge badge-' + key }, KOP[key]), el('p', { html: App.inline(k.gewest[key]) })));
      });
      box.appendChild(g);
    }
    return box;
  }

  function renderBlok(b, page) {
    var art = el('article', { class: 'theory' });
    art.appendChild(el('p', { class: 'eyebrow' }, page.hoofdstuk));
    art.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, b.titel));
    if (b.uitleg) art.appendChild(el('div', { class: 'prose', html: App.md(b.uitleg) }));

    // afbeeldingen
    var inTable = {};
    (b.regels || []).forEach(function (r) { ['code', 'bord'].forEach(function (k) { if (r[k]) inTable[r[k]] = 1; }); });
    var signs = [], schemas = [];
    (b.afbeeldingen || []).forEach(function (n) {
      var i = App.imgInfo(n); if (!i) return;
      if (i.soort === 'bord') { if (!inTable[n]) signs.push(n); } else schemas.push(n);
    });
    if (signs.length) {
      var strip = el('div', { class: 'sign-strip', role: 'list' });
      signs.forEach(function (n) { var f = App.figure(n, { class: 'sign-card' }); if (f) { f.setAttribute('role', 'listitem'); strip.appendChild(f); } });
      art.appendChild(strip);
    }
    if (schemas.length) {
      var gal = el('div', { class: 'schema-gallery' + (schemas.length === 1 ? ' single' : '') });
      schemas.forEach(function (n) { var f = App.figure(n, { class: 'schema-card' }); if (f) gal.appendChild(f); });
      art.appendChild(gal);
    }
    if (b.regels && b.regels.length) art.appendChild(regelTabel(b.regels));
    (b.kaders || []).forEach(function (k) { art.appendChild(kader(k)); });
    if (b.uitzonderingen && b.uitzonderingen.length) {
      art.appendChild(el('aside', { class: 'kader kader-uitzondering' },
        el('div', { class: 'kader-head' }, el('span', { class: 'kader-icon', html: App.icon('uitzondering', 20) }), el('span', { class: 'kader-label' }, 'Uitzonderingen')),
        el('ul', { class: 'kader-body' }, b.uitzonderingen.map(function (u) { return el('li', { html: App.inline(u) }); }))));
    }
    // bronnen
    var bl = (b.bronnen || []).map(function (id) { return C.bronnen[id] ? { id: id, b: C.bronnen[id] } : null; }).filter(Boolean);
    if (bl.length) {
      art.appendChild(el('details', { class: 'sources' },
        el('summary', {}, 'Bronnen bij deze pagina (' + bl.length + ')'),
        el('ul', {}, bl.map(function (x) {
          return el('li', {}, el('a', { href: x.b.url, target: '_blank', rel: 'noopener' }, x.b.titel), ' – ' + x.b.uitgever + (x.b.type === 'officieel' ? ' (officiële bron)' : ''));
        })),
        el('p', { class: 'small' }, el('a', { href: 'bronnen.html' }, 'Alle bronnen en afbeeldingscredits'))));
    }
    return art;
  }

  /* ---------- hoofdlogica ---------- */
  App.ready(function () {
    var root = document.getElementById('book-root');
    if (!root) return;
    var les = Number(document.body.getAttribute('data-les'));
    var book = C.boeken && C.boeken[les];
    var tocEl = document.getElementById('toc'), pageEl = document.getElementById('book-page'), pagerEl = document.getElementById('pager'), mainEl = document.getElementById('main');
    if (!book) { pageEl.textContent = 'Deze les is nog niet beschikbaar.'; return; }
    var pages = book.pages, N = pages.length;
    var cur = 0;
    var curr = C.curriculum.filter(function (c) { return c.les === les; });

    function exList(ids) { return (ids || []).map(App.exById).filter(Boolean); }
    var totalEx = pages.reduce(function (n, p) { return n + (p.oef ? p.oef.length : 0); }, 0);
    var eindPool = (function () {
      var all = C.oefeningen.filter(function (o) { return o.les === les; });
      var ex = all.filter(function (o) { return o.examen !== false; });
      return ex.length >= 5 ? ex : all;
    })();

    /* ----- inhoudsopgave ----- */
    var tocToggle, tocList, tocProg, tocProgLabel;
    function buildToc() {
      tocEl.innerHTML = '';
      tocToggle = el('button', { type: 'button', class: 'toc-toggle', 'aria-expanded': 'false', 'aria-controls': 'toc-body', html: App.icon('list', 18) + ' <span>Inhoud</span><span class="toc-cur"></span>' });
      tocProg = el('div', { class: 'toc-prog-bar' }, el('span', { class: 'toc-prog-fill' }));
      tocProgLabel = el('p', { class: 'toc-prog-label' });
      tocList = el('nav', { class: 'toc-list', 'aria-label': 'Pagina’s van deze les' });
      var body = el('div', { class: 'toc-body', id: 'toc-body' },
        el('div', { class: 'toc-head' }, el('p', { class: 'eyebrow' }, 'Les ' + les), el('h2', { class: 'toc-title' }, book.titel), tocProg, tocProgLabel),
        tocList);
      tocEl.appendChild(tocToggle); tocEl.appendChild(body);
      tocToggle.addEventListener('click', function () {
        var o = tocEl.classList.toggle('open'); tocToggle.setAttribute('aria-expanded', o ? 'true' : 'false');
      });
      paintToc();
    }
    function paintToc() {
      tocList.innerHTML = '';
      var group = null, ul = null, lastChap = null;
      pages.forEach(function (p, i) {
        var chap = p.t === 'blok' || p.t === 'extra' ? p.hoofdstuk : null;
        if (chap !== lastChap || !ul) {
          group = el('div', { class: 'toc-group' });
          if (chap) group.appendChild(el('h3', { class: 'toc-chap' }, chap));
          ul = el('ol', { class: 'toc-items' });
          group.appendChild(ul); tocList.appendChild(group); lastChap = chap;
        }
        var done = App.isDone(les, i);
        var a = el('a', { href: '#p' + (i + 1), class: 'toc-link' + (i === cur ? ' current' : '') + (done ? ' done' : ''), 'data-p': i + 1 },
          el('span', { class: 'toc-n', html: done ? App.icon('check', 14) : String(i + 1) }),
          el('span', { class: 'toc-t' }, p.titel),
          done ? el('span', { class: 'sr' }, ' (gedaan)') : null);
        if (i === cur) a.setAttribute('aria-current', 'page');
        a.addEventListener('click', function () { tocEl.classList.remove('open'); tocToggle.setAttribute('aria-expanded', 'false'); });
        ul.appendChild(el('li', {}, a));
      });
      var nd = pages.filter(function (_, i) { return App.isDone(les, i); }).length;
      tocProg.firstChild.style.width = Math.round(100 * nd / N) + '%';
      tocProgLabel.textContent = nd + ' van ' + N + ' pagina’s gelezen';
      tocToggle.querySelector('.toc-cur').textContent = ' · pagina ' + (cur + 1) + ' van ' + N;
      var act = tocList.querySelector('.current');
      if (act && act.scrollIntoView && tocList.scrollHeight > tocList.clientHeight) { /* blijf zichtbaar in de zijbalk */
        var box = tocEl.querySelector('.toc-body');
        if (box && box.scrollHeight > box.clientHeight) { var r = act.getBoundingClientRect(), br = box.getBoundingClientRect(); if (r.top < br.top || r.bottom > br.bottom) box.scrollTop += r.top - br.top - 80; }
      }
    }

    /* ----- pagina's ----- */
    function pageIntro() {
      var nEx = totalEx;
      var minutes = Math.max(5, Math.round((pages.filter(function (p) { return p.t === 'blok'; }).length * 3 + nEx * 0.75 + 10) / 5) * 5);
      var d = el('article', { class: 'intro' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Les ' + les));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, book.titel));
      d.appendChild(el('p', { class: 'lead' }, book.ondertitel));
      d.appendChild(el('div', { class: 'facts' },
        el('div', { class: 'fact' }, el('span', { class: 'fact-ic', html: App.icon('book', 22) }), el('strong', {}, String(N)), el('span', {}, 'pagina’s')),
        el('div', { class: 'fact' }, el('span', { class: 'fact-ic', html: App.icon('target', 22) }), el('strong', {}, String(nEx)), el('span', {}, 'oefeningen in de les')),
        el('div', { class: 'fact' }, el('span', { class: 'fact-ic', html: App.icon('clock', 22) }), el('strong', {}, '± ' + minutes), el('span', {}, 'minuten (schatting)'))));
      d.appendChild(el('section', { class: 'card goals' }, el('h2', {}, 'Leerdoelen'), el('p', { class: 'muted' }, 'Na deze les ken en begrijp je:'),
        el('ul', { class: 'ticks' }, curr.map(function (c) { return el('li', {}, c.naam); }))));
      var wl = el('section', { class: 'card' }, el('h2', {}, 'Wat je leert'));
      var lastChap = null, ul = null;
      pages.forEach(function (p, i) {
        if (p.t !== 'blok' && p.t !== 'extra') return;
        if (p.hoofdstuk !== lastChap) { wl.appendChild(el('h3', { class: 'mini-h' }, p.hoofdstuk)); ul = el('ul', { class: 'learn-list' }); wl.appendChild(ul); lastChap = p.hoofdstuk; }
        ul.appendChild(el('li', {}, el('a', { href: '#p' + (i + 1) }, p.titel), p.oef && p.oef.length ? el('span', { class: 'muted small' }, ' · ' + p.oef.length + ' oef.') : null));
      });
      wl.appendChild(el('p', { class: 'muted small' }, 'Afsluiten doe je met een samenvatting en een eindtest van maximaal 20 vragen.'));
      d.appendChild(wl);
      d.appendChild(el('div', { class: 'intro-go' }, el('a', { class: 'btn btn-primary btn-lg', href: '#p2' }, 'Start met pagina 2 ', el('span', { html: App.icon('right', 18) }))));
      return d;
    }

    function pageBlok(p, idx) {
      var b = App.blokById(p.id);
      var frag = el('div', { class: 'page-blok' });
      if (!b) { frag.textContent = 'Deze pagina ontbreekt.'; return frag; }
      frag.appendChild(renderBlok(b, p));
      var exs = exList(p.oef);
      if (exs.length) {
        var seen = {};
        var sec = el('section', { class: 'practice', 'aria-labelledby': 'oef-h' },
          el('div', { class: 'practice-head' }, el('h2', { id: 'oef-h' }, 'Oefen meteen'), el('p', { class: 'muted' }, exs.length + ' oefening' + (exs.length === 1 ? '' : 'en') + ' bij deze pagina')));
        frag.appendChild(sec);
        exs.forEach(function (ex, i) {
          App.mountExercise(ex, sec, { nr: i + 1, onResult: function (e) {
            seen[e.id] = 1;
            if (Object.keys(seen).length === exs.length) { App.markDone(les, idx); paintToc(); }
          } });
        });
      }
      return frag;
    }

    function pageExtra(p, idx) {
      var exs = exList(p.oef);
      var d = el('div', {}, el('p', { class: 'eyebrow' }, 'Les ' + les), el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, 'Extra oefenen'),
        el('p', { class: 'lead' }, 'Extra oefeningen over de hele les.'));
      var box = el('div'); d.appendChild(box); App.practiceList(box, exs, { pageSize: 10 });
      return d;
    }

    function pageSamenvatting() {
      var d = el('article', { class: 'summary' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Les ' + les));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, 'Samenvatting'));
      d.appendChild(el('p', { class: 'lead' }, 'Dit moet je onthouden. Klik op een titel om terug te bladeren naar de uitleg.'));
      var lastChap = null;
      pages.forEach(function (p, i) {
        if (p.t !== 'blok') return;
        var b = App.blokById(p.id); if (!b) return;
        if (p.hoofdstuk !== lastChap) { d.appendChild(el('h2', { class: 'sum-chap' }, p.hoofdstuk)); lastChap = p.hoofdstuk; }
        var items = (b.kaders || []).filter(function (k) { return k.type === 'regel' || k.type === 'zwarefout'; });
        var card = el('section', { class: 'sum-card' }, el('h3', {}, el('a', { href: '#p' + (i + 1) }, b.titel)));
        if (items.length) {
          card.appendChild(el('ul', { class: 'sum-list' }, items.map(function (k) {
            return el('li', { class: 'sum-' + k.type }, el('span', { class: 'sum-tag' }, k.type === 'zwarefout' ? 'Zware fout' : 'Regel'), ' ', el('strong', {}, k.titel ? k.titel + '. ' : ''), el('span', { html: App.inline(k.tekst || '') }));
          })));
        } else {
          var first = App.plain(b.uitleg).split(/(?<=[.!?])\s/)[0];
          card.appendChild(el('p', {}, first));
        }
        d.appendChild(card);
      });
      return d;
    }

    function pageEind(idx) {
      var d = el('article', { class: 'eind' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Les ' + les));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, 'Eindtest'));
      var root = el('div', { id: 'quiz-root' });
      var n = Math.min(20, eindPool.length);
      var last = App.state.eind[les];
      function start() {
        var picked = App.shuffle(eindPool).slice(0, n);
        root.innerHTML = '';
        App.runQuiz(root, {
          exercises: picked, scoring: 'simple', showTimer: true,
          restart: start, restartLabel: 'Eindtest opnieuw',
          onFinish: function (res) {
            App.state.eind[les] = { score: res.juist, total: res.total, ts: Date.now() };
            App.markDone(les, idx); App.save(); paintToc();
          }
        });
      }
      if (!n) {
        d.appendChild(el('div', { class: 'card' }, el('p', {}, 'Voor deze les zijn er nog geen oefeningen, dus ook nog geen eindtest. Bekijk intussen de theorie en de samenvatting.')));
        return d;
      }
      d.appendChild(el('div', { class: 'card eind-start' },
        el('p', { class: 'lead' }, 'Test wat je geleerd hebt: ' + n + ' vragen uit deze les, zonder feedback tot het einde. Daarna zie je je score en wat je nog moet herhalen.'),
        last ? el('p', { class: 'muted' }, 'Vorige score: ' + last.score + ' op ' + last.total + '.') : null,
        el('button', { type: 'button', class: 'btn btn-primary btn-lg', on: { click: function () { start(); } } }, 'Start de eindtest')));
      d.appendChild(root);
      return d;
    }

    /* ----- pager ----- */
    function paintPager() {
      var pct = Math.round(100 * (cur + 1) / N);
      pagerEl.innerHTML = '';
      var prev = el('a', { class: 'btn pager-btn' + (cur === 0 ? ' disabled' : ''), href: cur === 0 ? '#p1' : '#p' + cur, 'aria-disabled': cur === 0 ? 'true' : null, rel: 'prev', html: App.icon('left', 18) + '<span>Vorige</span>' });
      if (cur === 0) { prev.setAttribute('tabindex', '-1'); }
      var next;
      if (cur < N - 1) next = el('a', { class: 'btn btn-primary pager-btn', href: '#p' + (cur + 2), rel: 'next', html: '<span>Volgende</span>' + App.icon('right', 18) });
      else {
        var nl = les < 4 ? 'les' + (les + 1) + '.html' : 'examen.html';
        next = el('a', { class: 'btn btn-accent pager-btn', href: nl, html: '<span>' + (les < 4 ? 'Naar les ' + (les + 1) : 'Naar het proefexamen') + '</span>' + App.icon('right', 18) });
      }
      next.addEventListener('click', function () { if (cur < N - 1) { App.markDone(les, cur); } });
      pagerEl.appendChild(prev);
      pagerEl.appendChild(el('div', { class: 'pager-mid' },
        el('p', { class: 'pager-count' }, 'Pagina ' + (cur + 1) + ' van ' + N),
        el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': N, 'aria-valuenow': cur + 1, 'aria-label': 'Voortgang in deze les' }, el('span', { class: 'progress-fill', style: 'width:' + pct + '%' }))));
      pagerEl.appendChild(next);
    }

    /* ----- tonen ----- */
    function show(i, opts) {
      opts = opts || {};
      i = Math.max(0, Math.min(N - 1, i));
      var prevIdx = cur;
      if (opts.fromNav && prevIdx !== i && i > prevIdx && prevIdx === i - 1) App.markDone(les, prevIdx);
      cur = i;
      var p = pages[i];
      pageEl.innerHTML = '';
      var content;
      if (p.t === 'intro') content = pageIntro();
      else if (p.t === 'blok') content = pageBlok(p, i);
      else if (p.t === 'extra') content = pageExtra(p, i);
      else if (p.t === 'samenvatting') content = pageSamenvatting();
      else content = pageEind(i);
      pageEl.appendChild(content);
      pageEl.classList.remove('enter'); void pageEl.offsetWidth; pageEl.classList.add('enter');
      if (p.t === 'samenvatting') App.markDone(les, i);
      if (p.t === 'intro' && N > 1) { /* intro telt pas bij 'Volgende' */ }
      App.state.last[les] = i + 1; App.state.recent = les; App.save();
      document.title = p.titel + ' · Les ' + les + ' · Theorie rijbewijs B';
      paintToc(); paintPager();
      if (opts.scroll !== false) {
        var h = document.getElementById('page-title');
        var top = mainEl.getBoundingClientRect().top + window.pageYOffset - (window.innerWidth <= 960 ? 130 : 72);
        window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
        if (h) h.focus({ preventScroll: true });
      }
    }
    function fromHash() {
      var m = /^#p(\d+)$/.exec(location.hash);
      return m ? Number(m[1]) - 1 : null;
    }
    var lastShown = -1;
    window.addEventListener('hashchange', function () {
      var h = fromHash(); if (h == null) return;
      show(h, { fromNav: true }); lastShown = h;
    });
    buildToc();
    var start = fromHash();
    if (start == null) {
      var l = App.state.last[les];
      start = l && l > 1 && l <= N ? l - 1 : 0;
      try { history.replaceState(null, '', '#p' + (start + 1)); } catch (e) { /* file:// of geblokkeerd */ }
    }
    show(start, { scroll: location.hash !== '' && fromHash() != null && start > 0 });

    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
      if (e.key === 'ArrowRight' && cur < N - 1) { location.hash = '#p' + (cur + 2); }
      else if (e.key === 'ArrowLeft' && cur > 0) { location.hash = '#p' + cur; }
    });
  });
})();
