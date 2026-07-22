const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../checkers.html');

// ---------- 常量 ----------
eq('SIZE=8', t.SIZE, 8);
eq('EMPTY=0', t.EMPTY, 0);
eq('REDman=1', t.REDman, 1);
eq('BLACKman=2', t.BLACKman, 2);
eq('REDking=3', t.REDking, 3);
eq('BLACKking=4', t.BLACKking, 4);

// ---------- 工具 ----------
ok('isDark 奇偶', t.isDark(0,1)===true && t.isDark(0,0)===false);
ok('sideOf red', t.sideOf(t.REDman)==='red' && t.sideOf(t.REDking)==='red');
ok('sideOf black', t.sideOf(t.BLACKman)==='black' && t.sideOf(t.BLACKking)==='black');
ok('isKing', t.isKing(t.REDking) && t.isKing(t.BLACKking) && !t.isKing(t.REDman));

// ---------- 新局布子 ----------
{
  t.newGame();
  eq('红方 12 子', t.countPieces('red'), 12);
  eq('黑方 12 子', t.countPieces('black'), 12);
  eq('开局红先手', t.getTurn(), 'red');
  ok('开局无 pending', t.getPending()===null);
  // 棋子只在深色格
  let allDark=true, anyLight=false;
  const b=t.getBoard();
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){ if(b[r][c]!==0 && !t.isDark(r,c)) anyLight=true; }
  ok('所有棋子在深色格', !anyLight);
  // 黑在 0-2 行，红在 5-7 行
  ok('黑在顶部', b[0].some(x=>x===t.BLACKman) && !b[5].some(x=>x===t.BLACKman));
  ok('红在底部', b[7].some(x=>x===t.REDman) && !b[2].some(x=>x===t.REDman));
  ok('开局有合法走法', t.legalMoves().length>0);
  ok('开局未分胜负', t.winner()===null);
}

// ---------- 吃子（强制） ----------
{
  // 构造：红(5,2) 可吃 黑(4,3) 落 (3,4)
  const board = Array.from({length:8},()=>new Array(8).fill(0));
  board[5][2]=t.REDman; board[4][3]=t.BLACKman; board[3][4]=0;
  t.setBoard(board); t.setTurn('red'); t.setPending(null);
  const caps=t.capturesFrom(5,2);
  ok('capturesFrom 找到吃子', caps.length===1 && caps[0].to[0]===3 && caps[0].to[1]===4);
  const mv=t.legalMoves();
  ok('强制吃子：合法走法只含吃子', mv.length===1 && mv[0].capture && mv[0].capture[0]===4);
  t.applyMove(mv[0]);
  const nb=t.getBoard();
  eq('吃子后敌方清除', nb[4][3], 0);
  eq('吃子后己方落点', nb[3][4], t.REDman);
  eq('吃子后轮到黑', t.getTurn(), 'black');
  ok('无连吃 pending=null', t.getPending()===null);
}

// ---------- 普通走子（无吃子时禁止吃子） ----------
{
  const board = Array.from({length:8},()=>new Array(8).fill(0));
  board[5][2]=t.REDman; // 周围无敌子 → 只能普通走
  t.setBoard(board); t.setTurn('red'); t.setPending(null);
  const mv=t.legalMoves();
  ok('无吃子时只有普通走法', mv.length>=1 && mv.every(m=>!m.capture));
  ok('红兵向上走 (r 减小)', mv.every(m=>m.to[0] < m.from[0]));
  t.applyMove(mv[0]);
  eq('普通走子后轮到黑', t.getTurn(), 'black');
}

// ---------- 升王 ----------
{
  const board = Array.from({length:8},()=>new Array(8).fill(0));
  board[1][0]=t.REDman; // 红兵在 row1，走一步到 row0 → 升王
  // (1,0) 上方 (0,1) 须为空且深色
  t.setBoard(board); t.setTurn('red'); t.setPending(null);
  const mv=t.legalMoves();
  const up=mv.find(m=>m.to[0]===0);
  ok('红兵可走到 row0', !!up);
  t.applyMove(up);
  eq('红兵到底线升王', t.pieceAt(0, up.to[1]), t.REDking);
  ok('升王后 isKing 真', t.isKing(t.pieceAt(0, up.to[1])));
}

// ---------- 王可双向走 ----------
{
  const board = Array.from({length:8},()=>new Array(8).fill(0));
  board[4][3]=t.REDking;
  t.setBoard(board); t.setTurn('red'); t.setPending(null);
  const mv=t.legalMoves();
  ok('王有向上走法', mv.some(m=>m.to[0]<4));
  ok('王有向下走法', mv.some(m=>m.to[0]>4));
}

// ---------- 胜负判定 ----------
{
  const board = Array.from({length:8},()=>new Array(8).fill(0));
  board[5][2]=t.REDman; board[4][3]=t.BLACKman;
  t.setBoard(board); t.setTurn('red'); t.setPending(null);
  eq('吃光黑子前未分胜负', t.winner(), null);
  t.applyMove(t.legalMoves()[0]); // 吃黑子
  eq('吃光黑子 → 红胜', t.winner(), 'red');
}
{
  // 黑子数为 0 直接判负
  const board = Array.from({length:8},()=>new Array(8).fill(0));
  board[5][2]=t.REDman;
  t.setBoard(board); t.setTurn('black'); t.setPending(null);
  eq('黑方无子 → 红胜', t.winner(), 'red');
}

// ---------- AI 走子不抛错 ----------
{
  t.newGame();
  t.setTurn('black');
  t.aiMove(); // 黑方应完成一个或多个回合直到轮到红或结束
  ok('aiMove 后无异常且轮转/结束', t.getTurn()==='red' || t.winner()!==null);
}

// ---------- 难度系统 ----------
{
  eq('跳棋 4 档难度', Object.keys(t.DIFFICULTY).length, 4);
  ok('跳棋 含地狱档', t.DIFFICULTY.hell.label==='地狱');
  eq('跳棋 地狱档 aiRandom=0', t.DIFFICULTY.hell.aiRandom, 0);
  ok('跳棋 简单档随机率 > 困难档', t.DIFFICULTY.easy.aiRandom > t.DIFFICULTY.hard.aiRandom);
  ok('跳棋 setDifficulty 合法', t.setDifficulty('normal')===true);
  eq('跳棋 getDifficulty', t.getDifficulty(), 'normal');
  ok('跳棋 setDifficulty 非法返回 false', t.setDifficulty('qq')===false);
  // 地狱档择优：黑方在"升王"与"普通前进"间应选升王
  const board = Array.from({length:8},()=>new Array(8).fill(0));
  board[6][1]=t.BLACKman;  // 可走到 (7,0)/(7,2) → 升王
  board[1][4]=t.BLACKman;  // 只能普通前进到 row2
  t.setBoard(board); t.setTurn('black'); t.setPending(null);
  t.setDifficulty('hell'); t.setRand(Math.random);
  t.aiMove();
  const nb=t.getBoard();
  const kinged = nb[7].some(x=>x===t.BLACKking);
  ok('跳棋 地狱档优先升王', kinged===true);
  // 简单档 + 强制随机流：AI 走随机步，仍完成走子（轮转到红或结束）
  t.setBoard(board.map(r=>r.slice())); t.setTurn('black'); t.setPending(null);
  t.setDifficulty('easy'); t.setRand(()=>0.0);
  t.aiMove();
  ok('跳棋 简单档随机步完成回合', t.getTurn()==='red' || t.winner()!==null);
  t.setDifficulty('normal'); t.setRand(Math.random);
}

console.log('checkers: 全部断言通过');
