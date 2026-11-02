/* Lesboek (lezer): één klein onderwerp per pagina, volledig scherm, zwevende balk onderaan. */
(function () {
  'use strict';
  var App = window.App, C = App.C, el = App.el;

  /* ---------- tekst inkorten ---------- */
  function sentences(text) {
    var t = App.plain(text);
    if (!t) return [];
    return t.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).filter(Boolean);
  }
  function cap(s, n) {
    s = String(s || '').trim();
    if (s.length <= n) return s;
    var cut = s.slice(0, n), sp = cut.lastIndexOf(' ');
    return cut.slice(0, sp > 40 ? sp : n).replace(/[,;:\s]+$/, '') + '…';
  }
  function shortText(t) { var s = sentences(t); return cap(s[0] || '', 170); }
  /** Korte opsomming: 'kort' als het bestaat, anders afgeleid uit 'uitleg'. */
  function kortOf(b) {
    if (Array.isArray(b.kort) && b.kort.length) return b.kort;
    var items = [], paras = [];
    String(b.uitleg || '').split('\n').forEach(function (l) {
      var m = /^\s*[-•]\s+(.*)$/.exec(l);
      if (m) items.push(m[1]); else if (l.trim()) paras.push(l.trim());
    });
    if (items.length >= 2) return items.slice(0, 6).map(function (i) { return cap(sentences(i)[0] || i, 170); });
    return sentences(paras.join(' ')).slice(0, 3).map(function (s) { return cap(s, 170); });
  }

  var KADER = {
    regel: { label: 'Regel', icon: 'regel' }, letop: { label: 'Let op', icon: 'letop' }, zwarefout: { label: 'Zware fout', icon: 'zwarefout' },
    tip: { label: 'Tip', icon: 'tip' }, gewest: { label: 'Gewestverschil', icon: 'gewest' }
  };
  var KOP = { wallonie: 'Wallonië', vlaanderen: 'Vlaanderen', brussel: 'Brussel' };
  function kopLabel(k) { if (KOP[k]) return KOP[k]; var s = k.replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); }

  function kaderShort(k) {
    var t = KADER[k.type] || KADER.regel;
    var main = el('div', { class: 'kader-main' },
      el('p', { class: 'kader-label' }, t.label + (k.titel ? ': ' + App.clean(k.titel) : '')),
      k.tekst ? el('p', { class: 'kader-text', html: App.inline(shortText(k.tekst)) }) : null);
    var box = el('aside', { class: 'kader kader-' + (KADER[k.type] ? k.type : 'regel') }, el('span', { class: 'kader-icon', html: App.icon(t.icon, 26) }), main);
    if (k.type === 'gewest' && k.gewest) {
      var g = el('div', { class: 'gewest-grid' });
      ['vlaanderen', 'wallonie', 'brussel'].forEach(function (key) {
        if (!k.gewest[key]) return;
        g.appendChild(el('div', { class: 'gewest' + (key === 'vlaanderen' ? ' is-main' : '') }, el('span', { class: 'badge badge-' + key }, KOP[key]), el('p', { html: App.inline(cap(sentences(k.gewest[key])[0] || k.gewest[key], 110)) })));
      });
      main.appendChild(g);
    }
    return box;
  }

  /* ---------- kaartjes voor regelrijen (zonder codes) ---------- */
  function rowCard(r) {
    var codeVal = r.code || r.bord;
    var info = codeVal && App.imgInfo(codeVal);
    var isSign = !!(info && info.soort === 'bord');
    var keys = Object.keys(r).filter(function (k) { return k !== 'code' && k !== 'bord' && r[k] != null && r[k] !== ''; });
    var titleKey = keys.indexOf('naam') >= 0 ? 'naam' : keys[0];
    var card = el('article', { class: 'rcard' + (isSign ? ' rcard-sign' : '') });
    if (isSign) {
      card.appendChild(el('div', { class: 'rcard-media' }, App.img(codeVal, { alt: info.naam || 'Verkeersbord', class: 'rcard-img' })));
    }
    var body = el('div', { class: 'rcard-body' });
    if (titleKey) body.appendChild(el('h3', { class: 'rcard-title', html: App.inline(String(r[titleKey])) }));
    keys.filter(function (k) { return k !== titleKey; }).forEach(function (k) {
      var v = String(r[k]);
      if (KOP[k]) body.appendChild(el('p', { class: 'rcard-line' }, el('span', { class: 'badge badge-' + k }, KOP[k]), ' ', el('span', { html: App.inline(v) })));
      else if (k === 'betekenis' || keys.length <= 2) body.appendChild(el('p', { class: 'rcard-text', html: App.inline(v) }));
      else body.appendChild(el('p', { class: 'rcard-line' }, el('span', { class: 'rcard-key' }, kopLabel(k)), ' ', el('span', { html: App.inline(v) })));
    });
    card.appendChild(body);
    if (isSign && info.credit) card.appendChild(el('p', { class: 'credit' }, 'Afbeelding: ' + info.credit.auteur + ', ' + info.credit.licentie));
    return card;
  }

  function moreBox(b) {
    var parts = [];
    if (b.uitleg) parts.push(el('div', { class: 'prose', html: App.md(b.uitleg) }));
    (b.kaders || []).forEach(function (k) {
      var t = KADER[k.type] || KADER.regel;
      if (!k.tekst) return;
      parts.push(el('div', { class: 'more-kader kader-' + k.type }, el('strong', {}, t.label + (k.titel ? ': ' + App.clean(k.titel) : '') + '. '), el('span', { html: App.inline(k.tekst) })));
      if (k.type === 'gewest' && k.gewest) parts.push(el('ul', { class: 'more-gewest' }, ['vlaanderen', 'wallonie', 'brussel'].filter(function (x) { return k.gewest[x]; }).map(function (x) { return el('li', {}, el('span', { class: 'badge badge-' + x }, KOP[x]), ' ', el('span', { html: App.inline(k.gewest[x]) })); })));
    });
    if (b.uitzonderingen && b.uitzonderingen.length) parts.push(el('div', { class: 'prose' }, el('h3', {}, 'Uitzonderingen'), el('ul', {}, b.uitzonderingen.map(function (u) { return el('li', { html: App.inline(u) }); }))));
    if (!parts.length) return null;
    var id = App.uid('more');
    var panel = el('div', { class: 'more-panel', id: id, hidden: true }, parts);
    var btn = el('button', { type: 'button', class: 'btn btn-more', 'aria-expanded': 'false', 'aria-controls': id, html: App.icon('down', 18) + ' <span>Meer uitleg</span>' });
    btn.addEventListener('click', function () {
      var open = panel.hidden; panel.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('span').textContent = open ? 'Minder uitleg' : 'Meer uitleg';
      btn.querySelector('svg').style.transform = open ? 'rotate(180deg)' : '';
    });
    return el('div', { class: 'more' }, btn, panel);
  }

  /* ---------- hoofdlogica ---------- */
  App.ready(function () {
    var wrap = document.getElementById('book-page'), barEl = document.getElementById('float-bar');
    if (!wrap || !barEl) return;
    var les = Number(document.body.getAttribute('data-les'));
    var book = C.boeken && C.boeken[les];
    if (!book) { wrap.textContent = 'Deze les is nog niet beschikbaar.'; return; }
    var pages = book.pages, N = pages.length, cur = 0;
    var curr = C.curriculum.filter(function (c) { return c.les === les; });
    var totalEx = pages.filter(function (p) { return p.t === 'oef'; }).length;
    var eindPool = (function () {
      var all = C.oefeningen.filter(function (o) { return o.les === les; });
      var ex = all.filter(function (o) { return o.examen !== false; });
      return ex.length >= 5 ? ex : all;
    })();
    var tocIdx = []; pages.forEach(function (p, i) { if (p.toc) tocIdx.push(i); });
    function rangeEnd(k) { return (k + 1 < tocIdx.length ? tocIdx[k + 1] : N) - 1; }
    function tocOf(i) { var k = 0; tocIdx.forEach(function (t, q) { if (t <= i) k = q; }); return k; }

    /* ----- pagina's ----- */
    function pageIntro() {
      var minutes = Math.max(5, Math.round((pages.filter(function (p) { return p.t === 'blok'; }).length * 1.5 + totalEx * 0.75 + 10) / 5) * 5);
      var d = el('section', { class: 'slide slide-intro' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Les ' + les));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, book.titel));
      d.appendChild(el('div', { class: 'facts' },
        el('div', { class: 'fact' }, el('span', { class: 'fact-ic', html: App.icon('book', 26) }), el('strong', {}, String(N)), el('span', {}, 'pagina’s')),
        el('div', { class: 'fact' }, el('span', { class: 'fact-ic', html: App.icon('target', 26) }), el('strong', {}, String(totalEx)), el('span', {}, 'oefeningen')),
        el('div', { class: 'fact' }, el('span', { class: 'fact-ic', html: App.icon('clock', 26) }), el('strong', {}, '± ' + minutes), el('span', {}, 'minuten'))));
      d.appendChild(el('h2', { class: 'mini-h' }, 'Dit leer je'));
      d.appendChild(el('ul', { class: 'big-list' }, curr.map(function (c) { return el('li', { text: App.clean(c.naam) }); })));
      d.appendChild(el('p', { class: 'muted' }, 'Elke pagina heeft één onderwerp. Na de uitleg komen de oefeningen, en je sluit af met een samenvatting en een eindtest.'));
      d.appendChild(el('a', { class: 'btn btn-primary btn-xl', href: '#p2', html: 'Start ' + App.icon('right', 22) }));
      return d;
    }

    function pageBlok(p) {
      var b = App.blokById(p.id);
      var d = el('section', { class: 'slide slide-blok' });
      if (!b) { d.textContent = 'Deze pagina ontbreekt.'; return d; }
      d.appendChild(el('p', { class: 'eyebrow' }, p.hoofdstuk));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, App.clean(b.titel)));
      var inTable = {};
      (b.regels || []).forEach(function (r) { if (r.code) inTable[r.code] = 1; if (r.bord) inTable[r.bord] = 1; });
      var signs = [], schemas = [];
      (b.afbeeldingen || []).forEach(function (n) {
        var i = App.imgInfo(n); if (!i) return;
        if (i.soort === 'bord') { if (!inTable[n]) signs.push(n); } else schemas.push(n);
      });
      if (signs.length) {
        var strip = el('div', { class: 'sign-strip' });
        signs.slice(0, 4).forEach(function (n) { var f = App.figure(n, { class: 'sign-big' }); if (f) strip.appendChild(f); });
        d.appendChild(strip);
      }
      if (schemas.length) {
        var gal = el('div', { class: 'schema-gallery' + (schemas.length === 1 ? ' single' : '') });
        schemas.slice(0, 2).forEach(function (n) { var f = App.figure(n, { class: 'schema-card' }); if (f) gal.appendChild(f); });
        d.appendChild(gal);
      }
      var kort = kortOf(b);
      if (kort.length) d.appendChild(el('ul', { class: 'big-list' }, kort.map(function (t) { return el('li', { html: App.inline(t) }); })));
      if (p.inline) d.appendChild(el('div', { class: 'card-grid' }, (b.regels || []).map(rowCard)));
      var kad = (b.kaders || []).slice(0, 3);
      if (kad.length) d.appendChild(el('div', { class: 'kader-stack' }, kad.map(kaderShort)));
      var more = moreBox(b); if (more) d.appendChild(more);
      return d;
    }

    function pageRegels(p) {
      var b = App.blokById(p.id);
      var d = el('section', { class: 'slide slide-regels' });
      d.appendChild(el('p', { class: 'eyebrow' }, p.hoofdstuk + (p.delen > 1 ? ' · deel ' + p.deel + ' van ' + p.delen : '')));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, App.clean(b.titel)));
      var rows = b.regels.slice(p.van, p.tot);
      var signy = rows.some(function (r) { var i = App.imgInfo(r.code || r.bord); return i && i.soort === 'bord'; });
      d.appendChild(el('div', { class: 'card-grid' + (signy ? ' sign-grid-big' : '') }, rows.map(rowCard)));
      return d;
    }

    function pageOef(p, idx) {
      var ex = App.exById(p.ex);
      var b = p.blok ? App.blokById(p.blok) : null;
      var d = el('section', { class: 'slide slide-oef' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Oefening' + (b ? ' · ' + App.clean(b.titel) : '')));
      d.appendChild(el('h1', { class: 'sr', tabindex: '-1', id: 'page-title' }, 'Oefening'));
      if (!ex) { d.appendChild(el('p', {}, 'Deze oefening ontbreekt.')); return d; }
      var nr = pages.slice(0, idx + 1).filter(function (q) { return q.t === 'oef' && q.blok === p.blok; }).length;
      App.mountExercise(ex, d, { nr: nr, onResult: function () { App.markDone(les, idx); paintBar(); } });
      return d;
    }

    function pageExtra() {
      var d = el('section', { class: 'slide' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Les ' + les));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, 'Extra oefenen'));
      d.appendChild(el('p', { class: 'big-note' }, 'Nog meer oefeningen over de hele les.'));
      return d;
    }

    function pageSamenvatting(p) {
      var d = el('section', { class: 'slide slide-sum' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Samenvatting'));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, p.hoofdstuk));
      var list = el('ul', { class: 'sum-list' });
      pages.forEach(function (q, i) {
        if (q.t !== 'blok' || q.thema !== p.thema) return;
        var b = App.blokById(q.id); if (!b) return;
        var k = (b.kaders || []).filter(function (x) { return x.type === 'regel' || x.type === 'zwarefout'; })[0];
        var txt = k ? shortText(k.tekst) : (kortOf(b)[0] || '');
        list.appendChild(el('li', { class: k && k.type === 'zwarefout' ? 'sum-zwaar' : '' }, el('a', { href: '#p' + (i + 1) }, App.clean(b.titel)), el('span', { html: ' ' + App.inline(txt) })));
      });
      d.appendChild(list);
      return d;
    }

    function pageEind(idx) {
      var d = el('section', { class: 'slide slide-eind' });
      d.appendChild(el('p', { class: 'eyebrow' }, 'Les ' + les));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, 'Eindtest'));
      var root = el('div', { id: 'quiz-root' });
      var n = Math.min(20, eindPool.length), last = App.state.eind[les];
      var box;
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
    function paintToc() {
      bar.tocPop.innerHTML = '';
      bar.tocPop.appendChild(el('p', { class: 'pop-title' }, 'Les ' + les + ': ' + book.titel));
      var lastChap = null, curK = tocOf(cur), list = el('ul', { class: 'pop-list' });
      tocIdx.forEach(function (i, k) {
        var p = pages[i], chap = p.t === 'blok' ? p.hoofdstuk : null;
        if (chap && chap !== lastChap) { list.appendChild(el('li', { class: 'pop-chap' }, chap)); lastChap = chap; }
        var done = App.isDone(les, rangeEnd(k));
        var title = p.t === 'blok' ? App.clean(p.titel) : p.titel;
        var a = el('a', { href: '#p' + (i + 1), class: 'pop-link' + (k === curK ? ' current' : '') + (p.t !== 'blok' ? ' pop-special' : '') + (done ? ' done' : ''), 'aria-current': k === curK ? 'page' : null },
          el('span', { class: 'pop-n', html: done ? App.icon('check', 14) : String(i + 1) }), el('span', { class: 'pop-t' }, title), done ? el('span', { class: 'sr' }, ' (gedaan)') : null);
        list.appendChild(el('li', {}, a));
      });
      bar.tocPop.appendChild(list);
    }
    function paintBar() {
      bar.count.innerHTML = 'Pagina <strong>' + (cur + 1) + '</strong> van ' + N;
      bar.prog.style.width = Math.round(100 * (cur + 1) / N) + '%';
      bar.bProg.setAttribute('aria-valuenow', cur + 1);
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
      cur = i;
      var p = pages[i], content;
      wrap.innerHTML = '';
      if (p.t === 'intro') content = pageIntro();
      else if (p.t === 'blok') content = pageBlok(p);
      else if (p.t === 'regels') content = pageRegels(p);
      else if (p.t === 'oef') content = pageOef(p, i);
      else if (p.t === 'extra') content = pageExtra();
      else if (p.t === 'samenvatting') content = pageSamenvatting(p);
      else content = pageEind(i);
      wrap.appendChild(content);
      wrap.classList.remove('enter'); void wrap.offsetWidth; wrap.classList.add('enter');
      if (p.t === 'samenvatting' || p.t === 'extra') App.markDone(les, i);
      App.state.last[les] = i + 1; App.state.recent = les; App.save();
      document.title = (p.t === 'oef' ? 'Oefening' : p.titel) + ' · Les ' + les + ' · Theorie rijbewijs B';
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
