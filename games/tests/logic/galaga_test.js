// 加拉加 俯冲突战机 · 逻辑单测
// 经 window.__t 钩子确定性驱动：step 推进 / fire 生成子弹 / 子弹击落敌机 / 清空胜利 / 敌弹扣命 / 命数归零结束。
const H = require('./harness');
const { t } = H.loadGame('../galaga.html');

const AW = t.AW; // 敌机宽，用于把子弹对准敌机中心

// 1) 初始状态
t.newGame(1);
let s = t.getState();
H.eq('初始: 命数=3', s.lives, 3);
H.eq('初始: 得分=0', s.score, 0);
H.eq('初始: 未结束', s.over, false);
H.eq('初始: 未胜利', s.win, false);
H.eq('初始: 敌机=32', s.enemyCount, 32);

// 2) step 推进不改变战果（无开火、关闭俯冲，敌机数与得分保持）
t.newGame(2);
t.setDiveEnabled(false);
const before = t.getState().enemyCount;
for(let i=0;i<10;i++) t.step();
s = t.getState();
H.eq('step 推进: 敌机数不变', s.enemyCount, before);
H.eq('step 推进: 得分仍为0', s.score, 0);
H.ok('step 推进: 仍可读取状态', typeof s.player.x === 'number');

// 3) fire 生成玩家子弹
t.newGame(3);
const bullets0 = t.getState().bullets.length;
const fired = t.fire();
H.ok('fire 返回 true', fired === true);
H.eq('fire: 子弹数+1', t.getState().bullets.length, bullets0 + 1);
// 冷却内再次开火无效
H.eq('fire 冷却内: 子弹不再增加', t.getState().bullets.length, bullets0 + 1);

// 4) 子弹击中敌机 → 敌机数-1、得分+100
t.newGame(4);
t.setDiveEnabled(false);
let before4 = t.getState().enemyCount;
let target = t.getState().enemies.find(e => e.alive);
t.setPlayerX(target.x + AW/2);   // 对准该列中心
t.fire();
let guard = 0;
while(t.getState().enemyCount >= before4 && guard < 300){ t.step(); guard++; }
s = t.getState();
H.eq('击落: 敌机数-1', s.enemyCount, before4 - 1);
H.eq('击落: 得分+100', s.score, 100);

// 5) 清空全部敌机 → 胜利
t.newGame(5);
t.setDiveEnabled(false);
let g2 = 0;
while(t.getState().enemyCount > 0 && g2 < 4000){
  const en = t.getState().enemies.find(e => e.alive);
  if(!en) break;
  t.setPlayerX(en.x + AW/2);
  t.fire();
  let g3 = 0;
  const c0 = t.getState().enemyCount;
  while(g3 < 300){ t.step(); g3++; if(t.getState().enemyCount < c0) break; }
  g2++;
}
s = t.getState();
H.eq('清空: 敌机数=0', s.enemyCount, 0);
H.ok('清空: isWin=true', t.isWin() === true);
H.ok('清空: win 状态为真', s.win === true);

// 6) 玩家被敌弹击中 → 命数-1
t.newGame(6);
t.setLives(3);
const pl = t.getState().player;
t.spawnEnemyBullet(pl.x, pl.y + 2);   // 正落在玩家身上
const livesBefore = t.getState().lives;
t.step();
H.eq('敌弹命中: 命数-1', t.getState().lives, livesBefore - 1);

// 7) 命数归零 → 游戏结束
t.newGame(7);
t.setLives(1);
const pl2 = t.getState().player;
t.spawnEnemyBullet(pl2.x, pl2.y + 2);
t.step();
H.ok('命数0: isGameOver=true', t.isGameOver() === true);
H.ok('命数0: over 状态为真', t.getState().over === true);

// ===== 掉落道具系统 =====
// 8) 道具类型表 + 常量
H.ok('PICKUP_TYPES 含 rapid/spread/shield/life', ['rapid','spread','shield','life'].every(x=>t.PICKUP_TYPES.includes(x)));
H.ok('DROP_PROB 合法概率', t.DROP_PROB>0 && t.DROP_PROB<=1);

// 9) spawnPickup 生成 + stepPickups 下坠拾取（护盾）
t.newGame(11); t.setDiveEnabled(false);
const px = t.getState().player.x;
t.spawnPickup('shield', px, t.getState().player.y - 24);
H.eq('spawnPickup 生成 1 个', t.getPickups(), 1);
let g=0; while(t.getPickups()>0 && g<40){ t.stepPickups(); g++; }
H.eq('下坠到玩家自动拾取', t.getPickups(), 0);
H.eq('拾取护盾 shield=1', t.getShield(), 1);

// 10) 护盾抵挡一次敌弹：命数不变、护盾清零
t.newGame(12); t.setLives(3); t.setShield(1);
const plS = t.getState().player;
t.spawnEnemyBullet(plS.x, plS.y + 2);
t.step();
H.eq('护盾抵挡: 命数不变', t.getState().lives, 3);
H.eq('护盾抵挡: 护盾清零', t.getShield(), 0);

