const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../fishing.html');

// 抛竿到鱼所在位置 → 咬钩 → 收线钓起
t.setFish([{id:1,x:50,y:50}]);
t.castAt(50,50);
ok('钩在鱼旁 → 咬钩', t.getBiting() === true);
const caught = t.reel();
eq('收线钓起该鱼', caught, 1);
eq('渔获+1', t.getScore(), 1);
eq('池塘中鱼被移除', t.getFish().length, 0);

// 抛竿到空水域(远离鱼) → 无咬钩 → 收线无获
t.setFish([{id:1,x:50,y:50}]);
t.castAt(0,0);
ok('钩旁无鱼 → 未咬钩', t.getBiting() === false);
eq('收线无获', t.reel(), null);
eq('渔获仍为0', t.getScore(), 0);

// ============ 注入：掉落道具 / 增益系统 ============
// 1) 金币：score +5
t.reset();
const f0 = t.getScore();
t.applyPickup('coin');
ok('钓鱼: 金币 score+5', t.getScore() === f0 + 5);

// 2) 护盾：+1
t.reset();
t.applyPickup('shield');
ok('钓鱼: 护盾 +1', t.getShield() === 1);

// 3) 加速：boostTimer>0
t.reset();
t.applyPickup('boost');
ok('钓鱼: 加速 boostTimer>0', t.getBoost() > 0);

// 4) 幸运：luckTimer>0
t.reset();
t.applyPickup('luck');
ok('钓鱼: 幸运 luckTimer>0', t.getLuck() > 0);

// 5) 集成：钩旁掉落物被拾取并生效，拾取后移除
t.reset();
t.castAt(100,100);
t.spawnPickup('coin',100,100);
const before = t.getPickups();
const s1 = t.getScore();
t.stepPickups(0);
ok('钓鱼: 拾取后从场上移除', t.getPickups() === before - 1, '剩 '+t.getPickups());
ok('钓鱼: 拾取金币 score+5', t.getScore() === s1 + 5);

// 6) 未碰撞不生效
t.reset();
t.castAt(100,100);
t.spawnPickup('coin',10,10);
const s2 = t.getScore();
t.stepPickups(0);
ok('钓鱼: 远处掉落物不拾取', t.getPickups() === 1);
ok('钓鱼: 未拾取 score 不变', t.getScore() === s2);

// 7) 护盾免死：有护盾受击不扣血、护盾被消耗
t.reset();
t.setShield(1);
const lives0 = t.getLives();
t.takeHit();
ok('钓鱼: 有护盾受击不扣血', t.getLives() === lives0);
ok('钓鱼: 护盾被消耗', t.getShield() === 0);

// 8) 无护盾受击：扣血
t.reset();
const lives1 = t.getLives();
t.takeHit();
ok('钓鱼: 无护盾受击扣血', t.getLives() === lives1 - 1);
ok('钓鱼: 无护盾护盾保持0', t.getShield() === 0);
