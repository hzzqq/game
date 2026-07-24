// uno 逻辑单测：玩家先出完所有牌获胜触发 confetti（纯视觉层，不改玩法/胜负）。
const H = require('./harness');
const { t } = H.loadGame('../uno.html');

// 未获胜前不应有 confetti
H.eq('uno 初始未触发', t.confettiFired() > 0, false);

// 玩家胜：forceWin 驱动既有 endGame(0) 判定，触发 confetti
t.forceWin();
H.eq('uno 玩家胜触发 confetti', t.confettiFired() > 0, true);

// 防重复触发
t.forceWin();
H.eq('uno 不重复触发', t.confettiFired(), 1);
