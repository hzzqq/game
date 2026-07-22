// 躲避弹幕 · 逻辑单测
// 经 window.__t 钩子确定性驱动：弹幕生成、命中扣命、无敌帧、生存推进、边界夹紧。
const H = require('./harness');
const { t } = H.loadGame('../bullethell.html');

// 1) 初始
t.reset();
let s = t.getState();
H.eq('初始: 未运行', s.running, false);
H.eq('初始: 余机=3', s.lives, 3);
H.eq('初始: 波次=1', s.wave, 1);
H.eq('初始: 无弹幕', s.bulletCount, 0);

// 2) 种子化弹幕生成（确定性）
t.start();
t.setRand(42);
t.setSpawnEnabled(true);
t.update(0.1);
H.ok('种子42: 生成了弹幕', t.getState().bulletCount > 0);

// 3) 命中扣命
t.start();
t.setSpawnEnabled(false);
t.clearBullets();
t.setPlayer(400, 500);
t.spawnBullet(400, 500, 0, 0); // 正落在玩家身上
const lives0 = t.getState().lives;
t.update(0.02);
s = t.getState();
H.eq('命中: 余机-1', s.lives, lives0 - 1);
H.eq('命中: 弹幕被清除', s.bulletCount, 0);

// 4) 无敌帧免疫
t.start();
t.setSpawnEnabled(false);
t.clearBullets();
t.setPlayer(400, 500);
t.setInvuln(0.5);
t.spawnBullet(400, 500, 0, 0);
const lives1 = t.getState().lives;
t.update(0.02);
H.eq('无敌帧: 余机不变', t.getState().lives, lives1);

// 5) 生存满时长推进波次
t.start();
t.setSpawnEnabled(false);
t.clearBullets();
t.setLives(5);
t.setTime(7.9);
t.update(0.2); // 7.9 + 0.2 = 8.1 >= 8
s = t.getState();
H.eq('生存: 波次=2', s.wave, 2);
H.eq('生存: 时间归零(0.1)', s.time, 0.1);
H.eq('生存: 过关得分+100', s.score, 100);

// 6) 边界夹紧
t.start();
t.setPlayer(-100, -100);
t.update(0.02);
s = t.getState();
H.eq('边界: x 夹紧到 r', s.player.x, 12);
H.eq('边界: y 夹紧到 r', s.player.y, 12);
