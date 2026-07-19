// 保卫萝卜逻辑单测：击杀掉落（金币/全图加速/回血）age 生效 + 移除
const H = require('./harness');
const { t: T } = H.loadGame('../carrot.html');

// 1) 金币：age>=1.0 生效 +20
var c0 = T.getCoins();
T.spawnPickup('coin', 100, 100);
T.agePickups(1.1);
H.ok(T.getCoins() === c0 + 20, 'carrot: 金币 +20 (得到 ' + T.getCoins() + ')');
H.ok(T.getPickups() === 0, 'carrot: 金币拾取后移除');

// 2) 全图加速：energyTimer 置 5 并随 dt 递减
T.spawnPickup('energy', 100, 100);
T.agePickups(1.1);
H.ok(T.getEnergy() > 3, 'carrot: 加速生效 energy>3 (得到 ' + T.getEnergy().toFixed(2) + ')');

// 3) 回血/护盾道具：lives +1
var l0 = T.getLives();
T.spawnPickup('shield', 100, 100);
T.agePickups(1.1);
H.ok(T.getLives() === l0 + 1, 'carrot: 护盾道具 +1 life (得到 ' + T.getLives() + ')');

// 4) age<1.0 不生效、不移除
var c1 = T.getCoins();
T.spawnPickup('coin', 100, 100);
T.agePickups(0.5);
H.ok(T.getCoins() === c1, 'carrot: age<1.0 不生效');
H.ok(T.getPickups() === 1, 'carrot: age<1.0 未移除');

module.exports = {};
