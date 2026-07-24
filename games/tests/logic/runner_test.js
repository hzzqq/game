// 跑酷逻辑单测：道具拾取（金币/加速/护盾）+ 护盾免一次撞击 + 无盾失败 + 拾取后移除
const H = require('./harness');
const { t: T } = H.loadGame('../runner.html');

function fresh(){
  T.reset(); T.startGame();
  T.setObstacles([]);
  T.setState('play');
  T.setRunner({ y: T.GROUND_Y(), onGround: true, vy: 0, jumps: 0, shield: 0, invuln: 0 });
}

// 1) applyPickup 数值生效
fresh();
var d0 = T.getDistance(), c0 = T.getCoins();
T.applyPickup('coin');
H.ok(T.getCoins() === c0 + 1, 'runner: applyPickup 金币 coins+1 (得到 ' + T.getCoins() + ')');
H.ok(Math.abs((T.getDistance() - d0) - 15) < 1e-6, 'runner: applyPickup 金币距离+15 (得到 ' + (T.getDistance()-d0) + ')');

fresh();
T.applyPickup('boost');
H.ok(T.getBoost() === 300, 'runner: applyPickup 加速 boost=300 (得到 ' + T.getBoost() + ')');

fresh();
T.setShield(0);
T.applyPickup('shield');
H.ok(T.getShield() === 1, 'runner: applyPickup 护盾 +1 (得到 ' + T.getShield() + ')');

// 2) 加速期间距离计分 ×2（拾取增益，不改基础公式）
fresh();
T.setBoost(300);
var bd = T.getDistance();
T.update(1);
var gain = T.getDistance() - bd;
H.ok(T.getBoost() === 299, 'runner: 加速计时递减 (得到 ' + T.getBoost() + ')');
H.ok(gain > 0.6, 'runner: 加速期间距离计分约 ×2 (增益 ' + gain.toFixed(3) + ')');

