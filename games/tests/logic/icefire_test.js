// 冰火人逻辑单测：关卡内置道具（护盾/得分星）拾取生效 + 清空
const H = require('./harness');
const { t: T } = H.loadGame('../icefire.html');

// 1) 分数 set/get 通路
T.setScore(7);
H.ok('icefire: setScore/getScore (得到 ' + T.getScore() + ')', T.getScore() === 7);

// 2) 护盾道具：collectAll 全收场上道具（关卡自带 1 shield + 1 star + 注入 1 shield），每个 shield 双方各 +1
var shIce0 = T.ice.shield, shFire0 = T.fire.shield;
T.spawnPowerup('shield', 100, 100);
T.collectAll();
H.ok('icefire: 护盾道具每盾双方+1 (场上2盾, ice=' + T.ice.shield + ' fire=' + T.fire.shield + ')', T.ice.shield === shIce0 + 2 && T.fire.shield === shFire0 + 2);
H.ok('icefire: 拾取后清空', T.getPowerups() === 0);

// 3) 得分星：双方 starTimer 置 8s
T.spawnPowerup('star', 100, 100);
T.collectAll();
H.ok('icefire: 得分星 8s (ice=' + T.ice.starTimer + ' fire=' + T.fire.starTimer + ')', T.ice.starTimer === 8 && T.fire.starTimer === 8);

// 4) 标准化掉落：⚡加速 生效 + 拾取后移除
T.setBoost(0); T.ice.speedTimer=0; T.fire.speedTimer=0;
T.spawnPickup('speed', T.ice.x+13, T.ice.y+17);
T.stepPickups(0.05);
H.ok('icefire: 加速 pickup 生效 (speedTimer=' + T.ice.speedTimer + ')', T.ice.speedTimer > 0);
H.ok('icefire: 拾取后移除', T.getPickups() === 0);

// 5) 未碰撞不生效
T.spawnPickup('speed', 0, 0);
T.stepPickups(0.05);
H.ok('icefire: 未碰撞 pickup 仍在', T.getPickups() === 1);

// 6) ❤回血(pickup) → 双方护盾+1（本作无 HP，回血映射为护盾）
T.setShield(0); T.ice.shield=0; T.fire.shield=0;
T.spawnPickup('heal', T.ice.x+13, T.ice.y+17);
T.stepPickups(0.05);
H.ok('icefire: heal 双方护盾+1 (ice=' + T.ice.shield + ' fire=' + T.fire.shield + ')', T.ice.shield === 1 && T.fire.shield === 1);

// 7) 护盾免死：有盾时 takeHit 不掉（不重生）
T.setShield(1); T.ice.shieldGrace = 0;
var ix0 = T.ice.x;
T.takeHit(1);
H.ok('icefire: 护盾消耗 (shield=' + T.ice.shield + ')', T.ice.shield === 0);
H.ok('icefire: 护盾免死未重生', T.ice.x === ix0);

// 8) 无盾：takeHit → 重生到起点
T.setShield(0); T.ice.shieldGrace = 0;
var isx = T.ice.startX;
T.takeHit(1);
H.ok('icefire: 无盾死亡→重生到起点 (x=' + T.ice.x + ')', T.ice.x === isx);

// 9) 加速 get/set
T.setBoost(5);
H.ok('icefire: getBoost=5 (boost=' + T.getBoost() + ')', T.getBoost() === 5);

// ============ 电脑玩家（CPU 接管 P2）回归单测 ============
// 复用上方已加载的 T（icefire.html 实例）。CPU 只调既有移动 API，不碰核心玩法/碰撞/过关逻辑。
T.reset(); T.setMode('2p');

// 10) 模式开关：默认双人，可切到 cpu 并读回
H.ok('icefire: 默认双人模式 (mode=' + T.getMode() + ')', T.getMode()==='2p');
T.setMode('cpu');
H.ok('icefire: 可切换到 cpu 模式 (mode=' + T.getMode() + ')', T.getMode()==='cpu');

