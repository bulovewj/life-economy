// 선택 없이 저절로 일어나는 작은 일 D01~D16. 해마다 rate 확률로 하나, 화면을 멈추지 않고 인생 로그에만 남는다.
// 문장은 해요체 40자 이내, 좋다/나쁘다 판정 금지. 돈은 만원(pl = 그때 물가로).
globalThis.LG = globalThis.LG || {};

(() => {
  const { stat, cash, pl } = LG.data.h;
  const job = (s) => !!s.job && !s.paused;
  const adult = (s) => !s.dependent;

  LG.data.daily = {
    rate: 0.55,
    list: [
      { id: 'D01', weight: 3, text: '감기에 걸려서 며칠 푹 쉬었어요.', effects: [stat('health', -3)] },
      { id: 'D02', weight: 2, text: '동네 축제에 가서 신나게 놀았어요.', effects: [stat('happiness', 2)] },
      { id: 'D03', weight: 3, cond: (s) => s.age <= 19, text: '학교 대회에서 상장을 받았어요.', effects: [stat('skill', 2), stat('happiness', 1)] },
      { id: 'D04', weight: 3, cond: (s) => s.age <= 19, text: '친구 생일 선물을 준비했어요.', effects: [cash(-2), stat('relation', 2)] },
      { id: 'D05', weight: 2, text: '줄넘기를 꾸준히 해서 몸이 가벼워졌어요.', effects: [stat('health', 3)] },
      { id: 'D06', weight: 2, cond: (s) => s.age <= 40, text: '새로운 친구를 사귀었어요.', effects: [stat('relation', 2)] },
      { id: 'D07', weight: 2, cond: job, text: '연말정산으로 세금을 조금 돌려받았어요.', effects: [{ t: 'cash', v: pl(30) }] },
      { id: 'D08', weight: 2, cond: job, text: '연말정산에서 세금을 조금 더 냈어요.', effects: [{ t: 'cash', v: pl(-30) }] },
      { id: 'D09', weight: 2, cond: adult, text: '보일러가 고장 나서 고쳤어요.', effects: [{ t: 'cash', v: pl(-40) }] },
      { id: 'D10', weight: 2, cond: adult, text: '할인 행사에서 필요한 물건을 샀어요.', effects: [{ t: 'cash', v: pl(-10) }, stat('happiness', 1)] },
      { id: 'D11', weight: 2, cond: adult, text: '휴대폰 요금제를 바꿔서 돈을 아꼈어요.', effects: [{ t: 'cash', v: pl(12) }] },
      { id: 'D12', weight: 2, cond: (s) => s.age >= 30, text: '오랜만에 동창들을 만났어요.', effects: [stat('relation', 3)] },
      { id: 'D13', weight: 2, cond: job, text: '일이 바빠서 야근이 많은 해였어요.', effects: [stat('health', -2), stat('happiness', -1)] },
      { id: 'D14', weight: 2, cond: (s) => s.children.some((b) => s.age - b >= 25), text: '손주가 태어났어요.', effects: [stat('relation', 4), stat('happiness', 3)] },
      { id: 'D15', weight: 2, cond: (s) => s.age >= 60, text: '작은 텃밭을 가꾸기 시작했어요.', effects: [stat('health', 2), stat('happiness', 2)] },
      { id: 'D16', weight: 2, text: '재미있는 책을 많이 읽었어요.', effects: [stat('skill', 2)] },
    ],
  };
})();
