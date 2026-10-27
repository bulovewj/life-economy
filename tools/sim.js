// 사용: node tools/sim.js [시드수=1000] [basic|events|npc]   (FAIR=0 이면 무작위 시작 카드, 시드는 실제처럼 4자리 1000번부터)
// 실패(NaN·막힌 이벤트·결정성 불일치·친구 기준 미달)면 종료 코드 1
//  basic : 선택 없이 "중소기업 + 월세 + 저축 20%"로 12→80세 (경제 엔진만)
//  events: 이벤트·운 카드 선택지를 무작위로 골라 12→80세 (이벤트 엔진 전체). NaN·막힌 이벤트·등장 빈도 확인
const path = require('path');
globalThis.LG = {};
['data/economy-data', 'data/events-data', 'data/events-young-data', 'data/events-adult-data', 'data/events-senior-data',
  'data/random-events-data', 'data/daily-events-data', 'data/story-events-data', 'data/terms-data', 'data/endings-data', 'js/rng', 'js/state', 'js/economy', 'js/housing', 'js/effects', 'js/events', 'js/npc']
  .forEach((f) => require(path.join('..', f)));
const E = LG.economy, f = E.formatMoney;
if (process.env.PLACE) LG.data.economy.fairPick.place = process.env.PLACE; // PLACE=mid 처럼 사는 곳 바꿔 보기
const FAIR = process.env.FAIR !== '0', BASE = 999; // 시드 = 1000, 1001, …

function playBasic(seed) {
  const s = LG.state.newState(seed, true);
  const hist = E.generateHistory(LG.rng.create(seed + 1));
  for (let age = 12; age <= 80; age++) {
    if (age === 22) { E.startJob(s, 'smallco'); s.dependent = false; s.allowance = 0; }
    if (age === 25) { LG.housing.moveTo(s, 'wolse'); s.saveRate = 0.2; s.alloc = { deposit: 20, index: 80, stock: 0, coin: 0 }; }
    if (age === 60) s.cash += E.retire(s);
    E.settleYear(s, hist[age - 12]);
  }
  return s;
}

// 이벤트 엔진 전체를 무작위 선택으로 돌린다 (플레이와 같은 순서, 러너는 js/npc.js와 공유)
function playEvents(seed, stats) {
  const s = LG.state.newState(seed, FAIR), r = LG.rng.create(seed * 31 + 7); // 선택용 난수(게임 난수와 분리)
  const hist = E.generateHistory(LG.rng.create(seed + 1));
  LG.events.schedule(s);
  const mine = new Set(); // 이 인생에서 본 이벤트(시드 비율용)
  const out = LG.npc.run(s, hist, {
    choose(blk) { const ok = blk.choices.filter((c) => LG.events.available(s, c).ok); return ok.length ? ok[r.int(0, ok.length - 1)] : null; },
    focus: () => r.pick(Object.keys(LG.data.economy.focus)),
    onWallet() { s.saveRate = r.pick([0, 0.1, 0.2, 0.3, 0.5]); const a = r.int(0, 100); s.alloc = { deposit: 100 - a, index: a, stock: 0, coin: 0 }; },
    stuck: (id) => stats.stuck.push(`${id}@${s.age}`),
    seen: (id) => { stats.seen[id] = (stats.seen[id] || 0) + 1; mine.add(id); },
    year(st, sum) {
      if (sum.borrowed) stats.borrowYears++;
      const nums = [st.cash, ...Object.values(st.assets), ...Object.values(st.stats), ...st.loans.map((l) => l.bal), E.netWorth(st), st.salary];
      if (nums.some((v) => !Number.isFinite(v)) || Object.values(st.stats).some((v) => v < 0 || v > 100) || st.loans.some((l) => l.bal < 0) || st.cash < 0) stats.bad.push(`seed ${seed} age ${st.age}`);
    },
  });
  mine.forEach((id) => { stats.seeds[id] = (stats.seeds[id] || 0) + 1; });
  return out;
}