// 11) 控制组：双人模式下无任何输入，fire 不应被自动移动（证明默认仍是双人协作）
T.reset(); T.setMode('2p');
var fBefore = T.fire.x;
for (var i = 0; i < 60; i++) T.update();
H.ok('icefire: 双人模式 fire 不被自动移动', Math.abs(T.fire.x - fBefore) < 0.001);

// 12) CPU 接管后驱动 P2（火人）：朝出口前进并最终抵达（atExit）
T.reset(); T.setMode('cpu'); T.setRand(20240722);
var fStart = T.fire.x;
var reached = false, psteps = 0;
while (psteps < 1500 && !reached) {
  T.update();              // step 在 cpu 模式下自动调用 cpuThinkFor('fire')
  psteps++;
  if (T.fire.atExit) reached = true;
}
H.ok('icefire: CPU 驱动 P2 朝出口前进 (Δx=' + Math.round(T.fire.x - fStart) + ')', T.fire.x > fStart + 200);
H.ok('icefire: CPU 驱动 P2 抵达出口 (atExit, steps=' + psteps + ')', reached);

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
H.ok('icefire: CPU 协作模式全程无异常' + (runErr ? (' ' + runErr.message) : ''), !runErr);
H.ok('icefire: CPU 协作通关 (state=' + T.getState() + ' steps=' + guard + ')', T.getState() === 'win');

// 14) 局部 PRNG 确定性：同种子短窗口内（无掉落干扰）CPU 决策结果一致，证明用 mk 而非 Math.random
T.reset(); T.setMode('cpu'); T.setRand(5150);
for (var a = 0; a < 120; a++) T.update();
var fx1 = Math.round(T.fire.x);
T.reset(); T.setMode('cpu'); T.setRand(5150);
for (var b = 0; b < 120; b++) T.update();
var fx2 = Math.round(T.fire.x);
H.ok('icefire: 同种子 CPU 决策确定性 (fx1=' + fx1 + ' fx2=' + fx2 + ')', fx1 === fx2);

// 15) 通关彩带：全部通关 → confettiFired 置真（只读锁，独立于 Juice）
T.reset();
H.ok('icefire: 通关前 confettiFired 为 false', T.confettiFired() === false);
T.win();
H.ok('icefire: 全部通关 → confettiFired 为真', T.confettiFired() === true);
H.ok('icefire: win() 进入通关态', T.getState() === 'win');

// 16) 重置后锁复位
T.reset();
H.ok('icefire: 重置后 confettiFired 复位', T.confettiFired() === false);

// ============ 手感深化：Juice 反馈钩子（纯注入，不改动玩法）============
{
  // 初始计数应为 0
  T.reset();
  H.eq('fx: 初始 fxShakes=0', T.fxShakes(), 0);
  H.eq('fx: 初始 fxBursts=0', T.fxBursts(), 0);

  // 受击（无盾）→ 触发 shake
  T.setShield(0); T.ice.shieldGrace = 0;
  T.takeHit(1);
  H.ok('fx: 受击触发 shake (fxShakes>0)', T.fxShakes() > 0);
  H.eq('fx: 受击未触发 burst', T.fxBursts(), 0);

  // 道具拾取（applyPickup）→ 触发 burst（确定性坐标，不消耗随机数）
  const p = T.spawnPickup('speed', 100, 100);
  T.applyPickup(p);
  H.ok('fx: 道具拾取触发 burst (fxBursts>0)', T.fxBursts() > 0);

  // reset 后计数归零
  T.reset();
  H.eq('fx: reset 后归零', T.fxShakes(), 0);
  H.eq('fx: reset 后归零2', T.fxBursts(), 0);
}

const total = H.results.length;
const pass = H.results.filter(r => r.pass).length;
console.log(`\nicefire: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

module.exports = {};

