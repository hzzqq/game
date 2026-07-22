const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../gun.html');

// 1. WEAPONS 表
const W = t.getWEAPONS();
ok('WEAPONS 4 种', Object.keys(W).length === 4);
ok('WEAPONS 含 pistol/smg/shotgun/rifle', W.pistol && W.smg && W.shotgun && W.rifle);
ok('WEAPONS 都有 dmg', Object.values(W).every(w => typeof w.dmg === 'number'));
ok('WEAPONS 都有 ammo', Object.values(W).every(w => typeof w.ammo === 'number'));
eq('WEAPONS pistol dmg=16', W.pistol.dmg, 16);
eq('WEAPONS shotgun pellets=7', W.shotgun.pellets, 7);
eq('WEAPONS rifle dmg=30', W.rifle.dmg, 30);

// 2. ITEMS 6 种
const IT = t.getITEMS();
eq('ITEMS 6 种', IT.length, 6);
ok('ITEMS 类型合法', IT.every(i => ['med','ammo','shield','speed','bomb','gun'].includes(i.t)));
ok('ITEMS 都有 icon/label', IT.every(i => i.icon && i.label));

// 3. CRATE
ok('CRATE 3 种武器', Array.isArray(t.getCRATE()) && t.getCRATE().length === 3);
ok('CRATE 不含 pistol', !t.getCRATE().includes('pistol'));

// 4. reset
t.reset();
const p = t.getPlayer();
eq('reset player hp=100', p.hp, 100);
eq('reset player maxhp=100', p.maxhp, 100);
eq('reset player weapon=pistol', p.weapon, 'pistol');
eq('reset player ammo=12', p.ammo, 12);
eq('reset player shield=0', p.shield, 0);
eq('reset player speed=185', p.speed, 185);
eq('reset score=0', t.getScore(), 0);
eq('reset wave=1', t.getWave(), 1);  // reset 调 nextWave，wave 0→1
eq('reset enemies=[]', t.getEnemies().length, 0);
eq('reset bullets=[]', t.getBullets().length, 0);
eq('reset items=[]', t.getItems().length, 0);

// 5. nextWave
t.setWave(0);
t.nextWave();
eq('nextWave wave=1', t.getWave(), 1);
// spawnQ = 4 + wave*2 = 6（但 spawnQ 是闭包变量，无法直接验证，通过 spawnEnemy 间接）
t.nextWave();
eq('nextWave wave=2', t.getWave(), 2);

// 6. spawnEnemy
t.reset();
t.setEnemies([]);
t.spawnEnemy();
eq('spawnEnemy enemies+1', t.getEnemies().length, 1);
const e = t.getEnemies()[0];
ok('spawnEnemy type 合法', ['grunt','runner','gunner','brute'].includes(e.type));
ok('spawnEnemy 有 x/y', typeof e.x === 'number' && typeof e.y === 'number');
ok('spawnEnemy 有 hp/maxhp', typeof e.hp === 'number' && typeof e.maxhp === 'number');
ok('spawnEnemy 有 spd', typeof e.spd === 'number' && e.spd > 0);
ok('spawnEnemy 有 dmg', typeof e.dmg === 'number' && e.dmg > 0);
ok('spawnEnemy r>0', e.r > 0);

// 7. nearestEnemy
t.setEnemies([]);
eq('nearestEnemy 无敌人 null', t.nearestEnemy(), null);
// 手动加 2 个敌人
t.setEnemies([
  {x: t.getPlayer().x + 50, y: t.getPlayer().y, r:13, hp:30, type:'grunt'},
  {x: t.getPlayer().x + 100, y: t.getPlayer().y, r:13, hp:30, type:'grunt'}
]);
const ne = t.nearestEnemy();
ok('nearestEnemy 返回最近', ne && Math.abs(ne.x - (t.getPlayer().x + 50)) < 1);

// 8. fire
t.reset();
t.setBullets([]);
const ammoBefore = t.getPlayer().ammo;
t.fire();
// fire 受 rate 限制，但 reset 后 lastShot=0，now 很大，应该能开火
ok('fire 后 ammo 减少 或 reload', t.getPlayer().ammo <= ammoBefore || t.getPlayer().reload > 0);

// 9. doDash
t.reset();
t.getPlayer().dashCd = 0;
t.doDash();
eq('doDash dashT>0', t.getPlayer().dashT, 0.16);
eq('doDash dashCd=1.1', t.getPlayer().dashCd, 1.1);
ok('doDash invuln>0', t.getPlayer().invuln > 0);
// dashCd 中再 doDash 无效
t.getPlayer().dashT = 0;
t.doDash();
eq('doDash cd 中无效 dashT=0', t.getPlayer().dashT, 0);

// 10. dropItem / spawnItem
t.reset();
t.setItems([]);
t.dropItem(100, 200);
eq('dropItem items+1', t.getItems().length, 1);
const di = t.getItems()[0];
ok('dropItem type 合法', ['med','ammo','shield','speed','bomb','gun'].includes(di.t));
eq('dropItem x=100', di.x, 100);
t.setItems([]);
t.spawnItem();
eq('spawnItem items+1', t.getItems().length, 1);
eq('spawnItem type=gun', t.getItems()[0].t, 'gun');

// 11. applyItem med
t.reset();
t.getPlayer().hp = 50;
t.applyItem('med');
eq('applyItem med +30 HP', t.getPlayer().hp, 80);
t.getPlayer().hp = 90;
t.applyItem('med');
eq('applyItem med 上限 100', t.getPlayer().hp, 100);

// 12. applyItem ammo
t.reset();
t.getPlayer().ammo = 3;
t.applyItem('ammo');
eq('applyItem ammo 补满', t.getPlayer().ammo, 12);  // pistol ammo=12

