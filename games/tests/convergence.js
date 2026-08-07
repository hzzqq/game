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
//   6. deadCommonTool   —— common.js 导出的每个 Common.X 必须在全库有 ≥1 处“外部”引用
//                          （仅自身定义、零引用的工具 = 死代码/水活，必须删除或补消费者；
//                           防止未来再出现 A 系列式零消费者工具）。定义行本身计 1 次，
//                          故 _cnt<=1 即“只有定义、无外部消费者”。
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
  const issues = { rawLocalStorage: [], inlineTheme: [], bareRaf: [], notUsingCommon: [], rawRoundRect: [], deadCommonTool: [] };
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
  // 死代码检测：common.js 导出的每个 Common.X 必须在全库有 ≥1 处外部引用
  // （仅定义自身、零引用的工具 = 死代码/水活，必须删除或补消费者；防止未来再出现 A 系列式零消费者工具）
  var _cSrc = fs.readFileSync(path.join(GAMES_DIR, 'common.js'), 'utf8');
  var _tools = []; var _m; var _re2 = /Common\.([A-Za-z_$][\w$]*)\s*=/g;
  while ((_m = _re2.exec(_cSrc))) _tools.push(_m[1]);
  var _all = (function w(d){ var o=[]; var fl=fs.readdirSync(d); for(var i=0;i<fl.length;i++){ var p=path.join(d,fl[i]); var st=fs.statSync(p); if(st.isDirectory()) o=o.concat(w(p)); else if(fl[i].endsWith('.html')||fl[i].endsWith('.js')) o.push(p); } return o; })(GAMES_DIR);
  for (var _k=0;_k<_tools.length;_k++){
    var _t=_tools[_k];
    // 注意：'\b' 在 JS 字符串里是退格符而非单词边界，故用负向预查 (?![\w$]) 代替，
    // 并转义工具名中的 $ 以防被当作正则元字符。
    var _re=new RegExp('Common\\.'+_t.replace(/\$/g,'\\$')+'(?![\\w$])','g');
    var _cnt=0;
    for (var _j=0;_j<_all.length;_j++){ var _ss=fs.readFileSync(_all[_j],'utf8'); var _mm=_ss.match(_re); if(_mm) _cnt+=_mm.length; }
    if (_cnt<=1) issues.deadCommonTool.push('Common.'+_t);
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
    ['Common 工具零引用(死代码/水活)', issues.deadCommonTool],
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
