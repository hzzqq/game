const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../hitori.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题结构 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=6', st.N, 6);
  ok('初始未胜', st.won === false);
  ok('初始无黑格', st.black.flat().every(v=>v===false));
  // 谜面为拉丁方：每行每列 1..6 互异
  const g=st.grid; let latinOK=true;
  for(let r=0;r<6;r++){ const set=new Set(g[r]); if(set.size!==6) latinOK=false; }
  for(let c=0;c<6;c++){ const set=new Set(); for(let r=0;r<6;r++) set.add(g[r][c]); if(set.size!==6) latinOK=false; }
  ok('谜面为拉丁方（行列互异）', latinOK);
  // 规范解含黑格且可行
  const sol=st.sol; let blk=0; sol.flat().forEach(v=>{if(v)blk++;});
  ok('规范解含黑格', blk>=1);
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
  const st=t.getState();
  ok('胜利态黑格与解一致', JSON.stringify(st.black)===JSON.stringify(st.sol));
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  t.reset();
  ok('reset 后未胜', t.isWin()===false);
  ok('reset 后无黑格', t.getState().black.flat().every(v=>v===false));
}

// ===== 4. 越界被拒 =====
{
  t.newPuzzle(1);
  ok('越界 setBlack 被拒', t.setBlack(9,9,true)===false);
}

// ===== 5. 反色一个黑格 → 未胜 =====
{
  t.newPuzzle(42);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  const sol=t.getSolution();
  let done=false;
  for(let r=0;r<6&&!done;r++) for(let c=0;c<6&&!done;c++) if(sol[r][c]){ t.setBlack(r,c,false); done=true; }
  ok('把一个黑格变白 → 未胜', t.isWin()===false);
}

// ===== 6. 多个种子规范解可解 =====
{
  let allOK=true, allHaveBlack=true;
  for(const seed of [1,2,3,4,5,6,7,8]){
    t.newPuzzle(seed);
    const sol=t.getState().sol; let b=0; sol.flat().forEach(v=>{if(v)b++;});
    if(b<1) allHaveBlack=false;
    if(!(t.applySolution()===true && t.isWin()===true)) allOK=false;
  }
  ok('8 个种子均含黑格', allHaveBlack);
  ok('8 个种子规范解均可解', allOK);
}

t.setRand(Math.random);
