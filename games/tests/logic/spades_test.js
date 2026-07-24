// spades 逻辑单测：终局玩家分数最高获胜触发 confetti（纯视觉层，不改玩法/胜负）。
const H = require('./harness');
const { t } = H.loadGame('../spades.html');

// 未终局前不应有 confetti
H.eq('spades 初始未触发', t.confettiFired() > 0, false);

// 终局玩家胜：forceWin 驱动既有计分判定（scores[0]>=500 且最高），触发 confetti
t.forceWin();
H.eq('spades 玩家胜触发 confetti', t.confettiFired() > 0, true);

// 防重复触发
t.forceWin();
H.eq('spades 不重复触发', t.confettiFired(), 1);
