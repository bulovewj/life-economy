// 시드 기반 난수 (mulberry32). Math.random() 대신 항상 이것만 쓴다.
globalThis.LG = globalThis.LG || {};

LG.rng = {
  // saved: 저장해 둔 내부 상태(getState 값)를 주면 그 지점부터 이어서 뽑는다.
  create(seed, saved) {
    let a = saved !== undefined ? saved >>> 0 : (Number(seed) >>> 0) || 1;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      getState: () => a,
      // a 이상 b 이하 정수
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      // Box-Muller 정규분포
      normal(mean = 0, sd = 1) {
        const u = 1 - next();
        const v = next();
        return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      },
    };
  },
};
