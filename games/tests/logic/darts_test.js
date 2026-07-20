const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../darts.html');

t.setScores([10,20]);
eq('玩家0 初始分=10', t.getScore(0), 10);
eq('玩家1 初始分=20', t.getScore(1), 20);

// 恰好减到 0 → 获胜
t.setScores([10,20]);
t.throwDart(10); // 玩家0: 10-10=0 → 胜
ok('减到0 → 游戏结束', t.isOver() === true);
eq('玩家0 获胜', t.getWinner(), 0);

// 爆镖：减成负数 → 本镖作废，分数不变
t.setScores([10,20]);
t.throwDart(11); // 10-11=-1 <0 → 作废
eq('爆镖后分数不变', t.getScore(0), 10);
ok('爆镖未结束', t.isOver() === false);

// 分步减到 0
t.setScores([10,20]);
t.throwDart(4);  // 6
t.throwDart(6);  // 0 → 胜
eq('分步减到0获胜', t.getWinner(), 0);
