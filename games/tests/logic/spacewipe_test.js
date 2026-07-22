// 太空清屏射击 · 逻辑单测
// 经 window.__t 钩子确定性驱动：波次推进 / 清屏得分 / 边界夹紧 / 触底扣命。
const H = require('./harness');
const { t } = H.loadGame('../spacewipe.html');

// 1) 初始状态
t.reset();
let s = t.getState();
H.eq('初始: 未运行', s.running, false);
H.eq('初始: 波次=1', s.wave, 1);
H.eq('初始: 余机=3', s.lives, 3);

// 2) 第一波生成
t.startWave(1);
s = t.getState();
H.eq('startWave(1): 波次=1', s.wave, 1);
H.eq('startWave(1): 敌机数=5', s.enemyCount, 5);
H.eq('startWave(1): 运行中', s.running, true);
t.setAutoFire(false); // 关闭自动开火，纯手动确定性射击

// 3) 逐架击落整波（关闭自动进波，确保可清空到 0）
const targets = s.enemies.map(e => e.x);
t.setAutoWave(false);
for (const tx of targets) {
  const before = t.getState().enemyCount;
  t.setPlayerX(tx);
  t.fire(); // 在玩家正上方生成子弹（绕过冷却）
  let guard = 0;
  while (t.getState().enemyCount >= before && guard < 300) { t.update(0.02); guard++; }
  H.ok('击落一架: 剩余减少', t.getState().enemyCount === before - 1);
}
s = t.getState();
H.eq('清屏: 敌机数=0', s.enemyCount, 0);
H.eq('清屏: 得分=500', s.score, 500);

// 4) 波次推进（清空整波进入下一波）
t.startWave(1); t.setAutoFire(false); t.setAutoWave(true);
t.clearEnemies();
t.update(0.05);
s = t.getState();
H.eq('推进: 波次=2', s.wave, 2);
H.eq('推进: 第二波敌机=6', s.enemyCount, 6);

// 5) 边界夹紧
t.reset(); t.startWave(1);
t.setPlayerX(-500);
t.update(0.02);
H.eq('边界: 左夹紧到 r', t.getState().player.x, 16);
t.setPlayerX(99999);
t.update(0.02);
H.eq('边界: 右夹紧到 W-r', t.getState().player.x, 800 - 16);

// 6) 敌机触底扣命
t.start(); // 启动运行，使 update 真正推进逻辑
t.setLives(3);
t.setPlayerX(400);
t.clearEnemies();
t.spawnEnemyAt(400, 540 - 16 + 2, 1, 0); // 紧贴玩家上方，下一步即触底
const livesBefore = t.getState().lives;
t.update(0.02);
H.ok('敌机触底: 余机-1', t.getState().lives === livesBefore - 1);

// 7) reset 后状态可读取（确定性，Juice 守卫不报错）
t.reset();
let rs = t.getState();
H.ok('reset 后状态可读取', rs && typeof rs.score === 'number' && rs.running === false);

// ===== 注入式掉落/增益系统（确定性驱动，setRand 控制掉落 PRNG）=====
t.setRand(123);

// 1. 生成掉落物 + 金币计分
t.reset(); t.start();
t.spawnPickup('coin', 400, 100);
H.eq('生成 1 个掉落物', t.getPickups(), 1);
const coinsBefore = t.getCoins(), scoreBefore = t.getState().score;
t.applyPickup(0);
H.eq('拾取 💰 金币计数+1', t.getCoins(), coinsBefore + 1);
H.eq('拾取 💰 加分(+10)', t.getState().score, scoreBefore + 10);
H.eq('拾取后掉落物移除', t.getPickups(), 0);

// 2. 护盾：有盾受击（敌机触底）不扣血，护盾被消耗
t.reset(); t.start(); t.setLives(3); t.setShield(1); t.clearEnemies();
t.spawnEnemyAt(400, 540 - 16 + 2, 1, 0); // 紧贴玩家上方下一步触底
const lb = t.getLives();
t.update(0.02);
H.eq('有护盾: 触底不扣血', t.getLives(), lb);
H.eq('护盾被消耗', t.getShield(), 0);
// 无盾受击扣血
t.reset(); t.start(); t.setLives(3); t.clearEnemies();
t.spawnEnemyAt(400, 540 - 16 + 2, 1, 0);
const lb2 = t.getLives();
t.update(0.02);
H.eq('无盾: 触底扣血', t.getLives(), lb2 - 1);

// 3. 加速增益：boost 置位
t.reset(); t.start();
t.spawnPickup('boost', 400, 100);
H.eq('生成 boost 掉落物', t.getPickup(0).type, 'boost');
t.applyPickup(0);
H.ok('拾取 🚀 加速生效(boostTimer>0)', t.getBoost() > 0);

// 4. 回血增益：heal 增加余机
t.reset(); t.start(); t.setLives(2);
t.spawnPickup('heal', 400, 100);
t.applyPickup(0);
H.eq('拾取 ❤ 余机+1', t.getLives(), 3);

