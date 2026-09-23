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
H.ok('parkour: 金币被拾取 coins+1 (得到 ' + T.getCoins() + ')', T.getCoins() === c0 + 1);
H.ok('parkour: 金币拾取后从场上移除', T.getPickups().length === 0);

// 2) 护盾免死：有护盾撞障碍不结束
fresh();
T.setRunner({ shield: 1 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok('parkour: 有护盾撞障碍不死 (state=' + T.getState() + ')', T.getState() === 'play');
H.ok('parkour: 护盾被消耗 (shield=' + T.getRunner().shield + ')', T.getRunner().shield === 0);
H.ok('parkour: 消耗后获得短暂无敌 (invuln=' + T.getRunner().invuln + ')', T.getRunner().invuln > 0);

// 3) 无敌星穿障：有 star 时撞障碍不结束
fresh();
T.setRunner({ star: 240 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok('parkour: 无敌星期间穿障不死 (state=' + T.getState() + ')', T.getState() === 'play');
H.ok('parkour: 无敌星计时递减 (star=' + T.getRunner().star + ')', T.getRunner().star < 240);

// 4) 无护盾无星 → 撞障碍 gameOver
fresh();
T.setRunner({ shield: 0, star: 0, invuln: 0 });
T.setObstacles([{ type: 0, x: 90, y: T.GROUND_Y() - 26, w: 22, h: 26 }]);
T.update(1);
H.ok('parkour: 无护盾撞障碍结束 (state=' + T.getState() + ')', T.getState() === 'over');

// 5) collectPickup 直接调用：shield +1
fresh();
T.collectPickup({ x: 100, y: 100, type: 'shield' });
H.ok('parkour: collectPickup 护盾+1 (shield=' + T.getRunner().shield + ')', T.getRunner().shield === 1);

// ---------- 成就/胜利正反馈：到达距离里程碑触发 confettiFired ----------
fresh();
var pg = 0;
while (!T.confettiFired() && pg < 600){ T.setObstacles([]); T.update(1); pg++; }
H.ok('parkour: 到达里程碑触发 confettiFired (steps=' + pg + ')', T.confettiFired() === true);
H.ok('parkour: 在合理步数内抵达里程碑', pg < 600);

// ===== 本地 Top5 排行榜（T-106 收口：Common.HighScores 数据层）=====
(() => {
  H.ok('parkour 排行榜 清空成功', T.clearTop5() === true);
  H.eq('parkour 排行榜 0 分不入榜', T.recordScore(0), 0);
  H.eq('parkour 排行榜 空榜无记录', T.getTop5().length, 0);
  H.eq('parkour 排行榜 9999 上榜第 1', T.recordScore(9999), 1);
  H.eq('parkour 排行榜 榜首=9999', T.getTop5()[0].score, 9999);
  H.eq('parkour 排行榜 8888 上榜第 2', T.recordScore(8888), 2);
  const top = T.getTop5();
  let sorted = true;
  for (let i = 1; i < top.length; i++) if (top[i - 1].score < top[i].score) sorted = false;
  H.ok('parkour 排行榜 全列表分数降序', sorted);
  H.ok('parkour 排行榜 条目含日期字段', /^\d{4}-\d{2}-\d{2}$/.test(top[0].date));
  for (let i = 0; i < 6; i++) T.recordScore(10000 + i);
  H.eq('parkour 排行榜 最多保留 5 条', T.getTop5().length, 5);
  H.eq('parkour 排行榜 截断后榜首仍最大', T.getTop5()[0].score, 10005);
  T.clearTop5();
  H.eq('parkour 排行榜 收尾清空', T.getTop5().length, 0);
})();

// ===== setRand 可注入随机源（T-115：随机缝 + 确定性验证）=====
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  H.ok('parkour setRand 钩子存在', typeof T.setRand === 'function');
  T.setRand(lcg(7)); T.startGame(); for (let i = 0; i < 300; i++) T.update(1/60);
  const s1 = JSON.stringify([T.getCoins(), T.getRunner()]);
  T.setRand(lcg(7)); T.startGame(); for (let i = 0; i < 300; i++) T.update(1/60);
  const s2 = JSON.stringify([T.getCoins(), T.getRunner()]);
  H.ok('parkour 同种子双局状态确定', s1 === s2);
  T.setRand();
})();

// ===== T-157 二段跳判定（mutation 缺口：runner.jumps < 2 翻转全存活）=====
(() => {
  T.setRand(); T.startGame();
  const R0 = T.getRunner();
  H.ok('parkour 起跳前 jumps=0', R0.jumps === 0);
  T.jump();
  const R1 = T.getRunner();
  H.ok('parkour 一跳 jumps=1 且离地上升', R1.jumps === 1 && R1.vy === -11.2 && R1.onGround === false);
  T.jump();
  H.ok('parkour 二段跳 jumps=2', T.getRunner().jumps === 2);
  T.jump();                          // jumps<2 不满足 → 第三跳无效
  H.ok('parkour 三跳被拒(二段跳上限)', T.getRunner().jumps === 2);
  T.setRunner({ y: T.GROUND_Y(), vy: 3 }); // 下落态触地 → update 吸附并重置 jumps
  T.update(1/60);
  const R3 = T.getRunner();
  H.ok('parkour 落地重置二段跳', R3.onGround === true && R3.jumps === 0);
})();

module.exports = {};
