/* Toets-runner (eindtest, proefexamen, herhaling) + lijst met oefeningen. */
(function () {
  'use strict';
  var App = window.App, el = App.el;

  /** Lijst oefeningen in oefenmodus, in porties. */
  App.practiceList = function (container, exs, opts) {
    opts = opts || {};
    var size = opts.pageSize || 10, shown = 0;
    container.innerHTML = '';
    var list = el('div', { class: 'ex-list' });
    var more = el('button', { type: 'button', class: 'btn more-btn' }, 'Toon meer oefeningen');
    var count = el('p', { class: 'muted small list-count' });
    function next() {
      var end = Math.min(exs.length, shown + size);
      for (var i = shown; i < end; i++) App.mountExercise(exs[i], list, { nr: i + 1, onResult: opts.onResult });
      shown = end;
      count.textContent = shown + ' van ' + exs.length + ' getoond';
      more.hidden = shown >= exs.length;
    }
    more.addEventListener('click', next);
    container.appendChild(count);
    container.appendChild(list);
    container.appendChild(el('div', { class: 'more-wrap' }, more));
    next();
  };

  /** Reeks oefeningen na elkaar (vraag 1 van 20), met feedback per vraag en een score aan het einde. */
  App.runSeries = function (container, exs) {
    var i = 0, score = 0;
    function run() {
      container.innerHTML = ''; i = 0; score = 0; next();
    }
    function next() {
      container.innerHTML = '';
      if (i >= exs.length) return end();
      var head = el('div', { class: 'series-head' }, el('p', { class: 'series-count' }, 'Vraag ', el('strong', {}, String(i + 1)), ' van ' + exs.length), el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': exs.length, 'aria-valuenow': i, 'aria-label': 'Voortgang van de reeks' }, el('span', { class: 'progress-fill', style: 'transform:scaleX(' + (i / exs.length).toFixed(3) + ');width:100%;transform-origin:left' })), el('p', { class: 'series-score' }, 'Score: ' + score));
      container.appendChild(head);
      var holder = el('div', { class: 'series-q' }); container.appendChild(holder);
      var nextBtn = el('button', { type: 'button', class: 'btn btn-primary', hidden: true }, i + 1 < exs.length ? 'Volgende vraag' : 'Bekijk je score');
      var m = App.mountExercise(exs[i], holder, { plain: true, nolink: true, onResult: function (ex, ok) { if (ok) score++; nextBtn.hidden = false; head.querySelector('.series-score').textContent = 'Score: ' + score; nextBtn.focus(); } });
      var show = holder.querySelector('.btn:not([hidden])');
      holder.appendChild(el('div', { class: 'series-next' }, nextBtn));
      nextBtn.addEventListener('click', function () { i++; next(); container.scrollIntoView({ block: 'start', behavior: App.reducedMotion() ? 'auto' : 'smooth' }); });
      // ook na 'toon het juiste antwoord' mag je verder
      holder.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.btn') && /juiste antwoord/.test(e.target.textContent)) nextBtn.hidden = false; });
      void m; void show;
    }
    function end() {
      container.innerHTML = '';
      var pct = Math.round(100 * score / exs.length);
      container.appendChild(el('div', { class: 'series-end' }, el('p', { class: 'series-big' }, score + ' van ' + exs.length), el('p', {}, pct >= 80 ? 'Sterk gedaan.' : pct >= 60 ? 'Goed op weg, nog even oefenen.' : 'Herhaal de borden en probeer opnieuw.'),
        el('button', { type: 'button', class: 'btn btn-primary', on: { click: run } }, 'Opnieuw proberen')));
    }
    run();
  };

  /** Resultaatscherm voor eindtest / proefexamen. */
  App.renderResults = function (container, rows, cfg, elapsed) {
    var total = rows.length;
    var juist = rows.filter(function (r) { return r.correct; }).length;
    var leeg = rows.filter(function (r) { return !r.answered; }).length;
    var fout = total - juist - leeg;
    var zwaar = rows.filter(function (r) { return !r.correct && r.answered && r.ex.gewicht === 'zwaar'; }).length;
    var pts = null, geslaagd = null;
    if (cfg.scoring === 'exam') {
      pts = cfg.start;
      rows.forEach(function (r) { if (!r.correct) pts -= (r.answered && r.ex.gewicht === 'zwaar') ? 5 : 1; });
      geslaagd = pts >= cfg.passMark;
    }
    var pct = Math.round(100 * juist / Math.max(1, total));
    container.innerHTML = '';
    var verdict = cfg.scoring === 'exam'
      ? (geslaagd ? 'Geslaagd' : 'Niet geslaagd')
      : (pct >= 80 ? 'Sterk gedaan' : pct >= 60 ? 'Goed op weg' : 'Nog even oefenen');
    var wrap = el('div', { class: 'result' });
    wrap.appendChild(el('div', { class: 'result-hero ' + (cfg.scoring === 'exam' ? (geslaagd ? 'pass' : 'fail') : (pct >= 70 ? 'pass' : 'mid')) },
      el('div', { class: 'result-score' },
        el('span', { class: 'big' }, cfg.scoring === 'exam' ? String(pts) : String(juist)),
        el('span', { class: 'of' }, '/ ' + (cfg.scoring === 'exam' ? cfg.start : total))),
      el('div', {},
        el('h2', { class: 'result-verdict' }, verdict),
        cfg.scoring === 'exam'
          ? el('p', {}, 'Je had ' + pts + ' van ' + cfg.start + ' punten. Slagen kan vanaf ' + cfg.passMark + '.')
          : el('p', {}, pct + '% juist.'),
        el('ul', { class: 'result-stats' },
          el('li', {}, el('strong', {}, String(juist)), ' juist'),
          el('li', {}, el('strong', {}, String(fout)), ' fout'),
          el('li', {}, el('strong', {}, String(leeg)), ' onbeantwoord'),
          cfg.scoring === 'exam' ? el('li', {}, el('strong', {}, String(zwaar)), ' zware fout' + (zwaar === 1 ? '' : 'en') + ' (-5)') : null,
          elapsed != null ? el('li', {}, el('strong', {}, App.fmtTime(elapsed)), ' tijd') : null))));

    // analyse per onderwerp
    var groups = {};
    rows.forEach(function (r) {
      var id = r.ex.onderwerp || '?';
      var g = (groups[id] = groups[id] || { id: id, ok: 0, n: 0 });
      g.n++; if (r.correct) g.ok++;
    });
    var gl = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return a.ok / a.n - b.ok / b.n; });
    var an = el('section', { class: 'analysis' }, el('h3', {}, 'Analyse per onderwerp'));
    gl.forEach(function (g) {
      var c = App.cur(g.id); var p = Math.round(100 * g.ok / g.n);
      an.appendChild(el('div', { class: 'bar-row' },
        el('span', { class: 'bar-label' }, c ? c.naam : g.id),
        el('span', { class: 'bar', role: 'img', 'aria-label': p + ' procent juist' }, el('span', { class: 'bar-fill ' + (p >= 80 ? 'good' : p >= 50 ? 'mid' : 'low'), style: 'width:' + Math.max(p, 3) + '%' })),
        el('span', { class: 'bar-val' }, g.ok + '/' + g.n)));
    });
    wrap.appendChild(an);

    var wrong = rows.filter(function (r) { return !r.correct; });
    // wat herhalen
    if (wrong.length) {
      var seen = {}, links = [];
      wrong.forEach(function (r) {
        var id = r.ex.theorieblok; if (!id || seen[id]) return; seen[id] = 1;
        var b = App.blokById(id), h = App.theorieHref(id);
        if (b && h) links.push(el('li', {}, el('a', { href: h }, b.titel)));
      });
      if (links.length) wrap.appendChild(el('section', { class: 'redo' }, el('h3', {}, 'Wat moet je herhalen?'), el('ul', { class: 'redo-list' }, links)));
    } else {
      wrap.appendChild(el('p', { class: 'notice ok' }, 'Geen enkele fout. Mooi werk!'));
    }

    var actions = el('div', { class: 'result-actions' });
    var review = el('div', { class: 'review', id: 'review' });
    if (wrong.length) {
      actions.appendChild(el('button', { type: 'button', class: 'btn btn-primary', on: { click: function () {
        review.innerHTML = '';
        review.appendChild(el('h3', {}, 'Herhaal je foute vragen'));
        var box = el('div'); review.appendChild(box);
        App.practiceList(box, wrong.map(function (r) { return r.ex; }), { pageSize: 10 });
        review.scrollIntoView({ behavior: App.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      } } }, 'Herhaal je foute vragen (' + wrong.length + ')'));
      actions.appendChild(el('button', { type: 'button', class: 'btn', on: { click: function () {
        review.innerHTML = '';
        review.appendChild(el('h3', {}, 'Juiste antwoorden'));
        wrong.forEach(function (r, i) { App.mountExercise(r.ex, review, { nr: i + 1, review: true }); });
        review.scrollIntoView({ behavior: App.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      } } }, 'Bekijk de juiste antwoorden'));
    }
    if (cfg.restart) actions.appendChild(el('button', { type: 'button', class: 'btn', on: { click: cfg.restart } }, cfg.restartLabel || 'Opnieuw proberen'));
    wrap.appendChild(actions);
    wrap.appendChild(review);
    container.appendChild(wrap);
    return { juist: juist, fout: fout, leeg: leeg, pts: pts, geslaagd: geslaagd, total: total, pct: pct, zwaar: zwaar };
  };

  /**
   * cfg: { exercises, scoring:'exam'|'simple', start, passMark, timeLimit (sec, 0=geen), showTimer, onFinish(res,rows,elapsed), restart, restartLabel, title }
   */
  App.runQuiz = function (container, cfg) {
    container.innerHTML = '';
    var exs = cfg.exercises, n = exs.length;
    var cur = 0, finished = false, t0 = Date.now(), timerId = null, confirmAsk = false;
    var stage = el('div', { class: 'quiz-stage' });
    var items = exs.map(function (ex, i) { var m = App.mountForTest(ex, stage, i + 1); m.el.hidden = i !== 0; return m; });
    var title = el('span', { class: 'quiz-pos' });
    var timerEl = el('span', { class: 'quiz-timer', role: 'timer', 'aria-label': 'Tijd' });
    var dots = el('div', { class: 'quiz-dots', role: 'group', 'aria-label': 'Vragen' });
    var dotBtns = exs.map(function (_, i) {
      var b = el('button', { type: 'button', class: 'dot', 'aria-label': 'Vraag ' + (i + 1) }, String(i + 1));
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b); return b;
    });
    var bPrev = el('button', { type: 'button', class: 'btn', html: App.icon('left', 16) + ' Vorige' });
    var bNext = el('button', { type: 'button', class: 'btn btn-primary', html: 'Volgende ' + App.icon('right', 16) });
    var bFinish = el('button', { type: 'button', class: 'btn btn-accent' }, 'Afronden');
    var ask = el('div', { class: 'notice warn', hidden: true, role: 'alert' });
    var bar = el('div', { class: 'quiz-bar' }, title, cfg.showTimer !== false || cfg.timeLimit ? timerEl : null, bFinish);
    var nav = el('div', { class: 'quiz-nav' }, bPrev, bNext);
    container.appendChild(bar); container.appendChild(dots); container.appendChild(ask); container.appendChild(stage); container.appendChild(nav);

    function unansweredCount() { return items.filter(function (m) { return !m.ctrl.answered(); }).length; }
    function paint() {
      title.textContent = 'Vraag ' + (cur + 1) + ' van ' + n;
      items.forEach(function (m, i) { m.el.hidden = i !== cur; });
      dotBtns.forEach(function (b, i) {
        b.classList.toggle('current', i === cur);
        b.classList.toggle('answered', items[i].ctrl.answered() && !(exs[i].type === 'volgorde' && !items[i].touched));
        if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      bPrev.disabled = cur === 0; bNext.disabled = cur === n - 1;
    }
    function go(i) {
      if (finished) return;
      cur = Math.max(0, Math.min(n - 1, i)); ask.hidden = true; confirmAsk = false; paint();
      var h = items[cur].el; var f = h.querySelector('input,select,button:not(.iconbtn)'); void f;
      stage.scrollIntoView({ block: 'nearest', behavior: App.reducedMotion() ? 'auto' : 'smooth' });
    }
    // markeer "aangeraakt" voor volgorde (altijd 'answered')
    stage.addEventListener('input', paint);
    ['click', 'drop'].forEach(function (evn) { stage.addEventListener(evn, function (e) { items.forEach(function (m) { if (m.el.contains(e.target)) m.touched = true; }); setTimeout(paint, 0); }); });
    stage.addEventListener('change', function () { paint(); });
    bPrev.addEventListener('click', function () { go(cur - 1); });
    bNext.addEventListener('click', function () { go(cur + 1); });

    function finish() {
      if (finished) return;
      finished = true; clearInterval(timerId);
      var elapsed = Math.round((Date.now() - t0) / 1000);
      var rows = items.map(function (m, i) {
        var answered = m.ctrl.answered() && !(exs[i].type === 'volgorde' && !m.touched);
        var correct = answered && m.ctrl.evaluate();
        return { ex: exs[i], answered: answered, correct: correct };
      });
      rows.forEach(function (r) { App.recordResult(r.ex.id, r.correct); });
      var summary = App.renderResults(container, rows, cfg, elapsed);
      if (cfg.onFinish) cfg.onFinish(summary, rows, elapsed);
      container.scrollIntoView({ block: 'start', behavior: App.reducedMotion() ? 'auto' : 'smooth' });
      var h = container.querySelector('.result-verdict'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    bFinish.addEventListener('click', function () {
      var left = items.filter(function (m, i) { return !(m.ctrl.answered() && !(exs[i].type === 'volgorde' && !m.touched)); }).length;
      if (left > 0 && !confirmAsk) {
        confirmAsk = true; ask.hidden = false; ask.innerHTML = '';
        ask.appendChild(el('span', {}, 'Je hebt nog ' + left + ' onbeantwoorde vraag' + (left === 1 ? '' : 'en') + '. Onbeantwoord telt als fout.'));
        ask.appendChild(el('button', { type: 'button', class: 'btn btn-accent btn-sm', on: { click: finish } }, 'Toch afronden'));
        ask.appendChild(el('button', { type: 'button', class: 'btn btn-sm', on: { click: function () { ask.hidden = true; confirmAsk = false; } } }, 'Verder werken'));
        return;
      }
      finish();
    });

    function tick() {
      if (!document.body.contains(container)) { clearInterval(timerId); return; }
      var s = Math.round((Date.now() - t0) / 1000);
      if (cfg.timeLimit) {
        var rest = cfg.timeLimit - s;
        timerEl.textContent = 'Nog ' + App.fmtTime(rest);
        timerEl.classList.toggle('low', rest <= 60);
        if (rest <= 0) finish();
      } else timerEl.textContent = App.fmtTime(s);
    }
    tick(); timerId = setInterval(tick, 1000);
    paint();
    return { finish: finish };
  };
})();
