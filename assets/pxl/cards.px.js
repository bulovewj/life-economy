// 카드 틀 48x64: 시작 카드 뒷면 1 + 앞면 틀 3종, 용어 카드 틀 1. 글자는 HTML이 얹는다. 팔레트 번호는 sweetie16.
module.exports = (px) => {
  const frame = (fill, edge, corner) => {
    const c = px.canvas(48, 64);
    c.rect(1, 1, 46, 62, edge).rect(3, 3, 42, 58, fill);
    [[5, 5], [38, 5], [5, 54], [38, 54]].forEach(([x, y]) => c.rect(x, y, 5, 5, corner).rect(x + 1, y + 1, 3, 3, fill));
    return c.outline(0);
  };
  const back = frame(9, 10, 4);
  // 뒷면 가운데 '?' 무늬
  [[20, 22, 8, 3], [26, 25, 3, 5], [22, 29, 5, 3], [22, 33, 3, 3], [22, 40, 3, 3]].forEach(([x, y, w, h]) => back.rect(x, y, w, h, 12));
  back.rect(18, 25, 3, 3, 12);
  const frames = [
    { name: 'back', canvas: back },
    { name: 'support', canvas: frame(12, 4, 3) },
    { name: 'place', canvas: frame(12, 10, 9) },
    { name: 'talent', canvas: frame(12, 6, 5) },
    { name: 'term', canvas: frame(12, 3, 4) },
  ];
  return [{ sheet: 'cards', cols: 5, frames }];
};
