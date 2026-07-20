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
