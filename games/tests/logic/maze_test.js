const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../maze.html');

// 数据约定：cell 字段 true = 有墙(阻挡)，false = 无墙(可通行)
// 1x1：起点即终点
t.setMaze([[{ N:true, E:true, S:true, W:true }]]);
ok('1x1 迷宫可解(起点=终点)', t.isSolved() === true);
eq('1x1 路径长度为 1', (t.getPath()||[]).length, 1);

// 1x2 且两格之间墙封闭：无解
t.setMaze([
  [{ E:true,  W:true, N:true, S:true }],
  [{ E:true,  W:true, N:true, S:true }],
]);
ok('被墙隔断的迷宫无解', t.isSolved() === false);
eq('无解时路径为 null', t.getPath(), null);

// 2x2 全开：存在通路
t.setMaze([
  [{ N:true, E:false, S:false, W:true }, { N:true, E:true, S:false, W:false }],
  [{ N:false, E:false, S:true, W:true }, { N:false, E:true, S:true, W:false }],
]);
ok('开放 2x2 迷宫可解', t.isSolved() === true);
const p = t.getPath();
ok('可找到终点路径', Array.isArray(p) && p.length === 3);
eq('路径终点为右下角', p[p.length-1], [1,1]);

// ============ 注入：掉落道具 / 增益系统 ============
t.setRand(function(){ return 0.3; }); // 固定种子，避免消耗共享 Math.random 流
// 1) 金币：score +5
t.reset();
const m0 = t.getScore();
t.applyPickup('coin');
ok('迷宫: 金币 score+5', t.getScore() === m0 + 5);

// 2) 护盾：+1
t.reset();
t.applyPickup('shield');
ok('迷宫: 护盾 +1', t.getShield() === 1);

// 3) 加速：boostTimer>0
t.reset();
t.applyPickup('boost');
ok('迷宫: 加速 boostTimer>0', t.getBoost() > 0);

// 4) 集成：玩家所在格有掉落物 → 被拾取并生效，拾取后移除
t.reset();
const pp = t.getPlayer();
t.spawnPickup('coin', pp.r, pp.c);
const before = t.getPickups();
const s1 = t.getScore();
t.stepPickups(0);
ok('迷宫: 拾取后从场上移除', t.getPickups() === before - 1, '剩 '+t.getPickups());
ok('迷宫: 拾取金币 score+5', t.getScore() === s1 + 5);

// 5) 未碰撞不生效
t.reset();
const sz = t.getMazeSize();
t.spawnPickup('coin', sz.H-1, sz.W-1);
const s2 = t.getScore();
t.stepPickups(0);
ok('迷宫: 远处掉落物不拾取', t.getPickups() === 1);
ok('迷宫: 未拾取 score 不变', t.getScore() === s2);

// 6) 加速计时递减
t.reset();
t.setBoost(8);
t.update(1);
ok('迷宫: 加速计时递减', t.getBoost() < 8);

// 7) 护盾免死：有护盾受击不扣血、护盾被消耗
t.reset();
t.setShield(1);
const lives0 = t.getLives();
t.takeHit();
ok('迷宫: 有护盾受击不扣血', t.getLives() === lives0);
ok('迷宫: 护盾被消耗', t.getShield() === 0);

// 8) 无护盾受击：扣血
t.reset();
const lives1 = t.getLives();
t.takeHit();
ok('迷宫: 无护盾受击扣血', t.getLives() === lives1 - 1);

// ===== 轮5：完成彩带特效（到达终点触发，只读标记）=====
t.setMaze([
  [{ N:true, E:false, S:true, W:true }, { N:true, E:true, S:true, W:false }],
]);
const mf0 = t.confettiFired;
// 玩家随 newGame 在 (0,0)；从 (0,0) 向东一步即到 (0,1) 终点
t.movePlayer('E');
ok('迷宫: 到达终点', t.getPlayer() && t.getPlayer().r === 0 && t.getPlayer().c === 1);
eq('迷宫: 到达终点触发彩带', t.confettiFired, mf0+1);
