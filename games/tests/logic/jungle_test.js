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
