const { loadGame, ok, eq, results } = require('./harness');
const { t } = loadGame('../darts.html');

t.setScores([10,20]);
eq('玩家0 初始分=10', t.getScore(0), 10);
eq('玩家1 初始分=20', t.getScore(1), 20);

// 恰好减到 0 → 获胜
t.setScores([10,20]);
t.throwDart(10); // 玩家0: 10-10=0 → 胜
ok('减到0 → 游戏结束', t.isOver() === true);
eq('玩家0 获胜', t.getWinner(), 0);

// 爆镖：减成负数 → 本镖作废，分数不变
t.setScores([10,20]);
t.throwDart(11); // 10-11=-1 <0 → 作废
eq('爆镖后分数不变', t.getScore(0), 10);
ok('爆镖未结束', t.isOver() === false);

// 分步减到 0
t.setScores([10,20]);
t.throwDart(4);  // 6
t.throwDart(6);  // 0 → 胜
eq('分步减到0获胜', t.getWinner(), 0);

// ===== 注入式掉落道具系统（确定性驱动，不依赖随机自动掉落）=====
// 1. 🎯 靶心奖励掉落：直接 apply 加分到奖励池
t.reset();
t.spawnPickup('bull', 0, 0);
eq('生成 1 个掉落物', t.getPickups(), 1);
const b0 = t.getBonus();
t.applyPickup(t.getPickup(0));
eq('拾取 🎯 靶心奖励 +30', t.getBonus(), b0 + 30);
eq('拾取后掉落物移除', t.getPickups(), 0);

// 2. 💰 金币掉落：apply 加分
t.reset();
t.spawnPickup('coin', 0, 0);
const b1 = t.getBonus();
t.applyPickup(t.getPickup(0));
eq('拾取 💰 奖励 +20', t.getBonus(), b1 + 20);

// 3. 未碰撞不生效：仅生成不 apply，奖励不变、掉落物仍在
t.reset();
t.spawnPickup('coin', 0, 0);
t.stepPickups(0.016);
eq('未碰撞奖励不变', t.getBonus(), 0);
eq('未碰撞掉落物仍在', t.getPickups(), 1);

// 4. 命中靶心自动掉落奖励
t.reset();
t.throwDart(50);
eq('命中靶心触发 🎯 奖励 +30', t.getBonus(), 30);
eq('自动掉落已生效并移除', t.getPickups(), 0);

// 5. 回归：核心 501 计分不受影响
t.setScores([10,20]);
t.throwDart(10);
eq('核心计分减到 0 仍获胜', t.getWinner(), 0);

// ===== 胜利彩带 confetti 测试（仅视觉反馈钩子，不改玩法）=====
t.reset();
t.setScores([10,20]);
ok('darts: 胜利前 confettiFired 为 false', t.confettiFired() === false);
t.throwDart(10); // 玩家0: 10-10=0 → 胜
ok('darts: 胜利 → confettiFired 为真', t.confettiFired() === true);
ok('darts: 胜利后 isOver 为真', t.isOver() === true);
// 同一局只触发一次（锁）
t.throwDart(0);
ok('darts: 同一局重复触发不会再次置位（仍为真，已过锁）', t.confettiFired() === true);

const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\ndarts: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
