const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../flowfree.html');

// 已知 3x3 解：三横条
const SOL = [
  [1,1,1],
  [2,2,2],
  [3,3,3],
];
const EP = [
  {color:1, a:[0,0], b:[0,2]},
  {color:2, a:[1,0], b:[1,2]},
  {color:3, a:[2,0], b:[2,2]},
];

// ===== 1. 已知解直接判定胜利 =====
{
  const r = t.setBoard(SOL, EP);
  ok('setBoard 后胜利', t.isWin()===true);
  eq('颜色数=3', r.colors, 3);
  eq('填满格数=9', t.filledCount(), 9);
  eq('N=3', r.N, 3);
}

// ===== 2. 清掉一条路径后未胜 =====
{
  t.setBoard(SOL, EP);
  t.clearPath(1);
  ok('清掉 1 号后未胜', t.isWin()===false);
  eq('填满格数=6', t.filledCount(), 6);
}

// ===== 3. 合法 setPath 重建一条颜色 =====
{
  t.setBoard(SOL, EP);
  t.clearPath(1); t.clearPath(2); t.clearPath(3);
  ok('1 号合法路径被接受', t.setPath(1, [[0,0],[0,1],[0,2]])===true);
  ok('仅 1 号未胜', t.isWin()===false);
  ok('2 号合法路径被接受', t.setPath(2, [[1,0],[1,1],[1,2]])===true);
  ok('3 号合法路径被接受', t.setPath(3, [[2,0],[2,1],[2,2]])===true);
  ok('三色补全后胜利', t.isWin()===true);
}

// ===== 4. 穿越他色区域被拒（路径含他色端点/占用格）=====
{
  t.setBoard(SOL, EP);
  // 2 号试图从 (1,0) 经 1 号区域 (0,0)(0,1)(0,2) 走到 (1,2)：连续且端点正确，
  // 但途中占用他色格子/端点 → 拒
  ok('2 号穿越 1 号区域被拒', t.setPath(2, [[1,0],[0,0],[0,1],[0,2],[1,2]])===false);
}

// ===== 5. 不连续路径被拒 =====
{
  t.setBoard(SOL, EP);
  t.clearPath(1); t.clearPath(2); t.clearPath(3);
  ok('端点正确但不连续被拒', t.setPath(1, [[0,0],[0,2]])===false);
}

// ===== 6. 端点错误被拒 =====
{
  t.setBoard(SOL, EP);
  t.clearPath(1); t.clearPath(2); t.clearPath(3);
  ok('终点不是端点被拒', t.setPath(1, [[0,0],[1,0],[2,0]])===false);
}

// ===== 7. validatePath 直接校验 =====
{
  t.setBoard(SOL, EP);
  ok('validatePath 合法', t.validatePath(1, [[0,0],[0,1],[0,2]])===true);
  ok('validatePath 越界', t.validatePath(1, [[0,0],[0,-1]])===false);
}

// ===== 8. newGame 生成结构合法（确定性 PRNG）=====
{
  let s = 12345;
  t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });
  t.newGame();
  const st = t.getState();
  ok('newGame 颜色在 4~6', st.colors>=4 && st.colors<=6);
  eq('初始未铺格', st.filled, 0);
  // 所有端点互不重叠
  const eps=[];
  for(const e of st.endpoints){ eps.push(e.a.join(','), e.b.join(',')); }
  const uniq = new Set(eps);
  eq('端点互不重叠', uniq.size, eps.length);
  t.setRand(Math.random);
}
