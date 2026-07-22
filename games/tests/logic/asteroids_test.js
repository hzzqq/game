const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../asteroids.html');

t.reset();
// 子弹命中大陨石 → 裂成 2 小块、子弹消失、得分
t.setAsteroids([{ x:100, y:100, vx:0, vy:0, r:40 }]);
t.setBullets([{ x:100, y:100, vx:0, vy:0 }]);
t.step(0.016);
eq('大陨石被击中后裂成 2 块', t.getAsteroids().length, 2);
eq('子弹命中后消失', t.getBullets().length, 0);
ok('击碎大陨石得分', t.getScore() > 0);

// 边界环绕
t.reset();
t.setAsteroids([{ x:399, y:300, vx:100, vy:0, r:10 }]);
t.step(0.1); // x → 409 > 400 → 环绕回左边界附近
ok('陨石越过右边界后环绕', t.getAsteroids()[0].x < 400);

// 无碰撞：子弹与陨石远离
t.reset();
t.setAsteroids([{ x:100, y:100, vx:0, vy:0, r:10 }]);
t.setBullets([{ x:500, y:500, vx:0, vy:0 }]);
t.step(0.016);
eq('无命中时陨石数不变', t.getAsteroids().length, 1);
eq('无命中时子弹数不变', t.getBullets().length, 1);
eq('无命中不加分', t.getScore(), 0);

// ===== 注入式掉落道具系统（确定性驱动，不依赖随机自动掉落）=====
// 1. 掉落生效数值：applyPickup 直接生效
t.reset();
t.spawnPickup('coin', 100, 100);
eq('生成 1 个掉落物', t.getPickups(), 1);
const beforeScore = t.getScore();
const coin = t.getPickup(0);
t.applyPickup(coin);
eq('拾取 💰 金币加分', t.getScore(), beforeScore + 50);
eq('拾取后掉落物移除', t.getPickups(), 0);

// 2. 未碰撞不生效：仅生成不 apply，分数不变、掉落物仍在
t.reset();
t.spawnPickup('boost', 50, 50);
const s0 = t.getScore();
t.stepPickups(0.016); // 远离飞船，不拾取
eq('未碰撞分数不变', t.getScore(), s0);
eq('未碰撞掉落物仍在', t.getPickups(), 1);

// 3. 护盾免死：有盾时受击不扣血，护盾被消耗
t.reset();
t.setShield(1);
const livesBefore = t.getLives();
t.takeHit();
eq('有护盾受击不扣血', t.getLives(), livesBefore);
eq('护盾被消耗', t.getShield(), 0);

// 4. 无盾扣血：受击减少生命
t.reset();
t.setLives(3);
const lb = t.getLives();
t.takeHit();
eq('无盾受击扣血', t.getLives(), lb - 1);

// 5. 加速增益：boost 期间击碎小行星得分翻倍（默认无 boost 不影响原公式）
t.reset();
t.setBoost(8);
t.setAsteroids([{ x:100, y:100, vx:0, vy:0, r:40 }]);
t.setBullets([{ x:100, y:100, vx:0, vy:0 }]);
t.step(0.016);
eq('加速期击碎大陨石得 40 分(20×2)', t.getScore(), 40);

// 6. 碰撞拾取：掉落物落到飞船上自动拾取
t.reset();
const sh = t.getShip();
t.spawnPickup('shield', sh.x, sh.y);
t.stepPickups(0.016);
eq('掉落到飞船自动拾取护盾', t.getShield(), 1);
eq('自动拾取后移除', t.getPickups(), 0);

// 7. 回归：无 buff 时原计分公式不变（默认未拾取金币/未加速）
t.reset();
t.setAsteroids([{ x:100, y:100, vx:0, vy:0, r:40 }]);
t.setBullets([{ x:100, y:100, vx:0, vy:0 }]);
t.step(0.016);
eq('无 buff 大陨石仍得 20 分', t.getScore(), 20);
