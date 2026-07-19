// 跑酷逻辑单测：道具拾取（金币/护盾/无敌星）+ 护盾免死 + 无敌星穿障 + 无护盾死亡
const H = require('./harness');
const { t: T } = H.loadGame('../parkour.html');

function fresh(){
  T.reset(); T.startGame();
  T.setObstacles([]);
  T.setState('play');
  T.setRunner({ y: T.GROUND_Y(), onGround: true, vy: 0, jumps: 0, shield: 0, star: 0, invuln: 0 });
}

// 1) 金币拾取
fresh();
T.setPickups([{ x: 90 + 12, y: T.GROUND_Y() - 19, type: 'coin', r: 10 }]);
var c0 = T.getCoins();
T.update(1);
H.ok(T.getCoins() === c0 + 1, 'parkour: 金币被拾取 coins+1 (得到 ' + T.getCoins() + ')');
H.ok(T.getPickups().length === 0, 'parkour: 金币拾取后从场上移除');

// 2) 护盾免死：有护盾撞障碍不结束
fresh();
T.setRunner({ shield: 1 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok(T.getState() === 'play', 'parkour: 有护盾撞障碍不死 (state=' + T.getState() + ')');
H.ok(T.getRunner().shield === 0, 'parkour: 护盾被消耗 (shield=' + T.getRunner().shield + ')');
H.ok(T.getRunner().invuln > 0, 'parkour: 消耗后获得短暂无敌 (invuln=' + T.getRunner().invuln + ')');

// 3) 无敌星穿障：有 star 时撞障碍不结束
fresh();
T.setRunner({ star: 240 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok(T.getState() === 'play', 'parkour: 无敌星期间穿障不死 (state=' + T.getState() + ')');
H.ok(T.getRunner().star < 240, 'parkour: 无敌星计时递减 (star=' + T.getRunner().star + ')');

// 4) 无护盾无星 → 撞障碍 gameOver
fresh();
T.setRunner({ shield: 0, star: 0, invuln: 0 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok(T.getState() === 'over', 'parkour: 无护盾撞障碍结束 (state=' + T.getState() + ')');

// 5) collectPickup 直接调用：shield +1
fresh();
T.collectPickup({ x: 100, y: 100, type: 'shield' });
H.ok(T.getRunner().shield === 1, 'parkour: collectPickup 护盾+1 (shield=' + T.getRunner().shield + ')');

module.exports = {};
