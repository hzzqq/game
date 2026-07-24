const { loadGame, ok, eq, results } = require('./harness');
const { t } = loadGame('../tron.html');

// 撞墙：玩家0 在最右列向右 → 出界死亡，玩家1 胜
t.setup(10,10,{x:9,y:0,dir:'right'},{x:0,y:5,dir:'right'});
t.step();
ok('玩家0 撞墙出局', t.getState().p0.dead === true);
eq('玩家1 获胜', t.getWinner(), 1);

// 自由移动不死亡
t.setup(10,10,{x:1,y:1,dir:'right'},{x:1,y:3,dir:'right'});
t.step();
ok('双方正常移动均未死亡', t.getState().p0.dead===false && t.getState().p1.dead===false);
eq('无人死亡 → 未分胜负(-1)', t.getWinner(), -1);

// 迎面相撞：同列相对而行 → 双双死亡(平局)
t.setup(10,10,{x:5,y:5,dir:'right'},{x:7,y:5,dir:'left'});
t.step();
ok('头碰头双方均死亡', t.getState().p0.dead===true && t.getState().p1.dead===true);
eq('双双出局 → 平局(-1)', t.getWinner(), -1);

// ===== 注入：掉落道具 / 增益（确定性驱动）=====
// 护盾免一次撞墙
t.setup(10,10,{x:9,y:0,dir:'right'},{x:0,y:5,dir:'right'});
t.applyPickup('shield',0);
ok('p0 护盾生效', t.getShield(0)===true);
t.step();
ok('护盾免撞墙：p0 未死', t.getState().p0.dead===false);
ok('护盾已消耗', t.getShield(0)===false);
eq('未分胜负(-1)', t.getWinner(), -1);

// 无护盾撞墙照常死亡
t.setup(10,10,{x:9,y:0,dir:'right'},{x:0,y:5,dir:'right'});
t.step();
ok('无护盾撞墙 p0 死', t.getState().p0.dead===true);

// 心形免任意死亡
t.setup(10,10,{x:9,y:0,dir:'right'},{x:0,y:5,dir:'right'});
t.applyPickup('heart',0);
t.step();
ok('heart 免撞墙：p0 未死', t.getState().p0.dead===false);
ok('heart 已消耗', t.getHeart(0)===false);

// 加速：p0 一步移动 2 格
t.setup(10,10,{x:1,y:1,dir:'right'},{x:8,y:1,dir:'left'});
t.applyPickup('boost',0);
t.step();
eq('p0 加速移动 2 格(x=3)', t.getState().p0.x, 3);

// 行进拾取掉落 + 拾取后移除
t.setup(10,10,{x:1,y:1,dir:'right'},{x:8,y:1,dir:'left'});
t.spawnPickup('shield',2,1); // p0 第一步到达 (row1,col2)
t.step();
ok('行进拾取护盾', t.getShield(0)===true);
eq('拾取后掉落移除', t.getPickups().length, 0);

// 未碰撞不生效
t.setup(10,10,{x:1,y:1,dir:'right'},{x:8,y:1,dir:'left'});
t.spawnPickup('shield',9,9);
t.step();
ok('远离未拾取护盾', t.getShield(0)===false);

// ===================== VS 电脑（CPU）回归 =====================
// 铁律校验：CPU 全程不得消耗全局 Math.random（避免污染共享随机流）
(function(){
  const _orig=Math.random; let _calls=0;
  Math.random=function(){ _calls++; return _orig(); };
  try {
    t.setMode('cpu');
    t.setup(30,30,{x:1,y:1,dir:'right'},{x:28,y:28,dir:'left'});
    t.setDir(0,'right'); // 人类 p0 直行冲墙
    let steps=0, threw=false;
    try { while(t.getWinner()===-1 && steps<400){ t.step(); steps++; } } catch(e){ threw=true; console.log('  ✗ CPU 步进抛异常: '+e); }
    ok('VS电脑 步进全程无异常', !threw);
    ok('VS电脑 游戏在 400 步内终局', t.getWinner()!==-1, 'step='+steps+' winner='+t.getWinner());
    ok('VS电脑 未消耗 Math.random', _calls===0, 'calls='+_calls);
  } finally { Math.random=_orig; }
})();

// 确定性：同种子两次运行结果一致
(function(){
  function run(){
    t.setMode('cpu');
    t.setup(30,30,{x:1,y:1,dir:'right'},{x:28,y:28,dir:'left'});
    t.setRand(12345);
    t.setDir(0,'right');
    for(let i=0;i<50;i++){ if(t.getWinner()!==-1) break; t.step(); }
    return JSON.stringify(t.getState());
  }
  eq('VS电脑 同种子确定性一致', run(), run());
})();

// 2p 模式切换（CPU 不接管）
t.setMode('2p');
t.setup(10,10,{x:1,y:1,dir:'right'},{x:8,y:8,dir:'left'});
t.setDir(1,'up');
t.step();
ok('2p 模式切换无异常', t.getMode()==='2p');

// ---------- 成就/胜利正反馈：对手撞墙玩家(p0)胜触发 confettiFired ----------
t.reset();
t.setup(20,20,{x:1,y:1,dir:'down'},{x:18,y:18,dir:'left'});
t.setDir(1,'right');           // 对手向右冲出右墙
var wk = 0;
for (; wk < 6 && t.getWinner() === -1; wk++) t.step();
eq('tron: 对手撞墙 玩家(p0)胜', t.getWinner(), 0);
ok('tron: 玩家胜利触发 confettiFired', t.confettiFired() === true);

// ===== 汇总 =====
const passed=results.filter(r=>r.pass).length;
const total=results.length;
console.log(`\ntron: ${passed}/${total} 通过`);
if(passed!==total){
  results.filter(r=>!r.pass).forEach(r=>console.log(`  ✗ ${r.name}  ${r.info}`));
  process.exit(1);
}
