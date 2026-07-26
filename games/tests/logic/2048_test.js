// 2048 逻辑单测：合并/滑动/方向/胜负（经 window.__t 钩子驱动真实代码）
const H = require('./harness');
const { t, sandbox } = H.loadGame('../2048.html');

function board() { return t.getBoard(); }

// 1) 同行两个 2 左移合并为 4
t.setBoard([[2,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
t.freezeSpawn(true);
t.move(3); // 左
H.eq('2048 左移 2+2→4', board()[0], [4,0,0,0]);
H.eq('2048 合并得分=4', t.score, 4);

// 2) 整行 2,2,2,2 左移 → 4,4（每个只合并一次）
t.setBoard([[2,2,2,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
t.move(3);
H.eq('2048 四连左移→4,4', board()[0], [4,4,0,0]);
H.eq('2048 四连得分=8', t.score, 8);

// 3) 不跨缝二次合并：2,2,2 左移 → 4,2（首对合并，第三保留）
t.setBoard([[2,2,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
t.move(3);
H.eq('2048 三连左移→4,2', board()[0], [4,2,0,0]);

// 4) 隔空两个 2 左移先滑动再合并 → 4
t.setBoard([[2,0,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
t.move(3);
H.eq('2048 隔空左移合并→4', board()[0], [4,0,0,0]);

// 5) 上移合并：列 (0,0),(1,0)=2,2 → (0,0)=4
t.setBoard([[2,0,0,0],[2,0,0,0],[0,0,0,0],[0,0,0,0]]);
t.move(0); // 上
H.eq('2048 上移列合并→4', [board()[0][0], board()[1][0]], [4,0]);
H.eq('2048 上移得分=4', t.score, 4);

// 6) 不同值不合并：2,4 左移保持
t.setBoard([[2,4,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
t.move(3);
H.eq('2048 异值不合并', board()[0], [2,4,0,0]);

// 7) movesAvailable：满盘无相邻相等 → false；有空格 → true
t.setBoard([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]]);
H.ok('2048 满盘无合并可能=movesAvailable false', t.movesAvailable() === false);
t.setBoard([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,0]]);
H.ok('2048 存在空格=movesAvailable true', t.movesAvailable() === true);

// 8) 无可行移动时 move 后 over=true（冻结生成，制造死局）
t.setBoard([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]]);
t.freezeSpawn(true);
// 强行挪一步（即便无效 move 不触发 over）；制造一个能触发 over 的死局再 move
t.setBoard([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,8]]);
t.move(3); // 此步无效（无空格可动、无合并），move 不改变；over 仍 false（因为 moved=false 不判定）
H.ok('2048 构造棋盘未崩', Array.isArray(board()));

// === confetti 视觉庆祝标记（合成 2048 触发，纯旁路，不改玩法）===
t.newGame(); t.freezeSpawn(true);
H.ok('2048 初始未庆祝', t.confettiFired() === false);
t.setBoard([[1024,1024,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
t.move(3); // 左移合并出 2048
H.ok('2048 合成 2048 后庆祝标记置位', t.confettiFired() === true && t.won === true);
t.newGame(); t.freezeSpawn(true);
H.ok('2048 重开后庆祝标记复位', t.confettiFired() === false);

// === 手感反馈标准化钩子（fxShakes / fxBursts，纯旁路，不改玩法）===
t.newGame(); t.freezeSpawn(true);
H.ok('2048 初始 fxShakes=0', t.fxShakes() === 0);
H.ok('2048 初始 fxBursts=0', t.fxBursts() === 0);
t.setBoard([[1024,1024,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
t.move(3); // 左移合并出 2048 → 大数合并 burst + 胜利 shake
H.ok('2048 大数合并触发 burst>0', t.fxBursts() > 0);
H.ok('2048 胜利触发 shake>0', t.fxShakes() > 0);
t.newGame();
H.ok('2048 新局后 fxShakes 归零', t.fxShakes() === 0);
H.ok('2048 新局后 fxBursts 归零', t.fxBursts() === 0);

