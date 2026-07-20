// 全量电池测试：对 103 款游戏做"模拟运行"，挖掘现有单测覆盖不到的真实缺陷。
// 策略：loadGame 后 reset()，然后对游戏的推进函数（step/update/tick/frame）做数百次空转循环，
// 每次检查 getState() 返回的状态树里是否出现 NaN/Infinity（数值腐化），并捕获任何抛出的异常。
// 这是确定性、低误报的检查：只报告"游戏自己跑起来后状态坏掉/崩掉"，不随机乱调动作接口。
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./harness');

const GAMES_DIR = path.resolve(__dirname, '..', '..');
// 只检测"时间推进"类函数；'step' 太歧义（很多是落子/移动函数，需要参数），故排除。
const ADVANCE = ['tick', 'update', 'frame', 'loop', 'simulate', 'advance'];

function deepScanNaN(obj, pathStr, out) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'number') {
    if (!isFinite(obj)) out.push(pathStr + '=' + obj);
    return;
  }
  if (typeof obj === 'string') return;
  if (typeof obj === 'boolean') return;
  if (typeof obj === 'function') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) deepScanNaN(obj[i], pathStr + '[' + i + ']', out);
    return;
  }
  if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) deepScanNaN(obj[k], pathStr + '.' + k, out);
  }
}

function tryAdvance(fn) {
  // 尝试多种常见调用签名，取第一个不抛错的
  const shapes = [[16], [0.016], [1 / 60], [], [100]];
  for (const args of shapes) {
    try { fn(...args); return null; }
    catch (e) { /* 试下一个签名 */ }
  }
  // 全部签名都抛错 -> 记录
  return 'advance 调用签名均抛错';
}

function runOne(htmlName) {
  const rel = '../' + htmlName;
  let game;
  try {
    game = loadGame(rel);
  } catch (e) {
    return { name: htmlName, error: 'loadGame 失败: ' + e.message };
  }
  const t = game.t;
  const findings = [];
  const hooks = Object.keys(t);

  // 1) reset
  if (typeof t.reset === 'function') {
    try { t.reset(); } catch (e) { findings.push('reset 抛错: ' + e.message); }
  }
  // 2) 初始状态 NaN 扫描
  if (typeof t.getState === 'function') {
    try {
      const s0 = t.getState();
      const bad = [];
      deepScanNaN(s0, 'state', bad);
      if (bad.length) findings.push('初始状态 NaN: ' + bad.slice(0, 5).join(', '));
    } catch (e) { findings.push('getState 初始抛错: ' + e.message); }
  }

  // 3) 推进函数空转循环
  const adv = hooks.filter(h => ADVANCE.includes(h.toLowerCase()) && typeof t[h] === 'function');
  if (adv.length) {
    for (let iter = 0; iter < 600; iter++) {
      let threw = null;
      for (const a of adv) {
        const r = tryAdvance(t[a]);
        if (r) { threw = 'iter' + iter + ' ' + a + ': ' + r; break; }
      }
      if (threw) { findings.push('推进异常 ' + threw); break; }
      if (typeof t.getState === 'function') {
        try {
          const s = t.getState();
          const bad = [];
          deepScanNaN(s, 'state', bad);
          if (bad.length) { findings.push('iter' + iter + ' 状态 NaN: ' + bad.slice(0, 5).join(', ')); break; }
        } catch (e) { findings.push('iter' + iter + ' getState 抛错: ' + e.message); break; }
      }
    }
  }

  return { name: htmlName, hooks: hooks.length, advance: adv, findings };
}

// ---- 主流程 ----
const files = fs.readdirSync(GAMES_DIR)
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .sort();

let totalFindings = 0;
const report = [];
for (const f of files) {
  const r = runOne(f);
  if (r.findings && r.findings.length) {
    totalFindings += r.findings.length;
    report.push(r);
  }
}

console.log('=== 电池测试报告 ===');
console.log('扫描游戏数: ' + files.length + '  发现问题游戏数: ' + report.length + '  缺陷条目: ' + totalFindings);
console.log('');
for (const r of report) {
  console.log('■ ' + r.name + '  (hooks=' + (r.hooks || '?') + ', advance=' + JSON.stringify(r.advance || []) + ')');
  for (const fnd of r.findings) console.log('    - ' + fnd);
}
console.log('');
console.log('done.');
