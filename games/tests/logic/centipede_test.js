const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../centipede.html');

// 初始态
t.reset(4242);
ok('centipede: 初始未结束', t.isGameOver() === false);
const s0 = t.getState();
ok('centipede: 初始蜈蚣有 10 节', s0.centipede.length === 10, 'len=' + s0.centipede.length);
ok('centipede: 初始有蘑菇', s0.mushrooms.length > 0, 'mush=' + s0.mushrooms.length);

// step 推进蜈蚣（无阻挡）
t.reset(1);
t.setMushrooms([]);
t.setCentipede([{ row: 0, col: 0, dir: 1 }]);
t.step();
eq('centipede: step 推进一段(0,0)→(0,1)', t.getState().centipede[0], { row: 0, col: 1, dir: 1 });

// shoot 击中分段：蜈蚣减少、蘑菇增加
t.reset(2);
t.setMushrooms([]);
t.setCentipede([{ row: 5, col: 5, dir: 1 }, { row: 5, col: 6, dir: 1 }]);
const mushBefore = t.getState().mushrooms.length;
t.setBullets([{ row: 6, col: 5 }]);   // 子弹上移一格后撞上第一节(5,5)
t.step();
const after = t.getState();
ok('centipede: 击中后蜈蚣少一节', after.centipede.length === 1, 'len=' + after.centipede.length);
ok('centipede: 击中后生成蘑菇(+1)', after.mushrooms.length === mushBefore + 1, 'before=' + mushBefore + ' after=' + after.mushrooms.length);

// 子弹击中蘑菇 → 蘑菇被移除
t.reset(3);
t.setMushrooms([[5, 5]]);
t.setCentipede([]);
t.setBullets([{ row: 6, col: 5 }]);
t.step();
ok('centipede: 子弹击碎蘑菇', t.getState().mushrooms.length === 0, 'mush=' + t.getState().mushrooms.length);

// 玩家被击中 → 游戏结束
t.reset(4);
t.setMushrooms([]);
t.setPlayer(10, 5);
t.setCentipede([{ row: 10, col: 4, dir: 1 }]);   // 右移后正好到玩家格
t.step();
ok('centipede: 蜈蚣碰到玩家 → 结束', t.isGameOver() === true);

// 蜈蚣撞墙/蘑菇 → 下移并反向（不越界、不崩溃）
t.reset(5);
t.setMushrooms([]);
t.setCentipede([{ row: 0, col: 14, dir: 1 }]);   // 最右列向右会撞墙
t.step();
const s = t.getState().centipede[0];
ok('centipede: 撞墙后下移到 row1', s.row === 1, 'row=' + s.row);
ok('centipede: 撞墙后方向反向', s.dir === -1, 'dir=' + s.dir);

// 两个种子 → 初始蘑菇布局不同（≥2 种子）
t.reset(555); const a = JSON.stringify(t.getState().mushrooms);
t.reset(666); const b = JSON.stringify(t.getState().mushrooms);
ok('centipede: 两个种子蘑菇布局不同', a !== b);
