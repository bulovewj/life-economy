// 갈림길 이벤트 (원본: docs/시나리오.md). 돈은 만원.
// effects 종류: stat cash asset debt flag job path dependent setting recurring delayed sub
// 한 줄 40자 이내, 해요체. 판정 문구(좋다/나쁘다) 금지.
globalThis.LG = globalThis.LG || {};

(() => {
const D = () => LG.data.economy;
const stat = (k, v) => ({ t: 'stat', k, v });
const flag = (k) => ({ t: 'flag', k });

// 다른 이벤트 데이터 파일(events-*-data.js)이 같이 쓰는 짧은 도우미
LG.data.h = {
  stat, flag,
  count: (k) => ({ t: 'count', k }),
  cash: (v) => ({ t: 'cash', v }),
  asset: (k, v) => ({ t: 'asset', k, v }),
  pl: (n) => (s) => Math.round(n * s.priceLevel), // 오늘 값 → 그때 물가로
  expense: (v, years, from) => ({ t: 'recurring', what: 'expense', v, years, from }),
  income: (v, years, from) => ({ t: 'recurring', what: 'income', v, years, from }),
  ystat: (k, v, years) => ({ t: 'recurring', what: 'stat', k, v, years }),
  later: (ev, key, years) => ({ t: 'delayed', ev, key, years }),
  job: (key) => ({ t: 'job', key }),
};
const talentIs = (...ts) => (s) => ts.includes(s.cards.talent);

// 등록금 중 내 몫(가정 지원 비율 반영)
const own = (s) => Math.round(D().tuition * s.priceLevel * (1 - s.support.tuition));
// 대학 졸업 뒤 일자리. M3 임시: M4에서 E10(첫 직장)으로 바뀐다.
const grad = (key, years) => ({ t: 'delayed', ev: 'E07', key, years });
const tuition = (f) => ({ t: 'recurring', what: 'expense', v: (s) => Math.round(own(s) * f), years: 4 });

// 생애 마디 질문 (시간 멈춤, 한 줄, 건너뛰기 가능)
LG.data.markers = {
  12: '지금 나에게 돈이란 뭐예요?',
  20: '어른이 된 나에게 가장 중요한 건 뭐예요?',
  30: '지금까지 가장 잘한 선택은 뭐예요?',
  50: '돈으로 살 수 없었던 건 뭐였어요?',
  70: '12살의 나에게 한마디 해 준다면?',
};

LG.data.events = [
  { id: 'E01', age: [12, 12], title: '용돈 받는 날', icon: 'coin', terms: ['저축'],
    text: '이번 달 용돈을 받았어요. 어떻게 할까요?',
    choices: [
      { label: '먹고 싶은 거 다 사 먹는다', effects: [stat('happiness', 4), LG.data.h.count('경험소비')], tip: '쓰는 즐거움은 크지만 금방 사라져요.' },
      { label: '절반은 저금통에 넣는다', effects: [{ t: 'cash', v: 15 }, flag('저축습관')], tip: '조금씩 모으면 나중에 큰돈이 돼요.' },
      { label: '용돈기입장을 쓰고 갖고 싶은 게임기 목표를 세운다',
        effects: [{ t: 'cash', v: 12 }, stat('skill', 2), flag('저축습관'), flag('목표저축')], tip: '목표가 있으면 모으는 게 쉬워져요.' },
    ] },

  { id: 'E02', age: [13, 13], title: '한정판 굿즈', icon: 'gift', terms: ['필요와 욕구', '기회비용'],
    text: '반 친구들이 다 가진 한정판 굿즈가 5만원이에요.',
    choices: [
      { label: '바로 산다', effects: [{ t: 'cash', v: -5 }, stat('happiness', 3), stat('relation', 2), LG.data.h.count('경험소비')], tip: '친구랑 같은 걸 갖는 기쁨도 소중해요.' },
      { label: '중고로 싸게 산다', effects: [{ t: 'cash', v: -2 }, stat('happiness', 2)], tip: '같은 물건도 사는 방법에 따라 값이 달라요.' },
      { label: '정말 필요한지 일주일 기다린다',
        chance: [
          { p: 0.5, text: '일주일 뒤, 생각보다 안 갖고 싶어졌어요.', effects: [stat('happiness', 1)] },
          { text: '일주일이 지나도 갖고 싶어서 샀어요.', effects: [{ t: 'cash', v: -5 }, stat('happiness', 2)] },
        ], tip: '기다리면 필요와 욕구가 구분돼요.' },
    ] },

  { id: 'E03', age: [14, 14], title: '세뱃돈 30만원', icon: 'piggy', terms: ['이자·복리'],
    text: '세뱃돈을 30만원 받았어요. 어떻게 할까요?',
    choices: [
      { label: '다 쓴다', effects: [stat('happiness', 5), LG.data.h.count('경험소비')], tip: '쓴 돈은 돌아오지 않아요.' },
      { label: '내 이름으로 은행 통장을 만들어 예금한다', effects: [{ t: 'asset', k: 'deposit', v: 30 }, flag('통장')], tip: '은행에 맡기면 이자가 붙어요.' },
      { label: '부모님과 함께 지수펀드를 조금 사 본다', effects: [{ t: 'asset', k: 'index', v: 30 }, flag('투자경험')], tip: '투자는 늘 수도, 줄 수도 있어요.' },
      { label: '반은 예금, 반은 하고 싶던 것에', effects: [{ t: 'asset', k: 'deposit', v: 15 }, stat('happiness', 3)], tip: '나눠서 쓰면 둘 다 챙겨요.' },
    ] },

  { id: 'E04', age: [15, 15], title: '확률형 아이템', icon: 'phone', terms: ['위험과 수익'],
    text: '게임에 1% 확률 전설 아이템 뽑기가 있어요. 한 번에 3천원이에요.',
    choices: [
      { label: '나올 때까지 뽑는다', effects: [{ t: 'cash', v: -20 }, stat('happiness', -3), flag('충동')], tip: '확률이 1%면 평균 100번은 뽑아야 해요.' },
      { label: '딱 한 번만 뽑는다',
        effects: [{ t: 'cash', v: -0.3 }],
        chance: [{ p: 0.01, effects: [stat('happiness', 10)] }, { effects: [stat('happiness', -1)] }],
        tip: '운에 기대면 대부분 돈이 더 나가요.' },
      { label: '안 뽑는다', effects: [stat('skill', 1)], tip: '안 쓴 돈도 하나의 선택이에요.' },
    ] },

  { id: 'E05', age: [16, 16], title: '진로 고민', icon: 'briefcase',
    text: '이제 앞으로의 길을 정해야 해요. 어떤 길로 갈까요?',
    choices: [
      { label: '공부에 집중해 대학 진학을 준비한다', effects: [{ t: 'path', v: '대학' }, stat('skill', 6), stat('happiness', -2)], tip: '배움에 시간을 쓰면 선택지가 넓어져요.' },
      { label: '기술을 배우는 학교로 간다', effects: [{ t: 'path', v: '기술' }, stat('skill', 4), flag('자격증')], tip: '기술은 바로 쓸 수 있는 힘이에요.' },
      { label: '예체능·크리에이터 꿈에 도전한다', effects: [{ t: 'path', v: '꿈' }, stat('happiness', 5), stat('skill', 3)], tip: '좋아하는 일은 힘이 되지만 소득이 들쭉날쭉해요.' },
      { label: '아직 모르겠어요, 이것저것 해 본다', effects: [{ t: 'path', v: '탐색' }, stat('happiness', 3), stat('relation', 3)], tip: '모르는 것도 괜찮아요. 찾아가면 돼요.' },
    ] },

  { id: 'E06', age: [17, 17], title: '첫 아르바이트', icon: 'coin', terms: ['최저임금', '근로계약서'],
    text: '용돈을 직접 벌어 볼 수 있어요. 어떻게 할까요?',
    choices: [
      { label: '편의점 알바를 한다 (주말, 시급 1만 700원)',
        effects: [{ t: 'cash', v: 150 }, stat('health', -3), stat('skill', 1), flag('근로경험'),
          { t: 'sub', title: '사장님과 어떻게 약속할까요?', text: '일을 시작하기 전이에요.',
            choices: [
              { label: '근로계약서를 쓴다', tip: '일하기 전엔 꼭 근로계약서를 써요.' },
              { label: '그냥 말로 한다',
                chance: [{ p: 0.4, text: '사장님이 월급 일부를 안 줬어요.', effects: [{ t: 'cash', v: -50 }] }, { text: '다행히 월급을 다 받았어요.' }],
                tip: '말로만 한 약속은 증명하기 어려워요.' },
            ] }] },
      { label: '공부에 전념한다', effects: [stat('skill', 5)], tip: '지금은 배우는 데 시간을 쓰는 선택이에요.' },
      { label: '영상 채널을 시작한다',
        effects: [stat('skill', 2)],
        chance: [
          { p: (s) => (talentIs('art', 'speech')(s) ? 0.3 : 0.1), text: '구독자가 늘었어요!', effects: [{ t: 'cash', v: 80 }, flag('크리에이터')] },
          { text: '아직 구독자가 많지 않아요.' },
        ], tip: '새로운 도전은 결과가 불확실해요.' },
    ] },

  { id: 'E07', age: [19, 19], title: '졸업 후', icon: 'briefcase',
    text: '학교를 졸업해요. 앞으로 어떻게 할까요?',
    choices: [
      { label: '4년제 대학에 간다',
        cond: (s) => s.path === '대학' || s.stats.skill >= 40, disabledReason: '대학 진로를 골랐거나 실력이 40 이상이면 열려요.',
        effects: [flag('대졸'), grad('grad4', 4),
          { t: 'sub', title: '등록금은 어떻게 낼까요?', text: '4년 동안 내야 해요. 부모님이 도와주는 몫은 빼고 계산했어요.',
            choices: [
              { label: '모아 둔 돈으로 낸다', effects: [tuition(1)], tip: '돈이 모자라면 빌려야 할 수도 있어요.' },
              { label: '학자금 대출을 받는다', effects: [{ t: 'debt', k: 'student', v: (s) => own(s) * 4 }], tip: '취업 전 이자는 빚에 쌓이고, 취업 뒤 갚아요.' },
              { label: '장학금에 도전한다',
                chance: [
                  { p: (s) => (s.stats.skill >= 60 ? 0.7 : 0), text: '장학금을 받았어요! 등록금이 반으로 줄어요.', effects: [tuition(0.5)] },
                  { text: '이번엔 장학금을 못 받았어요.', effects: [tuition(1)] },
                ], tip: '실력을 쌓아 두면 기회가 열려요.' },
              { label: '알바를 하며 다닌다',
                effects: [tuition(1), { t: 'recurring', what: 'income', v: (s) => Math.round(own(s) * 0.8), years: 4 }, { t: 'recurring', what: 'stat', k: 'health', v: -5, years: 4 }],
                tip: '돈을 벌면 몸과 시간이 더 들어요.' },
            ] }] },
      { label: '전문대·기술 교육을 2년 받는다',
        effects: [{ t: 'recurring', what: 'expense', v: () => D().college2, years: 2 }, flag('자격증'), grad('grad2', 2)],
        tip: '기술은 바로 일에 쓸 수 있어요.' },
      { label: '바로 취업한다',
        effects: [{ t: 'dependent', v: false }, { t: 'job', key: (s) => (s.flags['자격증'] || s.path === '기술' ? 'techCert' : 'minwage') }, flag('첫직장')],
        tip: '일찍 시작하면 소득이 빨리 생겨요.' },
      { label: '공무원 시험을 준비한다 (2년)',
        effects: [{ t: 'recurring', what: 'stat', k: 'relation', v: -2, years: 2 }, grad('civilExam', 2)],
        tip: '준비하는 동안 소득은 없어요.' },
      { label: '꿈에 도전한다 (프리랜서)',
        cond: (s) => s.path === '꿈', disabledReason: '꿈 진로를 골랐을 때 열려요.',
        effects: [{ t: 'dependent', v: false }, { t: 'job', key: 'freelance' }, flag('꿈도전')],
        tip: '프리랜서는 해마다 소득이 달라져요.' },
      { label: '아직 고민해 본다 (1년 쉬며 찾기)',
        effects: [stat('happiness', 2), grad('rest1', 1)], tip: '쉬어 가는 시간도 선택이에요.' },
    ],
    later: {
      grad4: { text: '대학을 졸업했어요. 이제 일자리를 찾아요.', effects: [{ t: 'dependent', v: false }, flag('취업준비')] },
      grad2: { text: '교육을 마쳤어요. 이제 일자리를 찾아요.', effects: [{ t: 'dependent', v: false }, flag('취업준비')] },
      rest1: { text: '쉬는 동안 하고 싶은 일을 찾았어요.', effects: [{ t: 'dependent', v: false }, flag('취업준비')] },
      civilExam: {
        chance: [
          { p: (s) => 1 - Math.pow(0.7 - s.stats.skill / 300, 2), text: '시험에 합격해서 공무원이 되었어요!',
            effects: [{ t: 'dependent', v: false }, flag('공무원합격'), flag('취업준비')] },
          { text: '이번엔 합격하지 못했어요. 일자리를 찾아요.', effects: [{ t: 'dependent', v: false }, flag('취업준비')] },
        ] },
    } },
];
})();
