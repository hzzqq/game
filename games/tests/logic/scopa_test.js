// scopa 逻辑单测：玩家获胜触发 confetti 反馈（纯视觉层，不改玩法/胜负）。
const H = require('./harness');
const { t } = H.loadGame('../scopa.html');

// 未触发玩家获胜前不应有 confetti
H.eq('scopa 初始未触发', t.confettiFired() > 0, false);

// 玩家获胜：declareWin 只读钩子模拟一局玩家赢，触发 confetti
t.declareWin();
H.eq('scopa 玩家胜触发 confetti', t.confettiFired() > 0, true);

// 防重复触发：再次 declareWin 不应累加
t.declareWin();
H.eq('scopa 不重复触发', t.confettiFired(), 1);

// 新局复位
t.newGame();
H.eq('scopa 新局复位', t.confettiFired(), 0);
