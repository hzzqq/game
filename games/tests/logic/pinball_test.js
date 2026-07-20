const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../pinball.html');

// ---------- 常量 ----------
eq('W=400', t.W, 400);
eq('H=600', t.H, 600);
eq('G=0.35', t.G, 0.35);
eq('BALL_R=10', t.BALL_R, 10);
eq('START_LIVES=3', t.START_LIVES, 3);
eq('FLIP_LX=120', t.FLIP_LX, 120);
eq('FLIP_RX=280', t.FLIP_RX, 280);
eq('BUMPERS 3 根', t.BUMPERS.length, 3);

// ---------- 重力 ----------
{
  t.reset();
  t.setBall({x:200, y:100, vx:0, vy:0});
  t.step();
  ok('重力使 vy 增加 (>0)', t.getBall().vy > 0);
}

// ---------- 左墙反弹 ----------
{
  t.reset();
  t.setBall({x:5, y:100, vx:-3, vy:0});
  t.step();
  ok('左墙反弹 vx 变正', t.getBall().vx > 0);
}
{
  t.reset();
  t.setBall({x:395, y:100, vx:3, vy:0});
  t.step();
  ok('右墙反弹 vx 变负', t.getBall().vx < 0);
}

// ---------- bumper 碰撞加分 ----------
{
  const b0 = t.BUMPERS[0]; // {x:200, y:192, r:26}
  t.reset(); t.setScore(0);
  t.setBall({x:b0.x, y:b0.y+1, vx:0, vy:0});
  t.step();
  ok('撞 bumper 加分 (>=10)', t.getScore() >= 10);
  ok('撞 bumper 后被推出 (y 离开 bumper 中心)', Math.abs(t.getBall().y - b0.y) >= b0.r);
}

// ---------- 左挡板击球 ----------
{
  t.reset(); t.setLeft(true);
  t.setBall({x:t.FLIP_LX, y:t.FLIP_Y-20, vx:0, vy:5});
  t.step();
  ok('左挡板激活击球 vy 变负（向上）', t.getBall().vy < 0);
}
// ---------- 右挡板击球 ----------
{
  t.reset(); t.setRight(true);
  t.setBall({x:t.FLIP_RX, y:t.FLIP_Y-20, vx:0, vy:5});
  t.step();
  ok('右挡板激活击球 vy 变负（向上）', t.getBall().vy < 0);
}
// ---------- 挡板未激活不击球 ----------
{
  t.reset(); t.setLeft(false);
  t.setBall({x:t.FLIP_LX, y:t.FLIP_Y-20, vx:0, vy:5});
  t.step();
  ok('挡板未激活不击球 vy 仍向下', t.getBall().vy > 0);
}

// ---------- 失球 ----------
{
  t.reset(); t.setLives(3);
  t.setBall({x:200, y:t.H+t.BALL_R+5, vx:0, vy:0});
  t.step();
  eq('失球 lives-- (3→2)', t.getLives(), 2);
  ok('失球后球重置到顶部 (y<100)', t.getBall().y < 100);
}
// ---------- game over ----------
{
  t.reset(); t.setLives(1);
  t.setBall({x:200, y:t.H+t.BALL_R+5, vx:0, vy:0});
  t.step();
  eq('lives 耗尽 =0', t.getLives(), 0);
  ok('lives=0 即 over', t.isOver()===true);
}

// ---------- over 后 step 不动 ----------
{
  t.reset(); t.setLives(0); t.setOver && 0;
  // 直接构造 over：lives=0 但需 over=true。用失球路径已覆盖；这里验证 over 后 step 不改变球
  // 通过 setLives(1) 再失球触发 over 后，再 step 应无副作用
  t.reset(); t.setLives(1);
  t.setBall({x:200, y:t.H+t.BALL_R+5, vx:0, vy:0});
  t.step(); // over=true
  const y = t.getBall().y;
  t.step(); // over 后 step 直接 return
  eq('over 后球位置不变', t.getBall().y, y);
}

console.log('pinball: 全部断言通过');
