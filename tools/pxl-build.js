// 도트 빌더 (외부 의존성 없음). 사용: node tools/pxl-build.js [미리보기_폴더]
// assets/pxl/*.px.js 는 (px) => [{ sheet, cols, frames:[{name, canvas}] }] 를 내보낸다.
// 결과: assets/img/<sheet>.png + assets/img/sprites.js(시트·프레임 좌표). 팔레트는 sweetie16 고정(색 번호 0~15).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const HEX = ['1a1c2c', '5d275d', 'b13e53', 'ef7d57', 'ffcd75', 'a7f070', '38b764', '257179', '29366f', '3b5dc9', '41a6f6', '73eff7', 'f4f4f4', '94b0c2', '566c86', '333c57'];
const PAL = HEX.map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));

class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; return this; }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.d[y * this.w + x]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (((x - cx) / (rx + 0.3)) ** 2 + ((y - cy) / (ry + 0.3)) ** 2 <= 1) this.set(x, y, c);
    }
    return this;
  }
  circle(cx, cy, r, c) { return this.ellipse(cx, cy, r, r, c); }
  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
    return this;
  }
  // 그림 바깥쪽에 외곽선 한 겹(가장 어두운 색)
  outline(c = 0) {
    const src = this.d.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (src[y * this.w + x] !== null) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => this.get(x + dx, y + dy) !== null && src[(y + dy) * this.w + x + dx] !== null)) this.d[y * this.w + x] = c;
    }
    return this;
  }
  stamp(o, x, y) { for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) if (o.d[j * o.w + i] !== null) this.set(x + i, y + j, o.d[j * o.w + i]); return this; }
}

const px = { Canvas, canvas: (w, h) => new Canvas(w, h) };

function crc32(buf) { return zlib.crc32(buf) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// 캔버스 → PNG. scale>1이면 미리보기용으로 칸을 키운다(저장되는 에셋은 항상 1배).
function toPng(cv, scale = 1) {
  const W = cv.w * scale, H = cv.h * scale, raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const c = cv.d[Math.floor(y / scale) * cv.w + Math.floor(x / scale)], o = y * (W * 4 + 1) + 1 + x * 4;
      if (c === null) continue;
      raw[o] = PAL[c][0]; raw[o + 1] = PAL[c][1]; raw[o + 2] = PAL[c][2]; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function build(previewDir) {
  const root = path.join(__dirname, '..'), pxlDir = path.join(root, 'assets/pxl'), imgDir = path.join(root, 'assets/img');
  fs.mkdirSync(imgDir, { recursive: true });
  const sprites = {};
  for (const file of fs.readdirSync(pxlDir).filter((f) => f.endsWith('.px.js')).sort()) {
    for (const s of require(path.join(pxlDir, file))(px)) {
      const fw = s.frames[0].canvas.w, fh = s.frames[0].canvas.h, rows = Math.ceil(s.frames.length / s.cols);
      const sheet = new Canvas(fw * s.cols, fh * rows), frames = {};
      s.frames.forEach((f, i) => {
        const x = (i % s.cols) * fw, y = Math.floor(i / s.cols) * fh;
        sheet.stamp(f.canvas, x, y); frames[f.name] = { x, y, w: fw, h: fh };
      });
      fs.writeFileSync(path.join(imgDir, `${s.sheet}.png`), toPng(sheet));
      if (previewDir) { fs.mkdirSync(previewDir, { recursive: true }); fs.writeFileSync(path.join(previewDir, `${s.sheet}.png`), toPng(sheet, 4)); }
      sprites[s.sheet] = { src: `assets/img/${s.sheet}.png`, w: sheet.w, h: sheet.h, frames };
      console.log(`${s.sheet}: ${s.frames.length}장 (${fw}x${fh}) → assets/img/${s.sheet}.png`);
    }
  }
  // file://에서도 읽히도록 JSON 대신 스크립트로 내보낸다
  fs.writeFileSync(path.join(imgDir, 'sprites.js'), `// node tools/pxl-build.js 가 만든 파일. 직접 고치지 않는다.\nglobalThis.LG = globalThis.LG || {};\nLG.data = LG.data || {};\nLG.data.sprites = ${JSON.stringify(sprites)};\n`);
}

build(process.argv[2]);
