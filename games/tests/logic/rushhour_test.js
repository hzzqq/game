const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../rushhour.html');

// 仅红色车，无阻挡：向右 4 步直接驶出
t.setCars([{ id:0, dir:'h', len:2, r:2, c:0 }]);
ok('初始未通关', t.isSolved() === false);
ok('红色车可向右 4 步', t.canMove(0,'R',4) === true);
ok('执行右移 4 步成功', t.move(0,'R',4) === true);
eq('红色车到达 c=4', t.getCars()[0].c, 4);
ok('到达出口即通关', t.isSolved() === true);

// 有阻挡：第 3 列竖车挡住去路
t.setCars([
  { id:0, dir:'h', len:2, r:2, c:0 },
  { id:1, dir:'v', len:2, r:2, c:3 },
]);
ok('仍可从 c0 右移 1 步(经过空格)', t.canMove(0,'R',1) === true);
t.move(0,'R',1);
ok('被竖车挡住无法继续右移', t.canMove(0,'R',1) === false);
ok('横向车不能竖直方向移动', t.canMove(0,'D',1) === false);
ok('有阻挡时未通关', t.isSolved() === false);
