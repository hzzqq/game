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

// ---------- 难度系统 ----------
(() => {
  const D = t.DIFFICULTY;
  H.ok('有 4 个难度档', Object.keys(D).length === 4);
  H.ok('含地狱档', !!D.hell);
  H.eq('地狱档无随机弱化', D.hell.aiRandom, 0);
  H.ok('简单档随机率 > 困难档', D.easy.aiRandom > D.hard.aiRandom);
  H.eq('setDifficulty 合法档返回 true', t.setDifficulty('hard'), true);
  H.eq('getDifficulty 反映设置', t.getDifficulty(), 'hard');
  H.eq('setDifficulty 非法档返回 false', t.setDifficulty('xxx'), false);

  const b = t.initialBoard();
  const legal = t.legalMoves(b, 'b');

  // 地狱档：纯最优，aiPick 返回合法黑方着法
  t.setDifficulty('hell');
  const mvH = t.aiPick(b);
  H.ok('地狱档 aiPick 返回着法', !!mvH);
  H.ok('地狱档着法合法', legal.some(m => m.from[0]===mvH.from[0] && m.from[1]===mvH.from[1] && m.to[0]===mvH.to[0] && m.to[1]===mvH.to[1]));

  // 简单档 + 强制随机流：aiPick 走随机合法步（返回首个合法着法）
  t.setDifficulty('easy'); t.setRand(() => 0.0);
  const mvE = t.aiPick(b);
  H.ok('简单档随机步返回着法', !!mvE);
  H.ok('简单档随机着法合法', legal.some(m => m.from[0]===mvE.from[0] && m.from[1]===mvE.from[1] && m.to[0]===mvE.to[0] && m.to[1]===mvE.to[1]));
  t.setDifficulty('normal'); t.setRand(Math.random);
})();
