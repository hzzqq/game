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

// ===== setRand 可注入随机源（T-115：随机缝 + 确定性验证）=====
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  H.ok('uno setRand 钩子存在', typeof t.setRand === 'function');
  t.setRand(lcg(7));     t.reset(); const u1 = JSON.stringify([t.hand(0), t.hand(1), t.getState().deck]);
  t.setRand(lcg(7));     t.reset(); const u2 = JSON.stringify([t.hand(0), t.hand(1), t.getState().deck]);
  t.setRand(lcg(99999)); t.reset(); const u3 = JSON.stringify([t.hand(0), t.hand(1), t.getState().deck]);
  H.ok('uno 同种子发牌确定', u1 === u2);
  H.ok('uno 不同种子发牌不同', u1 !== u3);
  t.setRand();
})();

// ===== T-161 出牌合法性（mutation 缺口：isLegal 三条件此前无锁）=====
(() => {
  t.setCurrent('r', 5);
  H.ok('uno 同色可出', t.isLegal({ color: 'r', value: 9 }) === true);
  H.ok('uno 同值可出', t.isLegal({ color: 'b', value: 5 }) === true);
  H.ok('uno 异色异值拒', t.isLegal({ color: 'b', value: 7 }) === false);
  t.setCurrent('g', 3);
  H.ok('uno 换色后旧色拒', t.isLegal({ color: 'r', value: 9 }) === false);
  H.ok('uno 新色可出', t.isLegal({ color: 'g', value: 8 }) === true);
  H.ok('uno wild 万能可出', t.isLegal({ color: 'w', value: 'wild' }) === true);
  t.setCurrent('r', 0);
  H.ok('uno wild+draw4 也万能可出', t.isLegal({ color: 'w', value: 'draw4' }) === true);
})();
