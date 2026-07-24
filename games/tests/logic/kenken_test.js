const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../kenken.html');

// ---- 维度 / 重置 ----
t.reset(4);
let s = t.getState();
ok('reset(4) 后 n=4', s.n === 4);
ok('reset(4) 网格 4x4', s.grid.length === 4 && s.grid.every(r => r.length === 4));

t.reset(6);
s = t.getState();
ok('reset(6) 后 n=6', s.n === 6);
ok('reset(6) 网格 6x6', s.grid.length === 6 && s.grid.every(r => r.length === 6));

// ---- 确定性生成 + 解合法性 ----
t.newPuzzle(2024);
s = t.getState();
const sol = t.solution();
const n = s.n;

let rowsOk = true, colsOk = true;
for (let r = 0; r < n; r++) {
  const v = sol[r];
  if (new Set(v).size !== n || v.some(x => x < 1 || x > n)) rowsOk = false;
}
for (let c = 0; c < n; c++) {
  const v = [];
  for (let r = 0; r < n; r++) v.push(sol[r][c]);
  if (new Set(v).size !== n) colsOk = false;
}
ok('solution 每行含 1..n 唯一', rowsOk);
ok('solution 每列含 1..n 唯一', colsOk);

// 逐项验证每个笼运算达标（用内部 cages + solution）
function evalCage(cage) {
  const vals = cage.cells.map(p => sol[p[0]][p[1]]);
  if (vals.some(v => v < 1 || v > n)) return false;
  if (cage.op === '+') return vals.reduce((a, b) => a + b, 0) === cage.target;
  if (cage.op === '*') return vals.reduce((a, b) => a * b, 1) === cage.target;
  if (cage.op === '-') return vals.length === 2 && Math.abs(vals[0] - vals[1]) === cage.target;
  if (cage.op === '/') { if (vals.length !== 2) return false; const mx = Math.max(vals[0], vals[1]), mn = Math.min(vals[0], vals[1]); return mn !== 0 && mx / mn === cage.target; }
  return false;
}
let allCagesOk = true;
s.cages.forEach((cage, i) => { const okc = evalCage(cage); if (!okc) allCagesOk = false; ok('cage#' + i + '(' + cage.op + ') 达标', okc); });
ok('全部笼均达标', allCagesOk);

// ---- 填入正确解 → 通关 ----
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) t.setValue(r, c, sol[r][c]);
s = t.getState();
ok('填入正确解后 solved=true', s.solved === true);
ok('填入正确解后 mistakes=0', s.mistakes === 0);

// ---- 制造一处违反 ----
t.setValue(0, 1, sol[0][0]); // 与同行 (0,0) 重复
s = t.getState();
ok('制造行内重复后 solved=false', s.solved === false);
ok('制造行内重复后 mistakes>0', s.mistakes > 0);

// ---- 固定 seed 确定性 ----
t.newPuzzle(777);
const a = JSON.stringify(t.getState().cages);
t.newPuzzle(777);
const b = JSON.stringify(t.getState().cages);
eq('seed 777 两次布局一致', a, b);

// ---- 完成特效：解出后 confettiFired 标记 ----
t.newPuzzle(2024);
const sol2 = t.solution();
const before = t.confettiFired;
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) t.setValue(r, c, sol2[r][c]);
ok('解出后 confettiFired 增加', t.confettiFired > before);
