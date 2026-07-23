const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../frogger.html');

t.reset();
// 马路上青蛙与车错开 → 安全
t.setRow(5,'road');
t.setObstacles(5,[3]);
t.setFrog(5,1);
t.setRowSpeed(5,0); // 静止便于判定
t.tick(1);
ok('车不在青蛙格 → 安全', t.isDead() === false);

// 青蛙与车同格 → 被撞死
t.setFrog(5,3);
t.tick(1);
ok('车在青蛙格 → 死亡', t.isDead() === true);

// 河面有浮木 → 踩木安全
t.reset();
t.setRow(5,'water');
t.setObstacles(5,[3]);
t.setFrog(5,3);
t.setRowSpeed(5,0);
t.tick(1);
ok('踩在浮木上 → 安全', t.isDead() === false);

// 河面无浮木 → 落水
t.setObstacles(5,[]);
t.setFrog(5,3);
t.tick(1);
ok('河面无浮木 → 落水死亡', t.isDead() === true);

// 到达终点
t.reset();
t.setFrog(0,5);
ok('处于第0行 → 到达终点', t.isGoal() === true);

// 回归：踩浮木被带出右边界应落水身亡，且 frog.col 不越界（曾无边界判定被带出棋盘）
t.reset();
t.setRow(2,'water');
t.setRowDir(2,1);
t.setRowSpeed(2,1);
t.setObstacles(2,[8]);
t.setFrog(2,8);
let maxCol=8;
for(let i=0;i<60;i++){ t.tick(0.1); const f=t.getFrog(); if(f.col>maxCol)maxCol=f.col; if(t.isDead())break; }
ok('被浮木带出右边界 → 落水身亡', t.isDead() === true);
ok('frog.col 不超过棋盘边界 (<=COLS-1)', maxCol <= 10, 'maxCol='+maxCol);
// 左边界同理
t.reset();
t.setRow(2,'water');
t.setRowDir(2,-1);
t.setRowSpeed(2,1);
t.setObstacles(2,[2]);
t.setFrog(2,2);
let minCol=2;
for(let i=0;i<60;i++){ t.tick(0.1); const f=t.getFrog(); if(f.col<minCol)minCol=f.col; if(t.isDead())break; }
ok('被浮木带出左边界 → 落水身亡', t.isDead() === true);
ok('frog.col 不低于 0', minCol >= 0, 'minCol='+minCol);

// ============ 注入：掉落道具 / 增益系统 ============
// 1) 金币：score +5
t.reset();
const f0 = t.getScore();
t.applyPickup('coin');
ok('青蛙: 金币 score+5', t.getScore() === f0 + 5);

// 2) 护盾：+1
t.reset();
t.applyPickup('shield');
ok('青蛙: 护盾 +1', t.getShield() === 1);

// 3) 加速：boostTimer>0
t.reset();
t.applyPickup('boost');
ok('青蛙: 加速 boostTimer>0', t.getBoost() > 0);

// 4) 回血：lives +1
t.reset();
t.setLives(1);
t.applyPickup('heart');
ok('青蛙: 回血 lives+1', t.getLives() === 2);

// 5) 集成：青蛙走到掉落物所在格 → 被拾取并生效
t.reset();
t.setFrog(5,1);
t.spawnPickup('coin',5,1);
const before = t.getPickups();
const s1 = t.getScore();
t.stepPickups(0);
ok('青蛙: 踩中掉落物后移除', t.getPickups() === before - 1, '剩 '+t.getPickups());
ok('青蛙: 拾取金币 score+5', t.getScore() === s1 + 5);

// 6) 未踩中：不相领格不拾取
t.reset();
t.setFrog(5,1);
t.spawnPickup('coin',2,2);
const s2 = t.getScore();
t.stepPickups(0);
ok('青蛙: 远处掉落物不拾取', t.getPickups() === 1);
ok('青蛙: 未拾取 score 不变', t.getScore() === s2);

// 7) 护盾免死：有护盾受创不死亡、护盾被消耗
t.reset();
t.setShield(1);
t.takeHit();
ok('青蛙: 有护盾受创不死', t.isDead() === false);
ok('青蛙: 护盾被消耗', t.getShield() === 0);

// 8) 无护盾受创：死亡（扣命至 0）
t.reset();
t.takeHit();
ok('青蛙: 无护盾受创死亡', t.isDead() === true);
ok('青蛙: 死亡时 lives=0', t.getLives() === 0);

// ============ 道具系统（按任务规范增强块） ============
// 新增适配道具：🪰苍蝇(fly) 作为计分掉落物
t.reset();
const fFly = t.getScore();
t.applyPickup('fly');
ok('青蛙: 苍蝇(fly) 计分 score+5', t.getScore() === fFly + 5);

