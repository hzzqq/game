// 打地鼠：掉落道具/增益系统注入测试（确定性驱动，不依赖随机自动掉落）
const H = require('./harness');
const { t: T } = H.loadGame('../whack.html');

T.reset();
const s0 = T.getState();
H.ok(s0.pickups === 0, 'whack: reset 后无掉落');

// 1) 高分金币生效数值
T.setScore(0);
T.applyPickup('coin');
H.eq('whack: 金币 +100', T.getScore(), 100);

// 2) 加时间生效数值
T.setTime(10);
T.applyPickup('clock');
H.eq('whack: 加时间 +3', T.getTime(), 13);

// 3) 未碰撞不生效（点击远离）
T.reset(); T.setScore(0);
T.spawnPickup('coin', 100, 100);
H.eq('whack: 未碰撞前掉落数=1', T.getPickups().length, 1);
T.collectAt(500, 500);
H.eq('whack: 远离点击未拾取，分数不变', T.getScore(), 0);
H.eq('whack: 远离点击掉落仍在', T.getPickups().length, 1);

// 4) 拾取后移除（点击命中）
T.reset(); T.setScore(0);
T.spawnPickup('coin', 100, 100);
T.collectAt(100, 100);
H.eq('whack: 点击命中分数 +100', T.getScore(), 100);
H.eq('whack: 拾取后掉落清空', T.getPickups().length, 0);

// 5) 未碰撞不生效（仅下落不自动拾取）
T.reset(); T.setScore(0);
T.spawnPickup('coin', 200, 200);
T.stepPickups(0.05);
H.eq('whack: 仅下落未拾取，分数不变', T.getScore(), 0);
H.eq('whack: 仅下落掉落仍在', T.getPickups().length, 1);

module.exports = {};
