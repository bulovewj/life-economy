// S1 나 만들기, S2 시작 카드
LG.screens.create = function () {
  const { el, render } = LG.ui, N = LG.data.economy.names;
  let gender = 'm';
  const input = el('input', { type: 'text', maxlength: String(N.max), placeholder: '별명', 'aria-label': '별명', autocomplete: 'off' });
  const msg = el('p', { class: 'msg' }, '');
  const buttons = LG.data.economy.genders.map(({ key, label }, i) =>
    el('button', { class: 'box choice pick' + (i === 0 ? ' on' : ''), type: 'button', 'aria-pressed': String(i === 0), onclick: () => {
      gender = key;
      buttons.forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-pressed', String(j === i)); });
    } }, LG.ui.sprite('avatar', `${key}_1_uniform_0`, 3), label));
  const next = () => {
    const name = input.value.trim();
    if (N.badWords.some((w) => name.includes(w))) { msg.textContent = '다른 별명을 써 볼까요?'; return; }
    LG.game.begin(name, gender);
    LG.screens.cards();
  };
  render(el('section', { class: 'screen' },
    el('h2', {}, '나 만들기'),
    el('p', {}, '실명 말고 별명을 써요.'),
    input, msg,
    el('p', {}, '나는 누구인가요?'),
    el('div', { class: 'row', role: 'group', 'aria-label': '성별' }, buttons),
    el('button', { class: 'btn', type: 'button', onclick: next }, '다음')));
};

LG.screens.cards = function () {
  const { el, render } = LG.ui, s = LG.game.s, C = LG.data.economy.cards;
  const titles = { support: '가정의 지원', place: '사는 곳', talent: '타고난 재능' };
  const cards = Object.keys(titles).map((k) => {
    const face = C[k][s.cards[k]];
    const card = el('button', { class: 'card', type: 'button', onclick: () => card.classList.add('flipped') },
      el('span', { class: 'back', style: LG.ui.frameStyle('cards', 'back', 3) }, el('small', {}, titles[k])),
      el('span', { class: 'front', style: LG.ui.frameStyle('cards', k, 3) }, el('b', {}, titles[k]), face.label, el('small', {}, face.desc)));
    return card;
  });
  render(el('section', { class: 'screen' },
    el('h2', {}, '시작 카드'),
    el('p', {}, `세계 번호 ${s.seed} · 카드를 눌러 뒤집어 봐요.`),
    el('div', { class: 'row' }, cards),
    el('button', { class: 'btn', type: 'button', onclick: () => LG.screens.year() }, '인생 시작')));
};
