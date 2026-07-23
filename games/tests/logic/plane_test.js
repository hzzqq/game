// plane.html（飞机大战）逻辑单测
// 覆盖：DROP 表(6种)、rnd 范围、firePattern(power1-6弹道/rapid cd)、spawnEnemy(type/hp/score)、
// spawnBoss(hp随level)、maybeDrop(18%概率/type分配)、applyDrop(power/life/shield/rapid/bomb/heal)、
// hitPlayer(invuln/shield/扣血/血空损机)、loseLife、start(重置)、update(移动/开火/碰撞/道具拾取)
const { loadGame, ok, eq, results } = require('./harness');

let t;
try { t = loadGame('../plane.html').t; } catch (e) { console.error(e); process.exit(1); }

// ===== 1. DROP 表 =====
const D = t.DROP;
eq('DROP power', D.power, {c:'#f0b90b',g:'P'});
eq('DROP life', D.life, {c:'#02c076',g:'♥'});
eq('DROP shield', D.shield, {c:'#3aa0ff',g:'S'});
eq('DROP rapid', D.rapid, {c:'#ff8a96',g:'R'});
eq('DROP bomb', D.bomb, {c:'#f6465d',g:'B'});
eq('DROP heal', D.heal, {c:'#7CFC00',g:'+'});
eq('DROP 共6种', Object.keys(D).length, 6);

// ===== 2. rnd 范围 =====
for (let i=0;i<50;i++){
  const r = t.rnd(10, 20);
  ok('rnd(10,20) 在 [10,20)', r>=10 && r<20, 'r='+r);
}
for (let i=0;i<50;i++){
  const r = t.rnd(0, 1);
  ok('rnd(0,1) 在 [0,1)', r>=0 && r<1);
}

// ===== 3. firePattern =====
t.start();
// power=1 → 1 颗子弹
t.setBullets([]);
t.getPlayer().power = 1;
t.firePattern();
eq('firePattern power=1 1颗', t.getBullets().length, 1);
// power=2 → 2 颗
t.setBullets([]);
t.getPlayer().power = 2;
t.firePattern();
eq('firePattern power=2 2颗', t.getBullets().length, 2);
// power=3 → 3 颗
t.setBullets([]);
t.getPlayer().power = 3;
t.firePattern();
eq('firePattern power=3 3颗', t.getBullets().length, 3);
// power=4 → 5 颗
t.setBullets([]);
t.getPlayer().power = 4;
t.firePattern();
eq('firePattern power=4 5颗', t.getBullets().length, 5);
// power=5 → 5 颗
t.setBullets([]);
t.getPlayer().power = 5;
t.firePattern();
eq('firePattern power=5 5颗', t.getBullets().length, 5);
// power>=6 → 7 颗
t.setBullets([]);
t.getPlayer().power = 6;
t.firePattern();
eq('firePattern power=6 7颗', t.getBullets().length, 7);
t.setBullets([]);
t.getPlayer().power = 99;
t.firePattern();
eq('firePattern power=99 7颗(默认)', t.getBullets().length, 7);
// 子弹向上飞（vy 为负）
ok('firePattern 子弹向上(vy<0)', t.getBullets().every(b => b.vy < 0));

// ===== 4. spawnEnemy =====
t.start();
t.setEnemies([]);
t.spawnEnemy();
eq('spawnEnemy 生成1只', t.getEnemies().length, 1);
const e = t.getEnemies()[0];
ok('spawnEnemy type 合法', ['basic','shooter','zig','tank'].indexOf(e.type)>=0, 'type='+e.type);
ok('spawnEnemy hp>0', e.hp > 0);
ok('spawnEnemy maxhp=hp', e.maxhp === e.hp);
ok('spawnEnemy r 在[14,20]', e.r>=14 && e.r<=20);
ok('spawnEnemy y 初始负(屏幕外)', e.y < 0);
ok('spawnEnemy vy>0(下移)', e.vy > 0);
ok('spawnEnemy score>0', e.score > 0);
// 多次生成
t.setEnemies([]);
for (let i=0;i<20;i++) t.spawnEnemy();
eq('spawnEnemy 20只', t.getEnemies().length, 20);

// ===== 5. spawnBoss =====
t.start();
t.setLevel(1);
t.setBoss(null);
t.spawnBoss();
const b1 = t.getBoss();
ok('spawnBoss 生成', !!b1);
eq('spawnBoss level1 hp=80', b1.hp, 80);
eq('spawnBoss level1 maxhp=80', b1.maxhp, 80);
eq('spawnBoss r=46', b1.r, 46);
eq('spawnBoss entering=true', b1.entering, true);
ok('spawnBoss y 初始负', b1.y < 0);
// level 3 → hp 160
t.setLevel(3);
t.setBoss(null);
t.spawnBoss();
eq('spawnBoss level3 hp=160', t.getBoss().hp, 160);
// level 5 → hp 240
t.setLevel(5);
t.setBoss(null);
t.spawnBoss();
eq('spawnBoss level5 hp=240', t.getBoss().hp, 240);

