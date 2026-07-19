// 俄罗斯方块 纯逻辑单测：碰撞/旋转/消行
const H = require('./harness');
const { t } = H.loadGame('../tetris.html');

// 启动以初始化 grid / score / level
t.startGame();

// 1) 左越界碰撞
H.ok('俄罗斯 左越界碰撞=true', t.collides({ x:0, y:0, matrix:[[1]] }, -1, 0) === true);
// 2) 地板越界碰撞
H.ok('俄罗斯 地板越界碰撞=true', t.collides({ x:0, y:t.ROWS-1, matrix:[[1]] }, 0, 1) === true);
// 3) 空地无碰撞
H.ok('俄罗斯 空地无碰撞=false', t.collides({ x:3, y:3, matrix:[[1]] }, 0, 0) === false);
// 4) 撞到已有方块
(() => {
  const g = t.getGrid();
  g[5][2] = '#x';
  t.setGrid(g);
  H.ok('俄罗斯 撞到已有方块=true', t.collides({ x:2, y:4, matrix:[[1]] }, 0, 1) === true);
})();
// 5) 2x2 右越界碰撞
H.ok('俄罗斯 2x2 右越界=true', t.collides({ x:t.COLS-1, y:0, matrix:[[1,1],[1,1]] }, 0, 0) === true);

// 6) rotateCW 转置正确: [[1,2],[3,4]] -> [[3,1],[4,2]]
H.eq('俄罗斯 rotateCW', t.rotateCW([[1,2],[3,4]]), [[3,1],[4,2]]);

// 7) makePiece O 形 2x2 居中生成
(() => {
  const p = t.makePiece('O');
  H.ok('俄罗斯 makePiece O 为2x2', p.matrix.length === 2 && p.matrix[0].length === 2);
  H.ok('俄罗斯 makePiece O 居中x', p.x === Math.floor((t.COLS-2)/2));
  H.ok('俄罗斯 makePiece O y=0', p.y === 0);
})();

// 8) clearLines 消底行 + 计分 + 底行清空
(() => {
  t.startGame(); // 重置 score=0 lines=0 level=1
  const g = t.getGrid();
  for(let c=0;c<t.COLS;c++) g[t.ROWS-1][c] = '#x';
  t.setGrid(g);
  t.clearLines();
  H.ok('俄罗斯 clearLines 行数+1', t.getLines() === 1, '得到 '+t.getLines());
  H.ok('俄罗斯 clearLines 加分=SCORE_TABLE[1]', t.getScore() === t.SCORE_TABLE[1], '得到 '+t.getScore());
  const g2 = t.getGrid();
  let bottomNull = true;
  for(let c=0;c<t.COLS;c++) if(g2[t.ROWS-1][c] !== null) bottomNull = false;
  H.ok('俄罗斯 clearLines 底行已清空', bottomNull);
})();