// 5. 碰撞自动拾取
t.reset(); t.start();
t.setPlayerX(400);
t.spawnPickup('shield', 400, 540);
t.update(0.02);
H.eq('掉落到玩家自动拾取护盾', t.getShield(), 1);
H.eq('自动拾取后移除', t.getPickups(), 0);

// 6. 非法索引被拒
t.reset(); t.start();
t.applyPickup(99);
H.eq('非法索引不报错且掉落物=0', t.getPickups(), 0);

// 7. 回归：无 buff 时清屏得分逻辑不变（干净基线）
t.reset(); t.startWave(1); t.setAutoFire(false); t.setAutoWave(false);
const targets2 = t.getState().enemies.map(e => e.x);
for (const tx of targets2) {
  const before = t.getState().enemyCount;
  t.setPlayerX(tx); t.fire();
  let guard = 0;
  while (t.getState().enemyCount >= before && guard < 300) { t.update(0.02); guard++; }
}
H.eq('回归: 清屏得分=500', t.getState().score, 500);
// 还原掉落 PRNG 为默认随机流（确定性块结束）
t.setRand(Math.random);

// ===== 难度系统（简单/普通/困难/地狱）=====
{
  const D = t.DIFFICULTY;
  H.ok('难度: 4 档', Object.keys(D).length === 4);
  H.ok('难度: 含地狱档', !!D.hell);
  H.ok('难度递增: 地狱敌机数倍率 > 简单', D.hell.countMult > D.easy.countMult);
  H.ok('难度递增: 地狱敌机血量 > 简单', D.hell.hpMult > D.easy.hpMult);
  H.ok('难度递增: 地狱下落速度 > 简单', D.hell.speedMult > D.easy.speedMult);
  H.eq('普通档保持原参数(countMult=1)', D.normal.countMult, 1.0);
  H.eq('普通档保持原参数(speedMult=1)', D.normal.speedMult, 1.0);
  H.eq('setDifficulty 合法档返回 true', t.setDifficulty('hell'), true);
  H.eq('getDifficulty 反映设置', t.getDifficulty(), 'hell');
  H.eq('setDifficulty 非法档返回 false', t.setDifficulty('zzz'), false);

  // 同一波：地狱档敌机数 > 简单档，且血量更高、下落更快（用第4波，非 Boss 波）
  t.setDifficulty('easy'); t.startWave(4); const se = t.getState();
  t.setDifficulty('hell'); t.startWave(4); const sh = t.getState();
  H.ok('地狱档第4波敌机数 > 简单档', sh.enemyCount > se.enemyCount);
  H.ok('地狱档敌机血量 > 简单档', sh.enemies[0].hp > se.enemies[0].hp);

  // 普通档第1波仍为 5 架（不破坏既有基线）
  t.setDifficulty('normal'); t.startWave(1);
  H.eq('普通档第1波敌机=5(基线不变)', t.getState().enemyCount, 5);
  t.setRand(Math.random);
}

// ---------- Boss 系统 ----------
{
  t.setDifficulty('normal'); t.reset();
  H.eq('BOSS_EVERY=3', t.BOSS_EVERY, 3);
  H.ok('第3波是 Boss 波', t.isBossWave(3) === true);
  H.ok('第4波不是 Boss 波', t.isBossWave(4) === false);
  // startWave(3) → 生成 Boss、无普通敌机
  t.start(); t.startWave(3);
  const b = t.getBoss();
  H.ok('Boss 波生成 boss', b !== null);
  H.ok('Boss hp>0 且 hp==maxHp', b.hp > 0 && b.hp === b.maxHp);
  H.eq('Boss 波敌机数=0', t.getState().enemyCount, 0);
  H.ok('Boss 初始 phase=1', b.phase === 1);
  // 半血 → phase2
  t.setBossHp(Math.floor(b.maxHp/2));
  t.setAutoFire(false); t.update(0.016);
  H.ok('Boss 半血进入 phase2', t.getBoss() && t.getBoss().phase === 2);
  // 击败 boss：hp=1 后一发命中 → boss 清空 + 加分
  const scoreBefore = t.getState().score;
  t.setBossHp(1);
  const bb = t.getBoss();
  t.addBullet(bb.x, bb.y);
  t.update(0.016);
  H.ok('Boss 击败后清空', t.getBoss() === null);
  H.ok('Boss 击败奖励加分', t.getState().score > scoreBefore);
  // Boss 血量随难度递增
  t.setDifficulty('easy'); t.reset(); t.spawnBoss(3); const hpE = t.getBoss().maxHp;
  t.setDifficulty('hell'); t.reset(); t.spawnBoss(3); const hpH = t.getBoss().maxHp;
  H.ok('Boss 血量 地狱 > 简单', hpH > hpE);
  H.ok('DIFFICULTY 含 bossHpMult 地狱>简单', t.DIFFICULTY.hell.bossHpMult > t.DIFFICULTY.easy.bossHpMult);
  t.setDifficulty('normal'); t.reset(); t.setRand(Math.random);
}
