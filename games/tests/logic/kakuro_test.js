const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../kakuro.html');

// 2x2 数和：横块各 2 格、竖块各 2 格
const puzzle = {
  rows:2, cols:2,
  board:[[0,0],[0,0]],
  runs:[
    { dir:'h', cells:[[0,0],[0,1]], sum:3 },
    { dir:'h', cells:[[1,0],[1,1]], sum:7 },
    { dir:'v', cells:[[0,0],[1,0]], sum:4 },
    { dir:'v', cells:[[0,1],[1,1]], sum:6 },
  ],
};
t.setPuzzle(puzzle);

ok('初始未完成', t.isComplete() === false);
ok('初始未解', t.isSolved() === false);

// 正确解: (0,0)=1,(0,1)=2,(1,0)=3,(1,1)=4
t.setCell(0,0,1); t.setCell(0,1,2); t.setCell(1,0,3); t.setCell(1,1,4);
eq('横块(0,0)(0,1)合计=3', t.checkRun(puzzle.runs[0]), true);
eq('竖块(0,0)(1,0)合计=4', t.checkRun(puzzle.runs[2]), true);
ok('全部格子已填', t.isComplete() === true);
ok('全部数块正确 → 通关', t.isSolved() === true);

// 重复数字应判非法
t.setCell(0,1,1); // 与 (0,0)=1 重复
ok('同块重复数字 → 该块非法', t.checkRun(puzzle.runs[0]) === false);

// confetti 标记：解谜完成触发、重开复位
t.puzzle(); // 重开复位标记（前序用例已解过，标记可能为 true）
ok('初始未标记 confetti', t.confettiFired === false);
t.setPuzzle(puzzle);
t.setCell(0,0,1); t.setCell(0,1,2); t.setCell(1,0,3); t.setCell(1,1,4);
ok('全部数块正确 → 通关', t.isSolved() === true);
ok('通关后标记 confetti', t.confettiFired === true);
t.puzzle(); // 重开
ok('重开重置 confetti 标记', t.confettiFired === false);
ok('重开未解', t.isSolved() === false);

// ===== 手感反馈钩子：_fxShakes / _fxBursts =====
{
  t.puzzle(); // 重置
  eq('初始 burst=0', t.fxBursts(), 0);
  eq('初始 shake=0', t.fxShakes(), 0);
  const p = { rows:2, cols:2, board:[[0,0],[0,0]],
    runs:[ {dir:'h',cells:[[0,0],[0,1]],sum:3}, {dir:'h',cells:[[1,0],[1,1]],sum:7},
           {dir:'v',cells:[[0,0],[1,0]],sum:4}, {dir:'v',cells:[[0,1],[1,1]],sum:6} ] };
  t.setPuzzle(p);
  t.setCell(0,0,1); // 只填一格，整块未满足
  ok('填一格触发 shake', t.fxShakes() > 0);
  eq('未满足整块不触发 burst', t.fxBursts(), 0);
  t.setCell(0,1,2); // 横块 [0,0][0,1] 合计=3 满足 → 触发 burst
  ok('满足数块触发 burst', t.fxBursts() > 0);
  t.puzzle(); // 重开归零
  eq('重开 burst 归零', t.fxBursts(), 0);
  eq('重开 shake 归零', t.fxShakes(), 0);
}
