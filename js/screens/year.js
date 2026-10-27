// S3 메인(한 해) + 1년 결산(S7) + 다음 해 진행 + 배속 진행 + 인생 로그
LG.screens.year = function () {
  const { el, render, money } = LG.ui, g = LG.game, s = g.s, D = LG.data.economy;
  clearTimeout(g.timer);
  const q = LG.data.markers[s.age];
  if (q && s.marks[s.age] === undefined) { LG.screens.marker(q, () => LG.screens.year()); return; } // 마디 질문은 시간이 멈춘다
  const fresh = s.startedAge !== s.age;
  const notes = LG.events.startYear(s); // 지난 일의 결과(지연 효과)
  if (fresh) notes.forEach((n) => LG.lifelog.add(s, 'note', n));
  let focus = s.focus;

  const focusBtns = Object.entries(D.focus).map(([k, f]) =>
    el('button', { class: 'box choice' + (k === focus ? ' on' : ''), type: 'button', onclick: () => {
      focus = k;
      focusBtns.forEach((b, j) => b.classList.toggle('on', Object.keys(D.focus)[j] === k));
    } }, f.label));

  // 배속: 누르면 ❚❚를 누를 때까지 계속. 갈림길에서는 답을 기다렸다가 같은 배속으로 이어 간다.
  const go = (speed, mode) => { g.speed = speed; g.mode = mode; g.auto = true; LG.screens.advance(focus); };
  const on = (n) => g.auto && g.mode === 'speed' && g.speed === n;
  const speedBar = el('div', { class: 'speed', role: 'group', 'aria-label': '시간 속도' },
    el('button', { class: 'box choice' + (g.auto ? '' : ' on'), type: 'button', 'aria-label': '멈춤', onclick: () => { g.auto = false; LG.screens.year(); } }, '❚❚'),
    [1, 2, 4, 8].map((n) => el('button', { class: 'box choice' + (on(n) ? ' on' : ''), type: 'button', 'aria-pressed': String(on(n)), onclick: () => go(n, 'speed') }, `${n}×`)));

  const recent = (s.log || []).slice(-8).reverse();
  render(el('section', { class: 'screen year' },
    LG.ui.scene(s.age, s.avatar),
    el('header', { class: 'box' },
      el('b', {}, `${s.age}살`), g.auto ? ` ▶ ${g.speed}×` : ' ❚❚', ` · ${D.calendarStartYear + s.age - D.startAge}년 · ${LG.ui.ageGroup(s.age)} · ${s.name}`),
    speedBar,
    LG.ui.statBars(s),
    el('p', { class: 'wealth' }, LG.ui.sprite('icons16', 'money', 2), ' 순자산 ', el('b', {}, money(LG.economy.netWorth(s))), ` · 현금 ${money(s.cash)}`),
    el('div', { class: 'box lifelog' },
      el('h3', {}, '인생 로그'),
      el('ul', {}, recent.length ? recent.map((x) => el('li', { class: x.kind }, el('b', {}, `${x.age}살 `), x.text)) : el('li', {}, '이제 인생이 시작돼요.')),
      el('button', { class: 'link', type: 'button', onclick: () => LG.screens.life() }, '전체 기록 보기')),
    el('h3', {}, '올해의 집중'),
    el('div', { class: 'row' }, focusBtns),
    el('div', { class: 'row' },
      el('button', { class: 'btn', type: 'button', onclick: () => { g.auto = false; LG.screens.advance(focus); } }, LG.ui.sprite('icons16', 'next', 2), '다음 해'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => go(g.speed, 'next') }, LG.ui.sprite('icons16', 'auto', 2), '다음 결정까지 »')),
    el('div', { class: 'row' },
      el('button', { class: 'btn ghost', type: 'button', onclick: () => LG.screens.life() }, '내 삶 보기'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => LG.screens.wallet() }, LG.ui.sprite('icons16', 'wallet', 2), '내 지갑'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => LG.screens.terms(() => LG.screens.year()) }, LG.ui.sprite('icons16', 'dict', 2), '용어 사전'))));

  // 다른 화면(지갑 등)에 가 있으면 건너뛰고, 돌아오면 다시 이어 간다
  if (g.auto) g.timer = setTimeout(() => { if (document.querySelector('.year')) LG.screens.advance(focus); }, 1200 / g.speed);
};

// 집중 적용 → 갈림길(있으면) → 운 카드(있으면) → 결산 → 다음 나이
LG.screens.advance = function (focus) {
  const s = LG.game.s, g = LG.game, age = s.age, before = LG.lifelog.snap(s);
  clearTimeout(g.timer);
  LG.events.applyFocus(s, focus);
  LG.events.yearlyStats(s);
  const ev = LG.events.due(s, g.hist);
  const settle = () => {
    const h = g.hist[age - LG.data.economy.startAge], r = LG.economy.settleYear(s, h);
    LG.lifelog.after(s, before, age, h, r);
    LG.save.write(s);
    if (!g.auto) {
      LG.ui.toast(`+${LG.ui.money(r.income)} −${LG.ui.money(r.spend + r.interest + r.principal)} = ${LG.ui.money(r.net)}`);
      if (r.borrowed) LG.ui.toast('돈이 모자라 빌렸어요. 빚에는 이자가 붙어요.', 2500);
    }
    if (s.age > LG.data.economy.endAge) { g.auto = false; LG.screens.end(); } else LG.screens.year();
  };
  const pause = () => { if (g.mode === 'next') g.auto = false; }; // '다음 결정까지'는 결정에서 멈춘다
  const luck = () => {
    const card = LG.events.luck(s, !!ev);
    if (card) { pause(); LG.screens.event(card, settle, { luck: true }); } else settle();
  };
  if (ev) { pause(); LG.screens.event(ev, luck); } else luck();
};
