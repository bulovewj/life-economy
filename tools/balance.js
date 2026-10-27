// 사용: node tools/balance.js [시드수=200] [이벤트ID ...]
// 갈림길·운 카드의 선택지마다 "그 선택을 했을 때 80세 결과가 평균보다 얼마나 다른지" 표로 보여 준다.
// 같은 시드(같은 경제 역사)로 한 칸씩만 바꿔 비교한다. 선택에 따라 뒤의 개인 운(확률 결과·운 카드)은 달라질 수 있다.
// 그 선택지를 실제로 고를 수 있었던 시드만 비교한다(못 고른 실행은 제외하고 개수를 보여 줌).
// ★ = 같은 이벤트의 다른 선택지보다 다섯 영역 모두에서 오차 이상 앞섬("정답 선택지" 후보).
const path = require('path');
globalThis.LG = {};
['data/economy-data', 'data/events-data', 'data/events-young-data', 'data/events-adult-data', 'data/events-senior-data',
  'data/random-events-data', 'data/daily-events-data', 'data/story-events-data', 'data/terms-data', 'data/endings-data', 'js/rng', 'js/state', 'js/economy', 'js/housing', 'js/effects', 'js/events', 'js/npc']
  .forEach((f) => require(path.join('..', f)));

const N = Number(process.argv[2]) || 200, only = process.argv.slice(3);
const hash = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const all = [...LG.data.events, ...LG.data.luck.cards, LG.data.luck.debtCard];

// force = {id, i}: 그 이벤트가 나오면 i번째 선택지(가능하면). 다른 결정은 (시드, 이벤트, 나이)로 정해져서 비교 때마다 같다.
function life(seed, force) {
  const s = LG.state.newState(seed, true), fired = {};
  let forced = null; // 강제한 선택을 실제로 했나: 'ok' | 'blocked'
  const hist = LG.economy.generateHistory(LG.rng.create(seed + 1));
  LG.events.schedule(s);
  const rnd = (key) => LG.rng.create(seed * 1000003 + hash(key) + s.age * 7919);
  LG.npc.run(s, hist, {
    choose(blk) {
      const ok = blk.choices.filter((c) => LG.events.available(s, c).ok);
      if (!ok.length) return null;
      if (blk.id) fired[blk.id] = fired[blk.id] || { n: 0 };
      if (blk.id && force && force.id === blk.id && forced === null) {
        forced = ok.includes(blk.choices[force.i]) ? 'ok' : 'blocked';
        if (forced === 'ok') return blk.choices[force.i];
      }
      return ok[rnd(blk.id || blk.title || 'sub').int(0, ok.length - 1)];
    },
    onWallet() { const r = rnd('wallet'); s.saveRate = r.pick([0, 0.1, 0.2, 0.3, 0.5]); const a = r.int(0, 100); s.alloc = { deposit: 100 - a, index: a, stock: 0, coin: 0 }; },
    seen: (id) => { fired[id] = { n: 1 }; },
  });
  return { fired, forced, m: [LG.economy.netWorth(s) / s.priceLevel, s.stats.happiness, s.stats.health, s.stats.relation, s.stats.skill] };
}

const SEED0 = 1000, seeds = Array.from({ length: N }, (_, i) => SEED0 + i); // 실제처럼 4자리 시드
const base = seeds.map((sd) => life(sd, null));
const mean = (rows) => rows[0].map((_, k) => rows.reduce((t, r) => t + r[k], 0) / rows.length);
const f = LG.economy.formatMoney, sign = (v, d = 1) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);
let flagged = 0;

for (const ev of all.filter((e) => !only.length || only.includes(e.id))) {
  const hit = seeds.filter((sd) => base[sd - SEED0].fired[ev.id] && base[sd - SEED0].fired[ev.id].n);
  if (hit.length < 10) { console.log(`${ev.id} ${ev.title}: 등장 ${hit.length}회뿐이라 건너뜀`); continue; }
  const rows = ev.choices.map((c, i) => {
    const runs = hit.map((sd) => ({ sd, r: life(sd, { id: ev.id, i }) })).filter((x) => x.r.forced === 'ok');
    if (!runs.length) return { c, d: null, n: 0, skip: hit.length };
    const ref = mean(runs.map((x) => base[x.sd - SEED0].m)), avg = mean(runs.map((x) => x.r.m)); // 같은 시드끼리 비교
    return { c, d: avg.map((v, k) => v - ref[k]), n: runs.length, skip: hit.length - runs.length };
  });
  console.log(`\n${ev.id} ${ev.title} (등장 ${hit.length}/${N})`);
  const TOL = [100, 0.5, 0.5, 0.5, 0.5]; // 돈 100만원, 능력치 0.5 이상 차이여야 '앞섬'
  const live = rows.filter((r) => r.d);
  rows.forEach((r, i) => {
    const head = `  ${i + 1}. ${r.c.label.slice(0, 22).padEnd(24)}`;
    if (!r.d) { console.log(`${head} 고를 수 있었던 시드 없음 (제외 ${r.skip})`); return; }
    const better = live.length > 1 && live.every((o) => o === r || r.d.every((v, k) => v - o.d[k] > TOL[k]));
    if (better) flagged++;
    console.log(`${head} 돈 ${(r.d[0] >= 0 ? '+' : '−') + f(Math.abs(r.d[0]))}`.padEnd(52)
      + ` 행복 ${sign(r.d[1])} 건강 ${sign(r.d[2])} 관계 ${sign(r.d[3])} 실력 ${sign(r.d[4])}  (실행 ${r.n}, 제외 ${r.skip})${better ? '  ★ 모든 영역에서 앞섬' : ''}`);
  });
}
console.log(`\n★ 표시: ${flagged}개 (시드 ${N}개. 값은 그 선택을 실제로 한 시드들의 '무작위로 골랐을 때' 평균과의 차이, 돈은 오늘 물가 기준)`);
