// 贪吃蛇逻辑单测：移动、吃食增长计分、撞墙、撞自身、occupied、spawnFood 合法性
// + 道具系统：speed/shield/gem 拾取与效果（不破坏核心逻辑）
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

// 7) 道具-宝石：拾取后分数+5、长度+1、道具移除
(() => {
  t.reset();
  t.setSnake([{ x: 5, y: 5 }]);
  t.setDir(1, 0);
  t.setFood({ x: 0, y: 0 });
  t.setPowerups([{ x: 6, y: 5, type: 'gem' }]);
  const before = t.getScore();
  t.step();
  H.eq('蛇 拾取宝石分数+5', t.getScore(), before + 5, '得到 ' + t.getScore());
  H.eq('蛇 拾取宝石后长度=2（增长）', t.getSnake().length, 2);
  H.eq('蛇 宝石已移除', t.getPowerups().length, 0);
})();

// 8) 道具-护盾：拾取后 getShield=true；无护盾时撞墙仍结束
(() => {
  t.reset();
  t.setSnake([{ x: 5, y: 5 }]);
  t.setDir(1, 0);
  t.setFood({ x: 0, y: 0 });
  t.setPowerups([{ x: 6, y: 5, type: 'shield' }]);
  t.step();
  H.ok('蛇 拾取护盾 getShield=true', t.getShield() === true);
  // 无护盾再撞墙
  t.reset();
  t.setSnake([{ x: G - 1, y: 5 }]);
  t.setDir(1, 0);
  t.setFood({ x: 0, y: 0 });
  t.step();
  H.ok('蛇 无护盾撞墙仍结束', t.getAlive() === false);
})();

// 9) 道具-加速：拾取后 getBoost=true
(() => {
  t.reset();
  t.setSnake([{ x: 5, y: 5 }]);
  t.setDir(1, 0);
  t.setFood({ x: 0, y: 0 });
  t.setPowerups([{ x: 6, y: 5, type: 'speed' }]);
  t.step();
  H.ok('蛇 拾取加速 getBoost=true', t.getBoost() === true);
})();

// 10) applyPower 直接调用：gem 返回 true（增长），speed/shield 返回 false
(() => {
  t.reset();
  t.setFood({ x: 0, y: 0 });
  H.ok('蛇 applyPower(gem) 返回 true', t.applyPower('gem', 1, 1) === true);
  H.ok('蛇 applyPower(speed) 返回 false', t.applyPower('speed', 1, 1) === false);
  H.ok('蛇 applyPower(shield) 返回 false', t.applyPower('shield', 1, 1) === false);
})();
