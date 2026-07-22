const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../starbattle.html');

// ===== 1. 新谜题结构 =====
t.newPuzzle(12345);
let st = t.getState();
ok('N=8', st.N === 8);
ok('初始未胜', st.won === false);
ok('区域图 8x8', st.region.length === 8 && st.region.every(r => r.length === 8));

// ===== 2. 应用规范解 → 胜利 =====
{
  t.newPuzzle(12345);
  ok('applySolution → 胜利', t.applySolution() === true && t.isWin() === true);
}

// ===== 3. reset 后未胜 =====
{
  t.newPuzzle(777);
  t.applySolution();
  ok('应用解后胜', t.isWin() === true);
  t.reset();
  ok('reset 后未胜', t.isWin() === false);
}

// ===== 4. 非法输入被拒 =====
{
  t.newPuzzle(1);
  ok('越界 setStar 被拒', t.setStar(9, 9, true) === false);
  ok('负坐标 setStar 被拒', t.setStar(-1, 0, true) === false);
}

// ===== 5. 规范解自洽：8 星，每行/列/区域各 1，互不相邻 =====
{
  t.newPuzzle(99);
  const sol = t.getSolution();
  const reg = t.getState().region;
  let cnt = 0; const rows = new Set(), cols = new Set(), regs = new Set();
  const adj = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  let touch = false;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (sol[r][c]) {
    cnt++; rows.add(r); cols.add(c); regs.add(reg[r][c]);
    for (const [dr, dc] of adj) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && sol[nr][nc]) touch = true; }
  }
  ok('解含 8 颗星', cnt === 8);
  ok('解每行各 1 星', rows.size === 8);
  ok('解每列各 1 星', cols.size === 8);
  ok('解每区域各 1 星', regs.size === 8);
  ok('解任意两星不相邻', touch === false);
}

// ===== 6. 多个种子规范解可解 =====
{
  let allOK = true;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    t.newPuzzle(seed);
    if (!(t.applySolution() === true && t.isWin() === true)) allOK = false;
  }
  ok('8 个种子规范解均可解', allOK);
}
