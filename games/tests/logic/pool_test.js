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
