const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../fight.html');

// 1. clamp
eq('clamp(5,0,10)=5', t.clamp(5,0,10), 5);
eq('clamp(-1,0,10)=0', t.clamp(-1,0,10), 0);
eq('clamp(11,0,10)=10', t.clamp(11,0,10), 10);
eq('clamp(0,0,10)=0', t.clamp(0,0,10), 0);
eq('clamp(10,0,10)=10', t.clamp(10,0,10), 10);

// 2. 常量
const C = t.getConstants();
eq('GROUND=478', C.GROUND, 478);
eq('ROUND_TIME=60', C.ROUND_TIME, 60);
eq('WALK_SPEED=165', C.WALK_SPEED, 165);
eq('DASH_SPEED=520', C.DASH_SPEED, 520);
eq('COMBO_WINDOW=1200', C.COMBO_WINDOW, 1200);

// ATK 表
const ATK = t.getATK();
eq('ATK.a dmg=6', ATK.a.dmg, 6);
eq('ATK.b dmg=13', ATK.b.dmg, 13);
eq('ATK.c dmg=20', ATK.c.dmg, 20);
eq('ATK.c cost=30', ATK.c.cost, 30);
ok('ATK.a total=255', ATK.a.startup + ATK.a.active + ATK.a.recover === 255);

// 3. makeFighter
const f = t.makeFighter('p');
eq('makeFighter health=100', f.health, 100);
eq('makeFighter energy=0', f.energy, 0);
eq('makeFighter onGround=true', f.onGround, true);
eq('makeFighter facing=1', f.facing, 1);
eq('makeFighter attackTime=0', f.attackTime, 0);
eq('makeFighter combo=0', f.combo, 0);
ok('makeFighter ctrl 对象', typeof f.ctrl === 'object' && f.ctrl.left === false);

// 4. resetFighter
const f2 = t.makeFighter('c');
t.resetFighter(f2, 200, -1);
eq('resetFighter x=200', f2.x, 200);
eq('resetFighter facing=-1', f2.facing, -1);
eq('resetFighter health=100', f2.health, 100);
eq('resetFighter y=GROUND', f2.y, C.GROUND);
eq('resetFighter onGround=true', f2.onGround, true);
eq('resetFighter vx=0', f2.vx, 0);

// 5. atkActive
const fa = t.makeFighter('p');
eq('atkActive 无攻击 false', t.atkActive(fa), false);
fa.attackType = 'a';
fa.attackTime = 255;  // 刚启动 el=0 (startup)
eq('atkActive startup 帧 false', t.atkActive(fa), false);
fa.attackTime = 200;  // el=55 (active 始)
ok('atkActive active 帧 true', t.atkActive(fa) === true);
fa.attackTime = 130;  // el=125 (recover 始)
eq('atkActive recover 帧 false', t.atkActive(fa), false);

// 6. inRange
const att = t.makeFighter('p'); att.x = 100; att.y = C.GROUND;
const def = t.makeFighter('c'); def.x = 120; def.y = C.GROUND;
ok('inRange 近距离 true', t.inRange(att, def, ATK.a) === true);   // |20|<=50+18=68
def.x = 200;
ok('inRange 远距离 false', t.inRange(att, def, ATK.a) === false); // |100|>68
def.x = 120; def.y = C.GROUND - 100;  // y 差 100
ok('inRange y差大 false', t.inRange(att, def, ATK.a) === false);  // |100|>=80

// 7. startAttack
const fs = t.makeFighter('p'); fs.energy = 50;
t.startAttack(fs, 'a');
eq('startAttack a attackType', fs.attackType, 'a');
eq('startAttack a attackTime=255', fs.attackTime, 255);
eq('startAttack a energy 不变', fs.energy, 50);  // a 不耗能量
eq('startAttack a atkCool=recover', fs.atkCool, ATK.a.recover);

const fs2 = t.makeFighter('p'); fs2.energy = 50;
t.startAttack(fs2, 'c');
eq('startAttack c attackType', fs2.attackType, 'c');
eq('startAttack c attackTime=490', fs2.attackTime, ATK.c.startup + ATK.c.active + ATK.c.recover);
eq('startAttack c energy-=30', fs2.energy, 20);

// 8. applyDamage 基础
const a1 = t.makeFighter('p'); a1.x = 100; a1.y = C.GROUND;
const d1 = t.makeFighter('c'); d1.x = 120; d1.y = C.GROUND; d1.health = 100;
t.applyDamage(a1, d1, 10, { knock: 100 });
eq('applyDamage 基础 combo=1', a1.combo, 1);
eq('applyDamage 基础 dmg=10', d1.health, 90);
eq('applyDamage 基础 comboTimer=1200', a1.comboTimer, 1200);
ok('applyDamage 基础 def.energy>0', d1.energy > 0);

// 9. applyDamage combo 累加（comboTimer>0 → combo++）
t.applyDamage(a1, d1, 10, { knock: 100 });
eq('applyDamage combo=2', a1.combo, 2);
// mult = 1 + (2-1)*0.3 = 1.3, dmg = round(10*1.3) = 13, health = 90-13 = 77
eq('applyDamage combo dmg=13', d1.health, 77);

// 10. applyDamage buff 1.5 倍
const a2 = t.makeFighter('p'); a2.x = 100; a2.y = C.GROUND; a2.buffTime = 1000;
const d2 = t.makeFighter('c'); d2.x = 120; d2.y = C.GROUND; d2.health = 100;
t.applyDamage(a2, d2, 10, { knock: 100 });
// buff: 10*1.5=15, combo1 mult1, dmg=round(15)=15, health=85
eq('applyDamage buff dmg=15', d2.health, 85);

