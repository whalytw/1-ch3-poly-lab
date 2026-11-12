/* 第 2 關｜平移對準（三次函數圖形的平移與對稱中心）
   畫面上是 y = ax³ + px 的圖形（對稱中心在原點）。拖曳整條曲線，把對稱中心放到正確位置，按「鎖定！」，
   目標函數的圖形才會現身比對。
   簡單：目標已寫成 a(x−h)³+p(x−h)+k；標準：展開式且 a=±1；挑戰：展開式且 |a|≥2。 */
'use strict';
(function (LG) {
  const U = LG.util, P = LG.poly;

  const moveText = (h, k) => {
    const s = [];
    if (h) s.push(`向${h > 0 ? '右' : '左'}平移 ${Math.abs(h)} 單位`);
    if (k) s.push(`向${k > 0 ? '上' : '下'}平移 ${Math.abs(k)} 單位`);
    return s.join('、') || '不用平移';
  };

  const recent = [];
  function build(diff) {
    let a, p, h, k, key;
    for (let t = 0; t < 60; t++) {
      a = diff === 'hard' ? U.pick([2, -2, 3, -3]) : diff === 'normal' ? U.pick([1, 1, -1]) : U.pick([1, 1, -1, 2]);
      p = U.pick(diff === 'easy' ? [-3, -2, -1, 1, 2] : [-3, -2, -1, 1, 2, 3]);
      if (Math.abs(a) >= 2 && Math.abs(p) === 3 && a * p < 0) p = -Math.sign(a) * 2;
      const H = diff === 'easy' ? [-3, -2, -1, 1, 2, 3] : [-2, -1, 1, 2];
      h = U.pick(H);
      k = U.pick([-3, -2, -1, 0, 1, 2, 3]);
      key = `${a}_${p}_${h}_${k}`;
      if (!recent.includes(key)) break;
    }
    recent.push(key);
    while (recent.length > 8) recent.shift();
    const base = 'y=' + P.tex([a, 0, p, 0]);
    const coeffs = P.expandCubicShift(a, p, h, k);
    const shifted = P.texCubicShift(a, p, h, k);
    const target = diff === 'easy' ? shifted : P.tex(coeffs);
    const hint = diff === 'easy'
      ? '$y=a(x-h)^{3}+p(x-h)+k$ 的對稱中心是 $(h,\\,k)$；注意 $(x+1)$ 代表 $h=-1$'
      : `對稱中心的 $x$ 坐標 $h=-\\dfrac{b}{3a}$（$b$ 是 $x^{2}$ 項係數），再代入算 $k=f(h)$`;
    const explain = diff === 'easy'
      ? `對稱中心 $(${h},\\,${k})$：把 $${base}$ ${moveText(h, k)}`
      : `$h=-\\dfrac{b}{3a}=-\\dfrac{${coeffs[1]}}{${3 * a}}=${h}$，$k=f(${h})=${k}$，即 $y=${shifted}$，對稱中心 $(${h},\\,${k})$`;
    return {
      key, a, p, h, k, base, target, coeffs, hint, explain,
      prompt: `把 $${base}$ 的圖形平移成 $y=${target}$ 的圖形。拖曳曲線，把「對稱中心」放到正確位置。`
    };
  }

  const WIN = { xmin: -4.6, xmax: 4.6, ymin: -4.4, ymax: 4.4 };
  const LIM = 4;

  class L2 extends LG.LevelBase {
    static pick(diff) { return build(diff); }

    constructor(zone, q, scr) {
      super(zone, q, scr);
      this.celebrateTime = 2.5;
      this.setQuestion(U.rich(q.prompt));
      const m = scr.main;
      m.classList.add('l2s');
      m.innerHTML = `<div class="g-wrap"><canvas class="g-cv"></canvas><div class="g-tag base"></div><div class="g-tag ctr"></div><div class="drag-tip">按住曲線拖曳</div></div>`;
      this.wrap = m.querySelector('.g-wrap');
      this.cv = m.querySelector('.g-cv');
      this.baseTag = m.querySelector('.g-tag.base');
      this.ctrTag = m.querySelector('.g-tag.ctr');
      this.tip = m.querySelector('.drag-tip');
      this.baseTag.innerHTML = '原圖 ' + U.tex(q.base);
      this.graph = new LG.Graph2D(this.cv, Object.assign({ equal: true }, WIN));
      this.c = { h: 0, k: 0 };      // 目前的對稱中心（整數格點）
      this.vis = { h: 0, k: 0 };    // 畫面上的位置（動畫用）
      this.wrongs = [];
      this.target = null;
      this.time = 0;
      this.dirty = true;
      this.setGo('鎖定！', () => this.go());
      this.setGoEnabled(false);
      LG.input.onDrag(this.wrap, {
        down: (e, p) => {
          if (!this.playing || this.anim) return false;
          this.p0 = p; this.c0 = { h: this.c.h, k: this.c.k };
          this.wrap.classList.add('drag');
          this.tip.classList.add('gone');
        },
        move: (e, p) => this.onMove(p),
        up: () => this.wrap.classList.remove('drag'),
        cancel: () => this.wrap.classList.remove('drag')
      });
    }

    f0(x) { return this.q.a * x * x * x + this.q.p * x; }

    onMove(p) {
      const g = this.graph;
      if (!g.view || !this.p0) return;
      const du = (p.x - this.p0.x) * g.s / g.view.kx;
      const dv = -(p.y - this.p0.y) * g.s / g.view.ky;
      const h = U.clamp(Math.round(this.c0.h + du), -LIM, LIM);
      const k = U.clamp(Math.round(this.c0.k + dv), -LIM, LIM);
      if (h !== this.c.h || k !== this.c.k) {
        this.c = { h, k };
        this.vis = { h, k };
        LG.audio.play('dial');
        this.setGoEnabled(true);
        this.wrongMark = null;
        this.updateTag();
        this.dirty = true;
      }
    }

    updateTag() {
      const g = this.graph;
      if (!g.view) return;
      const { h, k } = this.vis;
      this.ctrTag.innerHTML = U.tex(`(${Math.round(h)},\\,${Math.round(k)})`);
      const X = g.cssX(h), Y = g.cssY(k);
      const right = h <= 1.5;
      this.ctrTag.style.left = (right ? X + 14 : X - 14) + 'px';
      this.ctrTag.style.top = (Y + (k > 2.5 ? 22 : -22)) + 'px';
      this.ctrTag.style.transform = `translate(${right ? '0' : '-100%'}, -50%)`;
    }

    layout() {
      const r = this.wrap.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      this.graph.resize(r.width, r.height, this.scale());
      this.cv.style.width = r.width + 'px';
      this.cv.style.height = r.height + 'px';
      this.updateTag();
      this.dirty = true;
    }

    go() {
      if (this.anim) return;
      const ok = this.c.h === this.q.h && this.c.k === this.q.k;
      const r = this.submit(ok);
      if (r === 'retry') {
        this.wrongs.push({ h: this.c.h, k: this.c.k });
        this.setGoEnabled(false);
        this.dirty = true;
      }
    }

    celebrate() {
      this.target = { prog: 0, kind: 'ok' };
      LG.audio.play('grow');
      this.ctrTag.classList.add('ok');
    }

    reveal() {
      this.tip.classList.add('gone');
      this.anim = { from: { h: this.vis.h, k: this.vis.k }, t: 0, dur: 0.8 };
      this.afterAnim = () => { this.target = { prog: 0, kind: 'answer' }; LG.audio.play('grow'); };
    }

    update(dt) {
      this.time += dt;
      if (this.anim) {
        const a = this.anim;
        a.t += dt;
        const e = U.ease.inOutCubic(U.clamp(a.t / a.dur, 0, 1));
        this.vis = { h: U.lerp(a.from.h, this.q.h, e), k: U.lerp(a.from.k, this.q.k, e) };
        this.updateTag();
        if (a.t >= a.dur) { this.anim = null; if (this.afterAnim) { const f = this.afterAnim; this.afterAnim = null; f(); } }
        this.dirty = true;
      }
      if (this.target && this.target.prog < 1) {
        this.target.prog = Math.min(1, this.target.prog + dt / 0.9);
        if (this.target.prog >= 1 && this.target.kind === 'ok') {
          const o = this.zoff(this.wrap), g = this.graph;
          const x = o.x + g.cssX(this.q.h), y = o.y + g.cssY(this.q.k);
          this.zone.fx.burst(x, y, { n: 40, colors: ['#8cf06a', '#f2f6fb', '#ffd34d'], speed: [140, 460], gravity: 200 });
          this.zone.fx.confetti(x, y, { n: 28 });
        }
        this.dirty = true;
      }
      if (this.target && this.target.prog >= 1) this.dirty = true;   // 閃爍
      if (this.dirty) { this.draw(); this.dirty = false; }
    }

    draw() {
      const g = this.graph;
      if (!g.view) return;
      g.clear();
      const v = g.view;
      const x0 = v.x0 - 1, x1 = v.x1 + 1;
      // 原位置的淡影
      g.polyline(LG.Graph2D.sample(x => this.f0(x), x0, x1, 360), { color: 'rgba(242,246,251,0.35)', width: 2.2, dash: [8, 8], glow: false });
      for (const w of this.wrongs) {
        g.text('✗', w.h, w.k, { color: '#ff5a6a', align: 'center', font: `900 ${g.fontPx(0.07)}px sans-serif` });
      }
      const { h, k } = this.vis;
      // 對稱中心到兩軸的虛線
      g.line(h, 0, h, k, { color: 'rgba(255,211,77,0.75)', width: 1.8, dash: [6, 6], glow: false });
      g.line(0, k, h, k, { color: 'rgba(255,211,77,0.75)', width: 1.8, dash: [6, 6], glow: false });
      const done = this.target && this.target.kind === 'ok' && this.target.prog >= 1;
      const col = done ? '#8cf06a' : U.UNIT_HEX.graph;
      g.polyline(LG.Graph2D.sample(x => this.f0(x - h) + k, x0, x1, 420), { color: col, width: 4 });
      if (this.target) {
        const t = this.target, N = 420;
        const pts = LG.Graph2D.sample(x => P.evalc(this.q.coeffs, x), x0, x1, N);
        const mid = N / 2, kk = U.ease.outCubic(t.prog);
        const blink = t.prog >= 1 ? 0.55 + 0.45 * Math.sin(this.time * 6) ** 2 : 1;
        g.polyline(pts, { color: t.kind === 'ok' ? '#8cf06a' : '#ffd34d', width: 3.2, dash: [12, 8], alpha: blink, from: mid - kk * mid, to: mid + kk * mid });
      }
      g.dot(h, k, { r: 7, color: '#f2f6fb', ring: col, halo: 'rgba(242,246,251,0.18)' });
    }
  }

  L2.meta = { id: 2, name: '平移對準', part: 'graph', topic: '平移與對稱中心' };
  L2.build = build;
  LG.registerLevel(L2);
})(window.LG);
