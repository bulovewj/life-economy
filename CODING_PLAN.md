# CODING_PLAN — 인생 살기 게임: 경제편

> 규칙: 마일스톤 1개 = 한 세션(2~3시간). 끝날 때마다 눈으로 확인 → git 커밋 → `/clear`. 2~3개마다 `/review`.

## M1. 빈 앱 + 뼈대
- index.html, css/style.css, js/main.js, js/rng.js, 폴더 구조(CLAUDE.md), Galmuri 폰트 로컬 로드
- `LG.rng.create(seed)` mulberry32 + `next()`, `int(a,b)`, `pick(arr)`, `normal(mean,sd)`(Box-Muller)
- 타이틀 화면에 "인생 살기 게임: 경제편" + [새 인생 시작](아직 동작 없음)
- **완료 조건**: index.html 더블클릭 → 타이틀 보임 / 콘솔에서 `LG.rng.create(1234).next()` 두 번 실행 결과 같음

## M2. 경제 엔진 (화면 없이)
- data/economy-data.js (경제데이터.md 게임값), js/state.js(`newState(seed, fair)`), js/economy.js(`generateHistory`, `settleYear`, `netWorth`, `formatMoney`)
- tools/sim.js: Node에서 로직 파일 로드 → 아무 선택 없이 직장 중소기업 고정으로 12→80세 1,000시드 실행, 순자산 평균·최소·최대·NaN 개수 출력
- **완료 조건**: `node tools/sim.js` → NaN 0건, 같은 시드 결과 동일, formatMoney(12300)="1억 2,300만원"

## M3. 이벤트 엔진 + 회색 박스 UI 완주
- js/events.js(스키마 해석, 조건·확률·하위선택·지연효과), data/events-data.js에 E01~E07만
- 화면 S1~S5, S7 회색 박스(디자인 X). 이벤트 없는 해는 [다음 해]로 넘어감, 80세에 "끝" 화면
- **완료 조건**: 브라우저에서 12→80세 끝까지 클릭으로 도달, E01~E07이 정해진 나이에 등장

## M4. 시나리오 전체 + 운 카드 + 용어 카드 + 지갑
- data/events-data.js E08~E34 전부, random-events-data.js R01~R16, terms-data.js 18개
- S6 운 카드, S8 내 지갑(저축률·배분 슬라이더), S9 마디 질문, S11 용어 사전, F5 자동 진행, F6 저장
- tools/check-data.js: 시나리오.md의 ID 전부 존재·모든 선택지 tip 40자 이내·마지막 선택지 항상 가능·금지어 검사
- **완료 조건**: `node tools/check-data.js` 통과, 이어하기 동작, 자동 진행으로 25분 이내 완주

## M5. 엔딩
- js/npc.js(친구 4명 정책 시뮬), data/endings-data.js(칭호 10개)
- S10: canvas 인생 그래프(순자산+행복, 침체 띠, 선택 점), 5영역 막대, 칭호, 친구 비교 표·선, 타임라인, 마디 답변, 인쇄 CSS
- **완료 조건**: 엔딩 화면 전부 표시, 인쇄 미리보기 A4 1장, NPC 1,000시드 분포가 작업지시서 기준 충족

## M6. 도트 에셋 + 디자인
- 형이 claude-pxl 설치(에셋가이드 §2) 후 시작
- assets/pxl/*.px.js 작성 → 빌드 → assets/img/. 아바타 6연령대×팔레트 스왑 4종, 배경 6, 아이콘 28, 카드 틀
- 회색 박스 → 디자인 토큰(:root 색·간격·글자) 적용, 카드 뒤집기·수치 증감 애니메이션, `prefers-reduced-motion` 대응
- **완료 조건**: 모든 화면에 에셋 적용, 360px 폭에서 가로 스크롤 없음

## M7. 선생님 모드 + 밸런스
- S12, URL 파라미터(seed, fair), 세계 번호 표시
- tools/sim.js 확장: 선택지별 평균 결과 표 출력 → 한 선택지가 모든 영역에서 압도하면 조정(“정답 선택지” 제거)
- **완료 조건**: `?seed=1234` 두 브라우저에서 침체 연도 동일, 밸런스 표를 형이 확인

## M8. 정리·배포
- 죽은 코드 제거, README(수업 활용법·세계 번호 사용법·출처), LICENSE, .gitignore
- GitHub Pages 배포 (gh CLI 자격증명 없으면 push 명령을 형에게 안내)
- **완료 조건**: 배포 URL에서 크롬북·아이패드 완주 확인, 개발자도구 네트워크 탭 외부 요청 0건
