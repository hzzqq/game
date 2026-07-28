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
      '--bg:#0a0e14;--panel:#10151f;--panel2:#121821;',
      '--line:#1f2a38;--border:#1f2a38;',
      '--txt:#d7e0ea;--text:#d7e0ea;',
      '--dim:#7a8aa0;--gold:#ffcf5a;--green:#39d98a;--red:#f6465d;',
      '--blue:#4aa8ff;--accent:#f0b90b;}',
      'body{margin:0;background:var(--bg);color:var(--text);',
      "font-family:'Cascadia Code',Consolas,Menlo,monospace;}",
      'canvas{display:block;background:#070a0f;border:1px solid var(--border);border-radius:8px;}',
      '.term-h{color:var(--gold);letter-spacing:.05em;}',
      '.diffbar{display:flex;gap:6px;margin:8px 0;}',
      '.diffbar button{flex:1;background:var(--panel2);color:var(--dim);',
      'border:1px solid var(--border);border-radius:6px;padding:6px 0;cursor:pointer;',
      'font-family:inherit;font-size:13px;transition:.15s;}',
      '.diffbar button.active{color:#0a0e14;background:var(--gold);border-color:var(--gold);font-weight:700;}'
    ].join('');
    document.head.appendChild(s);
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
  // 便捷别名
  Common.mk = Common.mulberry32;

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
      try { step(dt); } catch (e) { console.error(e); }
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

  global.Common = Common;
  if (typeof module !== 'undefined' && module.exports) module.exports = Common;
})(typeof window !== 'undefined' ? window : globalThis);
