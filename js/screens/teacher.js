// S12 선생님 모드: 세계 번호(시드)·공정 모드를 정하고 학급용 링크를 만든다. 설정은 주소로만 전달(저장 안 함).
LG.screens.teacher = function () {
  const { el, render } = LG.ui;
  const cur = LG.game.config();
  const seed = el('input', { type: 'number', min: '1000', max: '9999', value: String(cur.seed || (Date.now() % 9000) + 1000), 'aria-label': '세계 번호' });
  const fair = el('input', { type: 'checkbox', id: 'fair' });
  fair.checked = cur.fair;
  const link = el('input', { type: 'text', readonly: '', 'aria-label': '학급용 링크' });
  const msg = el('p', { class: 'msg' }, '');
  const build = () => {
    const n = Math.min(9999, Math.max(1000, Math.round(Number(seed.value) || 1000)));
    link.value = `${location.href.split(/[?#]/)[0]}?seed=${n}&fair=${fair.checked ? 1 : 0}`;
    return link.value;
  };
  seed.addEventListener('input', build);
  fair.addEventListener('change', build);
  const copy = () => {
    build(); link.select();
    const ok = () => { msg.style.color = 'var(--up)'; msg.textContent = '링크를 복사했어요.'; };
    const manual = () => { msg.style.color = 'var(--down)'; msg.textContent = '복사가 안 되면 링크를 길게 눌러 직접 복사해 주세요.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link.value).then(ok, manual); else manual();
  };
  build();
  render(el('section', { class: 'screen' },
    el('h2', {}, '선생님 모드'),
    el('p', {}, '같은 링크로 들어온 학생들은 같은 세계(같은 경제 역사)에서 시작해요.'),
    el('label', { class: 'field' }, el('b', {}, '세계 번호 (4자리)'), seed),
    el('button', { class: 'btn ghost', type: 'button', onclick: () => { seed.value = String((Date.now() % 9000) + 1000); build(); } }, '무작위로 만들기'),
    el('label', { class: 'check' }, fair, el('span', {}, ' 공정 모드: 모두 같은 시작 카드 (끄면 학생마다 무작위)')),
    el('h3', {}, '학급용 링크'), link, msg,
    el('div', { class: 'row' },
      el('button', { class: 'btn', type: 'button', onclick: copy }, '링크 복사'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => { location.href = build(); } }, '이 설정으로 해 보기')),
    el('h3', {}, '수업 활용 팁'),
    el('ul', { class: 'list' }, LG.data.economy.teacherTips.map((t) => el('li', {}, t))),
    el('button', { class: 'btn ghost', type: 'button', onclick: () => LG.screens.title() }, '돌아가기')));
};
