// 효과 처리기: 이벤트·선택지의 effects 한 줄({t:종류, ...})을 state에 적용한다. DOM 접근 금지.
// v와 key는 (s, ctx)=>값 함수도 가능. ctx는 지연 효과에 실려 온 값({amt} 등).
globalThis.LG = globalThis.LG || {};

(() => {
  const val = (v, s, ctx) => (typeof v === 'function' ? v(s, ctx) : v);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const J = (key) => LG.data.economy.jobs[key];
  const rng = (s) => LG.state.rngOf(s);
  const putLater = (s, due, e, data) => s.delayed.push({ due, ev: e.ev, key: e.key, data });

  // 모은 돈(비상금 제외)의 frac만큼 꺼내서 묶어 둔다
  function stake(s, e, v) {
    const A = s.assets, pool = s.cash + A.deposit + A.index + A.stock + A.coin;
    const want = Math.round(e.amt !== undefined ? v : e.frac * pool);
    putLater(s, s.age + e.years, e, { amt: want - Math.round(LG.economy.take(s, want)) });
  }

  const H = {
    stat: (s, e, v) => { s.stats[e.k] = clamp(s.stats[e.k] + v, 0, 100); },
    cash(s, e, v) {
      if (v >= 0) { s.cash += v; s.yearIn = (s.yearIn || 0) + v; return; }
      s.yearOut = (s.yearOut || 0) - v; // 현황판: 올해 이벤트로 쓴 돈
      const left = LG.economy.take(s, -v);
      if (left > 0 && !s.dependent) LG.economy.addLoan(s, 'credit', left);
    },
    asset: (s, e, v) => { s.assets[e.k] = Math.max(0, s.assets[e.k] + v); },
    // 통장 사이 옮기기: 현금에서 빼서 e.to에 넣는다(현금이 모자라면 있는 만큼만). 순자산은 그대로
    transfer(s, e, v) { const amt = Math.max(0, Math.min(v, s.cash)); s.cash -= amt; s.assets[e.to] += amt; },
    mult: (s, e) => { s.assets[e.k] *= e.f; },
    debt: (s, e, v) => LG.economy.addLoan(s, e.k, v),
    flag: (s, e, v) => { s.flags[e.k] = e.v === undefined ? true : v; },
    count: (s, e) => { s.flags[e.k] = (s.flags[e.k] || 0) + 1; },
    job(s, e, v, ctx) {
      const key = val(e.key, s, ctx);
      LG.economy.startJob(s, key);
      LG.effects.rollSalary(s);
    },
    path: (s, e, v) => { s.path = v; },
    dependent: (s, e, v) => { s.dependent = v; },
    setting: (s, e, v) => { s[e.k] = v; },
    recurring(s, e, v) { // 몇 년간 매년: what = expense | income | stat, from = 몇 년 뒤부터
      const startAge = s.age + (e.from || 0), endAge = startAge + e.years - 1;
      if (e.what === 'stat') s.yearly.push({ k: e.k, v, startAge, endAge });
      else s.recurring.push({ kind: e.what, amount: v, startAge, endAge });
    },
    delayed: (s, e) => putLater(s, s.age + e.years, e), // ev.later[key]를 나중에 실행
    risk: (s, e) => s.risks.push({ ev: e.ev, key: e.key, endAge: s.age + e.years }), // 다음 해부터 years번, 해마다 later[key].p 확률로 실행
    stake,
    move: (s, e) => LG.housing.moveTo(s, e.to),
    buyHouse(s, e, v, ctx, out) {
      if (!LG.housing.buy(s, e.factor, e.loanRatio).ok && e.failText) out.notes.push(e.failText);
    },
    upsize: (s) => LG.housing.upsize(s),
    prepay: (s) => LG.housing.prepay(s),
    changeCity: (s, e) => LG.housing.changeCity(s, e.place),
    raise: (s, e) => { s.salary = Math.round(s.salary * e.f); },
    pause(s, e, v) { // 일을 쉰다. 기간이 끝나면 mult배 월급으로 돌아온다
      s.paused = { job: s.job, salary: s.salary, until: s.age + e.years, mult: val(e.mult, s) || 1 };
      LG.economy.startJob(s, null);
    },
    spouse(s) {
      const key = rng(s).pick(LG.data.economy.spouseJobs);
      s.spouse = { job: key, salary: Math.round(J(key).salary * s.priceLevel) };
      s.flags['결혼나이'] = s.age;
    },
    child: (s) => { s.children.push(s.age); },
    retire(s, e) { // lump: 한꺼번에 / annuity: 15년 나눠서 / stake: 묶어 두기(지연 효과로 결과)
      const pay = LG.economy.retire(s);
      s.retired = true; // 은퇴한 사람에게는 일자리 제안(X01)을 하지 않는다
      if (e.mode === 'annuity') s.recurring.push({ kind: 'income', amount: Math.round(pay / 15), startAge: s.age, endAge: s.age + 14 });
      else if (e.mode === 'stake') putLater(s, s.age + e.years, e, { amt: pay });
      else s.cash += pay;
    },
    liquidate(s) {
      for (const k of ['index', 'stock', 'coin']) { s.assets.deposit += s.assets[k]; s.assets[k] = 0; }
    },
    buyIndex(s, e) { // 현금·비상금의 frac을 지수펀드로
      const amt = Math.round(e.frac * (s.cash + s.assets.emergency));
      s.assets.index += amt - LG.economy.take(s, amt);
    },
    reschedule(s, e) {
      if (s.age >= e.age) return;
      s.schedule[e.ev] = e.age;
      s.done[e.ev] = false;
    },
    // 침체 갈림길이 열릴 때: 그해 폭락을 먼저 적용한다(결산에서 다시 적용하지 않음). ctx.year = 그해 시장 기록
    crash(s, e, v, ctx) {
      for (const k of ['index', 'stock', 'coin']) s.assets[k] *= 1 + ctx.year[k];
      s.crashApplied = s.age;
    },
    rateShift: (s, e) => { s.rateShift = { loan: e.loan, dep: e.dep, until: s.age + e.years - 1 }; },
    debtRelief: (s, e) => s.loans.forEach((l) => { if (l.floating) l.rate = Math.min(l.rate, e.rate); }),
    ui: (s, e, v, ctx, out) => { out.ui = e.v; },
    retry: (s, e, v, ctx, out) => { out.retry = true; },
  };

  LG.effects = {
    val,
    types: Object.keys(H).concat('sub'),
    apply(s, e, ctx, out) {
      if (H[e.t]) H[e.t](s, e, val(e.v, s, ctx), ctx, out || { notes: [] });
    },
    // random:[최소,최대]인 직업(프리랜서·창업 준비)은 해마다 월급을 새로 정한다
    rollSalary(s) {
      const R = s.job && J(s.job).random;
      if (R) s.salary = Math.round(rng(s).int(R[0], R[1]) * s.priceLevel);
    },
  };
})();
