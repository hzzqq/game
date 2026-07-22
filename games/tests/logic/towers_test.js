const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../towers.html');

const SOL = [
  [1,2,3],
  [2,3,1],
  [3,1,2],
];

// ===== 1. 已知解 + 派生线索→胜利 =====
{
  const clues = t.computeClues(SOL);
  t.setBoard(SOL, clues);
  ok('完整解满足线索→胜利', t.isWin()===true);
  eq('top 线索', JSON.stringify(clues.top), JSON.stringify([3,2,1]));
  eq('left 线索', JSON.stringify(clues.left), JSON.stringify([3,2,1]));
}

// ===== 2. 错填破坏、正填还原 =====
{
  const clues = t.computeClues(SOL);
  const g = SOL.map(r=>r.slice()); g[0][2]=0; // 留空一格
  t.setBoard(g, clues);
  ok('初始留空→未胜', t.isWin()===false);
  t.setValue(0,2,1); // 同行重复 1
  ok('错填→未胜', t.isWin()===false);
  t.setValue(0,2,3); // 还原正确解
  ok('正填→胜利', t.isWin()===true);
}

// ===== 3. 给定格不可改 =====
{
  const clues = t.computeClues(SOL);
  t.setBoard(SOL, clues);
  ok('改给定格被拒', t.setValue(0,0,2)===false);
}

// ===== 4. 越界/非法值被拒 =====
{
  const clues = t.computeClues(SOL);
  const g = SOL.map(r=>r.slice()); g[0][2]=0;
  t.setBoard(g, clues);
  ok('填 9 越界被拒', t.setValue(0,2,9)===false);
  ok('填 0 合法', t.setValue(0,2,0)===true);
}

// ===== 5. vis 可见数计算 =====
{
  eq('vis [1,2,3]=3', t.vis([1,2,3]), 3);
  eq('vis [3,1,2]=1', t.vis([3,1,2]), 1);
  eq('vis [2,3,1]=2', t.vis([2,3,1]), 2);
}

// ===== 6. solve() 证明随机局可解（确定性 PRNG）=====
{
  let s = 555;
  t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });
  t.newGame();
  ok('新局初始未胜', t.getState().won===false);
  const won = t.solve();
  ok('solve 后胜利（必可解）', won===true && t.isWin()===true);
  t.setRand(Math.random);
}

// ===== 7. newGame 结构性 =====
{
  let s = 99;
  t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });
  t.newGame();
  const st = t.getState();
  eq('N=5', st.N, 5);
  eq('top 线索长度 5', st.clues.top.length, 5);
  eq('left 线索长度 5', st.clues.left.length, 5);
  ok('线索值在 1..N', [].concat(st.clues.top,st.clues.bottom,st.clues.left,st.clues.right).every(v=>v>=1&&v<=5));
  t.setRand(Math.random);
}
