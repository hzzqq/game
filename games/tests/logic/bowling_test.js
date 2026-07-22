const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../bowling.html');

// 全洗沟：20 次 0 瓶 → 0 分
t.setRolls(new Array(20).fill(0));
eq('全洗沟得分=0', t.score(), 0);

// 完美局：12 次全中 → 300 分
t.setRolls(new Array(12).fill(10));
eq('全中满分=300', t.score(), 300);
ok('isPerfect 判定满分', t.isPerfect() === true);

// 每格 4+5=9，共 10 格 → 90 分
t.setRolls(Array(10).fill([4,5]).flat());
eq('每格9分共10格=90', t.score(), 90);

// 补中+奖励：第1格 5+5(spare) 加下一球3 = 13；第2格 3+4=7；其余0 → 20
t.setRolls([5,5,3,4, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
eq('补中带奖励分=20', t.score(), 20);

// ===== 注入式掉落道具系统（确定性驱动，不依赖随机自动掉落）=====
// 1. 💰 金币掉落：直接 apply 加分到奖励池
t.reset();
t.spawnPickup('coin', 0, 0);
eq('生成 1 个掉落物', t.getPickups(), 1);
const b0 = t.getBonus();
t.applyPickup(t.getPickup(0));
eq('拾取 💰 奖励 +20', t.getBonus(), b0 + 20);
eq('拾取后掉落物移除', t.getPickups(), 0);

// 2. 🎯 补中奖励掉落：apply 加分
t.reset();
t.spawnPickup('spare', 0, 0);
const b1 = t.getBonus();
t.applyPickup(t.getPickup(0));
eq('拾取 🎯 补中奖励 +10', t.getBonus(), b1 + 10);

// 3. 未碰撞不生效：仅生成不 apply，奖励不变、掉落物仍在
t.reset();
t.spawnPickup('coin', 0, 0);
t.stepPickups(0.016);
eq('未碰撞奖励不变', t.getBonus(), 0);
eq('未碰撞掉落物仍在', t.getPickups(), 1);

// 4. 全中自动掉落补中奖励
t.reset();
t.roll(10);
eq('全中触发 🎯 补中奖励 +10', t.getBonus(), 10);
eq('自动掉落已生效并移除', t.getPickups(), 0);

// 5. 回归：纯计分 score() 不受奖励池影响
t.setRolls(new Array(12).fill(10));
eq('完美局纯计分仍 300', t.score(), 300);
