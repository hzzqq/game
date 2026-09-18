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

// ===== 胜利/达成 confetti：全中(strike) =====
t.reset();
eq('达成前 confettiFired 为 false', t.confettiFired(), false);
t.roll(10);
eq('全中触发 confettiFired', t.confettiFired(), true);

// ---------- 手感深化：全中/补中屏震计数器（只读钩子，不改动玩法）----------
(function(){
  t.reset();
  eq('手感: 新局 fxShakes=0', t.fxShakes(), 0);
  eq('手感: 新局 fxBursts=0', t.fxBursts(), 0);

  t.roll(10); // 全中
  ok('手感: 全中 fxShakes>0', t.fxShakes() > 0);
  ok('手感: 全中触发胜利粒子 fxBursts>0', t.fxBursts() > 0);

  t.reset();
  eq('手感: 重开 fxShakes=0', t.fxShakes(), 0);
  eq('手感: 重开 fxBursts=0', t.fxBursts(), 0);

  t.roll(4); t.roll(6); // 补中（两球合计=10）
  ok('手感: 补中 fxShakes>0', t.fxShakes() > 0);
})();

// ===== T-134：本地 Top5 榜单（十格完成 → 真实结算路径 record 总分）=====
(() => {
  ok('bowling isGameOver 钩子存在', typeof t.isGameOver === 'function');
  ok('bowling recordScore/getTop5/clearTop5 钩子存在', typeof t.recordScore === 'function' && typeof t.getTop5 === 'function' && typeof t.clearTop5 === 'function');
  t.clearTop5();
  t.reset();
  for(let i=0;i<9;i++) t.roll(10);
  ok('bowling 9 连全中后未完成（差第 10 格）', !t.isGameOver());
  t.roll(10); t.roll(10); t.roll(10); // 第 10 格全中 + 2 奖球
  ok('bowling 12 球全中完成十格且满分 300', t.isGameOver() && t.score() === 300);
  const top = t.getTop5();
  ok('bowling 完成路径已入榜（真路径非注入）', top.length >= 1 && top[0].score === 300);
  t.reset(); t.roll(4); t.roll(6);
  ok('bowling 未完成不入榜', !t.isGameOver() && t.getTop5().length === 1);
  t.recordScore(187);
  ok('bowling recordScore 注入次高分在榜', t.getTop5().some(e => e.score === 187));
  t.clearTop5();
  ok('bowling clearTop5 清空', t.getTop5().length === 0);
})();

