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

// 回归：踩浮木被带出右边界应落水身亡，且 frog.col 不越界（曾无边界判定被带出棋盘）
t.reset();
t.setRow(2,'water');
t.setRowDir(2,1);
t.setRowSpeed(2,1);
t.setObstacles(2,[8]);
t.setFrog(2,8);
let maxCol=8;
for(let i=0;i<60;i++){ t.tick(0.1); const f=t.getFrog(); if(f.col>maxCol)maxCol=f.col; if(t.isDead())break; }
ok('被浮木带出右边界 → 落水身亡', t.isDead() === true);
ok('frog.col 不超过棋盘边界 (<=COLS-1)', maxCol <= 10, 'maxCol='+maxCol);
// 左边界同理
t.reset();
t.setRow(2,'water');
t.setRowDir(2,-1);
t.setRowSpeed(2,1);
t.setObstacles(2,[2]);
t.setFrog(2,2);
let minCol=2;
for(let i=0;i<60;i++){ t.tick(0.1); const f=t.getFrog(); if(f.col<minCol)minCol=f.col; if(t.isDead())break; }
ok('被浮木带出左边界 → 落水身亡', t.isDead() === true);
ok('frog.col 不低于 0', minCol >= 0, 'minCol='+minCol);
