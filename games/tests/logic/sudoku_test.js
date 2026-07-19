// 数独逻辑单测：valid 合法性、generate 生成合法解、countSolutions、isConflict、place 记错
const H = require('./harness');
const { t } = H.loadGame('../sudoku.html');
const N = t.N;

function emptyGrid() { return new Array(81).fill(0); }
function isValidSolution(g) {
  for (let i = 0; i < 9; i++) {
    const row = new Set(), col = new Set(), box = new Set();
    for (let j = 0; j < 9; j++) {
      row.add(g[i * 9 + j]); col.add(g[j * 9 + i]);
      const br = Math.floor(i / 3) * 3, bc = (i % 3) * 3;
      box.add(g[(br + Math.floor(j / 3)) * 9 + (bc + j % 3)]);
    }
    if (row.size !== 9 || col.size !== 9 || box.size !== 9) return false;
  }
  return true;
}

// 1) valid：空格放不冲突的值 → true
(() => {
  const g = emptyGrid();
  H.ok('数独 valid 空格合法值=true', t.valid(g, 0, 0, 5) === true);
})();

// 2) valid：同行已有该值 → false
(() => {
  const g = emptyGrid();
  g[0] = 5; // (0,0)=5
  H.ok('数独 valid 同行冲突=false', t.valid(g, 0, 1, 5) === false);
})();

// 3) valid：同列已有该值 → false
(() => {
  const g = emptyGrid();
  g[9] = 5; // (1,0)=5
  H.ok('数独 valid 同列冲突=false', t.valid(g, 0, 0, 5) === false);
})();

// 4) valid：同宫已有该值 → false
(() => {
  const g = emptyGrid();
  g[1] = 5; // (0,1) 与 (0,0) 同宫
  H.ok('数独 valid 同宫冲突=false', t.valid(g, 0, 0, 5) === false);
})();

// 5) generate 产生的 solution 是合法完整解
(() => {
  t.setDifficulty('easy');
  t.generate();
  H.ok('数独 generate 生成合法完整解', isValidSolution(t.getSolution()));
})();

// 6) countSolutions：完整解=1；空盘>1
(() => {
  const full = emptyGrid();
  t.solve(full);
  H.ok('数独 countSolutions(完整解)=1', t.countSolutions(full, 2) === 1);
  H.ok('数独 countSolutions(空盘)>1', t.countSolutions(emptyGrid(), 2) >= 2);
})();

// 7) isConflict：合法盘无冲突；人为制造同行重复 → 冲突
(() => {
  const sol = t.getSolution();
  t.setBoard(sol.slice());
  H.ok('数独 合法盘 isConflict=false', t.isConflict(0) === false);
  const b = sol.slice();
  b[1] = b[0]; // 同行 (0,0) 与 (0,1) 同值
  t.setBoard(b);
  H.ok('数独 同行重复 isConflict=true', t.isConflict(0) === true);
})();

// 8) place：填正确值不记错；填错值记一次错误
(() => {
  t.setDifficulty('easy');
  t.generate();
  const sol = t.getSolution();
  const board = t.getBoard();
  const given = t.getGiven();
  let i = -1;
  for (let k = 0; k < 81; k++) { if (board[k] === 0 && !given[k]) { i = k; break; } }
  H.ok('数独 找到空格用于 place 测试', i >= 0);
  t.setSel(i);
  const before = t.mistakes;
  t.place(sol[i]);             // 正确
  H.ok('数独 填正确值不记错', t.mistakes === before);
  const wrong = sol[i] === 1 ? 2 : 1;
  t.place(wrong);              // 错误
  H.ok('数独 填错误值记一次错', t.mistakes === before + 1);
})();
