/* 第 1 關｜曲線配對站（三次函數的圖形）
   沿用「電路接線」：左邊 3 個三次函數、右邊 4 張圖形（1 張用不到），把函數拖線接到它的圖形。
   簡單：y=ax³+px 的 a、p 正負號；標準：同一個視窗比較爬升快慢與 p=0；挑戰：因式分解式，看交點與大域特徵。 */
'use strict';
(function (LG) {
  const U = LG.util, P = LG.poly;

  /* ---------- 題目產生 ---------- */
  // 圖形規格：{ f, tex, win:{x0,x1,y0,y1}, ticks:bool, key }
  const monoTex = (a, p) => {
    let s = (a === 1 ? '' : a === -1 ? '-' : (Number.isInteger(a) ? String(a) : (a < 0 ? '-' : '') + `\\frac{1}{${Math.round(1 / Math.abs(a))}}`)) + 'x^{3}';
    if (p) s += (p < 0 ? '-' : '+') + (Math.abs(p) === 1 ? '' : Math.abs(p)) + 'x';
    return 'y=' + s;
  };
  const cubicSpec = (a, p, win) => ({ f: x => a * x * x * x + p * x, tex: monoTex(a, p), win, key: `c${a}_${p}` });

  function easyGraphs() {
    const combos = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    return combos.map(([sa, sp]) => {
      const a = sa * U.pick([1, 2, 3]), p = sp * U.pick([1, 2, 3]);
      const X = 1.45 * Math.sqrt(Math.abs(p / a));
      const Y = Math.abs(a * X * X * X + p * X) * 1.08;
      return cubicSpec(a, p, { x0: -X, x1: X, y0: -Y, y1: Y });
    });
  }

  const NWIN = { x0: -2.3, x1: 2.3, y0: -8.5, y1: 8.5 };
  function normalGraphs() {
    const k = U.pick([3, 4]), b = U.pick([3, 4]);
    const T = [
      [[1, 0], [k, 0], [-1, 0], [-k, 0]],
      [[1, 0], [1, -b], [-1, 0], [-1, b]],
      [[1, 0], [1, b], [-1, 0], [-1, -b]],
      [[k, 0], [1, -b], [-k, 0], [-1, b]],
      [[0.5, 0], [k, 0], [-1, b], [1, -b]],
      [[1, b], [1, -b], [-1, -b], [-1, b]]
    ];
    return U.pick(T).map(([a, p]) => cubicSpec(a, p, NWIN));
  }

  /* 因式分解式：lead·Π(x−r)^m */
  function factTex(lead, fs) {
    const body = fs.slice().sort((a, b) => (a[0] === 0 ? -1 : b[0] === 0 ? 1 : 0)).map(([r, m]) => {
      const t = r === 0 ? 'x' : `(x${r < 0 ? '+' : '-'}${Math.abs(r)})`;
      return m > 1 ? (r === 0 ? `x^{${m}}` : `${t}^{${m}}`) : t;
    });
    // 讓 x 排在最前面
    return 'y=' + (lead < 0 ? '-' : '') + body.join('');
  }
  function factSpec(lead, fs, win) {
    const f = x => fs.reduce((s, [r, m]) => s * Math.pow(x - r, m), lead);
    return { f, tex: factTex(lead, fs), win, ticks: true, key: 'f' + lead + JSON.stringify(fs), roots: fs };
  }
  function hardGraphs() {
    for (let t = 0; t < 200; t++) {
      const rs = U.shuffle([-3, -2, -1, 0, 1, 2, 3]).slice(0, 3).sort((a, b) => a - b);
      const [r1, r2, r3] = rs;
      const s = U.pick([1, -1]);
      const vars = [
        [s, [[r1, 1], [r2, 1], [r3, 1]]],
        [-s, [[r1, 1], [r2, 1], [r3, 1]]],
        [s, [[r1, 1], [r2, 2]]],
        [s, [[r1, 2], [r3, 1]]],
        [-s, [[r2, 1], [r3, 2]]],
        [s, [[-r3, 1], [-r2, 1], [-r1, 1]]]
      ];
      const pick = U.shuffle(vars).slice(0, 4);
      // 不可以有兩張圖完全相同
      const keys = pick.map(([l, f]) => l + JSON.stringify(f.slice().sort((a, b) => a[0] - b[0])));
      if (new Set(keys).size < 4) continue;
      const all = pick.flatMap(([, f]) => f.map(x => x[0]));
      const lo = Math.min(...all) - 1.25, hi = Math.max(...all) + 1.25;
      return pick.map(([l, f]) => {
        // y 範圍：視窗內關鍵點之間的最大值
        const g = x => f.reduce((acc, [r, m]) => acc * Math.pow(x - r, m), l);
        const rr = f.map(x => x[0]);
        const a0 = Math.min(...rr), a1 = Math.max(...rr);
        let Y = 0;
        for (let i = 0; i <= 80; i++) Y = Math.max(Y, Math.abs(g(a0 + (a1 - a0) * i / 80)));
        Y = Math.max(Y, 2) * 1.3;
        return factSpec(l, f.slice().sort((a, b) => a[0] - b[0]), { x0: lo, x1: hi, y0: -Y, y1: Y });
      });
    }
    return null;
  }

  const recent = [];
  function build(diff) {
    let graphs;
    for (let t = 0; t < 30; t++) {
      graphs = diff === 'easy' ? easyGraphs() : diff === 'normal' ? normalGraphs() : hardGraphs();
      if (!graphs.some(g => recent.includes(g.key))) break;
    }
    graphs.forEach(g => recent.push(g.key));
    while (recent.length > 10) recent.shift();
    graphs.forEach((g, i) => { g.id = i; });
    const used = U.shuffle(graphs).slice(0, 3);
    const hint = diff === 'hard'
      ? '看與 $x$ 軸的交點（平方的因式只碰一下 $x$ 軸、不穿過）\n最高次項係數為正：最右方往上；為負：最右方往下'
      : diff === 'normal'
        ? '$a>0$ 最右方往上、$a<0$ 最右方往下；$|a|$ 越大爬得越快\n$p>0$：在 $x=0$ 附近往右上走；$p<0$：往右下走；$p=0$：在原點附近很平'
        : '$a$ 的正負決定最右方往上或往下\n$p$ 的正負決定在 $x=0$ 附近往右上或右下走；$a$、$p$ 異號時與 $x$ 軸有三個交點';
    return {
      key: graphs.map(g => g.key).join('|'),
      items: used.map(g => ({ tex: g.tex, v: g.id })),
      graphs: U.shuffle(graphs),
      hint,
      explain: used.map(g => `$${g.tex}$`).join('、') + ' 依序接到各自的圖形'
    };
  }

  /* ---------- 縮圖 ---------- */
  function drawThumb(cv, spec, state) {
    const r = cv.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    const s = Math.min(LG.settings.canvasScale(), 2);
    const W = Math.round(r.width * s), H = Math.round(r.height * s);
    if (cv.width !== W) cv.width = W;
    if (cv.height !== H) cv.height = H;
    const g = cv.getContext('2d'), w = spec.win;
    const pad = 4 * s;
    const X = x => pad + (x - w.x0) / (w.x1 - w.x0) * (W - 2 * pad);
    const Y = y => H - pad - (y - w.y0) / (w.y1 - w.y0) * (H - 2 * pad);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    // 座標軸
    g.strokeStyle = 'rgba(242, 246, 251, 0.6)';
    g.lineWidth = 1.5 * s;
    g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.moveTo(X(0), 0); g.lineTo(X(0), H); g.stroke();
    if (spec.ticks) {
      g.font = `700 ${Math.max(10 * s, H * 0.17)}px "Barlow Condensed", sans-serif`;
      g.fillStyle = 'rgba(200, 222, 245, 0.85)';
      g.textAlign = 'center'; g.textBaseline = 'top';
      for (let x = Math.ceil(w.x0); x <= Math.floor(w.x1); x++) {
        g.beginPath(); g.moveTo(X(x), Y(0) - 3 * s); g.lineTo(X(x), Y(0) + 3 * s); g.stroke();
        if (x !== 0) g.fillText(String(x).replace('-', '−'), X(x), Y(0) + 4 * s);
      }
    }
    // 曲線
    const col = state === 'ok' ? '#8cf06a' : state === 'answer' ? '#ffd34d' : state === 'dim' ? 'rgba(242,246,251,0.35)' : '#ffb547';
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const x = w.x0 + (w.x1 - w.x0) * i / 160;
      pts.push([X(x), Y(U.clamp(spec.f(x), w.y0 - (w.y1 - w.y0), w.y1 + (w.y1 - w.y0)))]);
    }
    g.save();
    g.beginPath(); g.rect(0, 0, W, H); g.clip();
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = col;
    g.globalAlpha = 0.25; g.lineWidth = 9 * s;
    g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke();
    g.globalAlpha = 1; g.lineWidth = 3 * s;
    g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke();
    if (spec.roots) {
      g.fillStyle = '#f2f6fb';
      spec.roots.forEach(([rt]) => { g.beginPath(); g.arc(X(rt), Y(0), 3.4 * s, 0, Math.PI * 2); g.fill(); });
    }
    g.restore();
  }

  /* ---------- 關卡 ---------- */
  class L1 extends LG.LevelBase {
    static pick(diff) { return build(diff); }

    constructor(zone, q, scr) {
      super(zone, q, scr);
      this.celebrateTime = 2.3;
      this.setQuestion(U.rich('把左邊每個函數拖線接到它的圖形（右邊有一張圖用不到）') +
        '<span class="l3-prog">已接通 <b>0</b>／3</span>');
      const m = scr.main;
      m.classList.add('l3', 'l1m');
      m.innerHTML = `<div class="board"><svg class="c-svg"></svg><div class="col col-l"></div><div class="col col-r"></div></div>`;
      this.board = m.querySelector('.board');
      this.svg = m.querySelector('.c-svg');
      const colL = m.querySelector('.col-l'), colR = m.querySelector('.col-r');
      this.left = q.items.map((it, i) => {
        const el = U.el('div', 'sock sock-l', `<div class="sx">${U.tex(it.tex)}</div><i class="plug"></i>`);
        colL.appendChild(el);
        return { side: 'l', i, el, v: it.v, done: false };
      });
      this.right = q.graphs.map((gs, j) => {
        const el = U.el('div', 'sock sock-r sock-g', `<i class="plug"></i><canvas class="thumb"></canvas>`);
        colR.appendChild(el);
        return { side: 'r', i: j, el, v: gs.id, spec: gs, cv: el.querySelector('canvas'), state: '', done: false };
      });
      this.links = [];
      this.drag = null;
      this.count = 0;
      this.setGoLabel('拖曳連線來作答');
      LG.input.onDrag(this.board, {
        down: (e, p) => this.onDown(p),
        move: (e, p) => this.onMove(p),
        up: () => this.onUp(),
        cancel: () => this.retract()
      });
    }

    layout() {
      const b = this.board.getBoundingClientRect();
      if (b.width < 4) return;
      this.bw = b.width; this.bh = b.height;
      this.svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
      const geo = s => {
        const r = s.el.getBoundingClientRect();
        s.rect = { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
        s.plug = s.side === 'l' ? { x: s.rect.x + s.rect.w, y: s.rect.y + s.rect.h / 2 } : { x: s.rect.x, y: s.rect.y + s.rect.h / 2 };
      };
      this.left.forEach(geo);
      this.right.forEach(geo);
      this.left.forEach(s => U.fit(s.el.querySelector('.sx'), 0.5, true));
      this.right.forEach(s => drawThumb(s.cv, s.spec, s.state));
      this.render();
    }

    hit(list, p) {
      const k = LG.settings.hitScale();
      for (const s of list) {
        const r = s.rect;
        if (!r) continue;
        const ex = r.w * (k - 1) / 2 + 4, ey = r.h * (k - 1) / 2 + 4;
        if (p.x >= r.x - ex && p.x <= r.x + r.w + ex && p.y >= r.y - ey && p.y <= r.y + r.h + ey) return s;
      }
      return null;
    }

    onDown(p) {
      if (!this.playing) return false;
      const s = this.hit(this.left, p) || this.hit(this.right, p);
      if (!s || s.done) return false;
      this.drag = { from: s, x: p.x, y: p.y, hover: null };
      s.el.classList.add('active');
      LG.audio.play('plug');
      this.render();
    }

    onMove(p) {
      const d = this.drag;
      if (!d) return;
      d.x = p.x; d.y = p.y;
      const other = d.from.side === 'l' ? this.right : this.left;
      const h = this.hit(other, p);
      const hv = h && !h.done ? h : null;
      if (hv !== d.hover) {
        if (d.hover) d.hover.el.classList.remove('hover');
        if (hv) hv.el.classList.add('hover');
        d.hover = hv;
      }
      this.render();
    }

    onUp() {
      const d = this.drag;
      if (!d) return;
      if (d.hover && this.playing) {
        const a = d.from.side === 'l' ? d.from : d.hover;
        const b = d.from.side === 'l' ? d.hover : d.from;
        this.clearDrag();
        this.connect(a, b);
      } else this.retract();
    }

    clearDrag() {
      const d = this.drag;
      if (!d) return;
      d.from.el.classList.remove('active');
      if (d.hover) d.hover.el.classList.remove('hover');
      this.drag = null;
    }

    retract() {
      const d = this.drag;
      if (!d) return;
      this.retractAnim = { from: d.from, x: d.x, y: d.y, t: 0 };
      this.clearDrag();
    }

    setGraphState(s, st) { s.state = st; drawThumb(s.cv, s.spec, st); }

    connect(a, b) {
      const ok = a.v === b.v;
      if (ok) {
        a.done = b.done = true;
        a.el.classList.add('done'); b.el.classList.add('done');
        this.setGraphState(b, 'ok');
        this.links.push({ a, b, state: 'ok' });
        this.count++;
        LG.audio.play('plug');
        this.scr.q.querySelector('.l3-prog b').textContent = String(this.count);
        const o = this.zoff(this.board);
        this.zone.fx.burst(o.x + b.plug.x, o.y + b.plug.y, { n: 16, colors: [U.UNIT_HEX.graph, '#fff6c0'], speed: [80, 300], gravity: 200 });
        if (this.count === 3) this.submit(true);
        this.render();
        return;
      }
      this.flash = { a, b, t: 0 };
      const r = this.submit(false);
      if (r === 'retry') {
        a.el.classList.add('bad'); b.el.classList.add('bad');
        setTimeout(() => { a.el.classList.remove('bad'); b.el.classList.remove('bad'); }, 650);
      }
      this.render();
    }

    celebrate() {
      this.links.forEach(l => { l.state = 'flow'; });
      this.right.forEach(s => { if (!s.done) this.setGraphState(s, 'dim'); });
      LG.audio.play('zap');
      const p = this.zone.fx.rel(this.board);
      this.zone.fx.confetti(p.x, p.y, { n: 36 });
      this.render();
    }

    reveal() {
      this.clearDrag();
      for (const a of this.left) {
        if (a.done) continue;
        const b = this.right.find(s => s.v === a.v);
        this.links.push({ a, b, state: 'answer' });
        b.el.classList.add('answer');
        a.el.classList.add('answer');
        this.setGraphState(b, 'answer');
      }
      this.right.forEach(s => { if (!this.left.some(a => a.v === s.v)) this.setGraphState(s, 'dim'); });
      this.render();
    }

    path(ax, ay, bx, by) {
      const dx = Math.max(30, Math.abs(bx - ax) * 0.45);
      const sgn = bx >= ax ? 1 : -1;
      return `M${ax.toFixed(1)} ${ay.toFixed(1)}C${(ax + dx * sgn).toFixed(1)} ${ay.toFixed(1)} ${(bx - dx * sgn).toFixed(1)} ${by.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
    }

    render() {
      if (!this.bw) return;
      const sw = Math.max(3, this.bw * 0.011);
      let h = '';
      const wire = (d, cls) => {
        h += `<path d="${d}" class="cw-shadow" stroke-width="${(sw * 2).toFixed(1)}"/>`;
        h += `<path d="${d}" class="cw ${cls}" stroke-width="${sw.toFixed(1)}"/>`;
      };
      for (const l of this.links) wire(this.path(l.a.plug.x, l.a.plug.y, l.b.plug.x, l.b.plug.y), l.state);
      if (this.flash) {
        const f = this.flash;
        wire(this.path(f.a.plug.x, f.a.plug.y, f.b.plug.x, f.b.plug.y), 'bad');
      }
      if (this.drag) {
        const d = this.drag, s = d.from.plug;
        const tx = d.hover ? d.hover.plug.x : d.x, ty = d.hover ? d.hover.plug.y : d.y;
        wire(d.from.side === 'l' ? this.path(s.x, s.y, tx, ty) : this.path(tx, ty, s.x, s.y), 'live');
        h += `<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="${(sw * 1.6).toFixed(1)}" class="cw-tip"/>`;
      }
      if (this.retractAnim) {
        const r = this.retractAnim, s = r.from.plug, k = U.ease.outCubic(U.clamp(r.t / 0.2, 0, 1));
        const tx = U.lerp(r.x, s.x, k), ty = U.lerp(r.y, s.y, k);
        wire(r.from.side === 'l' ? this.path(s.x, s.y, tx, ty) : this.path(tx, ty, s.x, s.y), 'live');
      }
      this.svg.innerHTML = h;
    }

    update(dt) {
      let dirty = false;
      if (this.flash) {
        this.flash.t += dt;
        if (this.flash.t > 0.65) this.flash = null;
        dirty = true;
      }
      if (this.retractAnim) {
        this.retractAnim.t += dt;
        if (this.retractAnim.t > 0.2) this.retractAnim = null;
        dirty = true;
      }
      if (dirty) this.render();
    }
  }

  L1.meta = { id: 1, name: '曲線配對站', part: 'graph', topic: '三次函數的圖形' };
  L1.build = build;
  LG.registerLevel(L1);
})(window.LG);
