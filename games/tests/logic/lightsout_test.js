const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../lightsout.html');

// ===== 1. 翻转是自身的逆（对合性） =====
{
  t.newGame();
  const before = JSON.stringify(t.getBoard());
  t.click(2,2);
  t.click(2,2);
  eq('中心点击两次回到原状（对合）', JSON.stringify(t.getBoard()), before);
}

// ===== 2. 翻转格数：角=3 / 边=4 / 中心=5 =====
{
  t.setBoard([
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
  ]);
  const a = JSON.stringify(t.getBoard());
  t.toggle(0,0); // 角，翻转 3 格
  let diff=0; const b1=JSON.parse(a), b2=t.getBoard();
  for(let r=0;r<5;r++)for(let c=0;c<5;c++) if(b1[r][c]!==b2[r][c]) diff++;
  eq('角格点击翻转 3 格', diff, 3);

  t.setBoard([
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
  ]);
  t.toggle(0,2); // 上边中点，翻转 4 格
  diff=0; const c1=JSON.parse(a), c2=t.getBoard();
  for(let r=0;r<5;r++)for(let c=0;c<5;c++) if(c1[r][c]!==c2[r][c]) diff++;
  eq('边格点击翻转 4 格', diff, 4);

  t.setBoard([
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
  ]);
  t.toggle(2,2); // 中心，翻转 5 格
  diff=0; const d1=JSON.parse(a), d2=t.getBoard();
  for(let r=0;r<5;r++)for(let c=0;c<5;c++) if(d1[r][c]!==d2[r][c]) diff++;
  eq('中心点击翻转 5 格', diff, 5);
}

// ===== 3. 可解性：重放 scramble 必全灭 =====
{
  t.newGame();
  const scr = t.getScramble();
  ok('开局有灯亮（非全灭）', t.countOn() > 0);
  scr.forEach(([r,c]) => t.click(r,c));
  ok('重放 scramble 后全灭即胜', t.isWin() && t.isOver());
}

// ===== 4. 胜利后不再响应点击 =====
{
  t.newGame();
  const scr = t.getScramble();
  scr.forEach(([r,c]) => t.click(r,c)); // 重放至真实胜利
  ok('已达真实胜利', t.isWin() && t.isOver());
  const m0 = t.getMoves();
  t.click(2,2);
  t.click(0,0);
  eq('胜利后点击不改变步数', t.getMoves(), m0);
}

// ===== 5. 越界点击安全 =====
{
  t.newGame();
  ok('越界点击不崩溃', t.click(-1,-1) === false && t.click(9,9) === false);
}
