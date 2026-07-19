// battle.html（坦克对战）逻辑单测
// 覆盖：常量、obstacles、rnd、moveTank(边界/障碍/转向/前进后退)、fire(生成子弹)、
// hitTank(碰撞)、step(本地双人移动+开火+子弹推进+碰撞扣血+回合结束)、
// endRound(加分/over)、resetPositions(重置)、gatherInput(local/online)
const { loadGame, ok, eq, results } = require('./harness');

let t;
try { t = loadGame('../battle.html').t; } catch (e) { console.error(e); process.exit(1); }

// ===== 1. 常量 =====
eq('BULLET_R=5', t.BULLET_R, 5);
eq('TANK_R=16', t.TANK_R, 16);
eq('BULLET_SPD=9', t.BULLET_SPD, 9);
eq('FIRE_CD=28', t.FIRE_CD, 28);
eq('DMG=12', t.DMG, 12);
eq('MAXHP=100', t.MAXHP, 100);

// ===== 2. obstacles =====
ok('obstacles 3块', t.obstacles.length === 3);
t.obstacles.forEach((o,i) => {
  ok('obstacle'+i+' w>0', o.w > 0);
  ok('obstacle'+i+' h>0', o.h > 0);
});

// ===== 3. rnd =====
for (let i=0;i<50;i++){
  const r = t.rnd(10, 20);
  ok('rnd(10,20) 在 [10,20)', r>=10 && r<20, 'r='+r);
}

// ===== 4. moveTank =====
const W = t.getW(), H = t.getH();
// 用远离障碍的位置（左上角区域）避免被推开干扰
// 前进
const tk = {x: 100, y: 100, a: 0, hp: 100};
const x0 = tk.x;
t.moveTank(tk, {fwd:true, back:false, left:false, right:false}, 1);
ok('moveTank 前进 x 增加', tk.x > x0);
// 后退
const x1 = tk.x;
t.moveTank(tk, {fwd:false, back:true, left:false, right:false}, 1);
ok('moveTank 后退 x 减小', tk.x < x1);
// 左转
const tk2 = {x: 100, y: 100, a: 0, hp: 100};
const a0 = tk2.a;
t.moveTank(tk2, {fwd:false, back:false, left:true, right:false}, 1);
ok('moveTank 左转 a 减小', tk2.a < a0);
// 右转
const a1 = tk2.a;
t.moveTank(tk2, {fwd:false, back:false, left:false, right:true}, 1);
ok('moveTank 右转 a 增大', tk2.a > a1);
// 边界限制
const tk3 = {x: 5, y: 60, a: -Math.PI, hp: 100}; // 朝左
t.moveTank(tk3, {fwd:true, back:false, left:false, right:false}, 1);
ok('moveTank 左边界限制', tk3.x >= t.TANK_R);
// 右边界
const tk4 = {x: W-5, y: 60, a: 0, hp: 100};
t.moveTank(tk4, {fwd:true, back:false, left:false, right:false}, 1);
ok('moveTank 右边界限制', tk4.x <= W - t.TANK_R);
// 障碍碰撞推开
const obs = t.obstacles[0];
const tk5 = {x: obs.x + obs.w/2, y: obs.y + obs.h/2, a: 0, hp: 100};
t.moveTank(tk5, {fwd:false, back:false, left:false, right:false}, 1);
const distToObs = Math.hypot(tk5.x - (obs.x+obs.w/2), tk5.y - (obs.y+obs.h/2));
ok('moveTank 障碍推开距离>=TANK_R', distToObs >= t.TANK_R - 1);

// ===== 5. fire =====
t.setBullets([]);
const tk6 = {x: W/2, y: H/2, a: 0, hp: 100};
t.fire(tk6, 'A');
eq('fire 生成1颗子弹', t.getBullets().length, 1);
const b = t.getBullets()[0];
eq('fire owner=A', b.owner, 'A');
ok('fire vx>0(朝a方向)', b.vx > 0);
eq('fire vy=0(a=0)', b.vy, 0);
ok('fire x 在炮口前方', b.x > tk6.x);
// owner B
t.setBullets([]);
t.fire(tk6, 'B');
eq('fire owner=B', t.getBullets()[0].owner, 'B');