// 11. applyDamage blocked 0.3 倍
const a3 = t.makeFighter('p'); a3.x = 100; a3.y = C.GROUND;
const d3 = t.makeFighter('c'); d3.x = 120; d3.y = C.GROUND; d3.health = 100; d3.blocking = true;
t.applyDamage(a3, d3, 10, { knock: 100 });
// blocked: 10*0.3=3, combo1 mult1, dmg=round(3)=3, health=97
eq('applyDamage blocked dmg=3', d3.health, 97);
ok('applyDamage blocked 后 blocking=false', d3.blocking === false);
ok('applyDamage blocked def.energy 较少', d3.energy === 2);  // blocked +2

// 12. applyDamage 击退方向
const a4 = t.makeFighter('p'); a4.x = 100; a4.y = C.GROUND;
const d4 = t.makeFighter('c'); d4.x = 200; d4.y = C.GROUND; d4.health = 100;
t.applyDamage(a4, d4, 10, { knock: 100 });
// def.x(200) >= att.x(100) → dir=1 → def.vx += 1*100 = 100
ok('applyDamage 击退方向 正', d4.vx > 0);

// 13. applyDamage health 不低于 0
const a5 = t.makeFighter('p'); a5.x = 100; a5.y = C.GROUND;
const d5 = t.makeFighter('c'); d5.x = 120; d5.y = C.GROUND; d5.health = 5;
t.applyDamage(a5, d5, 100, { knock: 100 });
eq('applyDamage health 下限 0', d5.health, 0);

// 14. energy 上限 100
const a6 = t.makeFighter('p'); a6.x = 100; a6.y = C.GROUND; a6.energy = 95;
const d6 = t.makeFighter('c'); d6.x = 120; d6.y = C.GROUND; d6.health = 100;
t.applyDamage(a6, d6, 10, { knock: 100 });
eq('applyDamage att.energy 上限 100', a6.energy, 100);  // 95+8=103 → 100

// 15. addFloat / updateFloats
t.setFloats([]);
t.addFloat(100, 200, 'TEST', '#f6465d');
eq('addFloat floats+1', t.getFloats().length, 1);
eq('addFloat text', t.getFloats()[0].text, 'TEST');
t.updateFloats(0.5);  // life 0.9-0.5=0.4
ok('updateFloats life 减', t.getFloats()[0].life < 0.9);
t.updateFloats(1);    // life<=0 splice
eq('updateFloats life<=0 删除', t.getFloats().length, 0);

// 16. resetItems / spawnItem
t.resetItems();
eq('resetItems items=[]', t.getItems().length, 0);
eq('resetItems itemTimer=5', t.getItemTimer(), 5);
t.spawnItem();
eq('spawnItem items+1', t.getItems().length, 1);
const it = t.getItems()[0];
ok('spawnItem type 合法', it.type === 'meat' || it.type === 'energy' || it.type === 'buff');
ok('spawnItem x 在 canvas 内', it.x >= 60 && it.x <= 420);

// 17. applyItem meat/energy/buff
const fm = t.makeFighter('p'); fm.health = 50;
t.applyItem(fm, { type: 'meat', x: 100, y: C.GROUND });
eq('applyItem meat +20 HP', fm.health, 70);
fm.health = 95;
t.applyItem(fm, { type: 'meat', x: 100, y: C.GROUND });
eq('applyItem meat 上限 100', fm.health, 100);

const fe = t.makeFighter('p'); fe.energy = 30;
t.applyItem(fe, { type: 'energy', x: 100, y: C.GROUND });
eq('applyItem energy +50', fe.energy, 80);
fe.energy = 60;
t.applyItem(fe, { type: 'energy', x: 100, y: C.GROUND });
eq('applyItem energy 上限 100', fe.energy, 100);

const fb = t.makeFighter('p');
t.applyItem(fb, { type: 'buff', x: 100, y: C.GROUND });
eq('applyItem buff buffTime=8000', fb.buffTime, 8000);

// 18. separate（两 fighter 重叠 → 分开）
const sa = t.makeFighter('p'); sa.x = 100; sa.y = C.GROUND;
const sb = t.makeFighter('c'); sb.x = 110; sb.y = C.GROUND;  // 距离 10 < 44
t.separate(sa, sb);
ok('separate 后距离增大', Math.abs(sb.x - sa.x) >= 44);
ok('separate 后 sa.x 在边界内', sa.x >= 30 && sa.x <= 450);
ok('separate 后 sb.x 在边界内', sb.x >= 30 && sb.x <= 450);

// 19. beginMatch / startRound
t.beginMatch();
eq('beginMatch state=playing', t.getState(), 'playing');
eq('beginMatch roundNum=1', t.getRoundNum(), 1);
eq('beginMatch pips.p=0', t.getPips().p, 0);
eq('beginMatch pips.c=0', t.getPips().c, 0);
const p = t.getPlayer(), c = t.getCpu();
eq('beginMatch player health=100', p.health, 100);
eq('beginMatch cpu health=100', c.health, 100);
ok('beginMatch player.x=130', p.x === 130);
ok('beginMatch cpu.x=W-130', c.x === 480 - 130);

// 20. endRoundKO（player.health=0 → cpu 赢）
t.beginMatch();
t.getPlayer().health = 0;
t.endRoundKO();
eq('endRoundKO state=roundover', t.getState(), 'roundover');
eq('endRoundKO pips.c=1', t.getPips().c, 1);  // cpu 赢

// 21. endRoundByTime（health 高的赢）
t.beginMatch();
t.getPlayer().health = 80;
t.getCpu().health = 50;
t.endRoundByTime();
eq('endRoundByTime player 赢 pips.p=1', t.getPips().p, 1);

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nfight: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
