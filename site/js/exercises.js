/* Oefeningtypes. Elk type bouwt een controller:
   { el, answered(), evaluate() -> bool, mark(), showCorrect(), reset(), lock(bool) }              */
(function () {
  'use strict';
  var App = window.App, el = App.el, esc = App.esc;
  var Types = {};

  /** Slepen met pointer-events (werkt met muis en touch). opts: { selector, drop(targetEl), ghost }  */
  function dragBind(node, opts) {
    var pid = null, sx = 0, sy = 0, moved = false, ghost = null, suppress = false, last = null;
    function targetAt(e) {
      if (ghost) ghost.style.display = 'none';
      var t = document.elementFromPoint(e.clientX, e.clientY);
      if (ghost) ghost.style.display = '';
      return t && t.closest ? t.closest(opts.selector) : null;
    }
    function clear() { if (last) { last.classList.remove('drop'); last = null; } }
    function end() {
      pid = null; moved = false; clear();
      if (ghost) { ghost.remove(); ghost = null; }
      node.classList.remove('dragging');
    }
    node.style.touchAction = 'none';
    node.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false;
    });
    node.addEventListener('pointermove', function (e) {
      if (pid == null || e.pointerId !== pid) return;
      if (!moved) {
        if (Math.hypot(e.clientX - sx, e.clientY - sy) < 8) return;
        moved = true;
        try { node.setPointerCapture(pid); } catch (x) { /* oké */ }
        ghost = (opts.ghost || node).cloneNode(true);
        ghost.classList.add('drag-ghost'); ghost.removeAttribute('id');
        document.body.appendChild(ghost); node.classList.add('dragging');
      }
      ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
      var t = targetAt(e);
      if (t !== last) { clear(); if (t) { t.classList.add('drop'); last = t; } }
    });
    node.addEventListener('pointerup', function (e) {
      if (pid == null || e.pointerId !== pid) return;
      var was = moved, t = was ? targetAt(e) : null;
      end();
      if (was) { suppress = true; setTimeout(function () { suppress = false; }, 0); if (t) opts.drop(t); }
    });
    node.addEventListener('pointercancel', end);
    node.addEventListener('click', function (e) { if (suppress) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }
  App.dragBind = dragBind;

  function setRight(n, st) { // st: 'right' | 'wrong' | 'missed' | null
    n.classList.remove('is-right', 'is-wrong', 'is-missed');
    if (st) n.classList.add('is-' + st);
  }
  function numVal(s) {
    var t = String(s == null ? '' : s).trim().replace(/\s+/g, '').replace(',', '.');
    if (t === '' || isNaN(Number(t))) return NaN;
    return Number(t);
  }

  /* ---------- meerkeuze ---------- */
  Types.meerkeuze = function (ex) {
    var multi = !!ex.meerdere || ex.correct.length > 1;
    var name = App.uid('mk');
    var wrap = el('div', { class: 'opts', role: multi ? 'group' : 'radiogroup', 'aria-label': multi ? 'Kies alle juiste antwoorden' : 'Kies één antwoord' });
    var rows = ex.opties.map(function (o, i) {
      var inp = el('input', { type: multi ? 'checkbox' : 'radio', name: name, value: i });
      var lab = el('label', { class: 'opt' }, inp, el('span', { class: 'opt-mark', 'aria-hidden': 'true' }), el('span', { class: 'opt-text', html: App.inline(o) }));
      wrap.appendChild(lab);
      return { inp: inp, lab: lab };
    });
    var hint = multi ? el('p', { class: 'ex-hint' }, 'Meerdere antwoorden kunnen juist zijn.') : null;
    function selected() { return rows.map(function (r, i) { return r.inp.checked ? i : -1; }).filter(function (i) { return i >= 0; }); }
    return {
      el: el('div', {}, hint, wrap),
      answered: function () { return selected().length > 0; },
      evaluate: function () {
        var s = selected();
        return s.length === ex.correct.length && s.every(function (i) { return ex.correct.indexOf(i) >= 0; });
      },
      mark: function () {
        rows.forEach(function (r, i) {
          var isC = ex.correct.indexOf(i) >= 0;
          setRight(r.lab, r.inp.checked ? (isC ? 'right' : 'wrong') : (isC ? 'missed' : null));
        });
      },
      showCorrect: function () { rows.forEach(function (r, i) { r.inp.checked = ex.correct.indexOf(i) >= 0; }); this.mark(); },
      reset: function () { rows.forEach(function (r) { r.inp.checked = false; setRight(r.lab, null); }); },
      lock: function (b) { rows.forEach(function (r) { r.inp.disabled = b; }); }
    };
  };

  /* ---------- invul ---------- */
  Types.invul = function (ex) {
    var inp = el('input', { type: 'text', class: 'txt', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Jouw antwoord' });
    var row = el('div', { class: 'fill-row' }, inp, ex.eenheid ? el('span', { class: 'unit' }, ex.eenheid) : null);
    function val() {
      var v = inp.value.trim();
      if (ex.eenheid) {
        var u = App.norm(ex.eenheid), n = App.norm(v);
        if (n.slice(-u.length) === u) v = v.slice(0, v.length - ex.eenheid.length).trim();
      }
      return v;
    }
    return {
      el: row,
      answered: function () { return inp.value.trim() !== ''; },
      evaluate: function () { return App.matchAny(val(), ex.antwoorden.map(String)); },
      mark: function () { setRight(inp, this.evaluate() ? 'right' : 'wrong'); },
      showCorrect: function () { inp.value = ex.antwoorden[0]; setRight(inp, 'right'); },
      reset: function () { inp.value = ''; setRight(inp, null); },
      lock: function (b) { inp.disabled = b; }
    };
  };

  /* ---------- cloze ---------- */
  Types.cloze = function (ex) {
    var parts = ex.tekst.split(/\{\{(\d+)\}\}/);
    var p = el('p', { class: 'cloze' });
    var gaps = [];
    parts.forEach(function (s, i) {
      if (i % 2 === 0) { if (s) p.appendChild(document.createTextNode(s)); return; }
      var g = ex.gaten[Number(s) - 1];
      var node, getVal;
      var label = 'Gat ' + s;
      if (g.opties && g.opties.length) {
        node = el('select', { class: 'sel', 'aria-label': label }, el('option', { value: '' }, 'kies…'));
        g.opties.forEach(function (o, k) { node.appendChild(el('option', { value: k }, o)); });
        getVal = function () { return node.value === '' ? '' : g.opties[Number(node.value)]; };
      } else {
        var longest = Math.max.apply(null, (g.antwoorden || [g.correct]).map(function (a) { return String(a).length; }));
        node = el('input', { type: 'text', class: 'txt gap', size: Math.max(4, longest + 1), autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': label });
        getVal = function () { return node.value; };
      }
      var answers = g.antwoorden ? g.antwoorden.map(String) : [typeof g.correct === 'number' && g.opties ? g.opties[g.correct] : String(g.correct)];
      gaps.push({ node: node, get: getVal, answers: answers, g: g });
      p.appendChild(node);
    });
    return {
      el: p,
      answered: function () { return gaps.every(function (x) { return x.get().trim() !== ''; }); },
      evaluate: function () { return gaps.every(function (x) { return App.matchAny(x.get(), x.answers); }); },
      mark: function () { gaps.forEach(function (x) { setRight(x.node, App.matchAny(x.get(), x.answers) ? 'right' : 'wrong'); }); },
      showCorrect: function () {
        gaps.forEach(function (x) {
          if (x.node.tagName === 'SELECT') {
            for (var k = 0; k < x.g.opties.length; k++) if (App.matchAny(x.g.opties[k], x.answers)) { x.node.value = k; break; }
          } else x.node.value = x.answers[0];
          setRight(x.node, 'right');
        });
      },
      reset: function () { gaps.forEach(function (x) { x.node.value = ''; setRight(x.node, null); }); },
      lock: function (b) { gaps.forEach(function (x) { x.node.disabled = b; }); }
    };
  };

  /* ---------- koppel (klik-klik + slepen) ---------- */
  Types.koppel = function (ex) {
    var n = ex.paren.length;
    var order = App.shuffle(ex.paren.map(function (_, i) { return i; }));
    var assign = new Array(n).fill(null); // rij -> index van rechts-item
    var sel = null; // {kind:'row'|'chip', i}
    var locked = false, shown = null; // shown: array van 'right'/'wrong'
    var rowsBox = el('div', { class: 'match-rows' });
    var pool = el('div', { class: 'match-pool', 'aria-label': 'Nog te koppelen' });
    var wrap = el('div', { class: 'match' }, el('p', { class: 'ex-hint' }, 'Klik een item links aan en dan het bijbehorende item rechts. Of sleep het naar de juiste plaats. Klik op een gekoppeld item om het los te maken.'), rowsBox, pool);
    var live = el('span', { class: 'sr', 'aria-live': 'polite' });
    wrap.appendChild(live);

    function doAssign(row, chip) {
      for (var k = 0; k < n; k++) if (assign[k] === chip) assign[k] = null;
      assign[row] = chip; sel = null; shown = null; render();
      live.textContent = 'Gekoppeld: ' + ex.paren[row].links + ' met ' + ex.paren[chip].rechts;
    }
    function render() {
      rowsBox.innerHTML = ''; pool.innerHTML = '';
      ex.paren.forEach(function (p, i) {
        var leftSel = sel && sel.kind === 'row' && sel.i === i;
        var left = el('div', { class: 'match-left' });
        if (p.linksAfb) { var im = App.img(p.linksAfb, { alt: '' }); if (im) left.appendChild(el('span', { class: 'match-img' }, im)); }
        left.appendChild(el('span', { text: p.links }));
        var slotCls = 'match-slot' + (assign[i] != null ? ' filled' : '') + (leftSel ? ' selected' : '');
        var slot = el('button', {
          type: 'button', class: slotCls, disabled: locked,
          'aria-label': assign[i] != null ? 'Los maken: ' + ex.paren[assign[i]].rechts : 'Kies hier het bijbehorende item bij ' + p.links
        }, assign[i] != null ? ex.paren[assign[i]].rechts : '…');
        if (shown) setRight(slot, shown[i]);
        slot.addEventListener('click', function () {
          if (locked) return;
          if (sel && sel.kind === 'chip') return doAssign(i, sel.i);
          if (assign[i] != null) { assign[i] = null; sel = null; shown = null; return render(); }
          sel = leftSel ? null : { kind: 'row', i: i }; render();
          var again = rowsBox.querySelectorAll('.match-slot')[i]; if (again) again.focus();
        });
        slot.setAttribute('data-row', String(i));
        rowsBox.appendChild(el('div', { class: 'match-row' }, left, el('span', { class: 'match-arrow', 'aria-hidden': 'true', html: App.icon('right', 16) }), slot));
      });
      order.forEach(function (ci) {
        if (assign.indexOf(ci) >= 0) return;
        var isSel = sel && sel.kind === 'chip' && sel.i === ci;
        var chip = el('button', { type: 'button', class: 'chip-item' + (isSel ? ' selected' : ''), disabled: locked }, ex.paren[ci].rechts);
        chip.addEventListener('click', function () {
          if (locked) return;
          if (sel && sel.kind === 'row') return doAssign(sel.i, ci);
          sel = isSel ? null : { kind: 'chip', i: ci }; render();
          var chips = pool.querySelectorAll('.chip-item');
          for (var q = 0; q < chips.length; q++) if (chips[q].textContent === ex.paren[ci].rechts) { chips[q].focus(); break; }
        });
        if (!locked) dragBind(chip, { selector: '.match-slot', drop: function (t) { if (!locked) doAssign(Number(t.getAttribute('data-row')), ci); } });
        pool.appendChild(chip);
      });
      if (!pool.children.length) pool.appendChild(el('span', { class: 'muted small' }, 'Alles gekoppeld.'));
    }
    render();
    function isRight(i) { return assign[i] != null && ex.paren[assign[i]].rechts === ex.paren[i].rechts; }
    return {
      el: wrap,
      answered: function () { return assign.every(function (a) { return a != null; }); },
      evaluate: function () { return ex.paren.every(function (_, i) { return isRight(i); }); },
      mark: function () { shown = ex.paren.map(function (_, i) { return isRight(i) ? 'right' : 'wrong'; }); render(); },
      showCorrect: function () {
        ex.paren.forEach(function (p, i) { assign[i] = i; });
        shown = ex.paren.map(function () { return 'right'; }); render();
      },
      reset: function () { assign = new Array(n).fill(null); sel = null; shown = null; locked = false; order = App.shuffle(order); render(); },
      lock: function (b) { locked = b; render(); }
    };
  };

  /* ---------- volgorde ---------- */
  Types.volgorde = function (ex) {
    var n = ex.items.length;
    var idx = ex.items.map(function (_, i) { return i; });
    function shuffled() {
      var s, tries = 0;
      do { s = App.shuffle(idx); tries++; } while (tries < 20 && s.every(function (v, i) { return ex.items[v] === ex.items[i]; }));
      return s;
    }
    var order = shuffled();
    var locked = false, shown = null;
    var list = el('ol', { class: 'seq' });
    var live = el('span', { class: 'sr', 'aria-live': 'polite' });
    var wrap = el('div', {}, el('p', { class: 'ex-hint' }, 'Zet de items in de juiste volgorde: sleep ze, of gebruik de pijltjes.'), list, live);
    function move(from, to, focusBtn) {
      if (to < 0 || to >= n || locked) return;
      var v = order.splice(from, 1)[0]; order.splice(to, 0, v); shown = null; render();
      live.textContent = '“' + ex.items[v] + '” staat nu op plaats ' + (to + 1) + ' van ' + n;
      var btn = list.children[to] && list.children[to].querySelector('.' + focusBtn);
      if (btn && !btn.disabled) btn.focus(); else { var alt = list.children[to].querySelector('button:not(:disabled)'); if (alt) alt.focus(); }
    }
    function render() {
      list.innerHTML = '';
      order.forEach(function (v, pos) {
        var li = el('li', { class: 'seq-item', data: { pos: pos } });
        if (shown) setRight(li, shown[pos]);
        li.appendChild(el('span', { class: 'seq-grip', 'aria-hidden': 'true', html: App.icon('grip', 18) }));
        li.appendChild(el('span', { class: 'seq-n', 'aria-hidden': 'true' }, String(pos + 1)));
        li.appendChild(el('span', { class: 'seq-text', html: App.inline(ex.items[v]) }));
        li.appendChild(el('span', { class: 'seq-btns' },
          el('button', { type: 'button', class: 'iconbtn up', disabled: locked || pos === 0, 'aria-label': 'Omhoog: ' + ex.items[v], html: App.icon('up', 18), on: { click: function () { move(pos, pos - 1, 'up'); } } }),
          el('button', { type: 'button', class: 'iconbtn down', disabled: locked || pos === n - 1, 'aria-label': 'Omlaag: ' + ex.items[v], html: App.icon('down', 18), on: { click: function () { move(pos, pos + 1, 'down'); } } })));
        if (!locked) dragBind(li.querySelector('.seq-grip'), { selector: '.seq-item', ghost: li, drop: function (t) { move(pos, Number(t.getAttribute('data-pos')), 'seq-none'); } });
        list.appendChild(li);
      });
    }
    render();
    function ok(pos) { return ex.items[order[pos]] === ex.items[pos]; }
    return {
      el: wrap,
      answered: function () { return true; },
      evaluate: function () { return order.every(function (_, p) { return ok(p); }); },
      mark: function () { shown = order.map(function (_, p) { return ok(p) ? 'right' : 'wrong'; }); render(); },
      showCorrect: function () { order = idx.slice(); shown = order.map(function () { return 'right'; }); render(); },
      reset: function () { order = shuffled(); shown = null; locked = false; render(); },
      lock: function (b) { locked = b; render(); }
    };
  };

  /* ---------- waar of onwaar met motivatie ---------- */
  Types.waaronwaar = function (ex) {
    var name1 = App.uid('wo'), name2 = App.uid('wm');
    var jn = [['true', 'Juist'], ['false', 'Onjuist']].map(function (x) {
      var inp = el('input', { type: 'radio', name: name1, value: x[0] });
      return { inp: inp, v: x[0] === 'true', lab: el('label', { class: 'opt opt-short' }, inp, el('span', { class: 'opt-mark', 'aria-hidden': 'true' }), el('span', { class: 'opt-text' }, x[1])) };
    });
    var mots = App.shuffle([{ t: ex.motivatie, ok: true }].concat(ex.foutemotivaties.map(function (t) { return { t: t, ok: false }; }))).map(function (m) {
      var inp = el('input', { type: 'radio', name: name2 });
      return { inp: inp, ok: m.ok, lab: el('label', { class: 'opt' }, inp, el('span', { class: 'opt-mark', 'aria-hidden': 'true' }), el('span', { class: 'opt-text', html: App.inline(m.t) })) };
    });
    var wrap = el('div', {},
      el('blockquote', { class: 'statement', html: App.inline(ex.stelling) }),
      el('p', { class: 'ex-sub' }, '1. Is de stelling juist of onjuist?'),
      el('div', { class: 'opts opts-row', role: 'radiogroup', 'aria-label': 'Juist of onjuist' }, jn.map(function (x) { return x.lab; })),
      el('p', { class: 'ex-sub' }, '2. Welke verklaring past erbij?'),
      el('div', { class: 'opts', role: 'radiogroup', 'aria-label': 'Verklaring' }, mots.map(function (x) { return x.lab; })));
    function pick(a) { for (var i = 0; i < a.length; i++) if (a[i].inp.checked) return a[i]; return null; }
    return {
      el: wrap,
      answered: function () { return !!pick(jn) && !!pick(mots); },
      evaluate: function () { var a = pick(jn), b = pick(mots); return !!a && !!b && a.v === ex.juist && b.ok; },
      mark: function () {
        jn.forEach(function (x) { setRight(x.lab, x.inp.checked ? (x.v === ex.juist ? 'right' : 'wrong') : (x.v === ex.juist ? 'missed' : null)); });
        mots.forEach(function (x) { setRight(x.lab, x.inp.checked ? (x.ok ? 'right' : 'wrong') : (x.ok ? 'missed' : null)); });
      },
      showCorrect: function () { jn.forEach(function (x) { x.inp.checked = x.v === ex.juist; }); mots.forEach(function (x) { x.inp.checked = x.ok; }); this.mark(); },
      reset: function () { jn.concat(mots).forEach(function (x) { x.inp.checked = false; setRight(x.lab, null); }); },
      lock: function (b) { jn.concat(mots).forEach(function (x) { x.inp.disabled = b; }); }
    };
  };

  /* ---------- situatie (voertuigen met nummer) ---------- */
  Types.situatie = function (ex) {
    var vs = ex.voertuigen;
    var volgorde = ex.modus === 'volgorde';
    var seq = []; // nummers in gekozen volgorde (volgorde) of [nr] (klik)
    var locked = false, shown = null;
    var stage = el('div', { class: 'stage' });
    var img = App.img(ex.afbeelding, { alt: 'Kruispunt met genummerde voertuigen' });
    if (img) stage.appendChild(img);
    var markers = {};
    vs.forEach(function (v) {
      if (v.x == null || v.y == null) return;
      var m = el('button', { type: 'button', class: 'marker', style: 'left:' + v.x + '%;top:' + v.y + '%', 'aria-label': 'Voertuig ' + v.nr + ': ' + v.label }, String(v.nr));
      m.addEventListener('click', function () { pick(v.nr); });
      markers[v.nr] = m; stage.appendChild(m);
    });
    var chips = el('div', { class: 'veh-list', role: 'group', 'aria-label': 'Voertuigen' });
    var slots = el('ol', { class: 'veh-slots', 'aria-label': 'Jouw volgorde' });
    var hint = el('p', { class: 'ex-hint' }, volgorde ? 'Klik de voertuigen aan in de volgorde waarin ze mogen rijden. Klik op een gekozen voertuig om het weg te halen.' : 'Klik het juiste voertuig aan.');
    function pick(nr) {
      if (locked) return;
      var at = seq.indexOf(nr);
      if (volgorde) { if (at >= 0) seq.splice(at, 1); else seq.push(nr); }
      else seq = at >= 0 ? [] : [nr];
      shown = null; render();
    }
    function render() {
      chips.innerHTML = ''; slots.innerHTML = '';
      vs.forEach(function (v) {
        var at = seq.indexOf(v.nr);
        var b = el('button', { type: 'button', class: 'veh' + (at >= 0 ? ' chosen' : ''), 'aria-pressed': at >= 0 ? 'true' : 'false', disabled: locked },
          el('span', { class: 'veh-nr' }, String(v.nr)), el('span', { class: 'veh-label' }, v.label), volgorde && at >= 0 ? el('span', { class: 'veh-order' }, (at + 1) + 'e') : null);
        if (shown && at >= 0) setRight(b, shown[v.nr]);
        b.addEventListener('click', function () { pick(v.nr); b.focus && 0; });
        chips.appendChild(b);
        if (markers[v.nr]) {
          markers[v.nr].classList.toggle('chosen', at >= 0);
          markers[v.nr].textContent = volgorde && at >= 0 ? String(at + 1) : String(v.nr);
          markers[v.nr].disabled = locked;
          if (shown && at >= 0) setRight(markers[v.nr], shown[v.nr]); else setRight(markers[v.nr], null);
        }
      });
      if (volgorde) {
        for (var i = 0; i < vs.length; i++) {
          var nr = seq[i];
          var v = vs.filter(function (x) { return x.nr === nr; })[0];
          slots.appendChild(el('li', { class: 'veh-slot' + (v ? ' filled' : '') }, v ? v.nr + ' – ' + v.label : '…'));
        }
      }
    }
    render();
    function correctSeq() { return volgorde ? ex.correct.map(Number) : [Number(ex.correct)]; }
    function isOk() { var c = correctSeq(); return seq.length === c.length && seq.every(function (x, i) { return x === c[i]; }); }
    return {
      el: el('div', {}, hint, stage, chips, volgorde ? slots : null),
      answered: function () { return volgorde ? seq.length === vs.length : seq.length === 1; },
      evaluate: isOk,
      mark: function () {
        var c = correctSeq(); shown = {};
        seq.forEach(function (nr, i) { shown[nr] = c[i] === nr ? 'right' : 'wrong'; });
        render();
      },
      showCorrect: function () { seq = correctSeq().slice(); shown = {}; seq.forEach(function (nr) { shown[nr] = 'right'; }); render(); },
      reset: function () { seq = []; shown = null; locked = false; render(); },
      lock: function (b) { locked = b; render(); }
    };
  };

  /* ---------- hotspot ---------- */
  Types.hotspot = function (ex) {
    var stage = el('div', { class: 'stage hotspot' });
    var img = App.img(ex.afbeelding, { alt: ex.alt || 'Afbeelding om op te klikken' });
    if (img) stage.appendChild(img); else stage.appendChild(el('p', { class: 'muted' }, 'Afbeelding niet beschikbaar.'));
    var picked = {}, locked = false;
    var zones = ex.zones.map(function (z, i) {
      var b = el('button', {
        type: 'button', class: 'zone', 'aria-pressed': 'false',
        'aria-label': z.label || ('Zone ' + (i + 1)),
        style: 'left:' + z.x + '%;top:' + z.y + '%;width:' + z.w + '%;height:' + z.h + '%'
      });
      b.addEventListener('click', function () {
        if (locked) return;
        picked[i] = !picked[i]; b.setAttribute('aria-pressed', picked[i] ? 'true' : 'false'); b.classList.toggle('picked', !!picked[i]);
        setRight(b, null);
      });
      stage.appendChild(b);
      return b;
    });
    stage.addEventListener('click', function (e) { // visuele klik-feedback
      if (e.target.closest('.zone') || locked) return;
      var r = stage.getBoundingClientRect();
      var dot = el('span', { class: 'ping', style: 'left:' + (e.clientX - r.left) + 'px;top:' + (e.clientY - r.top) + 'px' });
      stage.appendChild(dot); setTimeout(function () { dot.remove(); }, 700);
    });
    var multi = ex.zones.filter(function (z) { return z.correct; }).length > 1;
    var hint = el('p', { class: 'ex-hint' }, multi ? 'Klik op alle juiste plaatsen in de afbeelding (opnieuw klikken haalt weg).' : 'Klik op de juiste plaats in de afbeelding (met Tab bereik je de zones ook met het toetsenbord).');
    return {
      el: el('div', {}, hint, stage),
      answered: function () { return Object.keys(picked).some(function (k) { return picked[k]; }); },
      evaluate: function () { return ex.zones.every(function (z, i) { return !!picked[i] === !!z.correct; }); },
      mark: function () {
        zones.forEach(function (b, i) { var z = ex.zones[i]; setRight(b, picked[i] ? (z.correct ? 'right' : 'wrong') : (z.correct ? 'missed' : null)); });
      },
      showCorrect: function () { zones.forEach(function (b, i) { picked[i] = !!ex.zones[i].correct; b.classList.toggle('picked', picked[i]); b.setAttribute('aria-pressed', picked[i] ? 'true' : 'false'); }); this.mark(); },
      reset: function () { picked = {}; locked = false; zones.forEach(function (b) { b.classList.remove('picked'); b.setAttribute('aria-pressed', 'false'); b.disabled = false; setRight(b, null); }); },
      lock: function (b) { locked = b; zones.forEach(function (z) { z.disabled = b; }); }
    };
  };

  /* ---------- tabel ---------- */
  Types.tabel = function (ex) {
    var nCells = ex.rijen[0].cellen.length;
    var labelHeader = ex.kolommen.length === nCells + 1 ? ex.kolommen[0] : '';
    var heads = ex.kolommen.length === nCells + 1 ? ex.kolommen.slice(1) : ex.kolommen;
    var table = el('table', { class: 'tbl tbl-ex' });
    table.appendChild(el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, labelHeader), heads.map(function (h) { return el('th', { scope: 'col' }, h); }))));
    var cells = [];
    var tb = el('tbody');
    ex.rijen.forEach(function (r, ri) {
      var tr = el('tr', {}, el('th', { scope: 'row' }, r.label));
      r.cellen.forEach(function (c, ci) {
        var ans = (Array.isArray(c.correct) ? c.correct : [c.correct]).map(String);
        var label = r.label + ', ' + (heads[ci] || ('kolom ' + (ci + 1)));
        var node, get, kind = 'text';
        if (typeof c.correct === 'boolean') {
          kind = 'check';
          node = el('input', { type: 'checkbox', 'aria-label': label });
          get = function () { return node.checked ? 'true' : 'false'; };
        } else if (c.opties && c.opties.length) {
          node = el('select', { class: 'sel', 'aria-label': label }, el('option', { value: '' }, 'kies…'), c.opties.map(function (o) { return el('option', { value: o }, o); }));
          get = function () { return node.value; };
        } else {
          node = el('input', { type: 'text', class: 'txt', autocomplete: 'off', spellcheck: 'false', 'aria-label': label });
          get = function () { return node.value; };
        }
        var td = el('td', { 'data-label': heads[ci] || '' }, node);
        tr.appendChild(td);
        cells.push({ node: node, td: td, get: get, ans: ans, kind: kind });
      });
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    function ok(c) { return c.kind === 'check' ? c.get() === c.ans[0] : App.matchAny(c.get(), c.ans); }
    return {
      el: el('div', { class: 'tbl-wrap' }, table),
      answered: function () { return cells.some(function (c) { return c.kind === 'check' || c.get().trim() !== ''; }) && cells.every(function (c) { return c.kind === 'check' || c.get().trim() !== ''; }); },
      evaluate: function () { return cells.every(ok); },
      mark: function () { cells.forEach(function (c) { setRight(c.td, ok(c) ? 'right' : 'wrong'); }); },
      showCorrect: function () {
        cells.forEach(function (c) {
          if (c.kind === 'check') c.node.checked = c.ans[0] === 'true'; else c.node.value = c.ans[0];
          setRight(c.td, 'right');
        });
      },
      reset: function () { cells.forEach(function (c) { if (c.kind === 'check') c.node.checked = false; else c.node.value = ''; setRight(c.td, null); }); },
      lock: function (b) { cells.forEach(function (c) { c.node.disabled = b; }); }
    };
  };

  /* ---------- bord ---------- */
  var CATS = ['A', 'B', 'C', 'D', 'E', 'F'];
  Types.bord = function (ex) {
    var info = App.imgInfo(ex.afbeelding);
    var stage = el('div', { class: 'bord-stage' });
    var img = App.img(ex.afbeelding, { alt: 'Verkeersbord' });
    if (img) stage.appendChild(img); else stage.appendChild(el('p', { class: 'muted' }, 'Afbeelding niet beschikbaar.'));
    var body, api;
    if (ex.modus === 'categorie') {
      var name = App.uid('bc');
      var radios = CATS.map(function (c) {
        var inp = el('input', { type: 'radio', name: name, value: c });
        return { c: c, inp: inp, lab: el('label', { class: 'cat-opt cat-' + c }, inp, el('span', { class: 'cat-dot', 'aria-hidden': 'true' }), el('span', { class: 'cat-name' }, App.CAT_NAMEN[c])) };
      });
      body = el('div', { class: 'cat-grid', role: 'radiogroup', 'aria-label': 'Categorie' }, radios.map(function (r) { return r.lab; }));
      var get = function () { for (var i = 0; i < radios.length; i++) if (radios[i].inp.checked) return radios[i].c; return ''; };
      api = {
        answered: function () { return get() !== ''; },
        evaluate: function () { return get() === ex.categorie; },
        mark: function () { radios.forEach(function (r) { setRight(r.lab, r.inp.checked ? (r.c === ex.categorie ? 'right' : 'wrong') : (r.c === ex.categorie ? 'missed' : null)); }); },
        showCorrect: function () { radios.forEach(function (r) { r.inp.checked = r.c === ex.categorie; }); api.mark(); },
        reset: function () { radios.forEach(function (r) { r.inp.checked = false; setRight(r.lab, null); }); },
        lock: function (b) { radios.forEach(function (r) { r.inp.disabled = b; }); }
      };
    } else if (ex.modus === 'naam' && ex.opties && ex.opties.length) {
      var nm = App.uid('bn');
      var rows = ex.opties.map(function (o) {
        var inp = el('input', { type: 'radio', name: nm });
        var okk = App.matchAny(o, ex.antwoorden.map(String));
        return { inp: inp, ok: okk, lab: el('label', { class: 'opt' }, inp, el('span', { class: 'opt-mark', 'aria-hidden': 'true' }), el('span', { class: 'opt-text', text: o })) };
      });
      body = el('div', { class: 'opts', role: 'radiogroup', 'aria-label': 'Wat betekent dit bord?' }, rows.map(function (r) { return r.lab; }));
      api = {
        answered: function () { return rows.some(function (r) { return r.inp.checked; }); },
        evaluate: function () { return rows.some(function (r) { return r.inp.checked && r.ok; }); },
        mark: function () { rows.forEach(function (r) { setRight(r.lab, r.inp.checked ? (r.ok ? 'right' : 'wrong') : (r.ok ? 'missed' : null)); }); },
        showCorrect: function () { rows.forEach(function (r) { r.inp.checked = r.ok; }); api.mark(); },
        reset: function () { rows.forEach(function (r) { r.inp.checked = false; setRight(r.lab, null); }); },
        lock: function (b) { rows.forEach(function (r) { r.inp.disabled = b; }); }
      };
    } else {
      var inp = el('input', { type: 'text', class: 'txt', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Betekenis van het bord', placeholder: 'Wat betekent dit bord?' });
      body = el('div', { class: 'fill-row' }, inp);
      api = {
        answered: function () { return inp.value.trim() !== ''; },
        evaluate: function () { return App.matchAny(inp.value, ex.antwoorden.map(String)); },
        mark: function () { setRight(inp, api.evaluate() ? 'right' : 'wrong'); },
        showCorrect: function () { inp.value = ex.antwoorden[0]; setRight(inp, 'right'); },
        reset: function () { inp.value = ''; setRight(inp, null); },
        lock: function (b) { inp.disabled = b; }
      };
    }
    void info;
    api.el = el('div', { class: 'bord-ex' }, stage, body);
    return api;
  };

  /* ---------- reken ---------- */
  Types.reken = function (ex) {
    var inp = el('input', { type: 'text', inputmode: 'decimal', class: 'txt num', autocomplete: 'off', 'aria-label': 'Jouw antwoord (getal)' });
    var wrap = el('div', {}, ex.gegeven ? el('p', { class: 'given', html: App.inline(ex.gegeven) }) : null, el('div', { class: 'fill-row' }, inp, ex.eenheid ? el('span', { class: 'unit' }, ex.eenheid) : null));
    function ok() { var v = numVal(inp.value); return !isNaN(v) && Math.abs(v - ex.antwoord) <= (ex.tolerantie || 0) + 1e-9; }
    return {
      el: wrap,
      answered: function () { return !isNaN(numVal(inp.value)); },
      evaluate: ok,
      mark: function () { setRight(inp, ok() ? 'right' : 'wrong'); },
      showCorrect: function () { inp.value = String(ex.antwoord).replace('.', ','); setRight(inp, 'right'); },
      reset: function () { inp.value = ''; setRight(inp, null); },
      lock: function (b) { inp.disabled = b; }
    };
  };

  /* ---------- samenstellen ---------- */
  var TYPE_LABEL = {
    meerkeuze: 'Meerkeuze', invul: 'Invullen', cloze: 'Aanvullen', koppel: 'Koppelen', volgorde: 'Volgorde',
    waaronwaar: 'Juist of onjuist', situatie: 'Situatie', hotspot: 'Klik in de afbeelding', tabel: 'Tabel', bord: 'Verkeersbord', reken: 'Rekenen'
  };
  App.TYPE_LABEL = TYPE_LABEL;
  var SELF_IMG = { hotspot: 1, situatie: 1, bord: 1 };

  function build(ex) {
    var ctrl = Types[ex.type](ex);
    return ctrl;
  }
  function head(ex, nr) {
    var d = ex.moeilijkheid || 1;
    return el('header', { class: 'ex-head' },
      nr != null ? el('span', { class: 'ex-num', 'aria-hidden': 'true' }, String(nr)) : null,
      el('span', { class: 'ex-type' }, TYPE_LABEL[ex.type] || ex.type),
      el('span', { class: 'ex-diff', title: 'Moeilijkheid ' + d + ' van 3' }, el('span', { class: 'sr' }, 'Moeilijkheid ' + d + ' van 3'), [1, 2, 3].map(function (i) { return el('i', { class: i <= d ? 'on' : '', 'aria-hidden': 'true' }); })),
      ex.gewicht === 'zwaar' ? el('span', { class: 'ex-heavy', title: 'Zware fout op het examen: -5 punten' }, 'Zware fout') : null);
  }
  function question(ex) {
    var q = el('div', { class: 'ex-q' });
    if (ex.vraag) q.appendChild(el('p', { class: 'ex-vraag', html: App.inline(ex.vraag) }));
    if (ex.afbeelding && !SELF_IMG[ex.type]) {
      var f = App.figure(ex.afbeelding, { caption: false, alt: 'Afbeelding bij de vraag', class: 'fig-ex' });
      if (f) q.appendChild(f);
    }
    return q;
  }

  /** Oefenmodus: Nakijken, feedback, opnieuw, toon antwoord, toon theorie. */
  App.mountExercise = function (ex, container, opts) {
    opts = opts || {};
    var ctrl = build(ex);
    var fb = el('div', { class: 'ex-feedback', role: 'status', 'aria-live': 'polite' });
    var bCheck = el('button', { type: 'button', class: 'btn btn-primary' }, 'Nakijken');
    var bShow = el('button', { type: 'button', class: 'btn', hidden: true }, 'Toon het juiste antwoord');
    var bRetry = el('button', { type: 'button', class: 'btn', hidden: true, html: App.icon('retry', 16) + ' Probeer opnieuw' });
    var href = ex.theorieblok ? App.theorieHref(ex.theorieblok) : null;
    var bTheory = href && !opts.mini ? el('a', { class: 'btn btn-ghost', href: href, html: App.icon('theory', 16) + ' Toon theorie' }) : null;
    var art = el('article', { class: 'ex ex-' + ex.type + (opts.mini ? ' ex-mini' : ''), 'data-id': ex.id, 'aria-label': 'Oefening ' + (opts.nr || '') });
    var done = false;

    function feedback(kind, title, extra) {
      fb.className = 'ex-feedback fb-' + kind;
      fb.innerHTML = '';
      fb.appendChild(el('strong', { class: 'fb-title' }, title));
      if (extra) fb.appendChild(el('p', { html: App.inline(extra) }));
    }
    function check() {
      if (!ctrl.answered()) { feedback('info', 'Beantwoord eerst de vraag.'); return; }
      var ok = ctrl.evaluate();
      ctrl.mark(); ctrl.lock(true);
      if (!opts.review) App.recordResult(ex.id, ok);
      done = true;
      art.classList.toggle('is-correct', ok); art.classList.toggle('is-incorrect', !ok);
      feedback(ok ? 'ok' : 'bad', ok ? 'Juist!' : 'Niet juist.', ex.uitleg);
      bCheck.hidden = true; bRetry.hidden = ok; bShow.hidden = ok;
      if (ok) bRetry.hidden = true;
      if (opts.onResult) opts.onResult(ex, ok);
    }
    bCheck.addEventListener('click', check);
    bRetry.addEventListener('click', function () {
      ctrl.reset(); ctrl.lock(false); done = false;
      art.classList.remove('is-correct', 'is-incorrect'); fb.className = 'ex-feedback'; fb.innerHTML = '';
      bCheck.hidden = false; bRetry.hidden = true; bShow.hidden = true;
      var first = art.querySelector('input,select,button.veh,button.zone,.chip-item,.match-slot'); if (first) first.focus();
    });
    bShow.addEventListener('click', function () {
      ctrl.reset(); ctrl.lock(false); ctrl.showCorrect(); ctrl.lock(true);
      art.classList.remove('is-incorrect'); art.classList.add('is-shown');
      feedback('info', 'Dit is het juiste antwoord.', ex.uitleg);
      bShow.hidden = true; bRetry.hidden = false;
    });
    art.appendChild(head(ex, opts.nr));
    art.appendChild(question(ex));
    art.appendChild(el('div', { class: 'ex-body' }, ctrl.el));
    art.appendChild(el('div', { class: 'ex-actions' }, bCheck, bShow, bRetry, bTheory));
    art.appendChild(fb);
    container.appendChild(art);
    if (opts.review) { // direct het juiste antwoord tonen
      ctrl.showCorrect(); ctrl.lock(true); bCheck.hidden = true; art.classList.add('is-shown');
      feedback('info', 'Juiste antwoord', ex.uitleg);
    }
    return { ctrl: ctrl, el: art, isDone: function () { return done; } };
  };

  /** Toetsmodus: geen feedback, geen knoppen. */
  App.mountForTest = function (ex, container, nr) {
    var ctrl = build(ex);
    var art = el('article', { class: 'ex ex-test ex-' + ex.type, 'data-id': ex.id });
    art.appendChild(head(ex, nr));
    art.appendChild(question(ex));
    art.appendChild(el('div', { class: 'ex-body' }, ctrl.el));
    container.appendChild(art);
    return { ctrl: ctrl, el: art };
  };
})();
