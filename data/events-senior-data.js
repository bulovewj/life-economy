// 중년·노년 (50~80세) 갈림길 E27~E34. 원본: docs/시나리오.md §4~5
globalThis.LG = globalThis.LG || {};

(() => {
  const { stat, flag, count, cash, pl, expense, income, later, crashChoices, recession, invested } = LG.data.h;
  const money = (n) => LG.economy.formatMoney(n);
  const liquid = (s) => LG.housing.liquid(s);

  LG.data.events.push(
    { id: 'E27', age: [50, 50], title: '노후 준비', icon: 'piggy', terms: ['연금'],
      text: '연금은 세 층으로 쌓여요. 국민연금, 퇴직연금, 개인연금이에요. 나는 어떻게 준비할까요?',
      choices: [
        { label: '개인연금에 든다 (연 300만원)', effects: [expense(pl(300), 15), income(pl(300), 15, 15), flag('개인연금')], tip: '미리 모아 두면 나이 들어서 매년 받아요.' },
        { label: '은퇴 후 할 일의 자격증을 딴다 (300만원)', effects: [cash(-300), flag('자격증2'), stat('skill', 5)], tip: '나이가 들어도 할 수 있는 일이 늘어요.' },
        { label: '그냥 모아 둔 돈으로 지낸다', effects: [], tip: '모아 둔 돈이 얼마나 오래 갈지 생각해 봐요.' },
      ] },

    { id: 'E28', age: [53, 53], title: '고수익 권유', icon: 'warning', terms: ['금융사기', '위험과 수익'],
      text: '아는 사람이 말해요. "매달 3% 이자를 줘요! 원금도 보장해요!"',
      choices: [
        { label: '퇴직금을 미리 당겨 투자한다', effects: [{ t: 'stake', amt: true, v: (s) => Math.max(500, Math.round((s.jobYears * s.salary) / 12)), ev: 'E28', key: 'result', years: 2 }],
          tip: '높은 수익과 원금 보장은 같이 오지 않아요.' },
        { label: '거절한다', effects: [flag('사기방어28')], tip: '모르는 투자는 하지 않는 것도 실력이에요.' },
        { label: '금융감독원 상담(1332)에 먼저 물어본다', effects: [flag('사기방어28')], tip: '1332에 물어보면 알려 줘요.' },
      ],
      later: { result: { chance: [
        { p: 0.85, text: '투자한 돈을 돌려받지 못했어요.', effects: [stat('happiness', -8)] },
        { text: '약속한 돈을 돌려받았어요. 운이 따랐어요.', effects: [{ t: 'cash', v: (s, c) => Math.round(c.amt * 1.3) }] },
      ] } } },

    { id: 'E29', age: [55, 58], cond: (s) => s.children.length > 0, title: '자녀 독립', icon: 'key',
      text: '아이가 집을 떠나 혼자 살 준비를 해요. 어떻게 도와줄까요?',
      choices: [
        { label: '집 보증금을 크게 도와준다 (5,000만원)', effects: [{ t: 'cash', v: pl(-5000) }, stat('relation', 6)], tip: '큰 도움은 큰 돈이 들어요.' },
        { label: '조금 도와준다 (1,500만원)', effects: [{ t: 'cash', v: pl(-1500) }, stat('relation', 3)], tip: '나의 노후 자금도 함께 생각해요.' },
        { label: '스스로 해 보게 응원한다', effects: [stat('relation', 1)], tip: '도움의 크기보다 마음이 전해지는 게 중요해요.' },
      ] },

    { id: 'E30', when: (s, hist) => recession(s, hist, 56, 60) && invested(s), title: '두 번째 경기 침체', icon: 'chart', priority: true, before: [{ t: 'crash' }], terms: ['위험과 수익'],
      text: '또 경기가 나빠졌어요. 지금 줄면 회복을 기다릴 시간이 짧아요.', choices: crashChoices(30) },

    { id: 'E31', when: (s) => !!s.job && !s.paused && s.age >= (s.job === 'civil' ? 62 : 60), title: '퇴직', icon: 'briefcase',
      text: (s) => `오랫동안 일한 곳을 떠나요. 퇴직금은 ${money((s.jobYears * s.salary) / 12)}이에요.`,
      choices: [
        { label: '퇴직금을 모두 넣어 가게를 연다', effects: [{ t: 'retire', mode: 'stake', ev: 'E31', key: 'shop', years: 3 }], tip: '가게는 잘될 수도, 안될 수도 있어요.' },
        { label: '퇴직금을 15년에 걸쳐 나눠 받는다', effects: [{ t: 'retire', mode: 'annuity' }], tip: '나눠 받으면 오래 쓸 수 있어요.' },
        { label: '일부는 투자하고 일부는 생활비로 쓴다', effects: [{ t: 'retire', mode: 'lump' }, { t: 'buyIndex', frac: 0.5 }], tip: '쓸 돈과 불릴 돈을 나눠요.' },
        { label: '다시 일자리를 구한다', effects: [{ t: 'retire', mode: 'lump' }, income((s) => Math.round((s.flags['자격증2'] ? 1500 : 1300) * s.priceLevel), 8)],
          tip: '자격증이 있으면 더 좋은 일을 구할 수 있어요.' },
      ],
      later: { shop: { chance: [
        { p: 0.3, text: '가게가 자리를 잡았어요!', effects: [income(pl(3000), 15)] },
        { text: '가게를 닫게 되어 투자한 돈이 사라졌어요.', effects: [stat('happiness', -5)] },
      ] } } },

    { id: 'E32', age: [65, 65], title: '은퇴 생활', icon: 'coin', terms: ['연금'],
      text: '국민연금이 나오기 시작해요. 이제 시간을 어떻게 쓸까요?',
      choices: [
        { label: '여행과 배움에 쓴다 (연 1,000만원)', effects: [expense(pl(1000), 16), stat('happiness', 4), { t: 'recurring', what: 'stat', k: 'happiness', v: 1, years: 16 }, stat('health', 2), count('경험소비')], tip: '쓰는 만큼 경험이 쌓여요.' },
        { label: '최대한 아낀다', effects: [stat('happiness', -2)], tip: '아끼는 것도 방법이지만 쓰임도 중요해요.' },
        { label: '가족과 손주에게 쓴다 (연 600만원)', effects: [expense(pl(600), 16), stat('relation', 4), { t: 'recurring', what: 'stat', k: 'relation', v: 1, years: 16 }], tip: '마음을 나누는 데 돈을 쓰기도 해요.' },
      ] },

    { id: 'E33', age: [70, 70], title: '건강 투자', icon: 'hospital',
      text: '몸을 돌볼 때예요. 어떻게 할까요?',
      choices: [
        { label: '정기 검진과 운동을 한다 (연 200만원)', effects: [expense(pl(200), 10), stat('health', 5), { t: 'recurring', what: 'stat', k: 'health', v: 1, years: 10 }], tip: '미리 돌보면 큰 병원비를 줄일 수 있어요.' },
        { label: '다음에 하기로 미룬다', effects: [later('E33', 'hospital', 5)], tip: '미룬 건강 관리는 나중에 돌아와요.' },
      ],
      later: { hospital: { chance: [
        { p: 0.5, text: '병원 치료를 받았어요. 병원비가 들었어요.', effects: [{ t: 'cash', v: (s) => Math.round(-1500 * s.priceLevel * (s.flags['보험'] ? 0.3 : 1)) }, stat('health', -3)] },
        { text: '다행히 건강하게 지냈어요.' },
      ] } } },

    { id: 'E34', age: [75, 75], title: '남은 돈', icon: 'gift',
      text: '오랫동안 모은 돈을 어떻게 쓸까요?',
      choices: [
        { label: '자산의 10%를 기부한다', effects: [{ t: 'cash', v: (s) => -Math.max(0, Math.min(Math.round(LG.economy.netWorth(s) * 0.1), Math.round(liquid(s)))) },
          stat('happiness', 8), flag('나눔'), count('기부')], tip: '나누면 마음이 넉넉해져요.' },
        { label: '자녀와 가족에게 남긴다', effects: [stat('relation', 5)], tip: '남기는 마음도 하나의 쓰임이에요.' },
        { label: '하고 싶은 걸 다 하며 쓴다', effects: [expense(pl(500), 2), stat('happiness', 6), count('경험소비')], tip: '돈은 쌓는 것보다 잘 쓰는 게 목적일 수 있어요.' },
      ] },
  );
})();
