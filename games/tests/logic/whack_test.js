// whack.html（打地鼠）逻辑单测
// 覆盖：常量/TYPES、pickHole(全空/全占用)、pickType(合法/权重)、upDuration/currentSpawnInterval(难度递增)、
// whack(打中normal/gold/bomb/连击加成/连击上限/打空/非up状态/未开始)、
// holePos/holeCenter(9洞位置)、update(状态机推进rising→up→falling→empty/time递减/spawn)、
// startGame(重置)、endGame(best更新)
const { loadGame, ok, eq, results } = require('./harness');

const t = loadGame('../whack.html').t;

// ===== 1. 常量 =====
eq('HOLES=9', t.HOLES, 9);
eq('COLS=3', t.COLS, 3);
eq('ROWS=3', t.ROWS, 3);
eq('GAME_TIME=30', t.GAME_TIME, 30);

// ===== 2. TYPES =====
eq('TYPES 3 种', Object.keys(t.TYPES).length, 3);
ok('normal 在列', 'normal' in t.TYPES);
ok('gold 在列', 'gold' in t.TYPES);
ok('bomb 在列', 'bomb' in t.TYPES);
eq('normal.score=10', t.TYPES.normal.score, 10);
eq('normal.weight=70', t.TYPES.normal.weight, 70);
eq('gold.score=30', t.TYPES.gold.score, 30);
eq('gold.weight=15', t.TYPES.gold.weight, 15);
eq('bomb.score=-20', t.TYPES.bomb.score, -20);
eq('bomb.weight=15', t.TYPES.bomb.weight, 15);

// ===== 3. pickHole =====
t.startGame();
const idx = t.pickHole();
ok('全空 pickHole 返回 [0,8]', idx >= 0 && idx <= 8);
// 全占用
const allUp = [];
for (let i = 0; i < 9; i++) allUp.push({ state: 'up', timer: 0, type: 'normal', popT: 1 });
t.setHoles(allUp);
eq('全占用 pickHole 返回 -1', t.pickHole(), -1);
t.startGame();

// ===== 4. pickType =====
for (let i = 0; i < 100; i++) {
  const k = t.pickType();
  ok('pickType 合法 #' + i, k === 'normal' || k === 'gold' || k === 'bomb');
}
// 权重大样本：normal 应占多数
let nCount = 0, gCount = 0, bCount = 0;
for (let i = 0; i < 1000; i++) {
  const k = t.pickType();
  if (k === 'normal') nCount++;
  else if (k === 'gold') gCount++;
  else bCount++;
}
ok('normal 占多数', nCount > gCount && nCount > bCount);
ok('gold 和 bomb 接近', Math.abs(gCount - bCount) < 80);

// ===== 5. upDuration / currentSpawnInterval 难度递增 =====
t.setGameTime(0);
ok('upDuration t=0 约 1.4', Math.abs(t.upDuration() - 1.4) < 0.01);
t.setGameTime(10);
ok('upDuration t=10 约 1.1', Math.abs(t.upDuration() - 1.1) < 0.01);
t.setGameTime(30);
ok('upDuration t=30 钳制 0.55', Math.abs(t.upDuration() - 0.55) < 0.01);
t.setGameTime(100);
ok('upDuration t=100 不低于 0.55', t.upDuration() >= 0.55);

t.setGameTime(0);
ok('spawnInterval t=0 约 1.2', Math.abs(t.currentSpawnInterval() - 1.2) < 0.01);
t.setGameTime(30);
ok('spawnInterval t=30 约 0.45', Math.abs(t.currentSpawnInterval() - 0.45) < 0.01);
t.setGameTime(100);
ok('spawnInterval t=100 不低于 0.45', t.currentSpawnInterval() >= 0.45);
t.setGameTime(0);

// ===== 6. whack =====
// 打中 normal +10
t.startGame();
t.getHoles()[0] = { state: 'up', timer: 0, type: 'normal', popT: 1 };
const r1 = t.whack(0);
ok('打中 normal hit', r1.hit);
eq('打中 normal type', r1.type, 'normal');
eq('打中 normal gain=10', r1.gain, 10);
eq('打中 normal score=10', t.getScore(), 10);
eq('打中 normal combo=1', t.getCombo(), 1);

// 打中 gold +30
t.startGame();
t.getHoles()[3] = { state: 'up', timer: 0, type: 'gold', popT: 1 };
const r2 = t.whack(3);
ok('打中 gold hit', r2.hit);
eq('打中 gold gain=30', r2.gain, 30);
eq('打中 gold score=30', t.getScore(), 30);
eq('打中 gold combo=1', t.getCombo(), 1);

// 打中 bomb -20 combo=0
t.startGame();
t.setCombo(3);
t.getHoles()[5] = { state: 'up', timer: 0, type: 'bomb', popT: 1 };
const r3 = t.whack(5);
ok('打中 bomb hit', r3.hit);
eq('打中 bomb gain=-20', r3.gain, -20);
eq('打中 bomb score=-20', t.getScore(), -20);
eq('打中 bomb combo=0', t.getCombo(), 0);

// 连击加成：combo=2 打 normal，10*(1+0.2)=12
t.startGame();
t.setCombo(2);
t.getHoles()[0] = { state: 'up', timer: 0, type: 'normal', popT: 1 };
const r4 = t.whack(0);
eq('连击2 gain=12', r4.gain, 12);
eq('连击2 combo=3', t.getCombo(), 3);

// 连击上限：combo=15 打 normal，10*(1+1.0)=20
t.startGame();
t.setCombo(15);
t.getHoles()[0] = { state: 'up', timer: 0, type: 'normal', popT: 1 };
const r5 = t.whack(0);
eq('连击15 gain=20(上限)', r5.gain, 20);

