/* 第 8 關｜魔王關：多項式雲霄飛車（綜合題）
   3D 雲霄飛車停在高台上，軌道中段就是一條三次函數的圖形。
   選出正確答案按「發車！」：車廂沿著軌道衝下谷底、爬上山頂、衝進終點站放煙火；答錯車廂晃一下停住。 */
'use strict';
(function (LG) {
  const U = LG.util;

  // opts 第一個是正解；verify 只給自動測試用
  //   { t:'ineq', p, a }：不等式 p(x) 與正解 a(x) 在取樣點完全一致
  //   { t:'val', got, want }：算出來的值等於正解
  //   { t:'krange', ok(k), a(k) }：對每個 k，「對所有 x 都成立」與正解範圍一致
  const Q = (key, prompt, opts, hint, explain, verify) => ({ key, prompt, opts, hint, explain, verify });
  const allX = (fn) => { for (let i = -3000; i <= 3000; i++) if (!fn(i / 100)) return false; return true; };

  /* 題目都設計成可以心算：整數、小數字、一兩步就能算完；不出小數估計或無理數範圍 */
  const BANK = {
    easy: [
      Q('e1', '解不等式 $(x+2)(x^{2}+1)<0$。', ['$x<-2$', '$x>-2$', '$-1<x<1$', '無解'],
        '$x^{2}+1$ 永遠是正的，只要看 $x+2$',
        '$x^{2}+1>0$，所以只要 $x+2<0$，即 $x<-2$',
        { t: 'ineq', p: x => (x + 2) * (x * x + 1) < 0, a: x => x < -2 }),
      Q('e2', '解不等式 $(x-3)(x^{2}+x+1)\\ge0$。', ['$x\\ge3$', '$x\\le3$', '$x\\ge-3$', '所有實數'],
        '$x^{2}+x+1$ 的判別式是負的，而且開口向上',
        '$x^{2}+x+1$ 恆正，所以只要 $x-3\\ge0$，即 $x\\ge3$',
        { t: 'ineq', p: x => (x - 3) * (x * x + x + 1) >= 0, a: x => x >= 3 }),
      Q('e3', '將 $y=x^{3}+2x$ 的圖形往右平移 2 單位，再往上平移 1 單位，所得圖形的函數為？', ['$y=(x-2)^{3}+2(x-2)+1$', '$y=(x+2)^{3}+2(x+2)+1$', '$y=(x-2)^{3}+2(x-2)-1$', '$y=(x-1)^{3}+2(x-1)+2$'],
        '往右平移 2：把 $x$ 換成 $x-2$；往上平移 1：整個函數加 1',
        '$y=(x-2)^{3}+2(x-2)+1$',
        { t: 'val', got: ((x) => (x - 2) ** 3 + 2 * (x - 2) + 1)(5), want: (5 - 2) ** 3 + 2 * (5 - 2) + 1 }),
      Q('e4', '把 $y=x^{3}$ 的圖形向左平移 1 單位、向下平移 2 單位，所得圖形的函數為？', ['$y=(x+1)^{3}-2$', '$y=(x-1)^{3}-2$', '$y=(x+1)^{3}+2$', '$y=(x-2)^{3}+1$'],
        '向左平移 1：把 $x$ 換成 $x+1$；向下平移 2：整個函數減 2',
        '$y=(x+1)^{3}-2$',
        { t: 'val', got: ((x) => (x + 1) ** 3 - 2)(-1), want: -2 }),
      Q('e5', '三次函數 $f(x)=-(x-1)(x+1)(x+c)$ 的圖形與 $y$ 軸交於 $(0,\\,3)$，求 $c$。', ['$3$', '$-3$', '$1$', '$\\dfrac13$'],
        '代入 $x=0$',
        '$f(0)=-(-1)(1)(c)=c=3$',
        { t: 'val', got: -(0 - 1) * (0 + 1) * (0 + 3), want: 3 }),
      Q('e6', '$y=(x-2)^{3}+3(x-2)+1$ 圖形的對稱中心為？', ['$(2,\\,1)$', '$(-2,\\,1)$', '$(2,\\,-1)$', '$(1,\\,2)$'],
        '$y=a(x-h)^{3}+p(x-h)+k$ 的對稱中心是 $(h,\\,k)$',
        '由 $y=x^{3}+3x$ 向右平移 2、向上平移 1，對稱中心 $(2,\\,1)$',
        { t: 'val', got: [0.5, 1.7].every(t => { const f = x => (x - 2) ** 3 + 3 * (x - 2) + 1; return Math.abs(f(2 + t) + f(2 - t) - 2) < 1e-9; }) ? 1 : 0, want: 1 }),
      Q('e7', '二次不等式 $x^{2}+bx+c<0$ 的解為 $1<x<4$，求 $b+c$。', ['$-1$', '$9$', '$-9$', '$1$'],
        '$1$ 和 $4$ 是 $x^{2}+bx+c=0$ 的兩根',
        '$(x-1)(x-4)=x^{2}-5x+4$，$b+c=-5+4=-1$',
        { t: 'val', got: -5 + 4, want: -1 }),
      Q('e8', '$f(x)=(x-1)^{3}+2(x-1)^{2}+3(x-1)+5$ 在 $x=1$ 附近的一次近似為？', ['$y=3(x-1)+5$', '$y=2(x-1)+5$', '$y=3(x-1)+1$', '$y=(x-1)+5$'],
        '一次近似是取到 $(x-1)$ 的一次項',
        '取到 $(x-1)$ 的一次項：$y=3(x-1)+5$',
        { t: 'val', got: 3, want: 3 }),
      Q('e9', '若對所有實數 $x$，$x^{2}+k>0$ 恆成立，求 $k$ 的範圍。', ['$k>0$', '$k\\ge0$', '$k<0$', '$k>1$'],
        '$x^{2}$ 最小是 0，發生在 $x=0$',
        '$x=0$ 時要 $k>0$；而 $k>0$ 時 $x^{2}+k\\ge k>0$ 一定成立',
        { t: 'krange', ok: k => allX(x => x * x + k > 0), a: k => k > 0 }),
      Q('e10', '解不等式 $x(x-2)(x+3)>0$。', ['$-3<x<0$ 或 $x>2$', '$x<-3$ 或 $0<x<2$', '$x>2$', '$-3<x<2$'],
        '關鍵點 $-3,\\,0,\\,2$；最右邊一段是正的，往左每過一個根變號',
        '由右往左正負號 $+,\\,-,\\,+,\\,-$，取 $>0$：$-3<x<0$ 或 $x>2$',
        { t: 'ineq', p: x => x * (x - 2) * (x + 3) > 0, a: x => (x > -3 && x < 0) || x > 2 })
    ],
    normal: [
      Q('n1', '若對所有實數 $x$，$-x^{2}+2kx-k<0$ 恆成立，求 $k$ 的範圍。', ['$0<k<1$', '$k<0$ 或 $k>1$', '$0\\le k\\le1$', '$-1<k<0$'],
        '開口向下又恆負：圖形和 $x$ 軸沒有交點，判別式要小於 0',
        '$(2k)^{2}-4k<0\\Rightarrow k(k-1)<0\\Rightarrow0<k<1$',
        { t: 'krange', ok: k => allX(x => -x * x + 2 * k * x - k < 0), a: k => k > 0 && k < 1 }),
      Q('n2', '若對所有實數 $x$，$3x^{2}+2kx-k\\ge0$ 恆成立，求 $k$ 的範圍。', ['$-3\\le k\\le0$', '$-3<k<0$', '$k\\le-3$ 或 $k\\ge0$', '$0\\le k\\le3$'],
        '開口向上又恆 $\\ge0$：判別式 $\\le0$',
        '$(2k)^{2}+12k\\le0\\Rightarrow k(k+3)\\le0\\Rightarrow-3\\le k\\le0$',
        { t: 'krange', ok: k => allX(x => 3 * x * x + 2 * k * x - k >= -1e-9), a: k => k >= -3 && k <= 0 }),
      Q('n3', '二次函數 $y=mx^{2}+3x+m$ 的圖形恆在直線 $y=3x+2$ 的上方，求 $m$ 的範圍。', ['$m>2$', '$m>0$', '$0<m<2$', '$m<0$ 或 $m>2$'],
        '相減：對所有 $x$，$mx^{2}+m-2>0$',
        '$mx^{2}+(m-2)>0$ 恆成立：需 $m>0$ 且 $m-2>0$，所以 $m>2$',
        { t: 'krange', ok: m => m !== 0 && allX(x => m * x * x + 3 * x + m > 3 * x + 2), a: m => m > 2 }),
      Q('n4', '三次函數 $f(x)=-(x-1)(x+1)(x+c)$ 的圖形通過 $(0,\\,3)$，求 $f(x)\\ge0$ 的解。', ['$x\\le-3$ 或 $-1\\le x\\le1$', '$-3\\le x\\le-1$ 或 $x\\ge1$', '$x\\le-1$ 或 $1\\le x\\le3$', '$-3\\le x\\le1$'],
        '先由 $f(0)=3$ 求 $c$，再同乘 $-1$ 解不等式',
        '$c=3$，$(x-1)(x+1)(x+3)\\le0\\Rightarrow x\\le-3$ 或 $-1\\le x\\le1$',
        { t: 'ineq', p: x => -(x - 1) * (x + 1) * (x + 3) >= 0, a: x => x <= -3 || (x >= -1 && x <= 1) }),
      Q('n5', '$f(x)=x^{3}+x$ 在 $x=1$ 附近的一次近似為？', ['$y=4(x-1)+2$', '$y=3(x-1)+2$', '$y=4(x-1)+1$', '$y=2(x-1)+4$'],
        '連續綜合除法除以 $x-1$：第一次的餘數是 $a_0$，第二次的餘數是 $a_1$',
        '$f(x)=(x-1)^{3}+3(x-1)^{2}+4(x-1)+2$，一次近似 $y=4(x-1)+2$',
        { t: 'val', got: LG.poly.taylor([1, 0, 1, 0], 1).slice(-2).join(','), want: '4,2' }),
      Q('n6', '若對所有實數 $x$，$x^{2}+kx+k+3>0$ 恆成立，求 $k$ 的範圍。', ['$-2<k<6$', '$k<-2$ 或 $k>6$', '$-6<k<2$', '$-2\\le k\\le6$'],
        '開口向上又恆正：判別式 $<0$',
        '$k^{2}-4(k+3)<0\\Rightarrow(k-6)(k+2)<0\\Rightarrow-2<k<6$',
        { t: 'krange', ok: k => allX(x => x * x + k * x + k + 3 > 0), a: k => k > -2 && k < 6 }),
      Q('n7', '若不等式 $ax^{2}+bx+6>0$ 的解為 $-2<x<3$，求 $a+b$。', ['$0$', '$-2$', '$2$', '$1$'],
        '解在兩根之間，所以 $a<0$；設 $ax^{2}+bx+6=a(x+2)(x-3)$',
        '$a(x^{2}-x-6)$ 的常數項 $-6a=6$，$a=-1$、$b=1$，$a+b=0$',
        { t: 'ineq', p: x => -x * x + x + 6 > 0, a: x => x > -2 && x < 3 }),
      Q('n8', '已知多項式 $f(x)=x^{3}+ax+b$ 有因式 $x^{2}-2x+5$，求 $f(x)<0$ 的解。', ['$x<-2$', '$x>-2$', '$-2<x<1$', '所有實數'],
        '設 $f(x)=(x^{2}-2x+5)(x+c)$，比較 $x^{2}$ 項係數',
        '$c-2=0$，$f(x)=(x+2)(x^{2}-2x+5)$；$x^{2}-2x+5=(x-1)^{2}+4$ 恆正，所以 $x<-2$',
        { t: 'ineq', p: x => (x + 2) * (x * x - 2 * x + 5) < 0, a: x => x < -2 }),
      Q('n9', '$y=x^{3}-3x^{2}+x+3$ 圖形的對稱中心為？', ['$(1,\\,2)$', '$(-1,\\,2)$', '$(1,\\,-2)$', '$(3,\\,3)$'],
        '$h=-\\dfrac{b}{3a}$，再求 $f(h)$',
        '$h=-\\frac{-3}{3}=1$，$f(1)=1-3+1+3=2$，對稱中心 $(1,\\,2)$',
        { t: 'val', got: [0.5, 1.7].every(t => { const f = x => x ** 3 - 3 * x * x + x + 3; return Math.abs(f(1 + t) + f(1 - t) - 4) < 1e-9; }) ? 1 : 0, want: 1 })
    ],
    hard: [
      Q('h1', '若對所有實數 $x$，$kx^{2}+kx+1>0$ 恆成立，求 $k$ 的範圍。', ['$0\\le k<4$', '$0<k<4$', '$k<0$ 或 $k>4$', '$0\\le k\\le4$'],
        '別忘了 $k=0$ 的情形；$k\\ne0$ 時需開口向上且判別式 $<0$',
        '$k=0$ 時 $1>0$ 成立；$k>0$ 且 $k^{2}-4k<0\\Rightarrow0<k<4$；合起來 $0\\le k<4$',
        { t: 'krange', ok: k => allX(x => k * x * x + k * x + 1 > 0), a: k => k >= 0 && k < 4 }),
      Q('h2', '若對所有實數 $x$，$x^{2}+(k+1)x+(k+4)\\ge0$ 恆成立，求 $k$ 的範圍。', ['$-3\\le k\\le5$', '$-3<k<5$', '$k\\le-3$ 或 $k\\ge5$', '$-5\\le k\\le3$'],
        '判別式 $\\le0$，再因式分解',
        '$(k+1)^{2}-4(k+4)\\le0\\Rightarrow k^{2}-2k-15\\le0\\Rightarrow(k-5)(k+3)\\le0\\Rightarrow-3\\le k\\le5$',
        { t: 'krange', ok: k => allX(x => x * x + (k + 1) * x + k + 4 >= -1e-9), a: k => k >= -3 && k <= 5 }),
      Q('h3', '三次函數 $f(x)=x^{3}+ax^{2}+bx+c$ 的圖形以 $(1,\\,2)$ 為對稱中心，而且通過原點，求 $b$。', ['$4$', '$2$', '$-4$', '$3$'],
        '$-\\frac{a}{3}=1$、$f(0)=0$、$f(1)=2$',
        '$a=-3$，$c=0$，$1-3+b=2\\Rightarrow b=4$',
        { t: 'val', got: [0.4, 1.3, 2.2].every(t => Math.abs(((1 + t) ** 3 - 3 * (1 + t) ** 2 + 4 * (1 + t)) + ((1 - t) ** 3 - 3 * (1 - t) ** 2 + 4 * (1 - t)) - 4) < 1e-9) ? 4 : -1, want: 4 }),
      Q('h4', '已知 $x^{2}+bx+c<0$ 的解為 $-1<x<3$，求不等式 $cx^{2}+bx+1<0$ 的解。', ['$x<-1$ 或 $x>\\dfrac13$', '$-1<x<\\dfrac13$', '$x<-\\dfrac13$ 或 $x>1$', '$-\\dfrac13<x<1$'],
        '先求 $b$、$c$：$(x+1)(x-3)=x^{2}-2x-3$',
        '$b=-2$、$c=-3$：$-3x^{2}-2x+1<0\\Rightarrow(3x-1)(x+1)>0\\Rightarrow x<-1$ 或 $x>\\frac13$',
        { t: 'ineq', p: x => -3 * x * x - 2 * x + 1 < 0, a: x => x < -1 || x > 1 / 3 }),
      Q('h5', '解不等式 $(x^{2}-1)(x^{2}-4)\\le0$。', ['$-2\\le x\\le-1$ 或 $1\\le x\\le2$', '$-2\\le x\\le2$', '$x\\le-2$ 或 $-1\\le x\\le1$ 或 $x\\ge2$', '$-1\\le x\\le1$'],
        '分解成 $(x+2)(x+1)(x-1)(x-2)$，關鍵點 $-2,\\,-1,\\,1,\\,2$',
        '由右往左正負號 $+,\\,-,\\,+,\\,-,\\,+$，取 $\\le0$：$-2\\le x\\le-1$ 或 $1\\le x\\le2$',
        { t: 'ineq', p: x => (x * x - 1) * (x * x - 4) <= 0, a: x => (x >= -2 && x <= -1) || (x >= 1 && x <= 2) }),
      Q('h6', '解不等式 $x^{3}-3x^{2}-4x+12>0$。', ['$-2<x<2$ 或 $x>3$', '$x<-2$ 或 $2<x<3$', '$x>3$', '$-2<x<3$'],
        '分組分解：$x^{2}(x-3)-4(x-3)$',
        '$(x-3)(x-2)(x+2)>0\\Rightarrow-2<x<2$ 或 $x>3$',
        { t: 'ineq', p: x => x ** 3 - 3 * x * x - 4 * x + 12 > 0, a: x => (x > -2 && x < 2) || x > 3 }),
      Q('h7', '$f(x)=x^{3}+2x^{2}-x+4$ 在 $x=-1$ 附近的一次近似為？', ['$y=-2(x+1)+6$', '$y=2(x+1)+6$', '$y=-2(x+1)+4$', '$y=-(x+1)+6$'],
        '連續綜合除法除以 $x+1$：第一次的餘數是 $a_0$，第二次的餘數是 $a_1$',
        '$f(x)=(x+1)^{3}-(x+1)^{2}-2(x+1)+6$，一次近似 $y=-2(x+1)+6$',
        { t: 'val', got: LG.poly.taylor([1, 2, -1, 4], -1).slice(-2).join(','), want: '-2,6' }),
      Q('h8', '若對所有實數 $x$，$(k-1)x^{2}-2(k-1)x+3>0$ 恆成立，求 $k$ 的範圍。', ['$1\\le k<4$', '$1<k<4$', '$k<1$ 或 $k>4$', '$1\\le k\\le4$'],
        '先看 $k=1$；$k\\ne1$ 時需開口向上且判別式 $<0$',
        '$k=1$ 時 $3>0$ 成立；$k>1$ 且 $4(k-1)^{2}-12(k-1)<0\\Rightarrow1<k<4$；合起來 $1\\le k<4$',
        { t: 'krange', ok: k => allX(x => (k - 1) * x * x - 2 * (k - 1) * x + 3 > 0), a: k => k >= 1 && k < 4 })
    ]
  };

  class L8 extends LG.LevelBase {
    static pick(diff) { return U.pickFresh('l8' + diff, BANK[diff], q => q.key); }

    constructor(zone, q, scr) {
      super(zone, q, scr);
      this.celebrateTime = 4.3;
      this.setQuestion(U.rich(q.prompt));
      const m = scr.main;
      m.classList.add('l6');
      m.innerHTML = `<div class="v3d"><canvas class="v3d-cv"></canvas><div class="v3d-tag">軌道中段：${U.tex('y=-0.06x^{3}+1.2x+4.2')}</div></div><div class="cards4"></div>`;
      this.v3d = m.querySelector('.v3d');
      this.cv = m.querySelector('.v3d-cv');
      this.ctx2d = this.cv.getContext('2d', { alpha: false });
      this.order = U.shuffle([0, 1, 2, 3]);
      const box = m.querySelector('.cards4');
      this.cards = this.order.map((oi, s) => {
        const el = U.el('div', 'opt', `<div class="ox">${U.rich(q.opts[oi])}</div>`);
        box.appendChild(el);
        LG.input.onTap(el, () => this.select(s), { sound: false, enabled: () => this.playing });
        return el;
      });
      this.sel = -1;
      if (LG.Shared3D.init()) {
        this.scene = new LG.CoasterScene();
        this.view = { scene: this.scene.scene, camera: this.scene.camera, ctx: this.ctx2d, w: 0, h: 0 };
        LG.Shared3D.add(this.view);
      } else {
        this.scene = new LG.Coaster2D(this.ctx2d);
        this.is2d = true;
      }
      this.setGo('發車！', () => this.go());
      this.setGoEnabled(false);
    }

    select(s) {
      if (!this.playing || this.cards[s].classList.contains('bad')) return;
      this.sel = s;
      LG.audio.play('select');
      this.cards.forEach((c, i) => c.classList.toggle('on', i === s));
      this.setGoEnabled(true);
    }

    layout() {
      const r = this.v3d.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const s = Math.min(this.scale(), 1.5);
      const w = Math.round(r.width * s), h = Math.round(r.height * s);
      if (this.cv.width !== w) this.cv.width = w;
      if (this.cv.height !== h) this.cv.height = h;
      if (this.view) { this.view.w = w; this.view.h = h; }
      this.scene.resize(w, h);
      this.cards.forEach(c => U.fit(c.querySelector('.ox'), 0.5, true));
    }

    go() {
      if (this.sel < 0) return;
      const oi = this.order[this.sel];
      this.lastPick = oi;
      const r = this.submit(oi === 0);
      if (r === 'retry') {
        const c = this.cards[this.sel];
        c.classList.remove('on');
        c.classList.add('bad');
        this.sel = -1;
        this.setGoEnabled(false);
        this.scene.wobble();
      }
    }

    celebrate() {
      this.cards[this.sel >= 0 ? this.sel : this.order.indexOf(0)].classList.add('ok');
      this.scene.ride();
      this.zone.after(3.0, () => {
        const p = this.zone.fx.rel(this.v3d);
        this.zone.fx.confetti(p.x, p.y, { n: 40 });
      });
    }

    reveal(reason) {
      if (reason !== 'timeout' && this.lastPick != null && this.lastPick !== 0) {
        const s = this.order.indexOf(this.lastPick);
        this.cards[s].classList.remove('on');
        this.cards[s].classList.add('bad');
        this.scene.wobble();
      }
      this.cards[this.order.indexOf(0)].classList.add('answer');
    }

    update(dt) {
      this.scene.update(dt);
      if (this.is2d) this.scene.render();
    }

    destroy() {
      super.destroy();
      if (this.view) LG.Shared3D.remove(this.view);
      try { this.scene.dispose(); } catch (e) { /* ignore */ }
    }
  }

  L8.meta = { id: 8, name: '多項式雲霄飛車', part: 'boss', topic: '綜合挑戰' };
  L8.BANK = BANK;
  LG.registerLevel(L8);
})(window.LG);
