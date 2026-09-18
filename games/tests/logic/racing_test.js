// 赛车逻辑单测：道路掉落道具（金币/加速/护盾）拾取生效 + 护盾免撞车
const H = require('./harness');
const { t: T } = H.loadGame('../racing.html');

T.reset();

// 1) 金币：distance +50
var d0 = T.getDistance();
T.applyPickup('coin');
H.ok('racing: 金币 distance+50 (得到 ' + T.getDistance() + ')', T.getDistance() === d0 + 50);

// 2) 护盾：+1
T.reset();
T.applyPickup('shield');
H.ok('racing: 护盾 +1 (得到 ' + T.getShield() + ')', T.getShield() === 1);

// 3) 加速：boostTimer 置 8s
T.reset();
T.applyPickup('boost');
H.ok('racing: 加速 boostTimer>0 (得到 ' + T.getBoost().toFixed(2) + ')', T.getBoost() > 0);

// 4) 集成：掉落物随路下滚 + AABB 拾取（贴玩家上方，step 后进入碰撞）
T.reset();
var py = T.player.y, pl = T.player.lane;
T.spawnPickup('coin', pl, py - 6);
var before = T.getPickups();
var d1 = T.getDistance();
T.stepPickups(0.05);
H.ok('racing: 拾取后从场上移除 (剩 ' + T.getPickups() + ')', T.getPickups() === before - 1);
H.ok('racing: 集成拾取 distance+50 (得到 ' + T.getDistance() + ')', T.getDistance() === d1 + 50);

// 5) 护盾免撞车：有护盾撞车不丢命、护盾被消耗
T.reset();
T.setShield(1);
var lives0 = T.getLives();
T.spawnEnemyOnPlayer();
T.update(0.016);
H.ok('racing: 有护盾撞车不丢命 (lives=' + T.getLives() + ')', T.getLives() === lives0);
H.ok('racing: 护盾被消耗 (shield=' + T.getShield() + ')', T.getShield() === 0);

// 6) 无护盾撞车：丢一条命
T.reset();
var lives1 = T.getLives();
T.spawnEnemyOnPlayer();
T.update(0.016);
H.ok('racing: 无护盾撞车丢命 (lives=' + T.getLives() + ')', T.getLives() === lives1 - 1);

// 7) 里程碑冲线彩带：里程达标 → confettiFired 置真（只读锁，独立于 Juice）
T.reset();
H.ok('racing: 冲线前 confettiFired 为 false', T.confettiFired() === false);
T.win();
H.ok('racing: 里程达标(' + T.getWinDist() + 'M) → confettiFired 为真', T.confettiFired() === true);
H.ok('racing: 冲线不结束游戏(仍为 playing)', T.getState() === 'playing');

// 8) 重置后锁复位
T.reset();
H.ok('racing: 重置后 confettiFired 复位', T.confettiFired() === false);

const total = H.results.length;
const pass = H.results.filter(r => r.pass).length;
console.log(`\nracing: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

// ===== 本地 Top5 排行榜（T-106 收口：Common.HighScores 数据层）=====
(() => {
  H.ok('racing 排行榜 清空成功', T.clearTop5() === true);
  H.eq('racing 排行榜 0 分不入榜', T.recordScore(0), 0);
  H.eq('racing 排行榜 空榜无记录', T.getTop5().length, 0);
  H.eq('racing 排行榜 9999 上榜第 1', T.recordScore(9999), 1);
  H.eq('racing 排行榜 榜首=9999', T.getTop5()[0].score, 9999);
  H.eq('racing 排行榜 8888 上榜第 2', T.recordScore(8888), 2);
  const top = T.getTop5();
  let sorted = true;
  for (let i = 1; i < top.length; i++) if (top[i - 1].score < top[i].score) sorted = false;
  H.ok('racing 排行榜 全列表分数降序', sorted);
  H.ok('racing 排行榜 条目含日期字段', /^\d{4}-\d{2}-\d{2}$/.test(top[0].date));
  for (let i = 0; i < 6; i++) T.recordScore(10000 + i);
  H.eq('racing 排行榜 最多保留 5 条', T.getTop5().length, 5);
  H.eq('racing 排行榜 截断后榜首仍最大', T.getTop5()[0].score, 10005);
  T.clearTop5();
  H.eq('racing 排行榜 收尾清空', T.getTop5().length, 0);
})();

// ===== setRand 可注入随机源（T-115：随机缝 + 确定性验证）=====
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  H.ok('racing setRand 钩子存在', typeof T.setRand === 'function');
  T.setRand(lcg(7)); T.reset(); for (let i = 0; i < 300; i++) T.update(1/60);
  const s1 = JSON.stringify([T.getDistance(), T.getLives(), T.getPickups()]);
  T.setRand(lcg(7)); T.reset(); for (let i = 0; i < 300; i++) T.update(1/60);
  const s2 = JSON.stringify([T.getDistance(), T.getLives(), T.getPickups()]);
  H.ok('racing 同种子双局状态确定', s1 === s2);
  T.setRand();
})();

module.exports = {};
