const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../jungle.html');

// 吃子：红狮(7) 在 (5,3) 吃蓝狼(4) 在 (4,3)（均为非水格）
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,{side:'w',rank:4},null,null,null],
  [null,null,null,{side:'b',rank:7},null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'b');
ok('红狮吃蓝狼', t.move(5,3,4,3));
eq('狮到(4,3)', t.getPiece(4,3).side, 'b');
eq('(5,3)已空', t.getPiece(5,3), null);

// 进敌穴胜：红方踏入蓝穴(0,3)
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,{side:'b',rank:7},null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'b');
ok('踏入蓝穴获胜', t.move(1,3,0,3));
ok('已结束', t.isOver());
eq('红方胜', t.getWinner(), 'b');

// 鼠克象：红鼠(1) 在 (7,2) 吃蓝象(8) 在 (7,1)
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,{side:'w',rank:8},{side:'b',rank:1},null,null,null,null],
  [null,null,null,null,null,null,null],
], 'b');
ok('鼠克象', t.move(7,2,7,1));
eq('象被吃', t.getPiece(7,1).side, 'b');

// 象不吃鼠：蓝象(8) 在 (2,3) 不能吃红鼠(1) 在 (2,2)
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,{side:'b',rank:1},{side:'w',rank:8},null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'w');
ok('象不吃鼠', !t.move(2,3,2,2));

// 回归：鼠蹲在敌方陷阱上 effRank 降为 0，象应能吃（曾因「象不吃鼠」在 effRank 前短路而无法吃）
t.newGame();
t.setBoard([
  [null,{side:'w',rank:8},{side:'b',rank:1},null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'w');
ok('象吃敌方陷阱上的鼠', t.move(0,1,0,2));
eq('鼠被吃，象落到(0,2)', t.getPiece(0,2).side, 'w');
