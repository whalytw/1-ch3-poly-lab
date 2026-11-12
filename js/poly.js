/* 多項式實驗室 — 多項式共用工具：分數、求值、綜合除法、TeX 排版、解集合文字 */
'use strict';
(function (LG) {
  const P = {};

  /* ---------- 分數 ---------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
  P.gcd = gcd;
  /* 分數 {n, d, v}，d > 0 且已約分 */
  P.fr = (n, d) => {
    d = d == null ? 1 : d;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    n /= g; d /= g;
    return { n, d, v: n / d };
  };
  /* 分數 → TeX；small = true 用 \frac（較矮） */
  P.ftex = (f, small) => {
    if (typeof f === 'number') f = P.fr(f, 1);
    if (f.d === 1) return String(f.n);
    const s = small ? '\\frac' : '\\dfrac';
    return (f.n < 0 ? '-' : '') + `${s}{${Math.abs(f.n)}}{${f.d}}`;
  };

  /* ---------- 多項式（係數由高次到低次） ---------- */
  P.evalc = (c, x) => c.reduce((s, a) => s * x + a, 0);
  P.mul = (a, b) => {
    const r = new Array(a.length + b.length - 1).fill(0);
    a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; }));
    return r;
  };
  P.trim = c => { let i = 0; while (i < c.length - 1 && Math.abs(c[i]) < 1e-12) i++; return c.slice(i); };

  /* 連續綜合除法：把 f(x) 改寫成 (x−h) 的冪次，回傳 [a_n, …, a_1, a_0] */
  P.taylor = (c, h) => {
    let cur = c.slice();
    const out = [];
    while (cur.length > 1) {
      const q = [];
      let acc = 0;
      for (const a of cur) { acc = acc * h + a; q.push(acc); }
      out.unshift(q.pop());          // 餘數
      cur = q;
    }
    out.unshift(cur[0]);
    return out;
  };

  /* 一個單項：係數 k、主體 body（例如 'x'、'(x+2)'）、次方 e */
  function term(k, body, e, first) {
    if (k === 0) return '';
    const sign = k < 0 ? '-' : (first ? '' : '+');
    const a = Math.abs(k);
    if (e === 0) return sign + a;
    const coef = a === 1 ? '' : String(a);
    const pow = e === 1 ? '' : `^{${e}}`;
    return sign + coef + body + pow;
  }

  /* 一般式：[2,6,3,-3] → 2x^{3}+6x^{2}+3x-3 */
  P.tex = c => {
    const n = c.length - 1;
    let s = '', first = true;
    c.forEach((k, i) => {
      const t = term(k, 'x', n - i, first);
      if (t) { s += t; first = false; }
    });
    return s || '0';
  };

  /* (x−h) 的寫法：h=−2 → (x+2)；h=0 → x */
  P.xh = (h, bare) => {
    const hv = typeof h === 'number' ? h : h.v;
    if (hv === 0) return 'x';
    const ht = P.ftex(typeof h === 'number' ? P.fr(Math.abs(h)) : P.fr(Math.abs(h.n), h.d), true);
    const inner = hv < 0 ? `x+${ht}` : `x-${ht}`;
    return bare ? inner : `(${inner})`;
  };

  /* (x−h) 冪次式：[2,-6,3,-1], h=-2 → 2(x+2)^{3}-6(x+2)^{2}+3(x+2)-1 */
  P.texShift = (cs, h) => {
    const n = cs.length - 1, body = P.xh(h);
    let s = '', first = true;
    cs.forEach((k, i) => {
      const t = term(k, body, n - i, first);
      if (t) { s += t; first = false; }
    });
    return s || '0';
  };

  /* 一次式 y = a1(x−h)+a0 */
  P.texLin = (a1, h, a0) => {
    let s = term(a1, P.xh(h), 1, true);
    if (a0 !== 0 || !s) s += (s ? (a0 < 0 ? '-' : '+') : (a0 < 0 ? '-' : '')) + Math.abs(a0);
    return s;
  };

  /* 平移式 a(x−h)³+p(x−h)+k */
  P.texCubicShift = (a, p, h, k) => {
    const body = P.xh(h);
    let s = term(a, body, 3, true) + term(p, body, 1, false);
    if (k) s += (k < 0 ? '-' : '+') + Math.abs(k);
    return s;
  };

  /* 展開 a(x−h)³+p(x−h)+k */
  P.expandCubicShift = (a, p, h, k) => [a, -3 * a * h, 3 * a * h * h + p, -a * h * h * h - p * h + k];

  /* ---------- 解集合 ----------
     pts：由小到大的關鍵點（分數）；iv[i]：第 i 個區間是否成立（共 pts.length+1 個）；pt[j]：第 j 點是否成立 */
  P.solTex = (pts, iv, pt) => {
    const n = pts.length;
    const pieces = [];   // 依序：I0, p0, I1, p1, …, In
    for (let i = 0; i <= n; i++) {
      pieces.push({ k: 'I', i, on: !!iv[i] });
      if (i < n) pieces.push({ k: 'P', i, on: !!pt[i] });
    }
    if (pieces.every(p => p.on)) return '所有實數';
    if (pieces.every(p => !p.on)) return '無解';
    // 只缺幾個點：x ≠ a
    if (iv.every(Boolean)) {
      const miss = pts.filter((p, j) => !pt[j]);
      return miss.map(p => `$x\\ne ${P.ftex(p)}$`).join(' 且 ');
    }
    const comps = [];
    let cur = null;
    pieces.forEach((p, idx) => {
      if (p.on) { if (!cur) cur = { s: idx, e: idx }; else cur.e = idx; }
      else if (cur) { comps.push(cur); cur = null; }
    });
    if (cur) comps.push(cur);
    const out = comps.map(({ s, e }) => {
      const A = pieces[s], B = pieces[e];
      if (s === e && A.k === 'P') return `$x=${P.ftex(pts[A.i])}$`;
      let left = null, right = null;
      if (A.k === 'I') { if (A.i > 0) left = { v: pts[A.i - 1], closed: false }; }
      else left = { v: pts[A.i], closed: true };
      if (B.k === 'I') { if (B.i < n) right = { v: pts[B.i], closed: false }; }
      else right = { v: pts[B.i], closed: true };
      const L = left && P.ftex(left.v), R = right && P.ftex(right.v);
      const le = c => (c ? '\\le ' : '<'), ge = c => (c ? '\\ge ' : '>');
      if (left && right) return `$${L}${le(left.closed)}x${le(right.closed)}${R}$`;
      if (right) return `$x${le(right.closed)}${R}$`;
      return `$x${ge(left.closed)}${L}$`;
    });
    return out.join(' 或 ');
  };

  /* 不等號 */
  P.OPS = {
    '>': { tex: '>', test: v => v > 0, eq: false },
    '>=': { tex: '\\ge', test: v => v >= 0, eq: true },
    '<': { tex: '<', test: v => v < 0, eq: false },
    '<=': { tex: '\\le', test: v => v <= 0, eq: true }
  };

  LG.poly = P;
})(window.LG);
