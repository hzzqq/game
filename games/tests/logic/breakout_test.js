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

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nbreakout: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
