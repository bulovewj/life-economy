// S3 메인(한 해): 왼쪽 내 자산 · 가운데 진행(장면·막대·로그) · 오른쪽 현황판
// 한 해 막대가 왼쪽에서 오른쪽으로 차면 다음 해. 갈림길이 오면 화면을 바꾸지 않고 위쪽 "이벤트 발생!" 알림을 띄워 기다린다.
LG.screens.year = function () {
  const { el, render } = LG.ui, g = LG.game, s = g.s, D = LG.data.economy;
  clearTimeout(g.timer);
  const q = LG.data.markers[s.age];
  if (q && s.marks[s.age] === undefined) { LG.screens.marker(q, () => LG.screens.year()); return; } // 마디 질문은 시간이 멈춘다
  const fresh = s.startedAge !== s.age;
  const notes = LG.events.startYear(s); // 지난 일의 결과(지연 효과)
  if (fresh) notes.forEach((n) => LG.lifelog.add(s, 'note', n));
  const pending = g.pending;
  let focus = s.focus;

  const focusBtns = Object.entries(D.focus).map(([k, f]) =>
    el('button', { class: 'box choice' + (k === focus ? ' on' : ''), type: 'button', 'aria-pressed': String(k === focus), onclick: () => {
      focus = k;
      focusBtns.forEach((b, j) => { const on = Object.keys(D.focus)[j] === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    } }, f.label));

  // 배속: 누르면 ❚❚를 누를 때까지 계속. 이벤트 알림에서는 기다렸다가 같은 배속으로 이어 간다.
  const go = (speed, mode) => { g.speed = speed; g.mode = mode; g.auto = true; if (g.pending) LG.screens.year(); else LG.screens.advance(focus); };
  const on = (n) => g.auto && g.mode === 'speed' && g.speed === n;
  const speedBar = el('div', { class: 'speed', role: 'group', 'aria-label': '시간 속도' },
    el('button', { class: 'box choice' + (g.auto ? '' : ' on'), type: 'button', 'aria-label': '멈춤', onclick: () => { g.auto = false; LG.screens.year(); } }, '❚❚'),
    [1, 2, 4, 8].map((n) => el('button', { class: 'box choice' + (on(n) ? ' on' : ''), type: 'button', 'aria-pressed': String(on(n)), onclick: () => go(n, 'speed') }, `${n}×`)));

  const open = () => { const p = g.pending; if (!p) return; g.pending = null; LG.screens.event(p.e, p.next, p.opts); };
  const alert = pending && el('button', { class: 'event-alert', type: 'button', onclick: open },
    el('b', {}, `⚡ ${pending.kind} 발생!`), el('span', {}, pending.e.title), el('small', {}, '눌러서 선택하러 가기'));

  // 한 해 진행 막대: 결정에서 막 돌아왔으면 배속과 상관없이 restMs 동안 천천히(로그를 읽을 시간)
  // 지난해 새 정보가 있었으면 그 줄(올해의 변화)을 고정하고 readMs 동안 머문다
  const A = D.autoplay, lastYear = (s.log || []).filter((x) => x.age === s.age - 1);
  const headline = A.headline.map((k) => lastYear.find((x) => x.kind === k)).find(Boolean);
  const step = A.stepMs / g.speed, wait = g.rest ? Math.max(A.restMs, step) : headline && fresh ? Math.max(A.readMs, step) : step;
  if (!pending) g.rest = false; // 알림을 띄운 동안은 쉬는 시간 표시를 남겨 둔다
  const fill = el('div', { class: 'fill' });
  const bar = el('div', { class: 'yearbar' + (pending ? ' full' : ''), role: 'progressbar', 'aria-label': `${s.age}살 한 해 진행` }, fill,
    el('span', {}, pending ? '이벤트가 기다려요' : g.auto ? `${s.age}살이 흘러가요…` : '다음 해를 누르면 진행돼요'));

  const recent = (s.log || []).slice(-8).reverse();
  const flash = g.flash ? ' flash' : '';
  g.flash = false;
  const main = el('div', { class: 'col main' },
    LG.ui.scene(LG.ui.look(s), pending && pending.e.icon), // 이벤트가 오면 말풍선과 장소가 바뀐다
    el('header', { class: 'box' },
      el('b', {}, `${s.age}살`), g.auto ? ` ▶ ${g.speed}×` : ' ❚❚', ` · ${D.calendarStartYear + s.age - D.startAge}년 · ${LG.ui.ageGroup(s.age)} · ${s.name}`),
    speedBar, bar,
    LG.ui.statBars(s),
    headline ? el('p', { class: 'box headline' }, el('b', {}, `${s.age - 1}살의 변화 `), headline.text) : null,
    el('div', { class: 'box lifelog' },
      el('h3', {}, '인생 로그'),
      el('ul', {}, recent.length ? recent.map((x) => el('li', { class: x.kind }, el('b', {}, `${x.age}살 `), x.text)) : el('li', {}, '이제 인생이 시작돼요.')),
      el('button', { class: 'link', type: 'button', onclick: () => LG.screens.life() }, '전체 기록 보기')),
    el('h3', {}, '올해의 집중'),
    el('div', { class: 'row', role: 'group', 'aria-label': '올해의 집중' }, focusBtns),
    el('div', { class: 'row' },
      pending ? el('button', { class: 'btn', type: 'button', onclick: open }, '이벤트 보러 가기')
        : el('button', { class: 'btn', type: 'button', onclick: () => { g.auto = false; LG.screens.advance(focus); } }, LG.ui.sprite('icons16', 'next', 2), '다음 해'),
      pending ? null : el('button', { class: 'btn ghost', type: 'button', onclick: () => go(g.speed, 'next') }, LG.ui.sprite('icons16', 'auto', 2), '다음 결정까지 »')),
    el('div', { class: 'row' },
      el('button', { class: 'btn ghost', type: 'button', onclick: () => LG.screens.life() }, '내 삶 보기'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => LG.screens.wallet() }, LG.ui.sprite('icons16', 'wallet', 2), '내 지갑'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => LG.screens.terms(() => LG.screens.year()) }, LG.ui.sprite('icons16', 'dict', 2), '용어 사전')));

  render(el('section', { class: 'screen year' }, alert,
    el('div', { class: 'year-grid' },
      el('aside', { class: 'panel assets', 'aria-label': '내 자산' }, LG.panels.assets(s)),
      main,
      el('aside', { class: 'panel board' + flash, 'aria-label': '현황판' }, LG.panels.board(s)))));

  if (pending) return; // 알림을 누를 때까지 멈춤
  if (g.auto) {
    fill.style.transitionDuration = `${wait}ms`;
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = '100%'; }));
    g.timer = setTimeout(() => { if (document.querySelector('.year')) LG.screens.advance(focus); }, wait); // 다른 화면에 가 있으면 건너뜀
  }
};

