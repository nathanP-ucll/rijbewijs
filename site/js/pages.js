/* Overige pagina's: start, proefexamen, oefenbank, mijn fouten, spiekbrief, bronnen. */
(function () {
  'use strict';
  var App = window.App, C = App.C, el = App.el;
  var page = document.body.getAttribute('data-page');

  function storageNotice() {
    if (App.storageOK()) return null;
    return el('p', { class: 'notice warn' }, 'Je browser bewaart geen gegevens voor deze site (privémodus of geblokkeerd). De cursus werkt, maar je voortgang en je foute vragen verdwijnen zodra je de pagina sluit.');
  }
  function examPool(lessen) {
    return C.oefeningen.filter(function (o) { return o.examen !== false && (!lessen || lessen.indexOf(o.les) >= 0); });
  }

  /* ================= START ================= */
  function home() {
    var books = C.boeken, ids = [1, 2, 3, 4];
    var tot = 0, done = 0;
    ids.forEach(function (l) { var b = books[l]; if (!b) return; tot += b.pages.length; b.pages.forEach(function (_, i) { if (App.isDone(l, i)) done++; }); });
    var exOk = Object.keys(App.state.res).filter(function (k) { return App.state.res[k] === 1 && App.exById(k); }).length;
    var exSeen = Object.keys(App.state.res).filter(function (k) { return App.exById(k); }).length;
    var pct = tot ? Math.round(100 * done / tot) : 0;
    var box = document.getElementById('home-progress');
    var lastExam = App.state.exam.length ? App.state.exam[App.state.exam.length - 1] : null;
    box.innerHTML = '';
    var r = 44, circ = 2 * Math.PI * r;
    box.appendChild(el('div', { class: 'ring-wrap' },
      el('div', { class: 'ring', role: 'img', 'aria-label': pct + ' procent van de pagina’s gelezen', html:
        '<svg viewBox="0 0 100 100" width="132" height="132"><circle class="ring-bg" cx="50" cy="50" r="' + r + '"/><circle class="ring-fg" cx="50" cy="50" r="' + r + '" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + (circ * (1 - pct / 100)).toFixed(1) + '" transform="rotate(-90 50 50)"/></svg><span class="ring-n">' + pct + '<small>%</small></span>' }),
      el('div', { class: 'ring-text' }, el('h2', {}, 'Jouw voortgang'),
        el('ul', { class: 'mini-stats' },
          el('li', {}, el('strong', {}, done + ' / ' + tot), ' pagina’s gelezen'),
          el('li', {}, el('strong', {}, String(exOk)), ' van ' + exSeen + ' beantwoorde oefeningen juist'),
          lastExam ? el('li', {}, 'Laatste proefexamen: ', el('strong', {}, lastExam.pts + '/' + lastExam.max), lastExam.geslaagd ? ' (geslaagd)' : ' (niet geslaagd)') : el('li', {}, 'Nog geen proefexamen gedaan')))));
    var n = storageNotice(); if (n) box.appendChild(n);

    // verder waar je bleef
    var lastLes = App.state.recent, lastPg = lastLes ? App.state.last[lastLes] : 0;
    if (!(lastPg > 1)) lastLes = null;
    if (lastLes) {
      var act = document.getElementById('hero-actions');
      act.innerHTML = '';
      act.appendChild(el('a', { class: 'btn btn-primary btn-lg', href: 'les' + lastLes + '.html#p' + lastPg }, 'Verder: les ' + lastLes + ', pagina ' + lastPg));
      act.appendChild(el('a', { class: 'btn btn-lg', href: '#inleiding' }, 'Hoe werkt het?'));
    }

    // lessenkaarten
    var grid = document.getElementById('lesson-grid'); grid.innerHTML = '';
    ids.forEach(function (l) {
      var b = books[l]; if (!b) return;
      var nd = b.pages.filter(function (_, i) { return App.isDone(l, i); }).length;
      var p = Math.round(100 * nd / b.pages.length);
      var nEx = C.oefeningen.filter(function (o) { return o.les === l; }).length;
      var eind = App.state.eind[l];
      var themas = b.themas.map(function (t) { return t.naam; });
      grid.appendChild(el('a', { class: 'lesson-card card les-' + l, href: 'les' + l + '.html' + (App.state.last[l] > 1 ? '#p' + App.state.last[l] : '') },
        el('span', { class: 'lesson-n', 'aria-hidden': 'true' }, String(l)),
        el('div', { class: 'lesson-body' },
          el('p', { class: 'eyebrow' }, 'Les ' + l),
          el('h3', {}, b.titel),
          el('p', { class: 'muted' }, b.ondertitel),
          el('ul', { class: 'tag-list' }, themas.map(function (t) { return el('li', {}, t); })),
          el('div', { class: 'lesson-meta' }, el('span', {}, b.pages.length + ' pagina’s'), nEx ? el('span', {}, nEx + ' oefeningen') : null, eind ? el('span', {}, 'Eindtest: ' + eind.score + '/' + eind.total) : null),
          el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': p, 'aria-label': 'Voortgang les ' + l }, el('span', { class: 'progress-fill', style: 'width:' + p + '%' })),
          el('span', { class: 'lesson-cta' }, nd === 0 ? 'Begin met deze les' : nd >= b.pages.length ? 'Les herhalen' : 'Ga verder (' + p + '%)'))));
    });
    var fc = document.getElementById('fouten-count');
    var nf = App.foutIds().filter(App.exById).length;
    if (fc && nf) { fc.hidden = false; fc.textContent = nf; }
  }

  /* ================= PROEFEXAMEN ================= */
  function exam() {
    var root = document.getElementById('exam-root');
    var cfgSaved = App.state.examcfg || {};
    function setup() {
      root.innerHTML = '';
      root.appendChild(el('header', { class: 'page-head' }, el('p', { class: 'eyebrow' }, 'Test jezelf'), el('h1', {}, 'Proefexamen'),
        el('p', { class: 'lead' }, 'Een oefenexamen met dezelfde puntentelling als het theorie-examen in Vlaanderen.')));
      var n = storageNotice(); if (n) root.appendChild(n);
      root.appendChild(el('section', { class: 'card prose' }, el('h2', {}, 'Zo werkt de puntentelling'),
        el('ul', { class: 'ticks' },
          el('li', {}, 'Je start met evenveel punten als er vragen zijn (bij 50 vragen: 50 punten).'),
          el('li', {}, 'Een fout of onbeantwoord antwoord kost ', el('strong', {}, '1 punt'), '.'),
          el('li', {}, 'Een fout antwoord op een vraag over een ', el('strong', {}, 'zware overtreding (3de of 4de graad)'), ' of over de ', el('strong', {}, 'maximumsnelheid'), ' kost ', el('strong', {}, '5 punten'), '.'),
          el('li', {}, 'Geslaagd: minstens ', el('strong', {}, '41 op 50'), '. Met een ander aantal vragen gebruiken we dezelfde verhouding.'),
          el('li', {}, 'Je krijgt pas feedback na het afronden: dan zie je ook wat je moet herhalen.'))));
      var lessen = [1, 2, 3, 4];
      var checks = lessen.map(function (l) {
        var cnt = examPool([l]).length;
        var inp = el('input', { type: 'checkbox', checked: (cfgSaved.lessen || lessen).indexOf(l) >= 0 && cnt > 0, disabled: cnt === 0 });
        return { l: l, inp: inp, lab: el('label', { class: 'check-pill' }, inp, el('span', {}, 'Les ' + l + ' ', el('small', {}, '(' + cnt + ' vragen)'))) };
      });
      var maxPool = examPool().length;
      var nInp = el('input', { type: 'number', id: 'ex-n', min: 1, max: Math.max(1, maxPool), value: Math.min(cfgSaved.n || 50, Math.max(1, maxPool)), class: 'txt narrow' });
      var tInp = el('input', { type: 'number', id: 'ex-t', min: 0, max: 180, value: cfgSaved.min != null ? cfgSaved.min : 0, class: 'txt narrow' });
      var sw = el('input', { type: 'checkbox', id: 'ex-sw', checked: cfgSaved.sw !== false });
      var msg = el('p', { class: 'muted small', id: 'ex-pool' });
      function poolNow() { var ls = checks.filter(function (c) { return c.inp.checked; }).map(function (c) { return c.l; }); return examPool(ls); }
      function upd() {
        var p = poolNow().length;
        nInp.max = Math.max(1, p);
        msg.textContent = p ? p + ' vragen beschikbaar in je selectie.' : 'Kies minstens één les met vragen.';
        startBtn.disabled = p === 0;
      }
      var startBtn = el('button', { type: 'button', class: 'btn btn-primary btn-lg' }, 'Start het proefexamen');
      var form = el('section', { class: 'card form' }, el('h2', {}, 'Instellingen'),
        el('fieldset', {}, el('legend', {}, 'Vragen uit'), el('div', { class: 'pill-row' }, checks.map(function (c) { return c.lab; }))),
        el('div', { class: 'form-row' },
          el('label', { for: 'ex-n' }, 'Aantal vragen'), nInp,
          el('label', { for: 'ex-t' }, 'Tijdslimiet in minuten (0 = geen limiet)'), tInp),
        el('div', { class: 'form-row' }, sw, el('label', { for: 'ex-sw' }, 'Tijd tonen tijdens het examen')),
        msg, el('div', { class: 'form-actions' }, startBtn));
      root.appendChild(form);
      checks.forEach(function (c) { c.inp.addEventListener('change', upd); });
      upd();
      startBtn.addEventListener('click', function () {
        var ls = checks.filter(function (c) { return c.inp.checked; }).map(function (c) { return c.l; });
        var pool = examPool(ls);
        var n = Math.max(1, Math.min(parseInt(nInp.value, 10) || 50, pool.length));
        var min = Math.max(0, parseInt(tInp.value, 10) || 0);
        App.state.examcfg = { lessen: ls, n: n, min: min, sw: sw.checked }; App.save();
        run(App.shuffle(pool).slice(0, n), min, sw.checked);
      });
      var hist = App.state.exam.slice(-5).reverse();
      if (hist.length) {
        root.appendChild(el('section', { class: 'card' }, el('h2', {}, 'Je vorige proefexamens'),
          el('ul', { class: 'hist' }, hist.map(function (h) {
            var d = new Date(h.ts);
            return el('li', {}, el('span', { class: 'badge ' + (h.geslaagd ? 'badge-ok' : 'badge-bad') }, h.geslaagd ? 'Geslaagd' : 'Niet geslaagd'),
              el('strong', {}, ' ' + h.pts + '/' + h.max), el('span', { class: 'muted' }, ' · ' + h.n + ' vragen · ' + d.toLocaleDateString('nl-BE') + ' ' + d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })));
          }))));
      }
    }
    function run(exs, min, showTimer) {
      root.innerHTML = '';
      var n = exs.length, pass = Math.round(n * 41 / 50);
      root.appendChild(el('header', { class: 'page-head compact' }, el('p', { class: 'eyebrow' }, 'Proefexamen'), el('h1', {}, n + ' vragen'),
        el('p', { class: 'muted' }, 'Start: ' + n + ' punten · fout -1 · zware fout -5 · slagen vanaf ' + pass + (n !== 50 ? ' (zelfde verhouding als 41 op 50)' : ''))));
      var q = el('div'); root.appendChild(q);
      App.runQuiz(q, {
        exercises: exs, scoring: 'exam', start: n, passMark: pass, timeLimit: min * 60, showTimer: showTimer || min > 0,
        restart: setup, restartLabel: 'Nieuw proefexamen',
        onFinish: function (res) {
          App.state.exam.push({ ts: Date.now(), pts: res.pts, max: n, n: n, geslaagd: res.geslaagd });
          App.state.exam = App.state.exam.slice(-30); App.save();
        }
      });
      window.scrollTo(0, 0);
    }
    setup();
  }

  /* ================= OEFENBANK ================= */
  function bank() {
    var root = document.getElementById('bank-root');
    var all = C.oefeningen.slice().sort(function (a, b) { return (a.les - b.les) || String(a.onderwerp).localeCompare(String(b.onderwerp)) || String(a.id).localeCompare(String(b.id)); });
    if (!all.length) { root.innerHTML = ''; root.appendChild(el('p', { class: 'notice' }, 'Er zijn nog geen oefeningen beschikbaar.')); return; }
    function sel(id, label, opts) {
      var s = el('select', { id: id, class: 'sel' }, opts.map(function (o) { return el('option', { value: o[0] }, o[1]); }));
      return { s: s, wrap: el('div', { class: 'field' }, el('label', { for: id }, label), s) };
    }
    var fLes = sel('f-les', 'Les', [['', 'Alle lessen']].concat([1, 2, 3, 4].map(function (l) { return [String(l), 'Les ' + l]; })));
    var onderw = C.curriculum.filter(function (c) { return all.some(function (o) { return o.onderwerp === c.id; }); });
    var fOnd = sel('f-ond', 'Onderwerp', [['', 'Alle onderwerpen']].concat(onderw.map(function (c) { return [c.id, c.naam]; })));
    var types = Object.keys(all.reduce(function (m, o) { m[o.type] = 1; return m; }, {}));
    var fType = sel('f-type', 'Type', [['', 'Alle types']].concat(types.map(function (t) { return [t, App.TYPE_LABEL[t] || t]; })));
    var fMoei = sel('f-moei', 'Moeilijkheid', [['', 'Alle niveaus'], ['1', 'Makkelijk'], ['2', 'Gemiddeld'], ['3', 'Moeilijk']]);
    var fZoek = el('input', { type: 'search', id: 'f-zoek', class: 'txt', placeholder: 'Zoek in de vraag…' });
    var fMix = el('input', { type: 'checkbox', id: 'f-mix' });
    var count = el('p', { class: 'bank-count', role: 'status', 'aria-live': 'polite' });
    var out = el('div');
    root.appendChild(el('div', { class: 'filters card' }, fLes.wrap, fOnd.wrap, fType.wrap, fMoei.wrap,
      el('div', { class: 'field' }, el('label', { for: 'f-zoek' }, 'Zoeken'), fZoek),
      el('div', { class: 'field field-check' }, fMix, el('label', { for: 'f-mix' }, 'Door elkaar'))));
    root.appendChild(count); root.appendChild(out);
    function apply() {
      var l = fLes.s.value, o = fOnd.s.value, t = fType.s.value, m = fMoei.s.value, z = App.norm(fZoek.value);
      var list = all.filter(function (x) {
        return (!l || String(x.les) === l) && (!o || x.onderwerp === o) && (!t || x.type === t) && (!m || String(x.moeilijkheid) === m) &&
          (!z || App.norm((x.vraag || '') + ' ' + (x.stelling || '') + ' ' + (x.tekst || '')).indexOf(z) >= 0);
      });
      if (fMix.checked) list = App.shuffle(list);
      count.textContent = list.length + ' oefening' + (list.length === 1 ? '' : 'en') + ' gevonden';
      out.innerHTML = '';
      if (!list.length) out.appendChild(el('p', { class: 'notice' }, 'Geen oefeningen met deze filters. Kies iets anders.'));
      else App.practiceList(out, list, { pageSize: 10 });
    }
    [fLes.s, fOnd.s, fType.s, fMoei.s, fMix].forEach(function (x) { x.addEventListener('change', apply); });
    fZoek.addEventListener('input', function () { clearTimeout(fZoek._t); fZoek._t = setTimeout(apply, 200); });
    apply();
  }

  /* ================= MIJN FOUTEN ================= */
  function fouten() {
    var root = document.getElementById('fouten-root');
    function draw() {
      root.innerHTML = '';
      var n = storageNotice(); if (n) root.appendChild(n);
      var exs = App.foutIds().map(App.exById).filter(Boolean);
      if (!exs.length) {
        root.appendChild(el('div', { class: 'empty card' }, el('h2', {}, 'Geen openstaande fouten'),
          el('p', {}, App.storageOK() ? 'Zodra je een vraag fout beantwoordt, komt ze hier terecht. Ga oefenen of doe het proefexamen.' : 'Je browser bewaart geen gegevens, dus hier verschijnen enkel fouten van de huidige sessie.'),
          el('p', {}, el('a', { class: 'btn btn-primary', href: 'oefenbank.html' }, 'Naar de oefenbank'), ' ', el('a', { class: 'btn', href: 'examen.html' }, 'Proefexamen'))));
        return;
      }
      var perOnd = {};
      exs.forEach(function (e) { perOnd[e.onderwerp] = (perOnd[e.onderwerp] || 0) + 1; });
      root.appendChild(el('div', { class: 'card' }, el('h2', {}, exs.length + ' vraag' + (exs.length === 1 ? '' : 'en') + ' om te herhalen'),
        el('ul', { class: 'tag-list' }, Object.keys(perOnd).map(function (k) { var c = App.cur(k); return el('li', {}, (c ? c.naam : k) + ' (' + perOnd[k] + ')'); })),
        el('p', {}, el('button', { type: 'button', class: 'btn btn-sm', on: { click: function () {
          App.state.fouten = {}; App.save(); draw();
        } } }, 'Lijst leegmaken'))));
      var box = el('div'); root.appendChild(box);
      App.practiceList(box, App.shuffle(exs), { pageSize: 10 });
    }
    draw();
  }

  /* ================= SPIEKBRIEF ================= */
  function spiek() {
    var ctr = document.getElementById('spiek-controls'), root = document.getElementById('spiek-root');
    var chosen = { 1: true, 2: true, 3: true, 4: true };
    [1, 2, 3, 4].forEach(function (l) {
      var inp = el('input', { type: 'checkbox', checked: true, id: 'sp-' + l });
      inp.addEventListener('change', function () { chosen[l] = inp.checked; draw(); });
      ctr.appendChild(el('label', { class: 'check-pill', for: 'sp-' + l }, inp, el('span', {}, 'Les ' + l)));
    });
    ctr.appendChild(el('button', { type: 'button', class: 'btn btn-primary', on: { click: function () { window.print(); } } }, 'Afdrukken'));
    var KL = { regel: 'Regel', letop: 'Let op', zwarefout: 'Zware fout', gewest: 'Gewest' };
    function compactRows(b) {
      var rows = b.regels || [];
      if (!rows.length) return null;
      var hasCode = rows.some(function (r) { return r.code && App.imgInfo(r.code); });
      if (hasCode) {
        var g = el('div', { class: 'sign-grid' });
        rows.forEach(function (r) {
          var info = App.imgInfo(r.code);
          g.appendChild(el('div', { class: 'sg-item' }, info ? App.img(r.code, { alt: '' }) : null, el('span', { class: 'sg-code cat-' + (info ? info.cat : '') }, String(r.code).replace(/_/g, ' ')), el('span', { class: 'sg-name' }, r.naam || '')));
        });
        return g;
      }
      if (rows.length > 14) return null;
      var keys = Object.keys(rows[0]);
      var t = el('table', { class: 'tbl tbl-compact' }, el('thead', {}, el('tr', {}, keys.map(function (k) { return el('th', {}, k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ')); }))),
        el('tbody', {}, rows.map(function (r) { return el('tr', {}, keys.map(function (k) { return el('td', { html: App.inline(r[k] == null ? '' : String(r[k])) }); })); })));
      return t;
    }
    function draw() {
      root.innerHTML = '';
      [1, 2, 3, 4].forEach(function (l) {
        if (!chosen[l]) return;
        var b = C.boeken[l]; if (!b) return;
        var sec = el('section', { class: 'spiek-les' }, el('h2', {}, 'Les ' + l + ': ' + b.titel));
        b.pages.forEach(function (p) {
          if (p.t !== 'blok') return;
          var bl = App.blokById(p.id); if (!bl) return;
          var card = el('article', { class: 'spiek-blok' }, el('h3', {}, bl.titel));
          var tab = compactRows(bl); if (tab) card.appendChild(tab);
          var ks = (bl.kaders || []).filter(function (k) { return KL[k.type]; });
          if (ks.length) card.appendChild(el('ul', { class: 'spiek-list' }, ks.map(function (k) {
            var li = el('li', { class: 'sp-' + k.type }, el('span', { class: 'sp-tag' }, KL[k.type]), ' ', el('strong', {}, k.titel ? k.titel + ': ' : ''), el('span', { html: App.inline(k.tekst || '') }));
            if (k.type === 'gewest' && k.gewest) li.appendChild(el('span', { class: 'sp-gewest' }, [['vlaanderen', 'VL'], ['wallonie', 'WAL'], ['brussel', 'BXL']].map(function (g) { return k.gewest[g[0]] ? el('span', {}, el('b', {}, g[1] + ' '), App.plain(k.gewest[g[0]]) + ' ') : null; })));
            return li;
          })));
          if (!tab && !ks.length) card.appendChild(el('p', {}, App.plain(bl.uitleg).split(/(?<=[.!?])\s/)[0]));
          sec.appendChild(card);
        });
        root.appendChild(sec);
      });
      if (!root.children.length) root.appendChild(el('p', { class: 'notice' }, 'Kies minstens één les.'));
    }
    draw();
  }

  /* ================= BRONNEN ================= */
  function bronnen() {
    var root = document.getElementById('bronnen-root');
    var cc = C.credits.filter(function (c) { return !/public domain/i.test(c.licentie); });
    var pd = C.credits.filter(function (c) { return /public domain/i.test(c.licentie); });
    root.appendChild(el('section', { class: 'card prose' }, el('h2', {}, 'Hoe is deze cursus gemaakt?'),
      el('p', {}, 'Alle uitleg is in eigen woorden geschreven op basis van officiële en betrouwbare bronnen (hieronder). Bij elke theoriepagina staat een uitklapbaar lijstje met de bronnen die voor die pagina gebruikt zijn.'),
      el('p', {}, 'Regels veranderen: de huidige wegcode blijft gelden tot 31 mei 2027, daarna volgt de nieuwe Code van de openbare weg. Controleer belangrijke regels altijd bij de officiële bron voor je examen.')));

    // afbeeldingen
    var sec = el('section', { id: 'afbeeldingen', class: 'card' }, el('h2', {}, 'Afbeeldingen en licenties'));
    sec.appendChild(el('p', {}, 'De verkeersborden komen van Wikimedia Commons. ', el('strong', {}, pd.length + ' borden zijn publiek domein'), ' (auteur: Agentschap Wegen en Verkeer of vergelijkbaar), ', el('strong', {}, cc.length + ' borden vragen naamsvermelding'), ' en vallen onder een Creative Commons-licentie. De uitlegschema’s zijn speciaal voor deze cursus getekend.'));
    if (cc.length) {
      sec.appendChild(el('h3', {}, 'Afbeeldingen met naamsvermelding (' + cc.length + ')'));
      sec.appendChild(el('p', { class: 'muted' }, 'Deze afbeeldingen gebruik je onder de licentie ', el('a', { href: 'https://creativecommons.org/licenses/by-sa/4.0/deed.nl', target: '_blank', rel: 'noopener' }, 'CC BY-SA 4.0'), '. Bij elke afbeelding staat de auteur; alle gegevens vind je ook hier.'));
      var tb = el('tbody');
      cc.forEach(function (c) {
        tb.appendChild(el('tr', {}, el('td', { 'data-label': 'Bord', class: 'cell-sign' }, App.img(c.code, { alt: 'Verkeersbord ' + c.code.replace(/_/g, ' '), class: 'sign-thumb' }), el('span', { class: 'sign-code' }, c.code.replace(/_/g, ' '))),
          el('td', { 'data-label': 'Auteur' }, c.auteur), el('td', { 'data-label': 'Licentie' }, c.licentie),
          el('td', { 'data-label': 'Bron' }, el('a', { href: c.url, target: '_blank', rel: 'noopener' }, 'Wikimedia Commons'))));
      });
      sec.appendChild(el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' }, el('thead', {}, el('tr', {}, ['Bord', 'Auteur', 'Licentie', 'Bron'].map(function (h) { return el('th', { scope: 'col' }, h); }))), tb)));
    }
    var det = el('details', { class: 'sources' }, el('summary', {}, 'Alle borden in publiek domein (' + pd.length + ')'));
    var q = el('input', { type: 'search', class: 'txt', placeholder: 'Zoek een bordcode…', 'aria-label': 'Zoek een bordcode' });
    var tb2 = el('tbody');
    det.appendChild(q);
    det.appendChild(el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl tbl-compact' }, el('thead', {}, el('tr', {}, ['Code', 'Auteur', 'Licentie', 'Bron'].map(function (h) { return el('th', { scope: 'col' }, h); }))), tb2)));
    function fill() {
      var z = App.norm(q.value).replace(/\s/g, '');
      tb2.innerHTML = '';
      pd.filter(function (c) { return !z || App.norm(c.code).replace(/[\s_]/g, '').indexOf(z.replace(/_/g, '')) >= 0; }).forEach(function (c) {
        tb2.appendChild(el('tr', {}, el('td', {}, c.code.replace(/_/g, ' ')), el('td', {}, c.auteur), el('td', {}, c.licentie), el('td', {}, el('a', { href: c.url, target: '_blank', rel: 'noopener' }, 'Commons'))));
      });
    }
    det.addEventListener('toggle', function () { if (det.open && !tb2.children.length) fill(); });
    q.addEventListener('input', fill);
    sec.appendChild(det);
    root.appendChild(sec);

    // bronnenlijst per thema
    var perThema = {}, used = {};
    C.theorie.forEach(function (b) {
      (b.bronnen || []).forEach(function (id) {
        if (used[id] || !C.bronnen[id]) return; used[id] = 1;
        (perThema[b.thema] = perThema[b.thema] || []).push(id);
      });
    });
    Object.keys(C.bronnen).forEach(function (id) { if (!used[id]) (perThema.__overig = perThema.__overig || []).push(id); });
    var list = el('section', { class: 'card', id: 'bronnenlijst' }, el('h2', {}, 'Bronnenlijst (' + Object.keys(C.bronnen).length + ')'),
      el('p', { class: 'muted' }, 'Per thema. “Officieel” betekent: uitgegeven door een overheid of wettelijke instantie.'));
    Object.keys(perThema).forEach(function (th) {
      list.appendChild(el('h3', {}, th === '__overig' ? 'Overige bronnen' : (C.themaNamen[th] || th)));
      var ul = el('ul', { class: 'src-list' });
      perThema[th].forEach(function (id) {
        var b = C.bronnen[id];
        var li = el('li', {}, el('a', { href: b.url, target: '_blank', rel: 'noopener' }, b.titel), ' ', el('span', { class: 'badge ' + (b.type === 'officieel' ? 'badge-ok' : 'badge-info') }, b.type === 'officieel' ? 'Officieel' : 'Betrouwbaar'),
          el('span', { class: 'muted small' }, ' · ' + b.uitgever + (b.opgehaald ? ' · geraadpleegd ' + b.opgehaald : '') + ' · ' + id));
        if (b.feiten && b.feiten.length) li.appendChild(el('details', { class: 'facts-det' }, el('summary', {}, 'Wat dit bevestigt'), el('ul', {}, b.feiten.map(function (f) { return el('li', { text: f }); }))));
        ul.appendChild(li);
      });
      list.appendChild(ul);
    });
    root.appendChild(list);
  }

  App.ready(function () {
    try {
      if (page === 'home') home();
      else if (page === 'exam') exam();
      else if (page === 'bank') bank();
      else if (page === 'fouten') fouten();
      else if (page === 'spiek') spiek();
      else if (page === 'bronnen') bronnen();
    } catch (e) { console.error(e); throw e; }
  });
})();
