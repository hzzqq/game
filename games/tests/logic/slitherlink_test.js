const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../slitherlink.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题结构 + 规范解自洽 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=5', st.N, 5);
  ok('初始未胜', st.won === false);
  // 规范解：每条边构成单环，且 clue 与边数一致
  t.applySolution();
  const sol = t.getSolution();
  const a = t.analyze();
  ok('规范解边构成单环（所有点度数 0 或 2 且连通）', (()=>{
    // 复用 isWin 已在 applySolution 后验证；此处先确认 analyze 无度数 1
    for(let r=0;r<6;r++) for(let c=0;c<6;c++) if(a.deg[r][c]!==0 && a.deg[r][c]!==2) return false;
    return a.edges>0;
  })());
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
  const st=t.getState();
  // 每个 clue 与还原边数一致
  let clueOK=true;
  for(let r=0;r<5;r++) for(let c=0;c<5;c++){
    const cnt=(st.h[r][c]?1:0)+(st.h[r+1][c]?1:0)+(st.v[r][c]?1:0)+(st.v[r][c+1]?1:0);
    if(cnt!==st.clues[r][c]) clueOK=false;
  }
  ok('胜利态每个 clue 与边数一致', clueOK);
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
  // 撤销某条 h 边
  let done=false;
  const sol=t.getSolution();
  for(let r=0;r<6&&!done;r++) for(let c=0;c<5&&!done;c++) if(sol.h[r][c]){ t.setEdge('h',r,c,false); done=true; }
  ok('删一条边 → 未胜', t.isWin()===false);
}

// ===== 6. 多个种子规范解可解 =====
{
  let allOK=true;
  for(const seed of [1,2,3,4,5,6,7,8]){
    t.newPuzzle(seed);
    if(!(t.applySolution()===true && t.isWin()===true)) allOK=false;
  }
  ok('8 个种子规范解均可解', allOK);
}

t.setRand(Math.random);

// ===== 7. 完成特效标记 =====
{
  t.newPuzzle(12345);
  const before = t.confettiFired;
  t.applySolution();
  ok('applySolution 解出→confettiFired 增加', t.confettiFired > before);
}
