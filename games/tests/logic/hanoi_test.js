const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../hanoi.html');

// ===== 1. 新局初始化（N=3） =====
{
  t.newGame(3);
  const pegs=t.getPegs();
  eq('N=3', t.getN(), 3);
  eq('左柱 [3,2,1]', JSON.stringify(pegs[0]), JSON.stringify([3,2,1]));
  eq('中柱空', pegs[1].length, 0);
  eq('右柱空', pegs[2].length, 0);
  eq('最少步数 7', t.getMinMoves(), 7);
}

// ===== 2. 合法性判断 =====
{
  t.newGame(3);
  ok('可从左移到中', t.canMove(0,1)===true);
  ok('不能移到自身', t.canMove(0,0)===false);
  ok('空柱不能移出', t.canMove(2,0)===false);
}

// ===== 3. 移动与非法阻挡（大盘不能压小盘） =====
{
  t.newGame(3);
  t.move(0,2); // 盘1 → 右
  let pegs=t.getPegs();
  eq('移动后左柱 [3,2]', JSON.stringify(pegs[0]), JSON.stringify([3,2]));
  eq('右柱 [1]', JSON.stringify(pegs[2]), JSON.stringify([1]));
  ok('盘2 不能压到盘1 上', t.move(0,2)===false); // top(0)=2 > top(2)=1
  ok('盘2 可移到中柱', t.move(0,1)===true);
}

// ===== 4. 完整最优解（3 盘，7 步通关） =====
{
  t.newGame(3);
  const sol=[[0,2],[0,1],[2,1],[0,2],[1,0],[1,2],[0,2]];
  for(const [f,tt] of sol){ ok('走子 '+f+'→'+tt, t.move(f,tt)===true); }
  ok('达成胜利', t.isWin() && t.isOver());
  eq('步数恰为 7', t.getMoves(), 7);
}

// ===== 5. 未全部归位不算胜 =====
{
  t.setPegs([[3,2,1],[],[]]);
  ok('初始未胜', t.isWin()===false);
  t.move(0,2);
  ok('部分移动仍未胜', t.isWin()===false);
}
