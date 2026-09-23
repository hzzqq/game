const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../breakout.html');

// 1. boot 后 buildLevel(level=1): rows=4, cols=10 → 40 砖块
const b0 = t.getBricks();
eq('boot 后 40 砖块', b0.length, 40);
eq('boot 后全 alive', b0.every(b => b.alive), true);
eq('boot 后 level=1', t.getLevel(), 1);
eq('boot 后 score=0', t.getScore(), 0);
eq('boot 后 lives=3', t.getLives(), 3);
eq('boot 后 state=menu', t.getState(), 'menu');

// 2. buildLevel level=2 → rows=5 → 50
t.setLevel(2); t.buildLevel();
eq('level=2 → 50 砖块', t.getBricks().length, 50);

// 3. buildLevel level=7 → rows=min(10,9)=9 → 90
t.setLevel(7); t.buildLevel();
eq('level=7 → 90 砖块', t.getBricks().length, 90);

// 4. level=20 → rows 封顶 9 → 90
t.setLevel(20); t.buildLevel();
eq('level=20 封顶 → 90 砖块', t.getBricks().length, 90);

// 5. applyPower('wide') → paddle.w = baseW*1.5 = 165, wideUntil=now+12000
t.startGame();
t.setNow(10000);
t.applyPower('wide');
eq('wide 后 paddle.w=165', t.getPaddle().w, 165);
eq('wide 后 wideUntil=22000', t.getWideUntil(), 22000);

// 6. applyPower('slow') → slowUntil = now+8000
t.setNow(10000);
t.applyPower('slow');
eq('slow 后 slowUntil=18000', t.getSlowUntil(), 18000);

// 7. applyPower('heart') → lives+1（上限5）
t.startGame(); // lives=3
t.applyPower('heart');
eq('heart 后 lives=4', t.getLives(), 4);
t.applyPower('heart');
eq('heart 后 lives=5', t.getLives(), 5);
t.applyPower('heart');
eq('heart 上限 5', t.getLives(), 5);

// 8. applyPower('multi') → 球翻倍（上限6）
t.startGame();
t.setBalls([{x:100,y:200,vx:3,vy:-3,stuck:false}]);
t.applyPower('multi');
eq('multi 1→2', t.getBalls().length, 2);
t.setBalls([{x:100,y:200,vx:3,vy:-3,stuck:false},{x:100,y:200,vx:-3,vy:-3,stuck:false},{x:100,y:200,vx:3,vy:3,stuck:false}]);
t.applyPower('multi');
eq('multi 3→6', t.getBalls().length, 6);
t.applyPower('multi');
eq('multi 上限 6', t.getBalls().length, 6);

// 9. applyPower('bomb') → 清最底2行（level=1 rows=4，底2行=20砖）
t.startGame();
t.applyPower('bomb');
const afterBomb = t.getBricks();
eq('bomb 清除 20 砖', afterBomb.filter(b => !b.alive).length, 20);
eq('bomb 后 20 alive', afterBomb.filter(b => b.alive).length, 20);

// 10. makeBall
eq('makeBall(true) stuck', t.makeBall(true).stuck, true);
eq('makeBall(false) !stuck', t.makeBall(false).stuck, false);

// 11. clamp 工具
eq('clamp(5,0,10)=5', t.clamp(5,0,10), 5);
eq('clamp(-1,0,10)=0', t.clamp(-1,0,10), 0);
eq('clamp(11,0,10)=10', t.clamp(11,0,10), 10);

// 12. startGame 重置一切
t.setLevel(5); t.setScore(999); t.setLives(1);
t.startGame();
eq('startGame 重置 level=1', t.getLevel(), 1);
eq('startGame 重置 lives=3', t.getLives(), 3);
eq('startGame 重置 score=0', t.getScore(), 0);
eq('startGame 重置 40砖', t.getBricks().length, 40);

