const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../go.html');

t.newGame();
// 提子：白(0,0) 被黑 (1,0)、(0,1) 包围，黑落 (0,1) 应提白
t.setBoard([
  ['w',null,null,null,null,null,null,null,null],
  ['b',null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
], 'b');
let r = t.place(0,1,'b');
ok('提子落子成功', r.ok);
eq('白子被提走', t.getBoard()[0][0], null);
eq('黑提子计数=1', t.getCaptures().b, 1);

// 禁自杀：白(0,0) 被黑 (1,0)、(0,1) 包围，白落 (0,0) 应被拒
t.newGame();
t.setBoard([
  [null,'b',null,null,null,null,null,null,null],
  ['b',null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
], 'w');
let s = t.place(0,0,'w');
ok('自杀被拒绝', !s.ok);
eq('自杀点仍为空', t.getBoard()[0][0], null);

// 占子更新 + 轮转
t.newGame();
ok('空点落子', t.place(4,4,'b').ok);
eq('落子后该点为黑', t.getBoard()[4][4], 'b');
eq('轮到白', t.getTurn(), 'w');

// 终局判胜（黑多一目）
t.newGame();
t.setBoard([
  ['b','b','b','b','b','b','b','b','b'],
  ['w','w','w','w','w','w','w','w','w'],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
], 'b');
t.resign('w');
ok('终局已结束', t.isOver());
eq('黑胜', t.getWinner(), 'b');
