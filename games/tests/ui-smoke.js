// games/tests/ui-smoke.js
// UI 集成冒烟测试（jsdom）—— 填补 vm 沙箱「不渲染」的测试天花板。
//
// 锐评第 4 项（测试天花板）的根因：vm 沙箱只跑纯逻辑，UI/接线层零自动保障，
// 而「大厅 iframe 浮层」与「游戏退出按钮」这两处接线曾真实回归（见 MEMORY.md）。
// 本测试用 jsdom 提供真实 DOM，并用 vm 上下文伪造 window.self/top/parent/location
// 来控制 Common.mountExitButton 的 iframe 判定，断言两条关键契约：
//
//   A. 游戏退出按钮（Common.mountExitButton）
//      - iframe 浮层内（window.self !== window.top）：点击 → parent.postMessage({type:'hub:exit'})
//      - 直接打开（非 iframe）：点击 → location.href = 'index.html'（整页跳回大厅）
//   B. 大厅 index.html 浮层架构：必须含 #gameFrame iframe 且监听 hub:exit 关闭浮层
//
// jsdom 不可用（非项目依赖）时优雅跳过（退出 0，仅提示），不阻断 CI；
// vm 回归门禁依旧是强制底线。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// —— jsdom 解析（本地托管工作区可能提供，路径不稳定，做多级回退）——
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; }
catch (e) {
  try { JSDOM = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/jsdom').JSDOM; }
  catch (e2) { JSDOM = null; }
}
if (!JSDOM) {
  console.log('⚠ ui-smoke: jsdom 不可用，跳过 UI 冒烟测试（vm 回归门禁仍有效）');
  process.exit(0);
}

const COMMON_PATH = path.join(__dirname, '..', 'common.js');
const INDEX_PATH = path.join(__dirname, '..', 'index.html');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else { fail++; fails.push(label); console.log('  ✗ ' + label); }
}

// 用真实 jsdom 文档 + 伪造的 window 层级来加载 common.js。
// iframe=true 时 top/parent 指向外部对象（self!==top）；否则三者一致（直接打开）。
function loadCommonIn(iframe) {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { runScripts: 'outside-only' });
  const realWin = dom.window;
  const captured = { post: [] };
  const fakeParent = { postMessage: function (m, o) { captured.post.push({ m: m, o: o }); } };
  let navHref = '';
  const stubLoc = {
    get href() { return navHref; },
    set href(v) { navHref = v; },
    pathname: '/games/sgs.html',
    assign: function (v) { navHref = v; },
    replace: function (v) { navHref = v; },
  };
  const fakeWin = {
    // window 自引用；iframe 判定靠 top 是否与 self 不同
    self: null,
    top: iframe ? {} : null,
    parent: iframe ? fakeParent : null,
    document: realWin.document,
    location: stubLoc,
    Event: realWin.Event,
    addEventListener: realWin.addEventListener ? realWin.addEventListener.bind(realWin) : function () {},
    removeEventListener: realWin.removeEventListener ? realWin.removeEventListener.bind(realWin) : function () {},
    requestAnimationFrame: realWin.requestAnimationFrame ? realWin.requestAnimationFrame.bind(realWin) : function () {},
    cancelAnimationFrame: realWin.cancelAnimationFrame ? realWin.cancelAnimationFrame.bind(realWin) : function () {},
  };
  fakeWin.self = fakeWin;
  fakeWin.window = fakeWin;
  if (!iframe) { fakeWin.top = fakeWin; fakeWin.parent = fakeWin; } // 直接打开：self===top
  const ctx = vm.createContext(fakeWin);
  const code = fs.readFileSync(COMMON_PATH, 'utf8');
  vm.runInContext(code, ctx, { filename: 'common.js' });
  // jsdom 在 outside-only 下 readyState 停在 'loading'，auto-mount 嵌套注册了
  // 两层 DOMContentLoaded 监听（auto-mount → mountExitButton → doMount），不会自动触发。
  // 手动多次派发以刷新两层，使其真正挂载（同时覆盖真实自动挂载路径）。
  for (let i = 0; i < 3; i++) {
    try { realWin.document.dispatchEvent(new realWin.Event('DOMContentLoaded')); } catch (e) {}
  }
  return { dom: dom, win: fakeWin, realWin: realWin, captured: captured, stubLoc: stubLoc };
}

// —— A1. iframe 浮层内：点击退出按钮应 postMessage hub:exit ——
function testExitIframe() {
  const env = loadCommonIn(true);
  const btn = env.realWin.document.getElementById('hubExitBtn');
  ok(!!btn, 'A1 iframe: 退出按钮已挂载 (#hubExitBtn)');
  if (btn) {
    btn.dispatchEvent(new env.realWin.Event('click', { bubbles: true, cancelable: true }));
    ok(env.captured.post.length === 1, 'A1 iframe: 点击触发 parent.postMessage（次数=' + env.captured.post.length + '）');
    const t = env.captured.post[0] && env.captured.post[0].m && env.captured.post[0].m.type;
    ok(t === 'hub:exit', 'A1 iframe: 消息 type=hub:exit（实际=' + t + '）');
    ok(env.stubLoc.href === '', 'A1 iframe: 未走整页跳分支（href 未变）');
  }
  env.dom.window.close();
}

// —— A2. 直接打开（非 iframe）：点击应整页跳 index.html ——
function testExitDirect() {
  const env = loadCommonIn(false);
  const btn = env.realWin.document.getElementById('hubExitBtn');
  ok(!!btn, 'A2 direct: 退出按钮已挂载 (#hubExitBtn)');
  if (btn) {
    btn.dispatchEvent(new env.realWin.Event('click', { bubbles: true, cancelable: true }));
    ok(env.stubLoc.href === 'index.html', 'A2 direct: 点击整页跳 index.html（href=' + env.stubLoc.href + '）');
    ok(env.captured.post.length === 0, 'A2 direct: 未误触发 hub:exit postMessage（次数=' + env.captured.post.length + '）');
  }
  env.dom.window.close();
}

// —— B. 大厅浮层架构：结构契约 ——
function testHubFrame() {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  ok(/id\s*=\s*["']gameFrame["']/.test(html), 'B hub: 含 #gameFrame 浮层 iframe');
  ok(/hub:exit/.test(html), 'B hub: 监听 hub:exit 关闭浮层（保留“不换界面”体验）');
}

console.log('━━━ UI 集成冒烟测试 (jsdom) ━━━');
testExitIframe();
testExitDirect();
testHubFrame();
console.log('\nUI 冒烟：' + pass + ' 通过 / ' + fail + ' 失败');
if (fail > 0) {
  console.error('✗ UI 冒烟失败：' + fails.join('；'));
  process.exit(1);
}
console.log('✓ UI 冒烟通过：退出按钮 iframe/直接打开两分支 + 大厅浮层接线均正确');
process.exit(0);
