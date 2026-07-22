const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../masyu.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题含珍珠且初始未胜 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=5', st.N, 5);
  ok('初始未胜', st.won === false);
  let pearls=0; st.pearls.forEach(r=>r.forEach(v=>{ if(v) pearls++; }));
  ok('至少存在 1 颗珍珠', pearls>=1);
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
  const st=t.getState();
  // 每颗珍珠都在环上（度数 2）
  let allOn=false; const a=t.analyze();
  let okP=true;
  for(let r=0;r<5;r++) for(let c=0;c<5;c++) if(st.pearls[r][c]) if(a.deg[r][c]!==2) okP=false;
  ok('胜利态每颗珍珠在环上(度数2)', okP);
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  t.reset();
  ok('reset 后未胜', t.isWin()===false);
}

// ===== 4. 非法边被拒 =====
{
  t.newPuzzle(1);
  ok('越界 h 边被拒', t.setEdge('h',9,9,true)===false);
  ok('越界 v 边被拒', t.setEdge('v',9,9,true)===false);
  ok('错误类型被拒', t.setEdge('x',0,0,true)===false);
}

// ===== 5. 删一条边 → 未胜 =====
{
  t.newPuzzle(42);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  let done=false; const sol=t.getSolution();
  for(let r=0;r<5&&!done;r++) for(let c=0;c<5&&!done;c++) if(sol.h[r][c]){ t.setEdge('h',r,c,false); done=true; }
  ok('删一条边 → 未胜', t.isWin()===false);
}

// ===== 6. 多个种子规范解可解 =====
{
  let allOK=true, allHavePearl=true;
  for(const seed of [1,2,3,4,5,6,7,8]){
    t.newPuzzle(seed);
    const st=t.getState(); let p=0; st.pearls.forEach(r=>r.forEach(v=>{if(v)p++;}));
    if(p<1) allHavePearl=false;
    if(!(t.applySolution()===true && t.isWin()===true)) allOK=false;
  }
  ok('8 个种子均含珍珠', allHavePearl);
  ok('8 个种子规范解均可解', allOK);
}

t.setRand(Math.random);