// collectPickups 钩子：踩中所在格即拾取并移除
t.reset();
t.setFrog(5,1);
t.spawnPickup('fly',5,1);
const nBefore = t.getPickups();
const sBefore = t.getScore();
t.collectPickups();
ok('青蛙: collectPickups 拾取后移除', t.getPickups() === nBefore - 1, '剩 '+t.getPickups());
ok('青蛙: collectPickups 苍蝇加分', t.getScore() === sBefore + 5);

// 远处道具不被 collectPickups 拾取
t.reset();
t.setFrog(5,1);
t.spawnPickup('fly',2,2);
t.collectPickups();
ok('青蛙: 远处道具 collectPickups 不拾取', t.getPickups() === 1);

// 移动到道具格拾取（move 触发 updatePickups → collectPickups）
t.reset();
t.setFrog(5,2);
t.spawnPickup('shield',5,1);
t.move('left'); // → (5,1)
ok('青蛙: 移动到道具格拾取护盾', t.getShield() === 1, 'shield='+t.getShield());

// 护盾免一次死 + 无盾失败行为不变
t.reset();
t.setShield(1);
t.takeHit();
ok('青蛙: 有护盾受创不死', t.isDead() === false);
ok('青蛙: 护盾被消耗', t.getShield() === 0);
t.takeHit(); // 无盾再受创
ok('青蛙: 无盾再受创死亡', t.isDead() === true);

// ============ 难度系统（倍率法；normal=1.0 保持现有行为） ============
// 默认普通档
t.reset();
ok('青蛙: 默认难度为 normal', t.getDifficulty() === 'normal');

// DIFFICULTY 含四档配置
ok('青蛙: DIFFICULTY 含四档', !!(t.DIFFICULTY && t.DIFFICULTY.easy && t.DIFFICULTY.normal && t.DIFFICULTY.hard && t.DIFFICULTY.hell));

// 地狱档速度 > 简单档速度（speedMult 生效）
t.setDifficulty('easy'); t.reset();
const se = t.getRowSpeed(7);   // 马路行基准速度
t.setDifficulty('hell'); t.reset();
const sh = t.getRowSpeed(7);
ok('青蛙: 地狱档速度 > 简单档速度', sh > se, 'hell='+sh+' easy='+se);

// 地狱档障碍密度 > 简单档（countMult 生效）
t.setDifficulty('easy'); t.reset();
const ce = t.getRowCount(7);
t.setDifficulty('hell'); t.reset();
const ch = t.getRowCount(7);
ok('青蛙: 地狱档障碍密度 > 简单档', ch > ce, 'hell='+ch+' easy='+ce);

// 难度递增：四档速度单调递增
t.setDifficulty('easy'); const vE=t.diffCfg().speedMult;
t.setDifficulty('normal'); const vN=t.diffCfg().speedMult;
t.setDifficulty('hard'); const vH=t.diffCfg().speedMult;
t.setDifficulty('hell'); const vX=t.diffCfg().speedMult;
ok('青蛙: 速度倍率 easy<normal<hard<hell', vE<vN && vN<vH && vH<vX, [vE,vN,vH,vX].join(','));

// setDifficulty 生效：切换后难度值改变
t.setDifficulty('hard');
ok('青蛙: setDifficulty 生效 (hard)', t.getDifficulty() === 'hard');

// 非法档位被忽略，难度不变
t.setDifficulty('not_a_real_diff');
ok('青蛙: 非法难度被忽略', t.getDifficulty() === 'hard');

// setDifficulty 重开一局：重置后状态回到初始（未死亡、未到达）
t.setDifficulty('normal'); t.reset();
ok('青蛙: 重开后处于进行中', t.isDead() === false && t.isGoal() === false);

// 切到地狱后普通档单测不受影响：normal 倍率为 1.0（现有行为基准）
t.setDifficulty('normal');
ok('青蛙: normal 速度倍率为 1.0', t.diffCfg().speedMult === 1.0);

// ============ BOSS 系统（鳄鱼王 · 生存型）============
// 1) BOSS_EVERY 常量
eq('青蛙Boss: BOSS_EVERY=3', t.BOSS_EVERY, 3);

// 2) isBossWave 判断
ok('青蛙Boss: w=3 是 Boss 波', t.isBossWave(3) === true);
ok('青蛙Boss: w=6 是 Boss 波', t.isBossWave(6) === true);
ok('青蛙Boss: w=1 非 Boss 波', t.isBossWave(1) === false);
ok('青蛙Boss: w=2 非 Boss 波', t.isBossWave(2) === false);
ok('青蛙Boss: w=0 非 Boss 波', t.isBossWave(0) === false);

