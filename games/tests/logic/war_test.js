// 比大小：掉落道具/增益系统注入测试（确定性驱动，不依赖随机自动掉落）
const H = require('./harness');
const { t: T } = H.loadGame('../war.html');

T.reset();
const s0 = T.getState();
H.ok(s0.pickups === 0 && s0.shield === 0, 'war: reset 后无掉落/护盾');

// 1) 金币生效数值（强牌入底）
const base1 = T.getDecks().p1;
T.applyPickup('coin');
H.eq('war: 金币使 p1 牌数 +1', T.getDecks().p1, base1 + 1);

// 2) 援军生效数值（p1 牌数 +3）
const base2 = T.getDecks().p1;
T.applyPickup('heart');
H.eq('war: 援军使 p1 牌数 +3', T.getDecks().p1, base2 + 3);

// 3) 护盾生效数值
T.applyPickup('shield');
H.eq('war: 护盾置 1', T.getShield(), 1);

// 4) 拾取后移除（collectPickup）
T.reset();
const b3 = T.getDecks().p1;
T.spawnPickup('coin', 150, 150);
H.eq('war: 未拾取前掉落数=1', T.getPickups().length, 1);
T.collectPickup(0);
H.eq('war: 拾取后 p1 牌数 +1', T.getDecks().p1, b3 + 1);
H.eq('war: 拾取后掉落清空', T.getPickups().length, 0);

// 5) 未碰撞不生效
T.reset();
const b4 = T.getDecks().p1;
T.spawnPickup('coin', 150, 150);
H.eq('war: 未拾取 p1 牌数不变', T.getDecks().p1, b4);
H.eq('war: 未拾取掉落仍在', T.getPickups().length, 1);

// 6) 护盾免死（本该输的翻牌被护盾反败为胜）
T.reset();
T.setDecks([{r:2}], [{r:14}]);
T.setShield(1);
T.step();
H.eq('war: 护盾免死，p1 反获牌（2 张）', T.getDecks().p1, 2);
H.eq('war: 护盾被消耗', T.getShield(), 0);

// 7) 无盾扣血（本该输则输，p1 牌数清零）
T.reset();
T.setDecks([{r:2}], [{r:14}]);
T.setShield(0);
T.step();
H.eq('war: 无盾扣血，p1 牌数归 0', T.getDecks().p1, 0);

// 8) 护盾不影响本就获胜的局面（不被消耗）
T.reset();
T.setDecks([{r:14}], [{r:2}]);
T.setShield(1);
T.step();
H.eq('war: 本就获胜时护盾不被消耗', T.getShield(), 1);

module.exports = {};
