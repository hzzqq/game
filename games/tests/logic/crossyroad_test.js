const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../crossyroad.html');

// 初始态
t.reset(12345);
ok('crossyroad: 初始未结束', t.isGameOver() === false);
const s0 = t.getState();
ok('crossyroad: 玩家起始在最底行(14)', s0.player.row === 14, 'row=' + s0.player.row);
ok('crossyroad: 初始分数为0', t.getScore() === 0);

// 向前跳：行号 -1，分数增加
t.reset(7);
t.setRow(9, 'safe'); t.setRow(10, 'safe');
t.setPlayer(10, 4);
t.hop('up');
eq('crossyroad: 向前跳动行号 10→9', t.getState().player.row, 9);
ok('crossyroad: 前进后分数>0', t.getScore() > 0, 'score=' + t.getScore());

// 撞车 → 游戏结束
t.reset(1);
t.setPlayer(5, 3);
t.setRow(5, 'road');
t.setObstacles(5, [3]);
t.setRowSpeed(5, 0);
t.step(1);
ok('crossyroad: 撞车 → 游戏结束', t.isGameOver() === true);

// 落水 → 游戏结束（河面无浮木）
t.reset(2);
t.setPlayer(5, 3);
t.setRow(5, 'river');
t.setObstacles(5, []);
t.step(1);
ok('crossyroad: 落水 → 游戏结束', t.isGameOver() === true);

// 踩浮木 → 安全
t.reset(3);
t.setPlayer(5, 3);
t.setRow(5, 'river');
t.setObstacles(5, [{ pos: 3, len: 1 }]);
t.step(1);
ok('crossyroad: 踩浮木安全', t.isGameOver() === false);

// 分数随前进累加（多跳前进）
t.reset(9);
t.setRow(13, 'safe'); t.setRow(12, 'safe'); t.setRow(11, 'safe');
t.setPlayer(13, 4);
const before = t.getScore();
t.hop('up'); t.hop('up');
ok('crossyroad: 多次前进分数变大', t.getScore() > before, 'before=' + before + ' after=' + t.getScore());

// 两个种子 → 布局不同（≥2 种子）
t.reset(111); const a = JSON.stringify(t.getState().rows);
t.reset(222); const b = JSON.stringify(t.getState().rows);
ok('crossyroad: 两个种子布局不同', a !== b);

// ===== 道具系统（P1） =====
// applyPickup 数值
t.reset(5);
const b0 = t.getBonus();
t.applyPickup('coin');
ok('crossyroad: 金币加分 > 0', t.getBonus() > b0, 'bonus=' + t.getBonus());
t.applyPickup('shield');
ok('crossyroad: 护盾 +1', t.getShield() === 1, 'shield=' + t.getShield());

// 护盾免一次死（撞车）
t.reset(1);
t.setPlayer(5, 3);
t.setRow(5, 'road');
t.setObstacles(5, [3]);
t.setRowSpeed(5, 0);
t.setShield(1);
t.step(1);
ok('crossyroad: 有护盾时撞车不死', t.isGameOver() === false, 'shield=' + t.getShield());
ok('crossyroad: 护盾被消耗', t.getShield() === 0);
// 无盾才死
t.step(1);
ok('crossyroad: 护盾耗尽后再撞车死亡', t.isGameOver() === true);

// 落在道具格可拾取（hop 触发 collectPickups），用 safe 行避免干扰
t.reset(4);
t.setRow(7, 'safe'); t.setRow(8, 'safe');
t.setPlayer(8, 2);
t.spawnPickup('shield', 7, 2);
t.hop('up'); // 移动到 (7,2)
ok('crossyroad: hop 到道具格拾取护盾', t.getShield() === 1, 'shield=' + t.getShield());

// ===== 难度系统（D1） =====
// 默认普通难度，倍率 1.0 保持基线行为
ok('crossyroad: 默认普通难度', t.getDifficulty() === 'normal', 'diff=' + t.getDifficulty());
ok('crossyroad: 普通档 speedMult=1.0', Math.abs(t.diffCfg().speedMult - 1.0) < 1e-9, 'm=' + t.diffCfg().speedMult);
ok('crossyroad: 普通档 countMult=1.0', Math.abs(t.diffCfg().countMult - 1.0) < 1e-9, 'm=' + t.diffCfg().countMult);

// 相同种子下，障碍平均移动速度随难度严格递增（试全部四档）
function avgSpeed(diff){
  t.setDifficulty(diff); t.reset(777);
  const rows = t.getState().rows;
  return rows.reduce((a, r) => a + r.speed, 0) / rows.length;
}
const spE = avgSpeed('easy'), spN = avgSpeed('normal'), spH = avgSpeed('hard'), spX = avgSpeed('hell');
ok('crossyroad: 难度速度递增 简单<普通<困难<地狱',
   spE < spN && spN < spH && spH < spX, `${spE.toFixed(3)},${spN.toFixed(3)},${spH.toFixed(3)},${spX.toFixed(3)}`);
ok('crossyroad: 地狱档障碍速度>简单档', spX > spE, `hell=${spX.toFixed(3)} easy=${spE.toFixed(3)}`);