// 13. 注入：能量胶囊系统（确定性，不破坏核心玩法）
t.startGame();
const pad = t.getPaddle();
const px = pad.x + pad.w/2, py = pad.y;
// 13a 护盾掉落生效 + 拾取后移除
t.spawnPickup('shield', px, py);
t.stepPickups(0.001);
ok('胶囊: 护盾拾取 getShield true', t.getShield() === true);
eq('胶囊: 护盾拾取后移除', t.getPickups().length, 0);
// 13b 加速掉落生效
t.spawnPickup('boost', px, py);
t.stepPickups(0.001);
ok('胶囊: 加速拾取 getBoost>0', t.getBoost() > 0);
// 13c 未碰撞不生效（远处胶囊保留且不触发）
t.spawnPickup('boost', 10, 10);
t.stepPickups(0.001);
eq('胶囊: 远处未拾取仍保留', t.getPickups().length, 1);
eq('胶囊: 远处未触发加速变化', t.getBoost(), 6);
// 13d 护盾免死
t.setShield(true); t.setPLives(3);
t.takeHit(1);
eq('胶囊: 护盾免死 shield 被消耗', t.getShield(), false);
eq('胶囊: 护盾免死 PLives 不变', t.getPLives(), 3);
// 13e 无盾扣血
t.setShield(false); t.setPLives(3);
t.takeHit(1);
eq('胶囊: 无盾扣血 PLives-1', t.getPLives(), 2);
// 13f 炸行：清掉最底行
t.startGame();
let aliveBefore = t.getBricks().filter(b=>b.alive).length;
t.applyPickup('bomb');
let aliveAfter = t.getBricks().filter(b=>b.alive).length;
ok('胶囊: 炸行清除至少一行砖', aliveAfter < aliveBefore);

// 14. 难度系统：4 档 + 普通档基线不变
ok('DIFFICULTY 4 档', ['easy','normal','hard','hell'].every(k => t.DIFFICULTY[k]));
eq('normal spdMult=1', t.DIFFICULTY.normal.spdMult, 1.0);
eq('normal rowBonus=0', t.DIFFICULTY.normal.rowBonus, 0);

// 15. setDifficulty 合法/非法 + getDifficulty
ok('setDifficulty hell 合法', t.setDifficulty('hell') === true);
eq('getDifficulty=hell', t.getDifficulty(), 'hell');
ok('setDifficulty 非法 false', t.setDifficulty('bad') === false);
eq('非法后仍 hell', t.getDifficulty(), 'hell');
t.setDifficulty('normal');

// 16. 普通档 level=1 仍 40 砖块（保基线）
t.setDifficulty('normal'); t.setLevel(1); t.buildLevel();
eq('normal level=1 → 40 砖块', t.getBricks().length, 40);

// 17. 地狱档同 level 砖块更多（rowBonus 生效）
t.setDifficulty('hell'); t.setLevel(1); t.buildLevel();
ok('地狱 level=1 砖块 > 40', t.getBricks().length > 40);
t.setDifficulty('normal'); t.buildLevel();

// 18. 地狱档球速倍率 > 简单档（targetSpeed 应用 spdMult）
t.setDifficulty('easy'); t.setLevel(1); t.setNow(0);
const easySpd = t.targetSpeed();
t.setDifficulty('hell'); t.setLevel(1); t.setNow(0);
const hellSpd = t.targetSpeed();
ok('地狱档球速 > 简单档', hellSpd > easySpd);
t.setDifficulty('normal');

// 19. 建模精细化（仅绘制层：描边/高光/渐变）不破坏任何逻辑状态
t.startGame();
const bScore = t.getScore(), bLives = t.getLives(), bState = t.getState(), bBricks = t.getBricks().length;
t.render(); // 仅绘制，不应改动任何逻辑状态
eq('建模 渲染后 score 不变', t.getScore(), bScore);
eq('建模 渲染后 lives 不变', t.getLives(), bLives);
eq('建模 渲染后 state 不变', t.getState(), bState);
eq('建模 渲染后 砖块数不变', t.getBricks().length, bBricks);

