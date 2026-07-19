// 扫雷逻辑单测：布雷数/数字正确性(generate)、flood 展开、踩雷、标旗、通关判定
const H = require('./harness');
const { t } = H.loadGame('../minesweeper.html');

// 1) generate 在 easy 下正好布 M=10 颗雷，且每个非雷格的数字等于邻雷数
(() => {
  t.setDiff('easy');
  t.generate();
  const st = t.getState();
  const R = st.R, C = st.C, M = st.M;
  const grid = t.getGrid();
  const mines = grid.filter(v => v === -1).length;
  H.eq('扫雷 easy 雷数=M', mines, M);
  let numOK = true;
  for (let i = 0; i < R * C; i++) {
    if (grid[i] === -1) continue;
    const r = Math.floor(i / C), c = i % C; let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr * C + nc] === -1) n++;
    }
    if (grid[i] !== n) numOK = false;
  }
  H.ok('扫雷 每个非雷格数字=邻雷数', numOK);
})();

// 2) flood 从空格展开整片连通区
(() => {
  const R = 5, C = 5;
  t.setDim(R, C, 0);
  const g = new Array(R * C).fill(0); // 全 0，无雷
  t.setGrid(g);
  t.clickCell(0); // 触发 flood
  const st = t.getState();
  H.eq('扫雷 flood 展开全部 25 格', st.revealedCount, 25);
  H.ok('扫雷 flood 中心格已开', st.open[12] === true);
})();

// 3) clickCell 踩雷 → dead
(() => {
  const R = 3, C = 3;
  t.setDim(R, C, 1);
  const g = new Array(9).fill(0); g[0] = -1; // (0,0) 为雷
  t.setGrid(g);
  t.clickCell(0);
  H.ok('扫雷 踩雷 dead=true', t.getState().dead === true);
})();

// 4) toggleFlag 切换标记，flagCount 同步
(() => {
  const R = 3, C = 3;
  t.setDim(R, C, 0);
  t.setGrid(new Array(9).fill(0));
  t.toggleFlag(4);
  H.eq('扫雷 标旗 flagCount=1', t.getState().flagCount, 1);
  H.ok('扫雷 标旗 flag[4]=true', t.getState().flag[4] === true);
  t.toggleFlag(4);
  H.eq('扫雷 取消标旗 flagCount=0', t.getState().flagCount, 0);
})();

// 5) 翻开所有非雷格 → checkWin 判定通关（用数字一致的棋盘）
(() => {
  const R = 3, C = 3;
  t.setDim(R, C, 1);
  // 雷在 (0,0)；按邻雷数计算出的合法数字盘
  const g = [-1, 1, 0, 1, 1, 0, 0, 0, 0];
  t.setGrid(g);
  for (let i = 1; i < 9; i++) t.clickCell(i); // 翻开全部非雷
  t.checkWin();
  H.ok('扫雷 翻开非雷格 checkWin=won', t.getState().won === true);
})();
