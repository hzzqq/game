// 打地鼠：掉落道具/增益系统注入测试（确定性驱动，不依赖随机自动掉落）
const H = require('./harness');
const { t: T } = H.loadGame('../whack.html');

T.reset();
const s0 = T.getState();
H.ok(s0.pickups === 0, 'whack: reset 后无掉落');

// 1) 高分金币生效数值
T.setScore(0);
T.applyPickup('coin');
H.eq('whack: 金币 +100', T.getScore(), 100);

// 2) 加时间生效数值
T.setTime(10);
T.applyPickup('clock');
H.eq('whack: 加时间 +3', T.getTime(), 13);

// 3) 未碰撞不生效（点击远离）
T.reset(); T.setScore(0);
T.spawnPickup('coin', 100, 100);
H.eq('whack: 未碰撞前掉落数=1', T.getPickups().length, 1);
T.collectAt(500, 500);
H.eq('whack: 远离点击未拾取，分数不变', T.getScore(), 0);
H.eq('whack: 远离点击掉落仍在', T.getPickups().length, 1);

// 4) 拾取后移除（点击命中）
T.reset(); T.setScore(0);
T.spawnPickup('coin', 100, 100);
T.collectAt(100, 100);
H.eq('whack: 点击命中分数 +100', T.getScore(), 100);
H.eq('whack: 拾取后掉落清空', T.getPickups().length, 0);

// 5) 未碰撞不生效（仅下落不自动拾取）
T.reset(); T.setScore(0);
T.spawnPickup('coin', 200, 200);
T.stepPickups(0.05);
H.eq('whack: 仅下落未拾取，分数不变', T.getScore(), 0);
H.eq('whack: 仅下落掉落仍在', T.getPickups().length, 1);

// ===== 破纪录里程碑 confetti 测试（仅视觉反馈钩子，不改玩法）=====
T.reset(); T.setScore(1000);
H.ok(T.confettiFired() === false, 'whack: 破纪录前 confettiFired 为 false');
T.endGame(); // 1000 > best(0) → 新纪录
H.ok(T.confettiFired() === true, 'whack: 破纪录 → confettiFired 为真');
// 同一局只触发一次（锁）
T.setScore(2000); T.endGame();
H.ok(T.confettiFired() === true, 'whack: 二次破纪录仍受锁保护（只触发一次）');

const results = H.results;
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nwhack: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

// ===== 本地 Top5 排行榜（T-106 收口：Common.HighScores 数据层）=====
(() => {
  H.ok('whack 排行榜 清空成功', T.clearTop5() === true);
  H.eq('whack 排行榜 0 分不入榜', T.recordScore(0), 0);
  H.eq('whack 排行榜 空榜无记录', T.getTop5().length, 0);
  H.eq('whack 排行榜 9999 上榜第 1', T.recordScore(9999), 1);
  H.eq('whack 排行榜 榜首=9999', T.getTop5()[0].score, 9999);
  H.eq('whack 排行榜 8888 上榜第 2', T.recordScore(8888), 2);
  const top = T.getTop5();
  let sorted = true;
  for (let i = 1; i < top.length; i++) if (top[i - 1].score < top[i].score) sorted = false;
  H.ok('whack 排行榜 全列表分数降序', sorted);
  H.ok('whack 排行榜 条目含日期字段', /^\d{4}-\d{2}-\d{2}$/.test(top[0].date));
  for (let i = 0; i < 6; i++) T.recordScore(10000 + i);
  H.eq('whack 排行榜 最多保留 5 条', T.getTop5().length, 5);
  H.eq('whack 排行榜 截断后榜首仍最大', T.getTop5()[0].score, 10005);
  T.clearTop5();
  H.eq('whack 排行榜 收尾清空', T.getTop5().length, 0);
})();

// ===== setRand 可注入随机源（T-115：随机缝 + 确定性验证）=====
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  H.ok('whack setRand 钩子存在', typeof T.setRand === 'function');
  T.setRand(lcg(7)); T.startGame(); for (let i = 0; i < 600; i++) T.update(1/60);
  const s1 = JSON.stringify([T.getState(), T.getHoles().map(h => h.state)]);
  T.setRand(lcg(7)); T.startGame(); for (let i = 0; i < 600; i++) T.update(1/60);
  const s2 = JSON.stringify([T.getState(), T.getHoles().map(h => h.state)]);
  H.ok('whack 同种子双局状态确定', s1 === s2);
  T.setRand();
})();

module.exports = {};
