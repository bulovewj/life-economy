// 배경 160x90 (6장): 연령대별. 팔레트 번호는 sweetie16. 이름은 ageGroups 순서와 맞춰 쓴다(room campus home office park night).
module.exports = (px) => {
  const W = 160, H = 90;
  const bands = (c, colors, y0, y1) => colors.forEach((col, i) => c.rect(0, y0 + Math.floor(((y1 - y0) * i) / colors.length), W, Math.ceil((y1 - y0) / colors.length) + 1, col));
  const tree = (c, x, y, big) => { c.rect(x - 1, y, 3, big ? 12 : 8, 3); c.circle(x, y - 2, big ? 8 : 5, 6).circle(x - 3, y, big ? 5 : 3, 7).circle(x + 3, y - 1, big ? 5 : 3, 5); };
  const win = (c, x, y, w, h) => { c.rect(x - 1, y - 1, w + 2, h + 2, 12).rect(x, y, w, h, 11).rect(x + w / 2, y, 1, h, 12).rect(x, y + h / 2, w, 1, 12); };

  const room = px.canvas(W, H); // 어린이·청소년의 방
  room.rect(0, 0, W, 62, 12); for (let x = 0; x < W; x += 10) room.rect(x, 0, 2, 62, 11);
  room.rect(0, 62, W, 28, 3); for (let y = 62; y < H; y += 7) room.rect(0, y, W, 1, 2);
  win(room, 108, 12, 34, 28); room.circle(124, 24, 4, 4);
  room.rect(8, 40, 44, 22, 9).rect(8, 36, 44, 6, 12).rect(8, 34, 12, 8, 11).rect(8, 62, 3, 4, 15).rect(49, 62, 3, 4, 15);
  room.rect(70, 44, 30, 3, 14).rect(72, 47, 3, 15, 14).rect(95, 47, 3, 15, 14).rect(76, 38, 8, 6, 10).rect(88, 40, 6, 4, 4);
  room.rect(130, 44, 20, 18, 14); for (let i = 0; i < 3; i++) room.rect(132, 46 + i * 5, 16, 3, [2, 4, 6][i]);

  const campus = px.canvas(W, H); // 청년: 대학·일터
  bands(campus, [10, 10, 11, 11], 0, 50); campus.rect(0, 62, W, 28, 6).rect(0, 62, W, 3, 5);
  campus.rect(20, 18, 70, 46, 2).rect(20, 14, 70, 5, 1);
  for (let r = 0; r < 3; r++) for (let q = 0; q < 6; q++) campus.rect(26 + q * 11, 24 + r * 12, 7, 8, 11).rect(26 + q * 11, 24 + r * 12, 7, 1, 12);
  campus.rect(50, 50, 12, 14, 3).rect(95, 66, 40, 3, 4);
  tree(campus, 120, 40, true); tree(campus, 14, 48, false); campus.rect(0, 80, W, 4, 4);

  const home = px.canvas(W, H); // 어른: 우리 집
  bands(home, [10, 10, 11, 11, 12], 0, 62); home.rect(0, 62, W, 28, 6).rect(0, 62, W, 2, 5);
  for (let i = 0; i < 18; i++) home.rect(80 - i * 2 - 1, 14 + i, i * 4 + 2, 1, 2);
  home.rect(46, 32, 68, 34, 12).rect(72, 44, 14, 22, 3).rect(84, 54, 1, 2, 4);
  win(home, 54, 40, 14, 12); win(home, 92, 40, 14, 12);
  home.rect(124, 20, 6, 14, 14); tree(home, 20, 48, true); tree(home, 144, 52, false);
  for (let x = 6; x < W; x += 6) home.rect(x, 68, 2, 8, 12).rect(x - 2, 70, 6, 1, 12);
  home.rect(74, 66, 10, 24, 4);

  const office = px.canvas(W, H); // 중년: 사무실
  office.rect(0, 0, W, 66, 13).rect(0, 66, W, 24, 14).rect(0, 64, W, 3, 12);
  win(office, 12, 8, 60, 38); win(office, 88, 8, 60, 38);
  [[18, 26], [28, 20], [38, 30], [50, 22], [62, 28], [96, 24], [108, 18], [120, 30], [134, 22]].forEach(([x, h]) => office.rect(x, 46 - h, 8, h, 8).rect(x + 2, 46 - h + 3, 2, 2, 4));
  office.rect(30, 56, 50, 4, 3).rect(34, 60, 3, 10, 3).rect(74, 60, 3, 10, 3).rect(44, 46, 20, 10, 15).rect(46, 48, 16, 6, 10).rect(52, 56, 4, 2, 15);
  office.rect(100, 50, 8, 14, 3).circle(104, 46, 7, 6).circle(100, 48, 4, 7).rect(122, 36, 22, 30, 14).rect(124, 40, 18, 3, 12).rect(124, 48, 18, 3, 12).rect(124, 56, 18, 3, 12);

  const park = px.canvas(W, H); // 노년: 공원
  bands(park, [10, 10, 11, 11, 12], 0, 56); park.circle(130, 20, 8, 4);
  park.ellipse(40, 64, 60, 14, 6).ellipse(130, 66, 50, 12, 5).rect(0, 66, W, 24, 6);
  park.ellipse(110, 78, 24, 6, 9).ellipse(110, 77, 18, 3, 10);
  tree(park, 24, 40, true); tree(park, 70, 46, false); tree(park, 148, 44, true);
  park.rect(60, 70, 26, 3, 3).rect(60, 66, 26, 3, 4).rect(62, 73, 3, 6, 15).rect(81, 73, 3, 6, 15);

  const night = px.canvas(W, H); // 엔딩 밤하늘
  bands(night, [15, 15, 8, 8, 9], 0, 60);
  for (let i = 0; i < 38; i++) night.set((i * 37 + 11) % W, (i * 23 + 5) % 50, i % 4 ? 12 : 4);
  night.circle(124, 18, 9, 4).circle(128, 16, 8, 8);
  night.ellipse(40, 84, 70, 22, 7).ellipse(130, 86, 60, 18, 8).rect(0, 84, W, 6, 7);
  night.line(70, 90, 82, 62, 13).line(84, 90, 86, 62, 13).rect(78, 58, 8, 4, 4);
  const frames = Object.entries({ room, campus, home, office, park, night }).map(([name, canvas]) => ({ name, canvas }));
  return [{ sheet: 'backgrounds', cols: 2, frames }];
};
