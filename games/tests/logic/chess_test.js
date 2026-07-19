// 中国象棋逻辑单测：初始局面、将帅照面(飞将)、棋子走法、开局合法步、AI 走法
const H = require('./harness');
const { t } = H.loadGame('../chess.html');

(() => {
  const b = t.initialBoard();
  let cnt = 0;
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) if (b[r][c]) cnt++;
  H.eq('中国象棋 初始 32 子', cnt, 32);
  H.ok('黑将位于 (0,4)', b[0][4] && b[0][4].side === 'b' && b[0][4].type === 'G');
  H.ok('红帅位于 (9,4)', b[9][4] && b[9][4].side === 'r' && b[9][4].type === 'G');
  H.ok('开局红方未被将', t.inCheck(b, 'r') === false);
  H.ok('开局绿方未被将', t.inCheck(b, 'b') === false);
  const lm = t.legalMoves(b, 'r');
  H.ok('红方有合理开局步数', lm.length > 0 && lm.length < 50, '(' + lm.length + ')');

  // 将帅照面（同列、中间无子）=> 犯规被将
  const b2 = t.initialBoard();
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) b2[r][c] = null;
  b2[0][4] = { side: 'b', type: 'G' }; b2[9][4] = { side: 'r', type: 'G' };
  H.ok('将帅照面 => 红方被将', t.inCheck(b2, 'r') === true);

  // 红车 (9,0)
  const ch = t.pseudo(b, 9, 0);
  H.ok('红车可上移到 (8,0)', ch.some(m => m[0] === 8 && m[1] === 0));
  H.ok('红车可到 (7,0)', ch.some(m => m[0] === 7 && m[1] === 0));
  H.ok('红车被己方马挡 (9,1)', !ch.some(m => m[0] === 9 && m[1] === 1));
  H.ok('红车被己方兵挡 (6,0)', !ch.some(m => m[0] === 6 && m[1] === 0));

  // AI 能给出一步
  H.ok('aiPick 返回走法', !!t.aiPick(b));
})();
