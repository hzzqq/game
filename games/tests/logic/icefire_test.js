// 冰火人逻辑单测：关卡内置道具（护盾/得分星）拾取生效 + 清空
const H = require('./harness');
const { t: T } = H.loadGame('../icefire.html');

// 1) 分数 set/get 通路
T.setScore(7);
H.ok(T.getScore() === 7, 'icefire: setScore/getScore (得到 ' + T.getScore() + ')');

// 2) 护盾道具：双方各 +1，拾取后清空
T.spawnPowerup('shield', 100, 100);
T.collectAll();
H.ok(T.ice.shield === 1 && T.fire.shield === 1, 'icefire: 护盾道具双方+1 (ice=' + T.ice.shield + ' fire=' + T.fire.shield + ')');
H.ok(T.getPowerups() === 0, 'icefire: 拾取后清空');

// 3) 得分星：双方 starTimer 置 8s
T.spawnPowerup('star', 100, 100);
T.collectAll();
H.ok(T.ice.starTimer === 8 && T.fire.starTimer === 8, 'icefire: 得分星 8s (ice=' + T.ice.starTimer + ' fire=' + T.fire.starTimer + ')');

// 4) 标准化掉落：⚡加速 生效 + 拾取后移除
T.setBoost(0); T.ice.speedTimer=0; T.fire.speedTimer=0;
T.spawnPickup('speed', T.ice.x+13, T.ice.y+17);
T.stepPickups(0.05);
H.ok(T.ice.speedTimer > 0, 'icefire: 加速 pickup 生效 (speedTimer=' + T.ice.speedTimer + ')');
H.ok(T.getPickups() === 0, 'icefire: 拾取后移除');

// 5) 未碰撞不生效
T.spawnPickup('speed', 0, 0);
T.stepPickups(0.05);
H.ok(T.getPickups() === 1, 'icefire: 未碰撞 pickup 仍在');

// 6) ❤回血(pickup) → 双方护盾+1（本作无 HP，回血映射为护盾）
T.setShield(0); T.ice.shield=0; T.fire.shield=0;
T.spawnPickup('heal', T.ice.x+13, T.ice.y+17);
T.stepPickups(0.05);
H.ok(T.ice.shield === 1 && T.fire.shield === 1, 'icefire: heal 双方护盾+1 (ice=' + T.ice.shield + ' fire=' + T.fire.shield + ')');

// 7) 护盾免死：有盾时 takeHit 不掉（不重生）
T.setShield(1); T.ice.shieldGrace = 0;
var ix0 = T.ice.x;
T.takeHit(1);
H.ok(T.ice.shield === 0, 'icefire: 护盾消耗 (shield=' + T.ice.shield + ')');
H.ok(T.ice.x === ix0, 'icefire: 护盾免死未重生');

// 8) 无盾：takeHit → 重生到起点
T.setShield(0); T.ice.shieldGrace = 0;
var isx = T.ice.startX;
T.takeHit(1);
H.ok(T.ice.x === isx, 'icefire: 无盾死亡→重生到起点 (x=' + T.ice.x + ')');

// 9) 加速 get/set
T.setBoost(5);
H.ok(T.getBoost() === 5, 'icefire: getBoost=5 (boost=' + T.getBoost() + ')');

// ============ 电脑玩家（CPU 接管 P2）回归单测 ============
// 复用上方已加载的 T（icefire.html 实例）。CPU 只调既有移动 API，不碰核心玩法/碰撞/过关逻辑。
T.reset(); T.setMode('2p');

// 10) 模式开关：默认双人，可切到 cpu 并读回
H.ok(T.getMode()==='2p', 'icefire: 默认双人模式 (mode=' + T.getMode() + ')');
T.setMode('cpu');
H.ok(T.getMode()==='cpu', 'icefire: 可切换到 cpu 模式 (mode=' + T.getMode() + ')');

// 11) 控制组：双人模式下无任何输入，fire 不应被自动移动（证明默认仍是双人协作）
T.reset(); T.setMode('2p');
var fBefore = T.fire.x;
for (var i = 0; i < 60; i++) T.update();
H.ok(Math.abs(T.fire.x - fBefore) < 0.001, 'icefire: 双人模式 fire 不被自动移动');

// 12) CPU 接管后驱动 P2（火人）：朝出口前进并最终抵达（atExit）
T.reset(); T.setMode('cpu'); T.setRand(20240722);
var fStart = T.fire.x;
var reached = false, psteps = 0;
while (psteps < 1500 && !reached) {
  T.update();              // step 在 cpu 模式下自动调用 cpuThinkFor('fire')
  psteps++;
  if (T.fire.atExit) reached = true;
}
H.ok(T.fire.x > fStart + 200, 'icefire: CPU 驱动 P2 朝出口前进 (Δx=' + Math.round(T.fire.x - fStart) + ')');
H.ok(reached, 'icefire: CPU 驱动 P2 抵达出口 (atExit, steps=' + psteps + ')');

// 13) CPU 协作全程无异常 + 双人协作通关：测试侧同时驱动 P1（冰人），验证与人类协作可通关
T.reset(); T.setMode('cpu'); T.setRand(20240722);
var guard = 0, runErr = null;
try {
  while (T.getState() !== 'win' && guard < 4000) {
    T.cpuThinkFor('ice');   // 测试侧驱动 P1，模拟人类玩家
    T.update();             // 内部在 cpu 模式下自动驱动 P2
    guard++;
    if (T.getState() === 'clear') T.next();   // 过关心跳：L1→L2
  }
} catch (e) { runErr = e; }
H.ok(!runErr, 'icefire: CPU 协作模式全程无异常' + (runErr ? (' ' + runErr.message) : ''));
H.ok(T.getState() === 'win', 'icefire: CPU 协作通关 (state=' + T.getState() + ' steps=' + guard + ')');

// 14) 局部 PRNG 确定性：同种子短窗口内（无掉落干扰）CPU 决策结果一致，证明用 mk 而非 Math.random
T.reset(); T.setMode('cpu'); T.setRand(5150);
for (var a = 0; a < 120; a++) T.update();
var fx1 = Math.round(T.fire.x);
T.reset(); T.setMode('cpu'); T.setRand(5150);
for (var b = 0; b < 120; b++) T.update();
var fx2 = Math.round(T.fire.x);
H.ok(fx1 === fx2, 'icefire: 同种子 CPU 决策确定性 (fx1=' + fx1 + ' fx2=' + fx2 + ')');

module.exports = {};

