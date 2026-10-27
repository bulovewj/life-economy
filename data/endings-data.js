// 엔딩 데이터: 칭호 10개, 친구 4명(규칙), 5영역, 공통 문구. 원본: docs/시나리오.md §8~9
globalThis.LG = globalThis.LG || {};

(() => {
  const adult = (s) => s.history.filter((h) => h.rate >= 0 && h.age >= 26); // 저축·투자를 정한 뒤(25살 설정 다음 해부터)
  const yearsOf = (s, keys) => s.history.filter((h) => keys.includes(h.job)).length;
  const f = (s, k) => s.flags[k] || 0;

  LG.data.endingTexts = {
    noTitle: '나만의 길을 걸은 사람',
    closing: '돈이 많은 인생, 행복한 인생, 바쁜 인생… 무엇이 좋은 인생일까요? 친구와 이야기해 봐요.',
    friends: '이 친구들은 정해진 규칙대로 움직이는 프로그램이에요.',
    friendsIntro: '같은 날, 같은 세상에서 태어난 친구 4명이에요. 세상(경제 역사)은 똑같아요.',
  };

  // 칭호: 위에서부터 조건이 맞는 것 최대 3개
  LG.data.titles = [
    { name: '차곡차곡 저축왕', desc: '평생 꾸준히 많이 모았어요.',
      test: (s) => { const a = adult(s); return a.length > 0 && a.reduce((t, h) => t + h.rate, 0) / a.length >= 0.3; } },
    { name: '흔들려도 버틴 투자자', desc: '경기가 나빠져도 흔들리지 않았어요.', test: (s) => !!f(s, '침체버팀21') && !!f(s, '침체버팀30') },
    { name: '경험 부자', desc: '다양한 경험으로 마음이 풍요로워요.', test: (s) => s.stats.happiness >= 80 && f(s, '경험소비') >= 5 },
    { name: '가족이 보물', desc: '곁의 사람들과 깊게 이어졌어요.', test: (s) => s.stats.relation >= 85 },
    { name: '꿈을 따라간 사람', desc: '좋아하는 일을 오래 이어 갔어요.', test: (s) => s.path === '꿈' && yearsOf(s, ['freelance', 'startup', 'startupOk', 'startupHit']) >= 10 },
    { name: '다시 일어선 사람', desc: '어려운 때를 지나 다시 일어났어요.',
      test: (s) => s.history.some((h) => h.netWorth < 0) && s.history.at(-1).netWorth >= 0 },
    { name: '나눔 천사', desc: '가진 것을 나누는 기쁨을 알았어요.', test: (s) => !!f(s, '나눔') || f(s, '기부') >= 2 },
    { name: '건강 지킴이', desc: '몸을 잘 돌보며 살았어요.', test: (s) => s.stats.health >= 80 },
    { name: '사기 방어 마스터', desc: '수상한 제안을 잘 알아봤어요.', test: (s) => !!f(s, '사기방어09') && !!f(s, '사기방어14') && !!f(s, '사기방어28') },
    { name: '균형의 달인', desc: '여러 영역을 고르게 챙겼어요.',
      test: (s) => Object.values(s.stats).every((v) => v >= 60) && s.history.at(-1).netWorth >= 0 },
  ];

  // 5영역(0~100): 돈은 오늘 물가로 바꾼 순자산 5억원을 100으로
  LG.data.areas = [
    { key: 'money', label: '돈', calc: (s) => Math.max(0, Math.min(100, Math.round((s.history.at(-1).netWorth / s.priceLevel / 50000) * 100))) },
    { key: 'happiness', label: '행복', calc: (s) => Math.round(s.stats.happiness) },
    { key: 'health', label: '건강', calc: (s) => Math.round(s.stats.health) },
    { key: 'relation', label: '관계', calc: (s) => Math.round(s.stats.relation) },
    { key: 'dream', label: '꿈(실력)', calc: (s) => Math.round(s.stats.skill) },
  ];

  // 친구 4명. weights는 선택지의 성격(js/npc.js features)에 주는 점수, fixed는 고정 선택, coin은 둘 중 무작위(50%)
  const same = { coin: { E17: [0, 2], E20: [0, 2] } };
  LG.data.npcs = [
    { name: '차곡이', desc: '항상 안전한 선택, 저축 30%', focus: 'work', saveRate: 0.3, alloc: { deposit: 70, index: 30, stock: 0, coin: 0 }, ...same,
      fixed: { E21: 1, E30: 1, E14: 2, E28: 1 },
      weights: { cashOut: -0.02, debt: -0.01, happy: 0.1, other: 0.05, save: 0.05, invest: 0.01, risk: -3, exp: -1, jobPay: 0.3, safeJob: 2, riskJob: -2 } },
    { name: '꾸준이', desc: '저축 20%, 지수펀드 80%, 침체에도 그대로', focus: 'work', saveRate: 0.2, alloc: { deposit: 20, index: 80, stock: 0, coin: 0 }, ...same,
      fixed: { E21: 1, E30: 1, E14: 2, E28: 1 },
      weights: { cashOut: -0.01, debt: -0.005, happy: 0.1, other: 0.05, save: 0.03, invest: 0.08, risk: -0.5, exp: 0, jobPay: 0.5, safeJob: 0, riskJob: 0 } },
    { name: '한방이', desc: '코인·인기주 위주, 침체엔 다 판다', focus: 'work', saveRate: 0.2, alloc: { deposit: 0, index: 0, stock: 50, coin: 50 }, ...same,
      fixed: { E21: 0, E30: 0, E14: 0 },
      weights: { cashOut: -0.005, debt: 0.002, happy: 0.05, other: 0, save: 0, invest: 0.1, risk: 2, exp: 0, jobPay: 0.5, safeJob: 0, riskJob: 0 } },
    { name: '오늘이', desc: '경험과 소비 중심, 저축은 조금', focus: 'rest', saveRate: 0.05, alloc: { deposit: 100, index: 0, stock: 0, coin: 0 }, ...same,
      fixed: { E14: 2 },
      weights: { cashOut: -0.002, debt: 0.003, happy: 0.8, other: 0.1, save: -0.02, invest: 0, risk: -0.5, exp: 3, jobPay: 0.1, safeJob: 0, riskJob: 0 } },
  ];

  // 칭호 계산: 맞는 것 최대 3개(없으면 기본 문구)
  LG.data.pickTitles = (s) => {
    const got = LG.data.titles.filter((t) => t.test(s)).slice(0, 3);
    return got.length ? got : [{ name: LG.data.endingTexts.noTitle, desc: '' }];
  };
})();
