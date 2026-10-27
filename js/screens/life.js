// "내 삶 보기" 패널: 인생 기록(☆) · 인생 지도(한 칸 = 1년) · 같은 날 태어난 친구들
LG.screens.life = function (back, tabArg = 'log') {
  const tab = typeof tabArg === 'string' ? { name: tabArg, filter: 'all' } : tabArg;
  const { el, render, money } = LG.ui, g = LG.game, s = g.s, D = LG.data.economy;
  const tabs = { log: '인생 기록', map: '인생 지도', friends: '친구들' };
  const detail = el('p', { class: 'box note', 'aria-live': 'polite' }, '칸을 누르면 그해에 있었던 일이 보여요.');

  // 선택뿐 아니라 저절로 일어난 일·한 해 결산까지 모두(최근 순). ☆로 표시해 둘 수 있다.
  const kinds = { all: '전체', choice: '선택', life: '사건', money: '결산' };
  const pick = (x) => tab.filter === 'all' || x.kind === tab.filter || (tab.filter === 'choice' && ['luck', 'mark'].includes(x.kind)) || (tab.filter === 'life' && ['note', 'daily', 'story', 'term', 'grow'].includes(x.kind));
  const log = () => el('div', {},
    el('div', { class: 'speed filters', role: 'group', 'aria-label': '기록 고르기' }, Object.entries(kinds).map(([k, label]) =>
      el('button', { class: 'box choice' + (tab.filter === k ? ' on' : ''), type: 'button', 'aria-pressed': String(tab.filter === k), onclick: () => LG.screens.life(back, { name: 'log', filter: k }) }, label))),
    el('ul', { class: 'log' }, (s.log || []).length ? [...s.log].reverse().filter(pick).map((t) =>
      el('li', { class: t.kind },
        el('button', { class: 'star' + (t.star ? ' on' : ''), type: 'button', 'aria-label': '별표', 'aria-pressed': String(!!t.star),
          onclick: (e) => { t.star = !t.star; e.target.classList.toggle('on', t.star); e.target.textContent = t.star ? '★' : '☆'; e.target.setAttribute('aria-pressed', String(t.star)); if (!LG.game.pending) LG.save.write(s); } }, t.star ? '★' : '☆'), // 해 중간(알림 대기)엔 저장 안 함: 결산 때 같이 저장
        el('span', {}, el('b', {}, `${t.age}살 `), t.text))) : el('li', {}, '아직 기록이 없어요.')));

  // 한 칸 = 1년. 지난 해는 색이 채워지고, 선택이 있던 해는 점이 찍혀요.
  const map = () => {
    const cells = [];
    for (let age = D.startAge; age <= D.endAge; age++) {
      const items = s.timeline.filter((t) => t.age === age), mark = s.marks[age] !== undefined;
      const cls = ['cell', age < s.age ? 'past' : age === s.age ? 'now' : '', items.length ? 'has' : '', mark ? 'mark' : ''].join(' ');
      cells.push(el('button', { class: cls, type: 'button', 'aria-label': `${age}살`, onclick: () => {
        const lines = (s.log || []).filter((x) => x.age === age && x.kind !== 'money').map((x) => x.text);
        detail.textContent = `${age}살 · ${age > s.age ? '아직 오지 않았어요.' : lines.join(' / ') || '조용히 지나간 해예요.'}`;
      } }, String(age)));
    }
    return el('div', {}, el('div', { class: 'grid' }, cells), el('p', { class: 'small' }, '점: 선택이 있던 해 · 밑줄: 마디 질문에 답한 해'), detail);
  };

  const friends = () => {
    const at = s.age - D.startAge - 1;
    if (at < 0) return el('p', { class: 'box' }, '첫 해가 지나면 친구들과 나란히 볼 수 있어요.');
    g.friends = g.friends || LG.npc.all(s.seed, g.hist, s.fair);
    const row = (name, h) => el('tr', {}, el('td', {}, name), el('td', { class: 'num' }, money(h.netWorth)), el('td', { class: 'num' }, String(Math.round(h.happiness))), el('td', { class: 'num' }, String(Math.round(h.relation))));
    return el('div', {},
      el('p', {}, `같은 날 태어난 친구들의 ${s.age - 1}살 모습이에요. 정해진 규칙대로 움직이는 프로그램이에요.`),
      el('div', { class: 'scroll' }, el('table', {},
        el('thead', {}, el('tr', {}, ['이름', '순자산', '행복', '관계'].map((h) => el('th', {}, h)))),
        el('tbody', {}, row(`${s.name} (나)`, s.history[at]), g.friends.map((f) => row(f.npc.name, f.s.history[at]))))));
  };

  const body = { log, map, friends }[tab.name]();
  render(el('section', { class: 'screen' },
    el('h2', {}, '내 삶 보기'),
    el('div', { class: 'row tabs', role: 'group', 'aria-label': '보기' }, Object.entries(tabs).map(([k, label]) =>
      el('button', { class: 'box choice' + (k === tab.name ? ' on' : ''), type: 'button', 'aria-pressed': String(k === tab.name), onclick: () => LG.screens.life(back, k) }, label))),
    body,
    el('button', { class: 'btn', type: 'button', onclick: back || (() => LG.screens.year()) }, '돌아가기')));
};
