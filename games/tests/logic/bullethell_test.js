// 躲避弹幕 · 逻辑单测
// 经 window.__t 钩子确定性驱动：弹幕生成、命中扣命、无敌帧、生存推进、边界夹紧。
const H = require('./harness');
const { t } = H.loadGame('../bullethell.html');

// 1) 初始
t.reset();
let s = t.getState();
H.eq('初始: 未运行', s.running, false);
H.eq('初始: 余机=3', s.lives, 3);
H.eq('初始: 波次=1', s.wave, 1);
H.eq('初始: 无弹幕', s.bulletCount, 0);

// 2) 种子化弹幕生成（确定性）
t.start();
t.setRand(42);
t.setSpawnEnabled(true);
t.update(0.1);
H.ok('种子42: 生成了弹幕', t.getState().bulletCount > 0);

// 3) 命中扣命
t.start();
t.setSpawnEnabled(false);
t.clearBullets();
t.setPlayer(400, 500);
t.spawnBullet(400, 500, 0, 0); // 正落在玩家身上
const lives0 = t.getState().lives;
t.update(0.02);
s = t.getState();
H.eq('命中: 余机-1', s.lives, lives0 - 1);
H.eq('命中: 弹幕被清除', s.bulletCount, 0);

// 4) 无敌帧免疫
t.start();
t.setSpawnEnabled(false);
t.clearBullets();
t.setPlayer(400, 500);
t.setInvuln(0.5);
t.spawnBullet(400, 500, 0, 0);
const lives1 = t.getState().lives;
t.update(0.02);
H.eq('无敌帧: 余机不变', t.getState().lives, lives1);

// 5) 生存满时长推进波次
t.start();
t.setSpawnEnabled(false);
t.clearBullets();
t.setLives(5);
t.setTime(7.9);
t.update(0.2); // 7.9 + 0.2 = 8.1 >= 8
s = t.getState();
H.eq('生存: 波次=2', s.wave, 2);
H.eq('生存: 时间归零(0.1)', s.time, 0.1);
H.eq('生存: 过关得分+100', s.score, 100);

// 6) 边界夹紧
t.start();
t.setPlayer(-100, -100);
t.update(0.02);
s = t.getState();
H.eq('边界: x 夹紧到 r', s.player.x, 12);
H.eq('边界: y 夹紧到 r', s.player.y, 12);

// 7) reset 后状态可读取（确定性，Juice 守卫不报错）
t.reset();
let rs = t.getState();
H.ok('reset 后状态可读取', rs && typeof rs.score === 'number' && rs.running === false);

// ===== 注入式掉落/增益系统（确定性驱动，setRand 控制掉落 PRNG）=====
t.setRand(123);

// 1. 生成掉落物 + 金币加分/计数
t.reset(); t.start();
t.spawnPickup('coin', 400, 100);
H.eq('生成 1 个掉落物', t.getPickups(), 1);
const coinsBefore = t.getCoins(), scoreBefore = t.getState().score;
const coin = t.getPickup(0);
H.eq('掉落物类型=coin', coin.type, 'coin');
t.applyPickup(0);
H.eq('拾取 💰 金币计数+1', t.getCoins(), coinsBefore + 1);
H.eq('拾取 💰 加分(+10)', t.getState().score, scoreBefore + 10);
H.eq('拾取后掉落物移除', t.getPickups(), 0);

// 2. 护盾：有盾受击不扣血，护盾被消耗
t.reset(); t.start(); t.setLives(3); t.setShield(1);
const lb = t.getLives();
t.takeHit();
H.eq('有护盾受击不扣血', t.getLives(), lb);
H.eq('护盾被消耗', t.getShield(), 0);
// 无盾受击扣血
t.reset(); t.start(); t.setLives(3);
const lb2 = t.getLives();
t.takeHit();
H.eq('无盾受击扣血', t.getLives(), lb2 - 1);

// 3. 加速增益：boostTimer 置位后玩家移速翻倍
t.reset(); t.start();
t.spawnPickup('boost', 400, 100);
H.eq('生成 boost 掉落物', t.getPickup(0).type, 'boost');
t.applyPickup(0);
H.ok('拾取 🚀 加速生效(boostTimer>0)', t.getBoost() > 0);

// 4. 回血增益：heal 增加余机（不超过上限 5）
t.reset(); t.start(); t.setLives(2);
t.spawnPickup('heal', 400, 100);
t.applyPickup(0);
H.eq('拾取 ❤ 余机+1', t.getLives(), 3);

// 5. 碰撞自动拾取：掉落物落到玩家位置自动生效
t.reset(); t.start();
t.setPlayer(400, 500);
t.spawnPickup('shield', 400, 500);
t.update(0.02); // 与玩家重叠 → 自动拾取
H.eq('掉落到玩家自动拾取护盾', t.getShield(), 1);
H.eq('自动拾取后移除', t.getPickups(), 0);

