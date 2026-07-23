// 喷射包飞行逻辑单测：拍翅/重力/碰撞/计分/死亡/重置 + 道具系统（coin/boost/shield）
const H = require('./harness');
const { t: T } = H.loadGame('../jetpack.html');

// ===================== 核心基线（原玩法，改动点不动）=====================
// 1) 菜单态喷喷射 → 进入游戏且获得向上初速
T.reset();
T.flap();
H.ok(T.getStatus() === 'play', 'jetpack: 喷射从菜单进入游戏');
H.ok(T.getState().bird.vy === T.FLAP && T.FLAP < 0, 'jetpack: 喷射给向上初速 vy=FLAP(<0)');

// 2) 重力把鸟往下拉
T.reset(); T.setStatus('play');
var by0 = T.getState().bird.y;
T.setBird(by0, 0);
T.step(0.1);
H.ok(T.getState().bird.y > by0, 'jetpack: 重力使鸟下落 (y ' + by0.toFixed(1) + '→' + T.getState().bird.y.toFixed(1) + ')');

// 3) 撞上管道 → 碰撞判定为真
T.reset(); T.clearPipes(); T.setStatus('play');
var bx = T.getState().bird.x;
T.addPipe(bx, 300);            // 上管占据 0..300
T.setBird(100, 0);            // 鸟身在管内
H.ok(T.hits() === true, 'jetpack: 鸟身陷管道 → 碰撞');

// 4) 处于间隙中央 → 不碰撞
T.reset(); T.clearPipes(); T.setStatus('play');
T.addPipe(bx, 300);           // 间隙 300..458
T.setBird(379, 0);            // 间隙中央
H.ok(T.hits() === false, 'jetpack: 间隙中央 → 不碰撞');

// 5) 触地 → 碰撞
T.reset(); T.setStatus('play');
T.setBird(T.GROUND + 5, 0);
H.ok(T.hits() === true, 'jetpack: 触地 → 碰撞');

// 6) 穿过管道计分 +1（距离计分公式不变）
T.reset(); T.clearPipes(); T.setStatus('play'); T.setScore(0);
T.addPipe(bx + T.PIPE_W + 4, 300);
T.step(1.0);
H.ok(T.getScore() === 1, 'jetpack: 越过管道计分 +1 (score=' + T.getScore() + ')');

// 7) 撞地 → 状态变 dead
T.reset(); T.setStatus('play');
T.setBird(T.GROUND + 5, 0);
T.step(0.016);
H.ok(T.getStatus() === 'dead', 'jetpack: 撞地 → 状态 dead');

// 8) 重置清空分数与管道、道具
T.reset();
H.ok(T.getScore() === 0, 'jetpack: 重置分数归零');
H.ok(T.getStatus() === 'menu', 'jetpack: 重置回菜单');
H.eq('jetpack: 重置清空掉落物', T.getPickups().length, 0);
H.ok('jetpack: 重置护盾为 0', T.getShield() === false);
H.ok('jetpack: 重置加速为 0', T.getBoost() === false);

// ===================== 道具系统（注入分支）=====================
// 9) spawnPickup + getPickups
(() => {
  T.reset(); T.setStatus('play');
  T.spawnPickup('coin', 100, 100);
  T.spawnPickup('boost', 200, 50);
  var ps = T.getPickups();
  H.eq('jetpack spawnPickup 数量', ps.length, 2);
  H.eq('jetpack spawnPickup 类型', ps[0].type, 'coin');
  H.eq('jetpack spawnPickup 坐标', { x: ps[0].x, y: ps[0].y }, { x: 100, y: 100 });
})();

// 10) applyPickup('coin') → 加分 +50
(() => {
  T.reset(); T.setStatus('play'); T.setScore(0);
  T.applyPickup('coin');
  H.eq('jetpack applyPickup coin 加分+50', T.getScore(), 50, '得到 ' + T.getScore());
})();

// 11) applyPickup('boost') → 加速生效
(() => {
  T.reset(); T.setStatus('play');
  T.applyPickup('boost');
  H.ok('jetpack applyPickup boost 生效', T.getBoost() === true);
})();

// 12) applyPickup('shield') → 护盾 +1
(() => {
  T.reset(); T.setStatus('play');
  T.applyPickup('shield');
  H.ok('jetpack applyPickup shield 生效', T.getShield() === true);
  H.eq('jetpack applyPickup shield 计数', T.getShieldCount(), 1);
})();

// 13) 拾取生效 + 移除：金币与鸟重叠 → 加分并移除
(() => {
  T.reset(); T.setStatus('play'); T.setScore(0);
  var b = T.getState().bird;
  T.spawnPickup('coin', b.x, b.y);
  T.stepPickups(0.016);
  H.eq('jetpack 拾取coin分数+50', T.getScore(), 50, '得到 ' + T.getScore());
  H.eq('jetpack 拾取后移除', T.getPickups().length, 0);
})();

