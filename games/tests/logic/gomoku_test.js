// 五子棋逻辑单测：胜负判定（横/纵/双斜）、doMove 触发胜利、AI 堵杀、悔棋
const H = require('./harness');
const { t } = H.loadGame('../gomoku.html');
const N = t.N, EMPTY = t.EMPTY, P = t.P, A = t.A;

function flat(rows) { return rows.flat(); }
function get(r, c) { return t.getBoard()[r * N + c]; }

// 1) 横向五连：第0行 (0..4) 列放 P
(() => {
  const b = Array(N * N).fill(EMPTY);
  for (let c = 0; c < 4; c++) b[0 * N + c] = P; // 4子
  t.setBoard(b);
  const line = t.checkWin(0, 3, P); // 以最后一手为中心检测
  H.ok('五子棋 横向4子 checkWin 未误判', line === null);
  b[0 * N + 4] = P;
  t.setBoard(b);
  const line2 = t.checkWin(0, 4, P);
  H.ok('五子棋 横向5连 checkWin 命中', Array.isArray(line2) && line2.length === 5);
})();

// 2) doMove 落第5子触发 gameOver + lastWin
(() => {
  t.reset();
  const b = Array(N * N).fill(EMPTY);
  for (let c = 0; c < 4; c++) b[0 * N + c] = P;
  t.setBoard(b);
  t.doMove(0, 4, P);
  H.ok('五子棋 doMove 成五 gameOver', t.gameOver === true);
  H.ok('五子棋 doMove 记录胜利连线', Array.isArray(t.lastWin) && t.lastWin.length === 5);
})();

// 3) 纵向五连
(() => {
  const b = Array(N * N).fill(EMPTY);
  for (let r = 0; r < 5; r++) b[r * N + 3] = A;
  t.setBoard(b);
  const line = t.checkWin(4, 3, A);
  H.ok('五子棋 纵向5连 checkWin 命中', Array.isArray(line) && line.length === 5);
})();

// 4) 主对角线五连
(() => {
  const b = Array(N * N).fill(EMPTY);
  for (let i = 0; i < 5; i++) b[i * N + i] = P;
  t.setBoard(b);
  H.ok('五子棋 主对角线5连', Array.isArray(t.checkWin(4, 4, P)));
})();

// 5) 反斜线五连（[1,-1] 方向）
(() => {
  const b = Array(N * N).fill(EMPTY);
  for (let i = 0; i < 5; i++) b[i * N + (4 - i)] = A;
  t.setBoard(b);
  H.ok('五子棋 反斜线5连', Array.isArray(t.checkWin(4, 0, A)));
})();

// 6) 仅4连不判胜
(() => {
  const b = Array(N * N).fill(EMPTY);
  for (let c = 0; c < 4; c++) b[5 * N + c] = P;
  t.setBoard(b);
  H.ok('五子棋 仅4连不判胜', t.checkWin(5, 3, P) === null);
})();

// 7) AI 堵杀：玩家 P 在 (7,3..7,6) 四连、两端空，AI 应堵一端
(() => {
  t.reset();
  const b = Array(N * N).fill(EMPTY);
  for (let c = 3; c <= 6; c++) b[7 * N + c] = P;
  t.setBoard(b);
  t.current = A;
  t.aiTurn();
  const blockedLeft = get(7, 2) === A;   // 左端堵
  const blockedRight = get(7, 7) === A;  // 右端堵
  H.ok('五子棋 AI 封堵活四一端', blockedLeft || blockedRight);
})();

// 8) 悔棋：落一子后撤销应清空该格
(() => {
  t.reset();
  t.doMove(7, 7, P);
  H.ok('五子棋 落子生效', get(7, 7) === P);
  t.undo();
  H.ok('五子棋 悔棋清空该格', get(7, 7) === EMPTY);
})();
