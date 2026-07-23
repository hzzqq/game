const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../frogger.html');

t.reset();
// 马路上青蛙与车错开 → 安全
t.setRow(5,'road');
t.setObstacles(5,[3]);
t.setFrog(5,1);
t.setRowSpeed(5,0); // 静止便于判定
t.tick(1);
ok('车不在青蛙格 → 安全', t.isDead() === false);

// 青蛙与车同格 → 被撞死
t.setFrog(5,3);
t.tick(1);
ok('车在青蛙格 → 死亡', t.isDead() === true);

// 河面有浮木 → 踩木安全
t.reset();
t.setRow(5,'water');
t.setObstacles(5,[3]);
t.setFrog(5,3);
t.setRowSpeed(5,0);
t.tick(1);
ok('踩在浮木上 → 安全', t.isDead() === false);

// 河面无浮木 → 落水
t.setObstacles(5,[]);
t.setFrog(5,3);
t.tick(1);
ok('河面无浮木 → 落水死亡', t.isDead() === true);

// 到达终点
t.reset();
t.setFrog(0,5);
ok('处于第0行 → 到达终点', t.isGoal() === true);

// 回归：踩浮木被带出右边界应落水身亡，且 frog.col 不越界（曾无边界判定被带出棋盘）
t.reset();
t.setRow(2,'water');
t.setRowDir(2,1);
t.setRowSpeed(2,1);
t.setObstacles(2,[8]);
t.setFrog(2,8);
let maxCol=8;
for(let i=0;i<60;i++){ t.tick(0.1); const f=t.getFrog(); if(f.col>maxCol)maxCol=f.col; if(t.isDead())break; }
ok('被浮木带出右边界 → 落水身亡', t.isDead() === true);
ok('frog.col 不超过棋盘边界 (<=COLS-1)', maxCol <= 10, 'maxCol='+maxCol);
// 左边界同理
t.reset();
t.setRow(2,'water');
t.setRowDir(2,-1);
t.setRowSpeed(2,1);
t.setObstacles(2,[2]);
t.setFrog(2,2);
let minCol=2;
for(let i=0;i<60;i++){ t.tick(0.1); const f=t.getFrog(); if(f.col<minCol)minCol=f.col; if(t.isDead())break; }
ok('被浮木带出左边界 → 落水身亡', t.isDead() === true);
ok('frog.col 不低于 0', minCol >= 0, 'minCol='+minCol);

// ============ 注入：掉落道具 / 增益系统 ============
// 1) 金币：score +5
t.reset();
const f0 = t.getScore();
t.applyPickup('coin');
ok('青蛙: 金币 score+5', t.getScore() === f0 + 5);

// 2) 护盾：+1
t.reset();
t.applyPickup('shield');
ok('青蛙: 护盾 +1', t.getShield() === 1);

// 3) 加速：boostTimer>0
t.reset();
t.applyPickup('boost');
ok('青蛙: 加速 boostTimer>0', t.getBoost() > 0);

// 4) 回血：lives +1
t.reset();
t.setLives(1);
t.applyPickup('heart');
ok('青蛙: 回血 lives+1', t.getLives() === 2);

// 5) 集成：青蛙走到掉落物所在格 → 被拾取并生效
t.reset();
t.setFrog(5,1);
t.spawnPickup('coin',5,1);
const before = t.getPickups();
const s1 = t.getScore();
t.stepPickups(0);
ok('青蛙: 踩中掉落物后移除', t.getPickups() === before - 1, '剩 '+t.getPickups());
ok('青蛙: 拾取金币 score+5', t.getScore() === s1 + 5);

// 6) 未踩中：不相领格不拾取
t.reset();
t.setFrog(5,1);
t.spawnPickup('coin',2,2);
const s2 = t.getScore();
t.stepPickups(0);
ok('青蛙: 远处掉落物不拾取', t.getPickups() === 1);
ok('青蛙: 未拾取 score 不变', t.getScore() === s2);

// 7) 护盾免死：有护盾受创不死亡、护盾被消耗
t.reset();
t.setShield(1);
t.takeHit();
ok('青蛙: 有护盾受创不死', t.isDead() === false);
ok('青蛙: 护盾被消耗', t.getShield() === 0);

// 8) 无护盾受创：死亡（扣命至 0）
t.reset();
t.takeHit();
ok('青蛙: 无护盾受创死亡', t.isDead() === true);
ok('青蛙: 死亡时 lives=0', t.getLives() === 0);

// ============ 道具系统（按任务规范增强块） ============
// 新增适配道具：🪰苍蝇(fly) 作为计分掉落物
t.reset();
const fFly = t.getScore();
t.applyPickup('fly');
ok('青蛙: 苍蝇(fly) 计分 score+5', t.getScore() === fFly + 5);

// collectPickups 钩子：踩中所在格即拾取并移除
t.reset();
t.setFrog(5,1);
t.spawnPickup('fly',5,1);
const nBefore = t.getPickups();
const sBefore = t.getScore();
t.collectPickups();
ok('青蛙: collectPickups 拾取后移除', t.getPickups() === nBefore - 1, '剩 '+t.getPickups());
ok('青蛙: collectPickups 苍蝇加分', t.getScore() === sBefore + 5);

// 远处道具不被 collectPickups 拾取
t.reset();
t.setFrog(5,1);
t.spawnPickup('fly',2,2);
t.collectPickups();
ok('青蛙: 远处道具 collectPickups 不拾取', t.getPickups() === 1);

// 移动到道具格拾取（move 触发 updatePickups → collectPickups）
t.reset();
t.setFrog(5,2);
t.spawnPickup('shield',5,1);
t.move('left'); // → (5,1)
ok('青蛙: 移动到道具格拾取护盾', t.getShield() === 1, 'shield='+t.getShield());

// 护盾免一次死 + 无盾失败行为不变
t.reset();
t.setShield(1);
t.takeHit();
ok('青蛙: 有护盾受创不死', t.isDead() === false);
ok('青蛙: 护盾被消耗', t.getShield() === 0);
t.takeHit(); // 无盾再受创
ok('青蛙: 无盾再受创死亡', t.isDead() === true);

