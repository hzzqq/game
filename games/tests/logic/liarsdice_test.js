const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../liarsdice.html');

// 玩家0:[1,1,1] 玩家1:[2,2,3] → 1点共 3 个
t.setDice([[1,1,1],[2,2,3]]);
eq('全场 1 点数量为 3', t.getCount(1), 3);
eq('全场 2 点数量为 2', t.getCount(2), 2);

ok('空叫注时任意合法加注', t.isValidRaise(2,1) === true);
t.placeBid(2,1); // 叫：至少 2 个 1 点
ok('更多数量属合法加注', t.isValidRaise(3,1) === true);
ok('同数量更高点数属合法加注', t.isValidRaise(2,2) === true);
ok('更少数量属非法加注', t.isValidRaise(1,5) === false);

let r = t.call();
eq('叫注成立(实际3≥2)→叫注者(0)胜', r.winner, 0);
eq('开出实际数量=3', r.count, 3);

// 失败叫注：叫 4 个 1 点，实际仅 3
t.placeBid(4,1);
r = t.call();
eq('叫注过大(实际3<4)→开牌者(1)胜', r.winner, 1);

// --- Round 7: 胜利/完成特效（纯渲染层，Juice 桩无 confetti → 守卫式 no-op 不抛错）---
t.setDice([[1,1,1],[2,2,3]]);
t.placeBid(2,1);
t.call(); // 开牌分胜负 → 胜利路径 → celebrate()
let lthrew=false;
try { t.triggerWinEffect(); } catch(e){ lthrew=true; }
ok('triggerWinEffect 在 Juice 无 confetti 时不抛错', lthrew === false);
