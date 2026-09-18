// 地铁跑酷逻辑单测：道具拾取（金币/加速/护盾）+ 护盾免一次撞击 + 无盾失败 + 拾取后移除
const H = require('./harness');
const { t: T } = H.loadGame('../subwaysuroffers.html');

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
H.ok('subway: applyPickup 金币 coins+1 (得到 ' + T.getCoins() + ')', T.getCoins() === c0 + 1);
H.ok('subway: applyPickup 金币距离+15 (得到 ' + (T.getDistance()-d0) + ')', Math.abs((T.getDistance() - d0) - 15) < 1e-6);

fresh();
T.applyPickup('boost');
H.ok('subway: applyPickup 加速 boost=300 (得到 ' + T.getBoost() + ')', T.getBoost() === 300);

fresh();
T.setShield(0);
T.applyPickup('shield');
H.ok('subway: applyPickup 护盾 +1 (得到 ' + T.getShield() + ')', T.getShield() === 1);

// 2) 加速期间距离计分 ×2（拾取增益，不改基础公式）
fresh();
T.setBoost(300);
var bd = T.getDistance();
T.update(1);
var gain = T.getDistance() - bd;
H.ok('subway: 加速计时递减 (得到 ' + T.getBoost() + ')', T.getBoost() === 299);
H.ok('subway: 加速期间距离计分约 ×2 (增益 ' + gain.toFixed(3) + ')', gain > 0.6);

// 3) 护盾免一次撞击：有护盾撞障碍不结束、护盾消耗、获得短暂无敌
fresh();
T.setRunner({ shield: 1 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok('subway: 有护盾撞障碍不死 (state=' + T.getState() + ')', T.getState() === 'play');
H.ok('subway: 护盾被消耗 (shield=' + T.getShield() + ')', T.getShield() === 0);
H.ok('subway: 消耗后获得短暂无敌 (invuln=' + T.getRunner().invuln + ')', T.getRunner().invuln > 0);

// 4) 无护盾 → 撞障碍 gameOver（行为不变）
fresh();
T.setRunner({ shield: 0, invuln: 0 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok('subway: 无护盾撞障碍结束 (state=' + T.getState() + ')', T.getState() === 'over');

// 5) 拾取后移除（update 驱动）
fresh();
T.spawnPickup('coin', 90 + 13, T.GROUND_Y() - 19);
H.ok('subway: 生成 1 枚金币', T.getPickups().length === 1);
T.update(1);
H.ok('subway: 金币拾取后从场上移除', T.getPickups().length === 0);
H.ok('subway: 金币被拾取 coins+1 (得到 ' + T.getCoins() + ')', T.getCoins() === 1);

// 6) stepPickups：离屏道具移除 + 碰撞拾取
fresh();
T.spawnPickup('coin', -50, T.GROUND_Y() - 19);
T.stepPickups(1);
H.ok('subway: stepPickups 移除离屏道具', T.getPickups().length === 0);

fresh();
T.spawnPickup('coin', 90 + 13, T.GROUND_Y() - 19);
var cc = T.getCoins();
T.stepPickups(1);
H.ok('subway: stepPickups 碰撞拾取生效 (coins ' + T.getCoins() + ')', T.getCoins() === cc + 1);
H.ok('subway: stepPickups 拾取后移除', T.getPickups().length === 0);

// ===== 成就正反馈：破最高分触发 confetti（纯视觉层，不改计分/死亡判定）=====
(() => {
  T.reset(); T.startGame(); T.setObstacles([]); T.setState('play');
  T.setRunner({ y: T.GROUND_Y(), onGround: true, vy: 0, jumps: 0, shield: 0, invuln: 0 });
  T.update(1); T.update(1); T.update(1); // 累计距离 > 0
  T.setRunner({ shield: 0, invuln: 0 });
  T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
  T.update(1); // 撞障碍 → gameOver，距离破纪录
  H.eq('subway 破最高分触发 confettiFired', T.confettiFired(), true);
})();

// ===== 本地 Top5 排行榜（T-106 收口：Common.HighScores 数据层）=====
(() => {
  H.ok('subway 排行榜 清空成功', T.clearTop5() === true);
  H.eq('subway 排行榜 0 分不入榜', T.recordScore(0), 0);
  H.eq('subway 排行榜 空榜无记录', T.getTop5().length, 0);
  H.eq('subway 排行榜 9999 上榜第 1', T.recordScore(9999), 1);
  H.eq('subway 排行榜 榜首=9999', T.getTop5()[0].score, 9999);
  H.eq('subway 排行榜 8888 上榜第 2', T.recordScore(8888), 2);
  const top = T.getTop5();
  let sorted = true;
  for (let i = 1; i < top.length; i++) if (top[i - 1].score < top[i].score) sorted = false;
  H.ok('subway 排行榜 全列表分数降序', sorted);
  H.ok('subway 排行榜 条目含日期字段', /^\d{4}-\d{2}-\d{2}$/.test(top[0].date));
  for (let i = 0; i < 6; i++) T.recordScore(10000 + i);
  H.eq('subway 排行榜 最多保留 5 条', T.getTop5().length, 5);
  H.eq('subway 排行榜 截断后榜首仍最大', T.getTop5()[0].score, 10005);
  T.clearTop5();
  H.eq('subway 排行榜 收尾清空', T.getTop5().length, 0);
})();

module.exports = {};
