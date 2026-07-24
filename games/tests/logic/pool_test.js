const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../pool.html');

// 母球在 (200,120) 向上击打，击中上方 (200,60) 的目标球，后者被撞入顶部中袋
t.reset();
t.setCue(200,120);
t.setBalls([{id:1,x:200,y:60}]);
t.shoot(-90,100);
ok('被击中的目标球入袋', t.getPocketed().indexOf(1) !== -1);
ok('母球未入袋', t.getPocketed().indexOf('cue') === -1);

// 力度不足：母球未触及目标球 → 无球入袋，目标球仍在原位
t.reset();
t.setCue(0,120);
t.setBalls([{id:1,x:300,y:120}]);
t.shoot(0,5); // 仅移动约 7.5，够不到相距300的目标
eq('力度不足未击球 → 目标球未动', t.getBalls()[0].x, 300);
ok('力度不足无球入袋', t.getPocketed().length === 0);

// ===== 注入：掉落道具 / 增益（确定性驱动）=====
t.reset();
eq('初始无掉落', t.getPickups().length, 0);
eq('初始金币0', t.getCoins(), 0);
t.applyPickup('coin');
eq('金币+50', t.getCoins(), 50);

// 行进中拾取：掉落放在母球上行路径上
t.reset();
t.setCue(200,120);
t.setBalls([{id:1,x:200,y:60}]);
t.spawnPickup('coin',200,90); // 母球向上行进经过
t.shoot(-90,100);
eq('行进中拾取金币', t.getCoins(), 50);
eq('进球判定不受影响', t.getPocketed().indexOf(1) !== -1, true);
eq('拾取后掉落移除', t.getPickups().length, 0);

// 远离路径不拾取
t.reset();
t.setCue(200,120);
t.setBalls([{id:1,x:200,y:60}]);
t.spawnPickup('coin',50,200); // 远离上行路径
t.shoot(-90,100);
eq('远离未拾取', t.getCoins(), 0);

// 瞄准增益计时
t.reset();
t.applyPickup('aim');
ok('瞄准计时>0', t.getBoost() > 0);
t.stepPickups(6);
eq('瞄准计时归零', t.getBoost(), 0);

// ===== 胜利 confetti：清台（目标球全部入袋） =====
t.reset();
eq('胜利前 confettiFired 为 false', t.confettiFired(), false);
t.setCue(200,60);
t.setBalls([{id:1,x:200,y:10}]);
t.shoot(-90,100);
ok('清台：目标球入袋', t.getPocketed().indexOf(1)!==-1);
eq('清台触发 confettiFired', t.confettiFired(), true);
