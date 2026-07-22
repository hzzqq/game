// 太空清屏射击 · 逻辑单测
// 经 window.__t 钩子确定性驱动：波次推进 / 清屏得分 / 边界夹紧 / 触底扣命。
const H = require('./harness');
const { t } = H.loadGame('../spacewipe.html');

// 1) 初始状态
t.reset();
let s = t.getState();
H.eq('初始: 未运行', s.running, false);
H.eq('初始: 波次=1', s.wave, 1);
H.eq('初始: 余机=3', s.lives, 3);

// 2) 第一波生成
t.startWave(1);
s = t.getState();
H.eq('startWave(1): 波次=1', s.wave, 1);
H.eq('startWave(1): 敌机数=5', s.enemyCount, 5);
H.eq('startWave(1): 运行中', s.running, true);
t.setAutoFire(false); // 关闭自动开火，纯手动确定性射击

// 3) 逐架击落整波（关闭自动进波，确保可清空到 0）
const targets = s.enemies.map(e => e.x);
t.setAutoWave(false);
for (const tx of targets) {
  const before = t.getState().enemyCount;
  t.setPlayerX(tx);
  t.fire(); // 在玩家正上方生成子弹（绕过冷却）
  let guard = 0;
  while (t.getState().enemyCount >= before && guard < 300) { t.update(0.02); guard++; }
  H.ok('击落一架: 剩余减少', t.getState().enemyCount === before - 1);
}
s = t.getState();
H.eq('清屏: 敌机数=0', s.enemyCount, 0);
H.eq('清屏: 得分=500', s.score, 500);

// 4) 波次推进（清空整波进入下一波）
t.startWave(1); t.setAutoFire(false); t.setAutoWave(true);
t.clearEnemies();
t.update(0.05);
s = t.getState();
H.eq('推进: 波次=2', s.wave, 2);
H.eq('推进: 第二波敌机=6', s.enemyCount, 6);

// 5) 边界夹紧
t.reset(); t.startWave(1);
t.setPlayerX(-500);
t.update(0.02);
H.eq('边界: 左夹紧到 r', t.getState().player.x, 16);
t.setPlayerX(99999);
t.update(0.02);
H.eq('边界: 右夹紧到 W-r', t.getState().player.x, 800 - 16);

// 6) 敌机触底扣命
t.start(); // 启动运行，使 update 真正推进逻辑
t.setLives(3);
t.setPlayerX(400);
t.clearEnemies();
t.spawnEnemyAt(400, 540 - 16 + 2, 1, 0); // 紧贴玩家上方，下一步即触底
const livesBefore = t.getState().lives;
t.update(0.02);
H.ok('敌机触底: 余机-1', t.getState().lives === livesBefore - 1);
