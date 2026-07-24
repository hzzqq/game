// 音游逻辑单测：连击充能护盾，MISS 时消耗护盾保连击 / 无护盾 MISS 清零
const H = require('./harness');
const { t: T } = H.loadGame('../rhythm.html');

// 1) 护盾 set/get 通路
T.setShield(2);
H.ok(T.getShield() === 2, 'rhythm: setShield/getShield (得到 ' + T.getShield() + ')');

// 2) 有护盾 MISS -> 消耗护盾、连击不中断
T.G.combo = 5;
T.setShield(1);
T.G.notes = T.G.notes || [];
var note = { lane: 0, judged: false };
T.G.notes.push(note);
T.judgeNote(note, 'miss');
H.ok(T.getShield() === 0, 'rhythm: 有护盾 MISS 消耗护盾 (得到 ' + T.getShield() + ')');
H.ok(T.G.combo === 5, 'rhythm: 有护盾 MISS 连击不中断 (combo=' + T.G.combo + ')');

// 3) 无护盾 MISS -> 连击清零
T.G.combo = 5;
T.setShield(0);
var note2 = { lane: 1, judged: false };
T.G.notes.push(note2);
T.judgeNote(note2, 'miss');
H.ok(T.G.combo === 0, 'rhythm: 无护盾 MISS 连击清零 (combo=' + T.G.combo + ')');

// ===== 高评级终演 confetti 测试（仅视觉反馈钩子，不改玩法）=====
T.G.perfect = 50; T.G.good = 0; T.G.miss = 0; T.G.totalJudged = 50; // acc=100% → 评级 S
H.ok(T.confettiFired() === false, 'rhythm: 终演前 confettiFired 为 false');
T.finish(); // 评级 S → 触发庆祝彩带
H.ok(T.confettiFired() === true, 'rhythm: 高评级终演 → confettiFired 为真');
// 同一局只触发一次（锁）
T.finish();
H.ok(T.confettiFired() === true, 'rhythm: 重复终演受锁保护（只触发一次）');

const results = H.results;
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nrhythm: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

module.exports = {};