// ===== 6. maybeDrop =====
t.start();
t.setDrops([]);
let dropCount = 0;
for (let i=0;i<500;i++){
  t.setDrops([]);
  t.maybeDrop(100, 100);
  if (t.getDrops().length === 1) dropCount++;
}
// 18% 概率，500 次应落在 [60, 120] 区间
ok('maybeDrop 约18%触发', dropCount > 50 && dropCount < 150, 'dropCount='+dropCount);
// 触发时 type 合法
t.setDrops([]);
let attempts = 0;
while (t.getDrops().length === 0 && attempts < 100){ t.maybeDrop(0,0); attempts++; }
if (t.getDrops().length > 0){
  const dt = t.getDrops()[0].type;
  ok('maybeDrop type 合法', ['power','life','shield','rapid','bomb','heal'].indexOf(dt)>=0, 'type='+dt);
}

// ===== 7. applyDrop 各效果 =====
t.start();
// power
t.getPlayer().power = 1;
t.applyDrop('power');
eq('applyDrop power +1', t.getPlayer().power, 2);
t.applyDrop('power');
eq('applyDrop power 上限6', t.getPlayer().power, 3);
t.getPlayer().power = 5;
t.applyDrop('power');
eq('applyDrop power 上限6不超', t.getPlayer().power, 6);
t.applyDrop('power');
eq('applyDrop power 已满不再加', t.getPlayer().power, 6);
// life
t.start();
t.getPlayer().lives = 1;
t.applyDrop('life');
eq('applyDrop life +1', t.getPlayer().lives, 2);
t.getPlayer().lives = 4;
t.applyDrop('life');
eq('applyDrop life 上限5', t.getPlayer().lives, 5);
t.applyDrop('life');
eq('applyDrop life 已满不再加', t.getPlayer().lives, 5);
// shield
t.start();
t.getPlayer().shield = 0;
t.applyDrop('shield');
eq('applyDrop shield=6', t.getPlayer().shield, 6);
// rapid
t.getPlayer().rapid = 0;
t.applyDrop('rapid');
eq('applyDrop rapid=6', t.getPlayer().rapid, 6);
// heal
t.getPlayer().hp = 50;
t.applyDrop('heal');
eq('applyDrop heal +40', t.getPlayer().hp, 90);
t.applyDrop('heal');
eq('applyDrop heal 上限maxhp', t.getPlayer().hp, t.getPlayer().maxhp);
// bomb
t.start();
t.setEnemies([{x:0,y:0,hp:1,score:10},{x:10,y:10,hp:1,score:15}]);
t.setEBullets([{x:0,y:0},{x:10,y:10}]);
const scoreBefore = t.getScore();
t.applyDrop('bomb');
eq('applyDrop bomb 清空敌人', t.getEnemies().length, 0);
eq('applyDrop bomb 清空敌弹', t.getEBullets().length, 0);
ok('applyDrop bomb 加分', t.getScore() > scoreBefore);

// ===== 8. hitPlayer =====
t.start();
// 基础扣血
const hp0 = t.getPlayer().hp;
t.hitPlayer(30);
eq('hitPlayer 扣30血', t.getPlayer().hp, hp0 - 30);
// invuln 无伤
t.getPlayer().invuln = 1;
const hp1 = t.getPlayer().hp;
t.hitPlayer(50);
eq('hitPlayer invuln无伤', t.getPlayer().hp, hp1);
// shield 格挡
t.getPlayer().invuln = 0;
t.getPlayer().shield = 5;
const hp2 = t.getPlayer().hp;
t.hitPlayer(50);
eq('hitPlayer shield格挡不扣血', t.getPlayer().hp, hp2);
// 血空损机
t.start();
t.getPlayer().hp = 10;
t.getPlayer().lives = 3;
t.hitPlayer(100);
ok('hitPlayer 血空后 hp 回满', t.getPlayer().hp === t.getPlayer().maxhp);
eq('hitPlayer 血空损机 lives-1', t.getPlayer().lives, 2);
ok('hitPlayer 损机后 invuln>0', t.getPlayer().invuln > 0);
// lives 归 0 → gameOver
t.start();
t.getPlayer().lives = 1;
t.getPlayer().hp = 5;
t.hitPlayer(100);
ok('hitPlayer lives归0 over=true', t.getOver());

