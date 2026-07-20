const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../frogger.html');

t.reset();
// 马路上青蛙与车错开 → 安全
t.setRow(5,'road');
t.setObstacles(5,[3]);
t.setFrog(5,1);
t.setRowSpeed(5,0); // 静止便于判定
t.tick(1);
ok('车不在青蛙格 → 安全', t.isDead() === false);

// 青蛙与车同格 → 被撞死
t.setFrog(5,3);
t.tick(1);
ok('车在青蛙格 → 死亡', t.isDead() === true);

// 河面有浮木 → 踩木安全
t.reset();
t.setRow(5,'water');
t.setObstacles(5,[3]);
t.setFrog(5,3);
t.setRowSpeed(5,0);
t.tick(1);
ok('踩在浮木上 → 安全', t.isDead() === false);

// 河面无浮木 → 落水
t.setObstacles(5,[]);
t.setFrog(5,3);
t.tick(1);
ok('河面无浮木 → 落水死亡', t.isDead() === true);

// 到达终点
t.reset();
t.setFrog(0,5);
ok('处于第0行 → 到达终点', t.isGoal() === true);
