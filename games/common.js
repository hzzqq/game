/* games/common.js — 共享核心（vanilla，无依赖，file:// 离线可用）
 *
 * 这是「锐评」后落地的去重核心。此前 166 个游戏各自内联了一份终端主题
 * CSS、各自的 requestAnimationFrame 循环、各自的 mulberry32、各自的难度条
 * （41 份难度 UI、66 份 rAF 循环、31 份 PRNG 定义）。本文件把它们收敛为
 * 一份，新游戏 / 重构旧游戏时直接 <script src="common.js"></script> 调用，
 * 不要再复制粘贴。
 *
 * 用法：
 *   <script src="common.js"></script>
 *   Common.injectTheme();                 // 注入一次终端主题（幂等）
 *   var rnd = Common.mulberry32(12345);  // 局部 PRNG，替代 Math.random 进逻辑
 *   Common.Loop(function(dt){ ... });     // 统一 rAF 循环
 *   var bar = Common.buildDiffBar(el, function(d){ ... }); // 四档难度条
 *   Common.confetti(ctx, x, y);           // 轻量彩带（juice 缺省时的兜底）
 *
 * 几何/碰撞/数值 toolkit（替代各游戏手写副本，纯函数、node 可测）：
 *   Common.dist(x1,y1,x2,y2) / Common.dist2(...)     // 欧氏/平方距离
 *   Common.hitAABB(a,b) / Common.hitCircle(c1,c2)   // 矩形/圆形重叠
 *   Common.pointInRect(px,py,r) / Common.angle(...)  // 点在矩形内 / 夹角
 *   Common.roundRect(ctx,x,y,w,h,r)                 // 圆角矩形路径
 *   Common.clamp01(v) / Common.invLerp(a,b,v)       // 数值便捷
 *   Common.fmtTime(sec) / Common.fmtNum(n)          // 时间/千分位格式化
 *   Common.text(ctx,str,x,y,opt) / Common.panel(...) // 统一文本/面板绘制
 *   Common.sign/mod/randInt/choices/approach/lerpAngle
 *   Common.Storage / Common.fitCanvas / Common.pick / Common.chance
 *   Common.Sound(懒AudioContext) / Common.Input(键盘) / Common.Timer / Common.State
 *   Common.seq/sum/avg(数组) / Common.wrap(环形坐标) / Common.lerpColor/rgba(颜色)
 *   Common.easing(outCubic/inOutQuad/inOutCubic) / Common.circle(ctx,x,y,r)
 */
