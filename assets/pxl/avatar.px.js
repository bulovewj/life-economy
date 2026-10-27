// 아바타 몸체 32x32: 성별 2(m 남자·f 여자) x 나이대 6 x 옷 5 x 숨쉬기 2프레임. 팔레트 번호는 sweetie16.
// 나이대 순서: 어린이·청소년·청년·어른·중년·노년 (data/economy-data.js ageGroups와 같은 순서)
// 옷: casual 사복 · uniform 교복 · suit 정장 · work 작업복(앞치마) · cardigan 카디건. 프레임 이름 = `${성별}_${나이대}_${옷}_${프레임}`
const SKIN = 4;
const HAIR = { m: 0, f: 1 };
// top 윗옷 · bottom 바지/치마 · inner 안쪽 셔츠 · tie 넥타이 · collar 옷깃 · apron 앞치마 · skirt 여자는 치마
const OUTFITS = {
  casual: { m: { top: 9, bottom: 8 }, f: { top: 3, bottom: 7 } },
  uniform: { m: { top: 15, bottom: 14, collar: 12, tie: 2 }, f: { top: 15, bottom: 8, collar: 12, tie: 2, skirt: true } },
  suit: { m: { top: 14, bottom: 14, inner: 12, tie: 9 }, f: { top: 14, bottom: 14, inner: 12, skirt: true } },
  work: { m: { top: 12, bottom: 15, apron: 6 }, f: { top: 12, bottom: 15, apron: 6 } },
  cardigan: { m: { top: 3, bottom: 14, inner: 13 }, f: { top: 2, bottom: 14, inner: 13 } },
};
// 나이대별 모양: 키(발~머리), 머리 반지름, 몸통 너비, 흰머리, 지팡이
const AGES = [
  { h: 19, head: 5, body: 6, gray: false, cane: false },
  { h: 24, head: 5, body: 7, gray: false, cane: false },
  { h: 27, head: 5, body: 8, gray: false, cane: false },
  { h: 28, head: 5, body: 9, gray: false, cane: false },
  { h: 27, head: 5, body: 9, gray: true, cane: false },
  { h: 25, head: 5, body: 8, gray: true, cane: true },
];

module.exports = (px) => {
  function draw(g, age, outfit, f) {
    const c = px.canvas(32, 32), O = OUTFITS[outfit][g], foot = 30, bob = f ? 1 : 0; // 2번 프레임: 머리·몸통이 1칸 내려앉음
    const top = foot - age.h + bob, hx = 16, hy = top + age.head;
    const legTop = foot - Math.round(age.h * 0.3), bodyTop = hy + age.head - 1, half = age.body / 2;
    const hair = age.gray ? 13 : HAIR[g];
    if (O.skirt) { // 치마 + 다리
      c.rect(hx - half, legTop, age.body, 3, O.bottom);
      c.rect(hx - 3, legTop + 3, 2, foot - legTop - 3, SKIN).rect(hx + 1, legTop + 3, 2, foot - legTop - 3, SKIN);
    } else c.rect(hx - 4, legTop, 3, foot - legTop + 1, O.bottom).rect(hx + 1, legTop, 3, foot - legTop + 1, O.bottom);
    c.rect(hx - 4, foot, 3, 1, 0).rect(hx + 1, foot, 3, 1, 0);                                                     // 신발
    c.rect(hx - half, bodyTop, age.body, legTop - bodyTop + (O.skirt ? 0 : 1), O.top);                            // 몸통
    if (O.inner) c.rect(hx - 1, bodyTop, 2, legTop - bodyTop, O.inner);                                           // 안쪽 셔츠
    if (O.tie) c.rect(hx, bodyTop + 1, 1, 4, O.tie);                                                               // 넥타이
    if (O.collar) c.set(hx - 2, bodyTop, O.collar).set(hx + 1, bodyTop, O.collar);                                 // 옷깃
    if (O.apron) c.rect(hx - half + 1, bodyTop + 2, age.body - 2, legTop - bodyTop, O.apron);                      // 앞치마
    c.rect(hx - half - 2, bodyTop + 1, 2, 5, O.top).rect(hx + half, bodyTop + 1, 2, 5, O.top);                     // 팔
    c.rect(hx - half - 2, bodyTop + 6, 2, 1, SKIN).rect(hx + half, bodyTop + 6, 2, 1, SKIN);                      // 손
    c.circle(hx, hy, age.head, SKIN);                                                                              // 얼굴
    c.rect(hx - age.head, hy - age.head, age.head * 2 + 1, 3, hair);                                               // 앞머리
    if (g === 'f') c.rect(hx - age.head - 1, hy - 2, 2, age.head + 5, hair).rect(hx + age.head, hy - 2, 2, age.head + 5, hair); // 긴 머리
    else c.rect(hx - age.head, hy - 1, 2, 3, hair);                                                                // 옆머리
    c.set(hx - 2, hy + 1, 0).set(hx + 2, hy + 1, 0).set(hx, hy + 3, 3);                                            // 눈·입
    if (age.cane) c.line(hx + half + 3, bodyTop + 5, hx + half + 3, foot, 3);
    return c.outline(0);
  }
  const frames = [];
  ['m', 'f'].forEach((g) => AGES.forEach((age, a) => Object.keys(OUTFITS).forEach((o) =>
    [0, 1].forEach((f) => frames.push({ name: `${g}_${a}_${o}_${f}`, canvas: draw(g, age, o, f) })))));
  return [{ sheet: 'avatar', cols: 10, frames }];
};
