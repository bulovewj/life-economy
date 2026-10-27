// 저장(F6). localStorage가 안 되는 환경(시크릿 창 등)에서도 게임은 저장 없이 진행된다. 외부 전송 없음.
globalThis.LG = globalThis.LG || {};

LG.save = {
  KEY: 'lg_save_v1',
  ANSWERS: 'lg_answers_v1',

  available() {
    try {
      localStorage.setItem('lg_probe', '1');
      localStorage.removeItem('lg_probe');
      return true;
    } catch (e) {
      return false;
    }
  },

  // 저장에 성공하면 true
  write(s) {
    try {
      localStorage.setItem(LG.save.KEY, JSON.stringify(s));
      localStorage.setItem(LG.save.ANSWERS, JSON.stringify(s.marks));
      return true;
    } catch (e) {
      return false;
    }
  },

  // 이어할 수 있는 저장이 있으면 state, 없거나 망가졌으면 null
  load() {
    try {
      return LG.save.check(JSON.parse(localStorage.getItem(LG.save.KEY)));
    } catch (e) {
      return null;
    }
  },

  // 저장 모양 검사: 꼭 있어야 할 값이 없거나 이상하면 null. 나중에 생긴 빈칸은 기본값으로 채운다.
  check(s) {
    const D = LG.data.economy, num = (v) => typeof v === 'number' && Number.isFinite(v);
    if (!s || typeof s !== 'object' || s.v !== 1) return null;
    if (!Number.isInteger(s.age) || s.age < D.startAge || s.age > D.endAge + 1) return null; // 81살 = 인생을 끝낸 저장(엔딩 다시 보기)
    if (!Number.isInteger(s.seed) || ![s.cash, s.rngState, s.priceLevel, s.housingIdx].every(num)) return null;
    if (['stats', 'assets', 'alloc', 'cards', 'support', 'housing', 'marks'].some((k) => !s[k] || typeof s[k] !== 'object')) return null;
    if (!['happiness', 'health', 'relation', 'skill'].every((k) => num(s.stats[k]))) return null;
    if (!Object.values(s.assets).every(num)) return null;
    if (Object.values(s.alloc).reduce((t, v) => t + v, 0) !== 100) return null;
    if (!Array.isArray(s.loans) || !s.loans.every((l) => l && num(l.bal) && num(l.rate))) return null;
    if (!Array.isArray(s.history) || s.history.length !== s.age - D.startAge) return null; // 한 해에 한 줄씩
    if (s.gender === undefined) s.gender = s.avatar % 2 ? 'f' : 'm'; // 색깔 아바타(0~3) 시절 저장
    if (s.retired === undefined) s.retired = !!(s.done && s.done.E31) && !s.job; // 퇴직 갈림길을 지나 일이 없으면 은퇴
    const fresh = LG.state.newState(s.seed, s.fair);
    for (const k of Object.keys(fresh)) if (s[k] === undefined) s[k] = fresh[k];
    return s;
  },

  clear() {
    try {
      localStorage.removeItem(LG.save.KEY);
      localStorage.removeItem(LG.save.ANSWERS);
    } catch (e) { /* 무시 */ }
  },
};
