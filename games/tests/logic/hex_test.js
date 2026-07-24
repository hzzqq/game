const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../hex.html');

// 红方沿第 0 列连通上下 → 胜
const red = [
  ['r',null,null],
  ['r',null,null],
  ['r',null,null],
];
t.setBoard(red, 'r', 3);
ok('红连通上下', t.isWin('r'));
ok('绿未连通', !t.isWin('g'));

// 空盘无胜
t.setBoard([
  [null,null,null],
  [null,null,null],
  [null,null,null],
], 'r', 3);
ok('空盘无胜', !t.isWin('r') && !t.isWin('g'));

// 落子 + 胜负判定（红先落一子）
t.newGame(3);
ok('红落(0,0)', t.play(0,0,'r'));
eq('(0,0)为红', t.getBoard()[0][0], 'r');
eq('轮到绿', t.getTurn(), 'g');

// 绿连通左右（col0 → 底行 → col2）
t.newGame(3);
ok('绿落(0,0)', t.play(0,0,'g'));
ok('绿落(1,0)', t.play(1,0,'g'));
ok('绿落(2,0)', t.play(2,0,'g'));
ok('绿落(2,1)', t.play(2,1,'g'));
ok('绿落(2,2)', t.play(2,2,'g'));
ok('绿连通左右', t.isWin('g'));
ok('已结束', t.isOver());
eq('绿胜', t.getWinner(), 'g');

// 占位拒绝
t.newGame(3);
t.play(1,1,'r');
ok('已占格被拒', !t.play(1,1,'g'));

// ---------- 难度系统 ----------
{
  eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty()==hell', t.getDifficulty(), 'hell');
  eq('setDifficulty(bad) 返回 false', t.setDifficulty('bad'), false);
}
