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

module.exports = {};
