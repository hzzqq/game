const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../life.html');

function sortedAlive(s){ return s.alive.slice().sort((a,b)=> a[0]-b[0] || a[1]-b[1]); }

// 初始态
t.newGame(6, 6);
ok('life: 初始 6x6 无存活', t.getState().alive.length === 0, 'alive=' + t.getState().alive.length);

// block（2x2）稳定不变
t.newGame(6, 6);
[[1,1],[1,2],[2,1],[2,2]].forEach(([r,c]) => t.setCell(r,c,true));
const blockBefore = sortedAlive(t.getState());
t.step();
eq('life: block 一步后仍为 block（稳定）', sortedAlive(t.getState()), blockBefore);

// blinker 周期 2：水平 → 垂直
t.newGame(6, 6);
[[1,0],[1,1],[1,2]].forEach(([r,c]) => t.setCell(r,c,true));
t.step();
eq('life: blinker 一步后变垂直', sortedAlive(t.getState()), [[0,1],[1,1],[2,1]]);
// 再一步回到水平（周期2）
t.step();
eq('life: blinker 两步后回到水平（周期2）', sortedAlive(t.getState()), [[1,0],[1,1],[1,2]]);

// glider 一步后整体平移一格
t.newGame(6, 6);
[[0,1],[1,2],[2,0],[2,1],[2,2]].forEach(([r,c]) => t.setCell(r,c,true));
t.step();
eq('life: glider 一步后平移', sortedAlive(t.getState()), [[1,0],[1,2],[2,1],[2,2],[3,1]]);

// 死细胞邻居恰为 3 → 复活
t.newGame(6, 6);
[[2,2],[2,3],[2,4]].forEach(([r,c]) => t.setCell(r,c,true));   // 活细胞（不会立刻死）
t.setCell(3,3,false);
t.step();  // (3,3) 有 3 个上方邻居 → 复活
ok('life: 死细胞恰有3邻居 → 复活', t.getState().alive.some(([r,c]) => r===3 && c===3));

// 活细胞邻居=1 → 死亡
t.newGame(6, 6);
t.setCell(2,2,true);
t.setCell(2,3,true);   // 两个相邻活细胞，各只有 1 个邻居 → 双双死亡
t.step();
ok('life: 邻居=1 的活细胞死亡', t.getState().alive.length === 0, 'alive=' + t.getState().alive.length);

// clear 清空
t.newGame(6, 6);
t.setCell(1,1,true);
t.clear();
ok('life: clear 后无存活', t.getState().alive.length === 0);

// 随机 + 步进不崩溃，代数递增
t.newGame(8, 8);
t.setRand(() => 0.3);   // 固定 PRNG，保证可复现
t.step();
ok('life: 步进后代数=1', t.getState().gen === 1);
