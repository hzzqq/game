const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../akari.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题结构 + 规范解自洽 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=7', st.N, 7);
  ok('初始未胜', st.won === false);
  // 规范解：所有空格被照亮、无互射、墙号满足
  const sol = t.getSolution();
  let lampCount=0; sol.forEach(r=>r.forEach(v=>{if(v)lampCount++;}));
  ok('规范解含至少一盏灯', lampCount>0);
  ok('规范解满足 isWin', t.isWin()===true || (()=>{ t.applySolution(); return t.isWin(); })());
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
  const st=t.getState();
  // 每盏灯都在空格上
  let lampOnEmpty=true;
  for(let r=0;r<7;r++) for(let c=0;c<7;c++) if(st.lamps[r][c] && st.board[r][c]!==-1) lampOnEmpty=false;
  ok('所有灯都在空格', lampOnEmpty);
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  t.reset();
  ok('reset 后未胜', t.isWin()===false);
  eq('reset 后无灯', t.getState().lamps.flat().filter(v=>v).length, 0);
}

// ===== 4. 墙上放灯被拒 =====
{
  t.newPuzzle(1);
  const st=t.getState();
  let wr=-1,wc=-1;
  for(let r=0;r<7;r++) for(let c=0;c<7;c++) if(st.board[r][c]>=0){ wr=r;wc=c; break; }
  ok('存在墙格', wr>=0);
  ok('墙上 setLamp 被拒', t.setLamp(wr,wc,true)===false);
}

// ===== 5. 越界被拒 =====
{
  t.newPuzzle(2);
  ok('越界 setLamp 被拒', t.setLamp(9,9,true)===false);
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
