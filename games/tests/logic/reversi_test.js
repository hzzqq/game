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

// 难度系统
(() => {
  H.eq('黑白棋 4 档难度', Object.keys(t.DIFFICULTY).length, 4);
  H.ok('黑白棋 含地狱档', t.DIFFICULTY.hell.label === '地狱');
  H.eq('黑白棋 地狱档 aiRandom=0', t.DIFFICULTY.hell.aiRandom, 0);
  H.ok('黑白棋 简单档随机率 > 困难档', t.DIFFICULTY.easy.aiRandom > t.DIFFICULTY.hard.aiRandom);
  H.ok('黑白棋 setDifficulty 合法', t.setDifficulty('hard') === true);
  H.eq('黑白棋 getDifficulty', t.getDifficulty(), 'hard');
  H.ok('黑白棋 setDifficulty 非法返回 false', t.setDifficulty('zz') === false);
  // 地狱档：AI 应能落一子（评估分支不抛错）
  t.reset(); t.mode = 'ai'; t.current = 2; t.setDifficulty('hell'); t.setRand(Math.random);
  const before = t.getBoard().flat().filter(v => v === 2).length;
  t.aiTurn();
  const after = t.getBoard().flat().filter(v => v === 2).length;
  H.ok('黑白棋 地狱档 AI 评估落子（含翻子增多）', after > before);
  // 简单档 + 强制随机流：AI 走随机合法步，仍完成落子翻子
  t.reset(); t.mode = 'ai'; t.current = 2; t.setDifficulty('easy'); t.setRand(() => 0.0);
  const b0 = t.getBoard().flat().filter(v => v === 2).length;
  t.aiTurn();
  const b1 = t.getBoard().flat().filter(v => v === 2).length;
  H.ok('黑白棋 简单档随机步完成落子', b1 > b0);
  t.setDifficulty('hell'); t.setRand(Math.random);
})();

// 3) 终局玩家赢局完成特效标记（confetti 钩子范式）
(() => {
  t.reset(); // 确保完成特效标记归零
  // 构造满盘（仅 (0,0) 为绿，其余红）→ 红 63 绿 1，红方胜
  const b = Array.from({length:8},()=>new Array(8).fill(t.R));
  b[0][0] = t.G;
  t.setBoard(b);
  t.current = t.R;
  H.eq('终局前未标记完成特效', t.confettiFired(), false);
  t.step(0,0, t.R); // 落子非法但触发双无步判定 → endGame
  H.ok('终局红胜 gameOver', t.gameOver === true);
  H.eq('终局红方子数=63', t.score().r, 63);
  H.ok('玩家赢局标记完成特效', t.confettiFired() === true);
  t.reset();
  H.eq('新局重置完成特效', t.confettiFired(), false);
})();
