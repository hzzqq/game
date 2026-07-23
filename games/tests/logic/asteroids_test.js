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

// ===== Boss 系统（每 BOSS_EVERY=3 波出现，巨大多边形母体 + 多阶段 + 击败奖励）=====
// 1. BOSS_EVERY 与 isBossWave 判定
t.reset();
eq('BOSS_EVERY === 3', t.BOSS_EVERY, 3);
eq('wave 3 是 Boss 波', t.isBossWave(3), true);
eq('wave 1 不是 Boss 波', t.isBossWave(1), false);
eq('wave 6 是 Boss 波', t.isBossWave(6), true);
eq('wave 0 不是 Boss 波', t.isBossWave(0), false);

// 2. 普通波推进：清空小行星后进入下一普通波（不刷 Boss）
t.reset();
t.setWave(1);
t.setAsteroids([]);
t.step(0.016);
eq('普通波推进不生成 Boss', t.getBoss(), null);
ok('普通波推进后仍有小行星(下一波已生成)', t.getAsteroids().length > 0);

// 3. spawnBoss：清空普通小行星 + 满血 + 按 wave 缩放血量
t.reset();
t.setWave(3);
t.spawnBoss();
ok('spawnBoss 后存在 Boss', t.getBoss() !== null);
eq('spawnBoss 清空普通小行星', t.getAsteroids().length, 0);
const b3 = t.getBoss();
eq('Boss 满血等于 maxHp', b3.hp, b3.maxHp);
eq('wave3 Boss maxHp = round(28+3*6)=46', b3.maxHp, 46);
t.setWave(6); t.spawnBoss();
eq('wave6 Boss maxHp = round(28+6*6)=64', t.getBoss().maxHp, 64);

// 4. 玩家子弹命中 Boss 扣血、子弹消失
t.reset(); t.setWave(3); t.spawnBoss();
const hpBefore = t.getBoss().hp;
t.addBullet(t.getBoss().x, t.getBoss().y, 0, 0);
t.updateBoss(0.016);
eq('玩家子弹命中 Boss 扣血', t.getBoss().hp, hpBefore - 1);
eq('命中后子弹消失', t.getBullets().length, 0);

// 5. 半血进入 phase2 + 分裂出小体
t.reset(); t.setWave(3); t.spawnBoss();
t.setBossHp(Math.floor(t.getBoss().maxHp/2));
const childBefore = t.getAsteroids().length;
t.updateBoss(0.016);
eq('半血进入 phase2', t.getBoss().phase, 2);
ok('phase2 分裂出小体', t.getAsteroids().length > childBefore);

// 6. Boss 击败返回 true + 奖励 score += 100*wave + 掉落
t.reset(); t.setWave(3); t.spawnBoss();
const scoreB = t.getScore();
t.setBossHp(1);
t.addBullet(t.getBoss().x, t.getBoss().y, 0, 0);
const beaten = t.updateBoss(0.016);
ok('Boss 被击败返回 true', beaten === true);
eq('击败后 Boss 清空', t.getBoss(), null);
eq('击败奖励 score += 100*wave (=300)', t.getScore(), scoreB + 300);
ok('击败掉落奖励(coin 掉落物)', t.getPickups() > 0);

// 6b. 击败后经由 step 推进到下一波（wave+1，进入普通波）
t.reset(); t.setWave(3); t.spawnBoss();
t.setBossHp(1);
t.addBullet(t.getBoss().x, t.getBoss().y, 0, 0);
t.step(0.016);
eq('击败后 step 推进到 wave 4', t.getWave(), 4);
eq('击败后 Boss 已清空', t.getBoss(), null);
ok('击败后下一波普通小行星已生成', t.getAsteroids().length > 0);

// 7. Boss 周期向玩家发射子弹
t.reset(); t.setWave(3); t.spawnBoss();
const eb0 = t.getEBullets();
t.updateBoss(1.0); // 大 dt 让 fireT 立刻到点
eq('Boss 周期向玩家发射子弹', t.getEBullets(), eb0 + 1);

// 8. Boss 接触玩家造成伤害（扣命）
t.reset(); t.setWave(3); t.spawnBoss();
t.setShip(t.getBoss().x, t.getBoss().y); // 重叠
const lives0 = t.getLives();
t.updateBoss(0.016);
ok('Boss 接触玩家造成伤害(扣命或消耗护盾)', t.getLives() < lives0 || t.getShield() > 0);

// 9. Boss 存在期间不刷普通小行星（满血、未分裂）
t.reset(); t.setWave(3); t.spawnBoss();
t.setAsteroids([]);
t.updateBoss(0.016);
eq('Boss 存在期间普通小行星不刷出', t.getAsteroids().length, 0);

