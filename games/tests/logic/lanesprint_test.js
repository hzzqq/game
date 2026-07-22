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
