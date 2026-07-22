// 像素小鸟逻辑单测：拍翅、重力、管道碰撞、计分、死亡
const H = require('./harness');
const { t: T } = H.loadGame('../flappy.html');

// 1) 菜单态拍翅 → 进入游戏且获得向上初速
T.reset();
T.flap();
H.ok(T.getStatus() === 'play', 'flappy: 拍翅从菜单进入游戏');
H.ok(T.getState().bird.vy === T.FLAP && T.FLAP < 0, 'flappy: 拍翅给向上初速 vy=FLAP(<0)');

// 2) 重力把鸟往下拉
T.reset(); T.setStatus('play');
var by0 = T.getState().bird.y;
T.setBird(by0, 0);
T.step(0.1);
H.ok(T.getState().bird.y > by0, 'flappy: 重力使鸟下落 (y ' + by0.toFixed(1) + '→' + T.getState().bird.y.toFixed(1) + ')');

// 3) 撞上管道 → 碰撞判定为真
T.reset(); T.clearPipes(); T.setStatus('play');
var bx = T.getState().bird.x;
T.addPipe(bx, 300);            // 上管占据 0..300
T.setBird(100, 0);            // 鸟身在管内
H.ok(T.hits() === true, 'flappy: 鸟身陷管道 → 碰撞');

// 4) 处于间隙中央 → 不碰撞
T.reset(); T.clearPipes(); T.setStatus('play');
T.addPipe(bx, 300);           // 间隙 300..458
T.setBird(379, 0);            // 间隙中央
H.ok(T.hits() === false, 'flappy: 间隙中央 → 不碰撞');

// 5) 触地 → 碰撞
T.reset(); T.setStatus('play');
T.setBird(T.GROUND + 5, 0);
H.ok(T.hits() === true, 'flappy: 触地 → 碰撞');

// 6) 穿过管道计分 +1
T.reset(); T.clearPipes(); T.setStatus('play'); T.setScore(0);
T.addPipe(bx + T.PIPE_W + 4, 300);   // 鸟正前方
T.step(1.0);                          // 管道左移越过鸟
H.ok(T.getScore() === 1, 'flappy: 越过管道计分 +1 (score=' + T.getScore() + ')');

// 7) 撞地 → 状态变 dead
T.reset(); T.setStatus('play');
T.setBird(T.GROUND + 5, 0);
T.step(0.016);
H.ok(T.getStatus() === 'dead', 'flappy: 撞地 → 状态 dead');

// 8) 重置清空分数与管道
T.reset();
H.ok(T.getScore() === 0, 'flappy: 重置分数归零');
H.ok(T.getStatus() === 'menu', 'flappy: 重置回菜单');

// 9) 掉落-heart：拾取后额外命 +1
(() => {
  T.reset(); T.setStatus('play'); T.setLives(1);
  const b = T.getState().bird;
  T.spawnPickup('heart', b.x, b.y);
  T.stepPickups(0.016);
  H.eq('flappy 拾取heart命+1', T.getLives(), 2, '得到 ' + T.getLives());
  H.eq('flappy heart拾取后移除', T.getPickups().length, 0);
})();

// 10) 未碰撞不生效：道具远离鸟 → 分数不变、道具仍在
(() => {
  T.reset(); T.setStatus('play'); T.setScore(0);
  T.spawnPickup('gem', 10, 10); // 远离鸟(约 x96,y252)
  T.stepPickups(0.016);
  H.eq('flappy 未碰撞分数不变', T.getScore(), 0);
  H.eq('flappy 未碰撞道具仍在', T.getPickups().length, 1);
})();

// 11) 掉落-gem：拾取加分 +10
(() => {
  T.reset(); T.setStatus('play'); T.setScore(0);
  const b = T.getState().bird;
  T.spawnPickup('gem', b.x, b.y);
  T.stepPickups(0.016);
  H.eq('flappy 拾取gem分数+10', T.getScore(), 10, '得到 ' + T.getScore());
  H.eq('flappy gem拾取后移除', T.getPickups().length, 0);
})();

// 12) 掉落-rocket：拾取获得加速且加分 +5
(() => {
  T.reset(); T.setStatus('play'); T.setScore(0);
  const b = T.getState().bird;
  T.spawnPickup('rocket', b.x, b.y);
  T.stepPickups(0.016);
  H.ok('flappy 拾取rocket获得加速', T.getBoost() === true);
  H.eq('flappy 拾取rocket分数+5', T.getScore(), 5, '得到 ' + T.getScore());
})();

// 13) 护盾免死（heart 复活）：有额外命撞地后仍存活、扣 1 命
(() => {
  T.reset(); T.setStatus('play'); T.setLives(1);
  const b = T.getState().bird;
  T.spawnPickup('heart', b.x, b.y);
  T.stepPickups(0.016); // 命→2
  T.setBird(T.GROUND + 5, 0);
  T.step(0.016);          // 撞地 → 应复活
  H.ok('flappy 有额外命撞地仍存活', T.getStatus() === 'play');
  H.eq('flappy 复活后扣 1 命', T.getLives(), 1, '得到 ' + T.getLives());
})();

module.exports = {};
