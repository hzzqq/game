const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../arkanoid.html');

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

// 3. buildLevel level=7 → rows 封顶 9 → 90
t.setLevel(7); t.buildLevel();
eq('level=7 → 90 砖块', t.getBricks().length, 90);

// 4. level=20 → rows 封顶 9 → 90
t.setLevel(20); t.buildLevel();
eq('level=20 封顶 → 90 砖块', t.getBricks().length, 90);

// 5. startGame 重置一切
t.setLevel(5); t.setScore(999); t.setLives(1);
t.startGame();
eq('startGame 重置 level=1', t.getLevel(), 1);
eq('startGame 重置 lives=3', t.getLives(), 3);
eq('startGame 重置 score=0', t.getScore(), 0);
eq('startGame 重置 40砖', t.getBricks().length, 40);
eq('startGame 清空掉落物', t.getPickups().length, 0);

// 6. 道具类型 = 🔴多球 / 🟦加长挡板 / 🐢慢速球
eq('道具类型集合', t.getPickupTypes().sort(), ['expand','multiball','slow']);

// 7. applyPickup('expand') → paddle.w = baseW*1.5 = 165, wideUntil=now+12000
t.startGame();
t.setNow(10000);
t.applyPickup('expand');
eq('expand 后 paddle.w=165', t.getPaddle().w, 165);
eq('expand 后 wideUntil=22000', t.getWideUntil(), 22000);

// 8. applyPickup('slow') → slowUntil = now+8000
t.startGame();
t.setNow(10000);
t.applyPickup('slow');
eq('slow 后 slowUntil=18000', t.getSlowUntil(), 18000);

// 9. applyPickup('multiball') → 球增加（上限 6）
t.startGame(); // 1 球（吸附）
t.setBalls([{x:100,y:200,vx:3,vy:-3,stuck:false}]);
t.applyPickup('multiball');
eq('multiball 1→3', t.getBalls().length, 3);
t.setBalls([
  {x:100,y:200,vx:3,vy:-3,stuck:false},
  {x:100,y:200,vx:-3,vy:-3,stuck:false},
  {x:100,y:200,vx:3,vy:3,stuck:false}
]);
t.applyPickup('multiball');
eq('multiball 3→6', t.getBalls().length, 6);
t.applyPickup('multiball');
eq('multiball 上限 6', t.getBalls().length, 6);

// 10. 道具系统：挡板接住掉落物（拾取生效 + 移除）
t.startGame();
const pad = t.getPaddle();
const px = pad.x + pad.w/2, py = pad.y;
// 10a 多球胶囊落在挡板上 → 接住后生成多球且移除
t.setBalls([{x:100,y:200,vx:3,vy:-3,stuck:false}]);
t.spawnPickup('multiball', px, py);
eq('胶囊: 生成后 1 个', t.getPickups().length, 1);
t.stepPickups(0.001);
eq('胶囊: 接住后移除', t.getPickups().length, 0);
ok('胶囊: 多球接住生效(球变多)', t.getBalls().length >= 3);
// 10b 加长胶囊落在挡板上 → 接住后 paddle 变长且移除
t.startGame();
const pad2 = t.getPaddle();
t.spawnPickup('expand', pad2.x + pad2.w/2, pad2.y);
t.stepPickups(0.001);
eq('胶囊: 加长接住后移除', t.getPickups().length, 0);
eq('胶囊: 加长接住生效 w=165', t.getPaddle().w, 165);

// 11. 远处胶囊不拾取（保留 + 不生效）
t.startGame();
t.spawnPickup('slow', 10, 10);
t.stepPickups(0.001);
eq('胶囊: 远处未拾取仍保留', t.getPickups().length, 1);
eq('胶囊: 远处未触发慢速(slowUntil=0)', t.getSlowUntil(), 0);

// 12. 砖块击碎掉落概率：setRand 控制 _rng 验证 maybeDrop
t.startGame();
t.setRand(() => 0.99);          // 0.99 < 0.18 不成立 → 不掉落
t.maybeDrop(100, 100);
eq('掉落: 高随机数不掉落', t.getPickups().length, 0);
t.setRand(() => 0);             // 0 < 0.18 且 type=floor(0)=0 → multiball
t.maybeDrop(100, 100);
eq('掉落: 低随机数掉落 1', t.getPickups().length, 1);
eq('掉落: 掉落类型为三选一', t.getPickupTypes().indexOf(t.getPickups()[0].type) >= 0, true);
t.setRand(() => 0.5);           // 恢复为普通分散随机

// 13. 难度系统：4 档 + 普通档基线不变
ok('DIFFICULTY 4 档', ['easy','normal','hard','hell'].every(k => t.DIFFICULTY[k]));
eq('normal spdMult=1', t.DIFFICULTY.normal.spdMult, 1.0);
eq('normal rowBonus=0', t.DIFFICULTY.normal.rowBonus, 0);

// 14. setDifficulty 合法/非法 + getDifficulty
ok('setDifficulty hell 合法', t.setDifficulty('hell') === true);
eq('getDifficulty=hell', t.getDifficulty(), 'hell');
ok('setDifficulty 非法 false', t.setDifficulty('bad') === false);
eq('非法后仍 hell', t.getDifficulty(), 'hell');
t.setDifficulty('normal');

// 15. 普通档 level=1 仍 40 砖块（保基线）
t.setDifficulty('normal'); t.setLevel(1); t.buildLevel();
eq('normal level=1 → 40 砖块', t.getBricks().length, 40);

// 16. 地狱档同 level 砖块更多（rowBonus 生效）
t.setDifficulty('hell'); t.setLevel(1); t.buildLevel();
ok('地狱 level=1 砖块 > 40', t.getBricks().length > 40);
t.setDifficulty('normal'); t.buildLevel();

// 17. 地狱档球速倍率 > 简单档（targetSpeed 应用 spdMult）
t.setDifficulty('easy'); t.setLevel(1); t.setNow(0);
const easySpd = t.targetSpeed();
t.setDifficulty('hell'); t.setLevel(1); t.setNow(0);
const hellSpd = t.targetSpeed();
ok('地狱档球速 > 简单档', hellSpd > easySpd);
t.setDifficulty('normal');

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\narkanoid: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