// 3) spawnBoss 生成 Boss：满血、phase1
t.reset(); t.setDifficulty('normal'); t.spawnBoss();
const b0 = t.getBoss();
ok('青蛙Boss: spawnBoss 生成 Boss', b0 !== null);
ok('青蛙Boss: 初始满血 hp=maxHp', b0 && b0.hp === b0.maxHp && b0.hp > 0, 'hp='+(b0&&b0.hp));
ok('青蛙Boss: 初始 phase=1', b0 && b0.phase === 1);

// 4) 难度 bossHpMult 缩放 maxHp：hell > normal > easy
t.reset(); t.setDifficulty('easy');   t.spawnBoss(); const he = t.getBoss().maxHp;
t.reset(); t.setDifficulty('normal'); t.spawnBoss(); const hn = t.getBoss().maxHp;
t.reset(); t.setDifficulty('hell');   t.spawnBoss(); const hh = t.getBoss().maxHp;
ok('青蛙Boss: maxHp hell>normal>easy', hh > hn && hn > he, 'hell='+hh+' normal='+hn+' easy='+he);

// 5) setWave / getWave 生效
t.reset(); t.setWave(6);
ok('青蛙Boss: setWave 生效', t.getWave() === 6);
ok('青蛙Boss: wave=6 是 Boss 波', t.isBossWave(6) === true);

// 6) 前进削减 Boss HP（updateBoss 检测行号推进）
t.reset(); t.setDifficulty('normal'); t.setShield(1); t.spawnBoss();
const bHp0 = t.getBoss().hp;
t.setFrog(5,5); t.setFrog(3,5);   // 行号推进 5→3
t.updateBoss(1);
const bHp1 = t.getBoss() ? t.getBoss().hp : 0;
ok('青蛙Boss: 前进后 HP 削减', bHp1 < bHp0, 'hp '+bHp0+'->'+bHp1);

// 7) 半血进入 phase2（转红/更快）
t.reset(); t.setDifficulty('normal'); t.spawnBoss();
const mx = t.getBoss().maxHp;
t.setBossHp(Math.floor(mx/2));
t.setFrog(5,5); t.updateBoss(1);
ok('青蛙Boss: 半血进入 phase2', t.getBoss() && t.getBoss().phase === 2, 'phase='+(t.getBoss()&&t.getBoss().phase));

// 8) 护盾优先：Boss 命中先耗盾不致死
t.reset(); t.setDifficulty('normal'); t.spawnBoss();
const bg = t.getBoss();
t.setFrog(Math.round(bg.row), Math.round(bg.col));   // 站到鳄鱼嘴边
t.setShield(1);
t.updateBoss(1);
ok('青蛙Boss: 命中先耗护盾不死', t.isDead() === false && t.getShield() === 0, 'dead='+t.isDead()+' shield='+t.getShield());

// 9) 无盾被 Boss 咬中致死
t.reset(); t.setDifficulty('normal'); t.spawnBoss();
const bg2 = t.getBoss();
t.setFrog(Math.round(bg2.row), Math.round(bg2.col));
t.setShield(0);
t.updateBoss(1);
ok('青蛙Boss: 无盾被咬致死', t.isDead() === true);

// 10) 击败：抵达终点(hp=0) 返回 true、Boss 清空、加分奖励
t.reset(); t.setDifficulty('normal'); t.spawnBoss();
const sc0 = t.getScore();
t.setFrog(0,5);                 // 抵达终点 → 强制击溃
const beaten = t.updateBoss(1);
ok('青蛙Boss: 击败返回 true', beaten === true);
ok('青蛙Boss: 击败后 Boss 清空', t.getBoss() === null);
ok('青蛙Boss: 击败加分奖励', t.getScore() > sc0, 'score '+sc0+'->'+t.getScore());

// 11) 击败掉落护盾道具
t.reset(); t.setDifficulty('normal'); t.spawnBoss();
const pkBefore = t.getPickups();
t.setFrog(0,5); t.updateBoss(1);
ok('青蛙Boss: 击败掉落道具', t.getPickups() > pkBefore, 'pickups '+pkBefore+'->'+t.getPickups());

// ============ 汇总 ============
const { results } = require('./harness');
const pass = results.filter(r=>r.pass).length;
const fail = results.length - pass;
console.log('青蛙单测: 共 '+results.length+' 项, 通过 '+pass+', 失败 '+fail);
if(fail>0) process.exitCode = 1;



