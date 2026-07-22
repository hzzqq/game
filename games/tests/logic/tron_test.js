const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../tron.html');

// 撞墙：玩家0 在最右列向右 → 出界死亡，玩家1 胜
t.setup(10,10,{x:9,y:0,dir:'right'},{x:0,y:5,dir:'right'});
t.step();
ok('玩家0 撞墙出局', t.getState().p0.dead === true);
eq('玩家1 获胜', t.getWinner(), 1);

// 自由移动不死亡
t.setup(10,10,{x:1,y:1,dir:'right'},{x:1,y:3,dir:'right'});
t.step();
ok('双方正常移动均未死亡', t.getState().p0.dead===false && t.getState().p1.dead===false);
eq('无人死亡 → 未分胜负(-1)', t.getWinner(), -1);

// 迎面相撞：同列相对而行 → 双双死亡(平局)
t.setup(10,10,{x:5,y:5,dir:'right'},{x:7,y:5,dir:'left'});
t.step();
ok('头碰头双方均死亡', t.getState().p0.dead===true && t.getState().p1.dead===true);
eq('双双出局 → 平局(-1)', t.getWinner(), -1);

// ===== 注入：掉落道具 / 增益（确定性驱动）=====
// 护盾免一次撞墙
t.setup(10,10,{x:9,y:0,dir:'right'},{x:0,y:5,dir:'right'});
t.applyPickup('shield',0);
ok('p0 护盾生效', t.getShield(0)===true);
t.step();
ok('护盾免撞墙：p0 未死', t.getState().p0.dead===false);
ok('护盾已消耗', t.getShield(0)===false);
eq('未分胜负(-1)', t.getWinner(), -1);

// 无护盾撞墙照常死亡
t.setup(10,10,{x:9,y:0,dir:'right'},{x:0,y:5,dir:'right'});
t.step();
ok('无护盾撞墙 p0 死', t.getState().p0.dead===true);

// 心形免任意死亡
t.setup(10,10,{x:9,y:0,dir:'right'},{x:0,y:5,dir:'right'});
t.applyPickup('heart',0);
t.step();
ok('heart 免撞墙：p0 未死', t.getState().p0.dead===false);
ok('heart 已消耗', t.getHeart(0)===false);

// 加速：p0 一步移动 2 格
t.setup(10,10,{x:1,y:1,dir:'right'},{x:8,y:1,dir:'left'});
t.applyPickup('boost',0);
t.step();
eq('p0 加速移动 2 格(x=3)', t.getState().p0.x, 3);

// 行进拾取掉落 + 拾取后移除
t.setup(10,10,{x:1,y:1,dir:'right'},{x:8,y:1,dir:'left'});
t.spawnPickup('shield',2,1); // p0 第一步到达 (row1,col2)
t.step();
ok('行进拾取护盾', t.getShield(0)===true);
eq('拾取后掉落移除', t.getPickups().length, 0);

// 未碰撞不生效
t.setup(10,10,{x:1,y:1,dir:'right'},{x:8,y:1,dir:'left'});
t.spawnPickup('shield',9,9);
t.step();
ok('远离未拾取护盾', t.getShield(0)===false);
