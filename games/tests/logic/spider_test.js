// spider 逻辑单测：集满 8 套通关触发 confetti（纯视觉层，不改玩法/胜负）。
const H = require('./harness');
const { t } = H.loadGame('../spider.html');

// 未通关前不应有 confetti
H.eq('spider 初始未触发', t.confettiFired() > 0, false);

// 确定性通关：已收 7 套，再摆一列同花色 K->A 完整顺子，settle 收第 8 套
const col = [];
for (let r = 13; r >= 1; r--) col.push({ s: 0, r });
t.setTableau([col], 7, []);
t.settle();
H.eq('spider 收齐8套触发 confetti', t.confettiFired() > 0, true);

// 防重复触发
t.settle();
H.eq('spider 不重复触发', t.confettiFired(), 1);
