const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../memory.html');

// 工具：从 cards 副本里找两个 key 相同的索引
function findPair(cards) {
  for (let i = 0; i < cards.length; i++)
    for (let j = i + 1; j < cards.length; j++)
      if (cards[i].key === cards[j].key) return [i, j];
  return null;
}
// 工具：找两个 key 不同的索引
function findDiff(cards) {
  for (let i = 0; i < cards.length; i++)
    for (let j = i + 1; j < cards.length; j++)
      if (cards[i].key !== cards[j].key) return [i, j];
  return null;
}

// 1. newGame(4) 基本属性
t.newGame(4);
const c4 = t.getCards();
eq('4×4 共 16 张牌', c4.length, 16);
eq('4×4 初始无翻牌', c4.every(c => !c.flipped), true);
eq('4×4 初始无配对', c4.every(c => !c.matched), true);
eq('4×4 初始步数 0', t.getMoves(), 0);
eq('4×4 初始配对 0', t.getMatched(), 0);
eq('4×4 初始未胜利', t.isWon(), false);
eq('4×4 size=4', t.getSize(), 4);

// 2. 每个 key 恰好出现 2 次（16 张 / 8 对）
const kc = {};
c4.forEach(c => kc[c.key] = (kc[c.key] || 0) + 1);
eq('4×4 每个 key 恰好 2 张', Object.values(kc).every(n => n === 2), true);
eq('4×4 共 8 种 key', Object.keys(kc).length, 8);

// 3. flip 一张：openIdx=1，该牌 flipped=true
t.newGame(4);
t.flip(0);
eq('flip 一张后 openIdx=1', t.getOpen(), 1);
eq('翻牌后 flipped=true', t.getCards()[0].flipped, true);

// 4. 重复翻同一张被拒（openIdx 不变）
t.flip(0);
eq('重复翻同一张被拒 openIdx 仍 1', t.getOpen(), 1);

// 5. flip 两张同 key → resolvePair → matched+2，moves+1
t.newGame(4);
const p = findPair(t.getCards());
t.flip(p[0]); t.flip(p[1]);
eq('翻两张后 openIdx=2', t.getOpen(), 2);
t.resolvePair();
eq('配对后 matched=2', t.getMatched(), 2);
eq('配对后 moves=1', t.getMoves(), 1);
eq('配对后 openIdx 清零', t.getOpen(), 0);
eq('配对后两张 matched=true', t.getCards()[p[0]].matched && t.getCards()[p[1]].matched, true);

// 6. flip 两张不同 key → resolvePair → 翻回，matched 不变
t.newGame(4);
const d = findDiff(t.getCards());
t.flip(d[0]); t.flip(d[1]);
t.resolvePair();
eq('失配后 matched 仍 0', t.getMatched(), 0);
eq('失配后 moves=1', t.getMoves(), 1);
eq('失配后两张翻回 false', t.getCards()[d[0]].flipped || t.getCards()[d[1]].flipped, false);

// 7. flip 已 matched 的牌被拒
t.newGame(4);
const p2 = findPair(t.getCards());
t.flip(p2[0]); t.flip(p2[1]); t.resolvePair();
t.flip(p2[0]); // 已 matched
eq('翻已配对牌被拒 openIdx=0', t.getOpen(), 0);

// 8. 全部配对后 isWon=true，moves=8
t.newGame(4);
const cs = t.getCards();
const byKey = {};
cs.forEach((c, i) => { (byKey[c.key] = byKey[c.key] || []).push(i); });
Object.keys(byKey).forEach(k => {
  const [a, b] = byKey[k];
  t.flip(a); t.flip(b); t.resolvePair();
});
eq('全部配对后 matched=16', t.getMatched(), 16);
eq('全部配对后 isWon=true', t.isWon(), true);
eq('全部配对后 moves=8', t.getMoves(), 8);

// 9. 胜利后 flip 被拒（won 守卫）
t.flip(0);
eq('胜利后 flip 被拒 openIdx=0', t.getOpen(), 0);

// 10. newGame(6) → 36 张 / 18 对
t.newGame(6);
const c6 = t.getCards();
eq('6×6 共 36 张', c6.length, 36);
eq('6×6 size=6', t.getSize(), 6);
const kc6 = {};
c6.forEach(c => kc6[c.key] = (kc6[c.key] || 0) + 1);
eq('6×6 每个 key 恰好 2 张', Object.values(kc6).every(n => n === 2), true);
eq('6×6 共 18 种 key', Object.keys(kc6).length, 18);

// 11. newGame 重置状态（从 6×6 中途切回 4×4）
t.newGame(6);
t.flip(0); t.flip(1); t.resolvePair();
t.newGame(4);
eq('重开后 matched=0', t.getMatched(), 0);
eq('重开后 moves=0', t.getMoves(), 0);
eq('重开后 isWon=false', t.isWon(), false);
eq('重开后 openIdx=0', t.getOpen(), 0);

// 12. flip 越界索引安全不崩
t.newGame(4);
t.flip(999);
eq('flip 越界索引安全 openIdx=0', t.getOpen(), 0);

// 13. 胜利特效：全部配对触发 celebrate（Juice 桩无 confetti → 不崩）
{
  let threw = false;
  try {
    t.newGame(4);
    const cs = t.getCards();
    const byKey = {};
    cs.forEach((c, i) => { (byKey[c.key] = byKey[c.key] || []).push(i); });
    Object.keys(byKey).forEach(k => { const [a, b] = byKey[k]; t.flip(a); t.flip(b); t.resolvePair(); });
  } catch (e) { threw = true; }
  eq('全部配对庆祝不抛错', threw, false);
  eq('全部配对触发 celebrate 标志', t.wasCelebrated(), true);
  let threw2 = false;
  try { t.triggerWinEffect(); } catch (e) { threw2 = true; }
  eq('triggerWinEffect 不抛错', threw2, false);
}

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nmemory: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
