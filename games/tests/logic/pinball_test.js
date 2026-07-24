// 弹珠台：掉落道具/增益系统注入测试（确定性驱动，不依赖随机自动掉落）
const H = require('./harness');
const { t: T } = H.loadGame('../pinball.html');

// 初始化
T.reset();
const s0 = T.getState();
H.ok(s0.pickups === 0 && s0.shield === 0 && s0.boostTimer === 0, 'pinball: reset 后无掉落/护盾/强化');

// 1) 金币生效数值
T.setScore(0);
T.applyPickup('coin');
H.eq('pinball: 金币 +50', T.getScore(), 50);

// 2) 闪电生效数值
T.setScore(0);
T.applyPickup('zap');
H.eq('pinball: 闪电 +30', T.getScore(), 30);

// 3) 弹板强化计时
T.applyPickup('boost');
H.eq('pinball: 强化计时置 8s', T.getBoost(), 8);
T.stepPickups(2);
H.eq('pinball: 强化计时递减', T.getBoost(), 6);

// 4) 护盾生效数值
T.applyPickup('shield');
H.eq('pinball: 护盾置 1', T.getShield(), 1);

// 5) 未碰撞不生效
T.setScore(0);
T.setBall({ x: 200, y: 300, vx: 0, vy: 0 });
T.spawnPickup('coin', 10, 10);
H.eq('pinball: 未碰撞前掉落数=1', T.getPickups().length, 1);
T.stepPickups(0.05);
H.eq('pinball: 远离未拾取，分数不变', T.getScore(), 0);
H.eq('pinball: 远离未拾取，掉落仍在', T.getPickups().length, 1);

// 6) 拾取后移除
T.reset(); T.setScore(0); T.setBall({ x: 200, y: 300, vx: 0, vy: 0 });
T.spawnPickup('coin', 200, 300);
T.stepPickups(0.05);
H.eq('pinball: 球拾取后分数 +50', T.getScore(), 50);
H.eq('pinball: 拾取后掉落清空', T.getPickups().length, 0);

// 7) 护盾免死（不扣命，护盾消耗）
T.reset();
T.setLives(3); T.setShield(1);
T.takeHit();
H.eq('pinball: 护盾免死，命数不变', T.getLives(), 3);
H.eq('pinball: 护盾被消耗', T.getShield(), 0);

// 8) 无盾扣血（命数 1→0 即结束，不触发 resetBall，避免消耗 Math.random）
T.reset();
T.setLives(1); T.setShield(0);
T.takeHit();
H.eq('pinball: 无盾扣血，命数-1', T.getLives(), 0);

module.exports = {};

// ===== 达成目标 confetti：破目标分(GOAL=200) =====
T.reset();
H.eq('达成前 confettiFired 为 false', T.confettiFired(), false);
T.setScore(200); T.setBall({x:200,y:300,vx:0,vy:0}); T.setLives(3);
T.step(1);
H.eq('破目标分触发 confettiFired', T.confettiFired(), true);
