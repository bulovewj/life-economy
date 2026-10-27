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

  write(s) {
    try {
      localStorage.setItem(LG.save.KEY, JSON.stringify(s));
      localStorage.setItem(LG.save.ANSWERS, JSON.stringify(s.marks));
    } catch (e) { /* 저장 없이 계속 */ }
  },

  // 이어할 수 있는 저장이 있으면 state, 없거나 버전이 다르면 null
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(LG.save.KEY));
      // 81살 = 인생을 끝낸 저장(엔딩 다시 보기)
      return s && s.v === 1 && s.age <= LG.data.economy.endAge + 1 ? s : null;
    } catch (e) {
      return null;
    }
  },

  clear() {
    try {
      localStorage.removeItem(LG.save.KEY);
      localStorage.removeItem(LG.save.ANSWERS);
    } catch (e) { /* 무시 */ }
  },
};
