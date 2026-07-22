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
