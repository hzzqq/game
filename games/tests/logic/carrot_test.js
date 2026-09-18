// 保卫萝卜逻辑单测：击杀掉落（金币/全图加速/回血）age 生效 + 移除
const H = require('./harness');
const { t: T } = H.loadGame('../carrot.html');

// 1) 金币：age>=1.0 生效 +20
var c0 = T.getCoins();
T.spawnPickup('coin', 100, 100);
T.agePickups(1.1);
H.ok('carrot: 金币 +20 (得到 ' + T.getCoins() + ')', T.getCoins() === c0 + 20);
H.ok('carrot: 金币拾取后移除', T.getPickups() === 0);

// 2) 全图加速：energyTimer 置 5 并随 dt 递减
T.spawnPickup('energy', 100, 100);
T.agePickups(1.1);
H.ok('carrot: 加速生效 energy>3 (得到 ' + T.getEnergy().toFixed(2) + ')', T.getEnergy() > 3);

// 3) 回血/护盾道具：lives +1
var l0 = T.getLives();
T.spawnPickup('shield', 100, 100);
T.agePickups(1.1);
H.ok('carrot: 护盾道具 +1 life (得到 ' + T.getLives() + ')', T.getLives() === l0 + 1);

// 4) age<1.0 不生效、不移除
var c1 = T.getCoins();
T.spawnPickup('coin', 100, 100);
T.agePickups(0.5);
H.ok('carrot: age<1.0 不生效', T.getCoins() === c1);
H.ok('carrot: age<1.0 未移除', T.getPickups() === 1);

// 5) 注入：makePickup + applyPickup 增益（确定性，无随机）
var cBefore = T.getCoins();
var pCoin = T.makePickup('coin', 100, 100);
T.applyPickup(pCoin);
H.ok('carrot: makePickup+applyPickup coin +20 (得到 ' + T.getCoins() + ')', T.getCoins() === cBefore + 20);
var lBefore = T.getLives();
T.applyPickup(T.makePickup('shield', 100, 100));
H.ok('carrot: makePickup+applyPickup shield +1 life (得到 ' + T.getLives() + ')', T.getLives() === lBefore + 1);

// 6) 胜利彩带不抛错（Juice 桩无 confetti）
var threwC = false;
try { T.forceWin(); } catch (e) { threwC = true; }
H.ok('carrot: forceWin 不抛错', !threwC);

// 7) 手感 spawnParticle 不抛错 + 不消耗 Math.random
var _oc = Math.random, _cc = 0;
Math.random = function(){ _cc++; return _oc(); };
var threwP2 = false;
try { T.setShake(0); T.spawnParticle(100, 100, '#f0b90b', {n:5}); } catch(e){ threwP2 = true; }
Math.random = _oc;
H.ok('carrot: 手感 spawnParticle 不抛错', !threwP2);
H.ok('carrot: 手感不消耗 Math.random (calls=' + _cc + ')', _cc === 0);
H.ok('carrot: 生成粒子', T.getParticles() > 0);

// 8) 胜利 confetti 标记（forceWin 驱动到过关胜利态，确定性）
// 注：第 6 节的 forceWin 已触发过彩带标记，此处先 reset 回到干净基线再断言
T.reset();
H.ok('carrot: reset 后 confettiFired 恢复 false', T.confettiFired === false);
T.forceWin();
H.ok('carrot: 过关胜利后 confettiFired 置 true', T.confettiFired === true);
T.reset();
H.ok('carrot: 再次 reset 后 confettiFired 恢复 false', T.confettiFired === false);

module.exports = {};
