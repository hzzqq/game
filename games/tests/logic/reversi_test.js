// 黑白棋逻辑单测：开局合法步数、夹吃翻子、落子后翻面
const H = require('./harness');
const { t } = H.loadGame('../reversi.html');

(() => {
  t.reset();
  const moves = t.legalMoves(1); // 红 R=1
  H.eq('黑白棋 红方开局 4 步', moves.length, 4);
  const flips = t.flipsFor(2, 3, 1);
  H.eq('(2,3) 翻子数=1', flips.length, 1);
  H.ok('(2,3) 翻转 (3,3)', flips.length === 1 && flips[0][0] === 3 && flips[0][1] === 3);
  t.place(2, 3, 1);
  const b = t.getBoard();
  H.ok('落子后 (2,3) 为红', b[2][3] === 1);
  H.ok('落子后 (3,3) 翻为红', b[3][3] === 1);
})();
