// 六边形扫雷逻辑单测：邻接雷数计算、flood 展开、踩雷、标旗、通关判定
const H = require('./harness');
const { t } = H.loadGame('../hexcells.html');

// 1) setGrid 后每个非雷格 adj == 周围 6 邻雷数
(() => {
  t.setDim(4, 4);
  const mines = [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1]; // 两个角雷
  t.setGrid(mines);
  const st = t.getState();
  let numOK = true;
  for (let i = 0; i < 16; i++) {
    if (st.mine[i]) continue;
    const nbs = t.neighborsOf(i);
    const n = nbs.filter(j => st.mine[j]).length;
    if (st.adj[i] !== n) numOK = false;
  }
  H.ok('六边形 每个非雷格 adj=邻雷数', numOK);
  H.eq('六边形 雷数=M', st.mines, 2);
})();

// 2) 内部格邻接数应为 6，边缘格 < 6
(() => {
  t.setDim(5, 5);
  t.setGrid(new Array(25).fill(0));
  H.eq('六边形 内部格(12)邻接=6', t.neighborsOf(12).length, 6);
  H.ok('六边形 角格(0)邻接<6', t.neighborsOf(0).length < 6);
})();

// 3) flood：全 0 棋盘从任一点展开全部
(() => {
  t.setDim(4, 4);
  t.setGrid(new Array(16).fill(0));
  t.openCell(0);
  H.eq('六边形 flood 展开全部 16 格', t.getState().revealed, 16);
  H.ok('六边形 flood 中心格已开', t.getState().open[5] === true);
})();

// 4) 踩雷 → dead
(() => {
  t.setDim(3, 3);
  const mines = [1,0,0, 0,0,0, 0,0,0];
  t.setGrid(mines);
  t.openCell(0);
  H.ok('六边形 踩雷 dead=true', t.getState().dead === true);
})();

// 5) 标旗：flagCount 同步
(() => {
  t.setDim(3, 3);
  t.setGrid(new Array(9).fill(0));
  t.toggleFlag(4);
  H.eq('六边形 标旗 flags=1', t.getState().flags, 1);
  H.ok('六边形 flag[4]=true', t.getState().flag[4] === true);
  t.toggleFlag(4);
  H.eq('六边形 取消标旗 flags=0', t.getState().flags, 0);
})();

// 6) 翻开所有非雷格 → 通关
(() => {
  t.setDim(3, 3);
  const mines = [1,0,0, 0,0,0, 0,0,0];
  t.setGrid(mines);
  for (let i = 1; i < 9; i++) t.openCell(i); // 翻开全部非雷
  t.checkWin();
  H.ok('六边形 翻开非雷格 checkWin=won', t.getState().won === true);
  H.ok('六边形 isWin 为真', t.isWin() === true);
})();

// 7) 边界：越界点击不抛错、不改变状态
(() => {
  t.setDim(3, 3);
  t.setGrid(new Array(9).fill(0));
  t.openCell(-1); t.openCell(99);
  H.eq('六边形 越界点击无翻格', t.getState().revealed, 0);
})();

// 8) 完成特效：翻开所有非雷格 → confettiFired 增加
(() => {
  t.setDim(3, 3);
  const mines = [1,0,0, 0,0,0, 0,0,0];
  t.setGrid(mines);
  const before = t.confettiFired;
  for (let i = 1; i < 9; i++) t.openCell(i);
  t.checkWin();
  H.ok('六边形 通关后 confettiFired 增加', t.confettiFired > before);
})();
