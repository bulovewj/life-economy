// S11 용어 사전: 얻은 카드는 풀이, 못 얻은 카드는 ?
LG.screens.terms = function (back) {
  const { el, render } = LG.ui, T = LG.data.terms;
  const got = LG.game.s ? LG.game.s.terms : {};
  const have = LG.game.s ? Object.keys(got).length : 0;
  render(el('section', { class: 'screen' },
    el('h2', {}, `용어 사전 (${have}/${Object.keys(T).length})`),
    LG.game.s ? null : el('p', {}, '게임을 하면서 용어 카드를 모아 봐요.'),
    el('div', { class: 'col' }, Object.values(T).map((t) =>
      got[t.name] ? el('div', { class: 'box term' }, el('b', {}, t.name), el('br'), t.desc) : el('div', { class: 'box' }, '? ? ?'))),
    el('button', { class: 'btn', type: 'button', onclick: back || (() => LG.screens.title()) }, '돌아가기')));
};
