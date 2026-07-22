const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../shikaku.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题结构 + 规范解满足面积/覆盖 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=6', st.N, 6);
  ok('初始未胜', st.won === false);
  // 规范解：每个矩形面积 = 标签数字；全网格覆盖
  const sol = t.getSolution();
  let cover = Array.from({length:6},()=>new Array(6).fill(0));
  let areaOK = true;
  for(const rc of sol){
    if(t.areaOf(rc)!==st.clues[rc.lr][rc.lc]) areaOK=false;
    for(let r=rc.r1;r<=rc.r2;r++) for(let c=rc.c1;c<=rc.c2;c++) cover[r][c]++;
  }
  ok('规范解每个矩形面积=标签数字', areaOK);
  let full=true; for(let r=0;r<6;r++) for(let c=0;c<6;c++) if(cover[r][c]!==1) full=false;
  ok('规范解覆盖每格恰好一次', full);
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
  // owner 每格有归属
  const st=t.getState();
  let allOwned = st.owner.flat().every(v=>v!==-1);
  ok('胜利态 owner 全覆盖', allOwned);
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  t.reset();
  ok('reset 后未胜', t.isWin()===false);
  eq('reset 后无矩形', t.getState().rects.length, 0);
}

// ===== 4. 非法标签/坐标被拒 =====
{
  t.newPuzzle(1);
  const st=t.getState();
  // 找非标签格
  let nr=-1,nc=-1;
  for(let r=0;r<6;r++) for(let c=0;c<6;c++) if(st.clues[r][c]===0){ nr=r;nc=c; }
  ok('存在非标签格', nr>=0);
  ok('非标签格 setRect 被拒', t.setRect(nr,nc,0,0,1,1)===false);
  ok('越界标签 setRect 被拒', t.setRect(9,9,0,0,1,1)===false);
}

// ===== 5. 错分导致未胜（只放一个矩形）=====
{
  t.newPuzzle(42);
  // 仅放置第一个标签对应的整盘大矩形 → 面积≠其标签 → 失败
  const st=t.getState();
  let lr=-1,lc=-1;
  for(let r=0;r<6;r++) for(let c=0;c<6;c++) if(st.clues[r][c]>0){ lr=r;lc=c; break; }
  t.setRect(lr,lc,0,0,5,5);
  ok('单矩形覆盖整盘且面积≠标签 → 未胜', t.isWin()===false);
}

// ===== 6. 多个种子规范解可解 =====
{
  for(const seed of [1,2,3,4,5]){
    t.newPuzzle(seed);
    ok('种子 '+seed+' applySolution 胜利', t.applySolution()===true && t.isWin()===true);
  }
}

t.setRand(Math.random);
