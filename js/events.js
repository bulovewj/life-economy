// 이벤트 엔진: 배정·조건·선택 처리·해 시작 처리·운 카드. DOM 접근 금지. 문구는 data/에만 있다.
// 갈림길 하나 = {id, age:[최소,최대] 또는 when:(s,h)=>bool, cond, fallback, title, text, choices, later:{키:블록}}
globalThis.LG = globalThis.LG || {};

(() => {
  const val = LG.effects.val;
  const byId = (id) => LG.data.events.concat(LG.data.luck.cards).find((e) => e.id === id); // 운 카드도 later를 가질 수 있다

  // chance 목록에서 하나 고른다. 마지막 항목은 나머지 확률 전부.
  function roll(s, list, ctx) {
    const r = LG.state.rngOf(s).next();
    let acc = 0;
    for (let i = 0; i < list.length - 1; i++) {
      acc += val(list[i].p, s, ctx);
      if (r < acc) return list[i];
    }
    return list[list.length - 1];
  }

  function run(s, blk, ctx, out) {
    if (blk.text) out.notes.push(val(blk.text, s, ctx));
    for (const e of blk.effects || []) {
      if (e.t === 'sub') out.sub = e;
      else LG.effects.apply(s, e, ctx, out);
    }
    if (blk.chance) {
      const b = roll(s, blk.chance, ctx);
      if (b.tip) out.tip = b.tip;
      run(s, b, ctx, out);
    }
  }

  LG.events = {
    // 게임 시작 때: 나이 범위(age)가 있는 이벤트를 범위 안 무작위 1년에 배정(같은 해에 겹치지 않게)
    schedule(s) {
      const r = LG.state.rngOf(s), used = {};
      const list = LG.data.events.filter((e) => e.age).sort((a, b) => a.age[1] - a.age[0] - (b.age[1] - b.age[0]));
      for (const ev of list) {
        const free = [];
        for (let a = ev.age[0]; a <= ev.age[1]; a++) if (!used[a]) free.push(a);
        s.schedule[ev.id] = free.length ? free[r.int(0, free.length - 1)] : ev.age[1];
        used[s.schedule[ev.id]] = true;
      }
    },

    // 올해 나올 갈림길 1개(없으면 null). 나오는 순간 '했음'으로 표시. 겹친 건 다음 해로 미룬다.
    due(s, h) {
      const all = LG.data.events;
      for (const ev of all.filter((e) => !s.done[e.id] && (e.when || s.schedule[e.id] === s.age))) {
        let shown = ev;
        if (ev.when) { if (!ev.when(s, h)) continue; }
        else if (ev.cond && !ev.cond(s)) {
          s.done[ev.id] = true;
          if (!ev.fallback) continue;
          shown = { id: ev.id, title: ev.title, icon: ev.icon, text: ev.fallback.text,
            choices: [{ label: ev.fallback.label, tip: ev.fallback.tip, effects: ev.fallback.effects }] };
        }
        if (!ev.repeat) s.done[ev.id] = true;
        if (ev.before) run(s, { effects: ev.before }, { year: h[s.age - LG.data.economy.startAge] }, { notes: [] }); // 열리기 전에 일어난 일
        all.filter((o) => o !== ev && !o.when && !s.done[o.id] && s.schedule[o.id] === s.age)
          .forEach((o) => { s.schedule[o.id] = Math.min(s.age + 1, LG.data.economy.endAge); });
        return shown;
      }
      return null;
    },

    // 선택지를 고를 수 있나? need(필요한 돈) 또는 직접 쓰는 돈(cash 마이너스)이 모은 돈보다 크면 불가
    available(s, c) {
      if (c.cond && !c.cond(s)) return { ok: false, reason: c.disabledReason || '' };
      if (c.forced) return { ok: true, reason: '' }; // 어쩔 수 없이 나가는 돈(모자라면 빌린다)
      const spend = -(c.effects || []).filter((e) => e.t === 'cash').map((e) => val(e.v, s)).filter((v) => v < 0).reduce((t, v) => t + v, 0);
      const cost = Math.max(spend, c.need ? val(c.need, s) : 0), have = LG.housing.liquid(s);
      if (cost > have) return { ok: false, reason: `모은 돈이 ${LG.economy.formatMoney(Math.ceil(cost - have))} 부족해요.` };
      return { ok: true, reason: '' };
    },

    // 선택(또는 블록) 하나를 적용한다 → {notes, tip, sub, retry, ui}
    pick(s, blk, ctx) {
      const out = { notes: [], tip: blk.tip || '', sub: null, retry: false, ui: null };
      run(s, blk, ctx, out);
      return out;
    },

    // 해가 시작될 때 한 번: 쉬던 일 복귀, 기한 된 지연 효과, 해마다 확률 효과, 월급 새로 정하기. 알릴 문장 목록을 돌려준다.
    startYear(s) {
      if (s.startedAge === s.age) return s.yearNotes; // 지갑 갔다 오기 등으로 다시 그려도 한 번만
      s.startedAge = s.age;
      const notes = [], out = () => ({ notes, tip: '', sub: null, retry: false, ui: null });
      if (s.paused && s.age >= s.paused.until) {
        const p = s.paused;
        Object.assign(s, { job: p.job, salary: Math.round(p.salary * p.mult), paused: null });
        notes.push(LG.data.economy.messages.resume);
      }
      const ready = s.delayed.filter((d) => d.due <= s.age);
      s.delayed = s.delayed.filter((d) => d.due > s.age);
      ready.forEach((d) => run(s, byId(d.ev).later[d.key], d.data, out()));
      s.risks = s.risks.filter((r) => r.endAge >= s.age);
      for (const r of s.risks) {
        const blk = byId(r.ev).later[r.key];
        if (LG.state.rngOf(s).next() < val(blk.p, s)) run(s, blk, null, out());
      }
      LG.effects.rollSalary(s);
      s.joblessYears = !s.job && !s.dependent && !s.paused ? s.joblessYears + 1 : 0;
      s.yearNotes = notes;
      return notes;
    },

    // 올해의 집중 → 능력치
    applyFocus(s, key) {
      s.focus = key;
      for (const [k, v] of Object.entries(LG.data.economy.focus[key].stats)) LG.effects.apply(s, { t: 'stat', k, v });
    },

    // 몇 년간 매년 오르내리는 능력치(recurring stat)
    yearlyStats(s) {
      s.yearly = s.yearly.filter((y) => y.endAge >= s.age);
      s.yearly.filter((y) => (y.startAge || 0) <= s.age).forEach((y) => LG.effects.apply(s, { t: 'stat', k: y.k, v: y.v }));
      // 자연 변화: 휴식값 쪽으로 조금씩
      const D = LG.data.economy.drift, h = D.health;
      const rest = { ...D.rest, health: h.base - Math.max(0, s.age - h.from) * h.perYear };
      for (const k of Object.keys(rest)) s.stats[k] = Math.min(100, Math.max(0, s.stats[k] + (rest[k] - s.stats[k]) * D.rate));
    },

    // 운 카드: 빚이 너무 많으면 상담 카드, 아니면 확률(갈림길 있는 해는 낮게)로 한 장. 없으면 null
    luck(s, hadEvent) {
      const L = LG.data.luck, E = LG.economy;
      const debt = s.loans.filter((l) => l.kind !== 'student').reduce((t, l) => t + l.bal, 0); // 학자금은 취업 후 갚는 빚이라 제외
      if (debt > L.debtMin && debt > 3 * Math.max(E.netWorth(s), 1) && (s.flags.debtCardAge || -99) < s.age - L.debtGap) {
        s.flags.debtCardAge = s.age;
        return L.debtCard;
      }
      const r = LG.state.rngOf(s);
      if (r.next() >= (hadEvent ? L.rateBusy : L.rate)) return null;
      const pool = {};
      L.cards.filter((c) => !c.cond || c.cond(s)).forEach((c) => { pool[c.id] = c; });
      if (!Object.keys(pool).length) return null;
      return pool[LG.state.weighted(r, pool)];
    },

    snap: (s) => ({ ...s.stats, netWorth: LG.economy.netWorth(s) }),
    diff(a, b) {
      const d = {};
      for (const k of Object.keys(a)) if (b[k] !== a[k]) d[k] = Math.round(b[k] - a[k]);
      return d;
    },
  };
})();
