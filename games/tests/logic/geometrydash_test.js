// 逻辑单测：geometrydash.html（几何冲刺 / 道具系统 P8）
// 真实代码被测试，不复制。window.__t 驱动纯逻辑。
const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../geometrydash.html');

// ===== 初始态 =====
t.reset();
ok('geometrydash: 初始未结束', t.isGameOver() === false);
ok('geometrydash: 初始护盾为0', t.getShield() === 0, 'shield=' + t.getShield());
ok('geometrydash: 初始加速为0', t.getBoost() === 0);
ok('geometrydash: 初始道具为空', t.getPickups().length === 0);
ok('geometrydash: 初始距离为0', t.getDistance() === 0);

// ===== 道具系统（P8：orb/boost/shield）=====

// --- applyPickup 数值 ---
t.reset();
const d0 = t.getDistance();
t.applyPickup('orb');
ok('geometrydash: 能量球加分>0', t.getDistance() > d0, 'dist=' + t.getDistance());

t.reset();
t.applyPickup('shield');
ok('geometrydash: 护盾+1', t.getShield() === 1, 'shield=' + t.getShield());
t.applyPickup('shield');
ok('geometrydash: 护盾可叠加', t.getShield() === 2, 'shield=' + t.getShield());

t.reset();
t.applyPickup('boost');
ok('geometrydash: 加速计时>0', t.getBoost() > 0, 'boost=' + t.getBoost());

// --- 护盾免一次撞击 ---
t.reset();
const gy = t.GROUND_Y();
t.setObstacles([{ type: 'spike', x: 115, y: gy - 30, w: 40, h: 30 }]);
t.setShield(1);
t.update(1);
ok('geometrydash: 有护盾撞击不死', t.isGameOver() === false, 'over=' + t.isGameOver());
ok('geometrydash: 护盾被消耗', t.getShield() === 0, 'shield=' + t.getShield());

// --- 无盾失败不变 ---
t.reset();
const gy2 = t.GROUND_Y();
t.setObstacles([{ type: 'spike', x: 115, y: gy2 - 30, w: 40, h: 30 }]);
t.setShield(0);
t.update(1);
ok('geometrydash: 无盾撞击→失败', t.isGameOver() === true);

// --- 拾取移除：spawnPickup 后在玩家位置 stepPickups 拾取并移除 ---
t.reset();
const ps = t.getState().player;
const before = t.getDistance();
t.spawnPickup('orb', ps.x + 5, ps.y - 15);
ok('geometrydash: spawnPickup 后道具数=1', t.getPickups().length === 1);
t.stepPickups(1);
ok('geometrydash: 拾取后道具移除', t.getPickups().length === 0, 'n=' + t.getPickups().length);
ok('geometrydash: 拾取能量球后距离增加', t.getDistance() > before, 'dist=' + t.getDistance());

// --- 护盾拾取同样生效 ---
t.reset();
const ps2 = t.getState().player;
t.spawnPickup('shield', ps2.x + 5, ps2.y - 15);
t.setShield(0);
t.stepPickups(1);
ok('geometrydash: 拾取护盾生效', t.getShield() === 1, 'shield=' + t.getShield());

// ===== 难度系统（D5：倍率法，normal=1.0 不动现有行为）=====

// --- 钩子存在 ---
ok('geometrydash: 暴露 DIFFICULTY', typeof t.DIFFICULTY === 'object' && !!t.DIFFICULTY.hell);
ok('geometrydash: 暴露 setDifficulty', typeof t.setDifficulty === 'function');
ok('geometrydash: 暴露 getDifficulty', typeof t.getDifficulty === 'function');
ok('geometrydash: 暴露 diffCfg', typeof t.diffCfg === 'function');

// --- 地狱档前进速度 > 简单档（speedMult）---
t.setDifficulty('easy');     // setDifficulty 内部重开一局（state=play）
t.update(1);
const spdEasy = t.getState().speed;
t.setDifficulty('hell');
t.update(1);
const spdHell = t.getState().speed;
ok('geometrydash: 地狱前进速度>简单', spdHell > spdEasy, 'hell=' + spdHell.toFixed(3) + ' easy=' + spdEasy.toFixed(3));

// --- 地狱障碍更密（countMult -> spawnGap 更小）---
t.setDifficulty('easy');
t.update(1);
const gapEasy = t.getSpawnGap();
t.setDifficulty('hell');
t.update(1);
const gapHell = t.getSpawnGap();
ok('geometrydash: 地狱障碍间隔<简单(更密)', gapHell < gapEasy, 'hell=' + gapHell.toFixed(2) + ' easy=' + gapEasy.toFixed(2));

// --- setDifficulty 生效：返回新难度 + 重开使距离归零 ---
t.setDifficulty('hell');
ok('geometrydash: setDifficulty 生效(返回地狱)', t.getDifficulty() === 'hell', 'd=' + t.getDifficulty());
ok('geometrydash: setDifficulty 重开(距离归零)', t.getDistance() === 0, 'dist=' + t.getDistance());

// --- 非法难度被忽略，保持当前难度 ---
t.setDifficulty('easy');
t.setDifficulty('???');
ok('geometrydash: 非法难度被忽略', t.getDifficulty() === 'easy', 'd=' + t.getDifficulty());

// --- normal=1.0 保持原速度基线（baseSpeed=4.5）---
t.setDifficulty('normal');
t.update(1);
const spdNorm = t.getState().speed;
ok('geometrydash: normal 速度≈基线4.5', Math.abs(spdNorm - 4.5) < 0.05, 'spd=' + spdNorm.toFixed(3));

// ===== 结果汇总 =====
const passed = require('./harness').results.filter(r => r.pass).length;
const total = require('./harness').results.length;
const failed = total - passed;
console.log('\n几何冲刺 道具系统: ' + passed + '/' + total + ' 通过' + (failed ? '  ❌ ' + failed + ' 失败' : '  ✅ 全过'));
process.exit(failed ? 1 : 0);
