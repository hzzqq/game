/* metrics-report.js — 项目度量报告生成器
 *
 * 用法：node metrics-report.js
 * 读取 games/ 与 games/audit-random.json（若无则提示先跑 audit），输出：
 *   - METRICS.md（人读）
 *   - metrics.json（机读，可供 CI 趋势对比）
 * 度量维度：游戏数 / 测试与断言数 / Common 采用率 / 代码行数分布 / 复制量热点。
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const GAMES = path.join(ROOT, 'games');
const AUDIT = path.join(GAMES, 'audit-random.json');
const SUPPORT = new Set(['index.html', 'catalog.js', 'common.js', 'input.js', 'juice.js']);

if (!fs.existsSync(AUDIT)) {
  console.error('缺少 games/audit-random.json，先跑：node games/sync-catalog.js --audit');
  process.exit(1);
}
const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'));

/* ---------- 行数分布 ---------- */
const files = fs.readdirSync(GAMES).filter(f => f.endsWith('.html') && !SUPPORT.has(f));
const locs = files.map(f => ({
  file: f,
  loc: fs.readFileSync(path.join(GAMES, f), 'utf8').split('\n').length
})).sort((a, b) => b.loc - a.loc);
const totalLoc = locs.reduce((n, x) => n + x.loc, 0);
const buckets = { '<500': 0, '500-1000': 0, '1000-2000': 0, '>2000': 0 };
for (const { loc } of locs) {
  if (loc < 500) buckets['<500']++;
  else if (loc < 1000) buckets['500-1000']++;
  else if (loc < 2000) buckets['1000-2000']++;
  else buckets['>2000']++;
}

/* ---------- 测试断言数（跑一次 run.js 抓汇总行） ---------- */
const run = spawnSync(process.execPath, ['run.js'], { cwd: path.join(GAMES, 'tests', 'logic'), encoding: 'utf8' });
const m = (run.stdout || '').match(/(\d+)\s*个测试文件\s*·\s*(\d+)\/(\d+)\s*通过/);
const tests = m ? { files: +m[1], passed: +m[2], total: +m[3], green: m[2] === m[3] } : null;

/* ---------- 汇总 ---------- */
const s = audit.summary;
const metrics = {
  generatedAt: new Date().toISOString(),
  games: files.length,
  totalHtmlLoc: totalLoc,
  avgLocPerGame: Math.round(totalLoc / files.length),
  locBuckets: buckets,
  top5Largest: locs.slice(0, 5),
  tests,
  commonAdoption: {
    usingCommon: s.gamesUsingCommon,
    adoptionPct: +(s.gamesUsingCommon / s.gamesScanned * 100).toFixed(1),
    logicNakedRandom: s.gamesLogicNakedRandom,
    inlineTheme: s.gamesWithInlineTheme,
    diffbar: s.gamesWithDiffbar,
    rafLoop: s.gamesWithRAF
  },
  testability: {
    withHooks: s.gamesWithTestHooks,
    withLogicTest: s.gamesWithLogicTest,
    avgHookFns: s.avgHookFnsPerGame
  }
};
fs.writeFileSync(path.join(ROOT, 'metrics.json'), JSON.stringify(metrics, null, 2));

const md = `# 项目度量报告

> 生成时间：${metrics.generatedAt}（由 \`node metrics-report.js\` 自动生成，勿手改）

## 总览

| 指标 | 数值 |
| --- | --- |
| 游戏数 | ${metrics.games} |
| HTML 总行数 | ${totalLoc.toLocaleString()} |
| 平均行数/款 | ${metrics.avgLocPerGame} |
| 测试文件 | ${tests ? tests.files : '?'} |
| 断言通过 | ${tests ? tests.passed + '/' + tests.total + (tests.green ? '（全绿）' : '（有红！）') : '?'} |

## Common 共享库采用率

| 指标 | 数值 |
| --- | --- |
| 已用 Common.* | ${s.gamesUsingCommon}/${s.gamesScanned}（${metrics.commonAdoption.adoptionPct}%） |
| 逻辑裸 Math.random | ${s.gamesLogicNakedRandom} 款 |
| 内联主题（待收口 injectTheme） | ${s.gamesWithInlineTheme} 款 |
| 手写 diffbar（待收口 buildDiffBar） | ${s.gamesWithDiffbar} 款 |
| 手写 rAF 循环（待收口 Loop） | ${s.gamesWithRAF} 款 |

## 可测性

| 指标 | 数值 |
| --- | --- |
| 有 window.__t 钩子 | ${s.gamesWithTestHooks}/${s.gamesScanned} |
| 有逻辑测试 | ${s.gamesWithLogicTest}/${s.gamesScanned} |
| 平均钩子函数 | ${s.avgHookFnsPerGame} 个/款 |

## 体积分布

| 区间 | 款数 |
| --- | --- |
| < 500 行 | ${buckets['<500']} |
| 500–1000 行 | ${buckets['500-1000']} |
| 1000–2000 行 | ${buckets['1000-2000']} |
| > 2000 行 | ${buckets['>2000']} |

**最大 5 款**：${locs.slice(0, 5).map(x => `${x.file}（${x.loc} 行）`).join('、')}

## 配套命令

\`\`\`bash
node ci-check.js                      # 一键门禁：一致性 + 审计 + 全量回归
node games/sync-catalog.js            # 大厅一致性检查
node games/sync-catalog.js --audit    # 随机数/复制量审计
node metrics-report.js                # 重新生成本报告
\`\`\`
`;
fs.writeFileSync(path.join(ROOT, 'METRICS.md'), md);
console.log('✓ 已生成 METRICS.md + metrics.json');
console.log(JSON.stringify(metrics.commonAdoption, null, 2));
if (tests) console.log('测试：' + tests.files + ' 文件 · ' + tests.passed + '/' + tests.total);
