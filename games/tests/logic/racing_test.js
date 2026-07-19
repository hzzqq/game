// 赛车逻辑单测：道路掉落道具（金币/加速/护盾）拾取生效 + 护盾免撞车
const H = require('./harness');
const { t: T } = H.loadGame('../racing.html');

T.reset();

// 1) 金币：distance +50
var d0 = T.getDistance();
T.applyPickup('coin');
H.ok(T.getDistance() === d0 + 50, 'racing: 金币 distance+50 (得到 ' + T.getDistance() + ')');

// 2) 护盾：+1
T.reset();
T.applyPickup('shield');
H.ok(T.getShield() === 1, 'racing: 护盾 +1 (得到 ' + T.getShield() + ')');

// 3) 加速：boostTimer 置 8s
T.reset();
T.applyPickup('boost');
H.ok(T.getBoost() > 0, 'racing: 加速 boostTimer>0 (得到 ' + T.getBoost().toFixed(2) + ')');

// 4) 集成：掉落物随路下滚 + AABB 拾取（贴玩家上方，step 后进入碰撞）
T.reset();
var py = T.player.y, pl = T.player.lane;
T.spawnPickup('coin', pl, py - 6);
var before = T.getPickups();
var d1 = T.getDistance();
T.stepPickups(0.05);
H.ok(T.getPickups() === before - 1, 'racing: 拾取后从场上移除 (剩 ' + T.getPickups() + ')');
H.ok(T.getDistance() === d1 + 50, 'racing: 集成拾取 distance+50 (得到 ' + T.getDistance() + ')');

// 5) 护盾免撞车：有护盾撞车不丢命、护盾被消耗
T.reset();
T.setShield(1);
var lives0 = T.getLives();
T.spawnEnemyOnPlayer();
T.update(0.016);
H.ok(T.getLives() === lives0, 'racing: 有护盾撞车不丢命 (lives=' + T.getLives() + ')');
H.ok(T.getShield() === 0, 'racing: 护盾被消耗 (shield=' + T.getShield() + ')');

// 6) 无护盾撞车：丢一条命
T.reset();
var lives1 = T.getLives();
T.spawnEnemyOnPlayer();
T.update(0.016);
H.ok(T.getLives() === lives1 - 1, 'racing: 无护盾撞车丢命 (lives=' + T.getLives() + ')');

module.exports = {};
