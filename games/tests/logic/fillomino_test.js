const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../fillomino.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题结构 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=5', st.N, 5);
  ok('初始未胜', st.won === false);
  ok('maxVal>0', st.maxVal>0);
  let clues=0; st.clue.forEach(r=>r.forEach(v=>{ if(v>0) clues++; }));
  ok('至少存在给定格', clues>0);
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution()===true && t.isWin()===true);
  const st=t.getState();
  // 每个同数连通块大小=该数
  const comps=t.components();
  ok('所有同数块大小匹配', comps.every(cm=>cm.size===cm.val));
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  t.reset();
  ok('reset 后未胜', t.isWin()===false);
  eq('reset 后全空', t.getState().grid.flat().filter(v=>v>0).length, 0);
}

// ===== 4. 给定格不可改 / 越界被拒 =====
{
  t.newPuzzle(1);
  const st=t.getState();
  let cr=-1,cc=-1;
  for(let r=0;r<5;r++) for(let c=0;c<5;c++) if(st.clue[r][c]>0){ cr=r;cc=c; }
  ok('找到给定格', cr>=0);
  ok('改给定格被拒', t.setCell(cr,cc,9)===false);
  ok('越界被拒', t.setCell(9,9,3)===false);
}

// ===== 5. 清一格 → 未胜 =====
{
  t.newPuzzle(42);
  t.applySolution();
  ok('应用解后胜', t.isWin()===true);
  const sol=t.getSolution(); const st=t.getState();
  let done=false;
  for(let r=0;r<5&&!done;r++) for(let c=0;c<5&&!done;c++) if(sol[r][c]>0 && st.clue[r][c]===0){ t.setCell(r,c,0); done=true; }
  ok('清一格 → 未胜', t.isWin()===false);
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

// --- confetti 庆祝标记（旁路视觉，独立于 Juice 桩）---
// 说明：fillomino 的给定格仅存于 clue 数组、grid 中保持 0，且 setCell 拒绝改写给定格，
// 因此通关只能经由 applySolution()（与既有 #2/#3 断言一致的解谜完成路径）触发。
t.newPuzzle(12345);
ok('fillomino 初始未庆祝', t.confettiFired() === false);
ok('fillomino 应用解获胜', t.applySolution() === true && t.isWin() === true);
ok('fillomino 胜利后标记庆祝', t.confettiFired() === true);
t.reset();
ok('fillomino 重置后标记清除', t.confettiFired() === false);

// --- 手感 fx 计数钩子（只读，纯追加）---
t.newPuzzle(12345);               // 重置 fx 计数
eq('fillomino 初始 fxShakes=0', t.fxShakes(), 0);
eq('fillomino 初始 fxBursts=0', t.fxBursts(), 0);
const _st = t.getState();
// 网格初始全0，找第一个空格填 1 → 孤立单格区域 size=1=val=1，触发手感 fx（确定性、不依赖解结构）
let _fxHit=false;
for(let r=0;r<5&&!_fxHit;r++) for(let c=0;c<5&&!_fxHit;c++){ if(_st.clue[r][c]===0){ t.setCell(r,c,1); _fxHit=true; } }
ok('fillomino 填对区域后 fxShakes>0', t.fxShakes() > 0);
ok('fillomino 填对区域后 fxBursts>0', t.fxBursts() > 0);
t.reset();
eq('fillomino 重置后 fxShakes=0', t.fxShakes(), 0);
eq('fillomino 重置后 fxBursts=0', t.fxBursts(), 0);

