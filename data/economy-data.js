// 경제 상수 (docs/경제데이터.md "게임값"). 돈은 모두 만원 단위.
globalThis.LG = globalThis.LG || {};
LG.data = LG.data || {};

LG.data.economy = {
  startAge: 12,
  endAge: 80,
  start: { happiness: 60, health: 70, relation: 60, skill: 20, cash: 10 },

  // 시작 카드. fair=true면 fairPick 고정, 아니면 weight대로 무작위.
  fairPick: { support: 'normal', place: 'big', talent: 'none' },
  cards: {
    support: {
      rich: { label: '넉넉', desc: '용돈이 넉넉한 편이에요.', weight: 25, allowance: 5, tuition: 1, deposit: 1000 },
      normal: { label: '보통', desc: '용돈이 보통이에요.', weight: 50, allowance: 3, tuition: 0.5, deposit: 300 },
      tight: { label: '빠듯', desc: '용돈이 빠듯해요. 아끼는 법을 배워요.', weight: 25, allowance: 1.5, tuition: 0, deposit: 0 },
    },
    place: {
      big: { label: '대도시', desc: '대도시에 살아요. 집값과 월세가 높은 편이에요.', weight: 55, house: 160000, wolse: [1000, 70], jeonse: 21000 },
      mid: { label: '중소도시', desc: '중소도시에 살아요. 집값과 월세가 낮은 편이에요.', weight: 45, house: 40000, wolse: [500, 40], jeonse: 12000 },
    },
    talent: {
      none: { label: '아직 몰라요', desc: '아직 내 재능을 몰라요. 해 보며 찾아가요.', weight: 0 },
      number: { label: '숫자감각', desc: '숫자에 밝아요.', weight: 20 },
      craft: { label: '손재주', desc: '손으로 만드는 걸 잘해요.', weight: 20 },
      speech: { label: '말솜씨', desc: '말로 전하는 걸 잘해요.', weight: 20 },
      body: { label: '체력', desc: '몸을 쓰는 걸 잘해요.', weight: 20 },
      art: { label: '그림', desc: '그림 그리는 걸 좋아해요.', weight: 20 },
    },
  },
  talentSkill: 5,

  // 화면용 데이터
  calendarStartYear: 2026,
  teacherTips: [
    '같은 링크로 들어오면 같은 해에 경기 침체가 와요. "같은 불황에서 누구는 왜 괜찮았을까?"를 토론해 보세요.',
    '40분 수업 예: 도입 5분, 플레이 25분, 짝과 엔딩 비교 5분, 마디 답변으로 성찰 5분.',
    '자동 버튼을 쓰면 이벤트가 없는 해는 빠르게 넘어가요.',
    '엔딩의 친구 4명은 AI가 아니라 정해진 규칙이에요. 규칙으로 움직이는 프로그램 이야기를 나눠 보세요.',
    '별명을 쓰도록 안내해 주세요. 기록은 이 기기 안에만 저장되고 밖으로 나가지 않아요.',
    '엔딩 화면의 인쇄 버튼을 누르면 A4 한 장짜리 "나의 인생 보고서"가 나와요.',
  ],
  avatars: ['파랑이', '주황이', '초록이', '빨강이'],
  names: {
    max: 8, fallback: '이름 없는 여행자',
    badWords: ['바보', '멍청이', '씨발', '시발', '병신', '개새끼', '좆', 'ㅅㅂ', 'ㅂㅅ', '지랄'],
  },
  ageGroups: [[12, '어린이'], [13, '청소년'], [20, '청년'], [30, '어른'], [50, '중년'], [65, '노년']],
  // 올해의 집중: 능력치 변화. 소득+5%·지출+3%는 economy.settleYear에서 처리.
  focus: {
    study: { label: '공부', stats: { skill: 3, happiness: -1 } },
    work: { label: '일과 돈', stats: { health: -1 } },
    rest: { label: '건강과 여가', stats: { health: 2, happiness: 2 } },
    people: { label: '사람', stats: { relation: 3 } },
  },
  // 능력치는 해마다 휴식값으로 조금씩 돌아간다(그대로 두면 100에 붙어 선택의 차이가 안 보임). 건강은 나이 들수록 휴식값이 내려간다.
  drift: { rate: 0.06, rest: { happiness: 60, relation: 50, skill: 50 }, health: { base: 80, from: 40, perYear: 0.4 } },
  tuition: 730, college2: 600,
  spouseRetireAge: 60,
  shareMonth: 45,
  messages: { resume: '쉬던 시간이 끝나고 다시 일을 시작했어요.' },
  // 인생 로그 문구 (js/lifelog.js)
  logText: {
    recession: '경기가 크게 나빠졌어요. 주가가 떨어졌어요.',
    boom: '경기가 좋아서 주가가 많이 올랐어요.',
    boomAt: 0.2,
    job: (label) => `새 일을 시작했어요: ${label}`,
    jobEnd: '일을 그만두었어요.',
    housing: { wolse: '원룸 월세로 이사했어요.', jeonse: '전세로 이사했어요.', share: '셰어하우스로 이사했어요.', own: '내 집으로 이사했어요!', parent: '부모님 집에서 살아요.' },
    spouse: '결혼해서 함께 살게 되었어요.',
    child: '아이가 태어났어요.',
    borrowed: '돈이 모자라 빌렸어요. 이자가 붙어요.',
    debtFree: '빚을 모두 갚았어요!',
    pension: '국민연금을 받기 시작했어요.',
    milestones: [1000, 10000, 50000, 100000, 500000],
    milestone: (m) => `순자산이 처음으로 ${m}을 넘었어요!`,
    year: (inc, out, net) => `한 해 결산: +${inc} −${out} = ${net}`,
    grow: (group) => `${group}이 되었어요.`,
    mark: (q, a) => `마디 질문: ${q} → ${a || '(건너뜀)'}`,
  },
  spouseJobs: ['bigco', 'smallco', 'civil', 'tech', 'tiny'],

  // 직업: salary는 오늘 기준 연봉(세전). 시작할 때 물가를 곱한다.
  jobs: {
    bigco: { label: '대기업', salary: 5000 },
    smallco: { label: '중소기업', salary: 3200 },
    civil: { label: '공무원', salary: 3400, pension: 1.2 },
    tech: { label: '기술직', salary: 2900 },
    techCert: { label: '기술직(자격증)', salary: 3300 },
    tiny: { label: '작은 가게·회사', salary: 2700 },
    minwage: { label: '최저임금 일자리', salary: 2680 },
    freelance: { label: '프리랜서', salary: 3500, random: [1000, 6000] }, // random: 매년 새로 정함
    startup: { label: '창업(준비)', salary: 750, random: [0, 1500] },
    startupOk: { label: '창업(유지)', salary: 2800 },
    startupHit: { label: '창업(대박)', salary: 6000 },
  },
  netRate: 0.85,
  raise: 0.03,

  living: { single: 1500, couple: 3000, childYoung: 1320, childSchool: 1500 },
  minorSpendRate: 0.7,
  focusRate: { workIncome: 0.05, peopleSpend: 0.03 },
  pension: { startAge: 65, perYear: 25, max: 1500 },

  // 빚 종류: left=원리금균등 남은 햇수(0이면 이자만), floating=금리 변동 반영
  loans: {
    student: { rate: 0.017, left: 10 },
    jeonse: { rate: 0.04, left: 0, floating: true },
    mortgage: { rate: 0.045, left: 30, floating: true },
    credit: { rate: 0.07, left: 0, floating: true },
    card: { rate: 0.18, left: 0, floating: true },
    car: { rate: 0.055, left: 5 },
  },
  repayFirst: ['card', 'credit'],
  fundOrder: ['cash', 'emergency', 'deposit', 'index', 'stock', 'coin'],

  // 시장 (시드로 80년치를 미리 생성)
  depositRate: 0.03,
  index: { mean: 0.06, sd: 0.15, min: -0.25, max: 0.4 },
  stock: { beta: 1.2, noiseMean: -0.012, sd: 0.28, min: -0.7, max: 0.9 }, // noiseMean: 지수와 평균 수익은 같고 흔들림만 큼
  coin: { mean: 0.1, sd: 0.7, min: -0.95, max: 2, crashP: 0.08, crash: -0.8 }, // 평균 수익은 예금과 비슷, 흔들림은 아주 큼
  housing: { mean: 0.03, sd: 0.08, min: -0.15, max: 0.2 },
  inflation: { mean: 0.025, sd: 0.01, min: 0, max: 0.06, recessionMax: 0.015 },
  carDepreciation: 0.15,
  recession: {
    windows: [[33, 37], [56, 60]],
    extraChance: 0.15,
    extraRange: [20, 78],
    minGap: 5,
    index: -0.3, stock: -0.45, coin: -0.7, housing: -0.1,
  },
};
