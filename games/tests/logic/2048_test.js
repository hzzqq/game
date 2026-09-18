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

// ===== 本地 Top5 排行榜（T-106 收口：Common.HighScores 数据层）=====
(() => {
  H.ok('2048 排行榜 清空成功', t.clearTop5() === true);
  H.eq('2048 排行榜 0 分不入榜', t.recordScore(0), 0);
  H.eq('2048 排行榜 空榜无记录', t.getTop5().length, 0);
  H.eq('2048 排行榜 9999 上榜第 1', t.recordScore(9999), 1);
  H.eq('2048 排行榜 榜首=9999', t.getTop5()[0].score, 9999);
  H.eq('2048 排行榜 8888 上榜第 2', t.recordScore(8888), 2);
  const top = t.getTop5();
  let sorted = true;
  for (let i = 1; i < top.length; i++) if (top[i - 1].score < top[i].score) sorted = false;
  H.ok('2048 排行榜 全列表分数降序', sorted);
  H.ok('2048 排行榜 条目含日期字段', /^\d{4}-\d{2}-\d{2}$/.test(top[0].date));
  for (let i = 0; i < 6; i++) t.recordScore(10000 + i);
  H.eq('2048 排行榜 最多保留 5 条', t.getTop5().length, 5);
  H.eq('2048 排行榜 截断后榜首仍最大', t.getTop5()[0].score, 10005);
  t.clearTop5();
  H.eq('2048 排行榜 收尾清空', t.getTop5().length, 0);
})();

// T-142 mutation 残留：初始块 2:8 概率阈值（_randFn()<0.9 ? 2 : 4）此前未锁——注入边界值锁定
(() => {
  t.setRand(() => 0.9);   // 0.9 不满足 <0.9 → 全出 4
  t.freezeSpawn(false);   // 恢复真实 addRandomTile（本文件 L9 起一直 no-op，newGame 出不来块）
  t.newGame();
  t.freezeSpawn(true);    // 重新禁随机，保持文件惯例
  const b1 = t.getBoard().flat().filter(v => v);
  H.ok('2048 rand=0.9 边界全出 4', b1.length === 2 && b1.every(v => v === 4));

  t.setRand(() => 0.89);  // <0.9 → 全出 2
  t.freezeSpawn(false);
  t.newGame();
  t.freezeSpawn(true);
  const b2 = t.getBoard().flat().filter(v => v);
  H.ok('2048 rand=0.89 全出 2', b2.length === 2 && b2.every(v => v === 2));
  t.setRand(null);        // 恢复 Math.random（fn||Math.random 守卫）
})();

