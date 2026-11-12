/* 第 7 關｜解集合雷射（看圖解多項式不等式）
   上方是 y = f(x) 的圖形（標出與 x 軸的交點），下方是對齊的數線。
   點數線上的區段把它點亮（成立），點端點切換 ●（包含）／○（不包含），按「發射！」。
   簡單：只穿過 x 軸的根；標準：多一個「碰一下就回頭」的重根；挑戰：四、五次式，含孤立的解或要挖掉的點。 */
'use strict';
(function (LG) {
  const U = LG.util, P = LG.poly;
  const OPKEYS = ['>', '>=', '<', '<='];

  function gen(diff) {
    for (let t = 0; t < 400; t++) {
      const n = diff === 'easy' ? U.pick([2, 3, 3]) : 3;
      const rs = U.shuffle([-4, -3, -2, -1, 0, 1, 2, 3, 4, 5]).slice(0, n).sort((a, b) => a - b);
      const gaps = rs.slice(1).map((r, i) => r - rs[i]);
      if (rs[rs.length - 1] - rs[0] > 7 || Math.min(...gaps) < 1 || Math.max(...gaps) > 3 * Math.min(...gaps) || Math.max(...gaps) > 4) continue;
      const ms = rs.map(() => 1);
      if (diff === 'normal') ms[U.randInt(0, n - 1)] = 2;
      if (diff === 'hard') {
        const k = U.randInt(0, n - 1);
        ms[k] = 2;
        if (Math.random() < 0.4) { const j = (k + U.randInt(1, n - 1)) % n; ms[j] = 2; }
      }
      const deg = ms.reduce((a, b) => a + b, 0);
      if (deg > 5) continue;
      const lead = U.pick([1, -1]);
      const f = x => rs.reduce((s, r, i) => s * Math.pow(x - r, ms[i]), lead);
      const sample = i => (i === 0 ? rs[0] - 1 : i === n ? rs[n - 1] + 1 : (rs[i - 1] + rs[i]) / 2);
      const signs = [];
      for (let i = 0; i <= n; i++) signs.push(f(sample(i)) > 0 ? 1 : -1);
      const op = U.pick(OPKEYS), O = P.OPS[op];
      const iv = signs.map(s => O.test(s)), pt = rs.map(() => O.eq);
      if (iv.every(Boolean) || iv.every(b => !b)) continue;
      // 標準、挑戰：至少有一個「點的狀態和兩側區間不一樣」的情況（孤立解或挖掉的點）
      const special = rs.some((r, j) => pt[j] !== iv[j] || pt[j] !== iv[j + 1]);
      const tricky = rs.some((r, j) => (pt[j] && !iv[j] && !iv[j + 1]) || (!pt[j] && iv[j] && iv[j + 1]));
      if (diff === 'normal' && !special) continue;
      if (diff === 'hard' && !tricky) continue;
      return { rs, ms, lead, f, signs, op, iv, pt };
    }
    return null;
  }

  const recent = [];
  function build(diff) {
    let g, key;
    for (let t = 0; t < 20; t++) {
      g = gen(diff);
      key = g.rs.join(',') + '|' + g.ms.join('') + g.lead + g.op;
      if (!recent.includes(key)) break;
    }
    recent.push(key);
    while (recent.length > 8) recent.shift();
    const O = P.OPS[g.op];
    const roots = g.rs.map(r => P.fr(r));
    const sol = P.solTex(roots, g.iv, g.pt);
    const hint = diff === 'easy'
      ? `$f(x)${O.tex}0$：找圖形在 $x$ 軸${g.op[0] === '>' ? '上方' : '下方'}的部分${O.eq ? '，與 $x$ 軸的交點也要算' : '，交點不算'}`
      : `$f(x)${O.tex}0$：找圖形在 $x$ 軸${g.op[0] === '>' ? '上方' : '下方'}的部分；交點${O.eq ? '要包含（●）' : '不包含（○）'}，\n只碰一下 $x$ 軸就回頭的點也要判斷`;
    return {
      key, ...g, roots, sol,
      prompt: `已知 $y=f(x)$ 的圖形如下，解不等式 $f(x)${O.tex}0$：點亮數線上成立的區段，點端點切換 ●／○。`,
      hint,
      explain: `圖形在 $x$ 軸${g.op[0] === '>' ? '上方' : '下方'}${O.eq ? '（含交點）' : ''}：${sol}`
    };
  }

  class L7 extends LG.LevelBase {
    static pick(diff) { return build(diff); }

    constructor(zone, q, scr) {
      super(zone, q, scr);
      this.celebrateTime = 2.8;
      this.setQuestion(U.rich(q.prompt));
      const m = scr.main;
      m.classList.add('l7l');
      m.innerHTML = `
        <div class="lz-graph"><canvas class="lz-cv"></canvas><div class="lz-labs"></div><div class="g-tag lz-f">${U.tex('y=f(x)')}</div></div>
        <div class="lz-strip"><svg class="lz-svg"></svg></div>
        <div class="lz-foot"><div class="lz-tip">點區段 → 點亮　點端點 → ●／○</div><div class="sg-sol lz-sol"></div></div>`;
      this.gEl = m.querySelector('.lz-graph');
      this.cv = m.querySelector('.lz-cv');
      this.labs = m.querySelector('.lz-labs');
      this.fTag = m.querySelector('.lz-f');
      this.strip = m.querySelector('.lz-strip');
      this.svg = m.querySelector('.lz-svg');
      this.tip = m.querySelector('.lz-tip');
      this.solEl = m.querySelector('.lz-sol');
      const n = q.rs.length;
      this.selIv = new Array(n + 1).fill(false);
      this.selPt = new Array(n).fill(false);
      const lo = q.rs[0] - 1.3, hi = q.rs[n - 1] + 1.3;
      // y 範圍：每兩個相鄰交點之間的「山頭」都要看得見（最小的山頭至少佔半高的 22%），太高的山頭就讓它超出畫面
      const bumps = [];
      for (let j = 0; j < n - 1; j++) {
        let b = 0;
        for (let i = 1; i < 40; i++) b = Math.max(b, Math.abs(q.f(q.rs[j] + (q.rs[j + 1] - q.rs[j]) * i / 40)));
        bumps.push(b);
      }
      const edge = Math.max(Math.abs(q.f(q.rs[0] - 0.9)), Math.abs(q.f(q.rs[n - 1] + 0.9)));
      const big = Math.max(...bumps, 1e-6), small = Math.min(...bumps, edge);
      const Y = Math.max(1e-6, Math.min(big * 1.3, small / 0.22));
      this.win = { x0: lo, x1: hi, y0: -Y, y1: Y };
      this.state = null;      // 'ok' | 'answer'：答完後的顯示
      this.laser = null;
      this.time = 0;
      LG.input.onTap(this.strip, e => this.tapAt(e.clientX), { sound: false, enabled: () => this.playing });
      this.setGo('發射！', () => this.go());
      this.setGoEnabled(false);
    }

    X(x) { return this.pad + (x - this.win.x0) / (this.win.x1 - this.win.x0) * (this.W - 2 * this.pad); }

    layout() {
      const r = this.strip.getBoundingClientRect();
      if (r.width < 4) return;
      this.W = r.width; this.H = r.height; this.pad = r.width * 0.035;
      this.svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      this.drawGraph();
      this.drawStrip();
    }

    drawGraph() {
      const r = this.gEl.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const s = this.scale();
      const W = Math.round(r.width * s), H = Math.round(r.height * s);
      if (this.cv.width !== W) this.cv.width = W;
      if (this.cv.height !== H) this.cv.height = H;
      const g = this.cv.getContext('2d'), w = this.win, q = this.q;
      const X = x => this.X(x) * s, padY = H * 0.06;
      const Y = y => H - padY - (y - w.y0) / (w.y1 - w.y0) * (H - 2 * padY);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(5, 18, 36, 0.62)';
      g.beginPath(); if (g.roundRect) g.roundRect(0, 0, W, H, Math.min(W, H) * 0.035); else g.rect(0, 0, W, H); g.fill();
      // x 軸、y 軸
      g.strokeStyle = 'rgba(242, 246, 251, 0.78)'; g.fillStyle = 'rgba(242, 246, 251, 0.78)';
      g.lineWidth = 2 * s;
      g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W - 6 * s, Y(0)); g.stroke();
      g.beginPath(); g.moveTo(W - 2 * s, Y(0)); g.lineTo(W - 12 * s, Y(0) - 6 * s); g.lineTo(W - 12 * s, Y(0) + 6 * s); g.closePath(); g.fill();
      if (w.x0 < 0 && w.x1 > 0) {
        g.globalAlpha = 0.45;
        g.beginPath(); g.moveTo(X(0), H - 4 * s); g.lineTo(X(0), 6 * s); g.stroke();
        g.globalAlpha = 1;
      }
      g.font = `italic 600 ${Math.max(11 * s, H * 0.06)}px "Times New Roman", serif`;
      g.textAlign = 'right'; g.textBaseline = 'bottom';
      g.fillText('x', W - 8 * s, Y(0) - 6 * s);
      // 曲線（答完後：成立的部分塗綠）
      const N = 600, pts = [];
      for (let i = 0; i <= N; i++) {
        const x = w.x0 + (w.x1 - w.x0) * i / N;
        pts.push([x, U.clamp(q.f(x), w.y0 * 3, w.y1 * 3)]);
      }
      g.save();
      g.beginPath(); g.rect(0, 0, W, H); g.clip();
      g.lineJoin = 'round'; g.lineCap = 'round';
      const O = P.OPS[q.op];
      const stroke = (filter, col, wd, alpha) => {
        g.strokeStyle = col; g.lineWidth = wd * s; g.globalAlpha = alpha;
        g.beginPath();
        let on = false;
        for (const [x, y] of pts) {
          const ok = filter(x, y);
          if (ok && !on) { g.moveTo(X(x), Y(y)); on = true; } else if (ok) g.lineTo(X(x), Y(y)); else on = false;
        }
        g.stroke();
      };
      stroke(() => true, '#f2f6fb', 11, 0.12);
      stroke(() => true, '#f2f6fb', 3.4, 0.92);
      if (this.state) {
        const col = this.state === 'ok' ? '#8cf06a' : '#ffd34d';
        stroke((x, y) => O.test(y) && y !== 0, col, 12, 0.25);
        stroke((x, y) => O.test(y) && y !== 0, col, 4.2, 1);
      }
      g.globalAlpha = 1;
      g.restore();
      // 交點
      g.fillStyle = '#f2f6fb';
      q.rs.forEach(rt => { g.beginPath(); g.arc(X(rt), Y(0), 5 * s, 0, Math.PI * 2); g.fill(); });
      // 交點標籤（HTML，方便排版）
      if (!this.labsBuilt) {
        this.labsBuilt = true;
        this.labs.innerHTML = q.rs.map(rt => `<div class="lz-lab">${U.tex(String(rt))}</div>`).join('');
      }
      const ys = Y(0) / s;
      Array.from(this.labs.children).forEach((el, i) => {
        const rt = q.rs[i];
        // 標籤放在曲線「比較空」的那一側：交點兩旁的函數值都在下方時放上面，反之放下面
        const side = q.f(rt - 0.3) + q.f(rt + 0.3);
        const up = side < 0 || (side === 0 && i % 2 === 0);
        el.style.left = (X(rt) / s) + 'px';
        el.style.top = (up ? ys - r.height * 0.09 : ys + r.height * 0.09) + 'px';
      });
      // y = f(x) 標籤：放在右上或右下（曲線最右端那一側）
      const rightUp = q.f(w.x1) > 0;
      this.fTag.style.right = '3%';
      this.fTag.style.left = 'auto';
      this.fTag.style.top = rightUp ? '6%' : 'auto';
      this.fTag.style.bottom = rightUp ? 'auto' : '6%';
    }

    drawStrip() {
      if (!this.W) return;
      const W = this.W, H = this.H, q = this.q, n = q.rs.length, y = H * 0.5;
      const sw = Math.max(2, W * 0.006);
      const xs = q.rs.map(r => this.X(r));
      const bounds = [0].concat(xs, [W * 0.975]);
      const ivOn = this.state ? q.iv : this.selIv, ptOn = this.state ? q.pt : this.selPt;
      const cls = this.state || 'sel';
      let h = `<path d="M${W * 0.005} ${y}H${W * 0.975}" class="sg-axis" stroke-width="${sw}"/>`;
      h += `<path d="M${W * 0.997} ${y}l${-W * 0.03} ${-H * 0.13}v${H * 0.26}z" class="sg-arrow"/>`;
      // 區段
      for (let i = 0; i <= n; i++) {
        const a = bounds[i], b = bounds[i + 1];
        h += `<rect x="${a}" y="${y - H * 0.3}" width="${b - a}" height="${H * 0.6}" class="lz-hit"/>`;
        if (!ivOn[i]) continue;
        let bx = b;
        if (this.laser && this.laser.t < 1) {
          const sweep = this.laser.t * W;
          if (sweep <= a) continue;
          bx = Math.min(b, sweep);
        }
        h += `<path d="M${a} ${y}H${bx}" class="sg-on ${cls}" stroke-width="${sw * 3.6}"/>`;
      }
      // 端點
      const rr = Math.max(7, H * 0.17);
      xs.forEach((x, j) => {
        h += `<circle cx="${x}" cy="${y}" r="${rr}" class="sg-dot ${ptOn[j] ? 'full' : 'hollow'} ${cls}" stroke-width="${sw * 1.3}"/>`;
      });
      // 刻度數字
      xs.forEach((x, j) => { h += `<text x="${x}" y="${H * 0.97}" class="lz-num">${String(q.rs[j]).replace('-', '−')}</text>`; });
      this.svg.innerHTML = h;
    }

    tapAt(cx) {
      if (!this.playing || !this.W) return;
      const r = this.strip.getBoundingClientRect(), x = cx - r.left;
      const q = this.q, xs = q.rs.map(t => this.X(t));
      const tol = Math.max(LG.settings.tapPx(this.zone.inner.clientWidth) * 0.8, this.H * 0.32, 14);
      let best = -1, bd = Infinity;
      xs.forEach((px, j) => { const d = Math.abs(px - x); if (d < bd) { bd = d; best = j; } });
      if (best >= 0 && bd <= tol) {
        this.selPt[best] = !this.selPt[best];
        LG.audio.play('dial');
      } else {
        let i = 0;
        while (i < xs.length && x > xs[i]) i++;
        this.selIv[i] = !this.selIv[i];
        LG.audio.play(this.selIv[i] ? 'plug' : 'tap');
      }
      this.tip.classList.add('gone');
      this.setGoEnabled(this.selIv.some(Boolean) || this.selPt.some(Boolean));
      this.drawStrip();
    }

    go() {
      const q = this.q;
      const ok = this.selIv.every((v, i) => v === q.iv[i]) && this.selPt.every((v, j) => v === q.pt[j]);
      const r = this.submit(ok);
      if (r === 'retry') {
        this.strip.classList.remove('bad'); void this.strip.offsetWidth; this.strip.classList.add('bad');
      }
    }

    finish(kind) {
      this.state = kind;
      this.tip.classList.add('gone');
      this.laser = { t: 0 };
      LG.audio.play('zap');
      this.drawGraph();
      this.drawStrip();
      this.solEl.innerHTML = `<span class="lab">解</span>${U.rich(this.q.sol)}`;
      this.solEl.classList.add('show', kind);
      U.fit(this.solEl, 0.4, true);
    }

    celebrate() {
      this.finish('ok');
      const p = this.zone.fx.rel(this.strip);
      this.zone.after(0.6, () => this.zone.fx.confetti(p.x, p.y, { n: 34 }));
    }

    reveal() { this.finish('answer'); }

    update(dt) {
      this.time += dt;
      if (this.laser && this.laser.t < 1) {
        this.laser.t = Math.min(1, this.laser.t + dt / 0.7);
        this.drawStrip();
      }
    }
  }

  L7.meta = { id: 7, name: '解集合雷射', part: 'ineq', topic: '看圖解不等式' };
  L7.build = build; L7.gen = gen;
  LG.registerLevel(L7);
})(window.LG);
