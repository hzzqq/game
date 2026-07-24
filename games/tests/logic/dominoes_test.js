const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../dominoes.html');

// 出牌接龙 + 匹配校验
t.setHands([[1,2],[3,4]],[[2,5],[6,6]], []);
ok('首张空链可出', t.place([1,2],'right'));
eq('棋链长度', t.getLine().length, 1);
eq('右端=2', t.rightEnd(), 2);
ok('对手接 2 匹配', t.place([2,5],'right'));
eq('右端=5', t.rightEnd(), 5);
ok('不匹配被拒', !t.place([3,4],'right'));

// 出完手牌即胜
t.setHands([[1,2]],[[3,3]], []);
ok('出完获胜', t.place([1,2],'right'));
ok('已结束', t.isOver());
eq('玩家0胜', t.getWinner(), 0);

// 左端首出
t.setHands([[2,2]],[[3,3]], []);
ok('左端首出', t.place([2,2],'left'));
eq('左端=2', t.leftEnd(), 2);

// 不可出时过牌
t.setHands([[0,1],[5,5]],[[3,4]], []);
t.place([0,1],'right');
// 玩家1 手牌 [3,4] 无法接右端 1
ok('玩家1无法接可过牌', t.pass());
eq('轮回玩家0', t.getTurn(), 0);

// 回归：牌只匹配右端却选左端，必须被拒；曾因 canPlace 放行后被 place 拼成假牌 [5,1]
t.setHands([[1,2],[3,3]],[[5,2],[4,4]], []);
t.place([1,2],'right'); // 链=[[1,2]] 左端=1 右端=2，轮到玩家1
ok('只匹配右端却放左端应被拒', t.place([5,2],'left')===false);
const ln=t.getLine();
ok('链中不存在被篡改的假牌 [5,1]', !ln.some(x=>x[0]===5&&x[1]===1));
ok('链仍只有 [1,2]', ln.length===1 && ln[0][0]===1 && ln[0][1]===2);
ok('同一张牌接右端(2)应成功', t.place([5,2],'right')===true);
eq('接完后右端=5', t.rightEnd(), 5);

// 双方都无法接 → 两次过牌分胜负（触发 pass 的守卫式 Juice 分支）
t.setHands([[5,5],[1,6]],[[4,4],[2,3]]);
ok('首出合法牌成功', t.place([5,5],'right'));
ok('对手无法接可过牌', t.pass());
ok('轮回玩家0 仍无法接可过牌', t.pass());
ok('流局结束', t.isOver());
ok('分出胜负(非平局)', t.getWinner()!=='draw');

// --- Round 7: 胜利/完成特效（纯渲染层，Juice 桩无 confetti → 守卫式 no-op 不抛错）---
t.setHands([[1,2]],[[3,3]], []);
t.place([1,2],'right'); // 出完手牌 → 胜利路径 → celebrate()
ok('多米诺出完获胜 over', t.isOver());
let dthrew=false;
try { t.triggerWinEffect(); } catch(e){ dthrew=true; }
ok('triggerWinEffect 在 Juice 无 confetti 时不抛错', dthrew === false);