// 6. 非法索引被拒：applyPickup 越界不报错、不掉物
t.reset(); t.start();
t.applyPickup(99);
H.eq('非法索引不报错且掉落物=0', t.getPickups(), 0);

// 7. 回归：无 buff 时原判定逻辑不变（命中仍扣命、无敌帧免疫）
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearBullets(); t.setPlayer(400, 500); t.setInvuln(0);
t.spawnBullet(400, 500, 0, 0);
const lv0 = t.getLives();
t.update(0.02);
H.eq('回归: 命中余机-1', t.getLives(), lv0 - 1);
// 还原掉落 PRNG 为默认随机流（确定性块结束）
t.setRand(Math.random);

// ===== 难度系统（简单/普通/困难/地狱）=====
{
  const D = t.DIFFICULTY;
  H.ok('难度: 4 档', Object.keys(D).length === 4);
  H.ok('难度: 含地狱档', !!D.hell);
  H.ok('难度递增: 地狱弹幕数 > 简单', D.hell.bulletMult > D.easy.bulletMult);
  H.ok('难度递增: 地狱弹速 > 简单', D.hell.speedMult > D.easy.speedMult);
  H.ok('难度递增: 地狱生成频率 > 简单', D.hell.rateMult > D.easy.rateMult);
  H.eq('普通档保持原参数(bulletMult=1)', D.normal.bulletMult, 1.0);
  H.eq('setDifficulty 合法档返回 true', t.setDifficulty('hell'), true);
  H.eq('getDifficulty 反映设置', t.getDifficulty(), 'hell');
  H.eq('setDifficulty 非法档返回 false', t.setDifficulty('zzz'), false);

  // 同波同种子：地狱档单次生成弹幕数 > 简单档
  t.setDifficulty('easy'); t.start(); t.setRand(7); t.clearBullets(); t.setSpawnEnabled(true); t.update(0.05);
  const cEasy = t.getState().bulletCount;
  t.setDifficulty('hell'); t.start(); t.setRand(7); t.clearBullets(); t.setSpawnEnabled(true); t.update(0.05);
  const cHell = t.getState().bulletCount;
  H.ok('地狱档单次弹幕数 > 简单档', cHell > cEasy);
  t.setDifficulty('normal'); t.setRand(Math.random);
}

// ===== Boss 系统 =====
{
  t.setDifficulty('normal');
  H.eq('BOSS_EVERY=3', t.BOSS_EVERY, 3);
  H.ok('isBossWave(3)=true', t.isBossWave(3) === true);
  H.ok('isBossWave(6)=true', t.isBossWave(6) === true);
  H.ok('isBossWave(2)=false', t.isBossWave(2) === false);

  // spawnBoss：boss 生成，hp=maxhp，phase=1
  t.reset(); t.start(); t.setWave(3); t.spawnBoss();
  let bs = t.getState().boss;
  H.ok('spawnBoss 生成 boss', bs !== null);
  H.eq('spawnBoss hp=maxhp', bs.hp, bs.maxhp);
  H.eq('spawnBoss phase=1', bs.phase, 1);

  // 生存推进到第3波自动召唤 Boss（wave 2→3）
  t.reset(); t.start(); t.setSpawnEnabled(false); t.clearBullets(); t.setLives(9); t.setWave(2); t.setTime(7.9);
  t.update(0.2);
  H.ok('生存推进到第3波自动召唤 Boss', t.getState().boss !== null);

  // 半血进 phase2
  t.reset(); t.start(); t.setWave(3); t.spawnBoss();
  t.setBossHp(t.getState().boss.maxhp * 0.4);
  t.update(0.016);
  H.eq('boss 半血进 phase2', t.getState().boss.phase, 2);

  // 击败 Boss：hp 耗尽 → boss 清空 + 加分
  t.reset(); t.start(); t.setLives(9); t.setWave(3); t.spawnBoss();
  const sc0 = t.getState().score;
  t.setBossHp(30);
  t.update(1.0); // 扣 60 → 击败
  H.ok('击败后 boss=null', t.getState().boss === null);
  H.ok('击败 boss 加分', t.getState().score > sc0);

  // bossHpMult：地狱 Boss 血量 > 简单
  t.setDifficulty('easy'); t.reset(); t.start(); t.setWave(3); t.spawnBoss();
  const eHp = t.getState().boss.maxhp;
  t.setDifficulty('hell'); t.reset(); t.start(); t.setWave(3); t.spawnBoss();
  const hHp = t.getState().boss.maxhp;
  H.ok('bossHpMult 地狱 Boss 血量 > 简单', hHp > eHp);
  t.setDifficulty('normal');
}