// 3) 护盾免一次撞击：有护盾撞障碍不结束、护盾消耗、获得短暂无敌
fresh();
T.setRunner({ shield: 1 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok(T.getState() === 'play', 'runner: 有护盾撞障碍不死 (state=' + T.getState() + ')');
H.ok(T.getShield() === 0, 'runner: 护盾被消耗 (shield=' + T.getShield() + ')');
H.ok(T.getRunner().invuln > 0, 'runner: 消耗后获得短暂无敌 (invuln=' + T.getRunner().invuln + ')');

// 4) 无护盾 → 撞障碍 gameOver（行为不变）
fresh();
T.setRunner({ shield: 0, invuln: 0 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok(T.getState() === 'over', 'runner: 无护盾撞障碍结束 (state=' + T.getState() + ')');

// 5) 拾取后移除（update 驱动）
fresh();
T.spawnPickup('coin', 90 + 13, T.GROUND_Y() - 19);
H.ok(T.getPickups().length === 1, 'runner: 生成 1 枚金币');
T.update(1);
H.ok(T.getPickups().length === 0, 'runner: 金币拾取后从场上移除');
H.ok(T.getCoins() === 1, 'runner: 金币被拾取 coins+1 (得到 ' + T.getCoins() + ')');

// 6) stepPickups：离屏道具移除 + 碰撞拾取
fresh();
T.spawnPickup('coin', -50, T.GROUND_Y() - 19);
T.stepPickups(1);
H.ok(T.getPickups().length === 0, 'runner: stepPickups 移除离屏道具');

fresh();
T.spawnPickup('coin', 90 + 13, T.GROUND_Y() - 19);
var cc = T.getCoins();
T.stepPickups(1);
H.ok(T.getCoins() === cc + 1, 'runner: stepPickups 碰撞拾取生效 (coins ' + T.getCoins() + ')');
H.ok(T.getPickups().length === 0, 'runner: stepPickups 拾取后移除');

// 7) 难度系统：地狱档滚动/障碍速度 > 简单档（speedMult 生效）
(function(){
  T.setDifficulty('easy'); T.reset(); T.startGame(); T.setObstacles([]); T.setState('play'); T.update(1);
  var sEasy = T.getSpeed();
  T.setDifficulty('hell'); T.reset(); T.startGame(); T.setObstacles([]); T.setState('play'); T.update(1);
  var sHell = T.getSpeed();
  H.ok(sHell > sEasy, 'runner: 地狱档速度 > 简单档 (' + sHell.toFixed(2) + ' > ' + sEasy.toFixed(2) + ')');
})();

// 8) 难度系统：setDifficulty 生效（返回值/当前档/重开一局/障碍间隔随难度变化）
(function(){
  T.setDifficulty('normal');
  H.ok(T.getDifficulty() === 'normal', 'runner: 默认难度 normal');
  var ok = T.setDifficulty('hard');
  H.ok(ok === true, 'runner: setDifficulty 返回 true');
  H.ok(T.getDifficulty() === 'hard', 'runner: setDifficulty 生效 (getDifficulty=hard)');
  H.ok(T.getState() === 'play', 'runner: setDifficulty 重开一局 (state=play)');
  // 地狱档障碍间隔应小于简单档（countMult 越大越密，normal=1.0 不变）
  T.setDifficulty('easy'); T.reset(); T.startGame(); T.setObstacles([]); T.setState('play'); T.update(1);
  var gEasy = T.getSpawnGap();
  T.setDifficulty('hell'); T.reset(); T.startGame(); T.setObstacles([]); T.setState('play'); T.update(1);
  var gHell = T.getSpawnGap();
  H.ok(gHell < gEasy, 'runner: 地狱档障碍间隔 < 简单档 (' + gHell.toFixed(1) + ' < ' + gEasy.toFixed(1) + ')');
  // 非法难度被忽略
  H.ok(T.setDifficulty('xx') === false, 'runner: 非法难度 setDifficulty 返回 false');
})();

// 9) 生存型 Boss 系统（标准样板 §3）：障碍 Boss + 顶部血条 + 生存耗竭
(function(){
  // BOSS_EVERY 常量与 isBossWave 判定（以距离里程碑 w 计）
  H.ok(T.BOSS_EVERY === 3, 'runner: BOSS_EVERY === 3 (得到 ' + T.BOSS_EVERY + ')');
  H.ok(T.isBossWave(1) === false, 'runner: isBossWave(1) 非 Boss 里程碑');
  H.ok(T.isBossWave(3) === true, 'runner: isBossWave(3) 是 Boss 里程碑');
  H.ok(T.isBossWave(6) === true, 'runner: isBossWave(6) 是 Boss 里程碑');

  // spawnBoss：hp 初始化为 maxHp，清空普通障碍
  T.reset(); T.startGame(); T.setObstacles([{type:0,x:90,y:50,w:22,h:26}]); T.setState('play');
  T.spawnBoss(3);
  var bb = T.getBoss();
  H.ok(bb && bb.hp === bb.maxHp, 'runner: spawnBoss 后 hp === maxHp (hp=' + (bb&&bb.hp) + ', maxHp=' + (bb&&bb.maxHp) + ')');
  H.ok(T.getBossBullets() === 0, 'runner: spawnBoss 清空攻击波');

  // phase2 半血：hp 降到一半触发狂暴（phase=2，vx 变快）
  T.reset(); T.startGame(); T.setState('play');
  T.spawnBoss(3);
  var vx0 = T.getBoss().vx;
  T.setBossHp(T.getBoss().maxHp / 2);
  T.updateBoss(1);
  H.ok(T.getBoss().phase === 2, 'runner: 半血进入 phase2 (phase=' + (T.getBoss()&&T.getBoss().phase) + ')');
  H.ok(T.getBoss().vx > vx0, 'runner: phase2 速度加快 (vx ' + vx0.toFixed(1) + ' → ' + (T.getBoss()&&T.getBoss().vx.toFixed(1)) + ')');

  // 击败返回 true + 奖励：hp 归零即击败，score 增加、boss 清空
  T.reset(); T.startGame(); T.setState('play');
  T.spawnBoss(3);
  var sc0 = T.getScore();
  T.setBossHp(1);
  var beaten = T.updateBoss(1);
  H.ok(beaten === true, 'runner: 击败 Boss 返回 true');
  H.ok(T.getScore() > sc0, 'runner: 击败 Boss 获得奖励 (score ' + sc0 + ' → ' + T.getScore() + ')');
  H.ok(T.getBoss() === null, 'runner: 击败后 boss 清空');

  // bossHpMult：地狱档 maxHp > 简单档（同里程碑）
  T.setDifficulty('easy');  T.reset(); T.startGame(); T.setState('play'); T.spawnBoss(3);
  var mA = T.getBoss().maxHp;
  T.setDifficulty('hell');   T.reset(); T.startGame(); T.setState('play'); T.spawnBoss(3);
  var mB = T.getBoss().maxHp;
  H.ok(mB > mA, 'runner: 地狱档 Boss maxHp > 简单档 (' + mB + ' > ' + mA + ')');

  // ---------- 成就/胜利正反馈：到达距离里程碑触发 confettiFired ----------
  fresh();
  T.setWave(1);            // distance = 100，与初始 milestone(100) 对齐
  T.update(1);
  H.ok(T.confettiFired() === true, 'runner: 到达里程碑触发 confettiFired');
  T.update(1);            // 跳变防重复：再次 update 不应重复清零
  H.ok(T.confettiFired() === true, 'runner: confettiFired 持续为真（跳变防重复）');
})();

module.exports = {};
