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
