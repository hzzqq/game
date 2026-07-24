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

// ===== 难度系统（倍率法，normal=1.0 保持经典手感）=====
// 11) DIFFICULTY 结构 + diffCfg
H.ok('DIFFICULTY 含四档', t.DIFF_ORDER.length === 4 && ['easy','normal','hard','hell'].every(k => t.DIFFICULTY[k]));
H.ok('默认难度=normal', t.getDifficulty() === 'normal');
H.ok('diffCfg 返回对象', typeof t.diffCfg() === 'object');
H.eq('normal 倍率为 1.0', t.diffCfg().speedMult, 1.0);

// 12) 地狱档下落更快（speedMult -> 重力）：地狱重力 > 普通重力
t.newGame(1);
const gNorm = t.getGravity();
t.setDifficulty('hell');
t.newGame(1);                       // 重开后应用地狱难度
const gHell = t.getGravity();
H.ok('地狱重力 > 普通重力', gHell > gNorm);
H.eq('普通重力 = 基准 GRAVITY(1400)', gNorm, 1400);

// 13) 概率更高（countMult）：地狱破碎/尖刺概率 > 普通；普通尖刺=0（保持经典手感）
t.setDifficulty('normal');
const bpN = t.getBreakProb(), spN = t.getSpikeProb();
t.setDifficulty('hell');
const bpH = t.getBreakProb(), spH = t.getSpikeProb();
H.ok('地狱破碎概率 > 普通', bpH > bpN);
H.ok('地狱尖刺概率 > 普通', spH > spN);
H.eq('普通档尖刺概率=0（不破坏原行为）', spN, 0);

// 14) setDifficulty 生效：改变当前难度并重开一局（未结束、平台已生成）
t.setDifficulty('hard');
H.eq('setDifficulty 生效: 当前=hard', t.getDifficulty(), 'hard');
const stHard = t.getState();
H.ok('setDifficulty 重开: 未结束', stHard.gameOver === false);
H.ok('setDifficulty 重开: 平台已生成', stHard.platformCount > 0);
H.eq('hard 重力倍率应用', t.getGravity(), 1400 * 1.25);

// 15) 尖刺平台机制（确定性放置）：无盾接触即判负；有盾消耗护盾并弹开
t.newGame(41);
const pl0 = t.getState().player;
t.setShield(0);
t.setPlatforms([{ x: pl0.x - 30, y: pl0.y + 20, w: 60, type: 'spike' }]);
t.setPlayerY(pl0.y + 20 - t.R);     // 脚底正好压在尖刺顶面
t.setVY(60);
t.step(0.016);
H.ok('尖刺落地(无盾): gameOver', t.isGameOver() === true);

t.newGame(42);
const pl1 = t.getState().player;
t.setShield(1);
t.setPlatforms([{ x: pl1.x - 30, y: pl1.y + 20, w: 60, type: 'spike' }]);
t.setPlayerY(pl1.y + 20 - t.R);
t.setVY(60);
t.step(0.016);
H.ok('尖刺落地(有盾): 未结束', t.isGameOver() === false);
H.eq('尖刺落地(有盾): 护盾被消耗=0', t.getShield(), 0);

// 还原默认难度，避免影响其它运行
t.setDifficulty('normal');

// ===== 生存型 Boss 系统（每 BOSS_EVERY 高度里程碑出现，无射击适配）=====
// 16) isBossWave 以高度里程碑计（BOSS_EVERY=3）
H.eq('BOSS_EVERY=3', t.BOSS_EVERY, 3);
H.ok('isBossWave(0)=false', t.isBossWave(0) === false);
H.ok('isBossWave(3)=true', t.isBossWave(3) === true);
H.ok('isBossWave(6)=true', t.isBossWave(6) === true);
H.ok('isBossWave(4)=false', t.isBossWave(4) === false);

// 17) spawnBoss：maxHp 随里程碑与 bossHpMult 缩放；起始 phase=1、hp=maxHp
t.setDifficulty('normal');
t.newGame(51);
t.setWave(3);                 // 第 3 个里程碑出 Boss
t.spawnBoss();
let b = t.getBoss();
H.ok('spawnBoss: boss 已生成', b !== null);
H.eq('spawnBoss: 起始 phase=1', b.phase, 1);
H.eq('spawnBoss: hp=maxHp', b.hp, b.maxHp);
H.eq('spawnBoss: normal maxHp=(28+wave*6)', b.maxHp, 28 + 3*6);   // bossHpMult=1.0
t.setDifficulty('hell'); t.newGame(51); t.setWave(3); t.spawnBoss();
H.ok('spawnBoss: 地狱 maxHp 更大(bossHpMult=1.9)', t.getBoss().maxHp > 46);
t.setDifficulty('normal');

// 18) 半血进入 phase2（更快/更密攻击）
t.newGame(52); t.setWave(6); t.spawnBoss();
t.setBossHp(t.getBoss().maxHp / 2);   // 触发半血阈值
t.updateBoss(0.016);
H.eq('phase2: 半血后 phase=2', t.getBoss().phase, 2);

// 19) 玩家上升使 boss.hp 递减（高度推进削减）
t.newGame(53); t.setWave(3); t.spawnBoss();
const hpBeforeRise = t.getBoss().hp;
t.setVY(-400);
t.step(0.05);                           // 一帧内迅速上升
H.ok('上升削减 hp: hp 下降', t.getBoss().hp < hpBeforeRise);

// 20) 击败：hp<=0 时奖励 + 掉落 + boss=null
t.newGame(54); t.setWave(3); t.spawnBoss();
const scBeforeBoss = t.getScore();
const dropsBefore = t.getPickups();
t.setBossHp(1);                          // 接近击败
t.setVY(-400);
t.step(0.1);                            // 上升削减 hp 至 <=0 → 击败
H.ok('击败: boss 已清空(null)', t.getBoss() === null);
H.ok('击败: 分数增加奖励(100*wave=300)', t.getScore() - scBeforeBoss >= 300);
H.ok('击败: 掉落道具(+1)', t.getPickups() > dropsBefore);

// 21) Boss 命中玩家：护盾优先免一次；无盾判负（不改坠落逻辑）
t.newGame(55); t.setWave(3); t.spawnBoss();
t.setShield(1);
t.takeBossHit();
H.ok('Boss命中(有盾): 未结束', t.isGameOver() === false);
H.eq('Boss命中(有盾): 护盾已消耗=0', t.getShield(), 0);

t.newGame(56); t.setWave(3); t.spawnBoss();
t.setShield(0);
t.takeBossHit();
H.ok('Boss命中(无盾): 判负', t.isGameOver() === true);

// 还原默认难度
t.setDifficulty('normal');

console.log('  ✓ doodlejump_test.js 全部通过');

// ===== 里程碑正反馈：confetti + confettiFired 只读钩子 =====
t.reset(3);
t.step(0.016);   // 初始 score=0，无里程碑
H.ok('doodlejump: 初始无里程碑不触发', t.confettiFired() === 0);
t.reset(3);
t.applyPickup('star'); t.applyPickup('star'); t.applyPickup('star'); t.applyPickup('star'); // 星星各 +50 → score=200
H.ok('doodlejump: 分数已达里程碑阈值', t.getScore() >= 200, 'score=' + t.getScore());
t.step(0.016);   // step 内 floor(score/200) 跨里程碑 → wave=1 → confetti
H.ok('doodlejump: 高度里程碑触发 confetti', t.confettiFired() > 0, 'confettiFx=' + t.confettiFired());

