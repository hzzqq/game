const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../tents.html');

function countTrees(st){ let n=0; for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(st.trees[r][c]) n++; return n; }

// ===== 1. 新谜题结构 =====
t.newPuzzle(12345);
let st = t.getState();
ok('N=8', st.N === 8);
ok('初始未胜', st.won === false);
ok('存在树', countTrees(st) > 0);
ok('行帐篷数之和 = 树数', (()=>{ let s=0; st.rowClue.forEach(x=>s+=x); return s === countTrees(st); })());

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution() === true && t.isWin() === true);
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin() === true);
  t.reset();
  ok('reset 后未胜', t.isWin() === false);
}

// ===== 4. 非法输入被拒 =====
{
  t.newPuzzle(1);
  ok('越界 setTent 被拒', t.setTent(9, 9, true) === false);
  ok('负坐标 setTent 被拒', t.setTent(0, -1, true) === false);
}

// ===== 5. 规范解自洽：帐篷互不相邻、每树恰 1 帐篷 =====
{
  t.newPuzzle(55);
  const sol = t.getSolution();
  const trees = t.getState().trees;
  const NEI8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const NEI4 = [[1,0],[-1,0],[0,1],[0,-1]];
  let adj = false, tot = 0;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(sol[r][c]){
    tot++;
    for(const [dr,dc] of NEI8){ const nr=r+dr, nc=c+dc; if(nr>=0&&nr<8&&nc>=0&&nc<8&&sol[nr][nc]) adj=true; }
  }
  ok('解帐篷互不相邻', !adj);
  ok('解帐篷数 = 树数', tot === countTrees(t.getState()));
  let treeOk = true;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(trees[r][c]){
    let cnt=0; for(const [dr,dc] of NEI4){ const nr=r+dr, nc=c+dc; if(nr>=0&&nr<8&&nc>=0&&nc<8&&sol[nr][nc]) cnt++; }
    if(cnt!==1) treeOk=false;
  }
  ok('解每棵树恰有 1 顶相邻帐篷', treeOk);
}

// ===== 6. 多个种子规范解可解 =====
{
  let allOK = true;
  for(const seed of [1,2,3,4,5,6,7,8]){
    t.newPuzzle(seed);
    if(!(t.applySolution()===true && t.isWin()===true)) allOK=false;
  }
  ok('8 个种子规范解均可解', allOK);
}
