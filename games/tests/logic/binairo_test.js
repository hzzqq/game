const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../binairo.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题结构 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=6', st.N, 6);
  ok('初始未胜', st.won === false);
  ok('初始棋盘为空', st.board.flat().every(v=>v===null));
  const sol = st.sol;
  // 规范解：每行每列 0/1 各 3，无 3 连同色
  let rowOK=true,colOK=true,threeOK=true;
  for(let r=0;r<6;r++){ let z=0,o=0; for(let c=0;c<6;c++){ if(sol[r][c]===0)z++; else o++; } if(z!==3||o!==3) rowOK=false; }
  for(let c=0;c<6;c++){ let z=0,o=0; for(let r=0;r<6;r++){ if(sol[r][c]===0)z++; else o++; } if(z!==3||o!==3) colOK=false; }
  for(let r=0;r<6;r++) for(let c=2;c<6;c++) if(sol[r][c]===sol[r][c-1]&&sol[r][c]===sol[r][c-2]) threeOK=false;
  for(let c=0;c<6;c++) for(let r=2;r<6;r++) if(sol[r][c]===sol[r-1][c]&&sol[r][c]===sol[r-2][c]) threeOK=false;
  ok('规范解每行 0/1 各半', rowOK);
  ok('规范解每列 0/1 各半', colOK);
  ok('规范解无 3 连同色', threeOK);
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  t.reset();
  ok('reset 后未胜', t.isWin()===false);
  ok('reset 后棋盘为空', t.getState().board.flat().every(v=>v===null));
}

// ===== 4. 非法输入被拒 =====
{
  t.newPuzzle(1);
  ok('越界 setCell 被拒', t.setCell(9,9,1)===false);
  ok('非法取值被拒', t.setCell(0,0,2)===false);
  ok('清空单元格', t.setCell(0,0,null)===true);
}

// ===== 5. 手动填错 → 未胜 =====
{
  t.newPuzzle(42);
  // 全填为 0（明显非法）→ 未胜
  const st=t.getState();
  for(let r=0;r<6;r++) for(let c=0;c<6;c++) t.setCell(r,c,0);
  ok('全部填 0 → 未胜', t.isWin()===false);
}

// ===== 6. 多个种子规范解可解 =====
{
  let allOK=true, allValid=true;
  for(const seed of [1,2,3,4,5,6,7,8]){
    t.newPuzzle(seed);
    const sol=t.getState().sol;
    let z=0; for(let r=0;r<6;r++) for(let c=0;c<6;c++) if(sol[r][c]===0) z++;
    if(z!==18) allValid=false;  // 36 格中恰 18 个 0
    if(!(t.applySolution()===true && t.isWin()===true)) allOK=false;
  }
  ok('8 个种子规范解均合法（18 个 0）', allValid);
  ok('8 个种子规范解均可解', allOK);
}

t.setRand(Math.random);
