const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../nim.html');

// 正常规则：取走最后一颗者胜
t.newGame([1,1]);
ok('取堆1一颗', t.remove(0,1));
eq('堆1清零', t.getPiles()[0], 0);
eq('轮到玩家2', t.getTurn(), 1);
ok('玩家2取堆2最后一颗', t.remove(1,1));
ok('游戏结束', t.isOver());
eq('玩家2获胜', t.getWinner(), 1);

// 非法操作
t.newGame([3,4,5]);
ok('取超量被拒', !t.remove(0,9));
ok('负量被拒', !t.remove(0,0));
ok('越界被拒', !t.remove(9,1));

// nim-sum
t.newGame([1,2,3]);
eq('nim-sum=0', t.getNimSum(), 0);
t.newGame([3,4,5]);
eq('nim-sum=3^4^5=2', t.getNimSum(), (3^4^5));

// 制胜步：nim-sum=2，从堆(3)取1→(2)，使剩 2^4^2=0
t.newGame([3,4,2]);
ok('取3-1=2使必败态', t.remove(0,1));
eq('剩余 nim-sum=0', t.getNimSum(), (2^4^2));

// ---------- 难度系统 ----------
{
  eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty()==hell', t.getDifficulty(), 'hell');
  eq('setDifficulty(bad) 返回 false', t.setDifficulty('bad'), false);
}

// ---------- 胜利 confetti ----------
t.newGame([1,1]);
ok('胜利前 confettiFired 为 false', t.confettiFired() === false);
t.remove(0,1);
t.remove(1,1);
ok('游戏结束胜利 → confettiFired 为真', t.confettiFired() === true);

const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nnim: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
