// 장소 배경 160x90 (4장): 교실 school · 가게 shop · 병원 hospital · 예식장 wedding. 팔레트 번호는 sweetie16.
module.exports = (px) => {
  const W = 160, H = 90;
  const win = (c, x, y, w, h) => { c.rect(x - 1, y - 1, w + 2, h + 2, 12).rect(x, y, w, h, 11).rect(x + w / 2, y, 1, h, 12).rect(x, y + h / 2, w, 1, 12); };

  const school = px.canvas(W, H); // 교실: 칠판, 책상, 창문
  school.rect(0, 0, W, 64, 5).rect(0, 0, W, 6, 6).rect(0, 64, W, 26, 3);
  for (let y = 64; y < H; y += 6) school.rect(0, y, W, 1, 2);
  school.rect(14, 10, 80, 34, 14).rect(16, 12, 76, 30, 7).rect(22, 18, 20, 1, 12).rect(22, 24, 34, 1, 12).rect(22, 30, 26, 1, 12).rect(14, 44, 80, 2, 3);
  win(school, 112, 10, 34, 30);
  [[10, 58], [48, 58], [86, 58], [124, 58]].forEach(([x, y]) => school.rect(x, y, 26, 4, 3).rect(x + 2, y + 4, 2, 10, 15).rect(x + 22, y + 4, 2, 10, 15));
  school.rect(100, 18, 6, 6, 12).circle(103, 21, 2, 2); // 시계

  const shop = px.canvas(W, H); // 가게·작업장: 간판, 진열대, 계산대
  shop.rect(0, 0, W, 66, 12).rect(0, 0, W, 14, 6).rect(0, 66, W, 24, 13);
  for (let x = 0; x < W; x += 16) shop.rect(x, 14, 8, 4, 12).rect(x + 8, 14, 8, 4, 5);
  for (let r = 0; r < 3; r++) {
    shop.rect(10, 24 + r * 14, 56, 2, 14);
    for (let i = 0; i < 7; i++) shop.rect(12 + i * 8, 18 + r * 14, 6, 6, [2, 4, 9, 6, 3, 10, 1][(i + r) % 7]);
  }
  shop.rect(92, 44, 56, 22, 3).rect(92, 42, 56, 3, 15).rect(110, 32, 16, 10, 15).rect(112, 34, 12, 6, 11);
  win(shop, 98, 22, 20, 14);

  const hospital = px.canvas(W, H); // 병원: 흰 벽, 십자 표시, 침대, 커튼
  hospital.rect(0, 0, W, 66, 12).rect(0, 58, W, 8, 11).rect(0, 66, W, 24, 13);
  hospital.rect(18, 10, 22, 22, 12).rect(26, 13, 6, 16, 2).rect(21, 18, 16, 6, 2);
  win(hospital, 112, 10, 34, 26);
  hospital.rect(52, 46, 64, 12, 12).rect(52, 44, 14, 6, 10).rect(52, 58, 3, 10, 14).rect(113, 58, 3, 10, 14).rect(66, 46, 50, 4, 10);
  for (let x = 0; x < 30; x += 4) hospital.rect(124 + x, 40, 2, 26, 10);

  const wedding = px.canvas(W, H); // 예식장: 꽃 아치, 길, 의자
  wedding.rect(0, 0, W, 64, 12).rect(0, 64, W, 26, 13).rect(70, 64, 20, 26, 2);
  for (let i = 0; i < 26; i++) {
    const a = Math.PI - (i / 25) * Math.PI, x = 80 + Math.cos(a) * 34, y = 52 - Math.sin(a) * 40;
    wedding.circle(x, y, 3, [2, 12, 4, 3][i % 4]);
  }
  wedding.rect(44, 52, 4, 14, 6).rect(112, 52, 4, 14, 6);
  [[16, 68], [36, 68], [116, 68], [136, 68]].forEach(([x, y]) => wedding.rect(x, y, 12, 3, 12).rect(x, y - 8, 2, 8, 12).rect(x + 1, y + 3, 1, 6, 14).rect(x + 10, y + 3, 1, 6, 14));
  for (let i = 0; i < 14; i++) wedding.set((i * 41 + 7) % W, (i * 17 + 4) % 40, [2, 4, 11][i % 3]);

  const frames = Object.entries({ school, shop, hospital, wedding }).map(([name, canvas]) => ({ name, canvas }));
  return [{ sheet: 'places', cols: 2, frames }];
};
