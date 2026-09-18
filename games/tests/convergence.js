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
//   7. getByIdSelector  —— getElementById 型 DOM 助手（$ 封装 / 直接调用）不得传选择器样式参数
//                          （含空格/#前缀/.类名 等）。$ = getElementById 封装时 $('overlay h1')
//                          恒 null —— words 游戏结算逻辑因此静默崩溃数月，vm 沙箱
//                          （getElementById 恒返 fakeEl）结构性抓不到，只能静态扫描。
//   8. hOkReversed      —— tests/logic 断言不得反参：H.ok(cond, 'name') 把字符串当条件恒真、
//                          布尔当名字 = 假覆盖（harness 签名 ok(name, cond)）。历史上 5 批文件
//                          同雷共 270+ 处，全部对调修复；此不变量防再犯。
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

// ---- 检查 7：getElementById 型 DOM 助手误传选择器样式参数（words 教训）----
// 纯 id 字样（HTML5 id 实践形态）：字母/下划线开头，后接字母数字_-。
// 含空格 / # 前缀 / . 类名 / [ / > / : 均为选择器语义，getElementById 必然恒 null。
const _PURE_ID = /^[A-Za-z_][\w-]*$/;

function _isGetByIdDollar(src) {
  // function $(id){ ... document.getElementById(id) ... } 或 const $=id=>document.getElementById(id)
  return /function\s*\$\s*\([^)]*\)\s*\{[^}]*getElementById/.test(src) ||
         /\$\s*=\s*\(?[\w$]*\)?\s*=>\s*document\.getElementById/.test(src);
}

function findGetByIdSelectorAbuse(src) {
  const hits = [];
  // (a) $ 助手调用：仅当本文件 $ 是 getElementById 型（querySelector 型 $ 传选择器合法）
  if (_isGetByIdDollar(src)) {
    const re = /\$\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*\)/g;
    let m;
    while ((m = re.exec(src))) {
      if (!_PURE_ID.test(m[2])) hits.push("$('" + m[2] + "')");
    }
  }
  // (b) 直接 document.getElementById('...') 调用（无论 $ 类型，一律检查）
  const re2 = /document\.getElementById\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*\)/g;
  let m2;
  while ((m2 = re2.exec(src))) {
    if (!_PURE_ID.test(m2[2])) hits.push("getElementById('" + m2[2] + "')");
  }
  return hits;
}

// ---- 检查 8：H.ok 反参恒真（假覆盖）----
// 括号深度 + 引号感知解析：提取 H.ok(...) 的两个顶层参数，第一参非引号开头、
// 第二参引号开头 = 反参毒。三参调用（name-first 带 info）不误伤。
function _parseTopLevelArgs(src, startIdx) {
  // startIdx 指向 '(' 后第一个字符；返回 { args:[{start,end}], endIdx } 或 null
  let depth = 1, inS = null, esc = false;
  const args = [];
  let argStart = startIdx;
  for (let k = startIdx; k < src.length; k++) {
    const c = src[k];
    if (inS) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === inS) inS = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inS = c; continue; }
    if (c === '(' || c === '[' || c === '{') { depth++; continue; }
    if (c === ')' || c === ']' || c === '}') {
      depth--;
      if (depth === 0) { args.push({ start: argStart, end: k }); return { args, endIdx: k }; }
      continue;
    }
    if (c === ',' && depth === 1) { args.push({ start: argStart, end: k }); argStart = k + 1; }
  }
  return null;
}

function findHOkReversed(src) {
  const hits = [];
  let i = 0;
  for (;;) {
    const j = src.indexOf('H.ok(', i);
    if (j < 0) break;
    const parsed = _parseTopLevelArgs(src, j + 5);
    if (!parsed) break;
    const { args, endIdx } = parsed;
    if (args.length === 2) {
      const a1 = src.slice(args[0].start, args[0].end).trim();
      const a2 = src.slice(args[1].start, args[1].end).trim();
      if (a1 && a2 && a1[0] !== "'" && a1[0] !== '"' && a1[0] !== '`' &&
          (a2[0] === "'" || a2[0] === '"' || a2[0] === '`')) {
        hits.push('H.ok(' + a1.slice(0, 40) + ', ' + a2.slice(0, 40) + ')');
      }
    }
    i = endIdx + 1;
  }
  return hits;
}

function scan() {
  const issues = { rawLocalStorage: [], inlineTheme: [], bareRaf: [], notUsingCommon: [], rawRoundRect: [], deadCommonTool: [], getByIdSelector: [], hOkReversed: [] };
  for (const file of gameFiles()) {
    const src = fs.readFileSync(file, 'utf8');
    const name = path.basename(file);
    if (src.includes('localStorage')) issues.rawLocalStorage.push(name);
    if (src.includes(':root')) issues.inlineTheme.push(name);
    if (hasBareRaf(src)) issues.bareRaf.push(name);
    if (!/\bCommon\b/.test(src)) issues.notUsingCommon.push(name);
    // 原生 roundRect A实现：函数体内含 arcTo（薄封装只调 Common.roundRect，不含 arcTo）
    if (/function\s+roundRect\s*\([^)]*\)\s*\{[^}]*arcTo/.test(src)) issues.rawRoundRect.push(name);
    for (const hit of findGetByIdSelectorAbuse(src)) issues.getByIdSelector.push(name + ' → ' + hit);
  }
  // 门户启动器（根目录 index.html）也纳入裸存储检查：即便当前干净，也防止未来有人裸用本地存储。
  // 注意：门户不引用 Common、不是游戏，故 notUsingCommon / bareRaf / rawRoundRect 不针对它。
  const portal = path.join(GAMES_DIR, '..', 'index.html');
  try {
    const ps = fs.readFileSync(portal, 'utf8');
    if (ps.includes('localStorage')) issues.rawLocalStorage.push('../index.html');
  } catch (e) { /* 不存在则跳过 */ }
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
  // 检查 8：tests/logic 断言反参恒真（假覆盖）
  var _logicDir = path.join(__dirname, 'logic');
  var _testFiles = fs.readdirSync(_logicDir).filter(function(f){ return /_test\.js$/.test(f); });
  for (var _i=0;_i<_testFiles.length;_i++){
    var _tf = _testFiles[_i];
    var _ts = fs.readFileSync(path.join(_logicDir, _tf), 'utf8');
    for (const _h of findHOkReversed(_ts)) issues.hOkReversed.push(_tf + ' → ' + _h);
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
    ['DOM 助手误传选择器(getElementById 型)', issues.getByIdSelector],
    ['测试断言反参恒真 H.ok(cond, name)', issues.hOkReversed],
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

module.exports = { scan, hasBareRaf, gameFiles, report, findGetByIdSelectorAbuse, findHOkReversed };