// 障碍密度：地狱档总障碍数 > 简单档（多种子确定性验证，杜绝偶发反例）
let densityOk = true;
for(let seed = 1; seed <= 40; seed++){
  t.setDifficulty('easy'); t.reset(seed * 31 + 7);
  const easyObs = t.getState().rows.reduce((a, r) => a + r.obstacles.length, 0);
  t.setDifficulty('hell'); t.reset(seed * 31 + 7);
  const hellObs = t.getState().rows.reduce((a, r) => a + r.obstacles.length, 0);
  if(!(hellObs > easyObs)){ densityOk = false; break; }
}
ok('crossyroad: 地狱档障碍密度>简单档（40 种子全成立）', densityOk);

// setDifficulty 生效 + reset 后保持
t.setDifficulty('hell'); t.reset(123);
ok('crossyroad: setDifficulty 生效', t.getDifficulty() === 'hell', 'diff=' + t.getDifficulty());
ok('crossyroad: reset 后难度保持', t.getDifficulty() === 'hell', 'diff=' + t.getDifficulty());

// 各档 reset 后仍正确反映配置（切回普通）
t.setDifficulty('normal'); t.reset(123);
ok('crossyroad: 可切回普通且倍率为 1.0', t.getDifficulty() === 'normal' && Math.abs(t.diffCfg().speedMult - 1.0) < 1e-9);

// 越界难度被忽略，保持原档
t.setDifficulty('xyz');
ok('crossyroad: 非法难度被忽略', t.getDifficulty() === 'normal');

// ===== Boss 系统（B6 鹰 Boss · 生存型） =====
// 常量与里程碑判定
ok('crossyroad: BOSS_EVERY = 3', t.BOSS_EVERY === 3, 'BOSS_EVERY=' + t.BOSS_EVERY);
ok('crossyroad: isBossWave(3) 为真', t.isBossWave(3) === true);
ok('crossyroad: isBossWave(1) 为假', t.isBossWave(1) === false);
ok('crossyroad: isBossWave(4) 为假', t.isBossWave(4) === false);

// spawnBoss：hp === maxHp，phase=1
t.reset(7);
t.spawnBoss();
const bs0 = t.getBoss();
ok('crossyroad: spawnBoss 后存在 Boss', bs0 !== null);
ok('crossyroad: spawnBoss hp === maxHp', !!bs0 && bs0.hp === bs0.maxHp, 'hp=' + (bs0 && bs0.hp) + ' maxHp=' + (bs0 && bs0.maxHp));
ok('crossyroad: spawnBoss 初始 phase=1', !!bs0 && bs0.phase === 1);

// 半血进 phase2
t.setBossHp(bs0.maxHp / 2);
t.updateBoss(0.016);
const bs1 = t.getBoss();
ok('crossyroad: 半血进入 phase2', !!bs1 && bs1.phase === 2, 'phase=' + (bs1 && bs1.phase));

// 玩家前进使 boss.hp 递减（hop 推进 + updateBoss 结算）
t.reset(7);
t.setRow(13, 'safe');            // 避免 hop 后撞车干扰
t.setPlayer(14, 4);
t.spawnBoss();
const hpBefore = t.getBoss().hp;
t.hop('up');                     // 14 → 13，furthest 推进
t.updateBoss(0.016);
const hpAfter = t.getBoss().hp;
ok('crossyroad: 前进削减 Boss 血量', hpAfter < hpBefore, 'before=' + hpBefore + ' after=' + hpAfter);

// 推进 3 个里程碑自动召唤鹰 Boss
t.reset(7);
t.setRow(11, 'safe'); t.setRow(12, 'safe'); t.setRow(13, 'safe');
t.setPlayer(14, 4);
t.hop('up'); t.hop('up'); t.hop('up');   // wave 累计到 3 → isBossWave 真 → spawnBoss
ok('crossyroad: 推进 3 行自动召唤鹰 Boss', t.getBoss() !== null, 'wave=' + t.getWave());

// 击败返回 true + 奖励 + boss 清空 + 掉落
t.reset(7);
t.spawnBoss();
const scBefore = t.getScore();
const rewardExpected = 100 * t.getWave();   // wave=1 → 100
t.setBossHp(0);
const beaten = t.updateBoss(0.016);
ok('crossyroad: 击败 Boss 返回 true', beaten === true);
ok('crossyroad: 击败后 Boss 清空', t.getBoss() === null);
ok('crossyroad: 击败奖励计入分数', t.getScore() === scBefore + rewardExpected, 'score=' + t.getScore() + ' expect=' + (scBefore + rewardExpected));
ok('crossyroad: 击败掉落至少一个道具', t.getPickups() >= 6, 'pickups=' + t.getPickups());

// setWave 生效（便于测试驱动里程碑）
t.reset(7);
t.setWave(6);
ok('crossyroad: setWave 生效', t.getWave() === 6, 'wave=' + t.getWave());
ok('crossyroad: isBossWave(setWave=6) 为真', t.isBossWave(t.getWave()) === true);


