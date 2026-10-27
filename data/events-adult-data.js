// 어른 (30~49세) 갈림길 E19~E26. 원본: docs/시나리오.md §3
globalThis.LG = globalThis.LG || {};

(() => {
  const { stat, flag, cash, pl, expense, income, ystat, later, job } = LG.data.h;
  const recession = (s, hist, from, to) => s.age >= from && s.age <= to && hist[s.age - 12].isRecession;
  const invested = (s) => s.assets.index + s.assets.stock + s.assets.coin > 0;
  const salaried = ['bigco', 'smallco', 'tech', 'techCert', 'tiny', 'minwage'];
  const hasKid = (s) => s.children.some((b) => s.age - b >= 7);
  const rng = (s) => LG.state.rngOf(s);

  // 침체 갈림길 (E21·E30 공통 선택지)
  const crashChoices = (id) => [
    { label: '무서워서 다 판다', effects: [{ t: 'liquidate' }], tip: '떨어졌을 때 팔면 손해가 확정돼요.' },
    { label: '그대로 둔다', effects: [flag(`침체버팀${id}`)], tip: '시간이 지나면 회복되는 경우가 많았어요.' },
    { label: '비상금으로 더 산다', effects: [{ t: 'buyIndex', frac: 0.5 }, flag(`침체버팀${id}`)], tip: '싸게 살 기회일 수도, 더 떨어질 수도 있어요.' },
  ];

  LG.data.events.push(
    { id: 'E19', age: [31, 34], cond: (s) => s.assets.house === 0, title: '내 집 마련', icon: 'key', terms: ['대출·금리'],
      text: '내 집을 마련할 수 있는 때가 왔어요. 어떻게 할까요?',
      choices: [
        { label: '청약을 넣는다', cond: (s) => !!s.flags['통장'], disabledReason: '은행 통장이 있어야 청약을 넣을 수 있어요.',
          effects: [flag('청약'), { t: 'risk', ev: 'E19', key: 'win', years: 4 }], tip: '당첨은 운이 따라야 해요.' },
        { label: '대출을 받아 바로 산다 (집값의 70% 대출)', need: (s) => LG.housing.buyNeed(s, 1, 0.7),
          effects: [{ t: 'buyHouse', factor: 1, loanRatio: 0.7 }], tip: '빌린 돈으로 사면 오를 때도 내릴 때도 크게 움직여요.' },
        { label: '집값이 싼 중소도시로 이사한다', cond: (s) => s.cards.place === 'big', disabledReason: '대도시에 살 때만 열려요.',
          effects: [{ t: 'changeCity', place: 'mid' }, { t: 'raise', f: 0.9 }, stat('happiness', 2)], tip: '사는 곳에 따라 집값과 월급이 달라져요.' },
        { label: '계속 임차하고 그 돈을 투자한다', effects: [flag('임차전략')], tip: '집을 안 사는 것도 하나의 전략이에요.' },
      ],
      later: { win: { p: (s) => (s.assets.house > 0 ? 0 : 0.12 + (s.spouse ? 0.05 : 0) + (s.children.length ? 0.05 : 0)),
        text: '청약에 당첨됐어요!',
        effects: [{ t: 'buyHouse', factor: 0.8, loanRatio: 0.7, failText: '당첨됐지만 계약금이 모자라 포기했어요.' }] } } },

    { id: 'E20', age: [30, 38], cond: (s) => !!s.spouse, title: '가족 계획', icon: 'baby',
      text: '가족이 늘어날 수도 있어요. 어떻게 할까요?',
      choices: [
        { label: '아이 한 명을 키운다', effects: [{ t: 'child' }, stat('relation', 8), stat('happiness', 6), ystat('health', -2, 3), income(1200, 2)],
          tip: '아이를 키우는 데는 돈과 시간이 함께 들어요.' },
        { label: '아이 두 명을 키운다', effects: [{ t: 'child' }, stat('relation', 8), stat('happiness', 6), ystat('health', -2, 3), income(1200, 2), later('E20', 'second', 3)],
          tip: '아이가 둘이면 돈과 시간도 두 배예요.' },
        { label: '둘이서 산다', effects: [stat('happiness', 3)], tip: '둘만의 시간과 돈을 더 쓸 수 있어요.' },
      ],
      later: { second: { text: '둘째가 태어났어요.', effects: [{ t: 'child' }, stat('relation', 4), stat('happiness', 3)] } } },

    { id: 'E21', when: (s, hist) => recession(s, hist, 33, 37) && invested(s), title: '첫 번째 경기 침체', icon: 'chart', priority: true, before: [{ t: 'crash' }],
      text: '뉴스가 나와요. "경제가 크게 흔들려요. 주가가 30% 떨어졌어요."', choices: crashChoices(21), terms: ['위험과 수익'] },

    { id: 'E22', when: (s, hist) => {
        if (!salaried.includes(s.job) || s.paused) return false;
        const p = (hist[s.age - 12].isRecession ? 0.25 : s.job === 'bigco' ? 0.02 : 0.03) + (s.stats.skill < 30 ? 0.05 : 0);
        return rng(s).next() < p;
      }, title: '실직', icon: 'warning', terms: ['비상금'],
      text: '회사가 어려워져서 일을 그만두게 됐어요.',
      choices: [
        { label: '실업급여를 받으며 다시 일자리를 찾는다',
          effects: [income((s) => Math.round(s.salary * 0.3), 1), { t: 'pause', years: 1, mult: (s) => (rng(s).next() < 0.7 ? 1 : 0.7) },
            stat('happiness', (s) => (s.flags['비상금'] ? -3 : -10))], tip: '비상금은 이럴 때 쓰는 돈이에요.' },
        { label: '바로 아무 일이나 시작한다', effects: [{ t: 'raise', f: 0.7 }, stat('happiness', (s) => (s.flags['비상금'] ? -3 : -10))],
          tip: '빨리 일하면 소득은 이어지지만 월급이 줄어요.' },
        { label: '이참에 내 가게를 열어 본다', effects: [job('startup'), later('E10', 'startupResult', 2), stat('happiness', (s) => (s.flags['비상금'] ? -3 : -10))],
          tip: '창업은 크게 벌 수도, 잃을 수도 있어요.' },
      ] },

    { id: 'E23', age: [38, 45], cond: hasKid, title: '학원 고민', icon: 'gift',
      text: '아이가 학원을 다니고 싶대요. 어떻게 할까요?',
      choices: [
        { label: '학원을 여러 개 보낸다 (연 1,800만원)', effects: [expense(pl(1800), 5), stat('relation', -3)], tip: '정답은 없어요. 무엇을 위해 쓰는지가 중요해요.' },
        { label: '꼭 필요한 것만 보낸다 (연 600만원)', effects: [expense(pl(600), 5)], tip: '필요한 것을 고르는 것도 배움이에요.' },
        { label: '아이와 함께 정한다', effects: [expense((s) => Math.round(rng(s).int(300, 1200) * s.priceLevel), 5), stat('relation', 5)], tip: '함께 정하면 서로의 마음을 알 수 있어요.' },
        { label: '학원 없이 함께 놀고 배운다', effects: [stat('relation', 6)], tip: '돈을 쓰지 않아도 배울 수 있어요.' },
      ] },

    { id: 'E24', age: [40, 40], title: '주말 부업', icon: 'briefcase',
      text: '주말에 시간이 남아요. 어떻게 쓸까요?',
      choices: [
        { label: '주말 부업을 한다', effects: [income(pl(800), 3), ystat('health', -4, 3)], tip: '돈을 벌면 쉴 시간은 줄어들어요.' },
        { label: '푹 쉰다', effects: [stat('health', 5), stat('happiness', 3)], tip: '쉬는 것도 나를 위한 투자예요.' },
        { label: '온라인 가게를 열어 본다', effects: [stat('skill', 3)], tip: '새 일은 결과가 불확실해요.',
          chance: [{ p: 0.4, text: '가게가 잘돼서 부수입이 생겼어요.', effects: [income(pl(1500), 5)] }, { text: '수입이 조금밖에 안 생겼어요.', effects: [income(pl(200), 5)] }] },
      ] },

    { id: 'E25', age: [42, 46], title: '부모님 병원비', icon: 'hospital',
      text: '부모님이 다치셔서 수술비 1,000만원이 필요해요. 부모님은 회복하세요.',
      choices: [
        { label: '형제자매와 나눠 낸다 (400만원)', effects: [{ t: 'cash', v: pl(-400) }, stat('relation', 4)], tip: '가족의 일도 돈 계획에 들어가요.' },
        { label: '내가 다 낸다 (1,000만원)', effects: [{ t: 'cash', v: pl(-1000) }, stat('relation', 6)], tip: '큰돈이 한꺼번에 나갈 수 있어요.' },
        { label: '부모님 보험으로 해결해 본다', cond: (s) => !s.flags['부모보험없음'], disabledReason: '부모님은 보험이 없으셨어요.',
          tip: '보험이 있으면 큰 병원비도 줄어요.',
          chance: [{ p: 0.7, text: '부모님의 보험으로 해결됐어요.' },
            { text: '부모님은 보험이 없으셨어요. 다시 골라 봐요.', effects: [flag('부모보험없음'), { t: 'retry' }] }] },
        { label: '대출을 받아 해결한다', effects: [{ t: 'debt', k: 'credit', v: pl(400) }, stat('relation', 4)], tip: '빌린 돈에는 이자가 붙어요.' },
      ] },

    { id: 'E26', age: [45, 45], cond: (s) => s.loans.some((l) => l.kind === 'mortgage') || s.cash > 3000 * s.priceLevel, title: '대출이냐 투자냐', icon: 'house',
      text: '여유가 생겼어요. 돈을 어디에 쓸까요?',
      choices: [
        { label: '더 넓은 집으로 갈아탄다', cond: (s) => s.assets.house > 0, disabledReason: '내 집이 있을 때 열려요.',
          effects: [{ t: 'upsize' }, stat('happiness', 3)], tip: '집이 커지면 빚도 함께 커져요.' },
        { label: '대출부터 갚는다', cond: (s) => s.loans.some((l) => l.kind === 'mortgage'), disabledReason: '갚을 주택담보대출이 없어요.',
          effects: [{ t: 'prepay' }], tip: '이자를 안 내는 것도 수익이에요.' },
        { label: '투자를 늘린다', effects: [{ t: 'setting', k: 'saveRate', v: (s) => Math.min(0.5, s.saveRate + 0.1) }], tip: '투자는 늘 수도, 줄 수도 있어요.' },
      ] },
  );
  // E30(events-senior-data.js)이 같이 쓴다
  LG.data.h.crashChoices = crashChoices;
  LG.data.h.recession = recession;
  LG.data.h.invested = invested;
})();
