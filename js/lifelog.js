// 인생 로그: 선택·운 카드·지난 일의 결과·저절로 일어난 일(이직, 이사, 결혼, 침체, 연금…)을 s.log에 쌓는다. DOM 접근 금지.
// 문구는 data/economy-data.js의 logText에만 있다.
globalThis.LG = globalThis.LG || {};

(() => {
  const T = () => LG.data.economy.logText;
  const debtOf = (s) => s.loans.reduce((t, l) => t + l.bal, 0);
  const groupOf = (age) => {
    let name = '';
    for (const [from, label] of LG.data.economy.ageGroups) if (age >= from) name = label;
    return name;
  };

  LG.lifelog = {
    // kind: choice | luck | note | life | money | mark
    add(s, kind, text, age = s.age) {
      s.log = s.log || [];
      if (text) s.log.push({ age, kind, text });
    },

    // 결산 전 모습
    snap(s) {
      return { job: s.job, housing: s.housing.type, spouse: !!s.spouse, kids: s.children.length, debt: debtOf(s), nw: LG.economy.netWorth(s) };
    },

    // 결산이 끝난 뒤: 바뀐 것을 문장으로 남긴다. age = 방금 끝난 해의 나이, h = 그해 시장, sum = 결산 요약
    after(s, b, age, h, sum) {
      const L = T(), add = (kind, text) => LG.lifelog.add(s, kind, text, age), jobs = LG.data.economy.jobs;
      if (h.isRecession) add('life', L.recession);
      else if (h.index >= L.boomAt && s.assets.index + s.assets.stock + s.assets.coin > 0) add('life', L.boom); // 투자한 게 있을 때만
      if (s.job !== b.job) add('life', s.job ? L.job(jobs[s.job].label) : L.jobEnd);
      if (s.housing.type !== b.housing) add('life', L.housing[s.housing.type]);
      if (s.spouse && !b.spouse) add('life', L.spouse);
      if (s.children.length > b.kids) add('life', L.child);
      if (sum.borrowed) add('life', L.borrowed);
      if (b.debt > 0 && debtOf(s) === 0) add('life', L.debtFree);
      if (age === LG.data.economy.pension.startAge && s.workYears > 0) add('life', L.pension);
      const nw = LG.economy.netWorth(s), best = s.flags.bestNw || 0;
      const passed = L.milestones.filter((m) => nw >= m && best < m);
      if (passed.length) add('life', L.milestone(LG.economy.formatMoney(passed[passed.length - 1])));
      s.flags.bestNw = Math.max(best, nw);
      add('money', L.year(LG.economy.formatMoney(sum.income), LG.economy.formatMoney(sum.spend + sum.interest + sum.principal), LG.economy.formatMoney(sum.net)));
      if (groupOf(age + 1) !== groupOf(age) && age < LG.data.economy.endAge) LG.lifelog.add(s, 'life', L.grow(groupOf(age + 1)), age + 1);
    },
  };
})();
