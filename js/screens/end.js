// S10 엔딩: 인생 그래프·5영역·칭호·친구 비교·선택 타임라인·용어 카드·마디 답변·인쇄
LG.screens.end = function () {
  const { el, render, money } = LG.ui, g = LG.game, s = g.s, X = LG.data.endingTexts;
  const colors = ['#333c57', '#38a169', '#3b5dc9', '#d1495b', '#e0a030'];
  const friends = LG.npc.all(s.seed, g.hist, s.fair);
  const titles = LG.data.pickTitles(s);
  const picked = el('p', { class: 'small picked' }, '그래프의 점을 누르면 그때 내가 한 선택이 보여요.');
  const lifeCanvas = el('canvas', { role: 'img', 'aria-label': `인생 그래프: 순자산 ${money(s.history[0].netWorth)}에서 ${money(s.history.at(-1).netWorth)}로, 행복 ${Math.round(s.history[0].happiness)}에서 ${Math.round(s.history.at(-1).happiness)}로. 아래 선택 목록에 자세히 있어요.` });
  const friendCanvas = el('canvas', { role: 'img', 'aria-label': '친구 비교 그래프' });
  const draw = () => {
    LG.graph.life(lifeCanvas, s, g.hist, (t) => { picked.textContent = t; });
    LG.graph.friends(friendCanvas, s, friends, colors);
  };

  const areas = LG.data.areas.map((a) => {
    const v = a.calc(s);
    return el('div', { class: 'stat' }, el('span', { class: 'stat-label wide' }, a.label),
      el('div', { class: 'bar' }, el('div', { class: 'fill', style: `width:${v}%` })), el('span', { class: 'stat-num' }, String(v)));
  });

  const row = (name, desc, w, color) => el('tr', {},
    el('td', {}, el('span', { class: 'dot', style: `background:${color}` }), name, el('br'), el('small', {}, desc)),
    el('td', {}, money(LG.economy.netWorth(w))), el('td', {}, String(Math.round(w.stats.happiness))),
    el('td', {}, String(Math.round(w.stats.relation))), el('td', {}, LG.data.pickTitles(w).map((t) => t.name).join(', ')));

  const mine = LG.data.markers;
  const again = () => {
    if (!confirm('저장된 내 인생 기록이 지워져요. 다시 살아 볼까요?')) return;
    LG.save.clear();
    g.s = null;
    LG.screens.title();
  };

  render(el('section', { class: 'screen ending' },
    LG.ui.scene({ ...LG.ui.look(s), bg: 'night' }),
    el('h2', {}, `${s.name}의 인생 마무리`),
    el('p', { class: 'small' }, `세계 번호 ${s.seed} · ${s.age - 1}살까지 살았어요.`),
    el('div', { class: 'box' }, '순자산 ', el('b', {}, money(LG.economy.netWorth(s)))),
    el('h3', {}, '인생 그래프'),
    el('div', { class: 'chart' }, lifeCanvas),
    el('p', { class: 'small' }, '파랑: 순자산 · 노랑: 행복 · 회색 띠: 경기가 나빴던 해'),
    picked,
    el('h3', {}, '다섯 가지 영역'), el('div', { class: 'stats' }, areas),
    el('h3', {}, '나의 칭호'),
    el('div', { class: 'col' }, titles.map((t) => el('div', { class: 'box term' }, el('b', {}, t.name), t.desc ? el('br') : null, t.desc))),
    el('div', { class: 'no-print' },
      el('h3', {}, '같은 날 태어난 친구들'),
      el('p', {}, X.friendsIntro),
      el('div', { class: 'chart' }, friendCanvas),
      el('p', { class: 'small' }, `굵은 선이 나예요. ${friends.map((f, i) => `${f.npc.name}(${['초록', '파랑', '빨강', '노랑'][i]})`).join(' · ')}`),
      el('div', { class: 'scroll' }, el('table', {},
        el('thead', {}, el('tr', {}, ['이름', '순자산', '행복', '관계', '칭호'].map((h) => el('th', {}, h)))),
        el('tbody', {}, row(s.name, '나', s, colors[0]), friends.map((f, i) => row(f.npc.name, f.npc.desc, f.s, colors[i + 1]))))),
      el('p', { class: 'small' }, X.friends)),
    el('h3', {}, '내가 한 선택'),
    el('ul', { class: 'list timeline' }, s.timeline.map((t) => el('li', { class: /^E/.test(t.id) ? '' : 'luck' }, `${t.age}살 ${t.title} → ${t.choice}`))),
    el('div', { class: 'no-print' },
      el('h3', {}, `모은 용어 카드 (${Object.keys(s.terms).length}/${Object.keys(LG.data.terms).length})`),
      el('div', { class: 'row chips' }, Object.keys(s.terms).map((t) => el('span', { class: 'box chip' }, t)))),
    el('h3', {}, '인생의 마디'),
    el('ul', { class: 'list' }, Object.entries(mine).map(([age, q]) => el('li', {}, `${age}살 · ${q}`, el('br'), el('b', {}, s.marks[age] || '(건너뛰었어요)')))),
    el('p', { class: 'box note closing' }, X.closing),
    el('div', { class: 'row no-print' },
      el('button', { class: 'btn', type: 'button', onclick: () => window.print() }, LG.ui.sprite('icons16', 'print', 2), '인쇄하기'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => LG.screens.terms(() => LG.screens.end()) }, '용어 사전'),
      el('button', { class: 'btn ghost', type: 'button', onclick: again }, '다시 살기'))));

  draw();
  window.onresize = () => { if (document.querySelector('.ending')) draw(); }; // 창 크기·화면 회전 때 다시 그리기
};