// ===== 9. loseLife =====
t.start();
t.getPlayer().lives = 3;
t.loseLife();
eq('loseLife lives-1', t.getPlayer().lives, 2);
ok('loseLife invuln>0', t.getPlayer().invuln > 0);
t.loseLife();
eq('loseLife lives-2', t.getPlayer().lives, 1);
t.loseLife();
ok('loseLife lives=0 over', t.getOver());

// ===== 10. start 重置 =====
t.start();
// 改乱状态
t.getPlayer().hp = 10;
t.getPlayer().lives = 0;
t.getPlayer().power = 6;
t.setScore(999);
t.setLevel(5);
t.setEnemies([{x:0,y:0}]);
t.setBullets([{x:0,y:0}]);
t.setDrops([{x:0,y:0}]);
t.setOver(true);
// 重新 start
t.start();
eq('start 重置 hp=maxhp', t.getPlayer().hp, t.getPlayer().maxhp);
eq('start 重置 lives=3', t.getPlayer().lives, 3);
eq('start 重置 power=1', t.getPlayer().power, 1);
eq('start 重置 score=0', t.getScore(), 0);
eq('start 重置 level=1', t.getLevel(), 1);
eq('start 重置 enemies空', t.getEnemies().length, 0);
eq('start 重置 bullets空', t.getBullets().length, 0);
eq('start 重置 drops空', t.getDrops().length, 0);
ok('start 重置 over=false', !t.getOver());
ok('start 重置 boss=null', !t.getBoss());
ok('start 重置 running=true', t.getRunning());

// ===== 11. update 基本流程 =====
t.start();
// update(0.016) 不报错
t.setRunning(true);
t.setOver(false);
t.setPaused(false);
t.update(0.016);
ok('update 不报错', true);
// 多次 update 应生成敌人（spawnT 递减）
t.setSpawnT(0.01);
t.setEnemies([]);
t.setBoss(null);
for (let i=0;i<5;i++) t.update(0.02);
ok('update 生成敌人', t.getEnemies().length > 0 || t.getBoss() !== null);
// 道具拾取
t.start();
t.setDrops([{x:t.getPlayer().x, y:t.getPlayer().y, type:'heal'}]);
t.getPlayer().hp = 50;
t.update(0.02);
eq('update 道具拾取后 drops空', t.getDrops().length, 0);
ok('update 道具拾取 heal +40', t.getPlayer().hp >= 90);

// ===== 12. update 碰撞：玩家子弹 vs 敌人 =====
t.start();
t.setRunning(true);
t.setPaused(false);
t.setOver(false);
t.setBoss(null);
t.setBullets([{x:100,y:100,vx:0,vy:-600,r:4,dmg:1}]);
t.setEnemies([{x:100,y:100,vy:0,hp:1,maxhp:1,r:20,type:'basic',score:10,shootT:1,phase:0,baseX:100}]);
const sb = t.getScore();
t.update(0.016);
// 敌人被击杀
ok('update 子弹击杀敌人', t.getEnemies().length === 0 || t.getEnemies()[0].hp <= 0);
ok('update 击杀加分', t.getScore() > sb);

// ===== 13. update 碰撞：敌弹 vs 玩家 =====
t.start();
t.setRunning(true);
t.setPaused(false);
t.setOver(false);
t.setBoss(null);
t.setEnemies([]);
t.setEBullets([{x:t.getPlayer().x, y:t.getPlayer().y, vx:0, vy:0, r:5}]);
t.getPlayer().invuln = 0;
t.getPlayer().shield = 0;
const hpB = t.getPlayer().hp;
t.update(0.016);
ok('update 敌弹击中玩家扣血', t.getPlayer().hp < hpB || t.getPlayer().invuln > 0);

