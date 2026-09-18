// games/tests/logic/mutation.js — 变异测试试点：量化「断言跑了但锁不住行为」的动态盲区
//
// 用法：
//   node mutation.js --game tetris,chess,royale,snake,2048
//   node mutation.js --game tetris --max-per-op 6   # 快速抽验
//
// 原理：对游戏内联脚本做小变异（<=↔<、>=↔>、===↔!==、true↔false，跳过注释/字符串），
// 生成变异副本（仓库根 __mut_tmp.html，避开 sync-catalog 的 games/*.html 扫描）+ 变异测试副本，
// 进程内执行测试（共享 harness 的 results 数组），统计：
//   killed   = 变异后有断言失败（测试锁住了该行为）
//   survived = 变异后断言仍全绿（测试未覆盖该行为 —— 真缺口候选）
//   crashed  = 变异导致抛异常（代码死了，非测试功劳，单独计数防 killed 虚高）
// 不入 run.js 聚合（非 *_test.js），不在 ci-check 跑（耗时）；属人工审计工具（audit 先例）。
const fs = require('fs');
const path = require('path');
const Module = require('module');
const H = require('./harness');

const GAMES_DIR = path.resolve(__dirname, '..', '..');
const TMP_HTML = path.resolve(GAMES_DIR, '..', '__mut_tmp.html'); // e:\project\game\__mut_tmp.html
const REL_TMP = '../../__mut_tmp.html';

// ---- 引号/注释感知掩码：masked[i]=1 表示该字符位于注释或字符串内 ----
function buildMask(src) {
  const mask = new Uint8Array(src.length);
  let i = 0;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') mask[i++] = 1; }
    else if (c === '/' && d === '*') {
      mask[i] = 1; mask[i + 1] = 1; i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) mask[i++] = 1;
      if (i < src.length) { mask[i] = 1; mask[i + 1] = 1; i += 2; }
    } else if (c === "'" || c === '"' || c === '`') {
      const q = c; mask[i++] = 1;
      while (i < src.length) {
        if (src[i] === '\\') { mask[i] = 1; mask[i + 1] = 1; i += 2; continue; }
        mask[i] = 1;
        if (src[i] === q) { i++; break; }
        i++;
      }
    } else i++;
  }
  return mask;
}

// ---- 变异点收集 ----
// 双字符算子优先占位，单字符跳过已占位区间；true/false 词边界。
const OPS = [
  { name: 'le->lt', re: /<=/g, to: '<' },
  { name: 'lt->le', re: /</g, to: '<=', single: true },
  { name: 'ge->gt', re: />=/g, to: '>' },
  { name: 'gt->ge', re: />/g, to: '>=', single: true },
  { name: 'seq->sne', re: /===/g, to: '!==' },
  { name: 'sne->seq', re: /!==/g, to: '===' },
  { name: 'boolflip', re: /\b(?:true|false)\b/g, to: null }, // 逐点取反
];
function collectSites(src, mask, maxPerOp) {
  const sites = [];
  const taken = new Uint8Array(src.length);
  for (const op of OPS) {
    let pts = [];
    let m;
    const re = new RegExp(op.re.source, 'g');
    while ((m = re.exec(src)) !== null) {
      const s = m.index, e = s + m[0].length;
      if (mask[s] || mask[e - 1]) continue;
      if (op.single && taken[s]) continue; // 已被 <=/>=/==/===/!= 占位
      if (op.single && (src[s - 1] === '=' || src[e] === '=')) continue; // =>、>=、<= 邻接
      pts.push({ s, e });
    }
    if (pts.length > maxPerOp) {
      const stride = pts.length / maxPerOp;
      pts = pts.filter((_, k) => k % 1 < 1 && (k === 0 || k % Math.round(stride) === 0)).slice(0, maxPerOp);
    }
    for (const p of pts) {
      for (let k = p.s; k < p.e; k++) taken[k] = 1;
      sites.push({ ...p, op });
    }
  }
  return sites;
}

// ---- 同 harness 口径提取最大内联脚本（返回 {code, start, end}，便于写回副本）----
function extractInline(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m, best = null;
  while ((m = re.exec(html)) !== null) {
    if (!best || m[1].length > best.code.length) best = { code: m[1], start: m.index + m[0].indexOf(m[1]), end: m.index + m[0].indexOf(m[1]) + m[1].length };
  }
  if (!best) throw new Error('未找到内联 <script>');
  return best;
}

