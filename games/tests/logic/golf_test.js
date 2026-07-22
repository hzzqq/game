const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../golf.html');

// 直击进洞：从 (0,0) 朝 0° 力度 50 命中 (50,0) 的洞
t.reset();
t.setBall(0,0);
t.setHole(50,0);
t.setObstacles([]);
t.hit(0,50);
ok('一杆进洞', t.isInHole() === true);
eq('杆数=1', t.getStrokes(), 1);

// 力度不足：从 (0,0) 力度 30 → 停在 (30,0)，未进洞
t.reset();
t.setBall(0,0);
t.setHole(50,0);
t.hit(0,30);
ok('力度不足未进洞', t.isInHole() === false);
eq('球停在 (30,0)', t.getBall(), {x:30,y:0});

// 补杆进洞：再打 20 力度 → 到达 (50,0)
t.hit(0,20);
ok('补杆后进洞', t.isInHole() === true);
eq('总杆数=2', t.getStrokes(), 2);

// 障碍墙阻挡：x=20 处竖墙，从 (0,0) 力度 50 撞墙停在墙前
t.reset();
t.setBall(0,0);
t.setHole(50,0);
t.setObstacles([{x:20,y:-10,w:2,h:40}]); // 覆盖 y∈[-10,30]
t.hit(0,50);
ok('撞墙未进洞', t.isInHole() === false);
ok('球停在墙前(x<20)', t.getBall().x < 20);

// ============ 注入：掉落道具 / 增益系统 ============
// 1) 金币：score +5
t.reset();
const g0 = t.getScore();
t.applyPickup('coin');
ok('高尔夫: 金币 score+5', t.getScore() === g0 + 5);

// 2) 护盾：+1
t.reset();
t.applyPickup('shield');
ok('高尔夫: 护盾 +1', t.getShield() === 1);

// 3) 加速：boostTimer>0
t.reset();
t.applyPickup('boost');
ok('高尔夫: 加速 boostTimer>0', t.getBoost() > 0);

// 4) 集成：球滚过掉落物 → 被拾取并生效，拾取后移除
t.reset();
t.setBall(10,10);
t.spawnPickup('coin',10,10);
const before = t.getPickups();
const s1 = t.getScore();
t.stepPickups(0);
ok('高尔夫: 拾取后从场上移除', t.getPickups() === before - 1, '剩 '+t.getPickups());
ok('高尔夫: 拾取金币 score+5', t.getScore() === s1 + 5);

// 5) 未碰撞不生效
t.reset();
t.setBall(10,10);
t.spawnPickup('coin',200,200);
const s2 = t.getScore();
t.stepPickups(0);
ok('高尔夫: 远处掉落物不拾取', t.getPickups() === 1);
ok('高尔夫: 未拾取 score 不变', t.getScore() === s2);

// 6) 进洞掉落奖励分：一杆进洞后 score+5
t.reset();
t.setBall(0,0);
t.setHole(50,0);
t.setObstacles([]);
t.hit(0,50);
ok('高尔夫: 进洞掉落奖励分 score+5', t.getScore() === 5);

// 7) 护盾免死：有护盾受击不扣血、护盾被消耗
t.reset();
t.setShield(1);
const lives0 = t.getLives();
t.takeHit();
ok('高尔夫: 有护盾受击不扣血', t.getLives() === lives0);
ok('高尔夫: 护盾被消耗', t.getShield() === 0);

// 8) 无护盾受击：扣血
t.reset();
const lives1 = t.getLives();
t.takeHit();
ok('高尔夫: 无护盾受击扣血', t.getLives() === lives1 - 1);