// 친구 4명 분포: 1,000시드 평균 순자산 순서(꾸준이 ≥ 차곡이 > 오늘이, 한방이는 흩어짐이 가장 큼)
function npcReport(n) {
  const names = LG.data.npcs.map((x) => x.name), vals = names.map(() => []);
  for (let seed = BASE + 1; seed <= BASE + n; seed++) {
    const hist = E.generateHistory(LG.rng.create(seed + 1));
    LG.npc.all(seed, hist, FAIR).forEach((x, i) => { JSON.parse(JSON.stringify(x.s)); vals[i].push(E.netWorth(x.s) / x.s.priceLevel); });
  }
  const rows = names.map((name, i) => {
    const v = vals[i].sort((a, b) => a - b), m = v.reduce((t, x) => t + x, 0) / n;
    const sd = Math.sqrt(v.reduce((t, x) => t + (x - m) ** 2, 0) / n);
    return { name, mean: m, med: v[n >> 1], sd, cv: sd / Math.abs(m), neg: v.filter((x) => x < 0).length };
  });
  console.log(`친구 4명 ${n}시드 (오늘 물가 기준 순자산):`);
  rows.forEach((r) => console.log(`  ${r.name}: 평균 ${f(r.mean)} 중앙값 ${f(r.med)} 표준편차 ${f(r.sd)} (평균 대비 ${r.cv.toFixed(2)}) 마이너스 ${r.neg}건`));
  const m = Object.fromEntries(rows.map((r) => [r.name, r]));
  const sdMax = rows.every((r) => r.name === '한방이' || m['한방이'].sd >= r.sd); // 시나리오: "한방이는 분산 최대"
  const ok = [m['꾸준이'].mean >= m['차곡이'].mean, m['차곡이'].mean > m['오늘이'].mean, sdMax];
  console.log(`  기준: 꾸준이≥차곡이 ${ok[0]}, 차곡이>오늘이 ${ok[1]}, 한방이 표준편차(분산) 최대 ${ok[2]}`);
  return ok.every(Boolean);
}

const n = Number(process.argv[2]) || 1000, mode = process.argv[3] || 'basic';
if (mode === 'npc') process.exit(npcReport(n) ? 0 : 1);
const stats = { seen: {}, seeds: {}, stuck: [], bad: [], borrowYears: 0 };
const worth = [], jobs = {}, own = { house: 0, spouse: 0, kids: 0 };
for (let seed = BASE + 1; seed <= BASE + n; seed++) {
  const s = mode === 'events' ? playEvents(seed, stats) : playBasic(seed);
  worth.push(E.netWorth(s));
  own.house += s.history.some((h) => h.house) ? 1 : 0; own.spouse += s.spouse ? 1 : 0; own.kids += s.children.length ? 1 : 0;
  jobs[s.history.at(-1).job] = (jobs[s.history.at(-1).job] || 0) + 1;
  if (mode !== 'events' && s.history.some((h) => Object.values(h).some((v) => typeof v === 'number' && !Number.isFinite(v)))) stats.bad.push(`seed ${seed}`);
}
worth.sort((a, b) => a - b);
const avg = worth.reduce((t, v) => t + v, 0) / n;
console.log(`[${mode}] 시드 ${n}개, 80세 순자산 평균 ${f(avg)} / 중앙값 ${f(worth[n >> 1])} / 최소 ${f(worth[0])} / 최대 ${f(worth[n - 1])}`);
console.log(`NaN·범위 오류: ${stats.bad.length}건${stats.bad.length ? ' ' + stats.bad.slice(0, 5).join(', ') : ''}, 마지막에 순자산 마이너스: ${worth.filter((v) => v < 0).length}건`);
if (mode === 'events') {
  console.log(`선택지가 모두 막힌 이벤트: ${stats.stuck.length}건${stats.stuck.length ? ' ' + [...new Set(stats.stuck)].slice(0, 8).join(', ') : ''}`);
  console.log(`내 집을 가진 적 있는 시드 ${Math.round((own.house / n) * 100)}%, 결혼 ${Math.round((own.spouse / n) * 100)}%, 자녀 ${Math.round((own.kids / n) * 100)}%`);
  console.log(`돈이 모자라 빌린 해: 시드당 평균 ${(stats.borrowYears / n).toFixed(1)}년`);
  const all = [...LG.data.events, ...LG.data.luck.cards, ...LG.data.daily.list, ...LG.data.stories.list].map((e) => e.id);
  console.log('등장(시드 중 % / 시드당 평균 횟수): ' + all.map((id) => `${id}:${Math.round(((stats.seeds[id] || 0) / n) * 100)}%/${((stats.seen[id] || 0) / n).toFixed(1)}`).join(' '));
  const never = all.filter((id) => !stats.seen[id]);
  console.log(`한 번도 안 나온 것: ${never.length ? never.join(', ') : '없음'}`);
}
const dummy = () => ({ seen: {}, seeds: {}, stuck: [], bad: [] });
const a = JSON.stringify(mode === 'events' ? playEvents(1234, dummy()).history : playBasic(1234).history);
const b = JSON.stringify(mode === 'events' ? playEvents(1234, dummy()).history : playBasic(1234).history);
console.log(`같은 시드 결과 동일: ${a === b}, formatMoney(12300)="${f(12300)}"`);
if (stats.bad.length || stats.stuck.length || a !== b || f(12300) !== '1억 2,300만원') { console.log('실패'); process.exitCode = 1; }