// 14) 未碰撞不生效：道具远离鸟 → 分数不变、道具仍在
(() => {
  T.reset(); T.setStatus('play'); T.setScore(0);
  T.spawnPickup('coin', 10, 10);
  T.stepPickups(0.016);
  H.eq('jetpack 未碰撞分数不变', T.getScore(), 0);
  H.eq('jetpack 未碰撞道具仍在', T.getPickups().length, 1);
})();

// 15) 护盾免一次撞击：有盾撞地仍存活，盾被消耗
(() => {
  T.reset(); T.setStatus('play'); T.setShield(1);
  var b = T.getState().bird;
  T.clearPipes();
  T.addPipe(b.x, 0);          // 底部管覆盖鸟（y≈0.42H 处）
  T.setBird(300, 0);
  T.step(0.016);              // 撞击 → 应消耗护盾存活
  H.ok('jetpack 有盾撞地仍存活', T.getStatus() === 'play');
  H.eq('jetpack 撞击后盾被消耗', T.getShield(), false);
})();

// 16) 无盾失败不变：无盾撞地 → 状态 dead，分数/增益不受影响
(() => {
  T.reset(); T.setStatus('play'); T.setShield(0); T.setScore(7);
  var b = T.getState().bird;
  T.clearPipes();
  T.addPipe(b.x, 0);
  T.setBird(300, 0);
  T.step(0.016);
  H.ok('jetpack 无盾撞地 → dead', T.getStatus() === 'dead');
  H.eq('jetpack 无盾失败分数不变', T.getScore(), 7);
  H.ok('jetpack 无盾失败无护盾', T.getShield() === false);
  H.ok('jetpack 无盾失败无加速', T.getBoost() === false);
})();

// 17) 加速增益改变滚动速度（验证 boost 确实影响场景）
(() => {
  T.reset(); T.setStatus('play');
  var s0 = T.scrollSpd();
  T.setBoost(true);
  H.ok('jetpack 加速时滚动更快', T.scrollSpd() > s0);
})();

// ===================== 难度系统（spec §2，倍率法，normal=1.0 保持原行为）=====================
// 18) 默认难度为普通；DIFFICULTY / DIFF_ORDER 钩子存在
H.eq('jetpack 默认难度=normal', T.getDifficulty(), 'normal');
H.ok('jetpack DIFFICULTY 含四档', T.DIFFICULTY && T.DIFFICULTY.easy && T.DIFFICULTY.hell);
H.eq('jetpack DIFF_ORDER 顺序', T.DIFF_ORDER, ['easy','normal','hard','hell']);

// 19) normal=1.0 保持原有行为：速度=基准、间隔=基准
(() => {
  T.reset(); T.setDifficulty('normal');
  H.eq('jetpack normal 速度=基准', T.getPipeSpd(), 155);
  H.eq('jetpack normal 间隔=基准', T.getSpawnDx(), 230);
})();

// 20) 地狱档速度 > 简单档速度（speedMult 生效）
(() => {
  T.reset(); T.setDifficulty('easy');   var se = T.getPipeSpd();
  T.reset(); T.setDifficulty('hell');    var sh = T.getPipeSpd();
  H.ok('jetpack 地狱速度>简单速度 (' + se + '→' + sh + ')', sh > se);
})();

// 21) countMult 影响障碍密度/间隔：地狱间隔 < 简单间隔（越密）
(() => {
  T.reset(); T.setDifficulty('easy');   var de = T.getSpawnDx();
  T.reset(); T.setDifficulty('hell');    var dh = T.getSpawnDx();
  H.ok('jetpack 地狱间隔<简单间隔 (' + de.toFixed(0) + '→' + dh.toFixed(0) + ')', dh < de);
})();

// 22) setDifficulty 生效且重开：改变难度后 getDifficulty 更新、速度按新档重算并回到菜单（新一局）
(() => {
  T.reset(); T.setDifficulty('hard');
  H.eq('jetpack setDifficulty 生效', T.getDifficulty(), 'hard');
  H.eq('jetpack setDifficulty 重开速度=基准*1.25', T.getPipeSpd(), 155 * 1.25);
  H.eq('jetpack setDifficulty 重开后状态=menu', T.getStatus(), 'menu');
})();

// 23) 非法难度被忽略，保持原档
(() => {
  T.reset(); T.setDifficulty('normal');
  T.setDifficulty('nope');
  H.eq('jetpack 非法难度被忽略', T.getDifficulty(), 'normal');
})();

// 24) 难度只影响配置，不动核心玩法：normal 下原单测基线（计分/碰撞）仍成立
(() => {
  T.reset(); T.clearPipes(); T.setStatus('play'); T.setScore(0);
  var bx = T.getState().bird.x;
  T.addPipe(bx + T.PIPE_W + 4, 300);
  T.step(1.0);
  H.eq('jetpack 难度不影响计分公式', T.getScore(), 1);
})();

module.exports = {};
