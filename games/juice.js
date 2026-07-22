/* juice.js —— 可复用「游戏手感 / 留存」引擎（vanilla，无依赖，离线 file:// 可用）
 * 设计来源（本次迭代调研）：
 *  - Game Juice：屏幕震动(trauma模型) / 粒子爆发 / 浮动文字 / 屏幕闪光 / 合成音效 / hitstop
 *  - 留存/成瘾（合规版）：即时反馈、可变奖励、段位里程碑、最佳分、成就 toast、每日挑战
 * 用法：<script src="juice.js"></script>
 *   循环里： Juice.update(dt); Juice.begin(ctx); ...画世界...; Juice.mid(ctx); Juice.end(ctx);
 *   事件里： Juice.sfx('hit'); Juice.burst(x,y,{color}); Juice.popup(x,y,'+10','#f0b90b');
 *           Juice.addTrauma(.5); Juice.flash('#f00',.4); Juice.achievement('晋升 黄金');
 *           Juice.best('key',score); Juice.rank(score);
 */
(function () {
  const J = {};

  /* ---------- 屏幕震动：trauma 平方衰减，短促有冲击力 ---------- */
  let trauma = 0;
  J.addTrauma = function (a) { trauma = Math.min(1, trauma + (a == null ? 0.3 : a)); };
  J.shake = J.addTrauma;
  J._off = function () {
    if (trauma <= 0) return { x: 0, y: 0, ang: 0 };
    const s = trauma * trauma, t = performance.now() * 0.05;
    return {
      x: (Math.sin(t * 1.3) + Math.sin(t * 2.7)) * 9 * s,
      y: (Math.cos(t * 1.7) + Math.sin(t * 2.1)) * 9 * s,
      ang: Math.sin(t * 1.1) * 0.045 * s
    };
  };

  /* ---------- 粒子 ---------- */
  let parts = [];
  let rings = [];
  let beams = [];
  J.burst = function (x, y, o) {
    o = o || {};
    const n = o.n || 12, color = o.color || '#f0b90b', spd = o.speed || 200,
      life = o.life || 0.65, g = o.g == null ? 220 : o.g, sz = o.size || 0;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = spd * (0.4 + Math.random() * 0.85);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.15, life, max: life,
        color, size: sz || (2 + Math.random() * 3) });
    }
    if (parts.length > 900) parts.splice(0, parts.length - 900);
  };

  /* ---------- 冲击波环（命中/爆发视觉强调，纯视觉、opt-in） ---------- */
  J.ring = function (x, y, o) {
    o = o || {};
    rings.push({
      x, y,
      r0: o.r0 || 8,
      r1: o.r || o.r1 || 64,
      life: o.life || 0.45, max: o.life || 0.45,
      color: o.color || '#f0b90b',
      width: o.width || 3
    });
  };

  /* ---------- 射线 / 光束（激光/闪电/连线攻击，纯视觉、opt-in） ---------- */
  J.beam = function (x1, y1, x2, y2, o) {
    o = o || {};
    beams.push({
      x1, y1, x2, y2,
      life: o.life || 0.3, max: o.life || 0.3,
      color: o.color || '#f0b90b',
      width: o.width || 3
    });
  };

  /* ---------- 庆祝纸屑（独立 DOM 叠层，不依赖游戏渲染循环，opt-in） ---------- */
  let confCv = null, confCtx = null, confParts = [], confRAF = 0, confLast = 0;
  function confEnsure() {
    if (confCv) return;
    confCv = document.createElement('canvas');
    confCv.id = 'juice-confetti';
    confCv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998';
    document.body.appendChild(confCv);
    confCtx = confCv.getContext('2d');
    const resize = function () {
      const dpr = window.devicePixelRatio || 1;
      confCv.width = window.innerWidth * dpr; confCv.height = window.innerHeight * dpr;
      confCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener('resize', resize);
  }
  function confTick(ts) {
    if (!confLast) confLast = ts;
    const dt = Math.min(0.05, (ts - confLast) / 1000); confLast = ts;
    const ctx = confCtx, W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);
    for (let i = confParts.length - 1; i >= 0; i--) {
      const p = confParts[i]; p.life -= dt;
      if (p.life <= 0) { confParts.splice(i, 1); continue; }
      p.vy += 360 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life / p.fade);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (confParts.length) confRAF = requestAnimationFrame(confTick);
    else { confRAF = 0; confLast = 0; ctx.clearRect(0, 0, W, H); }
  }
  J.confetti = function (x, y, o) {
    o = o || {}; confEnsure();
    const n = o.n || 80,
      colors = o.colors || ['#f6465d', '#02c076', '#f0b90b', '#3b82f6', '#a855f7', '#ffffff'],
      spread = o.spread || 340, life = o.life || 2.0, up = o.up == null ? 300 : o.up;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = spread * (0.25 + Math.random());
      confParts.push({
        x, y,
        vx: Math.cos(a) * v * 0.7, vy: Math.sin(a) * v - up * (0.3 + Math.random() * 0.7),
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 12,
        w: 5 + Math.random() * 5, h: 7 + Math.random() * 7,
        life: life * (0.7 + Math.random() * 0.3), fade: life,
        color: colors[(Math.random() * colors.length) | 0]
      });
    }
    if (confParts.length > 1500) confParts.splice(0, confParts.length - 1500);
    if (!confRAF) confRAF = requestAnimationFrame(confTick);
  };

  /* ---------- 浮动文字（伤害/得分/提示） ---------- */
  let pops = [];
  J.popup = function (x, y, text, color, o) {
    o = o || {};
    pops.push({ x, y, text, color: color || '#fff', life: o.life || 0.9, max: o.life || 0.9,
      vy: o.vy == null ? -60 : o.vy, size: o.size || 18, big: o.big });
  };

  /* ---------- 屏幕闪光 ---------- */
  let flash = { a: 0, color: '#fff' };
  J.flash = function (color, a) { flash.color = color || '#fff'; flash.a = Math.max(flash.a, a == null ? 0.5 : a); };

  /* ---------- 更新 + 绘制 ---------- */
  J.update = function (dt) {
    if (trauma > 0) { trauma -= dt * 1.8; if (trauma < 0) trauma = 0; }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.98;
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]; r.life -= dt; if (r.life <= 0) { rings.splice(i, 1); continue; }
    }
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i]; b.life -= dt; if (b.life <= 0) { beams.splice(i, 1); continue; }
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.life -= dt; if (p.life <= 0) { pops.splice(i, 1); continue; }
      p.y += p.vy * dt; p.vy *= 0.96;
    }
    if (flash.a > 0) { flash.a -= dt * 2.2; if (flash.a < 0) flash.a = 0; }
  };
  J.begin = function (ctx) { ctx.save(); const o = J._off(); ctx.translate(o.x, o.y); ctx.rotate(o.ang); };
  J.mid = function (ctx) {
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
    }
    for (const r of rings) {
      const k = 1 - r.life / r.max;
      const rad = r.r0 + (r.r1 - r.r0) * k;
      ctx.globalAlpha = Math.max(0, r.life / r.max);
      ctx.strokeStyle = r.color; ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, 7); ctx.stroke();
    }
    for (const b of beams) {
      ctx.globalAlpha = Math.max(0, b.life / b.max);
      ctx.strokeStyle = b.color; ctx.lineWidth = b.width * (0.4 + 0.6 * (b.life / b.max));
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of pops) {
      ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color;
      ctx.font = 'bold ' + p.size + (p.big ? 'px sans-serif' : 'px monospace');
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  };
  J.end = function (ctx) {
    ctx.restore();
    if (flash.a > 0) { ctx.save(); ctx.globalAlpha = flash.a * 0.5; ctx.fillStyle = flash.color;
      ctx.fillRect(0, 0, 1e4, 1e4); ctx.restore(); }
  };

  /* ---------- 音效：WebAudio 合成，无外部文件 ---------- */
  let AC = null, muted = false;
  function ac() {
    if (muted) return null;
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  J.setMuted = function (m) { muted = m; };
  J.toggleMute = function () { muted = !muted; return muted; };
  function tone(freq, dur, type, vol, slideTo) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.value = vol || 0.15; g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  function noise(dur, vol) {
    const c = ac(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = buf; const g = c.createGain(); g.gain.value = vol || 0.2;
    s.connect(g); g.connect(c.destination); s.start();
  }
  J.sfx = function (name) {
    switch (name) {
      case 'shoot': tone(660, 0.07, 'square', 0.04, 880); break;
      case 'hit': tone(220, 0.1, 'sawtooth', 0.1, 120); break;
      case 'boom': noise(0.25, 0.22); tone(90, 0.25, 'sawtooth', 0.12, 40); break;
      case 'pickup': tone(880, 0.08, 'sine', 0.1, 1320); break;
      case 'levelup': tone(523, 0.1, 'sine', 0.1); setTimeout(() => tone(784, 0.12, 'sine', 0.1), 90);
        setTimeout(() => tone(1046, 0.14, 'sine', 0.1), 190); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.12), i * 120)); break;
      case 'lose': [440, 330, 247].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'sawtooth', 0.12, f * 0.8), i * 150)); break;
      case 'click': tone(440, 0.04, 'square', 0.05); break;
      case 'combo': tone(1046, 0.06, 'square', 0.07, 1568); break;
      case 'error': tone(180, 0.18, 'sawtooth', 0.1, 90); break;
    }
  };

  /* ---------- 本地存储（file:// 下 try 包裹） ---------- */
  J.save = function (k, v) { try { localStorage.setItem('wb_' + k, JSON.stringify(v)); } catch (e) {} };
  J.load = function (k, d) { try { const s = localStorage.getItem('wb_' + k); return s == null ? d : JSON.parse(s); } catch (e) { return d; } };
  J.best = function (k, v) {
    const b = J.load('best_' + k, 0);
    if (v > b) { J.save('best_' + k, v); return { isNew: true, value: v }; }
    return { isNew: false, value: b };
  };

  /* ---------- 成就 toast（DOM，自动消失） ---------- */
  let toastBox = null;
  J.achievement = function (text) {
    if (!toastBox) {
      toastBox = document.createElement('div'); toastBox.id = 'juice-toast'; document.body.appendChild(toastBox);
    }
    const el = document.createElement('div'); el.className = 'juice-ach'; el.innerHTML = text;
    toastBox.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => el.classList.add('hide'), 2600);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 3200);
  };
  const css = document.createElement('style');
  css.textContent = '#juice-toast{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:9999;' +
    'display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}' +
    '.juice-ach{background:linear-gradient(135deg,#1b2430,#0e1620);border:1px solid #f0b90b;color:#f0b90b;' +
    'padding:10px 18px;border-radius:8px;font:bold 14px/1.4 monospace;box-shadow:0 4px 20px rgba(240,185,11,.3);' +
    'opacity:0;transform:translateY(-12px) scale(.96);transition:all .35s cubic-bezier(.2,1.4,.4,1)}' +
    '.juice-ach.show{opacity:1;transform:translateY(0) scale(1)}' +
    '.juice-ach.hide{opacity:0;transform:translateY(-10px) scale(.98)}';
  document.head.appendChild(css);

  /* ---------- 段位（清晰里程碑，驱动「下一个目标」感） ---------- */
  J.rank = function (score) {
    const t = [[0, '青铜'], [500, '白银'], [1500, '黄金'], [3500, '铂金'], [7000, '钻石'], [12000, '大师'], [20000, '宗师']];
    let r = '青铜'; for (const s of t) if (score >= s[0]) r = s[1]; return r;
  };

  window.Juice = J;
})();
