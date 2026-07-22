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

// 6) reset 后状态可读取（确定性，Juice 守卫不报错）
t.reset();
let rs = t.getState();
H.ok('reset 后状态可读取', rs && typeof rs.score === 'number' && rs.running === false);

// ===== 注入式掉落/增益系统（确定性驱动，setRand 控制掉落 PRNG）=====
t.setRand(123);

// 1. 生成掉落物 + 金币计分
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearNotes();
t.spawnPickup('coin', 200, 100);
H.eq('生成 1 个掉落物', t.getPickups(), 1);
const coinsBefore = t.getCoins(), scoreBefore = t.getState().score;
t.applyPickup(0);
H.eq('拾取 💰 金币计数+1', t.getCoins(), coinsBefore + 1);
H.eq('拾取 💰 加分(+10)', t.getState().score, scoreBefore + 10);
H.eq('拾取后掉落物移除', t.getPickups(), 0);

// 2. 护盾门控失误：有盾吸收一次失误（不计入 misses），护盾被消耗
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearNotes(); t.setShield(1);
const missBefore = t.getMisses();
t.applyAction(0); // 无音符→误触→应被护盾吸收
H.eq('有护盾: 失误不增加', t.getMisses(), missBefore);
H.eq('护盾被消耗', t.getShield(), 0);
// 无盾时失误计入
t.applyAction(0);
H.eq('无盾: 失误+1', t.getMisses(), missBefore + 1);

// 3. 加速增益：boost 期间命中得分翻倍
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearNotes();
const HYb = t.getState().hitLineY;
t.spawnPickup('boost', 200, 100);
t.applyPickup(0);
H.ok('拾取 🚀 加速生效(boostTimer>0)', t.getBoost() > 0);
t.spawnNote(0, HYb);
t.applyAction(0); // PERFECT → 100*2
H.eq('加速期正中得分翻倍=200', t.getState().score, 200);

// 4. 回血增益：heal 恢复一次失误
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearNotes();
t.setMisses(3);
t.spawnPickup('heal', 200, 100);
t.applyPickup(0);
H.eq('拾取 ❤ 失误-1', t.getMisses(), 2);

// 5. 掉落物随时间衰减移除（无碰撞模型，由 stepPickups 推进）
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearNotes();
t.spawnPickup('coin', 200, 100);
H.eq('生成掉落物', t.getPickups(), 1);
t.stepPickups(20);
H.eq('超时掉落物被移除', t.getPickups(), 0);

// 6. 非法索引被拒
t.reset(); t.start();
t.applyPickup(99);
H.eq('非法索引不报错且掉落物=0', t.getPickups(), 0);

// 7. 回归：无 buff 时原判定逻辑不变（正中=100，错键失误+1）
t.reset(); t.start(); t.setSpawnEnabled(false); t.clearNotes();
const HYr = t.getState().hitLineY;
t.spawnNote(0, HYr);
t.applyAction(0);
H.eq('回归: 正中得分=100', t.getState().score, 100);
H.eq('回归: 连击=1', t.getState().combo, 1);
// 还原掉落 PRNG 为默认随机流（确定性块结束）
t.setRand(Math.random);
