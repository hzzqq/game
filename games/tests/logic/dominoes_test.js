const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../dominoes.html');

// 出牌接龙 + 匹配校验
t.setHands([[1,2],[3,4]],[[2,5],[6,6]], []);
ok('首张空链可出', t.place([1,2],'right'));
eq('棋链长度', t.getLine().length, 1);
eq('右端=2', t.rightEnd(), 2);
ok('对手接 2 匹配', t.place([2,5],'right'));
eq('右端=5', t.rightEnd(), 5);
ok('不匹配被拒', !t.place([3,4],'right'));

// 出完手牌即胜
t.setHands([[1,2]],[[3,3]], []);
ok('出完获胜', t.place([1,2],'right'));
ok('已结束', t.isOver());
eq('玩家0胜', t.getWinner(), 0);

// 左端首出
t.setHands([[2,2]],[[3,3]], []);
ok('左端首出', t.place([2,2],'left'));
eq('左端=2', t.leftEnd(), 2);

// 不可出时过牌
t.setHands([[0,1],[5,5]],[[3,4]], []);
t.place([0,1],'right');
// 玩家1 手牌 [3,4] 无法接右端 1
ok('玩家1无法接可过牌', t.pass());
eq('轮回玩家0', t.getTurn(), 0);
