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

// 回归：非对称布弹的爆炸中心与方向必须正确（曾因 x/y 写反整体转置）
t.setup(8,8,[]);
t.setRange(2);
t.setBomb(3,1);               // bombs.x=列3, bombs.y=行1 → 棋盘格 (行1,列3)
blast = t.explode();
ok('炸弹自身格 (行1,列3) 在爆破中', blast.some(([r,c])=>r===1&&c===3));
ok('右侧 (行1,列4) 在爆破中', blast.some(([r,c])=>r===1&&c===4));
ok('下方 (行2,列3) 在爆破中', blast.some(([r,c])=>r===2&&c===3));
ok('错误转置格 (行3,列1) 不应在爆破中', !blast.some(([r,c])=>r===3&&c===1));

// ===== 注入式掉落道具系统（确定性驱动，不依赖随机自动掉落）=====
// 1. 范围+ 掉落：玩家站在掉落格上自动拾取，范围 +1
t.setup(5,5,[]);
t.setRange(2);
t.spawnPickup('range', 2, 3);   // 掉落格 (行2,列3)
eq('生成 1 个掉落物', t.getPickups(), 1);
t.setPlayers([{x:3, y:2}]);     // 玩家位于该格 (x=列3, y=行2)
t.stepPickups(0.016);
eq('拾取 💣 范围+ → 范围变为 3', t.getRange(), 3);
eq('拾取后掉落物移除', t.getPickups(), 0);

// 2. 金币掉落：拾取加分
t.setup(5,5,[]);
t.spawnPickup('coin', 1, 1);
t.setPlayers([{x:1, y:1}]);
t.stepPickups(0.016);
eq('拾取 💰 金币 +50 分', t.getScore(), 50);
eq('金币拾取后移除', t.getPickups(), 0);

// 3. 未碰撞不生效：无玩家在该格则不拾取、范围/分数不变
t.setup(5,5,[]);
t.setRange(2);
t.spawnPickup('range', 2, 3);
t.stepPickups(0.016);   // 默认无玩家在该格
eq('未碰撞范围不变', t.getRange(), 2);
eq('未碰撞掉落物仍在', t.getPickups(), 1);

// 4. 回归：爆破原点块被炸毁的掉落不影响爆破判定
t.setup(5,5,[[2,3]]);
t.setRange(2);
t.setBomb(2,2);
const b2 = t.explode();
ok('砖块被炸毁吸收（掉落不影响爆破）', b2.some(([r,c])=>r===2&&c===3));
ok('砖块后格不在爆破范围', !b2.some(([r,c])=>r===2&&c===4));