// ===== 14. 注入：胶囊掉落 / 增益（确定性，经 __t 钩子驱动） =====
t.start();
t.reset();
// 14a power 拾取 +1 火力（注入 capPower）
const px = t.getPlayer().x, py = t.getPlayer().y;
t.spawnPickup('power', px, py);
eq('胶囊 power 已生成', t.getPickups().length, 1);
t.stepPickups(0.001);
eq('胶囊 power 拾取后移除', t.getPickups().length, 0);
ok('胶囊 power 增益 capPower=2', t.getCapPower() === 2);
// 14b shield 拾取 → capShield true
t.reset();
t.spawnPickup('shield', px, py);
t.stepPickups(0.001);
eq('胶囊 shield 拾取 capShield', t.getShield(), true);
// 14c boost 拾取 → capBoost=6
t.reset();
t.spawnPickup('boost', px, py);
t.stepPickups(0.001);
eq('胶囊 boost 拾取 capBoost=6', t.getBoost(), 6);
// 14d 远处胶囊：无碰撞不生效、不移除
t.reset();
t.spawnPickup('power', 50, 50);
const cp0 = t.getCapPower();
t.stepPickups(0.001);
eq('胶囊 远处不移除', t.getPickups().length, 1);
ok('胶囊 远处不生效', t.getCapPower() === cp0);
// 14e 护盾挡死：生命不变、护盾消耗
t.reset();
t.setShield(true);
const cl0 = t.getCapLives();
t.takeHit(5);
eq('胶囊 护盾挡死 生命不变', t.getCapLives(), cl0);
eq('胶囊 护盾挡死 已消耗', t.getShield(), false);
// 14f 无护盾损命，归零置 dead
t.reset();
t.setShield(false);
const cl1 = t.getCapLives();
t.takeHit(1);
eq('胶囊 无护盾 生命-1', t.getCapLives(), cl1 - 1);
t.takeHit(99);
ok('胶囊 生命归零 capDead', t.getCapDead() === true);

// ===== 15. 多阶段 Boss 系统（标准钩子 + 增强）=====
t.start();
t.setBoss(null);
// 15a BOSS_EVERY / isBossWave
ok('BOSS_EVERY 为正数', t.BOSS_EVERY > 0, 'BOSS_EVERY='+t.BOSS_EVERY);
ok('isBossWave(0)=false', t.isBossWave(0) === false);
ok('isBossWave(BOSS_EVERY)=true', t.isBossWave(t.BOSS_EVERY) === true);
ok('isBossWave(2*BOSS_EVERY)=true', t.isBossWave(t.BOSS_EVERY*2) === true);
ok('isBossWave(BOSS_EVERY-1)=false', t.isBossWave(t.BOSS_EVERY-1) === false);

// 15b spawnBoss hp===maxHp + 初始 phase2=false
t.setLevel(1);
t.setBoss(null);
t.spawnBoss();
const b0 = t.getBoss();
ok('spawnBoss 生成', !!b0);
eq('spawnBoss hp===maxHp', b0.hp, b0.maxhp);
ok('spawnBoss 初始 phase2=false', b0.phase2 === false);

// 15c 半血进入 phase2
t.setBossHp(Math.floor(b0.maxhp/2));
t.updateBoss(0.016);
const bHalf = t.getBoss();
ok('半血触发 phase2', !!bHalf && bHalf.phase2 === true);

// 15d updateBoss 击败返回 true + 奖励（加分 + 掉落 + 进关）
t.start();
t.setLevel(2);
t.setBoss(null);
t.spawnBoss();
const bd = t.getBoss();
const scBefore = t.getScore();
const lvBefore = t.getLevel();
const dropsBefore = t.getDrops().length;
t.setBossHp(1);
t.addBullet(bd.x, bd.y);            // 必中子弹置于 boss 中心
const defeated = t.updateBoss(0.016);
ok('updateBoss 击败返回 true', defeated === true);
ok('updateBoss 击败后 boss=null', t.getBoss() === null);
eq('updateBoss 击败加分 +500', t.getScore(), scBefore + 500);
eq('updateBoss 击败关卡 +1', t.getLevel(), lvBefore + 1);
ok('updateBoss 击败掉落', t.getDrops().length > dropsBefore);

// 15e update() boss 分支：击败经由 update 触发
t.start();
t.setRunning(true); t.setOver(false); t.setPaused(false);
t.setLevel(1);
t.setBoss(null);
t.spawnBoss();
const b2 = t.getBoss();
b2.entering=false; b2.y=200;          // 移到屏内，避免被 y>-20 剔除
const sc2 = t.getScore();
t.setBossHp(1);
t.addBullet(b2.x, b2.y);
t.update(0.016);
ok('update() boss 分支击败 boss=null', t.getBoss() === null);
eq('update() boss 分支加分 +500', t.getScore(), sc2 + 500);

// 15f 接触玩家伤害
t.start();
t.setBoss(null);
t.spawnBoss();
const bf = t.getBoss();
t.getPlayer().invuln = 0; t.getPlayer().shield = 0;
bf.x = t.getPlayer().x; bf.y = t.getPlayer().y; bf.entering = false;
const hpBf = t.getPlayer().hp;
t.updateBoss(0.016);
ok('接触玩家伤害 hp 下降', t.getPlayer().hp < hpBf);

// ===== 汇总 =====
const passed = results.filter(r=>r.pass).length;
const total = results.length;
console.log(`\nplane: ${passed}/${total} 通过`);
if (passed !== total) {
  results.filter(r=>!r.pass).forEach(r => console.log(`  ✗ ${r.name}  ${r.info}`));
  process.exit(1);
}
