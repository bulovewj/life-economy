// S0 타이틀
LG.screens.title = function () {
  const { el, render } = LG.ui;
  const cfg = LG.game.config(), canSave = LG.save.available(), saved = canSave && LG.save.load();
  const start = () => {
    if (saved && !confirm('저장된 인생이 지워져요. 새로 시작할까요?')) return;
    LG.save.clear();
    LG.screens.create();
  };
  render(el('section', { class: 'screen title' },
    LG.ui.scene(30, 0, 'night'),
    el('h1', {}, '인생 살기 게임', el('br'), el('span', {}, '경제편')),
    el('p', { class: 'sub' }, '12살부터 80살까지, 내 선택으로 살아 봐요.'),
    el('button', { class: 'btn', type: 'button', onclick: start }, '새 인생 시작'),
    saved ? el('button', { class: 'btn ghost', type: 'button', onclick: () => { LG.game.resume(); if (saved.age > LG.data.economy.endAge) LG.screens.end(); else LG.screens.year(); } },
      saved.age > LG.data.economy.endAge ? `엔딩 다시 보기 (${saved.name})` : `이어하기 (${saved.name}, ${saved.age}살)`) : null,
    canSave ? null : el('p', { class: 'msg' }, '이 브라우저에선 이어하기가 안 돼요.'),
    cfg.seed ? el('p', { class: 'small' }, `선생님이 정한 세계 ${cfg.seed}번 · ${cfg.fair ? '공정 모드' : '무작위 모드'}`) : null,
    el('button', { class: 'btn ghost', type: 'button', onclick: () => LG.screens.terms() }, LG.ui.sprite('icons16', 'dict', 2), '용어 사전'),
    el('button', { class: 'link', type: 'button', onclick: () => LG.screens.teacher() }, '선생님 모드')));
};
