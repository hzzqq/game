const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../climb.html');

// ===== 核心玩法：攀爬 + 落石 =====
t.reset(12345);
ok('climb: 初始未结束', t.isGameOver() === false);
ok('climb: 初始未登顶', t.isWin() === false);
const s0 = t.getState();
ok('climb: 玩家起始在最底行(17)', s0.player.row === 17, 'row=' + s0.player.row);
ok('climb: 初始分数为0', t.getScore() === 0);

// 向上跳：行号 -1，分数增加
t.reset(7);
t.setPlayer(10, 4); t.clearRocks(); t.setRockTimer(99);
const before = t.getScore();
t.hop('up');
eq('climb: 向上跳动行号 10→9', t.getState().player.row, 9);
ok('climb: 前进后分数>0', t.getScore() > before, 'score=' + t.getScore());

// 落石砸中 → 游戏结束
t.reset(1);
t.setPlayer(10, 3); t.clearRocks();
t.setRocks([{ row: 9, col: 3 }]);   // 落石在玩家上方一格，下一步砸下
t.step(1);
ok('climb: 落石砸中 → 游戏结束', t.isGameOver() === true);

// 无落石时，step 不改变位置（boost=0）
t.reset(2);
t.setPlayer(10, 3); t.clearRocks(); t.setRockTimer(99);
t.step(1);
eq('climb: 无加速无落石时位置不变', t.getState().player.row, 10);

// 两个种子 → 道具布局不同（≥2 种子，验证 PRNG 隔离）
t.reset(111); const a = JSON.stringify(t.getState().pickups);
t.reset(222); const b = JSON.stringify(t.getState().pickups);
ok('climb: 两个种子道具布局不同', a !== b);

// ===== 道具系统（P12 prop） =====
// 三种道具 spawnPickup + getPickups 计数（reset 已撒 5 个随机道具，用增量校验）
t.reset(5); t.clearRocks();
const n0 = t.getPickups();
t.spawnPickup('coin', 2, 6);    // (col=2,row=6)
t.spawnPickup('shield', 4, 5);
t.spawnPickup('boost', 1, 4);
eq('climb: 三种道具已生成(+3)', t.getPickups(), n0 + 3);
t.spawnPickup('coin', 3, 3);
eq('climb: 再次 spawn 计数+1', t.getPickups(), n0 + 4);

// 金币 applyPickup 加分（bonus）
t.reset(5); t.clearRocks();
const bonus0 = t.getState().bonus;
t.applyPickup('coin');
ok('climb: 金币加分 > 0', t.getState().bonus > bonus0, 'bonus=' + t.getState().bonus);

// 护盾 applyPickup +1
t.reset(5); t.clearRocks();
t.applyPickup('shield');
ok('climb: 护盾 +1', t.getShield() === 1, 'shield=' + t.getShield());

// 加速 applyPickup 设置 boost 计时
t.reset(5); t.clearRocks();
t.applyPickup('boost');
ok('climb: 加速设置 boost 计时', t.getBoost() > 0, 'boost=' + t.getBoost());

// 护盾免一次死（落石）
t.reset(1);
t.setPlayer(10, 3); t.clearRocks(); t.setShield(1);
t.setRocks([{ row: 9, col: 3 }]);
t.step(1);
ok('climb: 有护盾时落石不死', t.isGameOver() === false, 'shield=' + t.getShield());
ok('climb: 护盾被消耗', t.getShield() === 0);
// 无盾再被砸 → 死亡
t.setShield(0); t.clearRocks(); t.setRocks([{ row: 9, col: 3 }]);
t.step(1);
ok('climb: 护盾耗尽后再被落石击中死亡', t.isGameOver() === true);

// 落到道具格可拾取（hop 触发 collectPickups）
t.reset(4); t.clearRocks(); t.setRockTimer(99);
t.setPlayer(8, 2);
t.spawnPickup('shield', 2, 7);   // col=2,row=7
t.hop('up'); // 移动到 (7,2)
ok('climb: hop 到道具格拾取护盾', t.getShield() === 1, 'shield=' + t.getShield());

// 🚀加速：自动向上冲（注入分支，不改手动 hop 逻辑）
t.reset(3); t.clearRocks(); t.setRockTimer(99);
t.setPlayer(10, 3);
t.setBoost(3);
t.step(1); eq('climb: 加速第1步 row=9', t.getState().player.row, 9);
t.step(1); eq('climb: 加速第2步 row=8', t.getState().player.row, 8);
t.step(1); eq('climb: 加速第3步 row=7', t.getState().player.row, 7);
ok('climb: 加速计时耗尽(boost=0)', t.getBoost() === 0, 'boost=' + t.getBoost());
// 计时耗尽后不再自动冲
t.step(1); eq('climb: 加速结束后位置不变', t.getState().player.row, 7);

// stepPickups 钩子：处理拾取 + 加速计时递减
t.reset(6); t.clearRocks(); t.setPlayer(7, 2); t.setRockTimer(99);
t.spawnPickup('coin', 2, 7);
t.setBoost(2);
t.stepPickups();
ok('climb: stepPickups 拾取金币(bonus 增加)', t.getState().bonus > 0, 'bonus=' + t.getState().bonus);
ok('climb: stepPickups 递减 boost', t.getBoost() === 1, 'boost=' + t.getBoost());
