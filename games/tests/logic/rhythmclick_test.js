// 双按钮节奏点击 · 逻辑单测
// 经 window.__t 钩子确定性驱动：命中判定（perfect/good）、错键失误、漏接、连击累计。
const H = require('./harness');
const { t } = H.loadGame('../rhythmclick.html');

function freshGame(){
  t.reset(); t.start(); t.setSpawnEnabled(false); // 关闭随机生成，纯确定性驱动
  return t.getState().hitLineY;
}

// 1) 正中判定线 = PERFECT
let HY = freshGame();
t.spawnNote(0, HY);
t.applyAction(0);
let s = t.getState();
H.eq('正中: 得分+100', s.score, 100);
H.eq('正中: 连击=1', s.combo, 1);
H.eq('正中: 音符标记命中', s.notes[0].hit, true);
t.update(0.02); // 命中音符被清除
H.eq('正中: 命中后移除', t.getState().noteCount, 0);

// 2) 接近判定线 = GOOD
HY = freshGame();
t.spawnNote(0, HY - 30); // 差 30px，落在 GOOD 窗口
t.applyAction(0);
s = t.getState();
H.eq('接近: 得分+50', s.score, 50);
H.eq('接近: 连击=1', s.combo, 1);

// 3) 错键 = 失误（断连击，不消耗正确音符）
HY = freshGame();
t.spawnNote(0, HY); // 左轨有音符
t.applyAction(1);   // 却按了右键
s = t.getState();
H.eq('错键: 失误+1', s.misses, 1);
H.eq('错键: 连击归零', s.combo, 0);
H.eq('错键: 左轨音符仍在', s.noteCount, 1);

// 4) 漏接（越过判定线未按键）= 失误
HY = freshGame();
t.spawnNote(0, HY + 200); // 早已越过判定线
t.update(0.02);
s = t.getState();
H.eq('漏接: 失误+1', s.misses, 1);
H.eq('漏接: 连击归零', s.combo, 0);
H.eq('漏接: 音符移除', s.noteCount, 0);

// 5) 连击累计
HY = freshGame();
t.spawnNote(0, HY); t.applyAction(0); // combo 1
t.spawnNote(1, HY); t.applyAction(1); // combo 2
s = t.getState();
H.eq('连击: 两次命中得分=200', s.score, 200);
H.eq('连击: 连击=2', s.combo, 2);
H.eq('连击: 最大连击=2', s.maxCombo, 2);
