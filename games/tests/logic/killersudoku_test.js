const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../killersudoku.html');

function isValidSudoku(g){
  for(let i=0;i<9;i++){
    const rs=new Set(), cs=new Set(), bs=new Set();
    for(let j=0;j<9;j++){
      rs.add(g[i*9+j]); cs.add(g[j*9+i]);
      const br=Math.floor(i/3)*3, bc=(i%3)*3;
      bs.add(g[(br+Math.floor(j/3))*9+(bc+j%3)]);
    }
    if(rs.size!==9||cs.size!==9||bs.size!==9) return false;
  }
  return true;
}

// ===== 1. 新谜题结构 =====
t.newPuzzle(12345);
let st = t.getState();
ok('N=9', st.N === 9);
ok('初始未胜', st.won === false);
ok('cages 非空', st.cages.length > 0);
ok('grid 长度 81', st.grid.length === 81);
ok('givens 长度 81', st.givens.length === 81);

// ===== 2. 规范解是合法数独 =====
{
  t.newPuzzle(12345);
  const sol = t.getSolution();
  ok('solution 是合法数独', isValidSudoku(sol));
}

// ===== 3. 每个 cage 和与规范解一致 =====
{
  t.newPuzzle(12345);
  const sol = t.getSolution();
  const stt = t.getState();
  let okk = true;
  stt.cages.forEach(cg=>{ let s=0; cg.cells.forEach(([r,c])=> s+=sol[r*9+c]); if(s!==cg.sum) okk=false; });
  ok('每个 cage 和与规范解一致', okk);
}

// ===== 4. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution() === true && t.isWin() === true);
}

// ===== 5. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin() === true);
  t.reset();
  ok('reset 后未胜', t.isWin() === false);
}

// ===== 6. 非法输入被拒 =====
{
  t.newPuzzle(1);
  ok('越界 setCell 被拒', t.setCell(9, 9, 5) === false);
  ok('给定格不可改被拒', (()=>{
    const g = t.getState().givens;
    for(let i=0;i<81;i++) if(g[i]) return t.setCell(Math.floor(i/9), i%9, (g[i]%9)+1) === false;
    return true;
  })());
}

// ===== 7. 多个种子规范解可解 =====
{
  let allOK = true;
  for(const seed of [1,2,3,4,5,6,7,8]){
    t.newPuzzle(seed);
    if(!(t.applySolution()===true && t.isWin()===true)) allOK=false;
  }
  ok('8 个种子规范解均可解', allOK);
}
