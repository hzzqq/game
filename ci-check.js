/* ci-check.js — 一键质量门禁（本地 & CI 通用）
 *
 * 用法：node ci-check.js
 * 依次执行四道防线，任一失败整体退出码非 0：
 *   1. catalog 一致性（games/sync-catalog.js）        —— 大厅不许撒谎
 *   2. 收敛闸门（games/tests/convergence.js）          —— 锁死前序重构成果，防回归
 *   3. 随机数/复制量审计（sync-catalog.js --audit）    —— 只生成报告，不阻断
 *   4. 全量逻辑回归（games/tests/logic/run.js）        —— 5000+ 断言全绿
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
step('1/4 catalog 一致性', path.join(ROOT, 'games'), ['sync-catalog.js']);
step('2/4 收敛闸门（防回归）', path.join(ROOT, 'games', 'tests'), ['convergence.js']);
step('3/4 随机数/复制量审计（报告，不阻断）', path.join(ROOT, 'games'), ['sync-catalog.js', '--audit'], { gate: false });
step('4/4 全量逻辑回归', path.join(ROOT, 'games', 'tests', 'logic'), ['run.js']);

console.log('\n✓ ci-check 全部通过（' + ((Date.now() - t0) / 1000).toFixed(1) + 's）');
