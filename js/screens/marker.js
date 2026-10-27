// S9 생애 마디 질문: 시간이 멈추고 한 줄을 남긴다(건너뛰기 가능)
LG.screens.marker = function (question, done) {
  const { el, render } = LG.ui, s = LG.game.s;
  const input = el('input', { type: 'text', maxlength: '60', 'aria-label': question, autocomplete: 'off' });
  if (LG.game.mode === 'next') LG.game.auto = false; // 배속 진행은 답을 남긴 뒤 이어진다
  const finish = (text) => { s.marks[s.age] = text; LG.lifelog.add(s, 'mark', LG.data.economy.logText.mark(question, text)); done(); };
  render(el('section', { class: 'screen marker' },
    el('p', { class: 'box' }, `${s.age}살이 되었어요. 잠깐 멈춰서 생각해 봐요.`),
    el('h2', {}, question),
    input,
    el('div', { class: 'row' },
      el('button', { class: 'btn', type: 'button', onclick: () => finish(input.value.trim()) }, '남기기'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => finish('') }, '건너뛰기'))));
};