(function (global) {
  'use strict';
  var Common = {};

  /* ---------- 终端主题：注入一次，全局生效（幂等） ----------
   * 让游戏不再各自内联一份 166 行的暗色主题。需要额外样式时再在游戏内叠加。 */
  var THEME_ID = 'common-theme';
  Common.injectTheme = function () {
    if (document.getElementById(THEME_ID)) return;
    var s = document.createElement('style');
    s.id = THEME_ID;
    s.textContent = [
      /* 同时注入两套变量名：Common 旧名（--line/--txt）与游戏主流名（--border/--text），
       * 两者指向同一值，保证「迁移到 injectTheme」的旧游戏无论引用哪套都不丢配色。
       * 红色取游戏主流值 #f6465d（旧 Common 用 #ff5a6a，已对齐）。 */
      ':root{',
      '--bg:#0a0e14;--panel:#121821;--panel2:#131a24;',
      '--line:rgba(31,42,56,.8);--border:#1f2a38;',
      '--txt:#d7e0ea;--text:#e6edf3;',
      '--dim:#6b7785;',
      '--sub:#6b7785;--text-dim:#6b7785;--text2:#6b7785;',
      '--gold:#f0b90b;--accent:#f0b90b;--yellow:#f0b90b;',
      '--green:#02c076;--red:#f6465d;',
      '--blue:#3aa0ff;',
      '--purple:#9b6bff;--cyan:#2ee6d6;--white:#d8dee9;--leaf:#5ad17a;',
      '--cell:90px;--gap:12px;--size:calc(var(--cell)*4 + var(--gap)*5);',
      "--font:'JetBrains Mono','Fira Code',Consolas,'Courier New',monospace;}",
      'body{margin:0;background:var(--bg);color:var(--text);',
      "font-family:'Cascadia Code',Consolas,Menlo,monospace;}",
      'canvas{display:block;background:#070a0f;border:1px solid var(--border);border-radius:8px;}',
      /* T-144 CRT 荧光强化：辉光/扫描线/色差/开机闪现。纯 CSS、合成器友好
       * （动画只动 opacity），prefers-reduced-motion 全降级。
       * 用 body::after 而非 ::before——2048 等游戏自带 body::before 网格叠层，避冲突。 */
      'h1,h2,.overlay-title{text-shadow:0 0 16px rgba(214,228,240,.22);}',
      '.term-h{text-shadow:0 0 18px rgba(240,185,11,.30),1px 0 0 rgba(246,70,93,.35),-1px 0 0 rgba(46,230,214,.30);}',
      'canvas{box-shadow:0 0 18px rgba(2,192,118,.07);}',
      'body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:9999;',
      'background:repeating-linear-gradient(0deg,rgba(255,255,255,.028) 0 1px,transparent 1px 3px);',
      'animation:crtFlicker 4s ease-in-out infinite;}',
      '@keyframes crtFlicker{0%,100%{opacity:.55}50%{opacity:1}}',
      'body{animation:crtOn .5s ease-out;}',
      '@keyframes crtOn{0%{opacity:0;filter:brightness(3) saturate(.2)}30%{opacity:1;filter:brightness(1.6)}100%{filter:none}}',
      '@media (prefers-reduced-motion:reduce){body::after{animation:none;}body{animation:none;}}',
      '.term-h{color:var(--gold);letter-spacing:.05em;}',
      '.diffbar{display:flex;gap:6px;margin:8px 0;}',
      '.diffbar button{flex:1;background:var(--panel2);color:var(--dim);',
      'border:1px solid var(--border);border-radius:6px;padding:6px 0;cursor:pointer;',
      'font-family:inherit;font-size:13px;transition:.15s;}',
      '.diffbar button.active{color:#0a0e14;background:var(--gold);border-color:var(--gold);font-weight:700;}'
    ].join('');
    document.head.appendChild(s);
    return s; // 便于测试/调用方检查注入内容（幂等分支仍返回 undefined）
  };

  /* ---------- 局部 PRNG（spec 铁律：逻辑随机禁止裸 Math.random） ---------- */
  Common.mulberry32 = function (seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ---------- 线性同余 PRNG（LCG，spec 旧 mk 的等价实现） ----------
   * 与旧游戏内联的 function mk(seed){...} 逐字节等价：
   *   s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff;
   * 同种子输出一致，迁移旧游戏时可直接 Common.lcg(seed) 替代 mk(seed)。 */
  Common.lcg = function (seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return (s & 0x7fffffff) / 0x7fffffff;
    };
  };

  /* ---------- 统一 rAF 游戏循环（替代 66 份各自实现的循环） ---------- */
  Common.Loop = function (step) {
    var raf = 0, last = 0, running = false, self = { stop: stop };
    function frame(t) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      try { step(t, dt); } catch (e) { console.error(e); }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return self; running = true; last = 0; raf = requestAnimationFrame(frame); return self; }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; return self; }
    self.start = start; self.stop = stop;
    return self;
  };

  /* ---------- 四档难度条（替代 41 份重复实现） ----------
   * 返回 { set(d), get(), cfg() }；onChange(d) 在切换时回调。 */
  Common.DIFFICULTY = {
    easy:   { label: '简单', speedMult: 0.75, growth: 1.08, bulletMult: 0.6,  countMult: 0.7, hpMult: 0.75, dmgMult: 0.8,  bossHpMult: 0.7, dropMult: 1.4 },
    normal: { label: '普通', speedMult: 1.0,  growth: 1.12, bulletMult: 1.0,  countMult: 1.0, hpMult: 1.0,  dmgMult: 1.0,  bossHpMult: 1.0, dropMult: 1.0 },
    hard:   { label: '困难', speedMult: 1.25, growth: 1.16, bulletMult: 1.4,  countMult: 1.3, hpMult: 1.35, dmgMult: 1.25, bossHpMult: 1.4, dropMult: 0.85 },
    hell:   { label: '地狱', speedMult: 1.5,  growth: 1.22, bulletMult: 1.9,  countMult: 1.7, hpMult: 1.9,  dmgMult: 1.5,  bossHpMult: 1.9, dropMult: 0.7 }
  };
  var DIFF_ORDER = ['easy', 'normal', 'hard', 'hell'];
  Common.buildDiffBar = function (container, onChange) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;
    container.classList.add('diffbar');
    container.innerHTML = '';
    var cur = 'normal';
    DIFF_ORDER.forEach(function (d) {
      var b = document.createElement('button');
      b.textContent = Common.DIFFICULTY[d].label;
      b.setAttribute('data-d', d);
      if (d === cur) b.classList.add('active');
      b.addEventListener('click', function () {
        cur = d;
        Array.prototype.forEach.call(container.children, function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        if (onChange) onChange(d);
      });
      container.appendChild(b);
    });
    return {
      set: function (d) { if (!Common.DIFFICULTY[d]) return; cur = d;
        Array.prototype.forEach.call(container.children, function (x) { x.classList.toggle('active', x.getAttribute('data-d') === d); }); },
      get: function () { return cur; },
      cfg: function () { return Common.DIFFICULTY[cur]; }
    };
  };

  /* ---------- 区间随机（替代 function rand(a,b){return a+Math.random()*(b-a);}）----------
   * 用本地 PRNG 产生 [a,b) 均匀随机数；可注入种子保持确定性。
   * 旧游戏里 7 款各自写了同样的 rand 包装，统一收口到这里。 */
  Common.range = function (a, b, rnd) {
    var fn = rnd || Common.mulberry32(((Date.now() ^ (a * 2654435761)) >>> 0) || 1);
    return a + fn() * (b - a);
  };

  /* ---------- Fisher-Yates 洗牌（替代各游戏手写的洗牌循环） ----------
   * 就地打乱数组，用本地 PRNG 保证可注入确定性。rnd 缺省时用 Common.mulberry32
   * 以当前时间播种（行为等同 Math.random 洗牌，但可被 setRand 注入复现）。 */
  Common.shuffle = function (arr, rnd) {
    var fn = rnd || Common.mulberry32(((Date.now() ^ (arr.length * 2654435761)) >>> 0) || 1);
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(fn() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };

  /* ---------- 数值工具（替代各游戏手写的 clamp/lerp） ---------- */
  Common.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  Common.lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------- 轻量彩带兜底（juice.js 存在时请用 Juice.confetti） ---------- */
  Common.confetti = function (ctx, x, y, n) {
    n = n || 28;
    var cols = ['#ffcf5a', '#39d98a', '#4aa8ff', '#ff5a6a', '#f0b90b'];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 4;
      ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = cols[i % cols.length];
      ctx.translate(x, y); ctx.rotate(a);
      ctx.fillRect(0, 0, 3, 6); ctx.restore();
      ctx.translate(Math.cos(a) * sp, Math.sin(a) * sp - 1);
    }
  };

  /* ---------- 高分/状态持久化（替代各游戏散落的 localStorage 调用） ----------
   * 命名空间化键 game:<name>:<key>，避免 bubble_best" 这类键名 bug 与 _best/_high 不一致。
   * private mode / 配额超限时 try/catch 兜底，不影响游戏运行。 */
  Common.Storage = (function () {
    function k(name, key) { return 'game:' + name + ':' + (key || 'best'); }
    function get(name, key, def) {
      try { var v = localStorage.getItem(k(name, key)); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    }
    function set(name, key, val) {
      try { localStorage.setItem(k(name, key), JSON.stringify(val)); return true; }
      catch (e) { return false; }
    }
    // 记录历史极值；cmp(cur,score) 返回 true 表示 score 更优（默认取较大值=高分游戏）
    function best(name, score, cmp) {
      var cur = get(name, 'best', null);
      var better = cur == null || (cmp ? cmp(cur, score) : score > cur);
      if (better) { set(name, 'best', score); return score; }
      return cur;
    }
    return { key: k, get: get, set: set, best: best };
  })();

  /* ---------- DPR 自适应画布（替代 17 份 devicePixelRatio 样板） ----------
   * 按 devicePixelRatio 放大 backing store，ctx 以 CSS 像素坐标作画（setTransform）。
   * opts.clampDpr: 钳制上限（如 2，匹配 9 款做法）；opts.setStyle: 是否写 style.width/height
   * （默认 true；迁移旧游戏且原样未设 style 时传 false 以零视觉变化）。返回 { ctx, W, H, dpr }。 */
  Common.fitCanvas = function (canvas, w, h, opts) {
    opts = opts || {};
    var dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    if (opts.clampDpr) dpr = Math.min(dpr, opts.clampDpr);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (opts.setStyle !== false) { canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, W: w, H: h, dpr: dpr };
  };

  /* ---------- 数组工具（替代各游戏手写的 arr[floor(rnd()*len)]） ----------
   * 默认以时间播种的 mulberry32 产出，逻辑路径可注入 rnd 复现。 */
  Common.pick = function (arr, rnd) {
    var fn = rnd || Common.mulberry32((Date.now() >>> 0) || 1);
    return arr[Math.floor(fn() * arr.length)];
  };
  Common.chance = function (p, rnd) {
    var fn = rnd || Common.mulberry32((Date.now() >>> 0) || 1);
    return fn() < p;
  };

  /* ---------- 轻量屏幕抖动（juice 缺省时的兜底，render-only） ----------
   * add(m) 触发，update(dt) 衰减，apply(ctx) 平移。render 用 Math.random，属视觉层。 */
  Common.ScreenShake = function (opt) {
    var mag = (opt && opt.mag) || 6, decay = (opt && opt.decay) || 0.9;
    var x = 0, y = 0, t = 0;
    return {
      add: function (m) { t = Math.max(t, m || mag); },
      update: function (dt) {
        if (t > 0.1) { x = (Math.random() * 2 - 1) * t; y = (Math.random() * 2 - 1) * t; t *= decay; }
        else { x = 0; y = 0; t = 0; }
      },
      apply: function (ctx) { ctx.translate(x, y); },
      active: function () { return t > 0.1; }
    };
  };

  /* ================= 几何 / 碰撞 / 数值 工具簇 =================
   * 替代各游戏手写的 distance / AABB / circle / point-in-rect / 角度 / roundRect，
   * 全部纯函数，node 直接可测；迁移时行为逐字节等价，不改动玩法。 */

  Common.TAU = Math.PI * 2;
  Common.deg2rad = function (d) { return d * Math.PI / 180; };
  Common.rad2deg = function (r) { return r * 180 / Math.PI; };

  // 平方距离（碰撞预筛用，避免频繁开根）
  Common.dist2 = function (x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; };
  // 欧氏距离（替代 Math.hypot(x1-x2, y1-y2) 与 sqrt(dx*dx+dy*dy)）
  Common.dist = function (x1, y1, x2, y2) { return Math.sqrt(Common.dist2(x1, y1, x2, y2)); };

  Common.clamp01 = function (v) { return v < 0 ? 0 : (v > 1 ? 1 : v); };
  // 反向 lerp：已知区间 [a,b] 与值 v，返回归一化位置 t（a===b 时返回 0）
  Common.invLerp = function (a, b, v) { return a === b ? 0 : (v - a) / (b - a); };

  // 轴对齐矩形重叠（rect = {x,y,w,h}）
  Common.hitAABB = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };
  // 圆形重叠（c = {x,y,r}）；与 hitAABB 一致采用严格 <（相切不算重叠）
  Common.hitCircle = function (c1, c2) {
    var dx = c1.x - c2.x, dy = c1.y - c2.y, r = c1.r + c2.r;
    return dx * dx + dy * dy < r * r;
  };
  // 点是否在矩形内（含边界）
  Common.pointInRect = function (px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  };
  // 两点的夹角（弧度，替代 atan2(by-ay, bx-ax)）
  Common.angle = function (ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); };

  /* 圆角矩形路径（替代各游戏手写的 arcTo / quadratic 圆角实现）
   * r 可为数字（四角同值）或 {tl,tr,br,bl}。调用后需自行 fill/stroke。
   * 与标准 CanvasRenderingContext2D.roundRect 行为一致。 */
  Common.roundRect = function (ctx, x, y, w, h, r) {
    var c = (typeof r === 'number') ? { tl: r, tr: r, br: r, bl: r } : (r || { tl: 0, tr: 0, br: 0, bl: 0 });
    ctx.beginPath();
    ctx.moveTo(x + c.tl, y);
    ctx.lineTo(x + w - c.tr, y);
    ctx.arcTo(x + w, y, x + w, y + c.tr, c.tr);
    ctx.lineTo(x + w, y + h - c.br);
    ctx.arcTo(x + w, y + h, x + w - c.br, y + h, c.br);
    ctx.lineTo(x + c.bl, y + h);
    ctx.arcTo(x, y + h, x, y + h - c.bl, c.bl);
    ctx.lineTo(x, y + c.tl);
    ctx.arcTo(x, y, x + c.tl, y, c.tl);
    ctx.closePath();
  };

  /* ================= 格式化 / 数值便捷 / 绘制 / 基础设施 ================= */

  // 秒 → "M:SS"（替代各游戏手写的 m+':'+(s<10?'0':'')+s）
  Common.fmtTime = function (sec) {
    sec = Math.max(0, Math.floor(sec == null ? 0 : sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  };
  // 千分位（替代各游戏手写的 toLocaleString / 正则）
  Common.fmtNum = function (n) {
    var s = String(Math.floor(n == null ? 0 : n));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 统一文本绘制（render 层；替代散落的 ctx.font/fillStyle/fillText 样板）
  Common.text = function (ctx, str, x, y, opt) {
    opt = opt || {};
    ctx.save();
    if (opt.font) ctx.font = opt.font;
    ctx.fillStyle = opt.color || '#d7e0ea';
    ctx.textAlign = opt.align || 'left';
    ctx.textBaseline = opt.baseline || 'alphabetic';
    ctx.fillText(str, x, y);
    ctx.restore();
  };
  // 圆角面板背景（render 层）
  Common.panel = function (ctx, x, y, w, h, opt) {
    opt = opt || {};
    var r = opt.radius == null ? 8 : opt.radius;
    Common.roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = opt.fill || 'rgba(18,24,33,.92)';
    ctx.fill();
    if (opt.stroke) { ctx.strokeStyle = opt.stroke; ctx.lineWidth = opt.lineWidth || 1; ctx.stroke(); }
  };

  // 符号 / 取模（正模）/ 整数随机 / 不重复抽样 / 逼近 / 角度插值
  Common.sign = function (v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); };
  Common.mod = function (a, n) { return ((a % n) + n) % n; };
  Common.randInt = function (a, b, rnd) {
    var fn = rnd || Common.mulberry32(((Date.now() ^ (a * 2654435761)) >>> 0) || 1);
    return a + Math.floor(fn() * (b - a + 1));
  };
  Common.choices = function (arr, n, rnd) {
    var pool = arr.slice(); Common.shuffle(pool, rnd);
    return pool.slice(0, Math.min(n == null ? pool.length : n, pool.length));
  };
  Common.approach = function (cur, target, step) {
    if (cur < target) return Math.min(cur + step, target);
    if (cur > target) return Math.max(cur - step, target);
    return target;
  };
  Common.lerpAngle = function (a, b, t) {
    var d = Common.mod(b - a + Math.PI, Common.TAU) - Math.PI;
    return a + d * t;
  };

  /* ---- 音频（懒加载 AudioContext，无环境安全兜底，render/交互层） ---- */
  Common.Sound = (function () {
    var ctx = null, muted = false;
    function ac() {
      if (muted) return null;
      if (ctx) return ctx;
      try {
        var AC = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
        if (!AC) return null;
        ctx = new AC();
      } catch (e) { ctx = null; }
      return ctx;
    }
    return {
      setMuted: function (m) { muted = !!m; },
      isMuted: function () { return muted; },
      // 播放单音；type 波形，dur 秒，vol 0..1
      beep: function (freq, dur, type, vol) {
        var c = ac(); if (!c) return;
        try {
          var o = c.createOscillator(), g = c.createGain();
          o.type = type || 'square'; o.frequency.value = freq || 440;
          g.gain.value = (vol == null ? 0.15 : vol);
          o.connect(g); g.connect(c.destination);
          o.start();
          g.gain.setValueAtTime(g.gain.value, c.currentTime || 0);
          g.gain.exponentialRampToValueAtTime(0.0001, (c.currentTime || 0) + (dur || 0.1));
          o.stop((c.currentTime || 0) + (dur || 0.1));
        } catch (e) {}
      }
    };
  })();

  /* ---- 键盘输入（懒绑定，无环境安全兜底，交互层） ---- */
  Common.Input = (function () {
    var down = {}, pressed = {}, bound = false;
    function ensure() {
      if (bound || typeof window === 'undefined') return;
      bound = true;
      window.addEventListener('keydown', function (e) { down[e.key] = true; pressed[e.key] = true; });
      window.addEventListener('keyup', function (e) { down[e.key] = false; });
    }
    return {
      init: function () { ensure(); },
      down: function (k) { ensure(); return !!down[k]; },
      pressed: function (k) { ensure(); var v = !!pressed[k]; pressed[k] = false; return v; },
      clear: function () { down = {}; pressed = {}; }
    };
  })();

  /* ---- 计时器（可暂停） ---- */
  Common.Timer = function (opt) {
    var total = (opt && opt.total) || 0, remain = total, running = false, acc = 0;
    return {
      start: function () { running = true; },
      pause: function () { running = false; },
      reset: function (t) { total = (t == null) ? total : t; remain = total; acc = 0; running = false; },
      update: function (dt) { if (running) { remain = Math.max(0, remain - dt); acc += dt; } },
      remain: function () { return remain; },
      elapsed: function () { return acc; },
      done: function () { return remain <= 0; }
    };
  };

  /* ---- 轻量场景机（menu/play/over 等状态切换） ---- */
  Common.State = function (initial) {
    var cur = initial || 'menu', defs = {}, enters = {};
    return {
      get: function () { return cur; },
      set: function (s, data) { if (cur === s) return; cur = s; if (enters[s]) enters[s](data); },
      is: function (s) { return cur === s; },
      on: function (s, fn) { enters[s] = fn; },
      def: function (s, fn) { defs[s] = fn; },
      run: function (dt) { if (defs[cur]) defs[cur](dt); }
    };
  };

  /* ---------- 数组 / 数值便捷（纯函数，node 可测） ----------
   * 注意：Common.range 已被占用（随机浮点 a+fn()*(b-a)，sgs/spire 依赖），
   * 故数组序列生成器命名为 Common.seq，避免覆盖随机版。 */
  Common.seq = function (a, b) {
    if (b === undefined) { b = a; a = 0; }
    var o = []; for (var i = a; i < b; i++) o.push(i); return o;
  };
  Common.sum = function (arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s; };
  Common.avg = function (arr) { return arr.length ? Common.sum(arr) / arr.length : 0; };

  /* ---------- 环形包装（贪吃蛇 / 太空类 toroidal 坐标） ---------- */
  Common.wrap = function (v, min, max) {
    var d = max - min;
    v = (v - min) % d;
    if (v < 0) v += d;
    return v + min;
  };

  /* ---------- 颜色（纯函数，视觉层但数学可 node 测） ---------- */
  Common.lerpColor = function (a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  };
  Common.rgba = function (r, g, b, a) {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (a === undefined ? 1 : a) + ')';
  };

  /* ---------- 缓动（动画用，纯函数） ---------- */
  Common.easing = {
    inOutQuad: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    inOutCubic: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  };

  /* ---------- 绘制便捷（纯调用 ctx，vm 不可渲染但方法调用可 mock 验证） ---------- */
  Common.circle = function (ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };


  /* ---------- 本地最高分排行榜（共享数据层） ----------
   * 为单文件游戏提供可复用的「本地 Top N 排行榜」数据层，避免每款游戏重复实现、
   * 也避免游戏文件裸用 localStorage（收敛闸门 rawLocalStorage 不变量）。
   * 设计：纯数据 + 纯函数，不含任何 DOM/UI；渲染由各自游戏按自身主题完成。
   * 存储：Common.Storage key = 'game:'+key+':top5'，值为 [{score,user,ts,dur,date}]，
   *      按分数降序、同分先达成(ts较小)者靠前，截断为 topN（默认 5）。
   * 防回归：无 DOM / 无 localStorage 环境（vm 沙箱、测试）走 try/catch 静默路径。
   * 真实消费者：snake.html、bubble.html 等已接入（Common 工具不得零消费者）。 */
  Common.HighScores = {
    // 玩家代号：首次自动生成 3 字符（大写字母数字，去易混 I/O/0/1），存本地复用。
    // 不弹窗输昵称——弹窗会侵入游戏启动流程，破坏单文件零侵入模型。
    playerTag: function (gameKey) {
      try {
        var t = Common.Storage.get(gameKey, 'tag', null);
        if (t) return t;
        var h = 0, s = gameKey + ':' + Date.now();
        for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var tag = chars[h & 31] + chars[(h >>> 5) & 31] + chars[(h >>> 10) & 31];
        Common.Storage.set(gameKey, 'tag', tag);
        return tag;
      } catch (e) { return 'YOU'; }
    },

    // 头像底色：代号 hash → 色相角（0-359），渲染时拼 hsl 渐变
    avatarHue: function (tag) {
      var h = 0;
      for (var i = 0; i < tag.length; i++) { h = (h * 33 + tag.charCodeAt(i)) | 0; }
      return Math.abs(h) % 360;
    },

    // 段位：按分数区间映射（5 档 emoji + 中文名）。各游戏如需自定义可覆盖此函数。
    tierOf: function (s) {
      if (s >= 50) return { e: '💎', n: '钻石' };
      if (s >= 35) return { e: '🟦', n: '铂金' };
      if (s >= 20) return { e: '🟨', n: '黄金' };
      if (s >= 10) return { e: '⬜', n: '白银' };
      return { e: '🟫', n: '青铜' };
    },

    // 相对时间：今日 HH:MM / 昨日 MM-DD / MM-DD
    relTime: function (ts) {
      if (!ts) return '';
      var d = new Date(ts), n = new Date();
      var p = function (v) { return ('0' + v).slice(-   2); };
      var sameDay = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
      if (sameDay) return '今日 ' + p(d.getHours()) + ':' + p(d.getMinutes());
      var y = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
      var isYest = d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
      if (isYest) return '昨日 ' + p(d.getMonth() + 1) + '-' + p(d.getDate());
      return p(d.getMonth() + 1) + '-' + p(d.getDate());
    },

    // 用时 mm:ss
    fmtDur: function (ms) {
      if (!ms) return '--:--';
      var s = Math.floor(ms / 1000);
      return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
    },

    // 写入一条成绩，返回本次名次（1..topN=上榜，0=未上榜/非正分）。
    record: function (gameKey, score, durMs) {
      if (!(score > 0)) return 0;
      var list = [];
      try { list = Common.Storage.get(gameKey, 'top5', []) || []; } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      var now = new Date();
      var rec = {
        score: score,
        user: this.playerTag(gameKey),
        ts: now.getTime(),
        dur: durMs || 0,
        date: now.toISOString().slice(0, 10)
      };
      list.push(rec);
      list.sort(function (a, b) { return b.score - a.score || ((a.ts || 0) - (b.ts || 0)); });
      var topN = 5;
      if (list.length > topN) list.length = topN;
      var rank = 0;
      for (var i = 0; i < list.length; i++) {
        if (list[i].score === score && list[i].ts === rec.ts) { rank = i + 1; break; }
      }
      try { Common.Storage.set(gameKey, 'top5', list); } catch (e) {}
      return rank;
    },

    // 读取当前榜单（数组，已排序），无数据返回 []
    read: function (gameKey) {
      var list = [];
      try { list = Common.Storage.get(gameKey, 'top5', []) || []; } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      return list;
    },

    /* 标准榜单视图（T-106 收口）：把 snake/bubble 各自重复的 ~40 行渲染收敛为一份，
     * 新接入游戏（racing/parkour/runner/tempprun/subwaysuroffers/geometrydash/whack/2048）
     * 一行调用即得完整榜单 UI（金/银/铜/[ME]徽章/空榜文案），零复制。
     * 需要深度定制的游戏（snake hero 卡 / bubble 主题化）仍按主题自绘，render 仅为缺省实现。
     * myRank：本局名次（1..5 高亮 [ME]，0=未上榜不高亮）。vm 沙箱无 DOM 时静默跳过。 */
    render: function (gameKey, el, myRank) {
      try {
        if (!el || typeof document === 'undefined' || !document.createElement) return;
        // 样式注入一次（幂等）：全部类名 hs- 前缀避免与游戏样式冲突
        if (!document.getElementById('hs-board-style')) {
          var st = document.createElement('style');
          st.id = 'hs-board-style';
          st.textContent = [
            '.hs-board{margin-top:10px;border-top:1px solid var(--border,#1f2a38);padding-top:10px;text-align:left;max-width:min(340px,92vw);margin-left:auto;margin-right:auto}',
            '.hs-board .hs-title{color:var(--gold,#f0b90b);font-size:12px;letter-spacing:4px;font-weight:700;text-align:center;margin-bottom:8px}',
            '.hs-board .hs-list{list-style:none;padding:0;margin:0}',
            '.hs-board .hs-row{display:grid;grid-template-columns:30px 26px 1fr auto;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;margin-bottom:4px;background:rgba(255,255,255,.02)}',
            '.hs-board .hs-rk{font-size:15px;font-weight:700;color:var(--dim,#6b7785);text-align:center}',
            '.hs-board .hs-avatar{display:inline-block;width:26px;height:26px;border-radius:50%;text-align:center;line-height:26px;font-weight:700;color:#0a0e14;font-size:13px}',
            '.hs-board .hs-info{display:flex;flex-direction:column;gap:2px;min-width:0}',
            '.hs-board .hs-line1{display:flex;gap:6px;align-items:baseline}',
            '.hs-board .hs-name{font-weight:700;color:var(--text,#e6edf3);font-size:13px}',
            '.hs-board .hs-tier{font-size:10px;color:var(--dim,#6b7785)}',
            '.hs-board .hs-line2{display:flex;gap:5px;align-items:baseline}',
            '.hs-board .hs-sc{font-weight:700;color:var(--text,#e6edf3);font-size:15px}',
            '.hs-board .hs-sub{font-size:10px;color:var(--dim,#6b7785)}',
            '.hs-board .hs-badge{font-size:9px;font-weight:700;letter-spacing:1px;background:var(--red,#f6465d);color:#0a0e14;padding:2px 6px;border-radius:3px}',
            '.hs-board .hs-gold{background:linear-gradient(90deg,rgba(240,185,11,.14),transparent 70%);box-shadow:inset 3px 0 0 var(--gold,#f0b90b)}',
            '.hs-board .hs-gold .hs-rk,.hs-board .hs-gold .hs-sc{color:var(--gold,#f0b90b)}',
            '.hs-board .hs-silver{background:linear-gradient(90deg,rgba(192,192,192,.10),transparent 70%);box-shadow:inset 3px 0 0 #c0c0c0}',
            '.hs-board .hs-bronze{background:linear-gradient(90deg,rgba(205,127,50,.10),transparent 70%);box-shadow:inset 3px 0 0 #cd7f32}',
            '.hs-board .hs-mine{box-shadow:inset 0 0 0 1px var(--red,#f6465d),0 0 12px rgba(246,70,93,.25);background:rgba(246,70,93,.06)}',
            '.hs-board .hs-empty{padding:18px 12px;text-align:center;color:var(--dim,#6b7785);font-size:12px;line-height:1.9;list-style:none}',
            '.hs-board .hs-empty-hint{color:var(--gold,#f0b90b);font-size:13px;letter-spacing:3px;margin-bottom:6px;font-weight:700}'
          ].join('');
          (document.head || document.body).appendChild(st);
        }
        if (el.classList && el.classList.add) el.classList.add('hs-board');
        var list = Common.HighScores.read(gameKey);
        var html = '<div class="hs-title">LOCAL TOP 5 · 本地最高分</div><ol class="hs-list">';
        if (list.length === 0) {
          html += '<li class="hs-empty"><div class="hs-empty-hint">👑 NO RECORDS YET</div>暂无记录 · 来一局<br>你的分数将占榜首</li>';
        } else {
          for (var i = 0; i < list.length; i++) {
            var rec = list[i], rank = i + 1;
            var user = rec.user || 'PLAYER';
            var hue = Common.HighScores.avatarHue(user);
            var tier = Common.HighScores.tierOf(rec.score);
            var dur = Common.HighScores.fmtDur(rec.dur);
            var rt = Common.HighScores.relTime(rec.ts || (rec.date ? new Date(rec.date + 'T00:00:00').getTime() : 0));
            var mine = (myRank > 0 && rank === myRank);
            var cup = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : rank));
            var cupCls = rank === 1 ? 'hs-gold' : (rank === 2 ? 'hs-silver' : (rank === 3 ? 'hs-bronze' : ''));
            var avatar = '<span class="hs-avatar" style="background:linear-gradient(135deg,hsl(' + hue + ',72%,52%),hsl(' + ((hue + 40) % 360) + ',72%,38%))">' + user.charAt(0) + '</span>';
            var info = '<span class="hs-info"><span class="hs-line1"><span class="hs-name">' + user + '</span><span class="hs-tier">' + tier.e + ' ' + tier.n + '</span></span>'
              + '<span class="hs-line2"><span class="hs-sc">' + rec.score + '</span><span class="hs-sub">' + dur + ' · ' + rt + '</span></span></span>';
            html += '<li class="hs-row ' + cupCls + (mine ? ' hs-mine' : '') + '">'
              + '<span class="hs-rk">' + cup + '</span>' + avatar + info
              + (mine ? '<span class="hs-badge">[ME]</span>' : '') + '</li>';
          }
        }
        html += '</ol>';
        el.innerHTML = html;
      } catch (e) { /* 静默：不阻断游戏流程 */ }
    }
  };

  /* ---------- 统一「退出 / 返回大厅」按钮 ----------
   * 所有加载 common.js 的游戏页自动获得一个固定定位的返回大厅按钮，
   * 无需逐个游戏改代码（166 款一次性覆盖）。大厅(index.html)与测试页不加。
   * 设计：与主终端主题一致（复用 --gold/--border/--panel/--text/--red），
   * 固定左上角、半透明、毛玻璃、最高 z-index，点击导航回 index.html。
   * 防御：在 vm 沙箱（无 document/location 或 mock 不完整）中静默失败，不炸逻辑测试。 */
  Common.mountExitButton = function () {
    try {
      if (window.__hubExitMounted) return;            // 幂等
      if (window.GAME_CATALOG) return;                // 大厅本身不加
      var p = (typeof location !== 'undefined' && location.pathname) || '';
      if (p.indexOf('/tests/') >= 0) return;          // 测试页不加
      if (typeof document === 'undefined' || !document.createElement) return;
      window.__hubExitMounted = true;
      function doMount() {
        try {
          if (!document.body) return;
          if (document.getElementById('hubExitBtn')) return;
          var st = document.createElement('style');
          st.id = 'hub-exit-style';
          st.textContent = [
            '#hubExitBtn{position:fixed;top:12px;left:12px;z-index:2147483000;',
            'display:inline-flex;align-items:center;gap:6px;',
            'padding:8px 14px;border-radius:8px;',
            'background:rgba(14,20,29,.82);border:1px solid var(--border,#1f2a38);',
            'color:var(--gold,#f0b90b);font:600 13px/1 "JetBrains Mono",Consolas,monospace;',
            'text-decoration:none;letter-spacing:.5px;cursor:pointer;user-select:none;',
            'box-shadow:0 4px 16px rgba(0,0,0,.45);backdrop-filter:blur(4px);',
            '-webkit-backdrop-filter:blur(4px);transition:.15s ease;}',
            '#hubExitBtn:hover{border-color:var(--gold,#f0b90b);background:rgba(22,32,44,.94);',
            'box-shadow:0 0 16px rgba(240,185,11,.28);}',
            '#hubExitBtn:active{transform:translateY(1px);}'
          ].join('');
          (document.head || document.body).appendChild(st);
          var inIframe = (typeof window !== 'undefined') && window.self !== window.top;
          var b = document.createElement('a');
          b.id = 'hubExitBtn';
          b.href = 'index.html';
          b.textContent = '← 大厅';
          b.title = '返回游戏大厅';
          b.addEventListener('click', function (e) {
            e.preventDefault();
            // 在大厅 iframe 浮层内：通知父窗口关闭浮层（大厅状态保留，无需整页跳转）
            if (inIframe && window.parent && window.parent.postMessage) {
              try { window.parent.postMessage({ type: 'hub:exit' }, '*'); return; } catch (err) {}
            }
            if (typeof location !== 'undefined') location.href = 'index.html';
          });
          document.body.appendChild(b);
        } catch (e) { /* 静默：不阻断游戏逻辑 */ }
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', doMount);
      else doMount();
    } catch (e) { /* 静默：vm 沙箱等环境 */ }
  };
  // 自动挂载：所有加载 common.js 的游戏页都会得到退出按钮（大厅/测试页已被上面的守卫排除）
  try {
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { Common.mountExitButton(); });
      else Common.mountExitButton();
    }
  } catch (e) {}

  global.Common = Common;
  if (typeof module !== 'undefined' && module.exports) module.exports = Common;
})(typeof window !== 'undefined' ? window : globalThis);
