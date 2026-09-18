/* games/sync-catalog.js — 校验/补齐 games/catalog.js 与磁盘游戏文件的一致性
 *
 * 锐评落地：此前大厅卡片是 165 张手写 HTML，任何一次「加游戏 / 改名 /
 * 删除」只要忘了同步大厅，大厅就会 silently 撒谎（指向不存在的文件，或漏掉
 * 新游戏）。本脚本把 catalog.js 当成唯一事实源，并对照 games/*.html 校验：
 *
 *   node sync-catalog.js            # 仅检查，打印漂移报告（CI 可用）
 *   node sync-catalog.js --scaffold # 为缺失的游戏自动补齐 catalog 条目
 *
 * 退出码：有漂移且非 --scaffold 时为 1（可在 CI 中阻断）。
 */
const fs = require('fs');
const path = require('path');

const GAMES_DIR = __dirname;
const CATALOG = path.join(GAMES_DIR, 'catalog.js');
const SUPPORT = new Set(['index.html', 'catalog.js', 'common.js', 'input.js', 'juice.js']);

function loadCatalog() {
  const code = fs.readFileSync(CATALOG, 'utf8');
  const win = {};
  // catalog.js 形如 window.GAME_CATALOG = [...]; 在受限环境里求值
  const fn = new Function('window', code + '\nreturn window.GAME_CATALOG;');
  return fn(win) || [];
}

function gameFiles() {
  return fs.readdirSync(GAMES_DIR)
    .filter(f => f.endsWith('.html') && !SUPPORT.has(f))
    .sort();
}

function titleOf(file) {
  const s = fs.readFileSync(path.join(GAMES_DIR, file), 'utf8');
  const m = s.match(/<title>([^<]*)<\/title>/i);
  if (!m) return file.replace(/\.html$/, '');
  return m[1].replace(/TERMINAL\s*\/\/\s*/i, '').trim() || file;
}

