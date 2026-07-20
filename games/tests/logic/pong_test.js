const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../pong.html');

t.reset();
// 球在右侧挡板前方(x≈362 为挡板碰撞面)、挡板居中(y=150 覆盖 120-180)，球 y=150 在范围内 → 反弹
t.setPaddle('right',150);
t.setBall(355,150,5,0);
t.step(3); // ball.x → 368，触发右挡板反弹
eq('右挡板反弹后 vx 变负', t.getBall().vx < 0, true);
eq('挡板反弹未得分', t.getScore(), [0,0]);

// 球出右边界且右挡板让开(y=50 覆盖 20-80，球 y=300 不在) → 左方得分
t.reset();
t.setPaddle('right',50);
t.setBall(390,300,5,0);
t.step(5); // x→415 > 400(宽) → 左方(score[0])得分
eq('球越过右挡板 → 左方得分', t.getScore(), [1,0]);

// 上下墙反弹
t.reset();
t.setBall(200,5,0,-5); // 向上，贴近上墙
t.step(5); // y→0 反弹为向下
ok('上墙反弹后 vy 变正', t.getBall().vy > 0);
