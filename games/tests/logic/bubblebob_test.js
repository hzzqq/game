// 泡泡堂逻辑单测（经 window.__bb 钩子驱动真实代码，统一聚合器运行）
const H = require('./harness');
const bb = H.loadGame('../bubblebob.html').t;

function drive(steps, dt) { dt = dt || 0.05; for (let i = 0; i < steps; i++) bb.update(dt); }
function align(p) { p.progress = 0; p.dir = null; p.px = p.gx * bb.TILE + bb.TILE / 2; p.py = p.gy * bb.TILE + bb.TILE / 2; }
const P = id => bb.players.find(p => p.id === id);

// [1] 启动 / 地图
bb.startGame('1v1');
H.ok('泡泡堂 状态=playing', bb.state === 'playing');
H.ok('泡泡堂 玩家数=2', bb.players.length === 2);
H.ok('泡泡堂 内部柱子(2,2)=SOLID', bb.grid[2][2] === bb.SOLID);

// [2] 放炸弹
bb.players.forEach(p => { p.isAI = false; align(p); });
bb.setKey('Space', true);
const placed = bb.placeBomb(P(0));
bb.setKey('Space', false);
H.ok('泡泡堂 放炸弹成功', placed === true);
H.ok('泡泡堂 炸弹位于脚下(1,1)', bb.bombs[0].gx === 1 && bb.bombs[0].gy === 1);

// [3] 爆炸摧毁软砖 + 击杀 + 胜负（强制道具掉落）
bb.gridSet(2, 1, bb.SOFT);
bb.gridSet(1, 2, bb.SOFT);
const origRandom = Math.random;
Math.random = () => 0.1; // 触发道具掉落
bb.killBombsSoon();
drive(40, 0.05);
Math.random = origRandom;
H.ok('泡泡堂 软砖(2,1)被摧毁', bb.grid[1][2] === bb.EMPTY);
H.ok('泡泡堂 玩家0踩雷阵亡', P(0).alive === false);
H.ok('泡泡堂 存活数=1', bb.aliveCount === 1);
H.ok('泡泡堂 状态=roundover', bb.state === 'roundover');
H.ok('泡泡堂 胜者=玩家2', bb.lastWinner && bb.lastWinner.id === 2);

// [4] 爆炸遇 SOLID 墙停止
bb.startGame('1v1');
bb.players.forEach(p => { p.isAI = false; align(p); });
bb.gridSet(2, 1, bb.EMPTY);
bb.gridSet(3, 1, bb.SOLID);
bb.gridSet(1, 2, bb.EMPTY);
bb.placeBomb(P(0));
bb.killBombsSoon();
drive(40, 0.05);
H.ok('泡泡堂 硬墙(3,1)保持SOLID', bb.grid[1][3] === bb.SOLID);

// [5] 连锁反应
bb.startGame('1v1');
bb.players.forEach(p => { p.isAI = false; align(p); });
P(0).bombsMax = 2;
bb.gridSet(2, 1, bb.EMPTY); bb.gridSet(3, 1, bb.EMPTY);
bb.gridSet(1, 2, bb.SOFT); bb.gridSet(2, 2, bb.SOFT);
bb.placeBomb(P(0));
bb.setKey('KeyD', true);
let guard = 0; while (P(0).gx !== 2 && guard++ < 200) bb.update(0.05);
bb.setKey('KeyD', false); align(P(0));
const placed2 = bb.placeBomb(P(0));
H.ok('泡泡堂 第二枚炸弹放置成功', placed2 === true);
bb.killBombsSoon(); drive(60, 0.05);
H.ok('泡泡堂 连锁后无残留炸弹', bb.bombs.length === 0);
H.ok('泡泡堂 连锁炸掉(1,2)软砖', bb.grid[2][1] === bb.EMPTY);
H.ok('泡泡堂 连锁炸掉(2,2)软砖', bb.grid[2][2] === bb.EMPTY);

