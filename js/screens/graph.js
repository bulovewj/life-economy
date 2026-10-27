// 엔딩 그래프(canvas 직접 그리기): 내 인생 그래프, 친구 비교 선 그래프
LG.graph = (() => {
  const INK = '#333c57', GRID = '#d8d2c4', MONEY = '#3b5dc9', HAPPY = '#e0a030';
  const short = (n) => (Math.abs(n) >= 10000 ? `${(n / 10000).toFixed(Math.abs(n) >= 100000 ? 0 : 1)}억` : `${Math.round(n)}만`);

  function setup(canvas, h) {
    const w = Math.max(280, canvas.parentElement.clientWidth || 320), dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.font = '14px Galmuri9, sans-serif';
    return { g, w, h };
  }

  const xOf = (age, w, L, R) => L + ((age - 12) / 68) * (w - L - R);
  // 왼쪽 여백 = 가장 넓은 눈금 글자 + 8px (음수 부호까지 잘리지 않게)
  const leftPad = (g, lo, hi) => 8 + Math.max(...[0, 1, 2, 3, 4].map((i) => g.measureText(short(hi - ((hi - lo) * i) / 4)).width));

  function axes(g, w, h, L, R, T, B, lo, hi, label) {
    g.strokeStyle = GRID; g.fillStyle = INK; g.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = T + ((h - T - B) * i) / 4;
      g.beginPath(); g.moveTo(L, y); g.lineTo(w - R, y); g.stroke();
      g.textAlign = 'right'; g.fillText(label(hi - ((hi - lo) * i) / 4), L - 4, y + 4);
    }
    g.textAlign = 'center';
    [12, 20, 30, 40, 50, 60, 70, 80].forEach((a) => g.fillText(String(a), xOf(a, w, L, R), h - 8));
  }

  return {
    short,

    // 순자산(왼쪽 축) + 행복(오른쪽 축) + 침체 회색 띠 + 내 선택 점. 점을 누르면 onPick(문장)
    life(canvas, s, hist, onPick) {
      const { g, w, h } = setup(canvas, 220), R = 30, T = 10, B = 24;
      const nw = s.history.map((x) => x.netWorth), hi = Math.max(1, ...nw), lo = Math.min(0, ...nw), L = leftPad(g, lo, hi);
      const yM = (v) => T + ((hi - v) / (hi - lo)) * (h - T - B), yH = (v) => T + ((100 - v) / 100) * (h - T - B);
      g.fillStyle = '#e4dfd5';
      hist.filter((y) => y.isRecession).forEach((y) => g.fillRect(xOf(y.age, w, L, R) - 3, T, 6, h - T - B));
      axes(g, w, h, L, R, T, B, lo, hi, short);
      g.fillStyle = HAPPY; g.textAlign = 'left';
      for (let i = 0; i <= 4; i++) g.fillText(String(100 - i * 25), w - R + 4, T + ((h - T - B) * i) / 4 + 4);
      const line = (key, y, color) => {
        g.strokeStyle = color; g.lineWidth = 2; g.beginPath();
        s.history.forEach((p, i) => { const x = xOf(p.age, w, L, R); if (i) g.lineTo(x, y(p[key])); else g.moveTo(x, y(p[key])); });
        g.stroke();
      };
      line('netWorth', yM, MONEY); line('happiness', yH, HAPPY);
      const dots = s.timeline.map((t) => {
        const p = s.history[t.age - 12];
        return p ? { x: xOf(t.age, w, L, R), y: yM(p.netWorth), text: `${t.age}살 ${t.title}: ${t.choice}` } : null;
      }).filter(Boolean);
      g.fillStyle = INK;
      dots.forEach((d) => { g.beginPath(); g.arc(d.x, d.y, 3.5, 0, 6.3); g.fill(); });
      canvas.onclick = (e) => {
        const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
        const best = dots.map((d) => ({ d, k: Math.hypot(d.x - px, d.y - py) })).sort((a, b) => a.k - b.k)[0];
        if (best && best.k < 22) onPick(best.d.text);
      };
    },

    // 나와 친구들의 순자산 선 (얇게)
    friends(canvas, me, list, colors) {
      const { g, w, h } = setup(canvas, 200), R = 10, T = 10, B = 24;
      const all = [me, ...list.map((x) => x.s)], nw = all.flatMap((s) => s.history.map((x) => x.netWorth));
      const hi = Math.max(1, ...nw), lo = Math.min(0, ...nw), L = leftPad(g, lo, hi), y = (v) => T + ((hi - v) / (hi - lo)) * (h - T - B);
      axes(g, w, h, L, R, T, B, lo, hi, short);
      all.forEach((s, i) => {
        g.strokeStyle = colors[i]; g.lineWidth = i === 0 ? 3 : 1.5; g.beginPath();
        s.history.forEach((p, j) => { const px = xOf(p.age, w, L, R); if (j) g.lineTo(px, y(p.netWorth)); else g.moveTo(px, y(p.netWorth)); });
        g.stroke();
      });
    },
  };
})();
