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

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nbreakout: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