// 打空（empty 洞）combo 归零
t.startGame();
t.setCombo(5);
const r6 = t.whack(0);
ok('打空 not hit', !r6.hit);
eq('打空 gain=0', r6.gain, 0);
eq('打空 combo=0', t.getCombo(), 0);

// 打 falling 洞算打空
t.startGame();
t.setCombo(3);
t.getHoles()[0] = { state: 'falling', timer: 0, type: 'normal', popT: 0.5 };
const r7 = t.whack(0);
ok('打 falling not hit', !r7.hit);
eq('打 falling combo=0', t.getCombo(), 0);

// 打 hit 状态洞算打空
t.startGame();
t.getHoles()[0] = { state: 'hit', timer: 0, type: 'normal', popT: 0.5 };
const r8 = t.whack(0);
ok('打 hit 状态 not hit', !r8.hit);

// 未开始时 whack 返回 null
t.setPlaying(false);
eq('未开始 whack=null', t.whack(0), null);
t.setPlaying(true);

// 越界
t.startGame();
eq('whack(-1) null', t.whack(-1), null);
eq('whack(99) null', t.whack(99), null);

// ===== 7. holePos / holeCenter =====
t.startGame();
const p0 = t.holePos(0), p4 = t.holePos(4), p8 = t.holePos(8);
ok('holePos(0) x 合理', p0.x >= 0 && p0.x < t.getW());
ok('holePos(0) y 合理', p0.y >= 0 && p0.y < t.getH());
ok('holePos(8) x > holePos(0) x', p8.x >= p0.x);
ok('holePos(8) y > holePos(0) y', p8.y >= p0.y);
// 同行 x 递增
const p1 = t.holePos(1);
ok('同行 holePos(1).x > holePos(0).x', p1.x > p0.x);
ok('同行 holePos(1).y == holePos(0).y', p1.y === p0.y);
// 同列 y 递增
const p3 = t.holePos(3);
ok('同列 holePos(3).y > holePos(0).y', p3.y > p0.y);
ok('同列 holePos(3).x == holePos(0).x', p3.x === p0.x);
// holeCenter = holePos + cellW/2
const c0 = t.holeCenter(0);
ok('holeCenter.x > holePos.x', c0.x > p0.x);
ok('holeCenter.y > holePos.y', c0.y > p0.y);

// ===== 8. update 状态机推进 =====
t.startGame();
// rising → up
t.getHoles()[0] = { state: 'rising', timer: 0, type: 'normal', popT: 0 };
t.setSpawnTimer(0);
t.setGameTime(1);
t.update(0.19);
eq('rising→up', t.getHoles()[0].state, 'up');
ok('rising 后 popT=1', t.getHoles()[0].popT === 1);

// up → falling（等 upDuration）
t.startGame();
t.setGameTime(0);
t.getHoles()[0] = { state: 'up', timer: 0, type: 'normal', popT: 1 };
const upDur = t.upDuration();
t.update(upDur + 0.01);
eq('up→falling', t.getHoles()[0].state, 'falling');

// falling → empty
t.startGame();
t.getHoles()[0] = { state: 'falling', timer: 0, type: 'normal', popT: 0.5 };
t.update(0.19);
eq('falling→empty', t.getHoles()[0].state, 'empty');
eq('falling→empty type=null', t.getHoles()[0].type, null);

// hit → empty
t.startGame();
t.getHoles()[0] = { state: 'hit', timer: 0, type: 'normal', popT: 0.5 };
t.update(0.13);
eq('hit→empty', t.getHoles()[0].state, 'empty');

// time 递减
t.startGame();
t.setGameTime(0);
const timeBefore = t.getTime();
t.update(0.5);
ok('time 递减', t.getTime() < timeBefore);
ok('time = 29.5 左右', Math.abs(t.getTime() - 29.5) < 0.1);

// time<=0 endGame
t.startGame();
t.setGameTime(29.9);
t.update(0.2);
ok('time 到 0 endGame playing=false', !t.getPlaying());

// ===== 9. startGame 重置 =====
t.startGame();
t.setScore(999);
t.setCombo(5);
t.getHoles()[0] = { state: 'up', timer: 0, type: 'normal', popT: 1 };
t.startGame();
eq('startGame score=0', t.getScore(), 0);
eq('startGame combo=0', t.getCombo(), 0);
eq('startGame holes[0] empty', t.getHoles()[0].state, 'empty');
eq('startGame time=30', t.getTime(), 30);
ok('startGame playing=true', t.getPlaying());

// ===== 10. spawn 推进 =====
t.startGame();
t.setGameTime(0);
t.setSpawnTimer(0);
// 所有洞 empty，update 1.3s 应触发 spawn（interval=1.2）
let anyNonEmpty = false;
for (let i = 0; i < 9; i++) {
  if (t.getHoles()[i].state !== 'empty') { anyNonEmpty = true; break; }
}
ok('update 前全空', !anyNonEmpty);
t.update(1.3);
anyNonEmpty = false;
for (let i = 0; i < 9; i++) {
  if (t.getHoles()[i].state !== 'empty') { anyNonEmpty = true; break; }
}
ok('update 1.3s 后有地鼠', anyNonEmpty);

const pass = results.filter(r => r.pass).length;
const total = results.length;
console.log(`\nwhack: ${pass}/${total} 通过`);
if (pass !== total) {
  results.filter(r => !r.pass).forEach(r => console.log(`  ✗ ${r.name}  ${r.info}`));
  process.exit(1);
}
