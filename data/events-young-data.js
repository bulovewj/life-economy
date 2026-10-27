// 청년 (20~29세) 갈림길 E08~E18 + 일자리 없음 X01. 원본: docs/시나리오.md §2
globalThis.LG = globalThis.LG || {};

(() => {
  const { stat, flag, count, cash, asset, pl, expense, ystat, later, job } = LG.data.h;
  const money = (n) => LG.economy.formatMoney(n);
  const idle = (s) => !s.job && !s.dependent && !s.paused;
  const doneJob = (key, extra = []) => [job(key), flag('첫직장'), { t: 'flag', k: '취업준비', v: false }, ...extra];

  LG.data.events.push(
    { id: 'E08', age: [20, 20], title: '첫 카드', icon: 'card', terms: ['신용·할부'],
      text: '이제 카드를 만들 수 있어요. 어떤 카드를 쓸까요?',
      choices: [
        { label: '체크카드만 쓴다', effects: [flag('체크카드')], tip: '통장에 있는 돈만큼만 쓸 수 있어요.' },
        { label: '신용카드로 할부를 마음껏 쓴다', effects: [stat('happiness', 4), count('경험소비'), flag('할부'), { t: 'risk', ev: 'E08', key: 'bomb', years: 5 }],
          tip: '할부는 미래의 내 돈을 당겨 쓰는 거예요.' },
        { label: '신용카드를 쓰되 한도를 정한다', effects: [flag('신용관리')], tip: '약속을 지키면 신용이 쌓여요.' },
      ],
      later: { bomb: { p: 0.3, text: '카드값 폭탄이 터졌어요!', effects: [{ t: 'debt', k: 'card', v: pl(150) }, stat('happiness', -3)] } } },

    { id: 'E09', age: [21, 23], title: '이상한 문자', icon: 'warning', terms: ['금융사기'],
      text: '문자가 왔어요. "[택배] 주소가 잘못됐어요. 링크를 눌러 확인하세요."',
      choices: [
        { label: '링크를 누른다',
          effects: [{ t: 'cash', v: (s) => (s.flags['통장'] || s.assets.deposit > 0 ? -Math.min(200, Math.round(s.assets.deposit / 2)) : 0) }, stat('happiness', -8)],
          tip: '모르는 링크는 누르지 않아요.' },
        { label: '무시하고 삭제·신고한다', effects: [flag('사기방어09')], tip: '잘했어요! 118번에 불법스팸을 신고해요.' },
        { label: '가족에게 먼저 물어본다', effects: [stat('relation', 2), flag('사기방어09')], tip: '의심되면 혼자 판단하지 말고 확인해요.' },
      ] },

    { id: 'E10', when: (s) => !!s.flags['취업준비'] && !s.job, title: '첫 직장', icon: 'briefcase',
      text: '일자리를 정할 때예요. 회사마다 월급과 바쁜 정도가 달라요.',
      choices: [
        { label: '대기업에 지원한다', cond: (s) => (s.flags['대기업도전'] || 0) < 2, disabledReason: '이미 두 번 도전했어요.',
          effects: [count('대기업도전')], tip: '회사마다 월급·바쁨·안정성이 달라요. 정답은 없어요.',
          chance: [
            { p: (s) => Math.max(0.05, (s.stats.skill - 20 + (s.cards.place === 'big' ? 10 : 0)) / 100),
              text: '합격했어요! 대기업에서 일해요.', effects: [...doneJob('bigco', [ystat('happiness', -1, 30), ystat('health', -1, 30)])] },
            { text: '이번엔 떨어졌어요. 다시 골라 봐요.', effects: [{ t: 'retry' }] },
          ] },
        { label: '중소기업에 간다', effects: [...doneJob('smallco', [ystat('skill', 1, 10)])], tip: '일을 넓게 배울 수 있어요. 정답은 없어요.' },
        { label: '공무원으로 일한다', cond: (s) => !!s.flags['공무원합격'], disabledReason: '공무원 시험에 합격하면 열려요.',
          effects: [...doneJob('civil')], tip: '안정적이지만 월급 오름폭은 작아요.' },
        { label: '창업한다', cond: (s) => s.stats.skill >= 40 || ['craft', 'speech'].includes(s.cards.talent),
          disabledReason: '실력이 40 이상이거나 손재주·말솜씨 재능이 있으면 열려요.',
          effects: [...doneJob('startup'), later('E10', 'startupResult', 2)], tip: '창업은 크게 벌 수도, 잃을 수도 있어요.' },
        { label: '프리랜서·크리에이터로 일한다', effects: [...doneJob('freelance', [ystat('happiness', 1, 20)])], tip: '해마다 소득이 달라서 계획이 중요해요.' },
      ],
      later: {
        startupResult: { chance: [
          { p: 0.25, text: '가게가 크게 잘됐어요!', effects: [job('startupHit')] },
          { p: 0.45, text: '가게를 안정적으로 꾸려 가요.', effects: [job('startupOk')] },
          { text: '가게 문을 닫게 됐어요. 빚이 생겼어요.', effects: [{ t: 'debt', k: 'credit', v: pl(1500) }, job(null)] },
        ] },
      } },

    { id: 'E11', when: (s) => !!s.job && s.job !== 'startup', title: '첫 월급', icon: 'coin', terms: ['세전·세후', '비상금'],
      text: (s) => `세전 월급은 ${money(s.salary / 12)}이에요. 보험료와 세금을 빼면 실수령액은 ${money((s.salary / 12) * LG.data.economy.netRate)}이에요.`,
      choices: [
        { label: '부모님께 선물하고 나머지는 저축한다', effects: [stat('relation', 6), { t: 'transfer', to: 'deposit', v: (s) => Math.round((s.salary / 12) * 0.85 * 0.5) }], tip: '고마운 마음을 전하는 것도 좋은 쓰임이에요.' },
        { label: '명품 하나를 플렉스한다', effects: [cash(-300), stat('happiness', 5), count('경험소비'), later('E11', 'flex', 1)], tip: '기분은 금방 익숙해져요.' },
        { label: '비상금 통장부터 만든다', effects: [flag('비상금'), { t: 'transfer', to: 'emergency', v: pl(375) }], tip: '갑작스러운 일에 대비하는 돈이에요.' },
        { label: '바로 투자를 시작해 본다', effects: [{ t: 'setting', k: 'saveRate', v: 0.2 }, { t: 'ui', v: 'wallet' }], tip: '투자는 나눠서 천천히 시작해요.' },
      ],
      later: { flex: { text: '플렉스한 기분이 조금 익숙해졌어요.', effects: [stat('happiness', -3)] } } },

    { id: 'E12', when: (s) => !!s.job && s.age >= 22, title: '독립', icon: 'house', terms: ['월세·전세·보증금'],
      text: '이제 혼자 살 수도 있어요. 어디에서 살까요?',
      choices: [
        { label: '부모님 집에서 계속 산다', effects: [ystat('relation', -1, 8), { t: 'recurring', what: 'stat', k: 'relation', v: -1, years: 50, from: 8 }], tip: '돈은 아끼지만 서로 배려가 필요해요.' },
        { label: '원룸 월세로 산다', need: (s) => LG.housing.need(s, 'wolse'), effects: [{ t: 'move', to: 'wolse' }, stat('happiness', 5)],
          tip: '월세는 매달 나가지만 보증금은 돌려받아요.' },
        { label: '전세로 산다 (전세대출 80%)', need: (s) => LG.housing.need(s, 'jeonse'),
          effects: [{ t: 'move', to: 'jeonse' },
            { t: 'sub', title: '전세보증보험에 가입할까요?', text: '집주인이 돈을 못 돌려줄 때를 대비하는 보험이에요.',
              choices: [
                { label: '가입한다 (연 30만원)', effects: [expense(30, 10), flag('보증보험')], tip: '작은 비용으로 큰 돈을 지킬 수 있어요.' },
                { label: '가입하지 않는다', effects: [flag('전세위험')], tip: '보험료는 아끼지만 위험이 남아요.' },
              ] }],
          tip: '전세는 큰돈이 묶이지만 월세가 없어요.' },
        { label: '셰어하우스에서 산다', effects: [{ t: 'move', to: 'share' }, stat('relation', 4), stat('happiness', 2)], tip: '함께 살면 비용을 나눌 수 있어요.' },
      ] },

    { id: 'E13', age: [25, 25], title: '저축·투자 설정', icon: 'chart', terms: ['분산투자', '위험과 수익'],
      text: '월급 중 얼마를 모으고, 어디에 나눠 담을지 정해요. 나중에 내 지갑에서 언제든 바꿀 수 있어요.',
      choices: [
        { label: '내 지갑에서 정하러 간다', effects: [{ t: 'setting', k: 'saveRate', v: 0.1 }, { t: 'ui', v: 'wallet' }], tip: '달걀을 한 바구니에 담지 않아요.' },
      ] },

    { id: 'E14', age: [26, 26], title: '리딩방', icon: 'warning', terms: ['금융사기', '위험과 수익'],
      text: '친구가 말해요. "이 코인 무조건 10배 간대. 지금 들어와!"',
      choices: [
        { label: '모은 돈 전부를 넣는다', effects: [{ t: 'stake', frac: 1, ev: 'E14', key: 'result', years: 2 }], tip: '"무조건"이라는 말은 거의 사기예요.' },
        { label: '잃어도 괜찮은 만큼만 넣는다', effects: [{ t: 'stake', frac: 0.1, ev: 'E14', key: 'result', years: 2 }], tip: '잃어도 괜찮은 돈만 쓰면 충격이 작아요.' },
        { label: '거절한다', effects: [stat('relation', -1), flag('사기방어14')], tip: '거절도 실력이에요.' },
      ],
      later: { result: { chance: [
        { p: 0.5, text: '2년 뒤, 가치가 0.3배로 줄었어요.', effects: [{ t: 'cash', v: (s, c) => Math.round(c.amt * 0.3) }] },
        { p: 0.3, text: '운영자가 사라졌어요. 돈을 돌려받지 못했어요.', effects: [stat('happiness', -6)] },
        { text: '가치가 3배가 됐어요. 운이 따랐어요.', effects: [{ t: 'cash', v: (s, c) => c.amt * 3 }] },
      ] } } },

    { id: 'E15', age: [27, 27], title: '자동차', icon: 'car', terms: ['감가상각'],
      text: '차가 있으면 편해요. 어떻게 할까요?',
      choices: [
        { label: '새 차를 할부로 산다 (3,000만원)', effects: [{ t: 'debt', k: 'car', v: pl(3000) }, asset('car', pl(3000)), stat('happiness', 6), count('경험소비'), expense(pl(250), 50)],
          tip: '차는 해마다 값이 떨어져요.' },
        { label: '중고차를 현금으로 산다 (800만원)', effects: [{ t: 'cash', v: pl(-800) }, asset('car', pl(800)), stat('happiness', 3), expense(pl(250), 50), { t: 'risk', ev: 'E15', key: 'repair', years: 20 }],
          tip: '싸게 사도 수리비가 들 수 있어요.' },
        { label: '대중교통과 자전거를 이용한다', effects: [stat('health', 2), expense(pl(60), 50)], tip: '차가 없으면 돈과 몸이 가벼워요.' },
        { label: '필요할 때 카셰어링을 쓴다', effects: [expense(pl(120), 50)], tip: '쓴 만큼만 내면 부담이 줄어요.' },
      ],
      later: { repair: { p: 0.1, text: '차가 고장 나서 수리했어요.', effects: [{ t: 'cash', v: pl(-150) }] } } },

    { id: 'E16', age: [28, 28], cond: (s) => !!s.job, title: '이직 제안', icon: 'briefcase', terms: ['기회비용'],
      text: '다른 회사에서 연락이 왔어요. 어떻게 할까요?',
      choices: [
        { label: '연봉 20%를 더 주는 곳으로 간다', effects: [{ t: 'raise', f: 1.2 }, stat('health', -3), stat('relation', -2)], tip: '월급이 오르면 대신 바빠질 수 있어요.' },
        { label: '남아서 승진을 노린다', effects: [later('E16', 'promo', 2)], tip: '기다리는 동안은 월급이 그대로예요.' },
        { label: '1년 쉬며 자격증·대학원을 준비한다',
          effects: [{ t: 'pause', years: 1, mult: 1.25 }, expense(pl(700), 1), stat('skill', 15)], tip: '나에게 투자하면 몸값이 올라요.' },
      ],
      later: { promo: { chance: [
        { p: (s) => (s.stats.skill >= 50 ? 1 : 0), text: '승진했어요! 월급이 올랐어요.', effects: [{ t: 'raise', f: 1.15 }] },
        { text: '이번엔 승진하지 못했어요.' },
      ] } } },

    { id: 'E17', age: [28, 35], cond: (s) => s.stats.relation >= 50, title: '결혼', icon: 'ring',
      fallback: { label: '그렇구나', text: '인연을 만나기 어려운 해였어요. 혼자서도 잘 지내요.', tip: '사람마다 삶의 속도가 달라요.', effects: [flag('비혼')] },
      text: '함께 살고 싶은 사람이 생겼어요. 어떻게 할까요?',
      choices: [
        { label: '결혼한다', effects: [{ t: 'spouse' }, stat('relation', 10), stat('happiness', 6),
          { t: 'sub', title: '결혼식은 어떻게 할까요?', text: '결혼식과 준비에 드는 돈이에요.',
            choices: [
              { label: '스몰웨딩 (2,000만원)', effects: [{ t: 'cash', v: pl(-2000) }], tip: '작게 해도 마음은 충분히 전해져요.' },
              { label: '보통 결혼식 (5,900만원)', effects: [{ t: 'cash', v: pl(-5900) }], tip: '보통 결혼식은 준비 비용이 커요.' },
              { label: '호화 결혼식 (1억원)', effects: [{ t: 'cash', v: pl(-10000) }, stat('happiness', 2)], tip: '큰 행사는 큰 돈이 들어요.' },
              { label: '식 없이 가족 식사만 한다', effects: [], tip: '꼭 큰 식이 필요한 건 아니에요.' },
            ] }], tip: '둘이 살면 생활비와 소득이 함께 바뀌어요.' },
        { label: '아직은 아니에요', effects: [{ t: 'reschedule', ev: 'E17', age: 35 }], tip: '서두르지 않아도 괜찮아요.' },
        { label: '혼자 사는 삶을 택한다', effects: [stat('happiness', 3), flag('비혼')], tip: '함께든 혼자든 나에게 맞는 삶이 좋아요.' },
      ] },

    { id: 'E18', age: [29, 29], title: '보험', icon: 'shield', terms: ['보험'],
      text: '보험 설계사가 찾아왔어요. 어떻게 할까요?',
      choices: [
        { label: '실손보험 하나만 든다 (연 40만원)', effects: [expense(pl(40), 52), flag('보험')], tip: '병원비 걱정을 줄여 주는 보험이에요.' },
        { label: '들지 않는다', effects: [], tip: '사고가 나면 병원비를 전부 내야 해요.' },
        // 원안 연 600은 평생 3억 넘게 나가 다른 모든 선택을 압도해서 M7에서 300으로 낮춤
        { label: '권유받은 보험을 다 든다 (연 300만원)', effects: [expense(pl(300), 52), flag('보험')], tip: '보험도 너무 많으면 짐이에요.' },
      ] },

    { id: 'X01', when: (s) => idle(s) && !s.retired && s.age < 60 && s.joblessYears >= 2 && !s.flags['취업준비'], title: '일자리 제안', icon: 'briefcase',
      text: '일을 쉰 지 두 해가 지났어요. 일자리 두 곳을 소개받았어요.',
      choices: [
        { label: '최저임금 일자리를 구한다', effects: [job('minwage')], tip: '일하며 다시 시작하는 것도 좋은 길이에요.' },
        { label: '작은 가게에서 일한다', effects: [job('tiny')], tip: '작은 곳에서 시작해도 경험이 쌓여요.' },
      ] },
  );
})();
