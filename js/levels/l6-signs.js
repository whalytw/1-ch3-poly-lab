/* 第 6 關｜正負號訊號燈（高次不等式：分析每個因式的正負號）
   數線上標好關鍵點，把每一段的訊號燈點成 ＋ 或 −（乘積的正負號），按「通電！」。
   答對後，數線上自動點亮不等式成立的範圍並寫出解。
   簡單：給每個因式的正負列（像課本表 6），只要相乘；
   標準：只給數線，含平方因式、恆正的二次式、三次方；挑戰：再加上負的首項係數、分數根。 */
'use strict';
(function (LG) {
  const U = LG.util, P = LG.poly;

  /* ---------- 因式 ---------- */
  // 一次式 ax+b（a>0）或 b−x，次方 m
  function lin(a, b, m, flip) {
    let F;
    // flip：寫成 (c − x)，根為 c
    if (flip) {
      const c = b, tex = `${c}-x`;
      F = { tex, body: `(${tex})`, m: m || 1, roots: [P.fr(c)], coef: [-1, c], kind: 'lin' };
    } else {
      const tex = b === 0 ? (a === 1 ? '' : a) + 'x' : (a === 1 ? '' : a) + 'x' + (b < 0 ? '-' : '+') + Math.abs(b);
      F = { tex, body: b === 0 && a === 1 ? 'x' : `(${tex})`, m: m || 1, roots: [P.fr(-b, a)], coef: [a, b], kind: 'lin' };
    }
    // 次方 m 可能在建立後才改成 2 或 3，所以求值時才讀 F.m
    F.f = x => Math.pow(P.evalc(F.coef, x), F.m);
    return F;
  }
  const QUAD_POS = [[1, 1, 1], [1, -1, 1], [1, -2, 5], [1, 0, 2], [1, 2, 3], [1, 1, 3], [1, 0, 1]];
  const QUAD_NEG = [[-1, 1, -1], [-1, 2, -3], [-1, 0, -2]];
  function quad(c) {
    const tex = P.tex(c);
    const F = { tex, body: `(${tex})`, m: 1, roots: [], coef: c, kind: c[0] > 0 ? 'qpos' : 'qneg' };
    F.f = x => Math.pow(P.evalc(F.coef, x), F.m);
    return F;
  }

  function powBody(F) {
    if (F.m === 1) return F.body;
    return `${F.body}^{${F.m}}`;
  }

  const OPKEYS = ['>', '>=', '<', '<='];

  function gen(diff) {
    for (let t = 0; t < 300; t++) {
      const fs = [];
      let lead = 1;
      const pool = U.shuffle([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
      if (diff === 'easy') {
        const n = U.pick([2, 3, 3]);
        for (let i = 0; i < n; i++) fs.push(lin(1, -pool[i]));
      } else if (diff === 'normal') {
        const n = U.pick([2, 3]);
        for (let i = 0; i < n; i++) fs.push(lin(1, -pool[i]));
        const sp = U.pick(['sq', 'sq', 'cube', 'quad', 'quad']);
        const k = U.randInt(0, n - 1);
        if (sp === 'sq') fs[k].m = 2;
        else if (sp === 'cube') fs[k].m = 3;
        else fs.push(quad(U.pick(QUAD_POS)));
        if (sp !== 'quad' && Math.random() < 0.35) fs.push(quad(U.pick(QUAD_POS)));
      } else {
        const n = U.pick([3, 3, 4]);
        for (let i = 0; i < n; i++) fs.push(lin(1, -pool[i]));
        // 分數根：把其中一個換成 (2x±1)
        if (Math.random() < 0.6) { const s = U.pick([1, -1]); fs[0] = lin(2, s * U.pick([1, 3])); }
        // 平方或三次方
        const k = U.randInt(1, n - 1);
        fs[k].m = U.pick([2, 2, 3]);
        // 負的首項係數：前面加負號、(c−x)、或恆負的二次式
        const how = U.pick(['minus', 'flip', 'qneg', 'minus']);
        if (how === 'minus') lead = -1;
        else if (how === 'flip') { const j = n - 1, r = fs[j].roots[0]; if (r.d === 1 && r.n > 0 && fs[j].m === 1) fs[j] = lin(1, r.n, 1, true); else lead = -1; }
        else fs.push(quad(U.pick(QUAD_NEG)));
      }
      // 關鍵點
      const roots = [];
      fs.forEach(F => F.roots.forEach(r => { if (!roots.some(x => x.v === r.v)) roots.push(r); }));
      if (roots.length < 2 || roots.length > 4) continue;
      roots.sort((a, b) => a.v - b.v);
      // 相鄰關鍵點不要太近（分數根）
      if (roots.some((r, i) => i && r.v - roots[i - 1].v < 0.45)) continue;
      const f = x => fs.reduce((s, F) => s * F.f(x), lead);
      const sample = i => (i === 0 ? roots[0].v - 1 : i === roots.length ? roots[roots.length - 1].v + 1 : (roots[i - 1].v + roots[i].v) / 2);
      const signs = [];
      for (let i = 0; i <= roots.length; i++) signs.push(f(sample(i)) > 0 ? 1 : -1);
      // 至少要有一次「不變號」或多種正負，避免全部同號
      if (signs.every(s => s === signs[0])) continue;
      const op = U.pick(OPKEYS);
      return { fs, lead, roots, signs, op, f, sample };
    }
    return null;
  }

  const recent = [];
  function build(diff) {
    let g;
    for (let t = 0; t < 20; t++) {
      g = gen(diff);
      const key = g.fs.map(F => F.tex + '^' + F.m).join('') + g.lead + g.op;
      if (!recent.includes(key)) { recent.push(key); break; }
    }
    while (recent.length > 8) recent.shift();
    const O = P.OPS[g.op];
    // 讓 x 因式排在最前面
    const ord = g.fs.slice().sort((a, b) => (a.body === 'x' ? -1 : b.body === 'x' ? 1 : 0));
    const expr = (g.lead < 0 ? '-' : '') + ord.map(powBody).join('');
    const iv = g.signs.map(s => O.test(s));
    const pt = g.roots.map(() => O.eq);
    const sol = P.solTex(g.roots, iv, pt);
    const signTxt = g.signs.map(s => (s > 0 ? '＋' : '－')).join('、');
    const hint = diff === 'easy'
      ? '每一段把上面各列的正負號乘起來：負號的個數是偶數就是 ＋，奇數就是 －'
      : diff === 'normal'
        ? '從最右邊一段開始（首項係數為正，最右邊是 ＋），往左每經過一個根就變號；\n但平方因式的根兩側不變號，恆正的二次式不影響正負號'
        : '先看首項係數決定最右邊一段的正負號，再往左走：奇次方的根兩側變號、偶次方不變號；\n恆正（或恆負）的二次式只看它的正負';
    return {
      key: expr + g.op,
      fs: g.fs, ord, lead: g.lead, roots: g.roots, signs: g.signs, op: g.op, iv, pt, sol,
      prompt: `解不等式 $${expr}${O.tex}0$：點每一段的訊號燈，設定式子在該段的正負號。`,
      hint,
      explain: `由左而右依序為 ${signTxt}，所以解為 ${sol}`,
      showRows: diff === 'easy'
    };
  }

  class L6 extends LG.LevelBase {
    static pick(diff) { return build(diff); }

    constructor(zone, q, scr) {
      super(zone, q, scr);
      this.celebrateTime = 3.0;
      this.setQuestion(U.rich(q.prompt));
      const m = scr.main;
      m.classList.add('l6s');
      const n = q.roots.length + 1;
      const rows = q.showRows ? q.ord : [];
      m.style.setProperty('--cols', String(n));
      m.innerHTML = `
        <div class="sg-table">
          <div class="sg-lab sg-head">區間</div>
          <div class="sg-line"><svg class="sg-svg"></svg><div class="sg-pts"></div></div>
          ${rows.map(F => `<div class="sg-lab">${U.tex(F.m > 1 ? `(${F.tex})^{${F.m}}` : F.tex)}</div>` +
            q.signs.map((s, i) => { const v = this.factorSign(F, i); return `<div class="sg-cell ${v > 0 ? 'pos' : 'neg'}">${v > 0 ? '＋' : '－'}</div>`; }).join('')).join('')}
          <div class="sg-lab sg-prod">${q.showRows ? '乘積' : '式子的<br>正負號'}</div>
          ${q.signs.map((s, i) => `<div class="sg-lamp" data-i="${i}"><span class="sg-q">?</span></div>`).join('')}
        </div>
        <div class="sg-sol"></div>`;
      this.svg = m.querySelector('.sg-svg');
      this.lineEl = m.querySelector('.sg-line');
      this.ptsEl = m.querySelector('.sg-pts');
      this.solEl = m.querySelector('.sg-sol');
      this.ptsEl.innerHTML = q.roots.map((r, j) => `<div class="sg-pt" style="left:${((j + 1) / n * 100).toFixed(3)}%">${U.tex(P.ftex(r, true))}</div>`).join('');
      this.lamps = Array.from(m.querySelectorAll('.sg-lamp'));
      this.vals = new Array(n).fill(0);
      this.lamps.forEach((el, i) => {
        LG.input.onTap(el, () => this.toggle(i), { sound: false, enabled: () => this.playing });
      });
      this.setGo('通電！', () => this.go());
      this.setGoEnabled(false);
      this.solShown = null;
    }

    /* 第 F 個因式在第 i 段的正負號（含首項的負號不算在因式裡） */
    factorSign(F, i) {
      const q = this.q;
      const x = i === 0 ? q.roots[0].v - 1 : i === q.roots.length ? q.roots[q.roots.length - 1].v + 1 : (q.roots[i - 1].v + q.roots[i].v) / 2;
      return F.f(x) > 0 ? 1 : -1;
    }

    toggle(i) {
      if (!this.playing) return;
      const v = this.vals[i];
      this.vals[i] = v === 1 ? -1 : 1;
      this.paintLamp(i);
      LG.audio.play('dial');
      this.lamps.forEach(l => l.classList.remove('bad'));
      this.setGoEnabled(this.vals.every(Boolean));
    }

    paintLamp(i, cls) {
      const el = this.lamps[i], v = this.vals[i];
      el.classList.toggle('pos', v === 1);
      el.classList.toggle('neg', v === -1);
      el.innerHTML = v === 0 ? '<span class="sg-q">?</span>' : `<span class="sg-s">${v > 0 ? '＋' : '－'}</span>`;
      if (cls) el.classList.add(cls);
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }

    layout() {
      this.drawLine();
      this.lineEl.querySelectorAll('.sg-pt').forEach(p => U.fit(p, 0.6, true));
    }

    /* 數線：關鍵點畫在各段之間；解出來之後再點亮成立的範圍 */
    drawLine() {
      const r = this.lineEl.getBoundingClientRect();
      if (r.width < 4) return;
      const W = r.width, H = r.height, n = this.q.roots.length + 1, y = H * 0.7;
      this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const sw = Math.max(2, W * 0.006);
      let h = `<path d="M${W * 0.01} ${y}H${W * 0.985}" class="sg-axis" stroke-width="${sw}"/>`;
      h += `<path d="M${W * 0.995} ${y}l${-W * 0.03} ${-H * 0.09}v${H * 0.18}z" class="sg-arrow"/>`;
      const X = j => (j / n) * W;
      const S = this.solShown;
      if (S) {
        S.iv.forEach((on, i) => {
          if (!on) return;
          const a = i === 0 ? 0 : X(i), b = i === n - 1 ? W * 0.97 : X(i + 1);
          h += `<path d="M${a} ${y}H${b}" class="sg-on ${S.kind}" stroke-width="${sw * 3.2}"/>`;
        });
      }
      this.q.roots.forEach((rt, j) => {
        const x = X(j + 1);
        const fill = S ? (S.pt[j] ? 'full' : 'hollow') : 'tick';
        h += fill === 'tick'
          ? `<circle cx="${x}" cy="${y}" r="${sw * 2.4}" class="sg-dot"/>`
          : `<circle cx="${x}" cy="${y}" r="${sw * 3}" class="sg-dot ${fill} ${S.kind}" stroke-width="${sw * 1.2}"/>`;
      });
      this.svg.innerHTML = h;
    }

    go() {
      if (!this.vals.every(Boolean)) return;
      const ok = this.vals.every((v, i) => v === this.q.signs[i]);
      const r = this.submit(ok);
      if (r === 'retry') {
        this.lamps.forEach(l => { l.classList.remove('bad'); void l.offsetWidth; l.classList.add('bad'); });
        this.setGoEnabled(true);
      }
    }

    sweep(kind) {
      // 訊號燈依序亮起，接著點亮解
      this.lamps.forEach((el, i) => {
        this.zone.after(0.12 * i, () => {
          this.vals[i] = this.q.signs[i];
          this.paintLamp(i, kind === 'ok' ? 'lit' : 'ans');
          LG.audio.play('coin');
        });
      });
      this.zone.after(0.12 * this.lamps.length + 0.25, () => {
        this.solShown = { iv: this.q.iv, pt: this.q.pt, kind };
        this.drawLine();
        this.solEl.innerHTML = `<span class="lab">解</span>${U.rich(this.q.sol)}`;
        this.solEl.classList.add('show', kind);
        U.fit(this.solEl, 0.4, true);
        LG.audio.play('zap');
        if (kind === 'ok') {
          const p = this.zone.fx.rel(this.lineEl);
          this.zone.fx.confetti(p.x, p.y, { n: 32 });
        }
      });
    }

    celebrate() { this.sweep('ok'); }
    reveal() { this.sweep('answer'); }
  }

  L6.meta = { id: 6, name: '正負號訊號燈', part: 'ineq', topic: '高次不等式' };
  L6.build = build; L6.gen = gen;
  LG.registerLevel(L6);
})(window.LG);
