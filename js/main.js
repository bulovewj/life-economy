// 진입점. 한 판의 상태(s)와 경제 역사(hist)를 들고 있다.
globalThis.LG = globalThis.LG || {};

LG.game = {
  s: null,
  hist: null,
  auto: false, // 자동 진행 중?
  speed: 1,    // 자동 진행 배속(1·2·4·8). ❚❚를 누를 때까지 유지
  mode: 'speed', // speed: 계속 진행 / next: 다음 결정에서 멈춤
  timer: null,
  friends: null, // 친구 4명 계산 캐시
  setup(s) {
    this.s = s;
    this.friends = null;
    this.hist = LG.economy.generateHistory(LG.rng.create(s.seed + 1)); // 역사는 플레이어와 다른 난수
  },
  // 선생님 모드 설정은 주소(?seed=1234&fair=0)로만 전달한다. 저장하지 않는다.
  config() {
    const q = new URLSearchParams(globalThis.location ? location.search : '');
    const seed = /^\d{4}$/.test(q.get('seed') || '') ? Number(q.get('seed')) : null;
    return { seed, fair: q.get('fair') !== '0' };
  },
  begin(name, gender) {
    const cfg = this.config(), seed = cfg.seed || (Date.now() % 9000) + 1000; // 세계 번호(4자리)
    // 공정 모드: 모두 같은 시작. 아니면 시작 카드·운이 학생마다 다르다(경제 역사만 같음)
    const s = LG.state.newState(seed, cfg.fair, cfg.fair ? seed : seed * 7 + (Date.now() % 100000));
    s.name = name || LG.data.economy.names.fallback;
    s.gender = gender;
    LG.events.schedule(s);
    this.setup(s);
  },
  resume() {
    const s = LG.save.load();
    if (!s) return false;
    this.setup(s);
    return true;
  },
};

LG.screens.title();
