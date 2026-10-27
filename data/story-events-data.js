// 인생 이야기 S01~S24: 나이·상황이 맞으면 한 번씩 저절로 일어나 인생 로그에 남는다(화면은 멈추지 않음).
// when(s)이 참인 해에 한 번. p가 있으면 그 확률로. 문장은 해요체 40자 이내, 좋다/나쁘다 판정 금지.
globalThis.LG = globalThis.LG || {};

(() => {
  const { stat, cash, pl } = LG.data.h;
  const at = (age) => (s) => s.age === age;
  const kidAge = (n) => (s) => s.children.some((b) => s.age - b === n);
  const renting = (s) => ['wolse', 'jeonse', 'share'].includes(s.housing.type);

  LG.data.stories = {
    perYear: 2, // 한 해에 최대 몇 개까지
    list: [
      { id: 'S01', when: at(12), text: '초등학교 마지막 운동회에서 이어달리기를 뛰었어요.', effects: [stat('happiness', 1)] },
      { id: 'S02', when: at(13), text: '중학교 입학! 교복이 아직 조금 커요.', effects: [] },
      { id: 'S03', when: at(13), text: '첫 중학교 중간고사를 봤어요. 많이 떨렸어요.', effects: [stat('skill', 1)] },
      { id: 'S04', when: at(16), text: '고등학교 입학식 날, 새 친구들을 만났어요.', effects: [stat('relation', 1)] },
      { id: 'S05', when: (s) => s.age === 18 && s.path === '대학', text: '대학수학능력시험을 봤어요. 끝나고 친구들과 떡볶이를 먹었어요.', effects: [stat('happiness', 1)] },
      { id: 'S06', when: at(19), text: '졸업식에서 친구들과 꽃다발을 들고 사진을 찍었어요.', effects: [stat('relation', 1)] },
      { id: 'S07', when: (s) => s.flags['대졸'] && s.age >= 19 && s.age <= 20, text: '대학에서 처음으로 친구를 사귀었어요.', effects: [stat('relation', 2)] },
      { id: 'S08', when: (s) => s.flags['대졸'] && s.age >= 20 && s.age <= 22, p: 0.6, text: '학과 엠티에 가서 밤새 이야기를 나눴어요.', effects: [cash(-10), stat('happiness', 2)] },
      { id: 'S09', when: (s) => !!s.job && s.age >= 19, text: '첫 출근 날, 이름이 적힌 사원증을 받았어요.', effects: [stat('happiness', 1)] },
      { id: 'S10', when: (s) => renting(s), text: (s) => `자취 시작! 냄비와 이불을 사느라 ${LG.economy.formatMoney(Math.round(50 * s.priceLevel))}을 썼어요.`, effects: [{ t: 'cash', v: pl(-50) }] },
      { id: 'S11', when: (s) => s.age >= 20 && s.age <= 24 && !s.dependent, p: 0.4, text: '운전면허 시험에 도전했어요. 학원비가 들었어요.', effects: [{ t: 'cash', v: pl(-60) }, stat('skill', 1)] },
      { id: 'S12', when: (s) => s.age >= 22 && s.age <= 35 && s.cash > 500 * s.priceLevel, p: 0.3, text: '처음으로 해외여행을 다녀왔어요.', effects: [{ t: 'cash', v: pl(-150) }, stat('happiness', 4)] },
      { id: 'S13', when: (s) => s.assets.deposit > 0 && s.age >= 15, text: '통장에 이자가 처음 들어왔어요. 아주 조금이지만 신기해요!', effects: [] },
      { id: 'S14', when: (s) => s.assets.coin > 0, text: '코인 가격을 하루에 열 번씩 확인했어요.', effects: [stat('happiness', -1)] },
      { id: 'S15', when: (s) => s.housing.type === 'own', text: '내 집 열쇠를 처음 받았어요. 문을 열 때 두근거렸어요.', effects: [stat('happiness', 3)] },
      { id: 'S16', when: (s) => !!s.spouse && s.flags['결혼나이'] !== undefined && s.age === s.flags['결혼나이'] + 1, text: '결혼 1주년, 둘이서 기념사진을 찍었어요.', effects: [stat('relation', 2)] },
      { id: 'S17', when: kidAge(7), text: '아이가 초등학교에 입학했어요. 가방이 아이만큼 커요.', effects: [stat('happiness', 2)] },
      { id: 'S18', when: kidAge(16), text: '아이가 고등학생이 되었어요. 학원비 고민이 늘었어요.', effects: [] },
      { id: 'S19', when: at(40), text: '마흔 살 생일에 처음으로 종합 건강검진을 받았어요.', effects: [stat('health', 1)] },
      { id: 'S20', when: at(50), text: '반백 살 생일! 가족들이 케이크를 준비했어요.', effects: [stat('relation', 2)] },
      { id: 'S21', when: (s) => s.retired, text: '퇴직 기념 모임에서 꽃다발을 받았어요.', effects: [stat('happiness', 2)] },
      { id: 'S22', when: at(65), text: '지하철 경로 우대 카드를 받았어요.', effects: [] },
      { id: 'S23', when: at(70), text: '칠순 잔치에 가족과 친구들이 모였어요.', effects: [stat('relation', 3), stat('happiness', 2)] },
      { id: 'S24', when: at(80), text: '여든 번째 생일, 지난 인생을 천천히 돌아봤어요.', effects: [stat('happiness', 1)] },
    ],
  };
})();
