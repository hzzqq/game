// 像素小鸟逻辑单测：拍翅、重力、管道碰撞、计分、死亡
const H = require('./harness');
const { t: T } = H.loadGame('../flappy.html');

// 1) 菜单态拍翅 → 进入游戏且获得向上初速
T.reset();
T.flap();
H.ok('flappy: 拍翅从菜单进入游戏', T.getStatus() === 'play');
H.ok('flappy: 拍翅给向上初速 vy=FLAP(<0)', T.getState().bird.vy === T.FLAP && T.FLAP < 0);

// 2) 重力把鸟往下拉
T.reset(); T.setStatus('play');
var by0 = T.getState().bird.y;
T.setBird(by0, 0);
T.step(0.1);
H.ok('flappy: 重力使鸟下落 (y ' + by0.toFixed(1) + '→' + T.getState().bird.y.toFixed(1) + ')', T.getState().bird.y > by0);

// 3) 撞上管道 → 碰撞判定为真
T.reset(); T.clearPipes(); T.setStatus('play');
var bx = T.getState().bird.x;
T.addPipe(bx, 300);            // 上管占据 0..300
T.setBird(100, 0);            // 鸟身在管内
H.ok('flappy: 鸟身陷管道 → 碰撞', T.hits() === true);

// 4) 处于间隙中央 → 不碰撞
T.reset(); T.clearPipes(); T.setStatus('play');
T.addPipe(bx, 300);           // 间隙 300..458
T.setBird(379, 0);            // 间隙中央
H.ok('flappy: 间隙中央 → 不碰撞', T.hits() === false);

// 5) 触地 → 碰撞
T.reset(); T.setStatus('play');
T.setBird(T.GROUND + 5, 0);
H.ok('flappy: 触地 → 碰撞', T.hits() === true);

// 6) 穿过管道计分 +1
T.reset(); T.clearPipes(); T.setStatus('play'); T.setScore(0);
T.addPipe(bx + T.PIPE_W + 4, 300);   // 鸟正前方
T.step(1.0);                          // 管道左移越过鸟
H.ok('flappy: 越过管道计分 +1 (score=' + T.getScore() + ')', T.getScore() === 1);

// 7) 撞地 → 状态变 dead
T.reset(); T.setStatus('play');
T.setBird(T.GROUND + 5, 0);
T.step(0.016);
H.ok('flappy: 撞地 → 状态 dead', T.getStatus() === 'dead');

// 8) 重置清空分数与管道
T.reset();
H.ok('flappy: 重置分数归零', T.getScore() === 0);
H.ok('flappy: 重置回菜单', T.getStatus() === 'menu');

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

// N) 难度系统：4 档 + 普通档基线不变
(() => {
  H.ok('flappy DIFFICULTY 4 档', ['easy','normal','hard','hell'].every(k => T.DIFFICULTY[k]));
  H.eq('flappy normal gapMult=1', T.DIFFICULTY.normal.gapMult, 1.0);
  H.eq('flappy normal spdMult=1', T.DIFFICULTY.normal.spdMult, 1.0);
})();

// N+1) setDifficulty 合法/非法 + getDifficulty
(() => {
  H.ok('flappy setDifficulty hell 合法', T.setDifficulty('hell') === true);
  H.eq('flappy getDifficulty=hell', T.getDifficulty(), 'hell');
  H.ok('flappy setDifficulty 非法 false', T.setDifficulty('nope') === false);
  H.eq('flappy 非法后仍 hell', T.getDifficulty(), 'hell');
  T.setDifficulty('normal');
})();

// N+2) 普通档 reset 后间隙=基准158、速度=155（保基线）
(() => {
  T.setDifficulty('normal'); T.reset();
  H.eq('flappy normal 间隙=158', T.getGap(), 158);
  H.eq('flappy normal 速度=155', T.getPipeSpd(), 155);
})();

// N+3) 地狱档间隙更小、速度更快；简单档相反
(() => {
  T.setDifficulty('easy'); T.reset();
  const easyGap = T.getGap(), easySpd = T.getPipeSpd();
  T.setDifficulty('hell'); T.reset();
  const hellGap = T.getGap(), hellSpd = T.getPipeSpd();
  H.ok('flappy 地狱间隙 < 简单间隙', hellGap < easyGap);
  H.ok('flappy 地狱速度 > 简单速度', hellSpd > easySpd);
  T.setDifficulty('normal'); T.reset();
})();

// ===== 成就正反馈：破最高分触发 confetti（纯视觉层，不改死亡/计分）=====
(() => {
  T.reset(); T.setStatus('play'); T.setScore(5);
  T.setBird(T.GROUND + 5, 0);
  T.step(0.016); // 撞地 → dead，score=5 > best(0) 破纪录
  H.eq('flappy 破最高分触发 confettiFired', T.confettiFired(), true);
  // 边界：平纪录(0)不触发
  T.reset(); T.setStatus('play'); T.setScore(0);
  T.setBird(T.GROUND + 5, 0);
  T.step(0.016);
  H.eq('flappy 平纪录(0)不触发 confettiFired', T.confettiFired(), false);
})();

// ===== 手感深化：过 10 管里程碑 shake+burst；破纪录 shake =====
T.reset(); T.setStatus('play'); T.setScore(9);
H.ok('flappy: 初始 fx 计数为 0', T.fxShakes() === 0 && T.fxBursts() === 0);
const birdX = T.getState().bird.x;
T.addPipe(birdX - T.PIPE_W - 1, 200);  // 刚好飞过鸟身后(计分线在鸟左侧)
T.step(0.05);
H.ok('flappy: 过10管里程碑触发 shake', T.fxShakes() > 0);
H.ok('flappy: 过10管里程碑触发 burst', T.fxBursts() > 0);
// 破纪录触发 shake
T.reset(); T.setStatus('play'); T.setScore(T.getBest() + 5); // 前置测试已抬高 best，必须真破纪录才触发
T.setBird(T.GROUND + 5, 0);
T.step(0.016); // 撞地 dead，score>best 破纪录
H.ok('flappy: 破纪录触发 shake', T.fxShakes() > 0);
// 重置归零
T.reset();
H.ok('flappy: 重置后 fx 归零', T.fxShakes() === 0 && T.fxBursts() === 0);

// ===== T-127：本地 Top5 排行榜（Common.HighScores 数据层）=====
(() => {
  H.ok('flappy 排行榜 清空成功', T.clearTop5() === true);
  H.ok('flappy 排行榜 0 分不入榜', T.recordScore(0) === 0);
  H.ok('flappy 排行榜 空榜无记录', T.getTop5().length === 0);
  H.ok('flappy 排行榜 9999 上榜第 1', T.recordScore(9999) === 1);
  H.ok('flappy 排行榜 榜首=9999', T.getTop5()[0].score === 9999);
  H.ok('flappy 排行榜 8888 上榜第 2', T.recordScore(8888) === 2);
  for (let i = 0; i < 6; i++) T.recordScore(10000 + i);
  H.ok('flappy 排行榜 最多保留 5 条', T.getTop5().length === 5);
  H.ok('flappy 排行榜 截断后榜首仍最大', T.getTop5()[0].score === 10005);
  T.clearTop5();
  H.ok('flappy 排行榜 收尾清空', T.getTop5().length === 0);
})();

module.exports = {};
