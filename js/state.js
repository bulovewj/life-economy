// 게임 상태. JSON으로 저장되므로 함수·Map 금지.
globalThis.LG = globalThis.LG || {};

LG.state = {
  // seed: 세계 번호(경제 역사). playerSeed: 내 선택·운 난수(공정 모드에선 세계와 같게)
  newState(seed, fair = true, playerSeed = seed) {
    const D = LG.data.economy;
    const s = {
      v: 1, seed, fair, name: '', gender: 'm',
      age: D.startAge,
      stats: { happiness: D.start.happiness, health: D.start.health, relation: D.start.relation, skill: D.start.skill },
      cash: D.start.cash,
      assets: { emergency: 0, deposit: 0, index: 0, stock: 0, coin: 0, house: 0, car: 0, lease: 0 },
      loans: [],
      dependent: true, // 부모님이 생활비를 내는 동안
      allowance: 0, partTime: 0,
      job: null, salary: 0, jobYears: 0, workYears: 0, pensionMul: 1,
      spouse: null, children: [],
      housing: { type: 'parent', rent: 0 },
      recurring: [], // {kind:'income'|'expense', amount, endAge}
      saveRate: 0, alloc: { deposit: 100, index: 0, stock: 0, coin: 0 },
      focus: 'study',
      priceLevel: 1, housingIdx: 1,
      path: '', schedule: {}, done: {}, yearly: [], delayed: [], risks: [], terms: {}, // 이벤트 엔진용
      paused: null, rateShift: null, crashApplied: 0, retired: false, joblessYears: 0, startedAge: 0, yearNotes: [], marks: {},
      cards: {}, support: {}, flags: {}, history: [], timeline: [], log: [],
      yearOut: 0, yearIn: 0, board: null, boardPrev: null, yearStart: null, lastDecisionAge: -9, // 현황판·자산판
      rngState: (Number(playerSeed) >>> 0) || 1, // 플레이어용 난수 스트림(역사는 seed+1 따로)
    };
    const r = LG.state.rngOf(s);
    for (const k of Object.keys(D.cards)) {
      s.cards[k] = fair ? D.fairPick[k] : LG.state.weighted(r, D.cards[k]);
    }
    s.support = { ...D.cards.support[s.cards.support] };
    s.allowance = s.support.allowance;
    if (s.cards.talent !== 'none') s.stats.skill += D.talentSkill;
    return s;
  },

  // state에 난수 위치를 저장해 가며 뽑는 난수기. 저장·이어하기 후에도 같은 결과.
  rngOf(s) {
    const r = LG.rng.create(s.seed, s.rngState);
    const sync = (fn) => (...a) => {
      const v = fn(...a);
      s.rngState = r.getState();
      return v;
    };
    return { next: sync(r.next), int: sync(r.int), pick: sync(r.pick), normal: sync(r.normal) };
  },

  // {키: {weight}} 표에서 가중치대로 키 하나
  weighted(r, table) {
    const keys = Object.keys(table).filter((k) => table[k].weight > 0);
    let x = r.next() * keys.reduce((t, k) => t + table[k].weight, 0);
    for (const k of keys) {
      x -= table[k].weight;
      if (x < 0) return k;
    }
    return keys[keys.length - 1];
  },
};
