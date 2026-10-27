// 아바타 몸체 32x32: 4종(색 바꾸기) x 6연령대 x 2프레임(숨쉬기). 팔레트 번호는 sweetie16.
// 연령대 순서: 어린이·청소년·청년·어른·중년·노년 (data/economy-data.js ageGroups와 같은 순서)
const SKIN = 4;
// 아바타 4종: 머리색, 윗옷색, 바지색
const LOOKS = [
  { hair: 0, top: 9, pants: 15 },   // 파랑이
  { hair: 15, top: 3, pants: 8 },   // 주황이
  { hair: 1, top: 6, pants: 7 },    // 초록이
  { hair: 1, top: 2, pants: 14 },   // 빨강이
];
// 연령대별 모양: 키(발~머리), 머리 반지름, 몸통 너비, 흰머리, 지팡이
const AGES = [
  { h: 19, head: 5, body: 6, gray: false, cane: false },
  { h: 24, head: 5, body: 7, gray: false, cane: false },
  { h: 27, head: 5, body: 8, gray: false, cane: false },
  { h: 28, head: 5, body: 9, gray: false, cane: false },
  { h: 27, head: 5, body: 9, gray: true, cane: false },
  { h: 25, head: 5, body: 8, gray: true, cane: true },
];

module.exports = (px) => {
  function draw(look, age, f) {
    const c = px.canvas(32, 32), foot = 30, bob = f ? 1 : 0; // 2번 프레임: 머리·몸통이 1칸 내려앉음
    const top = foot - age.h + bob, hx = 16, hy = top + age.head;
    const legTop = foot - Math.round(age.h * 0.3), bodyTop = hy + age.head - 1 + 0;
    const hair = age.gray ? 13 : look.hair;
    c.rect(hx - 4, legTop, 3, foot - legTop + 1, look.pants).rect(hx + 1, legTop, 3, foot - legTop + 1, look.pants); // 다리
    c.rect(hx - 4, foot, 3, 1, 15).rect(hx + 1, foot, 3, 1, 15);                                                       // 신발
    c.rect(hx - age.body / 2, bodyTop, age.body, legTop - bodyTop + 1, look.top);                                      // 몸통
    c.rect(hx - age.body / 2 - 2, bodyTop + 1, 2, 5, look.top).rect(hx + age.body / 2, bodyTop + 1, 2, 5, look.top);   // 팔
    c.rect(hx - age.body / 2 - 2, bodyTop + 6, 2, 1, SKIN).rect(hx + age.body / 2, bodyTop + 6, 2, 1, SKIN);          // 손
    c.circle(hx, hy, age.head, SKIN);                                                                                  // 얼굴
    c.rect(hx - age.head, hy - age.head, age.head * 2 + 1, 3, hair).rect(hx - age.head, hy - 1, 2, 3, hair);            // 머리카락
    c.set(hx - 2, hy + 1, 0).set(hx + 2, hy + 1, 0).set(hx, hy + 3, 3);                                                // 눈·입
    if (age.cane) c.line(hx + age.body / 2 + 3, bodyTop + 5, hx + age.body / 2 + 3, foot, 3);
    return c.outline(0);
  }
  const frames = [];
  LOOKS.forEach((look, a) => AGES.forEach((age, g) => [0, 1].forEach((f) => frames.push({ name: `${a}_${g}_${f}`, canvas: draw(look, age, f) }))));
  return [{ sheet: 'avatar', cols: 12, frames }];
};
