const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../crossyroad.html');

// 初始态
t.reset(12345);
ok('crossyroad: 初始未结束', t.isGameOver() === false);
const s0 = t.getState();
ok('crossyroad: 玩家起始在最底行(14)', s0.player.row === 14, 'row=' + s0.player.row);
ok('crossyroad: 初始分数为0', t.getScore() === 0);

// 向前跳：行号 -1，分数增加
t.reset(7);
t.setRow(9, 'safe'); t.setRow(10, 'safe');
t.setPlayer(10, 4);
t.hop('up');
eq('crossyroad: 向前跳动行号 10→9', t.getState().player.row, 9);
ok('crossyroad: 前进后分数>0', t.getScore() > 0, 'score=' + t.getScore());

// 撞车 → 游戏结束
t.reset(1);
t.setPlayer(5, 3);
t.setRow(5, 'road');
t.setObstacles(5, [3]);
t.setRowSpeed(5, 0);
t.step(1);
ok('crossyroad: 撞车 → 游戏结束', t.isGameOver() === true);

// 落水 → 游戏结束（河面无浮木）
t.reset(2);
t.setPlayer(5, 3);
t.setRow(5, 'river');
t.setObstacles(5, []);
t.step(1);
ok('crossyroad: 落水 → 游戏结束', t.isGameOver() === true);

// 踩浮木 → 安全
t.reset(3);
t.setPlayer(5, 3);
t.setRow(5, 'river');
t.setObstacles(5, [{ pos: 3, len: 1 }]);
t.step(1);
ok('crossyroad: 踩浮木安全', t.isGameOver() === false);

// 分数随前进累加（多跳前进）
t.reset(9);
t.setRow(13, 'safe'); t.setRow(12, 'safe'); t.setRow(11, 'safe');
t.setPlayer(13, 4);
const before = t.getScore();
t.hop('up'); t.hop('up');
ok('crossyroad: 多次前进分数变大', t.getScore() > before, 'before=' + before + ' after=' + t.getScore());

// 两个种子 → 布局不同（≥2 种子）
t.reset(111); const a = JSON.stringify(t.getState().rows);
t.reset(222); const b = JSON.stringify(t.getState().rows);
ok('crossyroad: 两个种子布局不同', a !== b);