function runGame(game, maxPerOp) {
  const htmlPath = path.join(GAMES_DIR, game + '.html');
  const testPath = path.join(__dirname, game + '_test.js');
  if (!fs.existsSync(htmlPath) || !fs.existsSync(testPath)) {
    console.log('跳过 ' + game + '（缺 html 或 test）');
    return null;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const inline = extractInline(html);
  const mask = buildMask(inline.code);
  const sites = collectSites(inline.code, mask, maxPerOp);
  const testSrc = fs.readFileSync(testPath, 'utf8');
  const loadRe = new RegExp('([\'"`])\\.\\./' + game + '\\.html\\1');
  if (!loadRe.test(testSrc)) { console.log('跳过 ' + game + '（测试未直接 loadGame 该文件）'); return null; }
  const mutTestSrc = testSrc.replace(new RegExp('([\'"`])\\.\\./' + game + '\\.html\\1', 'g'), '$1' + REL_TMP + '$1');
  const virtRequire = Module.createRequire(path.join(__dirname, 'x.js'));

  let killed = 0, survived = 0, crashed = 0;
  const survivors = [];
  try {
    for (let k = 0; k < sites.length; k++) {
      const site = sites[k];
      const orig = inline.code.slice(site.s, site.e);
      const mut = site.op.name === 'boolflip' ? (orig === 'true' ? 'false' : 'true') : site.op.to;
      const mutCode = inline.code.slice(0, site.s) + mut + inline.code.slice(site.e);
      const mutHtml = html.slice(0, inline.start) + mutCode + html.slice(inline.end);
      fs.writeFileSync(TMP_HTML, mutHtml);
      H.results.length = 0;
      let fail = 0, crash = false;
      // 测试文件尾部自检 process.exit(1) 是进程级——进程内执行时必须拦截为 no-op，
      // 否则变异失败会终止整个 runner（实测 royale_test 在 19 变异中途杀掉进程）；判定只看 H.results
      const safeTestSrc = mutTestSrc.replace(/\bprocess\.exit\s*\(/g, '__mutNoExit(');
      try {
        const fn = new Function('require', 'module', 'exports', '__filename', '__dirname', '__mutNoExit', safeTestSrc);
        fn(virtRequire, { exports: {} }, {}, testPath, __dirname, function () {});
        fail = H.results.filter(r => !r.pass).length;
      } catch (e) { crash = true; }
      if (crash) { crashed++; continue; }
      if (fail > 0) { killed++; continue; }
      survived++;
      const ctxFrom = Math.max(0, site.s - 40);
      survivors.push('[' + site.op.name + '] ' + JSON.stringify(inline.code.slice(ctxFrom, site.e + 40)).replace(mut, '»' + mut + '«'));
      process.stdout.write('.');
    }
  } finally {
    if (fs.existsSync(TMP_HTML)) fs.unlinkSync(TMP_HTML);
  }
  console.log('');
  console.log('== ' + game + ' == 变异点 ' + sites.length + '：killed ' + killed + ' ｜ survived ' + survived + ' ｜ crashed ' + crashed + ' ｜ 存活率 ' + (survived / Math.max(1, sites.length) * 100).toFixed(1) + '%');
  survivors.forEach(s => console.log('   SURVIVED ' + s));
  return { game, sites: sites.length, killed, survived, crashed, survivors };
}

// ---- 入口 ----
const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const games = (argOf('--game', 'tetris,chess,royale,snake,2048')).split(',').map(s => s.trim()).filter(Boolean);
const maxPerOp = parseInt(argOf('--max-per-op', '10'), 10);
const report = [];
for (const g of games) {
  const r = runGame(g, maxPerOp);
  if (r) report.push(r);
}
const tot = report.reduce((a, r) => ({ sites: a.sites + r.sites, killed: a.killed + r.killed, survived: a.survived + r.survived, crashed: a.crashed + r.crashed }), { sites: 0, killed: 0, survived: 0, crashed: 0 });
console.log('\n==== 汇总（' + report.length + ' 款）====');
console.log('变异点 ' + tot.sites + '：killed ' + tot.killed + ' ｜ survived ' + tot.survived + ' ｜ crashed ' + tot.crashed);
console.log('总体存活率 ' + (tot.survived / Math.max(1, tot.sites) * 100).toFixed(1) + '%（crash 不计入测试功劳）');
