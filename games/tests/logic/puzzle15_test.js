const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../puzzle15.html');

// ===== 1. 已解局面 isWin 为真，空格在右下 =====
{
  // 构造标准已解棋盘
  const solved = [
    [1,2,3,4],
    [5,6,7,8],
    [9,10,11,12],
    [13,14,15,0],
  ];
  t.setBoard(solved, 3, 3);
  ok('已解局面 isWin 为真', t.isWin());
  const [er,ec]=t.getEmpty();
  eq('空格在右下(3,3)', er===3 && ec===3, true);
}

// ===== 2. 仅空格邻块可移动 =====
{
  const solved = [
    [1,2,3,4],
    [5,6,7,8],
    [9,10,11,12],
    [13,14,15,0],
  ];
  t.setBoard(solved, 3, 3);
  ok('与空格相邻的 (3,2) 可移动', t.canMove(3,2)===true);
  ok('非相邻 (0,0) 不可移动', t.canMove(0,0)===false);
}

// ===== 3. 移动交换空格与邻块 =====
{
  const solved = [
    [1,2,3,4],
    [5,6,7,8],
    [9,10,11,12],
    [13,14,15,0],
  ];
  t.setBoard(solved, 3, 3);
  t.move(3,2); // 把 15 滑入空格
  eq('移动后 (3,2) 变空', t.getBoard()[3][2], 0);
  eq('移动后 (3,3) 为 15', t.getBoard()[3][3], 15);
  const [er,ec]=t.getEmpty();
  eq('空格移到 (3,2)', er===3 && ec===2, true);
  eq('步数 +1', t.getMoves(), 1);
}

// ===== 4. 可解性：反向重放 scramble 回到已解 =====
{
  t.newGame();
  const scr = t.getScramble();
  ok('开局非已解', t.isWin()===false);
  // 反向重放：每个点击的格子再点一次即可滑回
  for(let i=scr.length-1;i>=0;i--){ t.move(scr[i][0], scr[i][1]); }
  ok('反向重放 scramble 后回到已解即胜', t.isWin() && t.isOver());
}

// ===== 5. 越界/非邻移动安全返回 false =====
{
  t.newGame();
  ok('越界移动被拒', t.move(-1,-1)===false && t.move(9,9)===false);
  ok('新格局仍合法（未崩溃）', Array.isArray(t.getBoard()));
}
