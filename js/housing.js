// 집: 이사(월세·전세·셰어·부모님 집), 집 사기, 갈아타기, 대출 갚기. DOM 접근 금지.
globalThis.LG = globalThis.LG || {};

(() => {
  const P = (s) => LG.data.economy.cards.place[s.cards.place];
  // 이사하면 돌려받는 보증금 중 전세대출을 갚고 남는 돈
  const backNet = (s) => s.assets.lease - s.loans.filter((l) => l.kind === 'jeonse').reduce((t, l) => t + l.bal, 0);
  // 부모님 보증금 지원은 처음 독립할 때 한 번만(남은 지원액만 쓴다)
  const useSupport = (s, need) => { const u = Math.min(s.support.deposit, need); s.support.deposit -= u; return need - u; };
  const liquid = (s) => s.cash + s.assets.deposit + s.assets.emergency + s.assets.index + s.assets.stock + s.assets.coin;

  // 이사 전 집 정리: 보증금을 돌려받고 전세대출을 갚는다
  function release(s) {
    s.cash += s.assets.lease;
    s.assets.lease = 0;
    for (const l of s.loans.filter((x) => x.kind === 'jeonse')) {
      const left = LG.economy.take(s, l.bal);
      if (left > 0) LG.economy.addLoan(s, 'credit', left);
    }
    s.loans = s.loans.filter((l) => l.kind !== 'jeonse');
  }

  LG.housing = {
    liquid,

    // 이사에 필요한 내 돈 (부모님 보증금 지원분은 뺀다)
    need(s, type) {
      const sup = s.support.deposit;
      if (type === 'wolse') return Math.max(0, Math.round(P(s).wolse[0] * s.priceLevel) - sup);
      if (type === 'jeonse') return Math.max(0, Math.round(P(s).jeonse * s.housingIdx * 0.2) - sup);
      return 0;
    },

    // 집을 사는 데 필요한 내 돈 (이미 가진 보증금은 뺀다). size: 0.5 = 작은 집(빌라·소형)
    buyNeed(s, factor, loanRatio, size = 1) {
      const price = Math.round(Math.round(P(s).house * s.housingIdx * size) * factor);
      return Math.max(0, price - Math.round(price * loanRatio) - backNet(s));
    },

    moveTo(s, type) {
      if (s.housing.type === 'own') return;
      release(s);
      const rent = (month) => Math.round(month * 12 * s.priceLevel);
      if (type === 'wolse') {
        const dep = Math.round(P(s).wolse[0] * s.priceLevel);
        LG.economy.fund(s, useSupport(s, dep));
        s.assets.lease = dep;
        s.housing = { type, rent: rent(P(s).wolse[1]) };
      } else if (type === 'jeonse') {
        const price = Math.round(P(s).jeonse * s.housingIdx);
        LG.economy.fund(s, useSupport(s, Math.round(price * 0.2)));
        LG.economy.addLoan(s, 'jeonse', Math.round(price * 0.8));
        s.assets.lease = price;
        s.housing = { type, rent: 0 };
      } else if (type === 'share') s.housing = { type, rent: rent(LG.data.economy.shareMonth) };
      else s.housing = { type: 'parent', rent: 0 };
    },

    // 집값의 factor배 가격으로 산다(청약은 0.8). loanRatio만큼 주택담보대출. size 0.5 = 작은 집. 돈이 모자라면 {ok:false}
    buy(s, factor, loanRatio, size = 1) {
      const value = Math.round(P(s).house * s.housingIdx * size);
      const price = Math.round(value * factor), loan = Math.round(price * loanRatio);
      if (liquid(s) + backNet(s) < price - loan) return { ok: false }; // 모자라면 아무것도 바꾸지 않는다
      release(s);
      LG.economy.fund(s, price - loan);
      if (loan > 0) LG.economy.addLoan(s, 'mortgage', loan);
      s.assets.house += value;
      s.housing = { type: 'own', rent: 0 };
      return { ok: true };
    },

    // 더 넓은 집으로: 집값 ×1.5, 늘어난 만큼 대출
    upsize(s) {
      const diff = Math.round(s.assets.house * 0.5);
      s.assets.house += diff;
      LG.economy.addLoan(s, 'mortgage', diff);
    },

    // 여유 현금으로 주택담보대출 원금 먼저 갚기
    prepay(s) {
      for (const l of s.loans.filter((x) => x.kind === 'mortgage')) {
        const p = Math.min(l.bal, Math.max(0, s.cash));
        l.bal -= p;
        s.cash -= p;
      }
      s.loans = s.loans.filter((l) => l.bal > 0.5);
    },

    // 다른 도시로 이사(집 값 표가 바뀐다). 임차 중이면 새 도시 기준으로 다시 계약
    changeCity(s, place) {
      const type = s.housing.type;
      s.cards.place = place;
      if (type === 'wolse' || type === 'jeonse') { s.housing = { type: 'parent', rent: 0 }; LG.housing.moveTo(s, type); }
    },
  };
})();
