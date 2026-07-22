// 激光反射迷宫 · 逻辑单测
// 经 window.__t 钩子确定性驱动：镜面反射、命中判定、旋转切换。
const H = require('./harness');
const { t } = H.loadGame('../lazermaze.html');

// 1) 初始
t.reset();
let s = t.getState();
H.eq('初始: 网格=8', s.grid, 8);
H.eq('初始: 未命中', s.won, false);

// 2) 正确布阵命中目标
t.reset();
t.setStart(0, 0, 'right');
t.setTarget(0, 6);
t.setMirrors({ '6,0': '\\', '6,6': '/' });
t.update();
s = t.getState();
H.eq('布阵正确: 命中目标', s.won, true);
H.ok('布阵正确: 光束非空', s.beam.length > 1);

// 3) 无镜面则脱靶
t.reset();
t.setStart(0, 0, 'right');
t.setTarget(0, 6);
t.update();
H.eq('无镜面: 脱靶', t.getState().won, false);

// 4) 反射公式
H.eq("反射 '/': 右→上", t.reflect(1, 0, '/'), [0, -1]);
H.eq("反射 '/': 下→左", t.reflect(0, 1, '/'), [-1, 0]);
H.eq("反射 '\\\\': 右→下", t.reflect(1, 0, '\\'), [0, 1]);

// 5) 旋转镜面改变结果
t.reset();
t.setStart(0, 0, 'right');
t.setTarget(0, 6);
t.setMirrors({ '6,0': '\\', '6,6': '/' });
t.update();
H.eq('旋转前: 命中', t.getState().won, true);

t.rotateMirror(6, 0); // \\ -> /
H.eq('旋转(6,0)后: 镜面变为 /', t.getState().mirrors['6,0'], '/');
H.eq('旋转(6,0)后: 脱靶', t.getState().won, false);

t.rotateMirror(6, 0); // / -> \\
H.eq('再旋转(6,0)后: 镜面变回 \\', t.getState().mirrors['6,0'], '\\');
H.eq('再旋转(6,0)后: 重新命中', t.getState().won, true);

// reset 后状态可读取（确定性，Juice 守卫不报错）
t.reset();
let rs = t.getState();
H.ok('reset 后状态可读取', rs && typeof rs.moves === 'number' && rs.running === true);

// ===== 注入式掉落/增益系统（确定性驱动，setRand 控制掉落 PRNG）=====
t.setRand(123);

// 1. 生成掉落物 + 金币计分
t.reset();
t.spawnPickup('coin', 200, 100);
H.eq('生成 1 个掉落物', t.getPickups(), 1);
const coinsBefore = t.getCoins(), scoreBefore = t.getScore();
t.applyPickup(0);
H.eq('拾取 💰 金币计数+1', t.getCoins(), coinsBefore + 1);
H.eq('拾取 💰 加分(+10)', t.getScore(), scoreBefore + 10);
H.eq('拾取后掉落物移除', t.getPickups(), 0);

// 2. 护盾：有盾 takeHit 消耗护盾（解谜无伤害，护盾为可消耗资源）
t.reset(); t.setShield(2);
t.takeHit();
H.eq('有护盾: 护盾-1', t.getShield(), 1);
t.takeHit();
H.eq('有护盾: 护盾再-1', t.getShield(), 0);
// 无盾时 takeHit 消耗 lives（默认 0，保持非负）
t.reset(); t.setLives(3);
t.takeHit();
H.eq('无盾: lives-1', t.getLives(), 2);

// 3. 加速增益：boost 置位
t.reset();
t.spawnPickup('boost', 200, 100);
H.eq('生成 boost 掉落物', t.getPickup(0).type, 'boost');
t.applyPickup(0);
H.ok('拾取 🚀 加速生效(boostTimer>0)', t.getBoost() > 0);

// 4. 回血增益：heal 增加 lives 资源
t.reset(); t.setLives(2);
t.spawnPickup('heal', 200, 100);
t.applyPickup(0);
H.eq('拾取 ❤ lives+1', t.getLives(), 3);

// 5. 掉落物随时间衰减移除（无碰撞模型，由 stepPickups 推进）
t.reset();
t.spawnPickup('coin', 200, 100);
H.eq('生成掉落物', t.getPickups(), 1);
t.stepPickups(20); // 超过 life
H.eq('超时掉落物被移除', t.getPickups(), 0);

// 6. 非法索引被拒
t.reset();
t.applyPickup(99);
H.eq('非法索引不报错且掉落物=0', t.getPickups(), 0);

// 7. 回归：掉落系统不影响核心解谜逻辑
t.reset();
t.setStart(0, 0, 'right');
t.setTarget(0, 6);
t.setMirrors({ '6,0': '\\', '6,6': '/' });
t.update();
H.eq('回归: 布阵仍命中目标', t.getState().won, true);
// 还原掉落 PRNG 为默认随机流（确定性块结束）
t.setRand(Math.random);
