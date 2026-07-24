// 泡泡龙逻辑单测：普通三连消除 + 彩虹泡通配 + 炸弹泡两圈爆炸
const H = require('./harness');
const { t } = H.loadGame('../bubble.html');

function blankGrid(){
  var g = t.getGrid();
  for (var r = 0; r < t.MAXROWS; r++) for (var c = 0; c < g[r].length; c++) g[r][c] = -1;
  return g;
}
function put(g, r, c, v){ if (g[r] && g[r][c] !== undefined) g[r][c] = v; }

// 1) 普通三连（四连）消除
(() => {
  t.newGame();
  var g = blankGrid();
  put(g, 0, 0, 0); put(g, 0, 1, 0); put(g, 0, 2, 0);
  t.setGrid(g);
  var s0 = t.getScore();
  t.resolveAt(0, 3, 0);
  var gg = t.getGrid();
  H.ok(gg[0][0] === -1 && gg[0][1] === -1 && gg[0][2] === -1 && gg[0][3] === -1,
       'bubble: 普通四连消除 (0,0~0,3 全清空)');
  H.ok(t.getScore() > s0, 'bubble: 消除得分增加 (score=' + t.getScore() + ')');
})();

// 2) 彩虹泡通配：落点解析为相邻最大同色组并消除
(() => {
  t.newGame();
  var g = blankGrid();
  put(g, 0, 0, 0); put(g, 0, 1, 0);   // 颜色0 组
  put(g, 0, 3, 1); put(g, 0, 4, 1);   // 颜色1 组
  t.setGrid(g);
  t.resolveAt(0, 2, t.RAINBOW);        // 彩虹落在中间，应桥接 0 组
  var gg = t.getGrid();
  H.ok(gg[0][0] === -1, 'bubble: 彩虹泡解析为相邻色并消除同色组 (0,0 清空)');
  H.ok(gg[0][3] === 1, 'bubble: 彩虹泡只清通配色组，异色组保留 (0,3 仍为1)');
})();

// 3) 炸弹泡：落点炸掉周围两圈
(() => {
  t.newGame();
  var g = blankGrid();
  for (var r = 3; r <= 7; r++) for (var c = 2; c <= 7; c++) put(g, r, c, 1);
  put(g, 5, 5, -1);                    // 中心留空，便于炸弹精确落位
  t.setGrid(g);
  t.resolveAt(5, 5, t.BOMB);
  var gg = t.getGrid();
  H.ok(gg[5][4] === -1, 'bubble: 炸弹泡炸掉一圈内 (5,4 清空)');
  H.ok(gg[4][4] === -1, 'bubble: 炸弹泡炸掉两圈内 (4,4 清空)');
  H.ok(gg[3][2] === 1, 'bubble: 炸弹泡不波及两圈外 (3,2 保留)');
  H.ok(t.getScore() > 0, 'bubble: 炸弹泡得分 (score=' + t.getScore() + ')');
})();

// 4) 注入：能量胶囊系统（确定性，不破坏核心玩法）
t.newGame();
// 4a 加速掉落生效 + 拾取后移除
t.spawnPickup('boost', 220, 674);
t.stepPickups(0.001);
H.ok('胶囊: 加速拾取 getBoost>0', t.getBoost() > 0);
H.eq('胶囊: 加速拾取后移除', t.getPickups().length, 0);
// 4b 回血掉落生效 + 拾取后移除
t.spawnPickup('heal', 220, 674);
t.stepPickups(0.001);
H.eq('胶囊: 回血拾取 PLives+1', t.getPLives(), 4);
H.eq('胶囊: 回血拾取后移除', t.getPickups().length, 0);
// 4c 未碰撞不生效
t.spawnPickup('boost', 220, 100);
t.stepPickups(0.001);
H.eq('胶囊: 远处未拾取仍保留', t.getPickups().length, 1);
H.eq('胶囊: 远处未触发加速', t.getBoost(), 6);
// 4d 护盾免死（手动持盾）
t.setShield(true); t.setPLives(3);
t.takeHit(1);
H.eq('胶囊: 护盾免死 shield 消耗', t.getShield(), false);
H.eq('胶囊: 护盾免死 PLives 不变', t.getPLives(), 3);
// 4e 无盾扣血
t.setShield(false); t.setPLives(3);
t.takeHit(1);
H.eq('胶囊: 无盾扣血 PLives-1', t.getPLives(), 2);

// ---- 难度选择系统：4 档 / normal 基线 / setDifficulty / startRows & colorCount 缩放 ----
(function(){
  // 4 档存在
  H.ok('难度 4 档存在', !!(t.DIFFICULTY.easy && t.DIFFICULTY.normal && t.DIFFICULTY.hard && t.DIFFICULTY.hell));
  // normal 基线：5 行 5 色（保既有单测语义）
  H.eq('难度 normal startRows=5', t.DIFFICULTY.normal.startRows, 5);
  H.eq('难度 normal colorCount=5', t.DIFFICULTY.normal.colorCount, 5);
  // setDifficulty 合法/非法
  H.ok('难度 setDifficulty(hard) 合法', t.setDifficulty('hard') === true);
  H.ok('难度 setDifficulty(bogus) 非法', t.setDifficulty('bogus') === false);
  // normal → newGame 后填满 5 行、5 种活跃色
  t.setDifficulty('normal'); t.newGame();
  H.eq('难度 normal newGame 填满 5 行', t.countFilledRows(), 5);
  H.eq('难度 normal newGame 活跃色 5 种', t.getActiveColors().length, 5);
  // 地狱档 → 更多起始行、更多颜色
  t.setDifficulty('hell'); t.newGame();
  H.ok('难度 地狱起始行 > 普通', t.countFilledRows() > 5, 'rows=' + t.countFilledRows());
  H.eq('难度 地狱活跃色 6 种', t.getActiveColors().length, 6);
  // 简单档 → 更少起始行、更少颜色
  t.setDifficulty('easy'); t.newGame();
  H.eq('难度 简单起始行 = 4', t.countFilledRows(), 4);
  H.eq('难度 简单活跃色 4 种', t.getActiveColors().length, 4);
  // 递增单调性：easy < normal < hard <= hell（起始行）
  H.ok('难度 起始行单调 easy<normal<hard<=hell',
    t.DIFFICULTY.easy.startRows < t.DIFFICULTY.normal.startRows &&
    t.DIFFICULTY.normal.startRows < t.DIFFICULTY.hard.startRows &&
    t.DIFFICULTY.hard.startRows <= t.DIFFICULTY.hell.startRows);
  t.setDifficulty('normal'); t.newGame(); // 还原
})();

// 5) 通关（盘面清空）触发 confetti：setGrid(空盘) → checkEnd → state=won 且 confettiFired 为真
t.newGame();
var empty = blankGrid();           // 直接清空盘面（仅用于驱动视觉反馈判定）
t.setGrid(empty);
H.ok('通关前 confettiFired 为 false', t.confettiFired() === false);
t.checkEnd();
H.eq('通关 → state=won', t.getState(), 'won');
H.ok('通关 → confettiFired 为真', t.confettiFired() === true);

module.exports = {};