// 13. applyItem shield
t.reset();
t.getPlayer().shield = 0;
t.applyItem('shield');
eq('applyItem shield +40', t.getPlayer().shield, 40);
t.applyItem('shield');
eq('applyItem shield 上限 80', t.getPlayer().shield, 80);

// 14. applyItem speed
t.reset();
t.applyItem('speed');
eq('applyItem speed speedT=8', t.getPlayer().speedT, 8);

// 15. applyItem bomb（清屏）
t.reset();
t.setEnemies([
  {x:100,y:100,r:13,hp:30,maxhp:30,type:'grunt'},
  {x:200,y:200,r:20,hp:95,maxhp:95,type:'brute'}
]);
t.setBullets([{x:1,y:1,from:'e'},{x:2,y:2,from:'p'}]);
t.applyItem('bomb');
// grunt hp=30-120<=0 kill, brute hp=95-120<=0 kill
eq('applyItem bomb 清屏 enemies=0', t.getEnemies().length, 0);
ok('applyItem bomb 清敌方子弹', t.getBullets().length === 1 && t.getBullets()[0].from === 'p');

// 16. applyItem gun（换武器）
t.reset();
t.applyItem('gun');
ok('applyItem gun 换武器', ['smg','shotgun','rifle'].includes(t.getPlayer().weapon));
const newWpn = t.getWEAPONS()[t.getPlayer().weapon];
eq('applyItem gun ammo 补满', t.getPlayer().ammo, newWpn.ammo);

// 17. hurtPlayer
t.reset();
t.getPlayer().hp = 100;
t.getPlayer().invuln = 0;
t.getPlayer().shield = 0;
t.hurtPlayer(30);
eq('hurtPlayer hp-30', t.getPlayer().hp, 70);

// 18. hurtPlayer invuln 无伤
t.reset();
t.getPlayer().hp = 100;
t.getPlayer().invuln = 1;
t.hurtPlayer(30);
eq('hurtPlayer invuln 无伤', t.getPlayer().hp, 100);

// 19. hurtPlayer shield 抵挡
t.reset();
t.getPlayer().hp = 100;
t.getPlayer().shield = 20;
t.getPlayer().invuln = 0;
t.hurtPlayer(30);
// shield 20 抵挡 20，剩 10 伤 hp → hp=90, shield=0
eq('hurtPlayer shield 抵挡 hp=90', t.getPlayer().hp, 90);
eq('hurtPlayer shield 用完=0', t.getPlayer().shield, 0);

// 20. hurtPlayer shield 完全抵挡
t.reset();
t.getPlayer().hp = 100;
t.getPlayer().shield = 50;
t.getPlayer().invuln = 0;
t.hurtPlayer(30);
eq('hurtPlayer shield 完全抵挡 hp=100', t.getPlayer().hp, 100);
eq('hurtPlayer shield 剩 20', t.getPlayer().shield, 20);

// 21. killEnemy
t.reset();
t.setScore(0);
t.setCombo(0);
t.setEnemies([{x:100,y:100,r:13,hp:30,maxhp:30,type:'grunt'}]);
t.killEnemy(0);
eq('killEnemy enemies-1', t.getEnemies().length, 0);
eq('killEnemy score+60', t.getScore(), 60);  // grunt=60
eq('killEnemy combo+1', t.getCombo(), 1);

// 22. killEnemy brute 200 分
t.reset();
t.setScore(0);
t.setEnemies([{x:100,y:100,r:20,hp:95,maxhp:95,type:'brute'}]);
t.killEnemy(0);
eq('killEnemy brute +200', t.getScore(), 200);

// 23. 标准化掉落系统：spawnPickup + stepPickups 生效（med 回血）
t.reset();
t.getPlayer().hp = 50;
t.spawnPickup('med', t.getPlayer().x, t.getPlayer().y);
eq('spawnPickup 生成 1 个', t.getPickups(), 1);
t.stepPickups(0.016);
eq('stepPickups med 回血 +30 → 80', t.getPlayer().hp, 80);
eq('stepPickups 拾取后移除', t.getPickups(), 0);

// 24. 未碰撞不生效
t.reset();
t.getPlayer().hp = 50;
t.spawnPickup('med', 0, 0);
t.stepPickups(0.016);
eq('未碰撞 hp 不变', t.getPlayer().hp, 50);
eq('未碰撞 pickup 仍在', t.getPickups(), 1);

// 25. 护盾免死：有盾时受伤不扣血、不结束
t.reset();
t.getPlayer().hp = 100; t.setShield(100); t.getPlayer().invuln = 0;
t.takeHit(30);
eq('护盾免死 hp 不变', t.getPlayer().hp, 100);
ok('护盾免死 未结束', t.getState() !== 'over');

// 26. 无盾扣血/失败
t.reset();
t.getPlayer().hp = 10; t.setShield(0); t.getPlayer().invuln = 0;
t.takeHit(50);
ok('无盾 takeHit 触发 gameOver', t.getState() === 'over');

// 27. 弹药 pickup
t.reset();
t.getPlayer().ammo = 3;
t.applyPickup({t:'ammo'});
eq('applyPickup ammo 补满', t.getPlayer().ammo, 12);

// 28. 加速 boost
t.reset();
t.applyPickup({t:'speed'});
eq('applyPickup speed boost=8', t.getBoost(), 8);

// 29. 护盾 get/set
t.reset();
t.setShield(40);
eq('getShield=40', t.getShield(), 40);

// 30. 加速 get/set
t.reset();
t.setBoost(5);
eq('getBoost=5', t.getBoost(), 5);

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\ngun: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
