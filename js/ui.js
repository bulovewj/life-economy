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
    const app = document.getElementById('app'), y = window.scrollY;
    const stay = app.querySelector('.screen.year') && nodes[0] && nodes[0].classList && nodes[0].classList.contains('year'); // 한 해 → 한 해: 읽던 곳 그대로
    app.replaceChildren(...nodes);
    window.scrollTo(0, stay ? y : 0);
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

  // 지금 모습: 나이대·성별·옷·배경. 학생(교복·교실) → 대학생(캠퍼스) → 직장인(정장·사무실 / 작업복·가게) → 은퇴(카디건·공원)
  look(s) {
    const L = LG.data.economy.looks, age = s.age, gender = s.gender || 'm'; // 예전 저장은 save.check에서 성별을 되살린다
    let outfit = 'casual', bg = 'room';
    if (s.retired || age >= LG.data.economy.pension.startAge) { outfit = 'cardigan'; bg = 'park'; }
    else if (s.job && !s.paused) { outfit = L.jobOutfit[s.job] || 'casual'; bg = L.outfitBg[outfit]; }
    else if (s.dependent && age <= 18) { outfit = age >= L.uniformFrom ? 'uniform' : 'casual'; bg = 'school'; }
    else if (s.dependent) bg = s.flags['대졸'] ? 'campus' : 'room';
    else if (s.spouse || s.housing.type === 'own') bg = 'home';
    return { idx: LG.ui.ageIndex(age), gender, outfit, bg };
  },

  // 배경 위에 숨 쉬는 아바타 한 명. icon을 주면 머리 위 말풍선 + 그 이벤트에 맞는 장소로 잠깐 바뀐다.
  scene(look, icon) {
    const S = LG.data.sprites, L = LG.data.economy.looks, sc = window.innerWidth < 600 ? 3 : 4; // 정수 배율만
    const bgName = (icon && L.eventBg[icon]) || look.bg;
    const sheet = ['backgrounds', 'places'].map((k) => S[k]).find((x) => x.frames[bgName]) || S.backgrounds, f = sheet.frames[bgName] || sheet.frames.room;
    const key = `${look.gender}_${look.idx}_${look.outfit}`, a = S.avatar.frames[`${key}_0`], b = S.avatar.frames[`${key}_1`];
    const pos = (v, total, size) => (v ? (v / (total - size)) * 100 : 0);
    return LG.ui.el('div', { class: 'scene', role: 'img', 'aria-label': icon ? '이벤트가 생긴 장면' : `${LG.ui.ageGroup(LG.data.economy.ageGroups[look.idx][0])} 시절의 나`,
      style: `background-image:url(${sheet.src});background-size:${(sheet.w / f.w) * 100}% ${(sheet.h / f.h) * 100}%;background-position:${pos(f.x, sheet.w, f.w)}% ${pos(f.y, sheet.h, f.h)}%` },
      LG.ui.el('span', { class: 'sprite breathe avatar', style: `width:${32 * sc}px;height:${32 * sc}px;margin-left:-${16 * sc}px;background-image:url(${S.avatar.src});background-size:${S.avatar.w * sc}px ${S.avatar.h * sc}px;background-position:-${a.x * sc}px -${a.y * sc}px;--x0:-${a.x * sc}px;--x1:-${b.x * sc}px;--y:-${a.y * sc}px` }),
      icon ? LG.ui.el('span', { class: 'bubble', style: `bottom:calc(3% + ${26 * sc}px);margin-left:${6 * sc}px` }, LG.ui.sprite('icons24', icon, sc === 3 ? 1.5 : 2)) : null); // 머리 옆 위
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
