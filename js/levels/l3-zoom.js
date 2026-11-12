/* 第 3 關｜放大鏡（一次近似）
   沿用「細菌培養皿」的滑桿：拖動斜率 a₁，按「貼合！」後直線從點 P(h, f(h)) 往兩側長出；
   答對時鏡頭一路放大到 P 附近，曲線和直線幾乎重合（課本圖 21、22）。
   簡單：f(x) 已寫成 (x−h) 的冪次；標準：三次展開式；挑戰：四次或首項係數較大的展開式。 */
'use strict';
(function (LG) {
  const U = LG.util, P = LG.poly;

  /* Σ cs[i]·(x−h)^(n−i) 展開成一般式 */
  function expand(cs, h) {
    let acc = [0];
    const n = cs.length - 1;
    cs.forEach((c, i) => {
      let t = [c];
      for (let k = 0; k < n - i; k++) t = P.mul(t, [1, -h]);
      const L = Math.max(acc.length, t.length);
      const a = new Array(L - acc.length).fill(0).concat(acc), b = new Array(L - t.length).fill(0).concat(t);
      acc = a.map((x, j) => x + b[j]);
    });
    return P.trim(acc);
  }

  const recent = [];
  function gen(diff) {
    for (let t = 0; t < 400; t++) {
      const h = U.pick(diff === 'easy' ? [-3, -2, -1, 1, 2, 3] : [-2, -1, 1, 2]);
      let cs;
      if (diff === 'hard' && Math.random() < 0.55) cs = [U.pick([1, -1]), U.randInt(-3, 3), U.randInt(-3, 3), U.randInt(-6, 6), U.randInt(-5, 8)];
      else if (diff === 'hard') cs = [U.pick([2, -2, 3]), U.randInt(-4, 4), U.randInt(-7, 7), U.randInt(-5, 8)];
      else cs = [U.pick(diff === 'easy' ? [1, 2, -1, 2] : [1, 1, -1, 2]), U.randInt(-3, 3), U.randInt(-6, 6), U.randInt(-5, 8)];
      const a1 = cs[cs.length - 2];
      if (a1 === 0 || Math.abs(a1) > 9) continue;
      const c = expand(cs, h);
      if (c.length !== cs.length) continue;
      const lim = diff === 'easy' ? 99 : diff === 'normal' ? 9 : 14;
      if (c.some(x => Math.abs(x) > lim)) continue;
      if (diff !== 'easy' && c.filter(x => x === 0).length > 1) continue;
      const key = cs.join(',') + '@' + h;
      if (recent.includes(key)) continue;
      recent.push(key);
      while (recent.length > 8) recent.shift();
      return { h, cs, c, key };
    }
    return { h: -2, cs: [2, -6, 3, -1], c: [2, 6, 3, -3], key: 'fallback' };
  }

  function build(diff) {
    const { h, cs, c, key } = gen(diff);
    const a1 = cs[cs.length - 2], a0 = cs[cs.length - 1];
    const ftex = diff === 'easy' ? P.texShift(cs, h) : P.tex(c);
    const line = P.texLin(a1, h, a0);
    const start = a1 - U.randInt(1, 7);
    const slots = Array.from({ length: 9 }, (_, i) => start + i);
    return {
      key, h, cs, c, a1, a0, slots, ftex, line,
      prompt: `求 $f(x)=${ftex}$ 在 $x=${h}$ 附近的一次近似。拖動斜率 $a_1$，讓直線 $y=a_1${P.xh(h)}${a0 === 0 ? '' : (a0 < 0 ? '' : '+') + a0}$ 貼合曲線。`,
      hint: diff === 'easy'
        ? `$f(x)$ 已寫成 $${P.xh(h)}$ 的冪次，一次近似就是取到 $${P.xh(h)}$ 的一次項`
        : `用綜合除法連續除以 $${P.xh(h, true)}$：第一次的餘數是 $a_0=f(${h})$，第二次的餘數就是 $a_1$`,
      explain: (diff === 'easy' ? '' : `$f(x)=${P.texShift(cs, h)}$，`) + `一次近似為 $y=${line}$`
    };
  }

  const N = 360;

  class L3 extends LG.LevelBase {
    static pick(diff) { return build(diff); }

    constructor(zone, q, scr) {
      super(zone, q, scr);
      this.celebrateTime = 3.2;
      this.setQuestion(U.rich(q.prompt));
      const m = scr.main;
      m.classList.add('l1', 'l3z');
      m.innerHTML = `
        <div class="g-wrap"><canvas class="g-cv"></canvas><div class="g-tag pt"></div><div class="g-tag ln"></div><div class="zoom-badge"></div></div>
        <div class="base-pane">
          <div class="base-read"><span class="lab">斜率</span><span class="val"></span></div>
          <div class="slider"><div class="sl-track"></div><div class="sl-stops"></div><div class="sl-knob"></div></div>
        </div>`;
      this.wrap = m.querySelector('.g-wrap');
      this.cv = m.querySelector('.g-cv');
      this.ptTag = m.querySelector('.g-tag.pt');
      this.lnTag = m.querySelector('.g-tag.ln');
      this.badge = m.querySelector('.zoom-badge');
      this.readEl = m.querySelector('.base-read .val');
      this.slider = m.querySelector('.slider');
      this.knob = m.querySelector('.sl-knob');
      this.stopsEl = m.querySelector('.sl-stops');
      this.stopsEl.innerHTML = q.slots.map((s, i) => `<div class="sl-stop" data-i="${i}">${U.tex(String(s))}</div>`).join('');
      this.stops = Array.from(this.stopsEl.children);

      this.f = x => P.evalc(q.c, x);
      this.y0 = this.f(q.h);
      // 視窗：以 P 為中心
      const R = 1.7;
      let D = 0;
      for (let i = 0; i <= 60; i++) { const x = q.h - R + 2 * R * i / 60; D = Math.max(D, Math.abs(this.f(x) - this.y0)); }
      D = Math.max(D * 0.62, 2);
      this.win0 = { xmin: q.h - R, xmax: q.h + R, ymin: this.y0 - D, ymax: this.y0 + D };
      this.zoom = 1;
      this.graph = new LG.Graph2D(this.cv, Object.assign({ autoStep: true }, this.win0));
      this.ptTag.innerHTML = U.tex(`P(${q.h},\\,${this.y0})`);
      this.sel = null;
      this.preview = null;
      this.knobPos = 4.5 / 9;
      this.lines = [];
      this.dirty = true;
      this.time = 0;

      this.updateKnob(false);
      this.updateRead();
      this.setGo('貼合！', () => this.go());
      this.setGoEnabled(false);

      LG.input.onDrag(this.slider, {
        down: () => this.playing && !this.busy,
        start: (e, p) => { this.slider.classList.add('drag'); this.moveTo(p.x); },
        move: (e, p) => this.moveTo(p.x),
        up: () => this.release(),
        cancel: () => this.release()
      });
    }

    moveTo(px) {
      const w = this.slider.clientWidth || 1;
      this.knobPos = U.clamp(px / w, 0.5 / 9, 8.5 / 9);
      const i = U.clamp(Math.round(this.knobPos * 9 - 0.5), 0, 8);
      if (i !== this.preview) { this.preview = i; LG.audio.play('dial'); }
      this.updateKnob(false);
      this.updateRead();
    }

    release() {
      this.slider.classList.remove('drag');
      if (this.preview == null) return;
      this.sel = this.preview;
      this.knobPos = (this.sel + 0.5) / 9;
      this.updateKnob(true);
      this.updateRead();
      this.setGoEnabled(true);
    }

    updateKnob(snap) {
      this.knob.classList.toggle('snap', !!snap);
      this.knob.style.left = (this.knobPos * 100).toFixed(2) + '%';
      this.stops.forEach((s, i) => s.classList.toggle('on', i === this.preview));
    }

    updateRead() {
      const i = this.preview;
      this.readEl.innerHTML = i == null ? U.tex('a_1=\\,?') : U.tex(`a_1=${this.q.slots[i]}`);
    }

    layout() {
      const r = this.wrap.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      this.graph.resize(r.width, r.height, this.scale());
      this.cv.style.width = r.width + 'px';
      this.cv.style.height = r.height + 'px';
      this.placeTags();
      this.dirty = true;
    }

    placeTags() {
      const g = this.graph, r = this.wrap.getBoundingClientRect();
      if (!g.view) return;
      const X = g.cssX(this.q.h), Y = g.cssY(this.y0);
      this.ptTag.style.left = (X + r.width * 0.03) + 'px';
      this.ptTag.style.top = (Y + r.height * 0.09) + 'px';
      this.ptTag.style.transform = 'translate(0, -50%)';
    }

    go() {
      if (this.sel == null || this.busy) return;
      this.lastPick = this.sel;
      const ok = this.q.slots[this.sel] === this.q.a1;
      const r = this.submit(ok);
      if (r === 'retry') {
        this.grow(this.q.slots[this.sel], 'bad');
        this.stops[this.sel].classList.add('bad');
      }
    }

    grow(slope, kind, delay) {
      this.lines.push({ slope, kind, prog: 0, t: -(delay || 0), alpha: 1, sounded: !delay });
      this.busy = true;
      if (!delay) LG.audio.play('grow');
    }

    celebrate() {
      this.grow(this.lastPick != null ? this.q.slots[this.lastPick] : this.q.a1, 'ok');
      this.zoomAt = this.time + 1.0;
    }

    reveal(reason) {
      if (reason !== 'timeout' && this.lastPick != null && this.q.slots[this.lastPick] !== this.q.a1) {
        this.grow(this.q.slots[this.lastPick], 'bad');
        this.stops[this.lastPick].classList.add('bad');
      }
      this.grow(this.q.a1, 'answer', reason === 'timeout' ? 0 : 0.6);
      const i = this.q.slots.indexOf(this.q.a1);
      if (i >= 0) this.stops[i].classList.add('ans');
      this.zoomAt = this.time + (reason === 'timeout' ? 1.0 : 1.6);
    }

    showLineTag(kind) {
      this.lnTag.innerHTML = U.tex(`y=${this.q.line}`);
      this.lnTag.classList.add('show', kind);
      this.lnTag.style.left = '50%';
      this.lnTag.style.top = '8%';
      this.lnTag.style.transform = 'translate(-50%, 0)';
    }

    update(dt) {
      this.time += dt;
      let anim = false;
      for (const l of this.lines) {
        if (l.prog < 1) {
          l.t += dt;
          if (l.t > 0) { l.prog = U.ease.outCubic(U.clamp(l.t / 0.8, 0, 1)); anim = true; }
          if (l.t > 0 && !l.sounded) { l.sounded = true; if (l.kind === 'answer') LG.audio.play('grow'); }
        } else if (l.kind === 'bad' && l.alpha > 0.3) { l.alpha = Math.max(0.3, l.alpha - dt * 0.9); anim = true; }
      }
      // 直線長完就可以再作答（淡出的紅線不擋操作）
      if (this.busy && this.lines.every(l => l.prog >= 1)) this.busy = false;
      // 放大鏡頭
      if (this.zoomAt != null && this.time >= this.zoomAt) {
        const k = U.clamp((this.time - this.zoomAt) / 1.5, 0, 1);
        const z = Math.pow(12, U.ease.inOutCubic(k));
        if (Math.abs(z - this.zoom) > 1e-4) {
          this.zoom = z;
          const w = this.win0, cx = this.q.h, cy = this.y0;
          this.graph.setWindow({ xmin: cx + (w.xmin - cx) / z, xmax: cx + (w.xmax - cx) / z, ymin: cy + (w.ymin - cy) / z, ymax: cy + (w.ymax - cy) / z });
          this.badge.textContent = `放大 ${Math.round(z)} 倍`;
          this.badge.classList.add('show');
          this.ptTag.style.opacity = '0';
          anim = true;
        }
        if (k >= 1 && !this.tagShown) {
          this.tagShown = true;
          const okLine = this.lines.find(l => l.kind === 'ok');
          this.showLineTag(okLine ? 'ok' : 'answer');
          if (okLine) {
            const p = this.zone.fx.rel(this.wrap);
            this.zone.fx.confetti(p.x, p.y, { n: 30 });
          }
        }
      }
      if (anim) this.dirty = true;
      if (this.dirty) { this.draw(); this.dirty = false; }
    }

    draw() {
      const g = this.graph;
      if (!g.view) return;
      g.clear();
      const v = g.view, q = this.q;
      const span = v.x1 - v.x0;
      g.polyline(LG.Graph2D.sample(this.f, v.x0 - span * 0.1, v.x1 + span * 0.1, N), { color: U.UNIT_HEX.graph, width: 4 });
      const COL = { ok: '#8cf06a', bad: '#ff5a6a', answer: '#ffd34d' };
      for (const l of this.lines) {
        if (l.prog <= 0) continue;
        const L = x => l.slope * (x - q.h) + this.y0;
        const reach = (this.win0.xmax - this.win0.xmin) * 0.75 * l.prog;
        g.line(q.h - reach, L(q.h - reach), q.h + reach, L(q.h + reach), { color: COL[l.kind], alpha: l.alpha, width: 3.2, dash: l.kind === 'answer' ? [12, 8] : null });
      }
      g.dot(q.h, this.y0, { r: 6.5, color: '#f2f6fb', halo: 'rgba(242,246,251,0.2)' });
    }
  }

  L3.meta = { id: 3, name: '放大鏡', part: 'graph', topic: '一次近似' };
  L3.build = build; L3.expand = expand;
  LG.registerLevel(L3);
})(window.LG);
