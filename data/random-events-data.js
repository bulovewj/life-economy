// 운 카드 R01~R16 (원본: docs/시나리오.md §6). weight=뽑힐 가중치, forced=돈이 모자라도 선택 가능(모자라면 빌림)
globalThis.LG = globalThis.LG || {};

(() => {
  const { stat, flag, cash, pl, expense, income, later } = LG.data.h;
  const ok = (label, effects, tip, extra) => ({ label, effects, tip, ...extra });
  const sal = (s) => !!s.job && !s.paused;
  const rent = (s) => ['wolse', 'jeonse', 'share'].includes(s.housing.type);

  LG.data.luck = {
    rate: 0.25, rateBusy: 0.15, // 갈림길이 있는 해는 낮게
    debtMin: 500, debtGap: 4, // 빚 상담 카드: 빚이 이만큼(만원) 넘고 순자산의 3배보다 크면, 4년에 한 번까지
    debtCard: { id: 'RDEBT', title: '빚 상담 받기', icon: 'shield', terms: ['대출·금리'],
      text: '빚이 많이 쌓였어요. 상담센터에서 이자를 줄이는 방법을 알려 줘요.',
      choices: [ok('상담을 받는다', [{ t: 'debtRelief', rate: 0.04 }, stat('happiness', -5)], '빚이 커지기 전에 도움을 구해요.')] },
    cards: [
      { id: 'R01', title: '지갑을 주웠다', icon: 'coin', weight: 3, cond: (s) => s.age <= 19,
        text: '길에서 지갑을 주웠어요. 어떻게 할까요?',
        choices: [
          { label: '주인을 찾아 준다', effects: [stat('relation', 3)], tip: '돌려주면 마음이 든든해져요.',
            chance: [{ p: 0.3, text: '주인이 사례금을 줬어요.', effects: [cash(5)] }, { text: '주인이 고맙다고 인사했어요.' }] },
          ok('내가 가진다', [cash(10), stat('happiness', -3)], '내 것이 아닌 돈은 마음이 불편해요.'),
        ] },
      { id: 'R02', title: '휴대폰 고장', icon: 'phone', weight: 4,
        text: '휴대폰이 고장 났어요. 어떻게 할까요?',
        choices: [
          ok('수리한다 (30만원)', [{ t: 'cash', v: pl(-30) }], '고쳐 쓰면 돈이 덜 들어요.', { forced: true }),
          ok('새 폰을 산다 (120만원)', [{ t: 'cash', v: pl(-120) }, stat('happiness', 2), LG.data.h.count('경험소비')], '새 물건은 기쁨과 비용이 함께 와요.'),
          ok('고장 난 채로 쓴다', [stat('happiness', -3)], '불편함도 비용이에요.'),
        ] },
      { id: 'R03', title: '회사 보너스', icon: 'coin', weight: 4, cond: sal,
        text: '회사에서 보너스를 줬어요!',
        choices: [ok('기쁘게 받는다', [{ t: 'cash', v: (s) => Math.round(s.salary * 0.1) }], '보너스도 계획해서 쓰면 오래가요.')] },
      { id: 'R04', title: '교통사고 부상', icon: 'hospital', weight: 2, cond: (s) => s.age >= 20,
        text: '교통사고로 다쳤어요. 병원에서 치료를 받아요.',
        choices: [ok('치료를 받는다', [{ t: 'cash', v: (s) => Math.round(-(s.flags['보험'] ? 30 : 300) * s.priceLevel) }, stat('health', -5)], '보험이 있으면 병원비를 줄여 줘요.', { forced: true })] },
      { id: 'R05', title: '집값 급등', icon: 'house', weight: 2, cond: (s) => s.assets.house > 0,
        text: '우리 동네 집값이 올랐어요.',
        choices: [ok('소식을 확인한다', [{ t: 'mult', k: 'house', f: 1.15 }], '집값은 오를 때도 내릴 때도 있어요.')] },
      { id: 'R06', title: '금리 인상', icon: 'chart', weight: 3, cond: (s) => s.age >= 20, terms: ['대출·금리'],
        text: '금리가 올랐어요. 대출 이자와 예금 이자가 3년간 함께 올라요.',
        choices: [ok('소식을 확인한다', [{ t: 'rateShift', loan: 0.015, dep: 0.01, years: 3 }], '금리는 빌린 사람과 맡긴 사람에게 달라요.')] },
      { id: 'R07', title: '물가가 껑충', icon: 'card', weight: 3, cond: (s) => !s.dependent, terms: ['물가'],
        text: '물가가 껑충 올라서 올해 생활비가 늘었어요.',
        choices: [ok('받아들인다', [expense((s) => Math.round(0.08 * 1500 * s.priceLevel), 1)], '같은 돈으로 살 수 있는 게 줄어요.')] },
      { id: 'R08', title: '친구가 돈을 빌려 달래', icon: 'coin', weight: 3, cond: (s) => s.age >= 20,
        text: '친구가 급하다며 돈을 빌려 달래요.',
        choices: [
          ok('빌려준다 (300만원)', [{ t: 'cash', v: pl(-300) }, later('R08', 'back', 1)], '돈 거래는 관계가 불편해질 수 있어요.'),
          ok('일부만 빌려준다 (100만원)', [{ t: 'cash', v: pl(-100) }], '잃어도 괜찮은 만큼만 빌려줘요.'),
          ok('거절한다', [stat('relation', -2)], '거절은 어렵지만 필요한 선택이에요.'),
        ],
        later: { back: { chance: [{ p: 0.6, text: '친구가 빌린 돈을 갚았어요.', effects: [{ t: 'cash', v: pl(300) }] }, { text: '친구가 돈을 갚지 못했어요.' }] } } },
      { id: 'R09', title: '목돈이 생겼어요', icon: 'gift', weight: 1, cond: (s) => s.age >= 40,
        text: '오래전에 넣어 둔 보험이 끝나서 목돈이 들어왔어요.',
        choices: [ok('기쁘게 받는다', [{ t: 'cash', v: pl(1000) }], '오래 모으면 큰돈이 돌아와요.')] },
      { id: 'R10', title: '재능 발견', icon: 'briefcase', weight: 1, cond: (s) => s.cards.talent !== 'none' && !s.dependent,
        text: '타고난 재능을 살려 볼 기회가 생겼어요.',
        choices: [ok('부업으로 해 본다', [income(pl(500), 5)], '재능은 쓸수록 자라요.')] },
      { id: 'R11', title: '보증금이 안 돌아와요', icon: 'warning', weight: 2, cond: (s) => s.housing.type === 'jeonse' && !s.flags['보증보험'], terms: ['월세·전세·보증금'],
        text: '집주인이 전세금을 제때 못 돌려줘요.',
        choices: [ok('어쩔 수 없이 일부를 잃는다', [{ t: 'asset', k: 'lease', v: (s) => -Math.round(s.assets.lease * 0.2 * 0.7) }, stat('happiness', -10)], '전세보증보험이 이럴 때 지켜 줘요.')] },
      { id: 'R12', title: '반려동물 입양', icon: 'gift', weight: 2, cond: (s) => s.age >= 25,
        text: '유기 동물을 입양할 기회가 생겼어요.',
        choices: [
          ok('입양한다 (연 150만원)', [expense(pl(150), 12), stat('happiness', 6), stat('relation', 2)], '함께 사는 데는 돈과 책임이 들어요.'),
          ok('다음에 생각해 본다', [], '지금의 여유를 먼저 살펴봐요.'),
        ] },
      { id: 'R13', title: '승진', icon: 'briefcase', weight: 3, cond: (s) => sal(s) && s.stats.skill >= 45,
        text: '그동안의 노력이 인정받아 승진했어요!',
        choices: [ok('기쁘게 받는다', [{ t: 'raise', f: 1.12 }], '실력이 쌓이면 기회가 와요.')] },
      { id: 'R14', title: '경품 당첨', icon: 'gift', weight: 1,
        text: '경품 행사에 당첨됐어요!',
        choices: [ok('기쁘게 받는다', [cash(50)], '뜻밖의 돈은 계획 없이 쓰기 쉬워요.')] },
      { id: 'R15', title: '이사 비용', icon: 'house', weight: 2, cond: rent,
        text: '집 계약이 끝나서 이사해야 해요.',
        choices: [ok('이사한다 (150만원)', [{ t: 'cash', v: pl(-150) }], '집을 옮기는 데도 비용이 들어요.', { forced: true })] },
      { id: 'R16', title: '호황', icon: 'chart', weight: 2,
        text: '경기가 아주 좋아요. 주가가 오르고 월급도 올랐어요.',
        choices: [ok('기쁘게 맞이한다', [{ t: 'mult', k: 'index', f: 1.2 }, { t: 'raise', f: 1.05 }], '좋은 때가 늘 이어지지는 않아요.')] },
    ],
  };
})();
