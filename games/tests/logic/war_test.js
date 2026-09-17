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

// ===== T-118：真实发牌（经典 52 张洗牌对半 26/26）+ setRand 随机缝 =====
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  H.ok('war setRand 钩子存在', typeof t.setRand === 'function');
  t.setRand(lcg(7));     t.newGame(); const w1 = JSON.stringify(t.getCards());
  t.setRand(lcg(7));     t.newGame(); const w2 = JSON.stringify(t.getCards());
  t.setRand(lcg(99999)); t.newGame(); const w3 = JSON.stringify(t.getCards());
  H.ok('war 同种子发牌确定', w1 === w2);
  H.ok('war 不同种子发牌不同', w1 !== w3);
  // 全套合法性：52 张、每个点数 2..14 恰 4 张
  const dealt = JSON.parse(w1).p1.concat(JSON.parse(w1).p2);
  H.eq('war 全套 52 张', dealt.length, 52);
  const cnt = {};
  for (const r of dealt) cnt[r] = (cnt[r] || 0) + 1;
  let valid = true;
  for (let r = 2; r <= 14; r++) if (cnt[r] !== 4) valid = false;
  H.ok('war 每个点数恰 4 张（2..14）', valid);
  // 经典 War 牌局可终局（连打至分出胜负，5000 步防御上限）
  t.setRand(lcg(7)); t.newGame();
  let steps = 0;
  while (!t.isOver() && steps < 5000) { t.step(); steps++; }
  H.ok('war 随机牌局可分出胜负（步数 ' + steps + '）', t.isOver());
  t.setRand();
})();
