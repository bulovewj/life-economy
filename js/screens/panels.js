// 한 해 화면의 양옆 판. 합계만 먼저 보이고, 누르면(▸) 자세한 항목이 펼쳐진다. 펼친 칸은 다음 해에도 그대로.
// 왼쪽 "내 자산": 모은 돈·투자·집과 차·빚·순자산 (▲▼ = 올해 들어 바뀐 만큼)
// 오른쪽 "현황판": 들어온 돈 − 나간 돈 = 남은 돈 (1년에 한 번 결산, ▲▼ = 지난해와 비교)
LG.panels = (() => {
  const money = (n) => LG.economy.formatMoney(n);
  const debtOf = (s) => s.loans.reduce((t, l) => t + l.bal, 0);
  const sum = (o, keys) => keys.reduce((t, k) => t + (o[k] || 0), 0);
  // 늘었나 줄었나: goodUp=false면 늘어난 게 빨강(빚·지출)
  const change = (d, goodUp = true) => {
    const { el } = LG.ui;
    d = Math.round(d);
    return d ? el('span', { class: `chg ${(d > 0) === goodUp ? 'up' : 'down'}` }, `${d > 0 ? '▲' : '▼'}${money(Math.abs(d))}`) : null;
  };
  const row = (label, value, d, goodUp, sub) => {
    const { el } = LG.ui;
    return el('li', { class: Math.round(value) ? '' : 'zero' },
      el('span', { class: 'k' }, label, sub ? el('small', {}, sub) : null),
      el('span', { class: 'v' }, money(value), d === null || d === undefined ? null : change(d, goodUp)));
  };
  // 합계 한 줄(누르면 자세히). id로 펼침 상태를 기억한다.
  const fold = (id, label, total, d, goodUp, rows) => {
    const { el } = LG.ui, open = LG.game.openPanels || (LG.game.openPanels = {});
    const box = el('details', { class: 'fold', open: open[id] ? '' : null },
      el('summary', {}, el('span', { class: 'k' }, label), el('span', { class: 'v' }, money(total), d === null ? null : change(d, goodUp))),
      el('ul', { class: 'kv' }, rows));
    box.addEventListener('toggle', () => { open[id] = box.open; });
    return box;
  };

  return {
    // 한 달 생활비(지난해 결산 기준: 생활비+집세+고정지출). 결산 전이면 지금 물가의 1인 생활비
    monthly(s) {
      const b = s.board;
      return Math.max(1, b ? (b.living + b.rent + b.fixed) / 12 : (LG.data.economy.living.single * s.priceLevel) / 12);
    },
    // 그때 돈을 2026년 물가로
    today: (s, n) => Math.round(n / s.priceLevel),

    // 자산 한 장 사진(올해 시작 때 찍어 두고 비교한다)
    snap(s) {
      return { ...s.assets, cash: s.cash, debt: debtOf(s), netWorth: LG.economy.netWorth(s) };
    },

    assets(s) {
      const { el } = LG.ui, now = LG.panels.snap(s), ref = s.yearStart || now;
      const group = (id, label, items, goodUp = true) => {
        const keys = items.map(([k]) => k), total = sum(now, keys);
        return fold(id, label, total, total - sum(ref, keys), goodUp, items.map(([k, l]) => row(l, now[k], now[k] - ref[k], goodUp)));
      };
      const loanNames = { student: '학자금', jeonse: '전세대출', mortgage: '주택담보대출', credit: '신용대출', card: '카드빚', car: '차 할부' };
      return el('div', { class: 'col' },
        el('h3', {}, '내 자산'),
        el('p', { class: 'small' }, '눌러서 자세히 · ▲▼ 올해 바뀐 만큼'),
        group('a-save', '모은 돈', [['cash', '현금'], ['emergency', '비상금'], ['deposit', '예금']]),
        now.emergency > 0 ? el('p', { class: 'small' }, `비상금 = 생활비 약 ${(now.emergency / LG.panels.monthly(s)).toFixed(1)}개월치`) : null,
        group('a-invest', '투자', [['index', '지수펀드'], ['stock', '인기주'], ['coin', '코인']]),
        group('a-home', '집·차', [['lease', '보증금'], ['house', '집'], ['car', '차']]),
        fold('a-debt', '빚', now.debt, now.debt - ref.debt, false,
          s.loans.length ? s.loans.map((l) => row(loanNames[l.kind] || l.kind, l.bal, null, false, ` 연 ${(l.rate * 100).toFixed(1)}%`)) : [row('빚 없음', 0)]),
        el('ul', { class: 'kv total' }, row('순자산', now.netWorth, now.netWorth - ref.netWorth, true,
          s.priceLevel > 1.05 ? ` 2026년 돈으로 약 ${money(LG.panels.today(s, now.netWorth))}` : '')));
    },

    board(s) {
      const { el } = LG.ui, b = s.board, p = s.boardPrev;
      if (!b) return el('div', { class: 'col' }, el('h3', {}, '현황판'), el('p', { class: 'box' }, '첫 해가 끝나면 1년 결산이 여기에 나와요.'));
      // 들어온 돈 − 나간 돈 = 남은 돈 (이벤트로 받은/쓴 돈까지 넣어서 계산이 맞게)
      const totals = (x) => {
        const inn = x.income + x.eventIn, out = x.spend + x.interest + x.principal + x.eventOut;
        return { inn, out, left: inn - out, other: x.income - x.pay, cash: inn - out - x.invest };
      };
      const t = totals(b), q = p ? totals(p) : null, d = (k) => (p ? b[k] - p[k] : null), dt = (k) => (q ? t[k] - q[k] : null);
      return el('div', { class: 'col' },
        el('h3', {}, `현황판 · ${b.age}살 결산`),
        el('p', { class: 'small' }, '1년에 한 번 바뀌어요 · 눌러서 자세히 · ▲▼ 지난해와 비교'),
        fold('b-in', '들어온 돈', t.inn, dt('inn'), true, [
          row(b.dependent ? '용돈(1년)' : '연봉(세금 뗀 뒤)', b.pay, d('pay'), true, b.pay ? ` 월급 ${money(b.pay / 12)}` : ''),
          row('그 밖의 수입', t.other, dt('other'), true, ' 연금·부업·알바'),
          row('이벤트로 받은 돈', b.eventIn, d('eventIn'), true)]),
        fold('b-out', '나간 돈', t.out, dt('out'), false, [
          row('생활비', b.living, d('living'), false),
          row('집세', b.rent, d('rent'), false),
          row('고정지출', b.fixed, d('fixed'), false, ' 보험·차·학원 등'),
          row('이자', b.interest, d('interest'), false),
          row('빚 갚기', b.principal, d('principal'), false),
          row('이벤트로 쓴 돈', b.eventOut, d('eventOut'), false)]),
        fold('b-left', t.left >= 0 ? '남은 돈' : '모자란 돈', t.left, dt('left'), true, [
          row('저축·투자에 넣음', b.invest, d('invest'), true),
          row(t.cash >= 0 ? '현금으로 남음' : '모은 돈에서 꺼내거나 빌림', t.cash, dt('cash'), true)]));
    },
  };
})();
