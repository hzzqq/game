const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../war.html');

// 直接比大小
t.setDecks([{r:10}],[{r:5}]);
const r = t.step();
ok('玩家1点数大', r.win===1);
eq('玩家1收两张', t.getDecks().p1, 2);
eq('玩家2空', t.getDecks().p2, 0);
ok('已结束', t.isOver());
eq('玩家1胜', t.getWinner(), 1);

// 平局开战：7=7 → 各压一张再比 2 vs 1
t.setDecks([{r:7},{r:9},{r:2}],[{r:7},{r:3},{r:1}]);
const r2 = t.step();
eq('开战后玩家1胜', r2.win, 1);
eq('玩家1末张为2', r2.c1, 2);
eq('玩家2空', t.getDecks().p2, 0);
eq('玩家1胜', t.getWinner(), 1);
