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

// ===== T-118：真实发牌（40 张整副洗牌发 4 桌 + 4 手）+ setRand 随机缝 =====
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  H.ok('scopa setRand 钩子存在', typeof t.setRand === 'function');
  t.setRand(lcg(7));     t.newGame(); const s1 = JSON.stringify([t.getTable(), t.getHand()]);
  t.setRand(lcg(7));     t.newGame(); const s2 = JSON.stringify([t.getTable(), t.getHand()]);
  t.setRand(lcg(99999)); t.newGame(); const s3 = JSON.stringify([t.getTable(), t.getHand()]);
  H.ok('scopa 同种子发牌确定', s1 === s2);
  H.ok('scopa 不同种子发牌不同', s1 !== s3);
  const dealt = JSON.parse(s1)[0].concat(JSON.parse(s1)[1]);
  H.eq('scopa 4 桌 + 4 手 = 8 张', dealt.length, 8);
  const seen = new Set();
  let valid = true;
  for (const c of dealt) {
    if (!(c.v >= 1 && c.v <= 10 && c.s >= 0 && c.s <= 3)) valid = false;
    const k = c.v + '-' + c.s;
    if (seen.has(k)) valid = false;
    seen.add(k);
  }
  H.ok('scopa 牌张合法（40 套内）且互不重复', valid);
  t.setRand();
})();
