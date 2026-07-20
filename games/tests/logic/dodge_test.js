const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../dodge.html');

// 陨石正落在玩家正上方 → 被砸中死亡
t.reset();
t.setPlayer(100);
t.setObstacles([{x:100,y:280,vy:10}]); // 玩家带位于 y≈280，陨石落到该高度即判定
t.tick();
ok('陨石命中玩家 → 死亡', t.isDead() === true);

// 陨石与玩家错位 → 安全
t.reset();
t.setPlayer(100);
t.setObstacles([{x:40,y:280,vy:10}]); // x 相差60，远超碰撞半径
t.tick();
ok('陨石未命中 → 存活', t.isDead() === false);

// 无陨石 → 安全且计时推进
t.reset();
t.setPlayer(100);
t.setObstacles([]);
t.tick();
ok('无陨石 → 存活', t.isDead() === false);
eq('计时推进', t.getTime(), 1);
