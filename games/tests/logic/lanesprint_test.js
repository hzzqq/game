// 极简竞速 · 逻辑单测
// 经 window.__t 钩子确定性驱动：车道切换/夹紧、同/异道碰撞、距离累计、撞毁结束。
const H = require('./harness');
const { t } = H.loadGame('../lanesprint.html');

// 1) 初始
t.reset();
let s = t.getState();
H.eq('初始: 未运行', s.running, false);
H.eq('初始: 车道数=4', s.lanes, 4);
H.eq('初始: 余机=3', s.lives, 3);
H.eq('初始: 距离=0', s.distance, 0);

// 2) 车道切换与边界夹紧
t.reset(); t.setLanes(3); t.setPlayerLane(1);
t.moveLeft();  H.eq('左切: 车道=0', t.getState().playerLane, 0);
t.moveRight(); H.eq('右切: 车道=1', t.getState().playerLane, 1);
t.moveRight(); H.eq('右切: 车道=2', t.getState().playerLane, 2);
t.moveRight(); H.eq('右切越界夹紧: 车道=2', t.getState().playerLane, 2);

// 3) 同道碰撞扣命
t.start(); t.setSpawnEnabled(false); t.setLanes(3); t.setPlayerLane(1); t.clearObstacles();
let py = t.getState().playerY;
t.spawnObstacle(1, py); // 同道、与玩家同高
const lives0 = t.getState().lives;
t.update(0.02);
s = t.getState();
H.eq('同道: 余机-1', s.lives, lives0 - 1);
H.eq('同道: 障碍被清除', s.obstacleCount, 0);

// 4) 异道不碰撞
t.start(); t.setSpawnEnabled(false); t.setLanes(3); t.setPlayerLane(0); t.clearObstacles();
py = t.getState().playerY;
t.spawnObstacle(2, py); // 不同道
const lives1 = t.getState().lives;
t.update(0.02);
s = t.getState();
H.eq('异道: 余机不变', s.lives, lives1);
H.eq('异道: 障碍仍在', s.obstacleCount, 1);

// 5) 距离累计（含轻微加速，约 101m）
t.start(); t.setSpawnEnabled(false); t.clearObstacles(); t.setSpeed(100);
t.update(1.0);
s = t.getState();
H.ok('距离累计 ≈100m', s.distance > 95 && s.distance < 110);

// 6) 撞毁结束
t.start(); t.setSpawnEnabled(false); t.clearObstacles(); t.setLives(1);
py = t.getState().playerY; t.setPlayerLane(1);
t.spawnObstacle(1, py);
t.update(0.02);
H.eq('撞毁: 余机=0', t.getState().lives, 0);
H.eq('撞毁: 结束', t.getState().over, true);

// 7) reset 后状态可读取（确定性，Juice 守卫不报错）
t.reset();
let rs = t.getState();
H.ok('reset 后状态可读取', rs && typeof rs.distance === 'number' && rs.running === false);

// ===== 注入式掉落/增益系统（确定性驱动，setRand 控制掉落 PRNG）=====
t.setRand(123);

// 1. 生成掉落物 + 金币计数
t.reset(); t.start();
t.spawnPickup('coin', 300, 100);
H.eq('生成 1 个掉落物', t.getPickups(), 1);
const coinsBefore = t.getCoins();
t.applyPickup(0);
H.eq('拾取 💰 金币计数+1', t.getCoins(), coinsBefore + 1);
H.eq('拾取后掉落物移除', t.getPickups(), 0);

// 2. 护盾：有盾受击（撞障碍）不扣血，护盾被消耗
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearObstacles(); t.setLives(3); t.setShield(1);
t.spawnObstacle(t.getState().playerLane, t.getState().playerY);
const lb = t.getLives();
t.update(0.02);
H.eq('有护盾: 撞障碍不扣血', t.getLives(), lb);
H.eq('护盾被消耗', t.getShield(), 0);
// 无盾受击扣血
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearObstacles(); t.setLives(3);
t.spawnObstacle(t.getState().playerLane, t.getState().playerY);
const lb2 = t.getLives();
t.update(0.02);
H.eq('无盾: 撞障碍扣血', t.getLives(), lb2 - 1);

// 3. 加速增益：boost 置位且加快距离累积
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearObstacles();
t.spawnPickup('boost', 300, 100);
H.eq('生成 boost 掉落物', t.getPickup(0).type, 'boost');
t.applyPickup(0);
H.ok('拾取 🚀 加速生效(boostTimer>0)', t.getBoost() > 0);
t.setSpeed(100);
t.update(1.0);
H.ok('加速期距离累积明显增大(>140m)', t.getState().distance > 140);

// 4. 回血增益：heal 增加余机
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearObstacles(); t.setLives(2);
t.spawnPickup('heal', 300, 100);
t.applyPickup(0);
H.eq('拾取 ❤ 余机+1', t.getLives(), 3);

// 5. 碰撞自动拾取：掉落物落到玩家位置自动生效
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearObstacles();
const px = t.getPlayerX(), pyy = t.getState().playerY;
t.spawnPickup('shield', px, pyy);
t.update(0.02);
H.eq('掉落到玩家自动拾取护盾', t.getShield(), 1);
H.eq('自动拾取后移除', t.getPickups(), 0);

// 6. 非法索引被拒
t.reset(); t.start();
t.applyPickup(99);
H.eq('非法索引不报错且掉落物=0', t.getPickups(), 0);

// 7. 回归：无 buff 时距离/碰撞逻辑不变
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearObstacles(); t.setSpeed(100);
t.update(1.0);
H.ok('回归: 距离累计 ≈100m', t.getState().distance > 95 && t.getState().distance < 110);
// 还原掉落 PRNG 为默认随机流（确定性块结束）
t.setRand(Math.random);
