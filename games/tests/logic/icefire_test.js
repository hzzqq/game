// 冰火人逻辑单测：关卡内置道具（护盾/得分星）拾取生效 + 清空
const H = require('./harness');
const { t: T } = H.loadGame('../icefire.html');

// 1) 分数 set/get 通路
T.setScore(7);
H.ok(T.getScore() === 7, 'icefire: setScore/getScore (得到 ' + T.getScore() + ')');

// 2) 护盾道具：双方各 +1，拾取后清空
T.spawnPowerup('shield', 100, 100);
T.collectAll();
H.ok(T.ice.shield === 1 && T.fire.shield === 1, 'icefire: 护盾道具双方+1 (ice=' + T.ice.shield + ' fire=' + T.fire.shield + ')');
H.ok(T.getPowerups() === 0, 'icefire: 拾取后清空');

// 3) 得分星：双方 starTimer 置 8s
T.spawnPowerup('star', 100, 100);
T.collectAll();
H.ok(T.ice.starTimer === 8 && T.fire.starTimer === 8, 'icefire: 得分星 8s (ice=' + T.ice.starTimer + ' fire=' + T.fire.starTimer + ')');

// 4) 标准化掉落：⚡加速 生效 + 拾取后移除
T.setBoost(0); T.ice.speedTimer=0; T.fire.speedTimer=0;
T.spawnPickup('speed', T.ice.x+13, T.ice.y+17);
T.stepPickups(0.05);
H.ok(T.ice.speedTimer > 0, 'icefire: 加速 pickup 生效 (speedTimer=' + T.ice.speedTimer + ')');
H.ok(T.getPickups() === 0, 'icefire: 拾取后移除');

// 5) 未碰撞不生效
T.spawnPickup('speed', 0, 0);
T.stepPickups(0.05);
H.ok(T.getPickups() === 1, 'icefire: 未碰撞 pickup 仍在');

// 6) ❤回血(pickup) → 双方护盾+1（本作无 HP，回血映射为护盾）
T.setShield(0); T.ice.shield=0; T.fire.shield=0;
T.spawnPickup('heal', T.ice.x+13, T.ice.y+17);
T.stepPickups(0.05);
H.ok(T.ice.shield === 1 && T.fire.shield === 1, 'icefire: heal 双方护盾+1 (ice=' + T.ice.shield + ' fire=' + T.fire.shield + ')');

// 7) 护盾免死：有盾时 takeHit 不掉（不重生）
T.setShield(1); T.ice.shieldGrace = 0;
var ix0 = T.ice.x;
T.takeHit(1);
H.ok(T.ice.shield === 0, 'icefire: 护盾消耗 (shield=' + T.ice.shield + ')');
H.ok(T.ice.x === ix0, 'icefire: 护盾免死未重生');

// 8) 无盾：takeHit → 重生到起点
T.setShield(0); T.ice.shieldGrace = 0;
var isx = T.ice.startX;
T.takeHit(1);
H.ok(T.ice.x === isx, 'icefire: 无盾死亡→重生到起点 (x=' + T.ice.x + ')');

// 9) 加速 get/set
T.setBoost(5);
H.ok(T.getBoost() === 5, 'icefire: getBoost=5 (boost=' + T.getBoost() + ')');

module.exports = {};
