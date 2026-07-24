// 跳跳 JUMP JUMP · 逻辑单测
// 经 window.__t 钩子确定性驱动：跳跃攀升计分 / 坠落失败 / 拾取增益道具系统（coin/shield/boost）。
const H = require('./harness');
const { t } = H.loadGame('../jumpjump.html');

const COIN_VALUE = t.COIN_VALUE;
const BOOST_DUR = t.BOOST_DUR;
const JUMP_V = t.JUMP_V;
const JUMP_V_BOOST = t.JUMP_V_BOOST;

// ===== 核心玩法（保证原有行为不被道具注入破坏）=====
// 1) 初始状态
t.newGame(1);
let s = t.getState();
H.eq('初始: 得分=0', s.score, 0);
H.eq('初始: 未结束', s.gameOver, false);
H.eq('初始: 护盾=0', s.shield, 0);
H.eq('初始: 加速=0', s.boost, 0);
H.ok('初始: 平台已生成', s.platformCount > 3);

// 2) 跳跃攀升：自动弹跳若干步后得分应增长、且未结束
t.newGame(2);
const score0 = t.getScore();
for(let i=0;i<200;i++) t.step(0.016);
const s2 = t.getState();
H.ok('攀升: 得分增长', t.getScore() > score0);
H.ok('攀升: 仍在游戏中（自动弹跳）', s2.gameOver === false);

// 3) 坠落失败（无道具）：掉出底部即 gameOver
t.newGame(3);
t.triggerFall();
t.step(0.016);
H.ok('无盾坠落: isGameOver=true', t.isGameOver() === true);
H.ok('无盾坠落: gameOver 状态为真', t.getState().gameOver === true);

// ===== 拾取增益道具系统 =====
// 4) 道具类型表 + 常量合法
H.ok('PICKUP_TYPES 含 coin/shield/boost',
  ['coin','shield','boost'].every(x => t.PICKUP_TYPES.includes(x)));
H.ok('PICKUP_PROB 合法概率', t.PICKUP_PROB > 0 && t.PICKUP_PROB <= 1);
H.ok('BOOST_DUR 正数', BOOST_DUR > 0);
H.ok('COIN_VALUE 正数', COIN_VALUE > 0);

// 5) applyPickup 数值生效
t.newGame(11);
const scBefore = t.getScore();
t.applyPickup('coin');
H.eq('coin: 加分 COIN_VALUE', t.getScore() - scBefore, COIN_VALUE);

t.newGame(12);
t.applyPickup('shield');
H.eq('shield: 护盾=1', t.getShield(), 1);

t.newGame(13);
t.applyPickup('boost');
H.ok('boost: 加速计时>0', t.getBoost() > 0);
H.ok('boost: 计时≈BOOST_DUR', Math.abs(t.getBoost() - BOOST_DUR) < 1e-6);

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

// 8) 加速影响弹跳：doJump 在加速态产生更强向上速度
t.newGame(31);
t.setVY(0); t.setBoost(5); t.doJump();
H.ok('boost doJump: 产生强力向上速度', Math.abs(t.getState().player.vy - JUMP_V_BOOST) < 1e-6);
t.newGame(32);
t.setVY(0); t.doJump();
H.eq('普通 doJump: 普通起跳速度', t.getState().player.vy, JUMP_V);

// 9) 加速计时随 step 递减（仅影响增益，不改计分/落地）
t.newGame(33);
t.setBoost(2);
t.step(0.016);
H.ok('boost 计时递减', t.getBoost() < 2 && t.getBoost() > 0);

// 10) 拾取后移除（coin）：spawnPickup 落在玩家位置，stepPickups 后计数回到基线且生效
t.newGame(41);
const base = t.getPickups();
const pl = t.getState().player;
t.spawnPickup('coin', pl.x, pl.y);
H.eq('spawnPickup 后计数+1', t.getPickups(), base + 1);
const scB = t.getScore();
t.stepPickups(0.016);
H.eq('拾取后计数回到基线', t.getPickups(), base);
H.eq('拾取 coin 生效加分', t.getScore() - scB, COIN_VALUE);

// 11) 护盾拾取后移除并生效
t.newGame(42);
const base2 = t.getPickups();
const pl2 = t.getState().player;
t.spawnPickup('shield', pl2.x, pl2.y);
t.stepPickups(0.016);
H.eq('护盾拾取后计数回到基线', t.getPickups(), base2);
H.eq('护盾拾取生效', t.getShield(), 1);

// 12) 加速拾取后移除并生效
t.newGame(43);
const base3 = t.getPickups();
const pl3 = t.getState().player;
t.spawnPickup('boost', pl3.x, pl3.y);
t.stepPickups(0.016);
H.eq('加速拾取后计数回到基线', t.getPickups(), base3);
H.ok('加速拾取生效', t.getBoost() > 0);

// 13) 回归：无增益时坠落判负行为不变（同 #3）
t.newGame(51);
t.triggerFall();
t.step(0.016);
H.ok('回归: 无盾坠落仍 gameOver', t.isGameOver() === true);

console.log('  ✓ jumpjump_test.js 全部通过');

// ===== 里程碑正反馈：confetti + confettiFired 只读钩子 =====
t.newGame(51);
t.applyPickup('coin');   // +50 → score=50 ≥ 里程碑 50 → 触发
H.ok('jumpjump: 里程碑达成触发 confetti', t.confettiFired() > 0, 'confettiFx=' + t.confettiFired());
t.newGame(52);
H.ok('jumpjump: 新局未达里程碑 confettiFx=0', t.confettiFired() === 0);

