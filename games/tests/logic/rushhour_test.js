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

// ===== 注入：掉落道具 / 增益（确定性驱动）=====
t.setCars([{ id:0, dir:'h', len:2, r:2, c:0 }]);
eq('初始金币0', t.getCoins(), 0);
eq('初始无掉落', t.getPickups().length, 0);
// 红车右移：c=1 占据 (2,1)(2,2)，未到 (2,3)
t.spawnPickup('coin',2,3);
t.move(0,'R',1);
eq('未压上掉落不拾取', t.getCoins(), 0);
// 再右移一格：c=2 占据 (2,2)(2,3) -> 拾取
t.move(0,'R',1);
eq('压上掉落拾取金币+50', t.getCoins(), 50);
eq('拾取后掉落移除', t.getPickups().length, 0);

// 未碰撞不生效（红车在第2行，掉落放第0行）
t.setCars([{ id:0, dir:'h', len:2, r:2, c:0 }]);
t.spawnPickup('coin',0,0);
t.move(0,'R',1);
eq('远离掉落未拾取', t.getCoins(), 0);

// 提示增益计时
t.setCars([{ id:0, dir:'h', len:2, r:2, c:0 }]);
t.applyPickup('hint');
ok('提示计时>0', t.getHint().timer > 0);
t.stepPickups(10);
eq('提示计时归零', t.getHint().timer, 0);

// ===== 通关触发完成特效标记 =====
t.setCars([{ id:0, dir:'h', len:2, r:2, c:0 }]);
eq('通关前未标记完成特效', t.confettiFired, false);
t.move(0,'R',4);
eq('红色车到达 c=4', t.getCars()[0].c, 4);
ok('通关后标记完成特效', t.confettiFired === true);
