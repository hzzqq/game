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

module.exports = {};
