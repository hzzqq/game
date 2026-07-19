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
for (const f of files) {
  try {
    require(path.join(dir, f));
  } catch (e) {
    loadFail++;
    console.log(`\n✗ 加载失败: ${f}\n   ${e.stack || e.message}`);
  }
}

const total = H.results.length;
const passed = H.results.filter(r => r.pass).length;
const failed = total - passed;
console.log('\n========================================');
console.log(`逻辑单测汇总：${files.length} 个测试文件 · ${passed}/${total} 通过` + (failed ? ` · ${failed} 失败` : ' · 全绿') + (loadFail ? ` · ${loadFail} 文件加载失败` : ''));
console.log('========================================');
process.exit(failed || loadFail ? 1 : 0);
