// 宝石方块 COLUMNS · 逻辑单测
// 经 window.__t 钩子确定性驱动：生成 / 移动·旋转改变当前列 / 落地锁定 / 消行检测消除并加分 / 重力压缩空格。
const H = require('./harness');
const { t } = H.loadGame('../columns.html');

const COLS = t.COLS, ROWS = t.ROWS;

function blankBoard(){
  const g = [];
  for(let r=0;r<ROWS;r++) g.push(new Array(COLS).fill(null));
  return g;
}

// 1) 生成：开局有当前下落列，棋盘为空
t.newGame(7);
let s = t.getState();
H.ok('生成: 当前列存在', s.current !== null);
H.ok('生成: 当前列为3格', s.current && s.current.cells.length === 3);
let allNull = true;
for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(s.board[r][c] !== null) allNull = false;
H.ok('生成: 棋盘全空', allNull);
H.eq('生成: 得分=0', s.score, 0);
H.eq('生成: 未终局', s.over, false);

// 2) 移动：左右改变列号并受边界夹紧
t.newGame(11);
t.setCurrent({ x:2, cells:[1,2,3], y:0 });
H.ok('移动: 右移 x=3', (t.move(1), t.getState().current.x === 3));
H.ok('移动: 左移 x=2', (t.move(-1), t.getState().current.x === 2));
t.setCurrent({ x:0, cells:[1,2,3], y:0 });
t.move(-1);
H.eq('移动: 左边界夹紧 x=0', t.getState().current.x, 0);
t.setCurrent({ x:COLS-1, cells:[1,2,3], y:0 });
t.move(1);
H.eq('移动: 右边界夹紧 x=COLS-1', t.getState().current.x, COLS-1);

// 3) 旋转：3 格颜色向下轮换 [a,b,c]->[c,a,b]
t.newGame(13);
t.setCurrent({ x:2, cells:[1,2,3], y:0 });
t.rotate();
H.eq('旋转: [1,2,3]->[3,1,2]', t.getState().current.cells, [3,1,2]);

// 4) 落地锁定：drop 后 3 格写入棋盘底部
t.newGame(17);
t.setBoard(blankBoard());
t.setCurrent({ x:0, cells:[1,2,3], y:ROWS-3 });
t.drop();
s = t.getState();
H.eq('锁定: 底行有第3格颜色', s.board[ROWS-1][0], 3);
H.eq('锁定: 中行有第2格颜色', s.board[ROWS-2][0], 2);
H.eq('锁定: 顶行有第1格颜色', s.board[ROWS-3][0], 1);
H.ok('锁定: 锁定后生成了新当前列', s.current !== null);

// 5) 消行检测：底部横向 3 连同色 → 消除并加分
t.newGame(19);
{
  const g = blankBoard();
  for(let c=0;c<3;c++) g[ROWS-1][c] = 1;   // 底部一行 3 连
  t.setBoard(g);
  t.setCurrent({ x:5, cells:[9,9,9], y:0 }); // 远离，避免干扰
  t.setScore(0);
  const removed = t.clearMatches();
  s = t.getState();
  H.ok('消行: 移除≥3 格', removed >= 3, 'removed='+removed);
  H.ok('消行: 得分>0', s.score > 0, 'score='+s.score);
  H.eq('消行: 底行左格已清空', s.board[ROWS-1][0], null);
}

// 6) 重力压缩：消除纵向 3 连后，上方漂浮块应落到列底
t.newGame(23);
{
  const g = blankBoard();
  g[ROWS-1][0] = 1; g[ROWS-2][0] = 1; g[ROWS-3][0] = 1; // 纵向 3 连（列0）
  g[5][0] = 3;  // 同列上方漂浮块
  t.setBoard(g);
  t.setCurrent({ x:5, cells:[9,9,9], y:0 });
  t.setScore(0);
  const removed = t.clearMatches();
  s = t.getState();
  H.eq('重力: 移除=3', removed, 3);
  H.eq('重力: 得分=30', s.score, 30);
  H.eq('重力: 漂浮块落到列底', s.board[ROWS-1][0], 3);
  H.eq('重力: 原漂浮位清空', s.board[5][0], null);
}

console.log('  ✓ columns_test.js 全部通过');
