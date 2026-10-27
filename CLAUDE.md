# 인생 살기 게임: 경제편 (life-economy-game)

## 개요
- 초등 5~6학년이 12세부터 80세까지 한 번의 인생을 살며 경제적 선택(용돈·알바·직장·월세/전세·저축·주식·결혼·내 집·연금)을 직접 해보는 텍스트+도트 시뮬레이션 웹게임.
- 모티브: 「80억분의 1」(무작위 출생, 1년 단위 시간 흐름, 갈림길 선택, 생애 마디 질문, 같은 날 태어난 사람들과 비교).
- 수업 1차시(40분) 안에 1회 완주(목표 플레이 20~25분). 서버·로그인·생성형 AI 호출 없음.

## 기술 스택
- HTML + CSS + 바닐라 JS(클래식 `<script>`, ES 모듈 아님): 학교 PC에서 index.html 더블클릭(file://)으로도 실행되게.
- 빌드 도구 없음: Claude Code·교사 모두 유지보수 쉬움. 배포는 GitHub Pages.
- 저장: localStorage(진행 상황·마디 답변). 외부 전송 금지.
- 폰트: Galmuri11/Galmuri9 (OFL, `assets/fonts/`에 동봉).
- 도트 에셋: claude-pxl 스킬(`.claude/skills/pxl-pixel-art`)로 코드 작성 → PNG/시트 빌드 → `assets/img/`에 결과물만 커밋.

## 폴더 구조
```
index.html
css/style.css
js/  rng.js  state.js  economy.js  events.js  ui.js  screens/*.js  main.js
data/  economy-data.js  events-data.js  random-events-data.js  endings-data.js  terms-data.js
assets/  fonts/  img/(빌드된 PNG)  pxl/(*.px.js 원본)
docs/  기획서.md  작업지시서.md  시나리오.md  경제데이터.md  에셋가이드.md
```

## 코딩 컨벤션
- 전역 네임스페이스 하나: `globalThis.LG = globalThis.LG || {}`. 파일마다 `LG.economy = {...}` 형태로 붙인다. (브라우저·Node 테스트 스크립트 `tools/*.js` 둘 다에서 로드되게. 로직 파일(rng·state·economy·events·npc)은 DOM 접근 금지)
- 숫자는 모두 **만원 단위 정수**. 표시할 때만 `formatMoney()`로 "1억 2,300만원" 변환.
- 콘텐츠(이벤트·수치·문구)는 `data/`에만. 로직 파일에 문구·숫자 하드코딩 금지.
- 난수는 반드시 `LG.rng`(시드 기반)만 사용. `Math.random()` 직접 호출 금지.
- 파일 200줄 초과 금지. 넘으면 분리.
- 아이 대상 문구: 존댓말 아닌 다정한 해요체, 한 문장 40자 이내, 어려운 경제 용어는 용어 카드로 풀이.

## 하지 말 것
- 새 라이브러리·CDN 추가 전 반드시 물어볼 것 (차트도 canvas 직접 그리기).
- 네트워크 요청, 분석 도구, 외부 폰트 CDN 금지 (교실 오프라인 대비).
- 지시받지 않은 파일 수정 금지. docs/ 문서는 형이 요청할 때만 수정.
- 결혼·출산·비혼, 직업 종류, 집 소유 여부를 "좋다/나쁘다"로 판정하는 문구 금지.
- 사망·질병 사망·자살·이혼 장면 금지. 80세에 "인생 마무리"로 끝낸다.
- 단일 점수·순위표 금지. 엔딩은 여러 영역 + 칭호로.

## 현재 상태
| 마일스톤 | 내용 | 상태 |
|---|---|---|
| M1 | 빈 화면 + 폴더 구조 + 시드 난수 | ✅ |
| M2 | 경제 엔진(1년 결산) + 콘솔 시뮬레이션 | ✅ |
| M3 | 이벤트 엔진 + 회색 박스 UI로 12→80세 완주 | ✅ |
| M4 | 시나리오 전체 입력 + 랜덤 이벤트 + 용어 카드 | ✅ |
| M5 | 엔딩(인생 그래프·칭호·친구 4명 비교·인쇄) | ✅ |
| M6 | 도트 에셋(자체 빌더 tools/pxl-build.js) + 디자인 입히기 | ✅ |
| M7 | 교사 모드(시드 공유·공정 모드) + 밸런스 테스트 | ✅ (꾸준이≥차곡이 기준 미충족: 형 결정 필요) |
| M8 | 정리·README·GitHub Pages 배포 | 🟡 코드·문서 완료, Pages 설정 남음 |

구현됨 ≠ 실기기 검증 완료: 크롬북·태블릿 실기기 완주, 실제 네트워크 탭, 배포 URL 확인은 아직.
검사: `node tools/check-data.js && node tools/regress.js && node tools/sim.js 1000 events`

## 참조
상세 명세 docs/작업지시서.md, 이벤트 원본 docs/시나리오.md, 수치 근거 docs/경제데이터.md, 이미지 docs/에셋가이드.md, 마일스톤 CODING_PLAN.md. 필요할 때만 읽을 것.
