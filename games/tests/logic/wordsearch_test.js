// 单词搜索逻辑单测：直线判定、单词匹配消除、非法选择拒绝、通关判定
const H = require('./harness');
const { t } = H.loadGame('../wordsearch.html');

// 构造确定性棋盘：CODE 横向 (0,0)->(0,3)，GOLD 纵向 (5,5)->(8,5)
const grid = Array.from({length:12},()=>new Array(12).fill('X'));
for (const [r,c,ch] of [[0,0,'C'],[0,1,'O'],[0,2,'D'],[0,3,'E']]) grid[r][c]=ch;
for (const [r,c,ch] of [[5,5,'G'],[6,5,'O'],[7,5,'L'],[8,5,'D']]) grid[r][c]=ch;
const words = [
  { word:'CODE', r0:0,c0:0, r1:0,c1:3 },
  { word:'GOLD', r0:5,c0:5, r1:8,c1:5 },
];
t.setGame(grid, words);

// 1) 直线判定：水平/垂直/对角可通过，非直线拒绝
H.ok('直线 水平', t.lineCells(0,0,0,3) !== null);
H.ok('直线 垂直', t.lineCells(5,5,8,5) !== null);
H.ok('直线 非直线被拒', t.lineCells(0,0,2,3) === null);

// 2) 选中 CODE 正向 → 找到
(() => {
  const res = t.select(0,0,0,3);
  H.ok('选中 CODE 命中', res.ok === true && res.word === 'CODE');
  H.eq('已找到计数=1', t.getState().foundCount, 1);
})();

// 3) 选中 GOLD 反向（终点→起点）也能命中
(() => {
  const res = t.select(8,5,5,5);
  H.ok('反向选中 GOLD 命中', res.ok === true && res.word === 'GOLD');
  H.ok('全部找到=won', t.getState().won === true);
})();

// 4) 非法选择（非直线 / 非单词）被拒绝且不改计数
(() => {
  t.setGame(grid, words); // 重置（前序用例已通关）
  const before = t.getState().foundCount;
  const r1 = t.select(0,0,2,3); // 非直线
  const r2 = t.select(0,0,1,1); // 不在单词上
  H.ok('非直线选择被拒', r1.ok === false && r1.reason === 'not-straight');
  H.ok('无关选择被拒', r2.ok === false && r2.reason === 'no-match');
  H.eq('计数未变', t.getState().foundCount, before);
})();

// 5) 边界越界选择被拒
(() => {
  t.setGame(grid, words); // 重置
  const r = t.select(-1,0,0,0);
  H.ok('越界选择被拒', r.ok === false && r.reason === 'oob');
})();

// 6) 新局生成：词数与网格尺寸合法，且每个词确实在棋盘上
(() => {
  t.newGame();
  const st = t.getState();
  H.ok('新局 词数在 1..6', st.total >= 1 && st.total <= 6);
  H.eq('新局 网格 12x12', st.grid.length, 12);
  let placedOK = true;
  for (const w of st.words) {
    const dr = Math.sign(w.r1-w.r0), dc = Math.sign(w.c1-w.c0);
    const len = Math.max(Math.abs(w.r1-w.r0), Math.abs(w.c1-w.c0)) + 1;
    if (len !== w.word.length) placedOK = false;
    for (let k=0;k<len;k++){ const ch = st.grid[w.r0+dr*k][w.c0+dc*k]; if (ch !== w.word[k]) placedOK = false; }
  }
  H.ok('新局 所有词正确落在棋盘', placedOK);
})();
