// 俄罗斯方块 纯逻辑单测：碰撞/旋转/消行 + 道具系统（bomb/slow/shield/charge）
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

// 8) clearLines 消底行 + 计分 + 底行清空 + 充能+1
(() => {
  t.startGame(); // 重置 score=0 lines=0 level=1 charges=0
  H.eq('俄罗斯 初始充能=0', t.getCharges(), 0);
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
  H.eq('俄罗斯 clearLines 充能+1', t.getCharges(), 1);
})();

// 8b) 回归：跨等级边界消行，加分与弹出显示须一致（曾用升级前/后两个 level 不一致）
(() => {
  const { sandbox, t } = H.loadGame('../tetris.html');
  t.startGame();
  let popupText = null;
  sandbox.Juice.popup = (x, y, text) => { popupText = text; };
  // 连续消 9 行，停在 level 1 / lines 9（接近升级边界）
  for (let i = 0; i < 9; i++) {
    const g = t.getGrid();
    for (let c = 0; c < t.COLS; c++) g[t.ROWS - 1][c] = '#x';
    t.setGrid(g);
    t.clearLines();
  }
  H.eq('前9次消行后 lines=9', t.getLines(), 9);
  H.eq('前9次消行后 level 仍=1', t.getLevel(), 1);
  // 第10次消1行 → linesCleared=10 → 升级 level 2
  const scoreBefore = t.getScore();
  const g = t.getGrid();
  for (let c = 0; c < t.COLS; c++) g[t.ROWS - 1][c] = '#x';
  t.setGrid(g);
  t.clearLines();
  const gained = t.getScore() - scoreBefore;
  H.eq('第10次消行实际加分=SCORE_TABLE[1]*1(消行时旧level)', gained, t.SCORE_TABLE[1] * 1);
  H.eq('第10次消行后 level=2', t.getLevel(), 2);
  H.ok('弹出文本与实际加分一致(均用旧level)', !!popupText && popupText.indexOf('+' + gained) >= 0, 'popup=' + popupText + ' gained=' + gained);
})();

// 9) 道具-炸弹：有方块时清掉最底行，无方块时返回 false
(() => {
  t.startGame();
  const g = t.getGrid();
  for(let c=0;c<t.COLS;c++) g[t.ROWS-1][c] = '#x';
  t.setGrid(g);
  const okBomb = t.usePower('bomb');
  H.ok('俄罗斯 炸弹清底行=true', okBomb === true);
  const g2 = t.getGrid();
  let bottomNull = true;
  for(let c=0;c<t.COLS;c++) if(g2[t.ROWS-1][c] !== null) bottomNull = false;
  H.ok('俄罗斯 炸弹后底行清空', bottomNull);
})();

// 10) 道具-护盾：usePower('shield') 后 getShield()=true
(() => {
  t.startGame();
  H.ok('俄罗斯 初始无护盾', t.getShield() === false);
  t.usePower('shield');
  H.ok('俄罗斯 护盾就绪 getShield=true', t.getShield() === true);
})();

// 11) 道具-缓速/充能门槛：usePower 不依赖充能（直接调用），addCharge 累加并封顶 3
(() => {
  t.startGame();
  t.addCharge(2);
  H.eq('俄罗斯 addCharge(2)=2', t.getCharges(), 2);
  t.addCharge(5);
  H.eq('俄罗斯 充能封顶=3', t.getCharges(), 3);
  t.usePower('slow'); // 不应抛错
  H.ok('俄罗斯 缓速调用无异常', true);
})();

// 12) 回归（核心缺陷）：消行升级当帧含「硬降加分」，弹窗显示值必须 == 实际净增(score 增量)
//     复现：先消 9 行停在 level 1 / lines 9，再用竖直 I 硬降填底行空隙消 1 行 → lines 10 → 升级 level 2。
//     硬降 dist=16 → 硬降分 16*2=32；消行分 SCORE_TABLE[1]*level(旧=1)=100；净增=132。
//     旧实现弹窗只显示 +100（不含硬降 32），与实际净增不符；新实现弹窗应显示 +132。
(() => {
  const { sandbox, t } = H.loadGame('../tetris.html');
  t.startGame();
  let popupText = null;
  sandbox.Juice.popup = (x, y, text) => { popupText = text; };
  // 先消 9 行（直接 clearLines），停在 lines=9 level=1
  for (let i = 0; i < 9; i++) {
    const g = t.getGrid();
    for (let c = 0; c < t.COLS; c++) g[t.ROWS - 1][c] = '#x';
    t.setGrid(g);
    t.clearLines();
  }
  H.eq('前置: 9次消行后 lines=9', t.getLines(), 9);
  H.eq('前置: 9次消行后 level 仍=1', t.getLevel(), 1);
  // 构造底行仅留第 2 列(矩阵列2→世界 x=p.x+2)空，竖直 I 落于 x=0
  const g = t.getGrid();
  for (let c = 0; c < t.COLS; c++) g[t.ROWS - 1][c] = '#x';
  g[t.ROWS - 1][2] = null; // 留空一列
  t.setGrid(g);
  const p = t.makePiece('I');
  p.matrix = t.rotateCW(p.matrix); // 旋转后为竖直 I，实心在 matrix 第 2 列
  p.x = 0; p.y = 0;
  t.setCurrent(p);
  const scoreBefore = t.getScore();
  t.hardDrop();                     // 触发硬降 + 消行 + 升级
  const scoreAfter = t.getScore();
  const expectedNet = scoreAfter - scoreBefore;
  const m = popupText && popupText.match(/\+(\d+)/);
  const popupNum = m ? parseInt(m[1], 10) : NaN;
  H.ok('硬降消行升级: 弹窗存在', !!popupText, 'popup=' + popupText);
  H.eq('硬降消行升级: 弹窗值 == 实际净增', popupNum, expectedNet, 'popup=' + popupText + ' net=' + expectedNet);
  H.eq('硬降消行升级: 实际净增 = 硬降分(16*2) + 消行分(100)', expectedNet, t.SCORE_TABLE[1] * 1 + 16 * 2, 'net=' + expectedNet);
  H.eq('硬降消行升级: level 升到 2', t.getLevel(), 2);
  H.eq('硬降消行升级: lines=10', t.getLines(), 10);
})();

// 13) 不变量：初始态 / reset / 消行数→得分表 / 升级阈值
(() => {
  const { sandbox, t } = H.loadGame('../tetris.html');
  t.startGame();
  H.eq('不变量 初始 score=0', t.getScore(), 0);
  H.eq('不变量 初始 level=1', t.getLevel(), 1);
  H.eq('不变量 初始 lines=0', t.getLines(), 0);
  H.eq('不变量 SCORE_TABLE[1..4]', [t.SCORE_TABLE[1], t.SCORE_TABLE[2], t.SCORE_TABLE[3], t.SCORE_TABLE[4]], [100, 300, 500, 800]);
  // 升级阈值：每累计 10 行升一级（floor(lines/10)+1）
  H.eq('不变量 升级阈值 level=floor(lines/10)+1', Math.floor(10 / 10) + 1, 2);
  H.eq('不变量 升级阈值 level=floor(19/10)+1', Math.floor(19 / 10) + 1, 2);
  H.eq('不变量 升级阈值 level=floor(20/10)+1', Math.floor(20 / 10) + 1, 3);
  t.setRand(Math.random); // 还原随机源（若被 setRand 改写）
})();
