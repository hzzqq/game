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

module.exports = {};
