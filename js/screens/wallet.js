// S8 내 지갑: 자산·빚, 저축 비율, 투자 배분(20세 이후), 지난 수익률(그래프 + 표)
// 값을 바꿔도 화면을 다시 만들지 않고 해당 컨트롤만 고친다(스크롤·포커스 유지).
LG.screens.wallet = function (back) {
  const { el, render, money } = LG.ui, s = LG.game.s, D = LG.data.economy;
  const names = { cash: '현금', emergency: '비상금', deposit: '예금', index: '지수펀드', stock: '인기주', coin: '코인', house: '집', car: '차', lease: '보증금' };
  const loanNames = { student: '학자금', jeonse: '전세대출', mortgage: '주택담보대출', credit: '신용대출', card: '카드빚', car: '차 할부' };
  const allocNames = { deposit: '예금', index: '지수펀드', stock: '인기주', coin: '코인' };
  const canSet = s.age >= 20 && !s.dependent;
  const pct = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 100))}%`;

  const rows = [['cash', s.cash], ...Object.entries(s.assets)].filter(([, v]) => v > 0);
  const loans = s.loans.map((l) => el('li', {}, `${loanNames[l.kind]} ${money(l.bal)} (연 ${(l.rate * 100).toFixed(1)}%)`));

  const rateBtns = [0, 0.1, 0.2, 0.3, 0.5].map((r) => {
    const b = el('button', { class: 'box choice' + (s.saveRate === r ? ' on' : ''), type: 'button', 'aria-pressed': String(s.saveRate === r), onclick: () => {
      s.saveRate = r;
      rateBtns.forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    } }, `${r * 100}%`);
    return b;
  });

  // 슬라이더 하나를 바꾸면 나머지를 비율대로 줄이거나 늘려 합계 100을 맞춘다
  const ctl = {};
  const sync = () => Object.keys(allocNames).forEach((k) => { ctl[k].input.value = String(s.alloc[k]); ctl[k].out.textContent = `${s.alloc[k]}%`; });
  const sliders = Object.entries(allocNames).map(([k, label]) => {
    const out = el('output', {}, `${s.alloc[k]}%`);
    const input = el('input', { type: 'range', min: '0', max: '100', step: '5', value: String(s.alloc[k]), 'aria-label': label });
    input.addEventListener('input', () => { out.textContent = `${input.value}%`; });
    input.addEventListener('change', () => {
      const v = Number(input.value), others = Object.keys(s.alloc).filter((o) => o !== k);
      const rest = others.reduce((t, o) => t + s.alloc[o], 0);
      others.forEach((o) => { s.alloc[o] = rest ? Math.round(((100 - v) * s.alloc[o]) / rest / 5) * 5 : Math.round((100 - v) / others.length / 5) * 5; });
      s.alloc[k] = v;
      let diff = 100 - Object.values(s.alloc).reduce((t, x) => t + x, 0); // 반올림 오차는 다른 칸이 나눠 받는다(0 아래로는 안 감)
      for (const o of others) { const d = Math.max(-s.alloc[o], diff); s.alloc[o] += d; diff -= d; }
      sync();
    });
    ctl[k] = { input, out };
    return el('label', { class: 'slider' }, el('span', {}, label), input, out);
  });

  // 지난 5년 수익률(이미 지나간 해만): 0% 선·±50%·100% 눈금과 나이 표시, 같은 내용을 표로도
  const from = Math.max(0, s.age - D.startAge - 5), past = LG.game.hist.slice(from, s.age - D.startAge);
  const colors = { index: '#3b5dc9', stock: '#e0a030', coin: '#d1495b' }, assets = { index: '지수펀드', stock: '인기주', coin: '코인' };
  const canvas = el('canvas', { width: '340', height: '160', role: 'img', 'aria-label': '지난 5년 수익률 막대 그래프. 같은 내용이 아래 표에 있어요.' });
  setTimeout(() => {
    const g = canvas.getContext('2d'), L = 44, w = 340, top = 10, h = 130, zero = top + h / 2;
    g.font = '13px Galmuri9, sans-serif'; g.fillStyle = '#333c57'; g.textAlign = 'right';
    [[1, '+100%'], [0.5, '+50%'], [0, '0%'], [-0.5, '−50%'], [-1, '−100%']].forEach(([v, t]) => {
      const y = zero - v * (h / 2);
      g.fillStyle = v === 0 ? '#333c57' : '#d8d2c4'; g.fillRect(L, y, w - L, 1);
      g.fillStyle = '#333c57'; g.fillText(t, L - 4, y + 4);
    });
    g.textAlign = 'center';
    past.forEach((y, i) => {
      const x0 = L + 6 + i * 58;
      Object.keys(colors).forEach((k, j) => {
        const v = Math.max(-1, Math.min(1, y[k]));
        g.fillStyle = colors[k];
        g.fillRect(x0 + j * 16, v >= 0 ? zero - v * (h / 2) : zero, 14, Math.abs(v) * (h / 2));
      });
      g.fillStyle = '#333c57'; g.fillText(`${y.age}살`, x0 + 23, top + h + 18);
    });
  }, 0);
  const table = el('div', { class: 'scroll' }, el('table', {},
    el('thead', {}, el('tr', {}, el('th', {}, '나이'), Object.values(assets).map((a) => el('th', {}, a)))),
    el('tbody', {}, past.map((y) => el('tr', {}, el('td', {}, `${y.age}살${y.isRecession ? ' (침체)' : ''}`), Object.keys(assets).map((k) => el('td', { class: 'num' }, pct(y[k]))))))));

  render(el('section', { class: 'screen' },
    el('h2', { class: 'with-icon' }, LG.ui.sprite('icons16', 'wallet', 3), '내 지갑'),
    el('p', { class: 'wealth' }, '순자산 ', el('b', {}, money(LG.economy.netWorth(s)))),
    el('ul', { class: 'list' }, rows.map(([k, v]) => el('li', {}, `${names[k]} ${money(v)}`, k === 'emergency' ? ` (생활비 약 ${(v / LG.panels.monthly(s)).toFixed(1)}개월치)` : ''))),
    loans.length ? el('div', {}, el('h3', {}, '빚'), el('ul', { class: 'list' }, loans)) : null,
    canSet ? el('div', { class: 'col' },
      el('h3', {}, '남은 돈 중 저축·투자할 비율'), el('p', { class: 'small' }, '생활비·집세·이자를 내고 남은 돈 가운데 몇 %를 저축·투자에 넣을지 정해요. 나머지는 현금으로 남아요.'),
      el('div', { class: 'speed', role: 'group', 'aria-label': '남은 돈 중 저축·투자할 비율' }, rateBtns),
      el('h3', {}, '모은 돈 나누기'), sliders) : el('p', { class: 'box' }, '20살이 되고 내 소득이 생기면 저축과 투자를 정할 수 있어요.'),
    past.length ? el('div', { class: 'col' }, el('h3', {}, '지난 5년 수익률'), canvas,
      el('p', { class: 'small' }, '파랑 지수펀드 · 노랑 인기주 · 빨강 코인. 지난 결과는 앞으로를 알려 주지 않아요.'), table) : null,
    el('button', { class: 'btn', type: 'button', onclick: back || (() => LG.screens.year()) }, '돌아가기')));
};
