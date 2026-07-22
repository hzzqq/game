const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../hashi.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题结构 + 规范解自洽 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  ok('N 网格', st.R===7 && st.C===7);
  ok('初始未胜', st.won === false);
  ok('至少 5 座岛', st.islands.length>=5);
  ok('每岛数字>0', st.islands.every(I=>I.num>0));
  // 规范解应满足连通 + 桥数匹配
  const sol = t.getSolution();
  ok('规范解有桥', sol.length>0);
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
  const st=t.getState();
  // 每岛桥数=数字
  let okNums=true;
  for(let i=0;i<st.islands.length;i++){ let d=0; for(const b of st.bridges) if(b.i===i||b.j===i) d+=b.count; if(d!==st.islands[i].num) okNums=false; }
  ok('胜利态每岛桥数=数字', okNums);
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  t.reset();
  ok('reset 后未胜', t.isWin()===false);
  eq('reset 后无桥', t.getState().bridges.length, 0);
}

// ===== 4. 非法桥被拒（不对齐）=====
{
  t.newPuzzle(1);
  const st=t.getState();
  // 找两座不对齐的岛
  let i=-1,j=-1;
  outer: for(let a=0;a<st.islands.length;a++) for(let b=a+1;b<st.islands.length;b++){
    if(st.islands[a].r!==st.islands[b].r && st.islands[a].c!==st.islands[b].c){ i=a; j=b; break outer; }
  }
  ok('找到不对齐两岛', i>=0);
  ok('不对齐建桥被拒', t.setBridge(i,j,1)===false);
  ok('越界建桥被拒', t.setBridge(99,0,1)===false);
}

// ===== 5. 删一座桥 → 未胜 =====
{
  t.newPuzzle(42);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  const sol=t.getSolution();
  const b0=sol[0];
  t.setBridge(b0.i,b0.j,0); // 撤销一座
  ok('删一座桥 → 未胜', t.isWin()===false);
}

// ===== 6. 多个种子规范解可解 =====
{
  let allOK=true, allConnected=true;
  for(const seed of [1,2,3,4,5,6,7,8]){
    t.newPuzzle(seed);
    if(!(t.applySolution()===true && t.isWin()===true)) allOK=false;
  }
  ok('8 个种子规范解均可解', allOK);
}

t.setRand(Math.random);
