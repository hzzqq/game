/* ci-check.js — 一键质量门禁（本地 & CI 通用）
 *
 * 用法：node ci-check.js
 * 依次执行五道防线，任一失败整体退出码非 0：
 *   1. catalog 一致性（games/sync-catalog.js）        —— 大厅不许撒谎
 *   2. 收敛闸门（games/tests/convergence.js）          —— 锁死前序重构成果，防回归
 *      （含 deadCommonTool 不变量：零引用 Common 工具=死代码/水活，必须删除）
 *   3. 随机数/复制量审计（sync-catalog.js --audit）    —— 只生成报告，不阻断
 *   4. 全量逻辑回归（games/tests/logic/run.js）        —— 5000+ 断言全绿
 *   5. UI 集成冒烟（games/tests/ui-smoke.js, jsdom）   —— 验证退出按钮 iframe/直接打开
 *      两分支 + 大厅 #gameFrame 浮层接线；jsdom 缺失时优雅跳过
 */
const { spawnSync } = require('child_process');
const path = require('path');

const NODE = process.execPath;
const ROOT = __dirname;

function step(name, cwd, args, { gate = true } = {}) {
  console.log('\n━━━ ' + name + ' ━━━');
  const r = spawnSync(NODE, args, { cwd, stdio: 'inherit' });
  const ok = r.status === 0;
  if (!ok && gate) {
    console.error('\n✗ 门禁失败于「' + name + '」（退出码 ' + r.status + '）');
    process.exit(r.status || 1);
  }
  return ok;
}

const t0 = Date.now();
step('1/5 catalog 一致性', path.join(ROOT, 'games'), ['sync-catalog.js']);
step('2/5 收敛闸门（防回归 + 死代码不变量）', path.join(ROOT, 'games', 'tests'), ['convergence.js']);
step('3/5 随机数/复制量审计（报告，不阻断）', path.join(ROOT, 'games'), ['sync-catalog.js', '--audit'], { gate: false });
step('4/5 全量逻辑回归', path.join(ROOT, 'games', 'tests', 'logic'), ['run.js']);
step('5/5 UI 集成冒烟（jsdom）', path.join(ROOT, 'games', 'tests'), ['ui-smoke.js']);

console.log('\n✓ ci-check 全部通过（' + ((Date.now() - t0) / 1000).toFixed(1) + 's）');
