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
