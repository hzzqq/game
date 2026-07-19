// 通用 node 逻辑测试沙箱：用 vm 加载游戏内联 <script>（stub 掉 DOM/window/localStorage），
// 经游戏暴露的 window.__t / window.__bb 钩子驱动纯逻辑。真实代码被测试，不复制。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---- 极简可调用代理：任意属性/调用都安全 no-op，永不抛错 ----
function fakeEl() {
  const t = function () {};
  const style = {};
  const classList = { add() {}, remove() {}, contains() { return false; }, toggle() {} };
  const self = new Proxy(t, {
    get(o, p) {
      if (p === 'style') return style;
      if (p === 'classList') return classList;
      if (p === 'getContext') return () => fakeCtx();
      if (p === 'addEventListener' || p === 'removeEventListener') return () => {};
      if (p === 'appendChild' || p === 'removeChild' || p === 'insertBefore') return () => {};
      if (p === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 0, height: 0 });
      if (p === 'querySelector') return () => fakeEl();
      if (p === 'querySelectorAll') return () => [];
      if (p === 'width' || p === 'height') return 600;
      if (p === 'clientWidth' || p === 'clientHeight' || p === 'offsetWidth' || p === 'offsetHeight' || p === 'scrollWidth' || p === 'scrollHeight') return 600;
      if (p === 'textContent' || p === 'innerHTML' || p === 'value') return '';
      if (p === 'children' || p === 'childNodes') return [];
      if (p === 'dataset') return {};
      if (p === 'parentNode') return fakeEl();
      return fakeEl();
    },
    set() { return true; },
    apply() { return fakeEl(); }
  });
  return self;
}

function fakeCtx() {
  const t = function () {};
  return new Proxy(t, {
    get(o, p) {
      if (p === 'canvas') return fakeEl();
      if (p === 'measureText') return () => ({ width: 0 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern')
        return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: [] });
      if (p === 'putImageData') return () => {};
      return () => {};
    },
    set() { return true; }
  });
}

function makeSandbox() {
  const store = {};
  const documentStub = {
    getElementById: () => fakeEl(),
    createElement: () => fakeEl(),
    querySelector: () => fakeEl(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    body: fakeEl(),
    documentElement: fakeEl(),
  };
  const windowStub = {
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    location: { href: '' },
    devicePixelRatio: 1,
  };
  const sandbox = {
    console,
    document: documentStub,
    window: windowStub,
    navigator: { maxTouchPoints: 0, userAgent: 'node-test' },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    requestAnimationFrame: () => 0,   // 关键：不真正循环，避免 boot 自走
    cancelAnimationFrame: () => {},
    getComputedStyle: () => ({ getPropertyValue: () => '40' }),
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    performance: { now: () => Date.now() },
    Math, JSON, Date, parseInt, parseFloat, isNaN, Array, Object, String, Number, Boolean,
    Audio: function () { return { play() {}, pause() {}, addEventListener() {} }; },
    AudioContext: function () { return { createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: {} }), createGain: () => ({ connect() {}, gain: {} }), destination: {}, currentTime: 0 }; },
  };
  sandbox.window.document = documentStub;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  return sandbox;
}

function extractInlineScript(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m, best = '';
  while ((m = re.exec(html)) !== null) { if (m[1].length > best.length) best = m[1]; }
  if (!best) throw new Error('未找到内联 <script>');
  return best;
}

function loadGame(relPath) {
  const file = path.resolve(__dirname, '..', relPath);
  const html = fs.readFileSync(file, 'utf8');
  const script = extractInlineScript(html);
  const sandbox = makeSandbox();
  vm.runInNewContext(script, sandbox, { filename: path.basename(file) });
  const hook = sandbox.window.__t || sandbox.window.__bb;
  if (!hook) throw new Error(path.basename(file) + ' 未暴露 window.__t / __bb 钩子');
  return { sandbox, t: hook };
}

// ---- 断言收集 ----
const results = [];
function ok(name, cond, info) {
  results.push({ name, pass: !!cond, info: info || '' });
  if (!cond) console.log('  ✗ ' + name + (info ? '  [' + info + ']' : ''));
}
function eq(name, a, b, info) {
  const pass = JSON.stringify(a) === JSON.stringify(b);
  results.push({ name, pass, info: (info || '') + ` (得到 ${JSON.stringify(a)} 期望 ${JSON.stringify(b)})` });
  if (!pass) console.log('  ✗ ' + name + `  得到 ${JSON.stringify(a)} 期望 ${JSON.stringify(b)}`);
}

module.exports = { loadGame, results, ok, eq, fakeEl, fakeCtx };
