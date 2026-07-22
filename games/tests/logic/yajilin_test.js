const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../yajilin.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题结构 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=7', st.N, 7);
  ok('初始未胜', st.won === false);
  // 白格（非黑）构成单环：每个白格度数为 2
  ok('初始无环边', st.h.flat().every(v=>v===false) && st.v.flat().every(v=>v===false));
  // 黑格数量 > 0（既然有箭头黑格）
  let blk=0; st.black.flat().forEach(v=>{if(v)blk++;});
  ok('存在黑格', blk>0);
  // 有箭头数量
  let ar=0; st.arrows.flat().forEach(a=>{if(a)ar++;});
  ok('存在箭头黑格', ar>0);
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
  const st=t.getState();
  // 每个白格度数恰为 2，每个黑格度数为 0
  let degOK=true;
  for(let r=0;r<7;r++) for(let c=0;c<7;c++){
    const d=t.cellDeg(r,c);
    if(st.black[r][c]){ if(d!==0) degOK=false; }
    else { if(d!==2) degOK=false; }
  }
  ok('胜利态白格度2 黑格度0', degOK);
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  t.reset();
  ok('reset 后未胜', t.isWin()===false);
  const st=t.getState();
  ok('reset 后无环边', st.h.flat().every(v=>v===false) && st.v.flat().every(v=>v===false));
}

// ===== 4. 黑格上的边被拒 / 越界被拒 =====
{
  t.newPuzzle(1);
  const st=t.getState();
  let br=-1,bc=-1;
  for(let r=0;r<7;r++) for(let c=0;c<7;c++) if(st.black[r][c]){ br=r; bc=c; }
  ok('找到黑格', br>=0);
  ok('黑格相邻水平边被拒', t.setEdge('h',br, Math.max(0,bc-1),true)===false || t.setEdge('h',br, Math.min(5,bc),true)===false);
  ok('越界 setEdge 被拒', t.setEdge('h',9,9,true)===false);
  ok('错误类型被拒', t.setEdge('x',0,0,true)===false);
}

// ===== 5. 删一条边 → 未胜 =====
{
  t.newPuzzle(42);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  const sol=t.getSolution();
  let done=false;
  for(let r=0;r<7&&!done;r++) for(let c=0;c<6&&!done;c++) if(sol.h[r][c]){ t.setEdge('h',r,c,false); done=true; }
  if(!done){
    for(let r=0;r<6&&!done;r++) for(let c=0;c<7&&!done;c++) if(sol.v[r][c]){ t.setEdge('v',r,c,false); done=true; }
  }
  ok('删一条边 → 未胜', t.isWin()===false);
}

// ===== 6. 多个种子规范解可解 =====
{
  let allOK=true, allBlack=true, allDeg2=true;
  for(const seed of [1,2,3,4,5,6,7,8]){
    t.newPuzzle(seed);
    const st=t.getState();
    let b=0; st.black.flat().forEach(v=>{if(v)b++;}); if(b<1) allBlack=false;
    if(!(t.applySolution()===true && t.isWin()===true)) allOK=false;
    else {
      const st2=t.getState();
      for(let r=0;r<7;r++) for(let c=0;c<7;c++){ const d=t.cellDeg(r,c); const want=st2.black[r][c]?0:2; if(d!==want) allDeg2=false; }
    }
  }
  ok('8 个种子均含黑格', allBlack);
  ok('8 个种子规范解均度数正确', allDeg2);
  ok('8 个种子规范解均可解', allOK);
}

t.setRand(Math.random);