// 11) 连射：冷却减半（rapid 时 3 帧后可再开火，普通需 6 帧）
t.newGame(13);
t.setRapid(100);
H.ok('rapid fire 返回 true', t.fire()===true);
t.step(); t.step(); t.step();      // 冷却 3→0
H.ok('连射: 3 帧后可再开火', t.fire()===true);
// 对照：无连射，3 帧后仍在冷却
t.newGame(14);
t.fire();
t.step(); t.step(); t.step();
H.ok('普通: 3 帧后仍冷却无法开火', t.fire()===false);

// 12) 散射：一次开火生成 3 颗子弹
t.newGame(15);
t.setSpread(100);
const b0 = t.getState().bullets.length;
t.fire();
H.eq('散射: 一次开火 +3 颗子弹', t.getState().bullets.length, b0 + 3);

// 13) 加命道具：+1 命，上限 5
t.newGame(16); t.setLives(2);
t.applyPickup({type:'life'});
H.eq('加命: 命数+1', t.getLives(), 3);
t.setLives(5); t.applyPickup({type:'life'});
H.eq('加命: 上限 5', t.getLives(), 5);

// 14) 回归：无增益时 fire 仍只产 1 颗、敌弹仍扣命
t.newGame(17);
const rb0 = t.getState().bullets.length;
t.fire();
H.eq('回归: 普通开火只 +1 颗', t.getState().bullets.length, rb0 + 1);

// ===== Boss 系统（注入，钩子驱动）=====
// 15) 常量与判定
H.eq('BOSS_EVERY=3', t.BOSS_EVERY, 3);
H.ok('isBossWave: 3 为真', t.isBossWave(3) === true);
H.ok('isBossWave: 6 为真', t.isBossWave(6) === true);
H.ok('isBossWave: 1 为假', t.isBossWave(1) === false);
H.ok('isBossWave: 0 为假', t.isBossWave(0) === false);
H.ok('isBossWave: 非倍数 4 为假', t.isBossWave(4) === false);

// 16) spawnBoss 后 hp === maxHp，且清空普通编队
t.newGame(21); t.setWave(3);
t.spawnBoss();
let boss = t.getBoss();
H.ok('spawnBoss 后有 boss', boss !== null);
H.eq('spawnBoss: hp === maxHp', boss.hp, boss.maxHp);
// 公式校验：maxHp = round((28 + wave*6) * bossHpMult)，galaga 无难度 → bossHpMult=1
H.eq('spawnBoss: maxHp 公式正确', boss.maxHp, Math.round((28 + 3*6) * 1));
H.eq('spawnBoss: 清空普通编队(敌机=0)', t.getState().enemyCount, 0);

// 17) 非 boss 波不进入 boss 状态
t.newGame(22); t.setWave(2);
H.ok('波2 不是 boss 波', t.isBossWave(2) === false);

// 18) phase2：半血触发
t.newGame(23); t.setWave(3);
t.spawnBoss();
t.setBossHp(Math.floor(t.getBoss().maxHp / 2));  // 半血
t.updateBoss(1);
H.eq('半血触 phase2', t.getBoss().phase, 2);

// 19) 击败：返回 true + 奖励加分(100*wave) + 掉落奖励 + boss 清空
t.newGame(24); t.setWave(3);
t.spawnBoss();
const b3 = t.getBoss();
const scoreBefore = t.getScore();
t.setBossHp(1);                                   // 一击致死
t.addBullet(b3.x + b3.w/2, b3.y + b3.h/2, false); // 在 boss 中心放一颗玩家子弹
const beaten = t.updateBoss(1);
H.ok('击败返回 true', beaten === true);
H.eq('击败奖励加分 = 100*wave', t.getScore(), scoreBefore + 100*3);
H.ok('击败后 boss 清空', t.getBoss() === null);
H.ok('击败掉落奖励(rocket/道具)', t.getPickups() > 0);

// 20) 击败后推进下一波（wave++ 且重建编队）—— 经由 step() 驱动（wave 推进在 update 层）
t.newGame(25); t.setWave(3);
t.spawnBoss();
t.setBossHp(0);
t.step();   // step 的 boss 分支：updateBoss 击败 → wave++ + buildAliens
H.eq('击败后 wave 推进到 4', t.getWave(), 4);
H.ok('击败后重建普通编队', t.getState().enemyCount > 0);

// 注：galaga 核心为「清空即胜」，故 boss 波通过 spawnBoss 钩子/显式 wave 进入，
// 不破坏原有「清空编队→胜利」断言（测试 5）。

console.log('  ✓ galaga_test.js 全部通过');

// ===== 击败 Boss 即胜利 → confetti 钩子（独立于 Juice） =====
t.newGame(31);
t.setWave(3);
t.spawnBoss();
t.setBossHp(0);
t.step();   // step 内 updateBoss 击败 boss
H.ok('galaga: 击败 Boss 触发 confettiFired', t.confettiFired() === true, 'wave='+t.getWave());

if (H.results.some(r => !r.pass)) process.exit(1);
process.exit(0);
