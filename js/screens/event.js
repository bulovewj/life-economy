// S4 갈림길 + S5 결과 + S6 운 카드(opts.luck: 먼저 카드를 뒤집는다)
// 한 이벤트의 효과·기록·다음 단계는 단 한 번만 실행된다(연타·남은 타이머 방지).
LG.screens.event = function (ev, done, opts = {}) {
  const { el, render, delta } = LG.ui, s = LG.game.s;
  const before = LG.events.snap(s);
  const labels = { happiness: '행복', health: '건강', relation: '관계', skill: '실력' };
  const text = (blk) => (typeof blk.text === 'function' ? blk.text(s) : blk.text);
  let tip = '', notes = [], path = [], openUi = null, current = null, finished = false;

  const showChoices = (blk, banner) => {
    current = blk;
    render(el('section', { class: 'screen event' },
      blk === ev ? LG.ui.scene(LG.ui.look(s), ev.icon || 'gift') : null, // 이벤트 장면
      el('h2', { class: 'with-icon' }, LG.ui.sprite('icons24', blk.icon, 3), blk.title),
      banner.map((n) => el('p', { class: 'box note' }, n)),
      el('p', { class: 'box' }, text(blk)),
      el('div', { class: 'col', role: 'group', 'aria-label': '선택지' }, blk.choices.map((c) => {
        const a = LG.events.available(s, c);
        return el('div', {},
          el('button', { class: 'box choice', type: 'button', disabled: a.ok ? null : '', onclick: () => choose(blk, c) }, c.label),
          a.ok ? null : el('p', { class: 'reason' }, a.reason));
      }))));
  };

  const choose = (blk, c) => {
    if (finished || blk !== current) return; // 이미 지나간 화면의 버튼은 무시
    current = null;
    path.push(c.label);
    const r = LG.events.pick(s, c);
    tip = r.tip || tip;
    openUi = r.ui || openUi;
    if (r.retry) { path = []; showChoices(ev, r.notes); return; } // 다시 고르기(합격 못 함 등)
    notes.push(...r.notes);
    if (r.sub) showChoices(r.sub, []);
    else result();
  };

  const result = () => {
    finished = true;
    const picked = path.join(' → '); // 하위 선택까지 함께 기록
    s.timeline.push({ age: s.age, id: ev.id, title: ev.title, choice: picked });
    LG.lifelog.add(s, opts.luck ? 'luck' : 'choice', `${ev.title} → ${picked}${notes.length ? ` (${notes.join(' ')})` : ''}`);
    const d = LG.events.diff(before, LG.events.snap(s));
    const newTerms = (ev.terms || []).filter((t) => !s.terms[t]);
    newTerms.forEach((t) => { s.terms[t] = true; });
    let left = false;
    const next = () => {
      if (left) return;
      left = true;
      if (openUi === 'wallet') LG.screens.wallet(done); else done();
    };
    render(el('section', { class: 'screen event' },
      el('h2', {}, '결과'),
      el('p', { class: 'small' }, `내 선택: ${picked}`),
      notes.map((n) => el('p', { class: 'box' }, n)),
      el('ul', { class: 'deltas' },
        Object.entries(labels).filter(([k]) => d[k]).map(([k, l]) => el('li', {}, `${l} `, delta(d[k]))),
        d.netWorth ? el('li', {}, '순자산 ', delta(d.netWorth, '만원')) : null),
      tip ? el('p', { class: 'tip' }, `💡 ${tip}`) : null,
      newTerms.map((t) => el('p', { class: 'box term' }, el('b', {}, `새 용어 카드: ${t}`), el('br'), LG.data.terms[t].desc)),
      el('button', { class: 'btn', type: 'button', onclick: next }, '계속')));
  };

  if (opts.luck) {
    let flipped = false;
    const card = el('button', { class: 'card big', type: 'button', onclick: () => {
      if (flipped) return; // 첫 번째 누름만
      flipped = true;
      card.classList.add('flipped');
      setTimeout(() => { if (card.isConnected) showChoices(ev, []); }, 450);
    } }, el('span', { class: 'back', style: LG.ui.frameStyle('cards', 'back', 4) }, el('small', {}, '운 카드')),
    el('span', { class: 'front', style: LG.ui.frameStyle('cards', 'term', 4) }, LG.ui.sprite('icons24', ev.icon, 3), el('b', {}, ev.title)));
    render(el('section', { class: 'screen title' }, el('p', {}, '운 카드가 나왔어요. 눌러서 뒤집어 봐요.'), card));
  } else showChoices(ev, []);
};
