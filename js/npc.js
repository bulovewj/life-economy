// 한 사람의 인생을 12→80세까지 돌리는 러너 + 규칙 기반 친구(NPC). DOM 접근 금지.
// 러너는 시뮬레이션(tools/sim.js)과 친구 계산에서 같이 쓴다. 친구는 AI가 아니라 data/endings-data.js의 규칙대로 고른다.
globalThis.LG = globalThis.LG || {};

(() => {
  const val = LG.effects.val;
  const jobs = () => LG.data.economy.jobs;

  // 선택지 하나가 어떤 성격인지 숫자로 뽑는다 (확률 분기는 확률로 가중)
  function features(s, c) {
    const f = { cashOut: 0, debt: 0, happy: 0, other: 0, save: 0, invest: 0, risk: 0, exp: 0, jobPay: 0, safeJob: 0, riskJob: 0 };
    const num = (e) => { try { return Number(val(e.v, s)) || 0; } catch (x) { return 0; } };
    const walk = (list, w) => (list || []).forEach((e) => {
      const v = num(e) * w;
      if (e.t === 'cash') { if (v < 0) f.cashOut -= v; else f.save += v; }
      else if (e.t === 'recurring') {
        if (e.what === 'expense') f.cashOut += v * e.years * 0.3;
        else if (e.what === 'income') f.save += v * e.years * 0.3;
        else if (e.k === 'happiness') f.happy += v * e.years * 0.5;
        else f.other += v * e.years * 0.5;
      } else if (e.t === 'stat') { if (e.k === 'happiness') f.happy += v; else f.other += v * 0.5; }
      else if (e.t === 'asset') { if (['deposit', 'emergency'].includes(e.k)) f.save += v; else f.invest += v * (e.k === 'car' ? 0 : 1); }
      else if (e.t === 'debt') f.debt += v;
      else if (e.t === 'transfer') f.save += v;
      else if (e.t === 'stake') { f.risk += 3 * w; f.invest += (e.frac || 0.3) * 10 * w; }
      else if (e.t === 'risk' || e.t === 'liquidate') f.risk += w;
      else if (e.t === 'buyIndex') f.invest += 3 * w;
      else if (e.t === 'buyHouse') { f.debt += e.loanRatio * 1000 * w; f.invest += 3 * w; }
      else if (e.t === 'move' && e.to === 'jeonse') f.debt += 1000 * w;
      else if (e.t === 'flag' && ['비상금', '통장', '저축습관', '목표저축'].includes(e.k)) f.save += 2 * w;
      else if (e.t === 'count' && e.k === '경험소비') f.exp += w;
      else if (e.t === 'setting' && e.k === 'saveRate') f.save += v * 10;
      else if (e.t === 'raise') f.save += (e.f - 1) * 10 * w;
      else if (e.t === 'job') {
        const key = val(e.key, s), J = key && jobs()[key];
        if (J) {
          f.jobPay += (J.salary / 1000) * w;
          f.safeJob += key === 'civil' ? w : 0;
          f.riskJob += J.random ? w : 0;
        }
      }
    });
    walk(c.effects, 1);
    if (c.chance) {
      f.risk += 1;
      let left = 1;
      c.chance.forEach((b, i) => {
        const p = i < c.chance.length - 1 ? Math.min(left, Number(val(b.p, s)) || 0) : left;
        left -= p;
        walk(b.effects, p);
      });
    }
    return f;
  }

  const score = (s, c, w) => Object.entries(features(s, c)).reduce((t, [k, v]) => t + (w[k] || 0) * v, 0);

  LG.npc = {
    // 한 인생을 끝까지 돌린다. h = {choose(blk,s)→선택지|null, focus(s)→키, onWallet(s), stuck(id,s), year(s,요약)}
    run(s, hist, h) {
      const resolve = (blk, id) => {
        for (;;) {
          const c = h.choose(blk, s);
          if (!c) { if (h.stuck) h.stuck(id, s); return; }
          const out = LG.events.pick(s, c);
          if (out.retry) continue;
          if (out.sub) resolve(out.sub, `${id}/sub`);
          if (out.ui === 'wallet' && h.onWallet) h.onWallet(s);
          return;
        }
      };
      while (s.age <= LG.data.economy.endAge) {
        LG.events.startYear(s);
        LG.events.applyFocus(s, h.focus(s));
        const ev = LG.events.due(s, hist);
        if (ev) { if (h.seen) h.seen(ev.id); s.lastDecisionAge = s.age; resolve(ev, ev.id); }
        const card = LG.events.luck(s, !!ev);
        if (card) { if (h.seen) h.seen(card.id); if (card.choices.length > 1) s.lastDecisionAge = s.age; resolve(card, card.id); }
        LG.events.stories(s).forEach((x) => h.seen && h.seen(x.id)); // 인생 이야기·작은 일(브라우저와 같은 순서)
        const d = LG.events.daily(s);
        if (d && h.seen) h.seen(d.id);
        LG.events.yearlyStats(s); // 올해 고른 몇 년 효과도 올해부터 적용
        const sum = LG.economy.settleYear(s, hist[s.age - LG.data.economy.startAge]);
        if (h.year) h.year(s, sum);
      }
      return s;
    },

    // 친구 한 명의 인생. 같은 세계(역사)에서 규칙대로만 움직인다.
    simulate(npc, seed, hist, fair, index) {
      const s = LG.state.newState(seed * 10 + index + 1, fair);
      s.name = npc.name;
      LG.events.schedule(s);
      const r = LG.rng.create(seed * 17 + index); // 결혼 같은 '50%' 선택용(게임 난수와 분리)
      const pickBest = (blk) => {
        const ok = blk.choices.filter((c) => LG.events.available(s, c).ok);
        if (!ok.length) return null;
        const fixed = npc.fixed[blk.id];
        if (fixed !== undefined && blk.choices[fixed] && ok.includes(blk.choices[fixed])) return blk.choices[fixed];
        const coin = npc.coin[blk.id];
        if (coin) { const c = blk.choices[r.pick(coin)]; if (ok.includes(c)) return c; }
        return ok.map((c) => ({ c, v: score(s, c, npc.weights) })).sort((a, b) => b.v - a.v)[0].c;
      };
      return LG.npc.run(s, hist, {
        choose: (blk) => pickBest(blk),
        focus: () => npc.focus,
        year: (st) => { if (!st.dependent && st.age >= 25) { st.saveRate = npc.saveRate; st.alloc = { ...npc.alloc }; } },
      });
    },

    // 친구 4명 모두
    all(seed, hist, fair) {
      return LG.data.npcs.map((n, i) => ({ npc: n, s: LG.npc.simulate(n, seed, hist, fair, i) }));
    },
  };
})();
