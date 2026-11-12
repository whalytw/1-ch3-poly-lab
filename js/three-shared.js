/* 多項式實驗室 — 3D（第 8 關「多項式雲霄飛車」場景）
   三區共用同一個 WebGL 渲染器：輪流把各區的場景畫好，再複製到該區自己的 canvas，
   避免三區同時進到第 8 關時開三個 3D 引擎拖慢筆電。
   若電腦不支援 WebGL，自動改用 2D 版雲霄飛車動畫。 */
'use strict';
(function (LG) {
  const U = LG.util;

  const Shared3D = {
    renderer: null,
    failed: false,
    views: new Set(),
    init() {
      if (this.renderer) return true;
      if (this.failed || !window.THREE) return false;
      try {
        const canvas = document.createElement('canvas');
        canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; });
        canvas.addEventListener('webglcontextrestored', () => { this.lost = false; });
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.size = { w: 0, h: 0 };
      } catch (e) {
        console.warn('WebGL 無法使用，改用 2D 雲霄飛車動畫', e);
        this.failed = true;
        this.renderer = null;
      }
      return !!this.renderer;
    },
    add(v) { this.views.add(v); },
    remove(v) { this.views.delete(v); },
    render() {
      if (!this.renderer || this.lost || !this.views.size) return;
      let mw = 0, mh = 0;
      for (const v of this.views) { mw = Math.max(mw, v.w); mh = Math.max(mh, v.h); }
      if (mw < 2 || mh < 2) return;
      const r = this.renderer;
      if (this.size.w < mw || this.size.h < mh) {
        this.size = { w: Math.max(mw, this.size.w), h: Math.max(mh, this.size.h) };
        r.setSize(this.size.w, this.size.h, false);
      }
      const H = this.size.h;
      r.setScissorTest(true);
      for (const v of this.views) {
        if (v.w < 2 || v.h < 2) continue;
        r.setViewport(0, 0, v.w, v.h);
        r.setScissor(0, 0, v.w, v.h);
        r.render(v.scene, v.camera);
        try { v.ctx.drawImage(r.domElement, 0, H - v.h, v.w, v.h, 0, 0, v.w, v.h); } catch (e) { /* ignore */ }
      }
      r.setScissorTest(false);
    }
  };

  /* ---------- 3D 骨牌場景 ---------- */
  function makeGround() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#0d2747'; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = 'rgba(130, 190, 255, 0.16)'; x.lineWidth = 2;
    for (let i = 64; i < 256; i += 64) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.moveTo(0, i); x.lineTo(256, i); x.stroke();
    }
    x.strokeStyle = 'rgba(130, 190, 255, 0.45)'; x.lineWidth = 4;
    x.strokeRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(36, 36);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(144, 144), new THREE.MeshBasicMaterial({ map: tex }));
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  function makeStars() {
    const n = 420, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = U.rand(0.08, 1.2), r = 70;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      pos[i * 3 + 1] = Math.sin(e) * r;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdbe8ff, size: 0.42, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.85 }));
  }

  function makeFireworks() {
    const N = 420;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos[i * 3 + 1] = -999;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 0.34, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    const P = [];
    for (let i = 0; i < N; i++) P.push({ alive: false, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, r: 1, g: 1, b: 1 });
    return { points, geo, pos, col, P, next: 0, N };
  }

  /* ---------- 雲霄飛車軌道 ----------
     中段（x = −4 ～ 5）就是三次函數 y = −0.06x³ + 1.2x + 4.2 的圖形：
     左邊高台出發 → 衝下谷底 → 爬上山頂 → 再衝下來 → 右邊平地進站。 */
  const cubicY = x => -0.06 * x * x * x + 1.2 * x + 4.2;
  const CTRL = [[-9.4, 8.4], [-8.2, 8.4], [-7.1, 8.15], [-6.1, 7.0], [-5.0, 5.0]];
  for (let x = -4; x <= 5; x++) CTRL.push([x, cubicY(x)]);
  CTRL.push([6.0, 1.25], [7.0, 0.95], [8.4, 0.95], [9.8, 0.95], [11, 0.95]);

  /* Catmull-Rom 取樣，並建立弧長表 */
  function buildPath(n) {
    const P = CTRL, pts = [];
    const seg = P.length - 1;
    for (let i = 0; i <= n; i++) {
      const u = i / n * seg, k = Math.min(seg - 1, Math.floor(u)), t = u - k;
      const p0 = P[Math.max(0, k - 1)], p1 = P[k], p2 = P[k + 1], p3 = P[Math.min(P.length - 1, k + 2)];
      const t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
    const len = [0];
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = len[len.length - 1];
    /* 沿軌道距離 s → 位置、切線角度 */
    const at = s => {
      s = U.clamp(s, 0, L);
      let lo = 0, hi = len.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] <= s) lo = m; else hi = m; }
      const t = (s - len[lo]) / Math.max(1e-9, len[hi] - len[lo]);
      const a = pts[lo], b = pts[hi];
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    };
    /* x → 軌道高度 */
    const yAt = x => {
      for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) {
        const a = pts[i - 1], b = pts[i], t = (x - a[0]) / Math.max(1e-9, b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
      return pts[pts.length - 1][1];
    };
    return { pts, len, L, at, yAt };
  }

  /* 沿平面曲線做一條圓管（軌道的鐵軌），z 為鐵軌所在的深度 */
  function railGeometry(pts, z, r, radial) {
    const pos = [], idx = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const nx = -ty, ny = tx;
      for (let j = 0; j < radial; j++) {
        const th = j / radial * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
        pos.push(pts[i][0] + r * c * nx, pts[i][1] + r * c * ny, z + r * s);
      }
    }
    for (let i = 0; i < pts.length - 1; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * radial + j, b = i * radial + (j + 1) % radial, c = (i + 1) * radial + j, d = (i + 1) * radial + (j + 1) % radial;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  const RIDE_V0 = 2.6, RIDE_G = 9, CAR_GAP = 1.15;

  class CoasterScene {
    constructor() {
      const T = THREE;
      this.scene = new T.Scene();
      this.scene.background = new T.Color(0x0a1a33);
      this.scene.fog = new T.Fog(0x0a1a33, 18, 60);
      this.camera = new T.PerspectiveCamera(50, 2, 0.1, 200);
      this.scene.add(new T.HemisphereLight(0xd2e4ff, 0x1a2440, 1.3));
      const sun = new T.DirectionalLight(0xffffff, 1.5);
      sun.position.set(-5, 12, 9);
      this.scene.add(sun);
      this.scene.add(makeGround());
      this.scene.add(makeStars());

      const path = this.path = buildPath(520);
      const railMat = new T.MeshLambertMaterial({ color: 0xff8f73, emissive: 0x3a1208 });
      [-0.34, 0.34].forEach(z => this.scene.add(new T.Mesh(railGeometry(path.pts, z, 0.07, 8), railMat)));
      // 枕木
      const tieGeo = new T.BoxGeometry(0.1, 0.07, 0.86), tieMat = new T.MeshLambertMaterial({ color: 0x5b6b80 });
      for (let s = 0.2; s < path.L; s += 0.42) {
        const p = path.at(s), m = new T.Mesh(tieGeo, tieMat);
        m.position.set(p.x, p.y - 0.06, 0); m.rotation.z = p.ang;
        this.scene.add(m);
      }
      // 支柱
      const colMat = new T.MeshLambertMaterial({ color: 0x8aa0b8 }), beamGeo = new T.BoxGeometry(0.12, 0.12, 0.95);
      for (let x = -9; x <= 10.6; x += 1.15) {
        const y = path.yAt(x) - 0.12;
        if (y < 0.3) continue;
        [-0.4, 0.4].forEach(z => {
          const c = new T.Mesh(new T.CylinderGeometry(0.055, 0.075, y, 6), colMat);
          c.position.set(x, y / 2, z);
          this.scene.add(c);
        });
        const b = new T.Mesh(beamGeo, colMat); b.position.set(x, y, 0); this.scene.add(b);
      }
      // 起點高台與終點站
      const deck = new T.MeshLambertMaterial({ color: 0x23466e });
      const st = new T.Mesh(new T.BoxGeometry(1.6, 0.18, 1.6), deck); st.position.set(-8.7, 8.15, 0); this.scene.add(st);
      const gate = new T.Group();
      const gm = new T.MeshLambertMaterial({ color: 0x4fe0b0, emissive: 0x0d3a2d });
      [-0.75, 0.75].forEach(z => { const c = new T.Mesh(new T.BoxGeometry(0.16, 2.3, 0.16), gm); c.position.set(0, 1.15, z); gate.add(c); });
      const top = new T.Mesh(new T.BoxGeometry(0.2, 0.3, 1.8), gm); top.position.set(0, 2.35, 0); gate.add(top);
      gate.position.set(9.0, 0.8, 0);
      this.gateMat = gm;
      this.scene.add(gate);

      // 兩節車廂
      this.cars = [0, 1].map(i => {
        const g = new T.Group();
        const body = new T.Mesh(new T.BoxGeometry(0.98, 0.42, 0.78), new T.MeshLambertMaterial({ color: i ? 0xffd34d : 0xffb547 }));
        body.position.y = 0.36; g.add(body);
        const seat = new T.Mesh(new T.BoxGeometry(0.34, 0.3, 0.7), new T.MeshLambertMaterial({ color: 0x14243a }));
        seat.position.set(-0.22, 0.6, 0); g.add(seat);
        const wg = new T.CylinderGeometry(0.11, 0.11, 0.12, 10); wg.rotateX(Math.PI / 2);
        const wm = new T.MeshLambertMaterial({ color: 0x1b2633 });
        [[-0.3, 0.38], [0.3, 0.38], [-0.3, -0.38], [0.3, -0.38]].forEach(([x, z]) => { const w = new T.Mesh(wg, wm); w.position.set(x, 0.12, z); g.add(w); });
        if (!i) {
          const lamp = new T.Mesh(new T.SphereGeometry(0.09, 10, 8), new T.MeshBasicMaterial({ color: 0xfff3b0 }));
          lamp.position.set(0.5, 0.42, 0); g.add(lamp);
        }
        this.scene.add(g);
        return g;
      });

      this.fw = makeFireworks();
      this.scene.add(this.fw.points);

      this.s0 = 0.9 + CAR_GAP;          // 車頭起點（沿軌道距離）
      this.s = this.s0;
      this.v = 0;
      this.mode = 'idle';
      this.t = 0;
      this.clock = 0;
      this.look = new T.Vector3(0.4, 4.3, 0);
      this.camBase = new T.Vector3(1.6, 5.4, 14.2);
      this.placeCars();
      this.placeCamera(0);
    }

    resize(w, h) {
      this.camera.aspect = w / Math.max(1, h);
      // 窄螢幕時鏡頭拉遠，整條軌道都看得到
      this.fit = U.clamp(2.25 / this.camera.aspect, 0.9, 1.8);
      this.camera.updateProjectionMatrix();
    }

    placeCars(wob) {
      this.cars.forEach((c, i) => {
        const p = this.path.at(this.s - i * CAR_GAP + (wob || 0));
        c.position.set(p.x, p.y, 0);
        c.rotation.z = p.ang;
      });
    }

    placeCamera(follow) {
      const f = this.fit || 1;
      const head = this.cars[0].position;
      const lx = U.lerp(0.4, head.x, follow * 0.4), ly = U.lerp(4.3, head.y, follow * 0.25);
      this.look.set(lx, ly, 0);
      const bob = Math.sin(this.clock * 0.7) * 0.06;
      this.camera.position.set(this.camBase.x + (lx - 0.4) * 0.6, this.camBase.y * (0.85 + 0.15 * f) + bob, this.camBase.z * f);
      this.camera.lookAt(this.look);
    }

    ride() { if (this.mode !== 'ride' && this.mode !== 'done') { this.mode = 'ride'; this.t = 0; this.v = RIDE_V0; this.bursts = 0; } }
    topple() { this.ride(); }
    wobble() { if (this.mode === 'idle' || this.mode === 'wobble') { this.mode = 'wobble'; this.t = 0; } }
    fail() {}

    burst(center, color) {
      const f = this.fw, c = new THREE.Color(color);
      const n = LG.settings.data.fx === 'lite' ? 70 : 130;
      for (let k = 0; k < n; k++) {
        const p = f.P[f.next]; f.next = (f.next + 1) % f.N;
        const a = Math.random() * Math.PI * 2, z = U.rand(-1, 1), r = Math.sqrt(1 - z * z), v = U.rand(2.4, 5.4);
        p.alive = true; p.life = 0; p.max = U.rand(1.0, 1.7);
        p.x = center.x; p.y = center.y; p.z = center.z;
        p.vx = Math.cos(a) * r * v; p.vy = z * v + 1.2; p.vz = Math.sin(a) * r * v;
        const tint = U.rand(0.75, 1.15);
        p.r = Math.min(1, c.r * tint + 0.15); p.g = Math.min(1, c.g * tint + 0.15); p.b = Math.min(1, c.b * tint + 0.15);
      }
    }

    update(dt) {
      this.clock += dt;
      this.t += dt;
      const path = this.path;
      if (this.mode === 'ride') {
        // 能量守恆：v² = v0² + 2g(起點高度 − 目前高度)
        const yStart = path.at(this.s0).y;
        const steps = 4;
        for (let k = 0; k < steps; k++) {
          const p = path.at(this.s);
          this.v = Math.max(RIDE_V0, Math.sqrt(RIDE_V0 * RIDE_V0 + 2 * RIDE_G * Math.max(0, yStart - p.y)));
          if (p.x > 7.2) this.v = Math.max(1.4, this.v * (1 - 1.8 * dt / steps));   // 進站煞車
          this.s += this.v * dt / steps;
        }
        const end = path.L - 1.6;
        if (Math.floor(this.t * 5) !== Math.floor((this.t - dt) * 5)) LG.audio.play('clack');
        if (this.s >= end) { this.s = end; this.mode = 'done'; this.t = 0; this.bursts = 0; }
        this.placeCars();
        this.placeCamera(1);
      } else if (this.mode === 'done') {
        const times = [0.05, 0.4, 0.8], cols = [0xffd36b, 0x4fe0b0, 0xff8f73];
        while (this.bursts < 3 && this.t >= times[this.bursts]) {
          const c = new THREE.Vector3(9 + U.rand(-1.6, 1.6), 5.4 + U.rand(-0.8, 1.2), U.rand(-1, 1));
          this.burst(c, cols[this.bursts]);
          LG.audio.play('firework');
          this.bursts++;
        }
        const glow = 0.5 + 0.5 * Math.sin(this.t * 12);
        this.gateMat.emissive.setRGB(0.05 + 0.3 * glow, 0.23 + 0.45 * glow, 0.18 + 0.3 * glow);
        this.placeCamera(1);
      } else if (this.mode === 'wobble') {
        const a = this.t < 1.3 ? 0.32 * Math.sin(this.t * 12) * Math.exp(-this.t * 3) : 0;
        this.placeCars(a);
        if (this.t >= 1.3) { this.mode = 'idle'; this.placeCars(); }
        this.placeCamera(0);
      } else {
        this.placeCars(Math.sin(this.clock * 3) * 0.02);
        this.placeCamera(0);
      }
      // 煙火粒子
      const f = this.fw;
      let any = false;
      for (let i = 0; i < f.N; i++) {
        const p = f.P[i];
        if (!p.alive) continue;
        any = true;
        p.life += dt;
        if (p.life >= p.max) { p.alive = false; f.pos[i * 3 + 1] = -999; f.col[i * 3] = f.col[i * 3 + 1] = f.col[i * 3 + 2] = 0; continue; }
        const damp = Math.exp(-1.1 * dt);
        p.vx *= damp; p.vz *= damp; p.vy = p.vy * damp - 3.2 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const k = 1 - p.life / p.max;
        f.pos[i * 3] = p.x; f.pos[i * 3 + 1] = p.y; f.pos[i * 3 + 2] = p.z;
        f.col[i * 3] = p.r * k; f.col[i * 3 + 1] = p.g * k; f.col[i * 3 + 2] = p.b * k;
      }
      if (any || this.fwWas) {
        f.geo.attributes.position.needsUpdate = true;
        f.geo.attributes.color.needsUpdate = true;
      }
      this.fwWas = any;
    }

    dispose() {
      this.scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
        }
      });
    }
  }

  /* ---------- 2D 備援版（無 WebGL 時） ---------- */
  class Coaster2D {
    constructor(ctx) {
      this.ctx = ctx; this.path = buildPath(320);
      this.mode = 'idle'; this.t = 0; this.clock = 0; this.w = 2; this.h = 2;
      this.s0 = 0.9 + CAR_GAP; this.s = this.s0; this.v = 0; this.parts = []; this.wob = 0;
    }
    resize(w, h) { this.w = w; this.h = h; }
    ride() { if (this.mode === 'idle' || this.mode === 'wobble') { this.mode = 'ride'; this.t = 0; } }
    topple() { this.ride(); }
    wobble() { if (this.mode === 'idle') { this.mode = 'wobble'; this.t = 0; } }
    fail() {}
    update(dt) {
      this.t += dt; this.clock += dt;
      const path = this.path;
      if (this.mode === 'ride') {
        const yStart = path.at(this.s0).y, p = path.at(this.s);
        this.v = Math.sqrt(RIDE_V0 * RIDE_V0 + 2 * RIDE_G * Math.max(0, yStart - p.y));
        if (p.x > 7.2) this.v = Math.max(1.4, this.v * 0.6);
        this.s += this.v * dt;
        if (Math.floor(this.t * 5) !== Math.floor((this.t - dt) * 5)) LG.audio.play('clack');
        if (this.s >= path.L - 1.6) {
          this.s = path.L - 1.6; this.mode = 'done'; LG.audio.play('firework');
          for (let k = 0; k < 90; k++) {
            const a = U.rand(0, 6.28), v = U.rand(40, 200);
            this.parts.push({ x: this.w * 0.86, y: this.h * 0.25, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: U.rand(0.8, 1.4), c: U.pick(['#ffd36b', '#4fe0b0', '#ff8f73']) });
          }
        }
      } else if (this.mode === 'wobble') {
        this.wob = this.t < 1.2 ? 0.3 * Math.sin(this.t * 12) * Math.exp(-this.t * 3) : 0;
        if (this.t >= 1.2) { this.mode = 'idle'; this.wob = 0; }
      }
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i]; p.life += dt;
        if (p.life > p.max) { this.parts.splice(i, 1); continue; }
        p.vy += 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }
    render() {
      const g = this.ctx, W = this.w, H = this.h, path = this.path;
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#081a33'); sky.addColorStop(1, '#14335c');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      const k = Math.min(W / 21.5, H / 10.5), ox = W / 2 - 0.8 * k, gy = H * 0.93;
      const X = x => ox + x * k, Y = y => gy - y * k;
      g.fillStyle = '#0d2747'; g.fillRect(0, gy, W, H - gy);
      g.strokeStyle = '#8aa0b8'; g.lineWidth = Math.max(1, k * 0.06);
      for (let x = -9; x <= 10.6; x += 1.15) { const y = path.yAt(x); g.beginPath(); g.moveTo(X(x), gy); g.lineTo(X(x), Y(y)); g.stroke(); }
      g.strokeStyle = '#ff8f73'; g.lineWidth = Math.max(2, k * 0.14); g.lineJoin = 'round';
      g.beginPath(); path.pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.stroke();
      [0, 1].forEach(i => {
        const p = path.at(this.s - i * CAR_GAP + this.wob);
        g.save(); g.translate(X(p.x), Y(p.y)); g.rotate(-p.ang);
        g.fillStyle = i ? '#ffd34d' : '#ffb547'; g.fillRect(-0.48 * k, -0.62 * k, 0.96 * k, 0.5 * k);
        g.restore();
      });
      g.globalCompositeOperation = 'lighter';
      for (const p of this.parts) { g.globalAlpha = 1 - p.life / p.max; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 3, 0, 6.28); g.fill(); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    dispose() {}
  }

  LG.Shared3D = Shared3D;
  LG.CoasterScene = CoasterScene;
  LG.Coaster2D = Coaster2D;
  LG.coasterPath = buildPath;
})(window.LG);
