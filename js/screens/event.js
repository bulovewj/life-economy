// S4 갈림길 + S5 결과 + S6 운 카드(opts.luck: 먼저 카드를 뒤집는다)
LG.screens.event = function (ev, done, opts = {}) {
  const { el, render, delta } = LG.ui, s = LG.game.s;
  const before = LG.events.snap(s);
  const labels = { happiness: '행복', health: '건강', relation: '관계', skill: '실력' };
  const text = (blk) => (typeof blk.text === 'function' ? blk.text(s) : blk.text);
  let tip = '', notes = [], picked = '', openUi = null;

  const showChoices = (blk, banner) => {
    render(el('section', { class: 'screen event' },
      el('h2', { class: 'with-icon' }, LG.ui.sprite('icons24', blk.icon, 3), blk.title),
      banner.map((n) => el('p', { class: 'box note' }, n)),
      el('p', { class: 'box' }, text(blk)),
      el('div', { class: 'col' }, blk.choices.map((c) => {
        const a = LG.events.available(s, c);
        return el('div', {},
          el('button', { class: 'box choice', type: 'button', disabled: a.ok ? null : '', onclick: () => choose(c) }, c.label),
          a.ok ? null : el('p', { class: 'reason' }, a.reason));
      }))));
  };

  const choose = (c) => {
    if (!picked) picked = c.label;
    const r = LG.events.pick(s, c);
    tip = r.tip || tip;
    openUi = r.ui || openUi;
    if (r.retry) { picked = ''; showChoices(ev, r.notes); return; } // 다시 고르기(합격 못 함 등)
    notes.push(...r.notes);
    if (r.sub) showChoices(r.sub, []);
    else result();
  };

  const result = () => {
    s.timeline.push({ age: s.age, id: ev.id, title: ev.title, choice: picked });
    LG.lifelog.add(s, opts.luck ? 'luck' : 'choice', `${ev.title} → ${picked}${notes.length ? ` (${notes.join(' ')})` : ''}`);
    const d = LG.events.diff(before, LG.events.snap(s));
    const newTerms = (ev.terms || []).filter((t) => !s.terms[t]);
    newTerms.forEach((t) => { s.terms[t] = true; });
    const next = openUi === 'wallet' ? () => LG.screens.wallet(done) : done;
    render(el('section', { class: 'screen event' },
      el('h2', {}, '결과'),
      notes.map((n) => el('p', { class: 'box' }, n)),
      el('ul', { class: 'deltas' },
        Object.entries(labels).filter(([k]) => d[k]).map(([k, l]) => el('li', {}, `${l} `, delta(d[k]))),
        d.netWorth ? el('li', {}, '순자산 ', delta(d.netWorth, '만원')) : null),
      tip ? el('p', { class: 'tip' }, `💡 ${tip}`) : null,
      newTerms.map((t) => el('p', { class: 'box term' }, el('b', {}, `새 용어 카드: ${t}`), el('br'), LG.data.terms[t].desc)),
      el('button', { class: 'btn', type: 'button', onclick: next }, '계속')));
  };

  if (opts.luck) {
    const card = el('button', { class: 'card big', type: 'button', onclick: () => {
      card.classList.add('flipped');
      setTimeout(() => showChoices(ev, []), 450);
    } }, el('span', { class: 'back', style: LG.ui.frameStyle('cards', 'back', 4) }, el('small', {}, '운 카드')),
    el('span', { class: 'front', style: LG.ui.frameStyle('cards', 'term', 4) }, LG.ui.sprite('icons24', ev.icon, 3), el('b', {}, ev.title)));
    render(el('section', { class: 'screen title' }, el('p', {}, '운 카드가 나왔어요. 눌러서 뒤집어 봐요.'), card));
  } else showChoices(ev, []);
};
