// 사용: node tools/regress.js
// 코드 검토(docs/코드검토_개선사항.md)의 재현 사례가 다시 생기면 실패(종료 코드 1)한다. 화면 문제(R06·R11)는 브라우저에서 확인.
const path = require('path');
globalThis.LG = {};
['data/economy-data', 'data/events-data', 'data/events-young-data', 'data/events-adult-data', 'data/events-senior-data',
  'data/random-events-data', 'data/daily-events-data', 'data/story-events-data', 'data/terms-data', 'data/endings-data', 'js/rng', 'js/state', 'js/economy', 'js/housing', 'js/effects', 'js/events', 'js/lifelog', 'js/npc', 'js/save']
  .forEach((f) => require(path.join('..', f)));
const E = LG.economy, ev = (id) => LG.data.events.find((e) => e.id === id);
let fails = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? '통과' : '실패'} ${name}${ok ? '' : `  ← ${detail}`}`); if (!ok) fails++; };

// 일하는 어른 한 명(물가 1, 시장 변동 없음)
function adult(age = 30) {
  const s = LG.state.newState(1234, true);
  Object.assign(s, { age, dependent: false, cash: 10 });
  E.startJob(s, 'smallco');
  return s;
}
const flat = { index: 0, stock: 0, coin: 0, housing: 0, inflation: 0, depositRate: 0, loanAdj: 0, isRecession: false };

// R01 계좌 사이 옮기기는 순자산을 바꾸지 않는다
for (const i of [0, 2]) {
  const s = adult(25), before = E.netWorth(s);
  LG.events.pick(s, ev('E11').choices[i]);
  check(`R01 E11-${i + 1} 선택 뒤 순자산 그대로`, E.netWorth(s) === before, `${before} → ${E.netWorth(s)}`);
}

// R02 전세대출을 갚고 남는 보증금만 집 살 돈으로 본다. 모자라면 아무것도 안 바뀐다
{
  const s = adult(35);
  Object.assign(s, { cash: 0, housing: { type: 'jeonse', rent: 0 } });
  s.cards.place = 'mid'; s.assets.lease = 12000; E.addLoan(s, 'jeonse', 9600);
  const need = LG.housing.buyNeed(s, 1, 0.7), snap = JSON.stringify(s);
  check('R02 필요한 내 돈 = 9,600', need === 9600, `need=${need}`);
  check('R02 돈이 모자라면 선택 불가', !LG.events.available(s, { need: () => need }).ok);
  check('R02 실패한 구매는 상태를 바꾸지 않음', !LG.housing.buy(s, 1, 0.7).ok && JSON.stringify(s) === snap);
}

// R03 은퇴한 사람에게 일자리 제안(X01)이 오지 않는다
{
  const s = adult(60);
  LG.effects.apply(s, { t: 'retire', mode: 'lump' });
  const hist = Array.from({ length: 69 }, (_, i) => ({ ...flat, age: 12 + i }));
  let x01 = false;
  for (let a = 60; a <= 70; a++) { s.age = a; s.startedAge = 0; LG.events.startYear(s); if (LG.events.due(s, hist)?.id === 'X01') x01 = true; }
  check('R03 은퇴 뒤 80세까지 자동 취업 제안 없음', !x01 && s.joblessYears === 0, `x01=${x01} jobless=${s.joblessYears}`);
}

// R04 경기 침체 갈림길은 같은 해 다른 갈림길보다 먼저 나온다
{
  const s = adult(35); s.assets.index = 1000;
  LG.events.schedule(s); LG.data.events.forEach((e) => { if (e.id !== 'E21') s.done[e.id] = true; });
  s.done.E19 = false; s.schedule.E19 = 35;
  const hist = Array.from({ length: 69 }, (_, i) => ({ ...flat, age: 12 + i, isRecession: 12 + i === 35, index: 12 + i === 35 ? -0.3 : 0 }));
  const got = LG.events.due(s, hist);
  check('R04 35세 침체 + E19 겹침 → E21 먼저', got && got.id === 'E21', got && got.id);
  check('R04 폭락은 한 번만(지수 1000 → 700, 결산에서 다시 안 깎임)', Math.round(s.assets.index) === 700 && (E.settleYear(s, hist[23]), Math.round(s.assets.index) === 700), s.assets.index);
  check('R04 밀린 E19는 다음 해에', s.schedule.E19 === 36 && !s.done.E19);
}

// R05 범위 이벤트는 기한 안에서 조건이 맞을 때까지 기다린다
{
  const s = adult(30);
  LG.events.schedule(s); LG.data.events.forEach((e) => { s.done[e.id] = true; }); // 다른 갈림길은 모두 닫고 E20만 본다
  s.done.E20 = false; s.schedule.E20 = 30;
  LG.events.due(s, []);
  check('R05 30세 미혼이면 E20을 끝내지 않음', !s.done.E20 && s.schedule.E20 === 31);
  s.age = 31; LG.effects.apply(s, { t: 'spouse' });
  check('R05 31세 결혼하면 E20이 열림', LG.events.due(s, [])?.id === 'E20');
}

// R07 N년 효과는 N번 적용된다(브라우저·친구 러너: 선택 → yearlyStats → 결산)
{
  const D = LG.data.economy.drift, keep = D.rate; D.rate = 0;
  const s = adult(40), h0 = s.stats.health;
  LG.events.pick(s, ev('E24').choices[0]);
  for (let a = 40; a <= 44; a++) { s.age = a; LG.events.yearlyStats(s); }
  D.rate = keep;
  check('R07 부업 건강 -4 × 3년 = -12', h0 - s.stats.health === 12, `${h0} → ${s.stats.health}`);
  const r = adult(40); LG.effects.apply(r, { t: 'risk', ev: 'E15', key: 'repair', years: 3 });
  const draws = [41, 42, 43, 44].filter((a) => r.risks[0] && r.risks[0].endAge >= a).length;
  check('R07 3년 위험은 다음 해부터 3번 추첨', draws === 3, `draws=${draws}`);
}

// R08 결산 식: 수입 − (지출+이자+상환) = 남은 돈 (비싼 빚 추가 상환 포함)
{
  const s = adult(30); s.salary = 3200; E.addLoan(s, 'credit', 1000);
  const r = E.settleYear(s, flat);
  const diff = r.income - (r.spend + r.interest + r.principal) - r.net;
  check('R08 결산 식이 맞음', Math.abs(diff) <= 1, `차이 ${diff} (${JSON.stringify(r)})`);
}

// R09 부모님 보증금 지원은 한 번만
{
  const s = adult(25); s.cash = 1000; s.cards.place = 'mid';
  LG.housing.moveTo(s, 'wolse');
  const nw = E.netWorth(s);
  LG.housing.changeCity(s, 'big');
  check('R09 도시를 바꿔도 지원을 다시 받지 않음', E.netWorth(s) === nw && s.support.deposit === 0, `${nw} → ${E.netWorth(s)}, 남은 지원 ${s.support.deposit}`);
}

// R10 망가진 저장은 거절, 정상 저장은 통과
{
  check('R10 {"v":1,"age":30} 거절', LG.save.check({ v: 1, age: 30 }) === null);
  check('R10 버전 다름 거절', LG.save.check({ ...LG.state.newState(1, true), v: 2 }) === null);
  check('R10 숫자 망가짐 거절', LG.save.check({ ...LG.state.newState(1, true), cash: 'abc' }) === null);
  const ok = JSON.parse(JSON.stringify(LG.state.newState(1, true))); delete ok.log;
  check('R10 정상 저장 통과(새로 생긴 칸은 채움)', LG.save.check(ok) !== null && Array.isArray(ok.log));
}

// R12 학자금: 취업 전 이자는 빚에 쌓이고 현금·신용대출이 생기지 않는다
{
  const s = LG.state.newState(1234, true); s.age = 19; s.cash = 0;
  E.addLoan(s, 'student', 1460);
  E.settleYear(s, flat);
  const st = s.loans.find((l) => l.kind === 'student'), credit = s.loans.find((l) => l.kind === 'credit');
  check('R12 이자는 빚에 쌓임', st && st.bal > 1460 && !credit, JSON.stringify(s.loans));
}

// 리뷰 5: 아껴 살기로 줄인 생활비까지 현황판 항목 합이 결산과 맞는다
{
  const s = adult(70); LG.effects.apply(s, { t: 'retire', mode: 'lump' }); s.cash = 0;
  const r = E.settleYear(s, flat);
  const diff = r.income - (r.living + r.rent + r.fixed + r.interest + r.principal) - r.net;
  check('리뷰5 아껴 살기 해에도 현황판 합이 맞음', r.thrift && Math.abs(diff) <= 1, `thrift=${r.thrift} 차이 ${diff}`);
}

// 리뷰 6: 예전 저장의 성별·은퇴 여부를 기본값으로 덮지 않는다
{
  const old = JSON.parse(JSON.stringify(adult(62))); delete old.gender; delete old.retired; old.avatar = 1; old.job = null; old.done.E31 = true;
  old.history = Array.from({ length: old.age - 12 }, () => ({ netWorth: 0 }));
  const s = LG.save.check(old);
  check('리뷰6 색깔 아바타 1번 → 여자', s && s.gender === 'f', s && s.gender);
  check('리뷰6 퇴직을 지난 예전 저장 → 은퇴', s && s.retired === true);
}

// 리뷰 7: 손주는 자녀가 어른일 때만
{
  const s = adult(55); s.children = [45];
  const d14 = LG.data.daily.list.find((d) => d.id === 'D14');
  check('리뷰7 자녀 10살이면 손주 없음', !d14.cond(s));
  s.children = [28];
  check('리뷰7 자녀 27살이면 손주 가능', d14.cond(s));
}

// 리뷰 8: 학자금은 일을 시작한 뒤에는 은퇴해도 계속 갚아 줄어든다
{
  const s = adult(60); E.addLoan(s, 'student', 1000); s.workYears = 30;
  LG.effects.apply(s, { t: 'retire', mode: 'lump' }); s.cash = 5000;
  E.settleYear(s, flat);
  const st = s.loans.find((l) => l.kind === 'student');
  check('리뷰8 은퇴 뒤에도 학자금이 줄어듦', !st || st.bal < 1000, JSON.stringify(s.loans));
}

// 리뷰 9: 전세는 '한 달 집세 0원', 셰어하우스는 '보증금 0원'을 쓰지 않는다
{
  for (const type of ['jeonse', 'share']) {
    const s = adult(28); s.cash = 100000; s.cards.place = 'mid';
    const b = LG.lifelog.snap(s); LG.housing.moveTo(s, type);
    LG.lifelog.after(s, b, 28, flat, E.settleYear(s, flat));
    const line = s.log.find((x) => /이사했어요/.test(x.text));
    check(`리뷰9 ${type} 이사 문장에 0원 없음`, line && !/ 0원/.test(line.text), line && line.text);
  }
}

// 결정성: 같은 시드 → 같은 역사·같은 친구 결과
{
  const h = E.generateHistory(LG.rng.create(1235)), h2 = E.generateHistory(LG.rng.create(1235));
  check('같은 시드 → 같은 경제 역사', JSON.stringify(h) === JSON.stringify(h2));
  const a = LG.npc.all(1234, h, true).map((x) => E.netWorth(x.s)), b = LG.npc.all(1234, h2, true).map((x) => E.netWorth(x.s));
  check('같은 시드 → 같은 친구 결과', JSON.stringify(a) === JSON.stringify(b));
}

console.log(fails ? `\n실패 ${fails}건` : '\n모든 회귀 검사를 통과했어요.');
process.exitCode = fails ? 1 : 0;
