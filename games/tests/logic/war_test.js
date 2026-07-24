// war 逻辑单测：玩家收完全部牌获胜触发 confetti（纯视觉层，不改玩法/胜负）。
const H = require('./harness');
const { t } = H.loadGame('../war.html');

// 未分胜负前不应有 confetti
H.eq('war 初始未触发', t.confettiFired() > 0, false);

// 确定性玩家胜：玩家1 仅剩 A(14)，玩家2 仅剩 2，一翻即胜
t.setDecks([{r:14}], [{r:2}]);
t.step();
H.eq('war 玩家胜触发 confetti', t.confettiFired() > 0, true);

// 防重复触发（over 后再 step 不累加）
t.step();
H.eq('war 不重复触发', t.confettiFired(), 1);
