// S8 내 지갑: 자산·빚, 저축 비율, 투자 배분(20세 이후), 지난 수익률 미니 그래프
LG.screens.wallet = function (back) {
  const { el, render, money } = LG.ui, s = LG.game.s, D = LG.data.economy;
  const names = { cash: '현금', emergency: '비상금', deposit: '예금', index: '지수펀드', stock: '인기주', coin: '코인', house: '집', car: '차', lease: '보증금' };
  const loanNames = { student: '학자금', jeonse: '전세대출', mortgage: '주택담보대출', credit: '신용대출', card: '카드빚', car: '차 할부' };
  const allocNames = { deposit: '예금', index: '지수펀드', stock: '인기주', coin: '코인' };
  const canSet = s.age >= 20 && !s.dependent;

  const rows = [['cash', s.cash], ...Object.entries(s.assets)].filter(([, v]) => v > 0);
  const loans = s.loans.map((l) => el('li', {}, `${loanNames[l.kind]} ${money(l.bal)} (연 ${(l.rate * 100).toFixed(1)}%)`));

  const rate = el('div', { class: 'row' }, [0, 0.1, 0.2, 0.3, 0.5].map((r) =>
    el('button', { class: 'box choice' + (s.saveRate === r ? ' on' : ''), type: 'button', onclick: () => { s.saveRate = r; LG.screens.wallet(back); } },
      `${r * 100}%`)));

  // 슬라이더 하나를 바꾸면 나머지를 비율대로 줄이거나 늘려 합계 100을 맞춘다
  const sliders = Object.entries(allocNames).map(([k, label]) => {
    const out = el('output', {}, `${s.alloc[k]}%`);
    const input = el('input', { type: 'range', min: '0', max: '100', step: '5', value: String(s.alloc[k]), 'aria-label': label });
    input.addEventListener('change', () => {
      const v = Number(input.value), others = Object.keys(s.alloc).filter((o) => o !== k);
      const rest = others.reduce((t, o) => t + s.alloc[o], 0);
      others.forEach((o) => { s.alloc[o] = rest ? Math.round(((100 - v) * s.alloc[o]) / rest / 5) * 5 : Math.round((100 - v) / others.length / 5) * 5; });
      s.alloc[k] = v;
      s.alloc[others[0]] += 100 - Object.values(s.alloc).reduce((t, x) => t + x, 0); // 반올림 오차는 첫 칸이 받는다
      LG.screens.wallet(back);
    });
    return el('label', { class: 'slider' }, el('span', {}, label), input, out);
  });

  // 지난 5년 수익률(이미 지나간 해만)
  const past = LG.game.hist.slice(Math.max(0, s.age - D.startAge - 5), s.age - D.startAge);
  const canvas = el('canvas', { width: '320', height: '120', role: 'img', 'aria-label': '지난 5년 수익률' });
  setTimeout(() => {
    const g = canvas.getContext('2d'), w = 320, h = 120, zero = h / 2;
    g.fillStyle = '#333c57'; g.fillRect(0, zero, w, 1);
    const colors = { index: '#3b5dc9', stock: '#e0a030', coin: '#d1495b' };
    past.forEach((y, i) => Object.keys(colors).forEach((k, j) => {
      const v = Math.max(-1, Math.min(1, y[k])), bw = 14;
      g.fillStyle = colors[k];
      g.fillRect(i * 64 + 6 + j * (bw + 2), v >= 0 ? zero - v * zero : zero, bw, Math.abs(v) * zero);
    }));
  }, 0);

  render(el('section', { class: 'screen' },
    el('h2', { class: 'with-icon' }, LG.ui.sprite('icons16', 'wallet', 3), '내 지갑'),
    el('p', { class: 'wealth' }, '순자산 ', el('b', {}, money(LG.economy.netWorth(s)))),
    el('ul', { class: 'list' }, rows.map(([k, v]) => el('li', {}, `${names[k]} ${money(v)}`))),
    loans.length ? el('div', {}, el('h3', {}, '빚'), el('ul', { class: 'list' }, loans)) : null,
    canSet ? el('div', { class: 'col' },
      el('h3', {}, '월급에서 모으는 비율'), rate,
      el('h3', {}, '모은 돈 나누기'), sliders) : el('p', { class: 'box' }, '20살이 되고 내 소득이 생기면 저축과 투자를 정할 수 있어요.'),
    past.length ? el('div', {}, el('h3', {}, '지난 5년 수익률'), canvas,
      el('p', { class: 'small' }, '파랑 지수펀드 · 노랑 인기주 · 빨강 코인. 지난 결과는 앞으로를 알려 주지 않아요.')) : null,
    el('button', { class: 'btn', type: 'button', onclick: back || (() => LG.screens.year()) }, '돌아가기')));
};
