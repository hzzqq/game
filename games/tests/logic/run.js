// 逻辑单测聚合器：扫描本目录所有 *_test.js 并执行，汇总 PASS/FAIL。
// 用法：node run.js
const fs = require('fs');
const path = require('path');
const H = require('./harness');

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter(f => /_test\.js$/.test(f))
  .sort();

let loadFail = 0;
// 聚合期间吞掉测试文件内部的 process.exit(0)，避免其提前终止整个 runner，
// 保证遍历全部 *_test.js 后再统一汇总（失败仍由 H.results 记录）。
const _origExit = process.exit;
process.exit = function(){ /* no-op during aggregation */ };
for (const f of files) {
  try {
    require(path.join(dir, f));
  } catch (e) {
    loadFail++;
    console.log(`\n✗ 加载失败: ${f}\n   ${e.stack || e.message}`);
  }
}
process.exit = _origExit;

const total = H.results.length;
const passed = H.results.filter(r => r.pass).length;
const failed = total - passed;
console.log('\n========================================');
console.log(`逻辑单测汇总：${files.length} 个测试文件 · ${passed}/${total} 通过` + (failed ? ` · ${failed} 失败` : ' · 全绿') + (loadFail ? ` · ${loadFail} 文件加载失败` : ''));
console.log('========================================');
process.exit(failed || loadFail ? 1 : 0);
