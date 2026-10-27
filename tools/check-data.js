// 사용: node tools/check-data.js
// 시나리오 ID 전부 존재 · 선택지 tip 40자 이내 · 마지막 선택지 항상 가능 · 금지어 · 효과 종류·참조 검사
const path = require('path');
globalThis.LG = {};
const files = ['economy-data', 'events-data', 'events-young-data', 'events-adult-data', 'events-senior-data', 'random-events-data', 'terms-data', 'endings-data']
  .map((f) => `data/${f}`);
[...files, 'js/rng', 'js/state', 'js/economy', 'js/housing', 'js/effects', 'js/events'].forEach((f) => require(path.join('..', f)));

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const BANNED = ['잘못된 선택', '실패한 인생', '나쁜 선택', '좋은 선택', '올바른 선택', '틀린 선택', '한심', '최악의'];
const MAX = 40;
const base = LG.state.newState(1, true);
const val = (v) => { try { return typeof v === 'function' ? v(base) : v; } catch (e) { return undefined; } };

// 문장(. ? ! 기준) 하나가 40자 이내인지, 금지어가 없는지
function text(where, str) {
  if (typeof str !== 'string') return;
  str.split(/(?<=[.?!])\s+/).forEach((sen) => sen.length > MAX && err(where, `문장 ${sen.length}자: "${sen}"`));
  BANNED.forEach((w) => str.includes(w) && err(where, `금지어 "${w}"`));
}

function effects(where, list, ids) {
  (list || []).forEach((e) => {
    if (!LG.effects.types.includes(e.t)) err(where, `알 수 없는 효과 종류 ${e.t}`);
    if ((e.t === 'delayed' || e.t === 'risk' || e.t === 'stake' || (e.t === 'retire' && e.mode === 'stake'))) {
      const host = ids[e.ev];
      if (!host || !host.later || !host.later[e.key]) err(where, `later 참조 없음: ${e.ev}.${e.key}`);
    }
    if (e.t === 'sub') e.choices.forEach((c, i) => choice(`${where}/sub${i + 1}`, c, ids));
    if (e.t === 'stat' && typeof e.v === 'number' && Math.abs(e.v) > 30) err(where, `능력치 변화가 너무 커요: ${e.v}`);
  });
}

function block(where, b, ids) {
  text(`${where} 문구`, typeof b.text === 'string' ? b.text : '');
  text(`${where} tip`, b.tip);
  effects(where, b.effects, ids);
  if (b.chance) b.chance.forEach((c, i) => {
    if (i < b.chance.length - 1 && c.p === undefined) err(where, `chance ${i + 1}번에 p가 없어요`);
    block(`${where}/chance${i + 1}`, c, ids);
  });
}

function choice(where, c, ids) {
  const hasSub = (c.effects || []).some((e) => e.t === 'sub');
  if (!hasSub && !c.tip) err(where, `tip이 없어요: ${c.label}`);
  if (c.tip && c.tip.length > MAX) err(where, `tip ${c.tip.length}자`);
  BANNED.forEach((w) => c.label.includes(w) && err(where, `라벨 금지어 ${w}`));
  block(where, c, ids);
}

// 마지막 선택지는 조건·필요 금액 없이 언제나 고를 수 있어야 한다
function lastAlways(where, choices) {
  const c = choices[choices.length - 1];
  if (c.cond || c.need) return err(where, `마지막 선택지에 cond/need가 있어요: ${c.label}`);
  if (c.forced) return;
  const cost = -(c.effects || []).filter((e) => e.t === 'cash').map((e) => val(e.v)).filter((v) => v < 0).reduce((t, v) => t + v, 0);
  if (cost > 0) err(where, `마지막 선택지가 돈(${cost}만원)이 필요해요: ${c.label}`);
}

const events = LG.data.events, luck = LG.data.luck, ids = {};
[...events, ...luck.cards, luck.debtCard].forEach((e) => { ids[e.id] = e; });

// ID 존재
const want = [];
for (let i = 1; i <= 34; i++) want.push('E' + String(i).padStart(2, '0'));
for (let i = 1; i <= 16; i++) want.push('R' + String(i).padStart(2, '0'));
want.forEach((id) => ids[id] || err(id, '데이터에 없어요'));
[12, 20, 30, 50, 70].forEach((a) => LG.data.markers[a] || err('마디', `${a}세 질문 없음`));
if (Object.keys(LG.data.terms).length !== 18) err('용어', `18개여야 하는데 ${Object.keys(LG.data.terms).length}개`);
let titles = 'M5에서 확인';
if (LG.data.titles) {
  titles = `${LG.data.titles.length}개`;
  if (LG.data.titles.length !== 10) err('칭호', '10개여야 해요');
}

// 이벤트·운 카드 내용
for (const ev of [...events, ...luck.cards, luck.debtCard]) {
  text(`${ev.id} 본문`, typeof ev.text === 'string' ? ev.text : '');
  (ev.terms || []).forEach((t) => LG.data.terms[t] || err(ev.id, `용어 카드 없음: ${t}`));
  if (!ev.choices || !ev.choices.length) { err(ev.id, '선택지 없음'); continue; }
  ev.choices.forEach((c, i) => choice(`${ev.id}-${i + 1}`, c, ids));
  lastAlways(ev.id, ev.choices);
  (ev.choices.flatMap((c) => c.effects || []).filter((e) => e.t === 'sub')).forEach((e) => lastAlways(`${ev.id}/sub`, e.choices));
  Object.entries(ev.later || {}).forEach(([k, b]) => block(`${ev.id}.later.${k}`, b, ids));
  if (ev.fallback) { text(`${ev.id} fallback`, ev.fallback.text); if (!ev.fallback.tip) err(ev.id, 'fallback tip 없음'); }
  if (!ev.age && !ev.when && !luck.cards.includes(ev) && ev !== luck.debtCard) err(ev.id, 'age 또는 when이 필요해요');
}
Object.values(LG.data.terms).forEach((t) => text(`용어 ${t.name}`, t.desc));
Object.values(LG.data.markers).forEach((q) => text('마디', q));
LG.data.titles.forEach((t) => { text(`칭호 ${t.name}`, t.desc); text(`칭호 ${t.name}`, t.name); });
Object.entries(LG.data.endingTexts).forEach(([k, v]) => text(`엔딩문구 ${k}`, v));
LG.data.npcs.forEach((n) => text(`친구 ${n.name}`, n.desc));

console.log(`이벤트 ${events.length}개, 운 카드 ${luck.cards.length}개, 마디 ${Object.keys(LG.data.markers).length}개, 용어 ${Object.keys(LG.data.terms).length}개, 칭호 ${titles}`);
if (errors.length) { console.log(`\n문제 ${errors.length}건:`); errors.forEach((e) => console.log(' -', e)); process.exit(1); }
console.log('OK: 모든 검사를 통과했어요.');
