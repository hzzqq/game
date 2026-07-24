const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../quarto.html');

// 落子 + 受控棋子机制
t.newGame();
ok('选定待放棋子1', t.give(1));
eq('当前待放', t.getPending(), 1);
ok('放置到(0,0)', t.place(0,0));
eq('棋盘落子', t.getBoard()[0][0], 1);
ok('落子后待放清空', t.getPending()===null);

// 强制胜利：第 1,3,5,7 枚（bit0 皆为 1）排成行
t.newGame();
t.give(1); t.place(0,0);
t.give(3); t.place(0,1);
t.give(5); t.place(0,2);
t.give(7); t.place(0,3);
ok('已结束', t.isOver());
eq('第4手玩家(玩家2)胜', t.getWinner(), 1);

// 非法放置：占用格被拒
t.newGame();
t.give(0); t.place(1,1);
ok('占用格被拒', !t.place(1,1));

// 非法选子：已用棋子被拒
t.newGame();
t.give(0); t.place(2,2);
ok('已用棋子不可再选', !t.give(0));

// ---------- 难度系统 ----------
{
  eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty()==hell', t.getDifficulty(), 'hell');
  eq('setDifficulty(bad) 返回 false', t.setDifficulty('bad'), false);
}
