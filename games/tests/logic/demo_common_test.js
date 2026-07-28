// 参考实现 · 逻辑单测：验证 games/common.js 的共享核心在 harness 中端到端可用。
// 加载 games/demo/demo_common.html（它仅依赖 Common.*，不依赖 juice/input/three）。
const H = require('./harness');
const { t } = H.loadGame('../demo/demo_common.html');

// 1) 初始
t.reset(1);
let s = t.getState();
H.eq('初始: 未运行', s.running, false);
H.eq('初始: 分数=0', s.score, 0);
H.eq('初始: 范围=50', s.range, 50);

// 2) 种子化确定性：同种子 → 同初始目标
t.reset(1);
const tgt1 = t.getTarget();
t.reset(1);
H.eq('同种子 → 同初始目标（确定性）', t.getTarget(), tgt1);

// 3) 猜中加连击 / 错则清零
t.reset(7); t.start(7);
const target = t.getTarget();
const r1 = t.guess(target);
H.ok('猜中: ok', r1.ok === true && r1.hit === true);
H.eq('猜中: 连击=1', t.getState().streak, 1);
const wrong = (t.getTarget() + 1) % t.getState().range;
const r2 = t.guess(wrong);
H.eq('猜错: 连击归零', t.getState().streak, 0);

// 4) 难度条影响范围（speedMult 放大上限）
t.reset(1); t.start(1);
const before = t.getState().range;
H.eq('setDifficulty 普通=50', before, 50);
H.eq('setDifficulty 地狱=true', t.setDifficulty('hell'), true);
H.ok('地狱档范围 > 普通', t.getState().range > before);

// 5) tick 推进倒计时（不依赖真实 rAF，直接驱动）
t.reset(1); t.start(1); t.setDifficulty('normal');
t.tick(5.0);
H.ok('tick 5s 后剩余<20', t.getState().timeLeft < 20);
t.tick(20.0);
H.eq('tick 超时: 结束', t.getState().over, true);
H.eq('tick 超时: 停止运行', t.getState().running, false);

// 6) 5 连击里程碑标记（confetti 触发位）
t.reset(3); t.start(3);
let streak = 0, lastHit = null;
for (let i = 0; i < 5; i++) {
  lastHit = t.getTarget();
  t.guess(lastHit); // 每次都猜中当前目标 → 连击累加
}
H.eq('5 连击达成', t.getState().streak, 5);
H.eq('里程碑标记置位', t.confettiStreak(), true);