// [6] AI 行为合法
bb.startGame('1v1');
bb.players.forEach(p => { if (p.id === 0) p.isAI = false; });
let aiOk = true;
for (let i = 0; i < 120; i++) {
  bb.update(0.05);
  const ai = P(2);
  const it = ai.intent;
  if (!it || it.dx !== 0 && it.dy !== 0) { aiOk = false; break; }
}
H.ok('泡泡堂 AI 120帧意图合法', aiOk);

// [7] 道具拾取增益
bb.startGame('1v1');
bb.players.forEach(p => { p.isAI = false; align(p); });
bb.powerups.push({ gx: 1, gy: 1, type: 'B' }, { gx: 1, gy: 1, type: 'F' }, { gx: 1, gy: 1, type: 'S' });
const b0 = P(0).bombsMax, r0 = P(0).range, s0 = P(0).speed;
align(P(0));
bb.update(0.05);
H.ok('泡泡堂 拾取B bombsMax+1', P(0).bombsMax === b0 + 1);
H.ok('泡泡堂 拾取F range+1', P(0).range === r0 + 1);
H.ok('泡泡堂 拾取S speed增加', P(0).speed > s0);
H.ok('泡泡堂 道具已清空', bb.powerups.length === 0);

// [8] nextRound 保留分数
bb.startGame('1v1');
bb.players.forEach(p => { p.isAI = false; align(p); });
P(2).score = 5;
bb.nextRound();
H.ok('泡泡堂 回合号+1', bb.roundNo === 2);
H.ok('泡泡堂 分数保留', bb.players.find(p => p.id === 2).score === 5);

// [9] 注入：胶囊掉落 / 增益（确定性，经 __bb 钩子驱动）
bb.startGame('1v1');
bb.players.forEach(p => { p.isAI = false; });
const P0 = P(0);
align(P0);
bb.reset();
// 9a bomb 落到玩家脚下 → 清除软砖 + 移除
const bombBefore = bb.capBombCleared;
bb.spawnPickup('bomb', P0.px, P0.py);
H.ok('胶囊 bomb 已生成', bb.capPickups.length === 1);
bb.stepPickups(0.001);
H.ok('胶囊 bomb 被拾取后移除', bb.capPickups.length === 0);
H.ok('胶囊 bomb 清除软砖(capBombCleared+)', bb.capBombCleared > bombBefore);
// 9b heal 拾取 +1 生命 + 移除
bb.reset(); align(P0);
const livesBefore = bb.capLives;
bb.spawnPickup('heal', P0.px, P0.py);
bb.stepPickups(0.001);
H.ok('胶囊 heal 拾取后移除', bb.capPickups.length === 0);
H.ok('胶囊 heal 生命+1', bb.capLives === livesBefore + 1);
// 9c 远处胶囊：无碰撞不生效、不移除
bb.reset(); align(P0);
bb.spawnPickup('heal', 300, 500);
const lvFar = bb.capLives, bcFar = bb.capBombCleared;
bb.stepPickups(0.001);
H.ok('胶囊 远处不拾取(仍存在)', bb.capPickups.length === 1);
H.ok('胶囊 远处不生效', bb.capLives === lvFar && bb.capBombCleared === bcFar);
// 9d 护盾挡死：生命不变、护盾消耗
bb.reset(); align(P0);
bb.setShield(true);
const lvShield = bb.capLives;
bb.takeHit(5);
H.ok('胶囊 护盾挡死 生命不变', bb.capLives === lvShield);
H.ok('胶囊 护盾挡死 已消耗', bb.capShield === false);
// 9e 无护盾损命，归零置 dead
bb.reset(); align(P0);
bb.setShield(false);
const lvNo = bb.capLives;
bb.takeHit(1);
H.ok('胶囊 无护盾 生命-1', bb.capLives === lvNo - 1);
bb.takeHit(99);
H.ok('胶囊 生命归零 capDead', bb.capDead === true);
