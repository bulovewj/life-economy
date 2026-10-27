// 경제 엔진: 80년치 시장 역사 + 1년 결산. DOM 접근 금지.
globalThis.LG = globalThis.LG || {};

// 클래식 <script>는 최상위 const를 서로 공유하므로 파일 안에 가둔다.
(() => {

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const sum = (o) => Object.values(o).reduce((t, v) => t + v, 0);

LG.economy = {
  // rng는 역사 전용 스트림(seed+1). 해마다 뽑는 횟수가 같아서 침체 여부와 무관하게 결정적.
  generateHistory(rng) {
    const D = LG.data.economy, R = D.recession;
    const rec = [];
    const tryAdd = (age) => {
      if (rec.every((r) => Math.abs(r - age) >= R.minGap)) rec.push(age);
    };
    R.windows.forEach(([a, b]) => tryAdd(rng.int(a, b)));
    const extraAge = rng.int(...R.extraRange);
    if (rng.next() < R.extraChance) tryAdd(extraAge);

    return Array.from({ length: D.endAge - D.startAge + 1 }, (_, i) => {
      const age = D.startAge + i;
      const isRecession = rec.includes(age);
      const z = {
        idx: rng.normal(D.index.mean, D.index.sd), noise: rng.normal(D.stock.noiseMean, D.stock.sd),
        crash: rng.next(), coin: rng.normal(D.coin.mean, D.coin.sd),
        house: rng.normal(D.housing.mean, D.housing.sd), infl: rng.normal(D.inflation.mean, D.inflation.sd),
      };
      const index = isRecession ? R.index : clamp(z.idx, D.index.min, D.index.max);
      const inflMax = isRecession ? D.inflation.recessionMax : D.inflation.max;
      const inflation = clamp(z.infl, D.inflation.min, inflMax);
      const depositRate = Math.max(0.005, D.depositRate + (inflation - D.inflation.mean) * 0.5);
      return {
        age, isRecession, index, inflation, depositRate,
        stock: isRecession ? R.stock : clamp(index * D.stock.beta + z.noise, D.stock.min, D.stock.max),
        coin: isRecession ? R.coin : z.crash < D.coin.crashP ? D.coin.crash : clamp(z.coin, D.coin.min, D.coin.max),
        housing: isRecession ? R.housing : clamp(z.house, D.housing.min, D.housing.max),
        loanAdj: depositRate - D.depositRate,
      };
    });
  },

  netWorth: (s) => Math.round(s.cash + sum(s.assets) - s.loans.reduce((t, l) => t + l.bal, 0)),

  // 12300 → "1억 2,300만원"
  formatMoney(n) {
    n = Math.round(n);
    const abs = Math.abs(n), eok = Math.floor(abs / 10000), man = abs % 10000;
    const manText = `${man.toLocaleString('en-US')}만원`;
    const t = eok ? (man ? `${eok}억 ${manText}` : `${eok}억원`) : manText;
    return (n < 0 ? '-' : '') + t;
  },

  addLoan(s, kind, amount) {
    const T = LG.data.economy.loans[kind];
    const same = T.left === 0 && s.loans.find((l) => l.kind === kind);
    if (same) same.bal += amount;
    else s.loans.push({ kind, bal: amount, rate: T.rate, left: T.left, floating: !!T.floating });
  },

  // key가 null이면 일을 그만둔다
  startJob(s, key) {
    const J = key && LG.data.economy.jobs[key];
    Object.assign(s, { job: key, salary: J ? Math.round(J.salary * s.priceLevel) : 0, jobYears: 0, pensionMul: J ? J.pension || 1 : s.pensionMul });
  },

  // 퇴직금 = 근속연수 × 마지막 월급. 금액을 돌려주고 일을 끝낸다(받는 방식은 호출한 쪽이 정함).
  retire(s) {
    const pay = Math.round((s.jobYears * s.salary) / 12);
    Object.assign(s, { job: null, salary: 0, jobYears: 0 });
    return pay;
  },

  // 부족한 돈 need를 현금→비상금→예금→펀드→주식→코인 순으로 채우고, 그래도 모자라면 신용대출. 빌렸으면 true
  fund(s, need) {
    const left = LG.economy.take(s, need);
    if (left > 0) LG.economy.addLoan(s, 'credit', left);
    return left > 0;
  },

  // need만큼 현금→비상금→예금→펀드→주식→코인 순으로 꺼낸다. 못 채운 금액을 돌려준다.
  take(s, need) {
    for (const k of LG.data.economy.fundOrder) {
      if (need <= 0) break;
      const have = k === 'cash' ? s.cash : s.assets[k];
      const t = Math.min(Math.max(have, 0), need);
      if (k === 'cash') s.cash -= t; else s.assets[k] -= t;
      need -= t;
    }
    return need;
  },

  // 1년 결산. h = history[age - 12]. 끝나면 나이 +1.
  settleYear(s, h) {
    const D = LG.data.economy, E = LG.economy, pl = s.priceLevel;
    const active = (k) => s.recurring.filter((r) => r.kind === k && s.age >= (r.startAge || 0) && s.age <= r.endAge).reduce((t, r) => t + r.amount, 0);
    const sh = s.rateShift && s.age <= s.rateShift.until ? s.rateShift : { loan: 0, dep: 0 }; // 금리 인상 카드

    // 1·2. 소득과 지출
    const pension = s.age >= D.pension.startAge ? Math.min(D.pension.max, s.workYears * D.pension.perYear) * pl * s.pensionMul : 0;
    let income = s.dependent
      ? s.allowance * 12 + s.partTime
      : ((s.job ? s.salary : 0) + (s.spouse && s.age < D.spouseRetireAge ? s.spouse.salary : 0)) * D.netRate + s.partTime + pension;
    income += active('income');
    if (s.focus === 'work') income *= 1 + D.focusRate.workIncome;
    const kids = s.children.reduce((t, b) => {
      const a = s.age - b;
      return t + (a < 0 || a > 18 ? 0 : a <= 6 ? D.living.childYoung : D.living.childSchool);
    }, 0);
    const living = (s.spouse ? D.living.couple : D.living.single) + kids;
    let spend = s.dependent ? income * D.minorSpendRate : living * pl + s.housing.rent;
    if (s.focus === 'people') spend *= 1 + D.focusRate.peopleSpend;
    spend += active('expense');

    // 3. 이자와 원금 상환 (원리금균등)
    let interest = 0, principal = 0;
    const pay = s.loans.map((l) => {
      const rate = l.floating ? Math.max(0, l.rate + h.loanAdj + sh.loan) : l.rate;
      const i = l.bal * rate;
      let p = 0;
      if (l.left > 0 && (l.kind !== 'student' || s.job)) {
        const pmt = rate ? (l.bal * rate) / (1 - Math.pow(1 + rate, -l.left)) : l.bal / l.left;
        p = Math.min(l.bal, pmt - i);
      }
      interest += i; principal += p;
      return { l, p };
    });
    pay.forEach(({ l, p }) => { l.bal -= p; if (l.left > 0 && p > 0) l.left -= 1; });

    // 4~6. 남은 돈 처리
    let net = income - spend - interest - principal, borrowed = false, invest = 0;
    if (net < 0) borrowed = E.fund(s, -net);
    else {
      for (const k of D.repayFirst) {
        const l = s.loans.find((x) => x.kind === k);
        if (l && net > 0) { const p = Math.min(l.bal, net); l.bal -= p; net -= p; }
      }
      invest = s.dependent ? 0 : net * s.saveRate;
      for (const [k, w] of Object.entries(s.alloc)) s.assets[k] += (invest * w) / 100;
      s.cash += net - invest;
    }
    s.loans = s.loans.filter((l) => l.bal > 0.5);

    // 7·8. 가격 갱신과 해가 바뀌는 처리
    const A = s.assets;
    A.deposit *= 1 + h.depositRate + sh.dep; A.emergency *= 1 + h.depositRate + sh.dep;
    if (s.crashApplied !== s.age) { A.index *= 1 + h.index; A.stock *= 1 + h.stock; A.coin *= 1 + h.coin; } // 침체 갈림길에서 이미 반영했으면 건너뜀
    A.house *= 1 + h.housing; A.car *= 1 - D.carDepreciation;
    s.housingIdx *= 1 + h.housing;
    s.priceLevel *= 1 + h.inflation;
    s.housing.rent *= 1 + h.inflation;
    if (s.job) { s.salary *= 1 + D.raise; s.jobYears++; s.workYears++; }
    if (s.spouse) s.spouse.salary *= 1 + D.raise;
    s.cash = Math.round(s.cash);
    for (const k of Object.keys(A)) A[k] = Math.round(A[k]);
    s.loans.forEach((l) => { l.bal = Math.round(l.bal); });
    s.salary = Math.round(s.salary);

    // 9. 기록
    const st = s.stats;
    s.history.push({ age: s.age, netWorth: E.netWorth(s), happiness: st.happiness, health: st.health,
      relation: st.relation, skill: st.skill, income: Math.round(income), spend: Math.round(spend),
      saved: Math.round(invest), job: s.job, house: Math.round(s.assets.house), rate: s.dependent ? -1 : s.saveRate });
    s.age += 1;
    return { income: Math.round(income), spend: Math.round(spend), interest: Math.round(interest),
      principal: Math.round(principal), net: Math.round(net), borrowed };
  },
};
})();
