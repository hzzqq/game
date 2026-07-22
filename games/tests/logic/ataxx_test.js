const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../ataxx.html');

const RED=1, BLACK=2, SIZE=7;
const idx=(r,c)=>r*SIZE+c;
function boardWith(pieces, turn, winner){
  const b=new Array(SIZE*SIZE).fill(0);
  for(const [r,c,v] of pieces) b[idx(r,c)]=v;
  t.setBoard({ board:b, turn:turn||RED, winner:winner||0 });
}
function findMove(moves, fr, fc, tr, tc, type){
  return moves.find(m=>m.from[0]===fr&&m.from[1]===fc&&m.to[0]===tr&&m.to[1]===tc&&(!type||m.type===type));
}

// ---------- 初始布局 ----------
{
  t.newGame();
  eq('红方 4 子', t.countPieces(t.getBoard(), RED), 4);
  eq('黑方 4 子', t.countPieces(t.getBoard(), BLACK), 4);
  const mv=t.legalMoves();
  ok('开局有合法着法', mv.length>0);
  ok('所有目标均为空格且距离≤2', mv.every(m=>{
    const b=t.getBoard();
    return b[idx(m.to[0],m.to[1])]===0 && t.cheb(m.from[0],m.from[1],m.to[0],m.to[1])<=2;
  }));
}

// ---------- 克隆：原件保留，子数 +1 ----------
{
  boardWith([[3,3,RED]], RED);
  const mv=findMove(t.legalMoves(),3,3,3,4,'clone');
  ok('找到克隆着法 (3,3)->(3,4)', !!mv);
  t.applyMove(mv);
  eq('红子数 +1 (=2)', t.countPieces(t.getBoard(), RED), 2);
  eq('原件(3,3)仍在', t.getBoard()[idx(3,3)], RED);
  eq('新格(3,4)为红', t.getBoard()[idx(3,4)], RED);
}

// ---------- 跳跃：原件消失，子数不变 ----------
{
  boardWith([[3,3,RED]], RED);
  const mv=findMove(t.legalMoves(),3,3,3,5,'jump');
  ok('找到跳跃着法 (3,3)->(3,5)', !!mv);
  t.applyMove(mv);
  eq('原件(3,3)已消失', t.getBoard()[idx(3,3)], 0);
  eq('落点(3,5)为红', t.getBoard()[idx(3,5)], RED);
  eq('红子数不变 (=1)', t.countPieces(t.getBoard(), RED), 1);
}

// ---------- 同化：落点周围敌子被感染 ----------
{
  boardWith([[3,3,RED],[3,4,BLACK]], RED); // 红跳到(3,5)，其邻格(3,4)黑被同化
  const mv=findMove(t.legalMoves(),3,3,3,5,'jump');
  ok('找到跳跃着法', !!mv);
  t.applyMove(mv);
  eq('(3,4)黑子被同化为红', t.getBoard()[idx(3,4)], RED);
  eq('黑子数归零', t.countPieces(t.getBoard(), BLACK), 0);
  eq('红子数 = 2（跳落+同化）', t.countPieces(t.getBoard(), RED), 2);
}

// ---------- AI 不送子：优先同化敌子 ----------
{
  boardWith([[3,3,BLACK],[3,4,RED]], BLACK); // 黑可借落子同化唯一的红
  const mv=t.aiMove(t.getState(),3);
  ok('AI 找到着法', !!mv);
  t.applyMove(mv);
  eq('AI 落子后红子被同化', t.getBoard()[idx(3,4)], BLACK);
  eq('红子数归零', t.countPieces(t.getBoard(), RED), 0);
}

// ---------- 终局：填满棋盘按子数判胜 ----------
{
  const pieces=[];
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) pieces.push([r,c,RED]);
  // 仅留 (3,4) 为空，并把 (6,6) 设为黑（1 子）
  pieces.push([3,4,0]); pieces.push([6,6,BLACK]);
  boardWith(pieces, RED);
  const mv=findMove(t.legalMoves(),3,3,3,4,'clone');
  ok('找到克隆着法填满棋盘', !!mv);
  t.applyMove(mv);
  ok('棋盘填满 → 终局', t.winnerOf()!==0);
  eq('子多者(红)获胜', t.winnerOf(), RED);
}

// ---------- finalWinner 平局判定 ----------
{
  const b=new Array(SIZE*SIZE).fill(0);
  b[idx(0,0)]=RED; b[idx(6,6)]=BLACK;
  eq('红黑各 1 子 → 平局(3)', t.finalWinner(b), 3);
}

// ---------- 难度系统 ----------
{
  const D = t.DIFFICULTY;
  ok('有 4 个难度档', Object.keys(D).length === 4);
  ok('含地狱档', !!D.hell);
  eq('地狱档无随机弱化', D.hell.aiRandom, 0);
  ok('简单档随机率 > 困难档', D.easy.aiRandom > D.hard.aiRandom);
  ok('地狱档搜索深度 >= 简单档', D.hell.depth >= D.easy.depth);
  eq('setDifficulty 合法档返回 true', t.setDifficulty('hard'), true);
  eq('getDifficulty 反映设置', t.getDifficulty(), 'hard');
  eq('setDifficulty 非法档返回 false', t.setDifficulty('xxx'), false);
  eq('非法档不改变当前难度', t.getDifficulty(), 'hard');

  // 地狱档：AI 回合走出合法着法并落子
  boardWith([[0,0,RED],[6,6,BLACK],[5,5,BLACK]], BLACK);
  t.setDifficulty('hell');
  const before = t.countPieces(t.getBoard(), BLACK);
  const mv1 = t.aiTurn();
  ok('地狱档 aiTurn 返回着法', !!mv1);
  ok('地狱档落子后黑子数不减', t.countPieces(t.getBoard(), BLACK) >= before);

  // 简单档 + 强制随机流：aiTurn 走随机合法步（不抛错、返回合法着法）
  boardWith([[0,0,RED],[6,6,BLACK],[5,5,BLACK]], BLACK);
  t.setDifficulty('easy'); t.setRand(()=>0.0);
  const mv2 = t.aiTurn();
  ok('简单档随机步返回合法着法', !!mv2 && mv2.from && mv2.to);
  t.setDifficulty('normal'); t.setRand(Math.random);
}

console.log('ataxx: 全部断言通过');