// 집중 → 갈림길(알림) → 운 카드(알림 또는 바로 적용) → 인생 이야기·작은 일 → 결산 → 다음 나이
LG.screens.advance = function (focus) {
  const s = LG.game.s, g = LG.game, age = s.age, before = LG.lifelog.snap(s);
  clearTimeout(g.timer);
  s.yearStart = LG.panels.snap(s); // 자산판 ▲▼ 기준
  LG.events.applyFocus(s, focus);
  const ev = LG.events.due(s, g.hist);
  const settle = () => {
    LG.events.yearlyStats(s); // 올해 고른 몇 년 효과도 올해부터 적용(NPC 러너와 같은 순서)
    const h = g.hist[age - LG.data.economy.startAge], dependent = s.dependent, r = LG.economy.settleYear(s, h);
    LG.lifelog.after(s, before, age, h, r);
    s.boardPrev = s.board;
    s.board = { ...r, age, dependent };
    g.flash = true;
    if (!LG.save.write(s) && !g.saveWarned) { g.saveWarned = true; LG.ui.toast('저장이 안 되고 있어요. 창을 닫으면 기록이 사라져요.', 3000); }
    if (r.borrowed && !g.auto) LG.ui.toast('돈이 모자라 빌렸어요. 빚에는 이자가 붙어요.', 2500);
    if (s.age > LG.data.economy.endAge) { g.auto = false; LG.screens.end(); } else LG.screens.year();
  };
  // 선택 없이 생기는 일은 화면을 멈추지 않고 로그에만(효과 요약과 함께)
  const quietly = (kind, text, apply) => {
    const b = LG.events.snap(s);
    apply();
    LG.lifelog.add(s, kind, text + LG.lifelog.delta(b, LG.events.snap(s)));
  };
  const daily = () => {
    LG.events.stories(s, (text, b) => LG.lifelog.add(s, 'story', text + LG.lifelog.delta(b, LG.events.snap(s))));
    const b = LG.events.snap(s), d = LG.events.daily(s);
    if (d) LG.lifelog.add(s, 'daily', d.text + LG.lifelog.delta(b, LG.events.snap(s)));
    settle();
  };
  // 결정이 필요하면 화면을 바꾸지 않고 알림만. '다음 결정까지'는 여기서 멈춘다.
  const ask = (e, next, opts, kind) => {
    if (g.mode === 'next') g.auto = false;
    s.lastDecisionAge = age;
    g.rest = true;
    g.pending = { e, next, opts, kind };
    LG.screens.year();
  };
  const luck = () => {
    const card = LG.events.luck(s, !!ev);
    if (!card) daily();
    else if (card.choices.length === 1) { // 고를 게 없는 카드는 바로 적용
      let out = { notes: [] };
      quietly('luck', `${card.title}: ${card.text}`, () => { out = LG.events.pick(s, card.choices[0]); });
      out.notes.forEach((n) => LG.lifelog.add(s, 'luck', n));
      s.timeline.push({ age, id: card.id, title: card.title, choice: card.choices[0].label }); // 엔딩 선택 목록·그래프 점·인생 지도에도
      (card.terms || []).filter((t) => !s.terms[t]).forEach((t) => { // 로그로 풀이를 보여 준 뒤에 얻은 것으로
        s.terms[t] = true;
        LG.lifelog.add(s, 'term', LG.data.economy.logText.termGot(t, LG.data.terms[t].desc));
        if (!g.auto) LG.ui.toast(`새 용어 카드: ${t}`, 2000);
      });
      daily();
    } else ask(card, daily, { luck: true }, '운 카드');
  };
  if (ev) ask(ev, luck, {}, '이벤트'); else luck();
};
