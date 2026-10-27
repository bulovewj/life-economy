// UI 아이콘 16x16 (12개): 능력치·돈·버튼용. 팔레트 번호는 sweetie16.
module.exports = (px) => {
  const mk = (draw) => { const c = px.canvas(16, 16); draw(c); return c.outline(0); };
  const icons = {
    happy: (c) => c.circle(5, 6, 3, 2).circle(10, 6, 3, 2).rect(3, 7, 10, 3, 2).rect(5, 10, 6, 2, 2).rect(7, 12, 2, 1, 2).rect(4, 4, 2, 2, 3),
    health: (c) => c.circle(8, 10, 5, 2).rect(7, 2, 2, 3, 15).rect(9, 3, 3, 2, 6).rect(4, 8, 2, 2, 3),
    relation: (c) => c.rect(3, 6, 10, 7, 4).rect(3, 3, 2, 4, 4).rect(6, 2, 2, 5, 4).rect(9, 2, 2, 5, 4).rect(12, 4, 2, 4, 4).rect(2, 8, 2, 3, 4),
    skill: (c) => c.rect(2, 3, 12, 11, 9).rect(3, 4, 5, 9, 12).rect(9, 4, 4, 9, 12).rect(8, 3, 1, 11, 15).rect(4, 6, 3, 1, 14).rect(10, 6, 2, 1, 14),
    money: (c) => c.circle(8, 8, 6, 4).circle(8, 8, 4, 3).rect(7, 5, 2, 6, 4).rect(5, 7, 6, 2, 4),
    debt: (c) => { for (let i = 0; i < 3; i++) c.ellipse(5 + i * 3, 6 + i * 2, 3, 2, 14).ellipse(5 + i * 3, 6 + i * 2, 1, 1, 0); },
    next: (c) => c.rect(2, 6, 7, 4, 12).rect(9, 3, 2, 10, 12).rect(11, 5, 2, 6, 12).rect(13, 7, 1, 2, 12),
    auto: (c) => c.rect(1, 3, 2, 10, 12).rect(3, 5, 2, 6, 12).rect(5, 7, 1, 2, 12).rect(8, 3, 2, 10, 12).rect(10, 5, 2, 6, 12).rect(12, 7, 1, 2, 12),
    wallet: (c) => c.rect(2, 4, 12, 9, 3).rect(2, 4, 12, 2, 2).rect(10, 8, 4, 3, 4).rect(11, 9, 1, 1, 0),
    gear: (c) => c.circle(8, 8, 5, 13).circle(8, 8, 2, 0).rect(7, 1, 2, 3, 13).rect(7, 12, 2, 3, 13).rect(1, 7, 3, 2, 13).rect(12, 7, 3, 2, 13),
    print: (c) => c.rect(4, 2, 8, 4, 12).rect(2, 6, 12, 6, 14).rect(4, 10, 8, 5, 12).rect(5, 12, 6, 1, 14).rect(11, 7, 2, 1, 6),
    dict: (c) => c.rect(3, 2, 10, 12, 3).rect(4, 3, 8, 10, 4).rect(5, 5, 6, 1, 3).rect(5, 8, 6, 1, 3).rect(10, 2, 2, 5, 2),
  };
  return [{ sheet: 'icons16', cols: 12, frames: Object.entries(icons).map(([name, draw]) => ({ name, canvas: mk(draw) })) }];
};