// ===== 6. hitTank =====
const tk7 = {x: 100, y: 100, hp: 100};
ok('hitTank 命中', t.hitTank({x:100, y:100}, tk7));
ok('hitTank 未命中(远)', !t.hitTank({x:200, y:200}, tk7));
ok('hitTank 边界(TANK_R+BULLET_R)', t.hitTank({x:100+15, y:100}, tk7)); // 15 < 16+5=21
ok('hitTank 边界外', !t.hitTank({x:100+25, y:100}, tk7)); // 25 > 21

// ===== 7. resetPositions =====
t.getTankA().x = 0; t.getTankA().y = 0; t.getTankA().hp = 10;
t.getTankB().x = 0; t.getTankB().y = 0; t.getTankB().hp = 10;
t.setBullets([{x:0,y:0}]);
t.setMyBullets([{x:1}]);
t.setRemoteBullets([{x:2}]);
t.setFireCd(99);
t.resetPositions();
eq('reset tankA.x=W*0.25', t.getTankA().x, W*0.25);
eq('reset tankA.y=H*0.5', t.getTankA().y, H*0.5);
eq('reset tankA.a=-π/2', t.getTankA().a, -Math.PI/2);
eq('reset tankA.hp=MAXHP', t.getTankA().hp, t.MAXHP);
eq('reset tankB.x=W*0.75', t.getTankB().x, W*0.75);
eq('reset tankB.a=π/2', t.getTankB().a, Math.PI/2);
eq('reset tankB.hp=MAXHP', t.getTankB().hp, t.MAXHP);
eq('reset bullets 空', t.getBullets().length, 0);
eq('reset myBullets 空', t.getMyBullets().length, 0);
eq('reset remoteBullets 空', t.getRemoteBullets().length, 0);
eq('reset fireCd=0', t.getFireCd(), 0);

// ===== 8. gatherInput local =====
t.setMode('local');
t.setKeys({w:true, s:false, a:false, d:false, ' ':false, arrowup:false, arrowdown:false, arrowleft:false, arrowright:false, enter:false});
const inp = t.gatherInput();
ok('gatherInput local A 存在', !!inp.A);
ok('gatherInput local B 存在', !!inp.B);
ok('gatherInput local A.fwd=true', inp.A.fwd === true);
ok('gatherInput local B.fwd=false', inp.B.fwd === false);
// online host
t.setMode('online');
t.setRole('host');
t.setKeys({w:true, s:false, a:false, d:false, ' ':false});
const inp2 = t.gatherInput();
ok('gatherInput online host 有A', !!inp2.A);
ok('gatherInput online host 无B', !inp2.B);
// online guest
t.setRole('guest');
t.setKeys({w:false, s:true, a:false, d:false, ' ':false});
const inp3 = t.gatherInput();
ok('gatherInput online guest 有B', !!inp3.B);
ok('gatherInput online guest 无A', !inp3.A);
ok('gatherInput online guest B.back=true', inp3.B.back === true);

// ===== 9. step 本地双人 =====
t.setMode('local');
t.setOver(false);
t.setRunning(true);
t.resetPositions();
// P1 开火
t.setKeys({w:false, s:false, a:false, d:false, ' ':true, arrowup:false, arrowdown:false, arrowleft:false, arrowright:false, enter:false});
t.setFireCd(0);
const bulletsBefore = t.getBullets().length;
t.step(1);
ok('step P1开火生成子弹', t.getBullets().length > bulletsBefore);
// fireCd 重置（开火设为 FIRE_CD，随后 step 末尾 fireCd-- 故为 FIRE_CD-1）
eq('step 开火后 fireCd=FIRE_CD-1', t.getFireCd(), t.FIRE_CD - 1);
// P2 开火
t.setFireCd(0);
t.setKeys({w:false, s:false, a:false, d:false, ' ':false, arrowup:false, arrowdown:false, arrowleft:false, arrowright:false, enter:true});
const bb2 = t.getBullets().length;
t.step(1);
ok('step P2开火生成子弹', t.getBullets().length > bb2);

