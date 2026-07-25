const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../kakurasu.html');

// 固定种子 → 可复现谜题
t.setRand(()=>0.1); // 不影响本测试（我们用显式种子 newPuzzle）
let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 新谜题可解且初始未胜 =====
{
  t.newPuzzle(12345);
  const st = t.getState();
  eq('N=5', st.N, 5);
  ok('初始未胜', st.won === false);
  const sol = t.getSolution();
  // 规范解应当满足目标（自洽）
  ok('规范解使 isWin=true', (()=>{
    for(let r=0;r<5;r++){ let sum=0; for(let c=0;c<5;c++) if(sol[r][c]) sum+=st.colW[c]; if(sum!==st.rowTarget[r]) return false; }
    for(let c=0;c<5;c++){ let sum=0; for(let r=0;r<5;r++) if(sol[r][c]) sum+=st.rowW[r]; if(sum!==st.colTarget[c]) return false; }
    return true;
  })());
}

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  const won = t.applySolution();
  ok('applySolution → 胜利', won === true && t.isWin() === true);
}

// ===== 3. 清空（reset）后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin() === true);
  t.reset();
  ok('reset 后未胜', t.isWin() === false);
  eq('reset 后选中全空', t.getState().sel.flat().filter(v=>v).length, 0);
}

// ===== 4. 非法格被拒 =====
{
  t.newPuzzle(1);
  ok('越界 setCell 被拒', t.setCell(9,9,true) === false);
  ok('负坐标被拒', t.setCell(-1,0,true) === false);
}

// ===== 5. 错填导致未胜（部分选中）=====
{
  t.newPuzzle(42);
  const st = t.getState();
  // 随机选一个错误子集：全部不选 → 目标通常非 0 → 未胜
  const anyTargetNonZero = st.rowTarget.concat(st.colTarget).some(v=>v!==0);
  ok('存在非零目标', anyTargetNonZero);
  ok('全部不选 → 未胜', t.isWin() === false);
}

// ===== 6. 不同种子产生不同（或同）谜题但都可解 =====
{
  for(const seed of [1,2,3,4,5]){
    t.newPuzzle(seed);
    ok('种子 '+seed+' 规范解满足目标', (()=>{
      const st=t.getState(); const sol=t.getSolution();
      for(let r=0;r<5;r++){ let sum=0; for(let c=0;c<5;c++) if(sol[r][c]) sum+=st.colW[c]; if(sum!==st.rowTarget[r]) return false; }
      for(let c=0;c<5;c++){ let sum=0; for(let r=0;r<5;r++) if(sol[r][c]) sum+=st.rowW[r]; if(sum!==st.colTarget[c]) return false; }
      return true;
    })());
  }
}

// ===== 7. setCell 切换 =====
{
  t.newPuzzle(8);
  t.setCell(0,0,true);
  ok('setCell(0,0,true) 已选中', t.getState().sel[0][0] === true);
  t.setCell(0,0,false);
  ok('setCell(0,0,false) 取消', t.getState().sel[0][0] === false);
}

t.setRand(Math.random);

// ===== 8. 完成特效标记 =====
{
  t.newPuzzle(12345);
  const before = t.confettiFired;
  t.applySolution();
  ok('applySolution 解出→confettiFired 增加', t.confettiFired > before);
}

// ============ 手感深化：Juice.shake / Juice.burst 反馈钩子 ============
// A) 初始 fxShakes / fxBursts 均为 0
t.newPuzzle(12345);
eq('kakurasu: 初始 fxShakes=0', t.fxShakes(), 0);
eq('kakurasu: 初始 fxBursts=0', t.fxBursts(), 0);

// B) 仅把第 0 行按规范解选中（整盘未解出）→ 行约束满足触发屏震 + 粒子（纯反馈不改胜负）
t.newPuzzle(12345);
const kSol = t.getSolution();
for(let c=0;c<5;c++) t.setCell(0, c, kSol[0][c]);
ok('kakurasu: 单行满足触发 shake', t.fxShakes() > 0, 'fxShakes=' + t.fxShakes());
ok('kakurasu: 单行满足触发 burst', t.fxBursts() > 0, 'fxBursts=' + t.fxBursts());
ok('kakurasu: 单行满足但未解出', t.isWin() === false);

// C) 新局（newPuzzle）归零
t.newPuzzle(777);
eq('kakurasu: 新谜题 fxShakes=0', t.fxShakes(), 0);
eq('kakurasu: 新谜题 fxBursts=0', t.fxBursts(), 0);
