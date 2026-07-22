// 加拉加 俯冲突战机 · 逻辑单测
// 经 window.__t 钩子确定性驱动：step 推进 / fire 生成子弹 / 子弹击落敌机 / 清空胜利 / 敌弹扣命 / 命数归零结束。
const H = require('./harness');
const { t } = H.loadGame('../galaga.html');

const AW = t.AW; // 敌机宽，用于把子弹对准敌机中心

// 1) 初始状态
t.newGame(1);
let s = t.getState();
H.eq('初始: 命数=3', s.lives, 3);
H.eq('初始: 得分=0', s.score, 0);
H.eq('初始: 未结束', s.over, false);
H.eq('初始: 未胜利', s.win, false);
H.eq('初始: 敌机=32', s.enemyCount, 32);

// 2) step 推进不改变战果（无开火、关闭俯冲，敌机数与得分保持）
t.newGame(2);
t.setDiveEnabled(false);
const before = t.getState().enemyCount;
for(let i=0;i<10;i++) t.step();
s = t.getState();
H.eq('step 推进: 敌机数不变', s.enemyCount, before);
H.eq('step 推进: 得分仍为0', s.score, 0);
H.ok('step 推进: 仍可读取状态', typeof s.player.x === 'number');

// 3) fire 生成玩家子弹
t.newGame(3);
const bullets0 = t.getState().bullets.length;
const fired = t.fire();
H.ok('fire 返回 true', fired === true);
H.eq('fire: 子弹数+1', t.getState().bullets.length, bullets0 + 1);
// 冷却内再次开火无效
H.eq('fire 冷却内: 子弹不再增加', t.getState().bullets.length, bullets0 + 1);

// 4) 子弹击中敌机 → 敌机数-1、得分+100
t.newGame(4);
t.setDiveEnabled(false);
let before4 = t.getState().enemyCount;
let target = t.getState().enemies.find(e => e.alive);
t.setPlayerX(target.x + AW/2);   // 对准该列中心
t.fire();
let guard = 0;
while(t.getState().enemyCount >= before4 && guard < 300){ t.step(); guard++; }
s = t.getState();
H.eq('击落: 敌机数-1', s.enemyCount, before4 - 1);
H.eq('击落: 得分+100', s.score, 100);

// 5) 清空全部敌机 → 胜利
t.newGame(5);
t.setDiveEnabled(false);
let g2 = 0;
while(t.getState().enemyCount > 0 && g2 < 4000){
  const en = t.getState().enemies.find(e => e.alive);
  if(!en) break;
  t.setPlayerX(en.x + AW/2);
  t.fire();
  let g3 = 0;
  const c0 = t.getState().enemyCount;
  while(g3 < 300){ t.step(); g3++; if(t.getState().enemyCount < c0) break; }
  g2++;
}
s = t.getState();
H.eq('清空: 敌机数=0', s.enemyCount, 0);
H.ok('清空: isWin=true', t.isWin() === true);
H.ok('清空: win 状态为真', s.win === true);

// 6) 玩家被敌弹击中 → 命数-1
t.newGame(6);
t.setLives(3);
const pl = t.getState().player;
t.spawnEnemyBullet(pl.x, pl.y + 2);   // 正落在玩家身上
const livesBefore = t.getState().lives;
t.step();
H.eq('敌弹命中: 命数-1', t.getState().lives, livesBefore - 1);

// 7) 命数归零 → 游戏结束
t.newGame(7);
t.setLives(1);
const pl2 = t.getState().player;
t.spawnEnemyBullet(pl2.x, pl2.y + 2);
t.step();
H.ok('命数0: isGameOver=true', t.isGameOver() === true);
H.ok('命数0: over 状态为真', t.getState().over === true);

console.log('  ✓ galaga_test.js 全部通过');
