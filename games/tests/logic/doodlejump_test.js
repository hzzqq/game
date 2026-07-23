// 涂鸦跳跃 DOODLE JUMP · 逻辑单测
// 经 window.__t 钩子确定性驱动：跳跃攀升计分 / 坠落失败 / 拾取增益道具系统。
const H = require('./harness');
const { t } = H.loadGame('../doodlejump.html');

const ROCKET_DUR = t.ROCKET_DUR;
const STAR_VALUE = t.STAR_VALUE;
const SPRING_V = t.SPRING_V;

// ===== 核心玩法（保证原有行为不被道具注入破坏）=====
// 1) 初始状态
t.newGame(1);
let s = t.getState();
H.eq('初始: 得分=0', s.score, 0);
H.eq('初始: 未结束', s.gameOver, false);
H.eq('初始: 护盾=0', s.shield, 0);
H.eq('初始: 火箭计时=0', s.rocketTimer, 0);
H.ok('初始: 平台已生成', s.platformCount > 3);

// 2) 跳跃攀升：若干步后得分应增长、且未结束
t.newGame(2);
const score0 = t.getScore();
for(let i=0;i<200;i++) t.step(0.016);
const s2 = t.getState();
H.ok('攀升: 得分增长', t.getScore() > score0);
H.ok('攀升: 仍在游戏中（自动跳平台）', s2.gameOver === false);

// 3) 坠落失败（无道具）：掉出底部即 gameOver
t.newGame(3);
t.triggerFall();
t.step(0.016);
H.ok('无盾坠落: isGameOver=true', t.isGameOver() === true);
H.ok('无盾坠落: gameOver 状态为真', t.getState().gameOver === true);

// ===== 拾取增益道具系统 =====
// 4) 道具类型表 + 常量合法
H.ok('PICKUP_TYPES 含 spring/rocket/shield/star',
  ['spring','rocket','shield','star'].every(x => t.PICKUP_TYPES.includes(x)));
H.ok('PICKUP_PROB 合法概率', t.PICKUP_PROB > 0 && t.PICKUP_PROB <= 1);
H.ok('ROCKET_DUR 正数', ROCKET_DUR > 0);

// 5) applyPickup 数值生效
t.newGame(11);
const vyBefore = t.getState().player.vy;
t.applyPickup('spring');
H.ok('spring: 产生强力向上速度', t.getState().player.vy < vyBefore && t.getState().player.vy <= SPRING_V + 1);

t.newGame(12);
t.applyPickup('rocket');
H.ok('rocket: 火箭计时>0', t.getRocket() > 0);
H.ok('rocket: 计时≈ROCKET_DUR', Math.abs(t.getRocket() - ROCKET_DUR) < 1e-6);

t.newGame(13);
t.applyPickup('shield');
H.eq('shield: 护盾=1', t.getShield(), 1);

t.newGame(14);
const scBefore = t.getScore();
t.applyPickup('star');
H.eq('star: 加分 STAR_VALUE', t.getScore() - scBefore, STAR_VALUE);

// 6) 护盾免一次坠落：gameOver 仍 false 且护盾被消耗
t.newGame(21);
t.setShield(1);
t.triggerFall();
t.step(0.016);
H.ok('护盾免坠落: isGameOver=false', t.isGameOver() === false);
H.eq('护盾免坠落: 护盾已消耗=0', t.getShield(), 0);

// 7) 护盾免坠落后再无盾：恢复正常失败行为
t.newGame(22);
t.setShield(1);
t.triggerFall();
t.step(0.016);          // 第一次消耗护盾被救援
H.ok('护盾消耗后仍在游戏', t.isGameOver() === false);
t.triggerFall();        // 再次坠落，已无盾
t.step(0.016);
H.ok('无盾再次坠落: isGameOver=true', t.isGameOver() === true);

// 8) 拾取后移除：spawnPickup 落在玩家位置，stepPickups 后计数回到基线且生效
t.newGame(31);
const base = t.getPickups();
const pl = t.getState().player;
t.spawnPickup('star', pl.x, pl.y);
H.eq('spawnPickup 后计数+1', t.getPickups(), base + 1);
const scB = t.getScore();
t.stepPickups(0.016);
H.eq('拾取后计数回到基线', t.getPickups(), base);
H.eq('拾取 star 生效加分', t.getScore() - scB, STAR_VALUE);

// 9) 护盾拾取后移除并生效
t.newGame(32);
const base2 = t.getPickups();
const pl2 = t.getState().player;
t.spawnPickup('shield', pl2.x, pl2.y);
t.stepPickups(0.016);
H.eq('护盾拾取后计数回到基线', t.getPickups(), base2);
H.eq('护盾拾取生效', t.getShield(), 1);

// 10) 回归：无增益时坠落判负行为不变（同 #3）
t.newGame(33);
t.triggerFall();
t.step(0.016);
H.ok('回归: 无盾坠落仍 gameOver', t.isGameOver() === true);

console.log('  ✓ doodlejump_test.js 全部通过');
