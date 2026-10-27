// 이벤트 아이콘 24x24 (16개). 이름은 data/events-*.js의 icon 값과 같다. 팔레트 번호는 sweetie16.
module.exports = (px) => {
  const mk = (draw) => { const c = px.canvas(24, 24); draw(c); return c.outline(0); };
  const icons = {
    coin: (c) => c.circle(12, 12, 8, 4).circle(12, 12, 5, 3).rect(11, 8, 2, 8, 4).rect(9, 11, 6, 2, 4).rect(5, 8, 2, 2, 12),
    piggy: (c) => {
      c.ellipse(11, 13, 8, 6, 2).rect(18, 11, 3, 4, 2).rect(20, 12, 1, 2, 0).rect(7, 18, 3, 3, 2).rect(14, 18, 3, 3, 2);
      c.rect(6, 5, 4, 3, 2).rect(9, 7, 4, 1, 0).set(15, 11, 0).rect(3, 12, 2, 2, 2).rect(9, 9, 5, 1, 0).rect(7, 9, 1, 1, 12);
    },
    card: (c) => c.rect(2, 6, 20, 13, 9).rect(2, 9, 20, 3, 15).rect(4, 14, 6, 3, 4).rect(13, 15, 7, 1, 12).rect(3, 7, 18, 1, 10),
    phone: (c) => c.rect(7, 2, 10, 20, 15).rect(8, 4, 8, 13, 10).rect(10, 19, 4, 1, 12).rect(9, 6, 4, 2, 12).rect(10, 11, 5, 4, 11),
    house: (c) => {
      for (let i = 0; i < 8; i++) c.rect(12 - 1 - i, 4 + i, 2 + i * 2, 1, 2);
      c.rect(5, 12, 14, 9, 12).rect(10, 15, 4, 6, 3).rect(6, 13, 3, 3, 10).rect(15, 13, 3, 3, 10);
    },
    key: (c) => c.circle(8, 8, 5, 4).circle(8, 8, 2, 12).rect(11, 11, 3, 3, 4).rect(13, 13, 3, 3, 4).rect(15, 15, 3, 3, 4).rect(18, 17, 3, 2, 4).rect(18, 19, 2, 2, 4),
    chart: (c) => c.rect(3, 3, 2, 18, 15).rect(3, 19, 18, 2, 15).rect(7, 13, 3, 6, 6).rect(12, 9, 3, 10, 9).rect(17, 5, 3, 14, 2),
    'coin-crypto': (c) => c.circle(12, 12, 8, 8).circle(12, 12, 6, 9).rect(11, 6, 2, 12, 11).rect(9, 8, 6, 2, 11).rect(9, 14, 6, 2, 11).rect(14, 10, 2, 5, 11).rect(8, 10, 2, 2, 11),
    car: (c) => c.rect(2, 12, 20, 6, 2).rect(5, 7, 14, 6, 2).rect(7, 8, 4, 4, 11).rect(13, 8, 4, 4, 11).circle(7, 18, 3, 15).circle(17, 18, 3, 15).circle(7, 18, 1, 13).circle(17, 18, 1, 13),
    ring: (c) => c.circle(12, 15, 6, 4).circle(12, 15, 4, 0).rect(10, 5, 4, 4, 11).rect(11, 4, 2, 1, 12).rect(11, 9, 2, 1, 10),
    baby: (c) => c.circle(12, 12, 9, 4).rect(10, 3, 4, 2, 3).rect(8, 10, 2, 2, 0).rect(14, 10, 2, 2, 0).rect(10, 16, 4, 1, 2).rect(5, 13, 3, 2, 3).rect(16, 13, 3, 2, 3),
    briefcase: (c) => c.rect(2, 8, 20, 12, 3).rect(8, 4, 8, 4, 14).rect(10, 5, 4, 2, 3).rect(2, 13, 20, 2, 2).rect(10, 12, 4, 4, 4),
    hospital: (c) => c.rect(3, 4, 18, 17, 12).rect(10, 7, 4, 11, 2).rect(7, 10, 10, 4, 2).rect(3, 4, 18, 2, 13),
    shield: (c) => {
      c.rect(4, 3, 16, 11, 10);
      for (let i = 0; i < 8; i++) c.rect(4 + i, 14 + i, 16 - i * 2, 1, 10);
      c.rect(10, 8, 2, 2, 12).rect(12, 10, 2, 2, 12).rect(14, 8, 2, 2, 12).rect(16, 6, 2, 2, 12);
    },
    warning: (c) => {
      for (let i = 0; i < 18; i++) c.rect(12 - Math.floor(i / 2), 3 + i, 1 + Math.floor(i / 2) * 2, 1, 4);
      c.rect(11, 9, 2, 6, 0).rect(11, 17, 2, 2, 0);
    },
    gift: (c) => c.rect(3, 9, 18, 12, 2).rect(2, 6, 20, 4, 3).rect(11, 6, 2, 15, 4).rect(8, 3, 4, 3, 4).rect(12, 3, 4, 3, 4),
  };
  return [{ sheet: 'icons24', cols: 8, frames: Object.entries(icons).map(([name, draw]) => ({ name, canvas: mk(draw) })) }];
};
