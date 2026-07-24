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

// ===== 道具系统（P2） =====
t.reset(7);
const sc0 = t.getScore();
t.applyPickup('coin');
ok('centipede: 金币加分 +50', t.getScore() === sc0 + 50, 'score=' + t.getScore());
t.applyPickup('shield');
ok('centipede: 护盾 +1', t.getShield() === 1, 'shield=' + t.getShield());
t.applyPickup('rapid');
ok('centipede: 连射计时 >0', t.getRapid() > 0, 'rapid=' + t.getRapid());

// 散射：一发 shoot 出 3 颗子弹
t.reset(8);
t.setSpread(5);
t.setPlayer(18, 7);
t.shoot();
ok('centipede: 散射时 shoot 出 3 颗子弹', t.getState().bullets.length === 3, 'n=' + t.getState().bullets.length);

// 连射：step 自动开火
t.reset(9);
t.setRapid(3);
t.setPlayer(18, 7);
t.step();
ok('centipede: 连射期间 step 自动产生子弹', t.getState().bullets.length > 0, 'n=' + t.getState().bullets.length);

// 护盾免一次死（蜈蚣撞玩家）；无护盾死亡已由上方"蜈蚣碰到玩家→结束"覆盖
t.reset(4);
t.setMushrooms([]); t.setPlayer(10, 5);
t.setCentipede([{ row: 10, col: 4, dir: 1 }]);
t.setShield(1);
t.step();
ok('centipede: 有护盾时蜈蚣撞玩家不死', t.isGameOver() === false, 'shield=' + t.getShield());
ok('centipede: 护盾被消耗', t.getShield() === 0);

// 移动到道具格拾取
t.reset(10);
t.setPlayer(10, 3);
t.spawnPickup('shield', 10, 3);
t.move('right'); // 仍在同一格？(10,3)→(10,4) 偏移；改为 spawn 在目标格
t.setPlayer(10, 3);
t.spawnPickup('shield', 9, 3);
t.move('up'); // →(9,3)
ok('centipede: 移动到道具格拾取护盾', t.getShield() === 1, 'shield=' + t.getShield());

// ===== Boss 系统（B4 蜈蚣女王） =====
// isBossWave 判定 + BOSS_EVERY 常量
ok('centipede: BOSS_EVERY === 3', t.BOSS_EVERY === 3);
ok('centipede: isBossWave(0) === false', t.isBossWave(0) === false);
ok('centipede: isBossWave(1) === false', t.isBossWave(1) === false);
ok('centipede: isBossWave(3) === true', t.isBossWave(3) === true);
ok('centipede: isBossWave(4) === false', t.isBossWave(4) === false);
ok('centipede: isBossWave(6) === true', t.isBossWave(6) === true);
ok('centipede: isBossWave(9) === true', t.isBossWave(9) === true);

// spawnBoss：生成 Boss、清空普通蜈蚣、HP 随波缩放
t.reset(11);
t.setWave(1);
t.spawnBoss();
ok('centipede: spawnBoss 后存在 boss', t.getBoss() !== null);
ok('centipede: spawnBoss 清空普通蜈蚣', t.getState().centipede.length === 0, 'len=' + t.getState().centipede.length);
const b1 = t.getBoss();
ok('centipede: boss 初始满血', b1.hp === b1.maxHp, 'hp=' + b1.hp + ' max=' + b1.maxHp);
ok('centipede: wave1 boss maxHp = round(28+1*6)=34', b1.maxHp === Math.round(28 + 1*6), 'max=' + b1.maxHp);

t.setWave(3);
t.spawnBoss();
const b3 = t.getBoss();
ok('centipede: wave3 boss maxHp = round(28+3*6)=46', b3.maxHp === Math.round(28 + 3*6), 'max=' + b3.maxHp);

// 玩家子弹命中 → 扣血
t.reset(12);
t.setWave(1);
t.spawnBoss();
const hp0 = t.getBoss().hp;
const g = t.getBoss();
const midC = g.col + Math.floor(g.w/2);
t.addBullet(g.row + g.h, midC);   // 上移一格后正好落入 boss 底边
t.updateBoss();
ok('centipede: 玩家子弹命中 boss 扣 1 血', t.getBoss().hp === hp0 - 1, 'before=' + hp0 + ' after=' + t.getBoss().hp);

// 半血进入 phase2
t.reset(13);
t.setWave(1);
t.spawnBoss();
const g2 = t.getBoss();
t.setBossHp(g2.maxHp / 2);
t.updateBoss();
ok('centipede: 半血进入 phase2', t.getBoss().phase === 2, 'phase=' + t.getBoss().phase);

// 击败：score += 100*wave、掉落 rapid、boss 置空、返回 true
t.reset(14);
t.setWave(2);
const scBefore = t.getScore();
t.spawnBoss();
t.setBossHp(0);
const beaten = t.updateBoss();
ok('centipede: 击败 boss 返回 true', beaten === true);
ok('centipede: 击败后 boss 置空', t.getBoss() === null);
ok('centipede: 击败奖励 score += 100*wave', t.getScore() === scBefore + 100*2, 'score=' + t.getScore());
ok('centipede: 击败掉落 rapid 道具', t.getState().pickups.some(p => p.type === 'rapid'));

// 普通波清空 → 第 3 波(每 BOSS_EVERY)出 Boss，且不刷普通蜈蚣
t.reset(15);
t.setWave(2);
t.setCentipede([]);
t.setBullets([]);
t.step();   // 推进到第 3 波并 spawnBoss
ok('centipede: 第 3 波出 Boss', t.getBoss() !== null, 'boss=' + t.getBoss());
ok('centipede: 第 3 波 wave === 3', t.getWave() === 3, 'wave=' + t.getWave());
ok('centipede: boss 波不刷普通蜈蚣', t.getState().centipede.length === 0);

// 击败 Boss 后（在 step 内）进下一波普通蜈蚣
t.reset(16);
t.setWave(2);
t.setCentipede([]);
t.step();                 // → wave3 出 Boss
ok('centipede: 先到第 3 波 Boss', t.getBoss() !== null && t.getWave() === 3);
t.setBossHp(0);
t.step();                 // step 内 updateBoss 击败 → wave4 + buildCentipede
ok('centipede: 击败 Boss 返回 true 且进入第 4 波普通蜈蚣',
   t.getBoss() === null && t.getWave() === 4 && t.getState().centipede.length === 10,
   'wave=' + t.getWave() + ' centi=' + t.getState().centipede.length);

// ===== 过关 confetti 钩子（独立于 Juice，只读） =====
t.reset(31);
t.setCentipede([]);
t.setBullets([]);
t.step();   // 清空整条蜈蚣 → 过关
ok('centipede: 过关 confettiFired 置真', t.confettiFired() === true);
// 二次 step 不重复触发（跳变防重复），钩子仍为真
t.setMushrooms([]); t.setPlayer(10, 5); t.setCentipede([{ row:10, col:4, dir:1 }]); t.step();
ok('centipede: confettiFired 不被重复置位（保持真）', t.confettiFired() === true);

const H = require('./harness');
if (H.results.some(r => !r.pass)) process.exit(1);
process.exit(0);