// ===== 10. step 子弹击中扣血 =====
t.setMode('local');
t.setOver(false);
t.setRunning(true);
t.resetPositions();
// 把 tankB 放在子弹路径上（近距离确保命中）
const tkB = t.getTankB();
tkB.x = 100; tkB.y = 100; tkB.hp = t.MAXHP;
// 子弹从 (50,100) 朝右飞，BULLET_SPD=9，多步推进应击中
t.setBullets([{x: 50, y: 100, vx: t.BULLET_SPD, vy: 0, owner:'A'}]);
// 不开火，只推进子弹
t.setKeys({w:false, s:false, a:false, d:false, ' ':false, arrowup:false, arrowdown:false, arrowleft:false, arrowright:false, enter:false});
t.setFireCd(0);
const hpBefore = tkB.hp;
// 多步推进直到击中或子弹出界
for (let i=0;i<30;i++){
  if (t.getOver() || tkB.hp < hpBefore) break;
  t.step(1);
}
ok('step 子弹击中B扣血', tkB.hp < hpBefore || t.getOver());

// ===== 11. step 回合结束 =====
t.setMode('local');
t.setOver(false);
t.setRunning(true);
t.resetPositions();
t.getTankB().hp = 1; // B 残血
t.setBullets([{x: t.getTankB().x, y: t.getTankB().y, vx: 0, vy: 0, owner:'A'}]);
t.setKeys({w:false, s:false, a:false, d:false, ' ':false, arrowup:false, arrowdown:false, arrowleft:false, arrowright:false, enter:false});
t.setFireCd(0);
const sA = t.getScoreA();
t.step(1);
ok('step B死 A加分', t.getScoreA() > sA || t.getOver());

// ===== 12. endRound =====
t.setOver(false);
t.setScoreA(0); t.setScoreB(0);
t.endRound('A');
eq('endRound A 加分 scoreA=1', t.getScoreA(), 1);
ok('endRound over=true', t.getOver());
// 重复 endRound 不再加
t.endRound('A');
eq('endRound 重复不加分', t.getScoreA(), 1);
// B 胜
t.setOver(false);
t.endRound('B');
eq('endRound B 加分 scoreB=1', t.getScoreB(), 1);

// ===== 13. step 子弹出界死亡 =====
t.setMode('local');
t.setOver(false);
t.setRunning(true);
t.resetPositions();
t.setBullets([{x: -5, y: H/2, vx: -t.BULLET_SPD, vy: 0, owner:'A'}]);
t.setKeys({w:false, s:false, a:false, d:false, ' ':false, arrowup:false, arrowdown:false, arrowleft:false, arrowright:false, enter:false});
t.setFireCd(0);
t.step(1);
eq('step 子弹出界被滤', t.getBullets().length, 0);

// ===== 14. step 子弹撞障碍死亡 =====
t.setMode('local');
t.setOver(false);
t.setRunning(true);
t.resetPositions();
const obs2 = t.obstacles[0];
t.setBullets([{x: obs2.x + obs2.w/2, y: obs2.y + obs2.h/2, vx: 0, vy: 0, owner:'A'}]);
t.setKeys({w:false, s:false, a:false, d:false, ' ':false, arrowup:false, arrowdown:false, arrowleft:false, arrowright:false, enter:false});
t.setFireCd(0);
t.step(1);
eq('step 子弹撞障碍被滤', t.getBullets().length, 0);

// ===== 汇总 =====
const passed = results.filter(r=>r.pass).length;
const total = results.length;
console.log(`\nbattle: ${passed}/${total} 通过`);
if (passed !== total) {
  results.filter(r=>!r.pass).forEach(r => console.log(`  ✗ ${r.name}  ${r.info}`));
  process.exit(1);
}
