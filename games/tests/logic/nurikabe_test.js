const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../nurikabe.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题结构 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=5', st.N, 5);
  ok('初始未胜', st.won === false);
  let nums=0; st.clue.forEach(r=>r.forEach(v=>{ if(v>0) nums++; }));
  ok('至少存在数字格', nums>=1);
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
  const st=t.getState();
  // 每白块恰一数字且大小=数字
  const comps=t.whiteComponents();
  ok('所有白块恰一数字且大小匹配', comps.every(cm=>cm.nums.length===1 && cm.size===cm.nums[0]));
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  t.reset();
  ok('reset 后未胜', t.isWin()===false);
  eq('reset 后全白', t.getState().grid.flat().filter(v=>v===1).length, 0);
}

// ===== 4. 数字格不可涂黑 / 越界被拒 =====
{
  t.newPuzzle(1);
  const st=t.getState();
  let cr=-1,cc=-1;
  for(let r=0;r<5;r++) for(let c=0;c<5;c++) if(st.clue[r][c]>0){ cr=r;cc=c; }
  ok('找到数字格', cr>=0);
  ok('数字格涂黑被拒', t.setBlack(cr,cc,true)===false);
  ok('越界被拒', t.setBlack(9,9,true)===false);
}

// ===== 5. 反色一个黑格 → 可能破坏黑连通 → 未胜 =====
{
  t.newPuzzle(42);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  const sol=t.getSolution();
  let done=false;
  for(let r=0;r<5&&!done;r++) for(let c=0;c<5&&!done;c++) if(sol[r][c]===1){ t.setBlack(r,c,false); done=true; }
  ok('把一个黑格变白 → 未胜（大概率）', t.isWin()===false);
}

// ===== 6. 多个种子规范解可解 =====
{
  let allOK=true, allHaveNum=true;
  for(const seed of [1,2,3,4,5,6,7,8]){
    t.newPuzzle(seed);
    const st=t.getState(); let n=0; st.clue.forEach(r=>r.forEach(v=>{if(v>0)n++;}));
    if(n<1) allHaveNum=false;
    if(!(t.applySolution()===true && t.isWin()===true)) allOK=false;
  }
  ok('8 个种子均含数字', allHaveNum);
  ok('8 个种子规范解均可解', allOK);
}

t.setRand(Math.random);
