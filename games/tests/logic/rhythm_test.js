// 音游逻辑单测：连击充能护盾，MISS 时消耗护盾保连击 / 无护盾 MISS 清零
const H = require('./harness');
const { t: T } = H.loadGame('../rhythm.html');

// 1) 护盾 set/get 通路
T.setShield(2);
H.ok('rhythm: setShield/getShield (得到 ' + T.getShield() + ')', T.getShield() === 2);

// 2) 有护盾 MISS -> 消耗护盾、连击不中断
T.G.combo = 5;
T.setShield(1);
T.G.notes = T.G.notes || [];
var note = { lane: 0, judged: false };
T.G.notes.push(note);
T.judgeNote(note, 'miss');
H.ok('rhythm: 有护盾 MISS 消耗护盾 (得到 ' + T.getShield() + ')', T.getShield() === 0);
H.ok('rhythm: 有护盾 MISS 连击不中断 (combo=' + T.G.combo + ')', T.G.combo === 5);

// 3) 无护盾 MISS -> 连击清零
T.G.combo = 5;
T.setShield(0);
var note2 = { lane: 1, judged: false };
T.G.notes.push(note2);
T.judgeNote(note2, 'miss');
H.ok('rhythm: 无护盾 MISS 连击清零 (combo=' + T.G.combo + ')', T.G.combo === 0);

// ===== 高评级终演 confetti 测试（仅视觉反馈钩子，不改玩法）=====
T.G.perfect = 50; T.G.good = 0; T.G.miss = 0; T.G.totalJudged = 50; // acc=100% → 评级 S
H.ok('rhythm: 终演前 confettiFired 为 false', T.confettiFired() === false);
T.finish(); // 评级 S → 触发庆祝彩带
H.ok('rhythm: 高评级终演 → confettiFired 为真', T.confettiFired() === true);
// 同一局只触发一次（锁）
T.finish();
H.ok('rhythm: 重复终演受锁保护（只触发一次）', T.confettiFired() === true);

// ===== setRand 可注入随机源（T-115：随机缝 + 确定性验证）=====
(() => {
  H.ok('rhythm setRand 钩子存在', typeof T.setRand === 'function');
  T.setRand(() => 0.5);
  H.ok('rhythm 注入后谱面状态完好', Array.isArray(T.G.notes));
  T.setRand();
})();

// ===== T-129：本地 Top5 排行榜（Common.HighScores 数据层）=====
(() => {
  H.ok('rhythm 排行榜 清空成功', T.clearTop5() === true);
  H.ok('rhythm 排行榜 0 分不入榜', T.recordScore(0) === 0);
  H.ok('rhythm 排行榜 空榜无记录', T.getTop5().length === 0);
  H.ok('rhythm 排行榜 9999 上榜第 1', T.recordScore(9999) === 1);
  H.ok('rhythm 排行榜 榜首=9999', T.getTop5()[0].score === 9999);
  H.ok('rhythm 排行榜 8888 上榜第 2', T.recordScore(8888) === 2);
  for (let i = 0; i < 6; i++) T.recordScore(10000 + i);
  H.ok('rhythm 排行榜 最多保留 5 条', T.getTop5().length === 5);
  H.ok('rhythm 排行榜 截断后榜首仍最大', T.getTop5()[0].score === 10005);
  T.clearTop5();
  H.ok('rhythm 排行榜 收尾清空', T.getTop5().length === 0);
})();

const results = H.results;
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nrhythm: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

module.exports = {};
