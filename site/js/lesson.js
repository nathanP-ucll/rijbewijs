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
  /** Bordkaart: links groot bord, rechts naam + wat moet je doen + let op. */
  function bordKaart(k) {
    var info = App.imgInfo(k.afb);
    var card = el('article', { class: 'bkaart' });
    card.appendChild(el('div', { class: 'bkaart-media' }, App.img(k.afb, { alt: k.naam || (info && info.naam) || 'Afbeelding', class: 'bkaart-img' })));
    var body = el('div', { class: 'bkaart-body' });
    body.appendChild(el('h3', { class: 'bkaart-title', html: App.inline(String(k.naam || (info && info.naam) || '')) }));
    if (k.uitleg) body.appendChild(el('p', { class: 'bkaart-text', html: App.inline(String(k.uitleg)) }));
    if (k.letop) body.appendChild(el('p', { class: 'bkaart-letop' }, el('span', { class: 'bkaart-tag' }, 'Let op'), ' ', el('span', { html: App.inline(String(k.letop)) })));
    card.appendChild(body);
    if (info && info.credit) card.appendChild(el('p', { class: 'credit' }, 'Afbeelding: ' + info.credit.auteur + ', ' + info.credit.licentie));
    return card;
  }
  function rowToKaart(r) {
    var code = r.afb || r.code || r.bord;
    var info = code && App.imgInfo(code);
    if (!info) return null;
    if (r.afb) return r;
    if (info.soort !== 'bord') return null;
    return { afb: code, naam: r.naam || info.naam, uitleg: r.betekenis || r.uitleg, letop: r.letop };
  }
  function rowCard(r) {
    var kk = rowToKaart(r);
    if (kk) return bordKaart(kk);
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

  function vergelijkKaart(v) {
    var n = (v.afbs || []).length;
    var card = el('article', { class: 'vkaart' }, v.titel ? el('h3', { class: 'vkaart-title', html: App.inline(v.titel) }) : null);
    var cols = el('div', { class: 'vkaart-cols vk-' + Math.min(n, 3) });
    (v.afbs || []).forEach(function (a) {
      var info = App.imgInfo(a); if (!info) return;
      cols.appendChild(el('figure', { class: 'vcol' }, el('div', { class: 'vcol-media' }, App.img(a, { alt: info.naam || 'Verkeersbord', class: 'vcol-img' })), el('figcaption', {}, info.naam || '', info.credit ? el('span', { class: 'credit' }, 'Afbeelding: ' + info.credit.auteur + ', ' + info.credit.licentie) : null)));
    });
    card.appendChild(cols);
    if (v.verschil) card.appendChild(el('p', { class: 'vkaart-diff' }, el('strong', {}, 'Het verschil: '), el('span', { html: App.inline(v.verschil) })));
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

  function chap(p) { return p.hn ? 'Hoofdstuk ' + p.hn + ' · ' + p.hoofdstuk : p.hoofdstuk; }
  function kop(d, p, titel, eyebrow) {
    d.appendChild(el('p', { class: 'eyebrow' }, eyebrow || chap(p)));
    d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, p.nr ? el('span', { class: 'nr' }, p.nr) : null, p.nr ? ' ' : null, titel));
  }
  function leadSentence(t) { return el('p', { class: 'lead-sent', html: App.inline(t) }); }
  function onthoud(txt) {
    if (!txt) return null;
    return el('aside', { class: 'onthoud' }, el('span', { class: 'onthoud-ic', html: App.icon('tip', 24) }), el('div', {}, el('p', { class: 'onthoud-l' }, 'Onthoud dit'), el('p', { class: 'onthoud-t', html: App.inline(txt) })));
  }
  var KADER_RANG = { zwarefout: 0, regel: 1, letop: 2, gewest: 3, tip: 4 };
  function kadersSorted(b) { return (b.kaders || []).slice().sort(function (x, y) { return (KADER_RANG[x.type] == null ? 9 : KADER_RANG[x.type]) - (KADER_RANG[y.type] == null ? 9 : KADER_RANG[y.type]); }); }

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
      var all = C.oefeningen.filter(function (o) { return o.les === les && !o.mini; });
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
      kop(d, p, App.clean(b.titel));
      var inTable = {};
      (b.regels || []).forEach(function (r) { if (r.code) inTable[r.code] = 1; if (r.bord) inTable[r.bord] = 1; });
      (b.kaarten || []).forEach(function (k) { inTable[k.afb] = 1; });
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
      var lead = kort.length > 2 ? kort[0] : null;
      var rest = lead ? kort.slice(1, 5) : kort.slice(0, 4);
      if (lead) d.appendChild(leadSentence(lead));
      if (rest.length) d.appendChild(el('ul', { class: 'big-list' }, rest.map(function (t) { return el('li', { html: App.inline(t) }); })));
      if (p.inline) d.appendChild(el('div', { class: 'card-grid' }, (b.regels || []).map(rowCard)));
      var kads = kadersSorted(b);
      var nKad = (p.kaders != null ? p.kaders : 1);
      var kad = kads.slice(0, nKad);
      if (kad.length) d.appendChild(el('div', { class: 'kader-stack' }, kad.map(kaderShort)));
      var extra = (p.ids || []).slice(1).map(App.blokById).filter(Boolean);
      extra.forEach(function (eb) {
        var sec = el('section', { class: 'merge-sec' }, el('h2', { class: 'merge-title' }, App.clean(eb.titel)));
        var ek = kortOf(eb);
        if (ek.length) sec.appendChild(el('ul', { class: 'big-list' }, ek.slice(0, 3).map(function (t) { return el('li', { html: App.inline(t) }); })));
        var ekad = kadersSorted(eb)[0]; if (ekad) sec.appendChild(el('div', { class: 'kader-stack' }, kaderShort(ekad)));
        d.appendChild(sec);
      });
      var more = moreBox(b); if (more) d.appendChild(more);
      if (!(p.mini && p.mini.length)) {
        var k1 = kads.filter(function (x) { return x.type === 'regel' || x.type === 'zwarefout'; })[0];
        var ot = onthoud(k1 && k1.tekst ? shortText(k1.tekst) : (kort[kort.length - 1] || ''));
        if (ot) d.appendChild(ot);
      }
      return d;
    }

    function pageRegels(p) {
      var b = App.blokById(p.id);
      var d = el('section', { class: 'slide slide-regels' });
      kop(d, p, App.clean(b.titel), chap(p) + (p.delen > 1 ? ' · deel ' + p.deel + ' van ' + p.delen : ''));
      d.appendChild(leadSentence(p.kaart || (b.regels || []).some(function (r) { return App.imgInfo(r.code || r.bord); }) ? 'Bekijk elk bord goed en lees wat je moet doen.' : 'Dit zijn de belangrijkste gevallen, één voor één.'));
      var rows = (p.kaart ? b.kaarten : b.regels).slice(p.van, p.tot);
      var list = el('div', { class: 'kaart-list' });
      var lastG = null;
      rows.forEach(function (r) {
        if (r.groep && r.groep !== lastG) { list.appendChild(el('h2', { class: 'groep' }, App.clean(r.groep))); lastG = r.groep; }
        list.appendChild(rowCard(r));
      });
      d.appendChild(list);
      return d;
    }

    function pageVergelijk(p) {
      var b = App.blokById(p.id);
      var d = el('section', { class: 'slide slide-vergelijk' });
      kop(d, p, App.clean(b.titel), chap(p) + ' · let op het verschil');
      d.appendChild(leadSentence('Deze borden lijken op elkaar. Let goed op het verschil.'));
      d.appendChild(vergelijkKaart(b.vergelijk[p.v]));
      return d;
    }

    function pageKaders(p) {
      var b = App.blokById(p.id);
      var d = el('section', { class: 'slide slide-kaders' });
      kop(d, p, App.clean(b.titel), chap(p) + ' · goed om te weten');
      d.appendChild(leadSentence('Nog een paar dingen die je zeker moet weten.'));
      d.appendChild(el('div', { class: 'kader-stack' }, kadersSorted(b).slice(p.van, p.tot).map(kaderShort)));
      return d;
    }

    function miniSection(p, idx) {
      var exs = (p.mini || []).map(App.exById).filter(Boolean);
      if (!exs.length) return null;
      var sec = el('section', { class: 'mini-ex', 'aria-label': 'Probeer het zelf' }, el('h2', { class: 'mini-title' }, 'Probeer het zelf'));
      exs.forEach(function (ex, i) {
        App.mountExercise(ex, sec, { nr: i + 1, mini: true, onResult: function () { App.markDone(les, idx); paintBar(); } });
      });
      return sec;
    }

    function pageOef(p, idx) {
      var ex = App.exById(p.ex);
      var b = p.blok ? App.blokById(p.blok) : null;
      var d = el('section', { class: 'slide slide-oef' });
      d.appendChild(el('p', { class: 'eyebrow' }, (p.nr ? p.nr + ' · ' : '') + 'Oefening' + (b ? ' · ' + App.clean(b.titel) : '')));
      d.appendChild(el('h1', { class: 'sr', tabindex: '-1', id: 'page-title' }, 'Oefening ' + (p.nr || '')));
      if (!ex) { d.appendChild(el('p', {}, 'Deze oefening ontbreekt.')); return d; }
      var nr = pages.slice(0, idx + 1).filter(function (q) { return q.t === 'oef' && q.blok === p.blok; }).length;
      App.mountExercise(ex, d, { nr: nr, nolink: true, onResult: function () { App.markDone(les, idx); paintBar(); } });
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
      d.appendChild(el('p', { class: 'eyebrow' }, 'Samenvatting les ' + les + (p.hn ? ' · hoofdstuk ' + p.hn : '')));
      d.appendChild(el('h1', { class: 'page-title', tabindex: '-1', id: 'page-title' }, p.hoofdstuk));
      d.appendChild(leadSentence('Dit zijn de belangrijkste punten van dit hoofdstuk.'));
      var list = el('ul', { class: 'sum-list' });
      pages.forEach(function (q, i) {
        if (q.t !== 'blok' || q.thema !== p.thema) return;
        var b = App.blokById(q.id); if (!b) return;
        if (!q.nr) return;
        var k = (b.kaders || []).filter(function (x) { return x.type === 'regel' || x.type === 'zwarefout'; })[0];
        var txt = k ? shortText(k.tekst) : (kortOf(b)[0] || '');
        list.appendChild(el('li', { class: k && k.type === 'zwarefout' ? 'sum-zwaar' : '' }, el('a', { href: '#p' + (i + 1) }, el('span', { class: 'nr' }, q.par), ' ', App.clean(b.titel)), el('span', { html: ' ' + App.inline(txt) })));
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
    var openChap = {};
    function paintToc() {
      bar.tocPop.innerHTML = '';
      bar.tocPop.appendChild(el('p', { class: 'pop-title' }, 'Les ' + les + ': ' + book.titel));
      var curK = tocOf(cur), curP = pages[cur];
      var wrapEl = el('div', { class: 'pop-body' });
      function entry(i, k, label, num) {
        var p = pages[i], done = App.isDone(les, rangeEnd(k));
        var a = el('a', { href: '#p' + (i + 1), class: 'pop-link' + (k === curK ? ' current' : '') + (done ? ' done' : ''), 'aria-current': k === curK ? 'page' : null },
          el('span', { class: 'pop-n', html: done ? App.icon('check', 14) : '' }), el('span', { class: 'pop-num' }, num || ''), el('span', { class: 'pop-t' }, label), done ? el('span', { class: 'sr' }, ' (gedaan)') : null);
        return el('li', {}, a);
      }
      var chapters = {}, order = [], special = [];
      tocIdx.forEach(function (i, k) {
        var p = pages[i];
        if (p.t === 'blok') { var h = p.hn; if (!chapters[h]) { chapters[h] = { hn: h, titel: p.hoofdstuk, items: [] }; order.push(h); } chapters[h].items.push([i, k]); }
        else special.push([i, k]);
      });
      wrapEl.appendChild(el('ul', { class: 'pop-list' }, special.filter(function (x) { return pages[x[0]].t === 'intro'; }).map(function (x) { return entry(x[0], x[1], 'Inleiding'); })));
      order.forEach(function (h) {
        var c = chapters[h];
        var isCur = curP.hn === h && curP.t !== 'samenvatting';
        var det = el('details', { class: 'pop-chapter' }, el('summary', {}, el('span', { class: 'pop-hn' }, 'H' + h), ' ', c.titel));
        if (isCur || openChap[h]) det.open = true;
        det.addEventListener('toggle', function () { openChap[h] = det.open; });
        det.appendChild(el('ul', { class: 'pop-list' }, c.items.map(function (x) { var p = pages[x[0]]; return entry(x[0], x[1], App.clean(p.titel), p.par); })));
        wrapEl.appendChild(det);
      });
      var end = special.filter(function (x) { return pages[x[0]].t !== 'intro'; });
      if (end.length) {
        wrapEl.appendChild(el('p', { class: 'pop-chap' }, 'Afsluiting'));
        wrapEl.appendChild(el('ul', { class: 'pop-list' }, end.map(function (x) { return entry(x[0], x[1], pages[x[0]].titel); })));
      }
      bar.tocPop.appendChild(wrapEl);
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
      else if (p.t === 'vergelijk') content = pageVergelijk(p);
      else if (p.t === 'kaders') content = pageKaders(p);
      else if (p.t === 'oef') content = pageOef(p, i);
      else if (p.t === 'extra') content = pageExtra();
      else if (p.t === 'samenvatting') content = pageSamenvatting(p);
      else content = pageEind(i);
      var mini = miniSection(p, i); if (mini) content.appendChild(mini);
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