// 20. 通关（清屏）触发 confetti：setBricks([]) + launch + update 进入 levelcomplete，confettiFired 为真
t.startGame();
t.setBricks([]);                 // 直接清空所有砖块（仅用于驱动视觉反馈判定）
ok('通关前 confettiFired 为 false', t.confettiFired() === false);
t.launch();
t.update(0.016);
eq('通关 → state=levelcomplete', t.getState(), 'levelcomplete');
ok('通关 → confettiFired 为真', t.confettiFired() === true);

// ---------- 手感深化：通关屏震 / 粒子计数器（只读钩子，不改动玩法）----------
(function(){
  t.startGame();
  eq('手感: 新局 fxShakes=0', t.fxShakes(), 0);
  eq('手感: 新局 fxBursts=0', t.fxBursts(), 0);

  t.setBricks([]);                 // 清空所有砖块（仅驱动视觉反馈判定）
  t.launch();
  t.update(0.016);
  ok('手感: 通关触发 fxShakes>0', t.fxShakes() > 0);
  ok('手感: 通关触发 fxBursts>0', t.fxBursts() > 0);

  t.startGame();
  eq('手感: 重开 fxShakes=0', t.fxShakes(), 0);
  eq('手感: 重开 fxBursts=0', t.fxBursts(), 0);
})();


// 汇总
// ===== T-119：本地 Top5 排行榜（Common.HighScores 数据层）=====
(() => {
  ok('breakout 排行榜 清空成功', t.clearTop5() === true);
  eq('breakout 排行榜 0 分不入榜', t.recordScore(0), 0);
  eq('breakout 排行榜 空榜无记录', t.getTop5().length, 0);
  eq('breakout 排行榜 9999 上榜第 1', t.recordScore(9999), 1);
  eq('breakout 排行榜 榜首=9999', t.getTop5()[0].score, 9999);
  eq('breakout 排行榜 8888 上榜第 2', t.recordScore(8888), 2);
  const top = t.getTop5();
  let sorted = true;
  for (let i = 1; i < top.length; i++) if (top[i - 1].score < top[i].score) sorted = false;
  ok('breakout 排行榜 全列表分数降序', sorted);
  ok('breakout 排行榜 条目含日期字段', /^\d{4}-\d{2}-\d{2}$/.test(top[0].date));
  for (let i = 0; i < 6; i++) t.recordScore(10000 + i);
  eq('breakout 排行榜 最多保留 5 条', t.getTop5().length, 5);
  eq('breakout 排行榜 截断后榜首仍最大', t.getTop5()[0].score, 10005);
  t.clearTop5();
  eq('breakout 排行榜 收尾清空', t.getTop5().length, 0);
})();

   const total = results.length;
// ===== T-178 反弹与生命判负（mutation 缺口：顶墙/挡板反弹与 lives<=0 此前无锁）=====
(() => {
  t.reset();                          // startGame → ready
  t.launch();                         // 发射 → playing
  ok('breakout launch 后进入 playing', t.getState() === 'playing');
  let b = t.getBalls()[0];
  let up = b.vy < 0, hitTop = false;
  for (let i = 0; i < 200 && up; i++) { t.update(0.016); b = t.getBalls()[0]; if (b.vy > 0) { hitTop = true; break; } }
  ok('breakout 顶墙反弹 (vy 翻正下落)', hitTop);
  const pd = t.getPaddle();
  t.setBalls([{ x: pd.x + 20, y: pd.y - 4, vx: 0, vy: 4, stuck: false }]); // 下落近挡板
  t.update(0.016);
  ok('breakout 球触挡板反弹 (vy 翻负)', t.getBalls()[0].vy < 0);
  t.setLives(1);
  t.setBalls([{ x: 5, y: 5, vx: 0, vy: 6, stuck: false }]);   // 左上角落下，远离挡板
  let guard = 0;
  while (t.getState() !== 'gameover' && guard++ < 400) t.update(0.016);
  ok('breakout 生命耗尽 gameover', t.getState() === 'gameover' && t.getLives() === 0);
})();

const pass = results.filter(r => r.pass).length;
console.log(`\nbreakout: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
