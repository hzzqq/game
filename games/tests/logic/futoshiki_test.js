const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../futoshiki.html');

// 3x3 拉丁方解
const SOL = [
  [1,2,3],
  [2,3,1],
  [3,1,2],
];

// ===== 1. 正确填入→胜利 =====
{
  const givens = [
    [1,0,0],
    [0,3,0],
    [0,0,2],
  ];
  const cts = [
    {r1:0,c1:0,r2:0,c2:1,op:'<'},
    {r1:1,c1:1,r2:2,c2:1,op:'>'},
  ];
  t.setBoard(givens, cts);
  ok('初始未胜（有空格）', t.isWin()===false);
  t.setValue(0,1,2); t.setValue(0,2,3);
  t.setValue(1,0,2); t.setValue(1,2,1);
  t.setValue(2,0,3); t.setValue(2,1,1);
  ok('填入完整解→胜利', t.isWin()===true);
}

// ===== 2. 同行重复→未胜 =====
{
  const givens = [[1,0,0],[0,3,0],[0,0,2]];
  const cts = [{r1:0,c1:0,r2:0,c2:1,op:'<'}];
  t.setBoard(givens, cts);
  t.setValue(0,1,1); // 与 (0,0)=1 同行重复
  ok('同行重复→未胜', t.isWin()===false);
}

// ===== 3. 约束失败（给定已矛盾）=====
{
  // 完整拉丁方，但强加 (0,0)>(0,1) 与解矛盾
  t.setBoard(SOL, [{r1:0,c1:0,r2:0,c2:1,op:'>'}]);
  ok('拉丁方成立', t.latinOK()===true);
  ok('约束 (1>2) 失败', t.constraintsOK()===false);
  ok('约束不满足→未胜', t.isWin()===false);
}
// ===== 3b. 约束成立→胜利 =====
{
  t.setBoard(SOL, [{r1:0,c1:0,r2:0,c2:1,op:'<'}]);
  ok('约束 (1<2) 成立→胜利', t.isWin()===true);
}

// ===== 4. 给定格不可改 =====
{
  const givens = [[1,0,0],[0,3,0],[0,0,2]];
  t.setBoard(givens, []);
  ok('改给定格被拒', t.setValue(0,0,5)===false);
}

// ===== 5. 越界/非法值被拒 =====
{
  const givens = [[1,0,0],[0,3,0],[0,0,2]];
  t.setBoard(givens, []);
  ok('填 9 越界(N=3)被拒', t.setValue(0,1,9)===false);
  ok('填 0 合法(清空)', t.setValue(0,1,0)===true);
}

// ===== 6. update 返回状态 =====
{
  const givens = [[1,0,0],[0,3,0],[0,0,2]];
  t.setBoard(givens, []);
  const st = t.update();
  eq('状态 N=3', st.N, 3);
  ok('状态含约束列表', Array.isArray(st.constraints));
}

// ===== 7. newGame 生成可解雏形（确定性 PRNG）=====
{
  let s = 2024;
  t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });
  t.newGame();
  const st = t.getState();
  eq('N=5', st.N, 5);
  ok('给定格≥2', st.filled>=2);
  ok('约束≥1', st.constraints.length>=1);
  ok('初始未胜（有空格）', st.won===false);
  // 给定之间行列不重
  let okGivens=true;
  for(let r=0;r<5;r++){ const s=new Set(); for(let c=0;c<5;c++){ if(st.givens[r][c]){ if(s.has(st.grid[r][c])) okGivens=false; s.add(st.grid[r][c]); } } }
  for(let c=0;c<5;c++){ const s=new Set(); for(let r=0;r<5;r++){ if(st.givens[r][c]){ if(s.has(st.grid[r][c])) okGivens=false; s.add(st.grid[r][c]); } } }
  ok('给定行列不重复', okGivens);
  // 两端皆给定的约束必成立
  let okC=true;
  for(const ct of st.constraints){
    if(st.givens[ct.r1][ct.c1] && st.givens[ct.r2][ct.c2]){
      const a=st.grid[ct.r1][ct.c1], b=st.grid[ct.r2][ct.c2];
      if(!((ct.op==='<'&&a<b)||(ct.op==='>'&&a>b))) okC=false;
    }
  }
  ok('双给定约束与解一致', okC);
  t.setRand(Math.random);
}

// ===== 8. 完成特效：解出后 confettiFired 标记 =====
{
  const givens = [
    [1,0,0],
    [0,3,0],
    [0,0,2],
  ];
  const cts = [
    {r1:0,c1:0,r2:0,c2:1,op:'<'},
    {r1:1,c1:1,r2:2,c2:1,op:'>'},
  ];
  const before = t.confettiFired;
  t.setBoard(givens, cts);
  t.setValue(0,1,2); t.setValue(0,2,3);
  t.setValue(1,0,2); t.setValue(1,2,1);
  t.setValue(2,0,3); t.setValue(2,1,1);
  ok('解出谜题→confettiFired 增加', t.confettiFired > before);
}
