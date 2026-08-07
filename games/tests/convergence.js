// games/tests/convergence.js
// 收敛闸门（convergence gate）：扫描全部游戏 HTML，断言前序重构成果不被回归破坏。
// 这是把“人工审计”固化成可自动执行的 CI 门禁 —— 任何未来提交若重新引入
// 裸 localStorage / 内联 :root / 裸 rAF 主循环 / 不引用 Common，都会在此处失败。
//
// 检查项：
//   1. rawLocalStorage  —— 游戏文件不得出现裸 localStorage
//                           （设计上仅 games/index.html 启动器与 tests/ 基建允许）
//   2. inlineTheme      —— 游戏文件不得出现内联 :root 主题（必须走 Common.injectTheme）
//   3. bareRaf          —— 不得出现裸 requestAnimationFrame(NAME()) 主循环（必须走 Common.Loop）
//   4. usingCommon      —— 每个游戏文件必须引用 Common（共享库）
//   5. rawRoundRect     —— 游戏内不得出现原生 roundRect 实现（必须委托 Common.roundRect），
//                          薄封装 function roundRect(...){ Common.roundRect(...) } 不含 arcTo，不算违规。
//
// 用法：node convergence.js   （退出码 0=通过，1=存在违规；可被 ci-check.js 调用）
const fs = require('fs');
const path = require('path');

const GAMES_DIR = path.join(__dirname, '..');          // games/
const EXCLUDE = new Set(['index.html']);                // 启动器：允许 localStorage 设置

function gameFiles() {
  return fs.readdirSync(GAMES_DIR)
    .filter(f => f.endsWith('.html') && !EXCLUDE.has(f))
    .map(f => path.join(GAMES_DIR, f));
}

// 裸 rAF 主循环：requestAnimationFrame(NAME 且不在 typeof 检查内
// 匹配典型的 requestAnimationFrame(loop)（传函数引用）与 requestAnimationFrame(loop()（立即调用）两种形态。
// typeof requestAnimationFrame!=='undefined' 守卫是 vm 沙箱友好的防御性写法，非违规。
function hasBareRaf(src) {
  const re = /requestAnimationFrame\(\s*[a-zA-Z_$][\w$]*/g;
  let m;
  while ((m = re.exec(src))) {
    const before = src.slice(Math.max(0, m.index - 48), m.index);
    if (/typeof\s+requestAnimationFrame/.test(before)) continue;
    return true;
  }
  return false;
}

function scan() {
  const issues = { rawLocalStorage: [], inlineTheme: [], bareRaf: [], notUsingCommon: [], rawRoundRect: [] };
  for (const file of gameFiles()) {
    const src = fs.readFileSync(file, 'utf8');
    const name = path.basename(file);
    if (src.includes('localStorage')) issues.rawLocalStorage.push(name);
    if (src.includes(':root')) issues.inlineTheme.push(name);
    if (hasBareRaf(src)) issues.bareRaf.push(name);
    if (!/\bCommon\b/.test(src)) issues.notUsingCommon.push(name);
    // 原生 roundRect 实现：函数体内含 arcTo（薄封装只调 Common.roundRect，不含 arcTo）
    if (/function\s+roundRect\s*\([^)]*\)\s*\{[^}]*arcTo/.test(src)) issues.rawRoundRect.push(name);
  }
  return issues;
}

function report(issues) {
  const lines = [];
  const checks = [
    ['游戏内裸 localStorage', issues.rawLocalStorage],
    ['游戏内联 :root 主题', issues.inlineTheme],
    ['裸 requestAnimationFrame 主循环', issues.bareRaf],
    ['未引用 Common 的游戏', issues.notUsingCommon],
    ['游戏内原生 roundRect 实现(未委托)', issues.rawRoundRect],
  ];
  let fail = 0;
  for (const [label, list] of checks) {
    if (list.length === 0) {
      lines.push('  ✓ ' + label + '：0');
    } else {
      fail++;
      lines.push('  ✗ ' + label + '：' + list.length + ' → ' + list.join(', '));
    }
  }
  return { lines, fail };
}

if (require.main === module) {
  const issues = scan();
  const { lines, fail } = report(issues);
  console.log('━━━ 收敛闸门 (convergence gate) ━━━');
  console.log(lines.join('\n'));
  if (fail === 0) {
    console.log('\n✓ 收敛闸门通过：前序重构成果无回归');
    process.exit(0);
  } else {
    console.error('\n✗ 收敛闸门失败：' + fail + ' 项违规');
    process.exit(1);
  }
}

module.exports = { scan, hasBareRaf, gameFiles, report };
