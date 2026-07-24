// 贪吃蛇对战逻辑单测：初始状态、双人相向对撞能在有限步内分出胜负
const H = require('./harness');
const { t } = H.loadGame('../snakebattle.html');

(() => {
  t.reset();
  let s = t.getState();
  H.eq('蛇战 双方初始长度3', [s.p1.len, s.p2.len], [3, 3]);
  H.ok('蛇战 双方初始存活', s.p1.alive && s.p2.alive);

  t.setDir(1, 1, 0); t.setDir(2, -1, 0); // 红向右、绿向左，正面相撞
  let steps = 0;
  while (steps < 60 && !t.getState().gameOver) { t.tick(); steps++; }
  H.ok('蛇战 60 步内分出胜负', steps < 60, 'steps=' + steps);
})();

// 7) 掉落生效：red 头移到 gem 格 → 该玩家 score+5、道具移除
(() => {
  t.reset();
  t.setScore(1, 0);
  t.spawnPickup('gem', 5, 10);
  t.setSnake(1, [{x:4,y:10},{x:3,y:10},{x:2,y:10}]);
  t.setDir(1, 1, 0);
  t.tick();
  H.eq('蛇战 拾取gem玩家score+5', t.getScore(1), 5, '得到 ' + t.getScore(1));
  H.eq('蛇战 gem拾取后移除', t.getPickups().length, 0);
})();

// 8) 未碰撞不生效：gem 不在 red 行进格上 → score 不变、道具仍在
(() => {
  t.reset();
  t.setScore(1, 0);
  t.spawnPickup('gem', 5, 10);
  t.setSnake(1, [{x:4,y:12},{x:3,y:12},{x:2,y:12}]);
  t.setDir(1, 1, 0);
  t.tick();
  H.eq('蛇战 未碰撞score不变', t.getScore(1), 0);
  H.eq('蛇战 未碰撞道具仍在', t.getPickups().length, 1);
})();

// 9) 护盾免死：red 持盾撞墙 → 仍存活、护盾消耗
(() => {
  t.reset();
  t.setShield(1, true);
  t.setSnake(1, [{x:t.GRID-1,y:5},{x:t.GRID-2,y:5},{x:t.GRID-3,y:5}]);
  t.setDir(1, 1, 0); // 向右出界
  t.tick();
  H.ok('蛇战 持盾撞墙仍存活', t.getState().p1.alive === true);
  H.ok('蛇战 护盾已消耗', t.getShield(1) === false);
})();

// 10) 无盾撞墙即死（扣血至 0 → 淘汰）
(() => {
  t.reset();
  t.setSnake(1, [{x:t.GRID-1,y:5},{x:t.GRID-2,y:5},{x:t.GRID-3,y:5}]);
  t.setDir(1, 1, 0);
  t.tick();
  H.ok('蛇战 无盾撞墙被淘汰', t.getState().p1.alive === false);
})();

// 11) heart 额外命：拾取后 lives+1
(() => {
  t.reset();
  t.setLives(1, 1);
  t.spawnPickup('heart', 5, 10);
  t.setSnake(1, [{x:4,y:10},{x:3,y:10},{x:2,y:10}]);
  t.setDir(1, 1, 0);
  t.tick();
  H.eq('蛇战 拾取heart命+1', t.getLives(1), 2, '得到 ' + t.getLives(1));
})();

// 12) speed 加速增益：拾取后 getBoost 为真
(() => {
  t.reset();
  t.spawnPickup('speed', 5, 10);
  t.setSnake(1, [{x:4,y:10},{x:3,y:10},{x:2,y:10}]);
  t.setDir(1, 1, 0);
  t.tick();
  H.ok('蛇战 拾取speed获得加速', t.getBoost(1) === true);
})();

// 13) 胜利彩带：一方被淘汰 → confettiFired 置真（只读锁，独立于 Juice）
t.reset();
H.ok(t.confettiFired() === false, 'snakebattle: 胜利前 confettiFired 为 false');
t.win();
H.ok(t.confettiFired() === true, 'snakebattle: 一方被淘汰(P1胜) → confettiFired 为真');
H.ok(t.getState().gameOver === true, 'snakebattle: win() 进入结束态');

// 14) 重置后锁复位
t.reset();
H.ok(t.confettiFired() === false, 'snakebattle: 重置后 confettiFired 复位');

const total = H.results.length;
const pass = H.results.filter(r => r.pass).length;
console.log(`\nsnakebattle: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

module.exports = {};

