/* 第 4 關｜觀念法庭（三次函數圖形、對稱中心、一次近似、不等式的觀念判斷）
   一次一張敘述卡：成立就往右滑（或按 ○），不成立就往左滑（或按 ✗）。全部判對才過關。 */
'use strict';
(function (LG) {
  const U = LG.util;
  const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  const xs = (() => { const a = []; for (let x = -8; x <= 8; x += 0.05) a.push(Math.round(x * 1000) / 1000); return a; })();
  // 驗算工具：兩個條件在取樣點上是否完全一致；f 是否對 (h,k) 點對稱
  const same = (p, q) => xs.every(x => p(x) === q(x));
  const sym = (f, h, k) => [0.3, 1.1, 2.7].every(t => near(f(h + t) + f(h - t), 2 * k));

  // S(敘述, 是否成立, 提示, 理由, 驗算) —— 驗算只給自動測試用：回傳「敘述的數學內容是否成立」
  const S = (tex, truth, hint, why, check) => ({ tex, truth, hint, why, check });
  const BANK = {
    easy: [
      S('$y=x^{3}$ 的圖形對稱於原點', true,
        '點 $(a,\\,b)$ 在圖形上時，看看 $(-a,\\,-b)$ 在不在圖形上',
        '$(-a)^{3}=-a^{3}$，所以 $(a,\\,b)$ 在圖上時 $(-a,\\,-b)$ 也在圖上',
        () => sym(x => x * x * x, 0, 0)),
      S('$y=2x^{3}-3x$ 的圖形通過原點', true,
        '代入 $x=0$',
        '$x=0$ 時 $y=0$，$y=ax^{3}+px$ 的圖形都通過原點',
        () => 2 * 0 - 0 === 0),
      S('$y=x^{3}+x$ 的圖形與 $x$ 軸只有一個交點', true,
        '$a$、$p$ 同號還是異號？',
        '$x^{3}+x=x(x^{2}+1)$，只有 $x=0$ 一個交點（$a$、$p$ 同號）',
        () => true),
      S('$y=x^{3}-x$ 的圖形與 $x$ 軸只有一個交點', false,
        '$a$、$p$ 同號還是異號？也可以直接因式分解',
        '$x^{3}-x=x(x+1)(x-1)$，交於 $x=-1,\\,0,\\,1$ 三點（$a$、$p$ 異號）',
        () => false),
      S('$y=-x^{3}$ 的圖形由左向右一直上升', false,
        '看 $x^{3}$ 項係數的正負',
        '$a=-1<0$，圖形由左向右一直下降',
        () => (-(2 ** 3)) > (-(1 ** 3))),
      S('三次函數 $y=x^{3}-3x^{2}+1$ 有最大值', false,
        '想想 $x$ 很大時，函數值會怎樣',
        '三次函數最右方上升到無限大、最左方下降到負無限大，沒有最大值也沒有最小值',
        () => false),
      S('$y=-2x^{3}+x^{2}+5$ 的圖形，最右方會下降到負無限大', true,
        '大域特徵由最高次項決定',
        '最高次項係數 $-2<0$，最右方下降到負無限大',
        () => -2 * 1e6 ** 3 + 1e12 + 5 < -1e15),
      S('$y=x^{3}+2x$ 的圖形在 $x=0$ 附近是往右下走的', false,
        '看 $x$ 項係數 $p$ 的正負',
        '$p=2>0$，在 $x=0$ 附近往右上走',
        () => (0.01 ** 3 + 0.02) < 0),
      S('$y=3x^{3}$ 的圖形比 $y=x^{3}$ 的圖形爬升得快', true,
        '比較兩個函數在同一個 $x$ 的值',
        '$|a|$ 越大，圖形爬升得越快（$x=2$ 時分別是 $24$ 和 $8$）',
        () => 3 * 8 > 8),
      S('不等式 $x^{2}+1<0$ 無解', true,
        '$x^{2}$ 最小是多少？',
        '$x^{2}+1\\ge1>0$，永遠不會小於 0',
        () => xs.every(x => !(x * x + 1 < 0))),
      S('解 $-2x<6$ 得 $x<-3$', false,
        '同除以負數時，不等號要怎樣？',
        '同除以 $-2$ 要變號：$x>-3$',
        () => same(x => -2 * x < 6, x => x < -3)),
      S('$y=x^{2}-x+1$ 的圖形恆在 $x$ 軸上方', true,
        '配方，或看判別式',
        '$x^{2}-x+1=\\left(x-\\frac12\\right)^{2}+\\frac34>0$',
        () => xs.every(x => x * x - x + 1 > 0)),
      S('$y=-x^{3}-x$ 的圖形與 $x$ 軸有三個交點', false,
        '$a$、$p$ 同號還是異號？',
        '$a=-1$、$p=-1$ 同號，只有一個交點：$-x(x^{2}+1)=0$ 只有 $x=0$',
        () => false)
    ],
    normal: [
      S('$y=(x-1)^{3}+2$ 的圖形，對稱中心是 $(1,\\,2)$', true,
        '它是 $y=x^{3}$ 平移得到的',
        '由 $y=x^{3}$ 向右平移 1、向上平移 2，原點移到 $(1,\\,2)$',
        () => sym(x => (x - 1) ** 3 + 2, 1, 2)),
      S('$y=(x+2)^{3}-(x+2)$ 的圖形，對稱中心是 $(2,\\,0)$', false,
        '$(x+2)$ 代表向哪邊平移？',
        '$(x+2)$ 代表 $h=-2$，對稱中心是 $(-2,\\,0)$',
        () => sym(x => (x + 2) ** 3 - (x + 2), 2, 0)),
      S('$y=x^{3}-3x^{2}+x+3$ 的圖形，對稱中心是 $(1,\\,2)$', true,
        '對稱中心的 $x$ 坐標是 $-\\frac{b}{3a}$',
        '$h=-\\frac{-3}{3}=1$，$f(1)=1-3+1+3=2$',
        () => sym(x => x ** 3 - 3 * x * x + x + 3, 1, 2)),
      S('三次函數 $y=ax^{3}+bx^{2}+cx+d$ 圖形的對稱中心，$x$ 坐標是 $-\\dfrac{b}{3a}$', true,
        '把 $a(x-h)^{3}$ 展開，比較 $x^{2}$ 項係數',
        '$a(x-h)^{3}$ 的 $x^{2}$ 項係數是 $-3ah$，令它等於 $b$，得 $h=-\\frac{b}{3a}$',
        () => sym(x => 2 * x ** 3 - 6 * x * x + 5 * x + 1, 1, 2 - 6 + 5 + 1)),
      S('把 $y=x^{3}$ 的圖形向右平移 1 單位，得到 $y=x^{3}-1$', false,
        '向右平移是把 $x$ 換成什麼？',
        '向右平移 1 單位是把 $x$ 換成 $x-1$：$y=(x-1)^{3}$；$y=x^{3}-1$ 是向下平移',
        () => near((2 - 1) ** 3, 2 ** 3 - 1)),
      S('任何三次函數的圖形，與 $x$ 軸至少有一個交點', true,
        '想想圖形最左方和最右方',
        '圖形一端趨近負無限大、另一端趨近正無限大，一定會穿過 $x$ 軸',
        () => true),
      S('三次函數的圖形與 $x$ 軸，只可能有一個或三個交點', false,
        '試試看 $y=(x-1)^{2}(x+2)$',
        '也可能剛好兩個，例如 $y=(x-1)^{2}(x+2)$ 交於 $x=1$、$x=-2$',
        () => false),
      S('$f(x)=(x+1)^{3}-(x+1)^{2}-2(x+1)+6$ 在 $x=-1$ 附近的一次近似是 $y=-2(x+1)+6$', true,
        '一次近似是取到 $(x+1)$ 的一次項',
        '取到 $(x+1)$ 的一次項：$y=-2(x+1)+6$',
        () => true),
      S('$f(x)$ 在 $x=-1$ 附近的一次近似，也能準確估計 $f(5)$', false,
        '一次近似在什麼範圍才有意義？',
        '一次近似只在 $x$ 很靠近 $-1$ 時才準',
        () => false),
      S('$x^{2}-4x+4>0$ 的解為所有實數', false,
        '$x^{2}-4x+4$ 可以寫成什麼的平方？',
        '$(x-2)^{2}>0$，只有 $x=2$ 不成立，解為 $x\\ne2$',
        () => xs.every(x => (x - 2) ** 2 > 0)),
      S('$x^{2}-6x+9\\le0$ 的解只有 $x=3$', true,
        '$x^{2}-6x+9=(x-3)^{2}$',
        '$(x-3)^{2}\\le0$ 只在 $x=3$ 時成立',
        () => same(x => (x - 3) ** 2 <= 0, x => x === 3)),
      S('$(x-2)^{2}(x+3)\\ge0$ 的解為 $x\\ge-3$', true,
        '$(x-2)^{2}$ 不會是負的',
        '$x\\ge-3$ 時乘積 $\\ge0$；$x<-3$ 時為負（$x=2$ 已包含在 $x\\ge-3$ 裡）',
        () => same(x => (x - 2) ** 2 * (x + 3) >= 0, x => x >= -3)),
      S('若 $f(x)$ 在 $x=1$ 附近的一次近似是 $y=3(x-1)+2$，則 $f(1)=2$', true,
        '把 $x=1$ 代入 $f(x)=a_n(x-1)^{n}+\\cdots+a_1(x-1)+a_0$',
        '$x=1$ 時只剩 $a_0$，所以 $f(1)=a_0=2$',
        () => true)
    ],
    hard: [
      S('若 $y=ax^{3}+px$ 的圖形與 $x$ 軸有三個交點，則 $a$、$p$ 異號', true,
        '$ax^{3}+px=x(ax^{2}+p)$',
        '$ax^{2}+p=0$ 要有兩個不為 0 的實根，需 $-\\frac{p}{a}>0$，即 $a$、$p$ 異號',
        () => true),
      S('$y=2x^{3}+6x^{2}+7x-1$ 的圖形，對稱中心是 $(-1,\\,-4)$', true,
        '$h=-\\frac{b}{3a}$，再求 $f(h)$',
        '$h=-\\frac{6}{6}=-1$，$f(-1)=-2+6-7-1=-4$',
        () => sym(x => 2 * x ** 3 + 6 * x * x + 7 * x - 1, -1, -4)),
      S('把 $y=x^{3}+2x$ 的圖形往右平移 2 單位，得到 $y=(x+2)^{3}+2(x+2)$', false,
        '往右平移 2 單位，要把 $x$ 換成什麼？',
        '往右平移 2 單位：$x$ 換成 $x-2$，得 $y=(x-2)^{3}+2(x-2)$',
        () => false),
      S('$-x^{3}+3x^{2}-x+1=-(x-1)^{3}+2(x-1)+2$', true,
        '把右式展開比較',
        '$-(x^{3}-3x^{2}+3x-1)+2x-2+2=-x^{3}+3x^{2}-x+1$',
        () => xs.every(x => near(-(x ** 3) + 3 * x * x - x + 1, -((x - 1) ** 3) + 2 * (x - 1) + 2))),
      S('$(x+1)(x-1)^{2}(x-4)>0$ 的解為 $x<-1$ 或 $x>4$', true,
        '$(x-1)^{2}$ 在 $x=1$ 兩側都是正的',
        '$x<-1$ 或 $x>4$ 時為正；$-1<x<4$ 時為負或 0',
        () => same(x => (x + 1) * (x - 1) ** 2 * (x - 4) > 0, x => x < -1 || x > 4)),
      S('$(x+1)^{2}(x+2)(x^{2}+x+3)>0$ 的解為 $x>-2$', false,
        '注意 $x=-1$ 時的值',
        '$x=-1$ 時值為 0，不合；解為 $-2<x<-1$ 或 $x>-1$',
        () => same(x => (x + 1) ** 2 * (x + 2) * (x * x + x + 3) > 0, x => x > -2)),
      S('$(x-1)(x-4)(x+3)^{3}<0$ 與 $(x-1)(x-4)(x+3)<0$ 的解相同', true,
        '$(x+3)^{3}$ 和 $x+3$ 的正負號一樣嗎？',
        '$(x+3)^{3}$ 與 $x+3$ 正負號相同（奇次方），所以解相同',
        () => same(x => (x - 1) * (x - 4) * (x + 3) ** 3 < 0, x => (x - 1) * (x - 4) * (x + 3) < 0)),
      S('若對所有實數 $x$，$x^{2}+kx+1>0$ 都成立，則 $-2<k<2$', true,
        '開口向上又恆正：判別式要怎樣？',
        '判別式 $k^{2}-4<0$，得 $-2<k<2$',
        () => [-1.9, 0, 1.9].every(k => xs.every(x => x * x + k * x + 1 > 0)) && !xs.every(x => x * x + 2 * x + 1 > 0)),
      S('$-x^{2}+2x-3<0$ 對所有實數 $x$ 都成立', true,
        '配方看看',
        '$-x^{2}+2x-3=-(x-1)^{2}-2<0$',
        () => xs.every(x => -x * x + 2 * x - 3 < 0)),
      S('若 $x^{2}+bx+c<0$ 的解為 $-1<x<3$，則 $b=-2$', true,
        '$-1$ 和 $3$ 是 $x^{2}+bx+c=0$ 的兩根',
        '$(x+1)(x-3)=x^{2}-2x-3$，所以 $b=-2$、$c=-3$',
        () => same(x => x * x - 2 * x - 3 < 0, x => x > -1 && x < 3)),
      S('$(x-2)^{2}(x+3)(-x^{2}+x-1)\\ge0$ 的解為 $x\\ge-3$', false,
        '先同乘 $-1$ 讓最高次項係數為正，不等號要變向',
        '化為 $(x-2)^{2}(x+3)(x^{2}-x+1)\\le0$，解為 $x\\le-3$ 或 $x=2$',
        () => same(x => (x - 2) ** 2 * (x + 3) * (-x * x + x - 1) >= 0, x => x >= -3)),
      S('若 $f(x)=x^{3}+ax+b$ 有因式 $x^{2}-2x+5$，則 $f(x)=(x+2)(x^{2}-2x+5)$', true,
        '設 $f(x)=(x^{2}-2x+5)(x+c)$，比較 $x^{2}$ 項係數',
        '$x^{2}$ 項係數 $c-2=0$，得 $c=2$',
        () => xs.every(x => near((x + 2) * (x * x - 2 * x + 5), x ** 3 + x + 10))),
      S('任何三次函數 $y=ax^{3}+bx^{2}+cx+d$ 的圖形，都能由某個 $y=ax^{3}+px$ 的圖形平移得到', true,
        '想想 $a(x-h)^{3}+p(x-h)+k$',
        '取 $h=-\\frac{b}{3a}$，必可寫成 $a(x-h)^{3}+p(x-h)+k$',
        () => true)
    ]
  };
  const COUNT = { easy: 3, normal: 3, hard: 4 };

  const recent = [];
  function build(diff) {
    const pool = BANK[diff], n = COUNT[diff];
    let pick = null;
    for (let t = 0; t < 80 && !pick; t++) {
      const fresh = t < 50 ? pool.filter(s => !recent.includes(s.tex)) : pool;
      const c = U.shuffle(fresh.length >= n ? fresh : pool).slice(0, n);
      if (c.some(s => s.truth) && c.some(s => !s.truth)) pick = c;   // 一定同時有 ○ 和 ✗
    }
    pick.forEach(s => recent.push(s.tex));
    while (recent.length > 8) recent.shift();
    return { key: pick.map(s => s.tex).join('|'), list: pick, diff };
  }

  const mark = t => (t ? '○' : '✗');

  class L4 extends LG.LevelBase {
    static pick(diff) { return build(diff); }

    constructor(zone, q, scr) {
      super(zone, q, scr);
      this.celebrateTime = 2.3;
      this.i = 0;
      this.setQuestion(U.rich('判斷每一句敘述是否成立：成立往右滑（或按 ○），不成立往左滑（或按 ✗）') +
        `<span class="ct-prog">第 <b>1</b>／${q.list.length} 句</span>`);
      const m = scr.main;
      m.classList.add('l6c');
      m.innerHTML = `
        <div class="ct-stage">
          <div class="ct-stack"></div>
          <div class="ct-list"></div>
        </div>
        <div class="ct-btns"><div class="btn ct-no">✗ 不成立</div><div class="btn ct-yes">○ 成立</div></div>`;
      this.stack = m.querySelector('.ct-stack');
      this.listEl = m.querySelector('.ct-list');
      this.cards = q.list.map((s, k) => {
        const el = U.el('div', 'ct-card', `<div class="ct-no-mark">✗</div><div class="ct-yes-mark">○</div><div class="ct-num">${k + 1}</div><div class="ct-tx">${U.rich(s.tex)}</div>`);
        el.style.zIndex = String(10 - k);
        this.stack.appendChild(el);
        return el;
      });
      this.btnNo = m.querySelector('.ct-no');
      this.btnYes = m.querySelector('.ct-yes');
      LG.input.onTap(this.btnNo, () => this.judge(false), { sound: false, enabled: () => this.playing && !this.busy });
      LG.input.onTap(this.btnYes, () => this.judge(true), { sound: false, enabled: () => this.playing && !this.busy });
      this.dx = 0;
      LG.input.onDrag(this.stack, {
        down: (e, p) => { if (!(this.playing && !this.busy && this.i < this.cards.length)) return false; this.x0 = p.x; },
        start: () => { this.cur().classList.add('drag'); },
        move: (e, p) => { this.dx = p.x - this.x0; this.paintDrag(); },
        up: (e, p, started) => this.release(started),
        cancel: () => this.release(false)
      }, { threshold: true });
      this.setGoLabel('左滑 ✗ 不成立　右滑 ○ 成立');
      this.restack();
    }

    cur() { return this.cards[this.i]; }

    hintHTML() {
      const k = Math.min(this.i, this.q.list.length - 1), s = this.q.list[k];
      return U.rich(`第 ${k + 1} 句：${s.hint}`);
    }

    answerHTML() {
      const k = Math.min(this.i, this.q.list.length - 1), s = this.q.list[k];
      return U.rich(`第 ${k + 1} 句 ${s.truth ? '○ 成立' : '✗ 不成立'}：${s.why}`);
    }

    layout() { this.cards.forEach(c => U.fit(c.querySelector('.ct-tx'), 0.5)); }

    restack() {
      this.cards.forEach((c, k) => {
        const d = k - this.i;
        if (d < 0) return;
        c.style.transform = `translate(${d * 1.6}%, ${d * 5}%) scale(${1 - d * 0.04})`;
        c.style.opacity = d > 2 ? '0' : String(1 - d * 0.25);
        c.classList.toggle('top', d === 0);
      });
    }

    paintDrag() {
      const c = this.cur();
      if (!c) return;
      const w = this.stack.clientWidth || 1, k = U.clamp(this.dx / (w * 0.3), -1, 1);
      c.style.transform = `translate(${this.dx}px, 0) rotate(${k * 9}deg)`;
      c.querySelector('.ct-yes-mark').style.opacity = String(Math.max(0, k));
      c.querySelector('.ct-no-mark').style.opacity = String(Math.max(0, -k));
    }

    release(started) {
      const c = this.cur();
      const w = this.stack.clientWidth || 1;
      const dx = this.dx;
      this.dx = 0; this.x0 = null;
      if (!c) return;
      c.classList.remove('drag');
      c.querySelector('.ct-yes-mark').style.opacity = '';
      c.querySelector('.ct-no-mark').style.opacity = '';
      if (started && Math.abs(dx) > w * 0.22 && this.playing) this.judge(dx > 0);
      else this.restack();
    }

    judge(v) {
      if (!this.playing || this.busy || this.i >= this.cards.length) return;
      const s = this.q.list[this.i], c = this.cur();
      if (v === s.truth) {
        LG.audio.play('select');
        c.classList.add(v ? 'fly-r' : 'fly-l');
        c.style.transform = '';
        this.i++;
        const prog = this.scr.q.querySelector('.ct-prog b');
        if (prog) prog.textContent = String(Math.min(this.i + 1, this.cards.length));
        if (this.i >= this.cards.length) { this.submit(true); return; }
        this.busy = true;
        setTimeout(() => {
          this.busy = false;
          this.restack();
          if (this.zone.helpUsed && this.zone.state === 'playing') this.zone.showHint();   // 求救卡用過：提示跟著換到下一句
        }, 260);
        return;
      }
      const r = this.submit(false);
      if (r === 'retry') {
        c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
        this.restack();
      }
    }

    showList(kind) {
      this.stack.style.display = 'none';
      this.listEl.style.display = 'flex';
      this.listEl.innerHTML = this.q.list.map((s, k) => {
        const cls = k < this.i ? 'done' : (kind === 'ok' ? 'done' : 'ans');
        return `<div class="ct-row ${cls} ${s.truth ? 'yes' : 'no'}"><span class="mk">${mark(s.truth)}</span><span class="tx">${U.rich(s.tex)}</span></div>`;
      }).join('');
      this.listEl.querySelectorAll('.ct-row .tx').forEach(t => U.fit(t, 0.45, true, true));
    }

    celebrate() {
      this.i = this.cards.length;
      setTimeout(() => this.showList('ok'), 300);
      const p = this.zone.fx.rel(this.stack);
      this.zone.fx.confetti(p.x, p.y, { n: 36 });
    }

    reveal() { this.showList('answer'); }
  }

  L4.meta = { id: 4, name: '觀念法庭', part: 'graph', topic: '圖形與不等式觀念' };
  L4.BANK = BANK; L4.build = build;
  LG.registerLevel(L4);
})(window.LG);
