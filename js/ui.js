// 화면 공통 도구. DOM은 여기와 screens/*.js에서만 만진다.
globalThis.LG = globalThis.LG || {};
LG.screens = LG.screens || {};

LG.ui = {
  el(tag, props, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    n.append(...kids.flat().filter((c) => c !== null && c !== undefined && c !== false));
    return n;
  },

  render(...nodes) {
    document.getElementById('app').replaceChildren(...nodes);
    window.scrollTo(0, 0);
  },

  money: (n) => LG.economy.formatMoney(n),

  ageGroup(age) {
    let name = '';
    for (const [from, label] of LG.data.economy.ageGroups) if (age >= from) name = label;
    return name;
  },

  // +3 / -2 처럼 색이 다른 숫자
  delta(n, unit = '') {
    const up = n > 0;
    return LG.ui.el('span', { class: up ? 'up' : 'down' }, `${up ? '+' : '−'}${Math.abs(n).toLocaleString('en-US')}${unit}`);
  },

  // 시트 속 한 칸을 보여 주는 인라인 스타일 (배율은 정수 권장, 확대는 image-rendering: pixelated)
  frameStyle(sheet, name, scale) {
    const S = LG.data.sprites && LG.data.sprites[sheet], f = S && S.frames[name];
    if (!f) return null;
    return `width:${f.w * scale}px;height:${f.h * scale}px;background-image:url(${S.src});background-size:${S.w * scale}px ${S.h * scale}px;background-position:-${f.x * scale}px -${f.y * scale}px`;
  },

  // 도트 한 장. 없는 이름이면 null(자리를 차지하지 않는다)
  sprite(sheet, name, scale = 3, label) {
    const style = LG.ui.frameStyle(sheet, name, scale);
    return style && LG.ui.el('span', { class: 'sprite', role: label ? 'img' : null, 'aria-label': label, 'aria-hidden': label ? null : 'true', style });
  },

  ageIndex(age) {
    let idx = 0;
    LG.data.economy.ageGroups.forEach(([from], i) => { if (age >= from) idx = i; });
    return idx;
  },

  // 연령대 배경 위에 숨 쉬는 아바타 한 명 (배경 이름은 연령대 순서대로)
  scene(age, avatar, bg) {
    const S = LG.data.sprites, idx = LG.ui.ageIndex(age), room = ['room', 'room', 'campus', 'home', 'office', 'park'][idx];
    const a = S.avatar.frames[`${avatar}_${idx}_0`], b = S.avatar.frames[`${avatar}_${idx}_1`], sc = 4;
    const f = S.backgrounds.frames[bg || room];
    return LG.ui.el('div', { class: 'scene', role: 'img', 'aria-label': `${LG.ui.ageGroup(age)} 시절의 나`,
      style: `background-image:url(${S.backgrounds.src});background-size:${(S.backgrounds.w / f.w) * 100}% ${(S.backgrounds.h / f.h) * 100}%;background-position:${f.x ? (f.x / (S.backgrounds.w - f.w)) * 100 : 0}% ${f.y ? (f.y / (S.backgrounds.h - f.h)) * 100 : 0}%` },
      LG.ui.el('span', { class: 'sprite breathe', style: `width:${32 * sc}px;height:${32 * sc}px;background-image:url(${S.avatar.src});background-size:${S.avatar.w * sc}px ${S.avatar.h * sc}px;background-position:-${a.x * sc}px -${a.y * sc}px;--x0:-${a.x * sc}px;--x1:-${b.x * sc}px;--y:-${a.y * sc}px` }));
  },

  // 능력치 막대. 전에 보여 준 값에서 새 값으로 부드럽게 차오른다.
  statBars(s) {
    const labels = { happiness: ['행복', 'happy'], health: ['건강', 'health'], relation: ['관계', 'relation'], skill: ['실력', 'skill'] };
    const prev = LG.ui.prevStats || s.stats, fills = [];
    const node = LG.ui.el('div', { class: 'stats' }, Object.entries(labels).map(([k, [label, icon]]) => {
      const fill = LG.ui.el('div', { class: 'fill', style: `width:${Math.round(prev[k])}%` });
      fills.push([fill, k]);
      return LG.ui.el('div', { class: 'stat' },
        LG.ui.el('span', { class: 'stat-label' }, LG.ui.sprite('icons16', icon, 1.5), label),
        LG.ui.el('div', { class: 'bar' }, fill),
        LG.ui.el('span', { class: 'stat-num' }, String(Math.round(s.stats[k]))));
    }));
    LG.ui.prevStats = { ...s.stats };
    setTimeout(() => fills.forEach(([f, k]) => { f.style.width = `${Math.round(s.stats[k])}%`; }), 30);
    return node;
  },

  toast(text, ms = 1500) {
    const t = LG.ui.el('div', { class: 'toast', role: 'status' }, text);
    document.body.append(t);
    setTimeout(() => t.remove(), ms);
  },
};
