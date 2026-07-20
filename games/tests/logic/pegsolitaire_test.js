const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../pegsolitaire.html');

// ===== 1. 新局：33 孔、32 子、中心空 =====
{
  t.newGame();
  eq('有效孔数 33', t.getValidCount(), 33);
  eq('初始棋子 32', t.getPegsLeft(), 32);
  eq('中心 (3,3) 为空', t.getBoard()[3][3], 0);
  eq('中心邻 (3,2) 有子', t.getBoard()[3][2], 1);
}

// ===== 2. 合法跳吃（(3,1)→(3,3) 吃 (3,2)） =====
{
  t.newGame();
  ok('(3,1)→(3,3) 合法', t.move(3,1,3,3)===true);
  eq('起点 (3,1) 空', t.getBoard()[3][1], 0);
  eq('被跳 (3,2) 空', t.getBoard()[3][2], 0);
  eq('落点 (3,3) 有子', t.getBoard()[3][3], 1);
  eq('棋子减 1 → 31', t.getPegsLeft(), 31);
}

// ===== 3. 非法跳吃被拒 =====
{
  t.newGame();
  ok('距离 3 的跳被拒', t.move(3,1,3,4)===false);
  ok('从空格起跳被拒', t.move(3,3,3,1)===false);
  ok('落点有子被拒', t.move(3,1,3,3)===true && t.move(3,3,3,1)===false); // 第二次 (3,3)有子但 (3,1)空→起点非法
  ok('斜向跳被拒', t.move(2,3,4,3)===false);
  ok('越界被拒', t.move(-1,0,1,0)===false);
}

// ===== 4. 胜利：只剩 1 子 =====
{
  // 构造仅中心 1 子的局面
  const b=Array.from({length:7},()=>new Array(7).fill(0));
  b[3][3]=1;
  t.setBoard(b);
  eq('局面剩 1 子', t.getPegsLeft(), 1);
  ok('剩 1 子即胜', t.isWin()===true);
}

// ===== 5. 一次跳吃不改胜负（仍 >1 子） =====
{
  t.newGame();
  t.move(3,1,3,3);
  ok('31 子未胜', t.isWin()===false);
}