/* ---------- 锐评待办#2：裸 Math.random / 本地 PRNG 检测器 ----------
 *   node sync-catalog.js --audit
 * 扫描全部游戏的内联脚本（剥离注释后），统计：
 *   - 裸 Math.random 调用数（spec 铁律 #7 禁止进逻辑）
 *   - mulberry32 定义 / 调用站点
 *   - 是否已改用 Common.*
 *   - 其它本地 PRNG 助手（rng/rand/randInt/mk/prng...）候选
 * 输出 games/audit-random.json + 控制台汇总，供 CI 与批量迁移参考。 */
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')   // 块注释
    .replace(/\/\/[^\n]*/g, ' ');            // 行注释
}
function auditRandom() {
  const report = { generatedAt: new Date().toISOString(), games: [] };
  let totalMath = 0, defMul = 0, usesCommon = 0, usesCommonCount = 0, otherCount = 0;
  let cTheme = 0, cDiffbar = 0, cRAF = 0, cLogicNaked = 0;
  let cHooks = 0, cTested = 0, totalHookFns = 0;
  const TESTS_DIR_A = path.join(GAMES_DIR, 'tests', 'logic');
  const THEME_RE = /(?:--bg|--panel|--border|--line)\s*:/;
  const DIFFBAR_RE = /class\s*=\s*["'][^"']*diffbar|data-d\s*=|难度/i;
  for (const f of gameFiles()) {
    const raw = fs.readFileSync(path.join(GAMES_DIR, f), 'utf8');
    // 取最大的内联 <script>（与 harness 一致），外部 src 脚本不计
    const scripts = [...raw.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    const code = scripts.sort((a, b) => b.length - a.length)[0] || '';
    const clean = stripComments(code);
    const mathCount = (clean.match(/Math\.random/g) || []).length;
    const hasMulDef = /(?:function|const|let|var|=>)\s*mulberry32\s*(?:\(|=)/.test(clean);
    const mulCalls = (clean.match(/mulberry32\s*\(/g) || []).length;
    usesCommon = /Common\s*\.\s*(mulberry32|lcg|range|Loop|buildDiffBar|injectTheme|confetti|shuffle|clamp|lerp|DIFFICULTY)/.test(raw);
    const hasInlineTheme = THEME_RE.test(raw) && /<style[\s\S]*:root/.test(raw);
    // T-121 口径修正：手写 diffbar = 有痕迹且未委托 Common.buildDiffBar（否则用共享版的也因有容器被误计）
    const hasDiffbar = DIFFBAR_RE.test(raw) && !/Common\.buildDiffBar/.test(raw);
    // 只统计真实调用 requestAnimationFrame(...)；排除 typeof 环境守卫（harness 兼容写法）
    const hasRAF = /(?<!typeof\s)requestAnimationFrame\s*\(/.test(clean);
    const logicNaked = mathCount > 0 && !usesCommon;
    // 本地 PRNG / 随机助手：扩宽名表，逐一定性（auto / wrapper / overload / review）
    const HELPER_RE = /(?:function|const|let|var)\s*(rng|rand|randInt|rngInt|prng|seedRng|lcg|mk)\s*=\s*(?:function|\(|[^;]+=>)|function\s*(rng|rand|lcg)\s*\(/g;
    const helpers = [...clean.matchAll(HELPER_RE)].map(m => m[1] || m[2]);
    const classified = [...new Set(helpers)].map(name => {
      const m = clean.match(new RegExp('(?:function|const|let|var)\\s*' + name + '\\s*[=(][\\s\\S]{0,140}'));
      const body = m ? m[0] : '';
      let kind = 'review';
      if (/0x6D2B79F5|1664525/.test(body)) kind = 'auto';        // mulberry32 / lcg 已知常数 → 与 Common 等价
      else if (/Math\.random/.test(body)) kind = 'wrapper';        // 包 Math.random 的区间映射 → 可改用 Common.range
      if (name === 'mk' && /const mk=\s*\(kind/.test(clean)) kind = 'overload'; // royale 式 mk 被重载（造塔），需手动
      return { name, kind };
    });
    // 测试钩子覆盖率：window.__t 暴露的函数数 + 是否有配套 *_test.js
    const hasHooks = /window\.__t\s*=/.test(clean);
    const hookBlock = hasHooks ? (clean.match(/window\.__t\s*=\s*\{[\s\S]*?\n\s*\}/) || [''])[0] : '';
    const hookFns = hasHooks ? (hookBlock.match(/^\s*[A-Za-z_$][\w$]*\s*[:(]/gm) || []).length : 0;
    const hasTest = fs.existsSync(path.join(TESTS_DIR_A, f.replace(/\.html$/, '_test.js')));
    if (hasHooks) { cHooks++; totalHookFns += hookFns; }
    if (hasTest) cTested++;
    if (mathCount) totalMath += mathCount;
    if (hasMulDef) defMul++;
    if (usesCommon) usesCommonCount++;
    if (classified.length) otherCount += classified.length;
    if (hasInlineTheme) cTheme++;
    if (hasDiffbar) cDiffbar++;
    if (hasRAF) cRAF++;
    if (logicNaked) cLogicNaked++;
    report.games.push({ file: f, mathRandom: mathCount, mulberryDef: hasMulDef, mulberryCalls: mulCalls, usesCommon, hasInlineTheme, hasDiffbar, hasRAF, logicNakedRandom: logicNaked, testHooks: hasHooks, hookFnCount: hookFns, hasLogicTest: hasTest, localPrngHelpers: classified });
  }
  const withHelpers = report.games.filter(g => g.localPrngHelpers.length);
  report.checklist = withHelpers.map(g => ({
    file: g.file,
    helpers: g.localPrngHelpers,
    autoMigratable: g.localPrngHelpers.every(h => h.kind === 'auto'),
    note: g.localPrngHelpers.some(h => h.kind === 'overload')
      ? 'mk 被重载（非 PRNG 用途），需手动拆分后再迁移'
      : g.localPrngHelpers.some(h => h.kind === 'wrapper')
        ? '区间映射包着 Math.random，建议改用 Common.range(a,b,rnd)'
        : g.localPrngHelpers.some(h => h.kind === 'auto')
          ? '与 Common.mulberry32 / Common.lcg 等价，可零风险收口'
          : '需人工复核算法'
  }));
  report.summary = {
    gamesScanned: report.games.length,
    totalNakedMathRandom: totalMath,
    gamesWithMulberryDef: defMul,
    gamesUsingCommon: usesCommonCount,
    gamesWithLocalPrngHelpers: withHelpers.length,
    autoEquivalentHelpers: withHelpers.reduce((n, g) => n + g.localPrngHelpers.filter(h => h.kind === 'auto').length, 0),
    overloadMkGames: report.checklist.filter(c => /重载/.test(c.note)).length,
    wrapperRandGames: report.checklist.filter(c => /Common\.range/.test(c.note)).length,
    gamesWithInlineTheme: cTheme,
    gamesWithDiffbar: cDiffbar,
    gamesWithRAF: cRAF,
    gamesLogicNakedRandom: cLogicNaked,
    gamesWithTestHooks: cHooks,
    gamesWithLogicTest: cTested,
    avgHookFnsPerGame: cHooks ? +(totalHookFns / cHooks).toFixed(1) : 0
  };
  const out = path.join(GAMES_DIR, 'audit-random.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log('🔍 裸随机/PRNG + 复制量审计报告 → ' + out);
  console.log(JSON.stringify(report.summary, null, 2));
  const violators = report.games.filter(g => g.mathRandom > 0 && !g.usesCommon);
  console.log('⚠ 裸 Math.random 且未用 Common 的游戏：' + violators.length + ' 款');
  console.log('📊 复制量：内联主题 ' + cTheme + ' ｜ diffbar 难度条 ' + cDiffbar + ' ｜ requestAnimationFrame ' + cRAF);
  console.log('🧪 可测性：__t 钩子 ' + cHooks + '/' + report.games.length + ' ｜ 有逻辑测试 ' + cTested + '/' + report.games.length + ' ｜ 平均钩子函数 ' + report.summary.avgHookFnsPerGame + ' 个/款');
  return report;
}
if (process.argv.includes('--audit')) { auditRandom(); process.exit(0); }

const scaffold = process.argv.includes('--scaffold');
const list = loadCatalog();
const byFile = new Map(list.map(e => [e.file, e]));
const files = gameFiles();

let problems = 0;
const orphans = list.filter(e => e.file && !fs.existsSync(path.join(GAMES_DIR, e.file)));
const missing = files.filter(f => !byFile.has(f));

if (orphans.length) {
  problems += orphans.length;
  console.log('⚠ 大厅指向不存在的文件（orphan）：');
  orphans.forEach(e => console.log('   - ' + e.file + (e.name ? ' (' + e.name + ')' : '')));
}
if (missing.length) {
  problems += missing.length;
  console.log('⚠ 磁盘上有游戏但未在大厅（missing）：');
  missing.forEach(f => console.log('   - ' + f));
}

// 一致性防线：引用 Common.* 但未加载 common.js 脚本
// （迁移后的游戏若忘了 <script src="common.js">，浏览器里会 ReferenceError 崩）
const COMMON_RE = /Common\s*\.\s*(mulberry32|Loop|buildDiffBar|injectTheme|confetti|range|lcg|shuffle|clamp|lerp|DIFFICULTY)/;
const noTag = files.filter(f => {
  const raw = fs.readFileSync(path.join(GAMES_DIR, f), 'utf8');
  return COMMON_RE.test(raw) && !/common\.js/.test(raw);
});
if (noTag.length) {
  problems += noTag.length;
  console.log('⚠ 引用 Common.* 但未加载 common.js 脚本（浏览器会崩）：');
  noTag.forEach(f => console.log('   - ' + f));
}

// 测试孤儿防线：tests/logic/*_test.js 与 games/*.html 双向对照
// （删游戏忘删测试 → 测试孤儿会让 run.js 报「加载失败」；加游戏忘写测试 → 逻辑无回归保护）
const TESTS_DIR = path.join(GAMES_DIR, 'tests', 'logic');
if (fs.existsSync(TESTS_DIR)) {
  const testFiles = fs.readdirSync(TESTS_DIR).filter(f => f.endsWith('_test.js'));
  const testStems = testFiles.map(f => f.replace(/_test\.js$/, ''));
  const gameStems = new Set(files.map(f => f.replace(/\.html$/, '')));
  // demo 参考实现的测试指向 games/demo/，单独放行；
  // common_test 是 Common 共享库的测试，本就无对应游戏 html，同样放行
  // （注意：common_test.js 去后缀后的 stem 是 'common'，不是 'common_test'）；
  // convergence_test 是收敛门禁行为锁（games/tests/convergence.js 的单测），同样无游戏 html
  const EXEMPT_TESTS = new Set(['demo_common', 'demo_toolkit', 'common', 'convergence']);
  const orphanTests = testStems.filter(s => !gameStems.has(s) && !EXEMPT_TESTS.has(s));
  const untested = [...gameStems].filter(s => !testStems.includes(s)).sort();
  if (orphanTests.length) {
    problems += orphanTests.length;
    console.log('⚠ 测试孤儿（对应游戏 html 不存在）：');
    orphanTests.forEach(s => console.log('   - tests/logic/' + s + '_test.js'));
  }
  if (untested.length) {
    // 仅警告不计入 problems（存量项目允许渐进补测试），但要可见
    console.log('ℹ 无逻辑测试的游戏（' + untested.length + ' 款，建议渐进补齐）：' +
      untested.slice(0, 10).join(', ') + (untested.length > 10 ? ' …' : ''));
  }
}

if (missing.length && scaffold) {
  console.log('\n🔧 --scaffold：补齐 ' + missing.length + ' 条…');
  missing.forEach(f => {
    list.push({ file: f, cat: 'solo', html:
      '<span class="tag">新接入</span>\n<h2>' + titleOf(f) + '</h2>\n' +
      '<div class="desc">（待补全描述）</div>\n<div class="key">▸ 见游戏内说明</div>' });
  });
  fs.writeFileSync(CATALOG, 'window.GAME_CATALOG = ' + JSON.stringify(list, null, 2) + ';\n');
  console.log('✓ 已写入 games/catalog.js（' + list.length + ' 条）');
}

console.log('\n目录游戏数：' + files.length + ' ｜ catalog 条目：' + list.length);
if (list.length !== files.length) {
  console.log('⚠ 数量不一致（catalog ' + list.length + ' ≠ 磁盘 ' + files.length + '，上面应已逐条列出）');
}
if (problems === 0) {
  console.log('✓ 一致，无漂移。');
  process.exit(0);
} else {
  console.log('✗ 发现 ' + problems + ' 处漂移。');
  process.exit(scaffold ? 0 : 1);
}
