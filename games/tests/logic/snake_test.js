// 贪吃蛇逻辑单测：移动、吃食增长计分、撞墙、撞自身、occupied、spawnFood 合法性
const H = require('./harness');
const { t } = H.loadGame('../snake.html');
const G = t.GRID;

function head() { return t.getSnake()[0]; }

// 1) 普通移动：无食物时头前移一格，长度与分数不变
(() => {
  t.reset();
  t.setSnake([{ x: 5, y: 5 }]);   // 长度1，允许任意方向
  t.setDir(1, 0);                  // 向右
  t.setFood({ x: 0, y: 0 });      // 远离
  t.step();
  H.eq('蛇 向右移动头到 (6,5)', [head().x, head().y], [6, 5]);
  H.eq('蛇 未吃食分数=0', t.getScore(), 0);
  H.eq('蛇 长度仍为1', t.getSnake().length, 1);
})();

// 2) 吃食：头移到食物格 → 分数+1、长度+1
(() => {
  t.reset();
  t.setSnake([{ x: 5, y: 5 }]);
  t.setDir(1, 0);
  t.setFood({ x: 6, y: 5 });
  t.step();
  H.eq('蛇 吃食分数=1', t.getScore(), 1);
  H.eq('蛇 吃食后长度=2', t.getSnake().length, 2);
})();

// 3) 撞墙：贴右边界再向右 → alive=false
(() => {
  t.reset();
  t.setSnake([{ x: G - 1, y: 5 }]);
  t.setDir(1, 0);
  t.setFood({ x: 0, y: 0 });
  t.step();
  H.ok('蛇 撞墙 alive=false', t.getAlive() === false);
})();

// 4) 撞自身：头向右撞到身体 → alive=false
(() => {
  t.reset();
  t.setSnake([{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }]);
  t.setDir(1, 0);
  t.setFood({ x: 0, y: 0 });
  t.step();
  H.ok('蛇 撞自身 alive=false', t.getAlive() === false);
})();

// 5) occupied：身体格为 true，空格为 false
(() => {
  t.reset();
  t.setSnake([{ x: 5, y: 5 }, { x: 6, y: 5 }]);
  H.ok('蛇 occupied 身体格=true', t.occupied(5, 5) === true);
  H.ok('蛇 occupied 空格=false', t.occupied(7, 7) === false);
})();

// 6) spawnFood：生成的食物不在蛇身上
(() => {
  t.reset();
  t.setSnake([{ x: 5, y: 5 }, { x: 6, y: 5 }]);
  t.setFood(null);
  t.spawnFood();
  const f = t.getFood();
  H.ok('蛇 spawnFood 非空', f !== null);
  H.ok('蛇 spawnFood 不在蛇身', f ? t.occupied(f.x, f.y) === false : false);
})();
