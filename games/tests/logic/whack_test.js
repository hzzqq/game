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

// ===== 破纪录里程碑 confetti 测试（仅视觉反馈钩子，不改玩法）=====
T.reset(); T.setScore(1000);
H.ok(T.confettiFired() === false, 'whack: 破纪录前 confettiFired 为 false');
T.endGame(); // 1000 > best(0) → 新纪录
H.ok(T.confettiFired() === true, 'whack: 破纪录 → confettiFired 为真');
// 同一局只触发一次（锁）
T.setScore(2000); T.endGame();
H.ok(T.confettiFired() === true, 'whack: 二次破纪录仍受锁保护（只触发一次）');

const results = H.results;
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nwhack: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

module.exports = {};
