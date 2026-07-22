const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../dodge.html');

// 陨石正落在玩家正上方 → 被砸中死亡
t.reset();
t.setPlayer(100);
t.setObstacles([{x:100,y:280,vy:10}]); // 玩家带位于 y≈280，陨石落到该高度即判定
t.tick();
ok('陨石命中玩家 → 死亡', t.isDead() === true);

// 陨石与玩家错位 → 安全
t.reset();
t.setPlayer(100);
t.setObstacles([{x:40,y:280,vy:10}]); // x 相差60，远超碰撞半径
t.tick();
ok('陨石未命中 → 存活', t.isDead() === false);

// 无陨石 → 安全且计时推进
t.reset();
t.setPlayer(100);
t.setObstacles([]);
t.tick();
ok('无陨石 → 存活', t.isDead() === false);
eq('计时推进', t.getTime(), 1);

// ===== 注入式掉落道具系统（确定性驱动，不依赖随机自动掉落）=====
// 1. 护盾免死：有盾时受击不死亡、护盾被消耗
t.reset();
t.setShield(1);
t.setPlayer(100);
t.setObstacles([{x:100,y:280,vy:10}]);
t.tick();
ok('有盾受击未死亡', t.isDead() === false);
eq('护盾被消耗', t.getShield(), 0);

// 2. 无盾扣血：多命时受击减命不立即死
t.reset();
t.setLives(3);
t.setPlayer(100);
t.setObstacles([{x:100,y:280,vy:10}]);
t.tick();
eq('无盾受击扣血（3→2）', t.getLives(), 2);
ok('多命时受击未死', t.isDead() === false);

// 3. ❤ 回血：拾取回血掉落物增加生命
t.reset();
t.setLives(1);
t.setPlayer(100);
t.spawnPickup('heart', 100, t.getPY());   // 落到玩家位置自动拾取
t.stepPickups(0.016);
eq('拾取 ❤ 回血（1→2）', t.getLives(), 2);
eq('拾取后掉落物移除', t.getPickups(), 0);

// 4. 🛡 护盾掉落：落到玩家位置自动拾取
t.reset();
t.setPlayer(100);
t.spawnPickup('shield', 100, t.getPY());
t.stepPickups(0.016);
eq('拾取 🛡 护盾', t.getShield(), 1);
eq('护盾拾取后移除', t.getPickups(), 0);

// 5. 🚀 加速：加速期内每 tick 计时 +2
t.reset();
t.setBoost(8);
t.setObstacles([]);
t.tick();
eq('加速期计时 +2', t.getTime(), 2);
ok('加速仍在持续', t.getBoost() > 0);

// 6. 未碰撞不生效：仅生成不 apply，状态不变、掉落物仍在
t.reset();
t.setPlayer(100);
t.spawnPickup('heart', 10, 10);   // 远离玩家
t.stepPickups(0.016);
eq('未碰撞生命不变', t.getLives(), 1);
eq('未碰撞掉落物仍在', t.getPickups(), 1);

// 7. 回归：无 buff 时核心 1 命中即死逻辑不变
t.reset();
t.setPlayer(100);
t.setObstacles([{x:100,y:280,vy:10}]);
t.tick();
ok('无 buff 1 命中即死', t.isDead() === true);
