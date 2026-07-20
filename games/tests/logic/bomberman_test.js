const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../bomberman.html');

// 空场十字爆破，范围2 → 中心 + 上下左右各2格 = 9 格
t.setup(5,5,[]);
t.setRange(2);
t.setBomb(2,2);
let blast = t.explode();
ok('十字爆破覆盖 9 格', blast.length === 9);
ok('爆破包含 (0,2)', blast.some(([r,c])=>r===0&&c===2));
ok('爆破包含 (4,2)', blast.some(([r,c])=>r===4&&c===2));

// 砖块阻挡：右侧砖块 (2,3) 吸收爆炸，其后 (2,4) 不在爆破范围
t.setup(5,5,[[2,3]]);
t.setRange(2);
t.setBomb(2,2);
blast = t.explode();
ok('砖块被炸毁并吸收', blast.some(([r,c])=>r===2&&c===3));
ok('砖块后格不在爆破范围', !blast.some(([r,c])=>r===2&&c===4));

// 击杀：玩家站在 (2,3) 爆炸范围内 → 死亡
t.setup(5,5,[]);
t.setRange(2);
t.setBomb(2,2);
t.setPlayers([{x:2,y:3}]);
t.explode();
ok('范围内玩家所在格处于爆破中', t.inBlast(2,3) === true);
