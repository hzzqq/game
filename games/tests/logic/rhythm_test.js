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

module.exports = {};
