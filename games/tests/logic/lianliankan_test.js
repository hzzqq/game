const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../lianliankan.html');

// 确定性随机
t.setRand(()=>0.42);

// ---------- 常量 ----------
eq('ROWS=8', t.ROWS, 8);
eq('COLS=9', t.COLS, 9);
eq('SYMS=9', t.SYMS, 9);
eq('SYM_CHARS 9 种', t.SYM_CHARS.length, 9);

// ---------- 初始化成对 ----------
{
  t.reset();
  const g = t.getGrid();
  const cnt = {};
  let total = 0;
  for(let r=0;r<8;r++) for(let c=0;c<9;c++){ const v=g[r][c]; if(v!==0){ cnt[v]=(cnt[v]||0)+1; total++; } }
  eq('总格数 72', total, 72);
  ok('每种符号出现偶数次', Object.values(cnt).every(n=>n%2===0));
  eq('countLeft=72', t.countLeft(), 72);
}

// ---------- reachable：直线相邻 ----------
{
  t.reset();
  t.setCell(0,0,5); t.setCell(0,1,5);
  // 清掉中间其余干扰：把它们设为 0 不可行（需成对）。直接测这两个在空环境
  // 构造一个干净棋盘：全空再放两个
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  t.setCell(0,0,5); t.setCell(0,1,5);
  ok('相邻同符直线连通', t.reachable({r:0,c:0},{r:0,c:1})===true);
}

// ---------- reachable：被阻挡不通 ----------
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  t.setCell(0,0,5); t.setCell(0,2,5);
  t.setCell(0,1,7); // 中间隔一个不同符号（非空），直线不通；但可绕外圈
  // 0,0 到 0,2：直线被 0,1 阻挡，但可走 外圈 (r=-1) 绕行 → 仍连通
  ok('隔一个可绕外圈连通', t.reachable({r:0,c:0},{r:0,c:2})===true);
}
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  t.setCell(0,0,5); t.setCell(2,2,5);
  // 完全封死：四周填满不同符号
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) if((r===0&&c===0)||(r===2&&c===2)) continue; else t.setCell(r,c, (r*9+c)%4+1);
  ok('四周封死不连通', t.reachable({r:0,c:0},{r:2,c:2})===false);
}

// ---------- reachable：单拐角 ----------
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  t.setCell(0,0,5); t.setCell(2,2,5);
  ok('单拐角 (经 0,2 或 2,0) 连通', t.reachable({r:0,c:0},{r:2,c:2})===true);
}

// ---------- reachable：不同符号不通 ----------
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  t.setCell(0,0,5); t.setCell(0,1,6);
  ok('不同符号不连通', t.reachable({r:0,c:0},{r:0,c:1})===false);
}

// ---------- tryRemove + 计分 ----------
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  t.setCell(0,0,5); t.setCell(0,1,5);
  t.setScore(0); t.setSel(null);
  const before = t.getScore();
  const okk = t.tryRemove({r:0,c:0},{r:0,c:1});
  ok('tryRemove 成功', okk===true);
  eq('消除后两格为空', t.getCell(0,0), 0);
  eq('消除后两格为空2', t.getCell(0,1), 0);
  ok('得分增加 (>0)', t.getScore()>before);
}
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  t.setCell(0,0,5); t.setCell(2,2,5);
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) if((r===0&&c===0)||(r===2&&c===2)) continue; else t.setCell(r,c,(r*9+c)%4+1);
  const okk = t.tryRemove({r:0,c:0},{r:2,c:2});
  ok('封死时 tryRemove 失败', okk===false);
  eq('封死时格子不变', t.getCell(0,0), 5);
}

// ---------- findHint / hasMove ----------
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  t.setCell(0,0,5); t.setCell(0,1,5);
  const h = t.findHint();
  ok('findHint 找到一对', h!==null && h.length===2);
  ok('hasMove 为真', t.hasMove()===true);
}
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  t.setCell(0,0,5); t.setCell(7,8,5); // 仅两个相同，且四周围满不同符号
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) if((r===0&&c===0)||(r===7&&c===8)) continue; else t.setCell(r,c,(r*9+c)%4+1);
  // 外圈通道下该对角对仍需 >2 拐角，不可达
  ok('封死对角对 reachable 为假', t.reachable({r:0,c:0},{r:7,c:8})===false);
  ok('封死对角对 tryRemove 失败', t.tryRemove({r:0,c:0},{r:7,c:8})===false);
}

// ---------- isWin ----------
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  ok('全空 isWin 真', t.isWin()===true);
  t.setCell(3,3,5);
  ok('有子 isWin 假', t.isWin()===false);
}

// ---------- reshuffle 保持成对 ----------
{
  t.reset();
  const vals=[]; for(let r=0;r<8;r++) for(let c=0;c<9;c++) if(t.getCell(r,c)!==0) vals.push(t.getCell(r,c));
  t.reshuffle();
  const vals2=[]; for(let r=0;r<8;r++) for(let c=0;c<9;c++) if(t.getCell(r,c)!==0) vals2.push(t.getCell(r,c));
  eq('reshuffle 后非空格数不变', vals.length, vals2.length);
}

// ---------- 胜利特效：清盘 isWin 触发 celebrate（Juice 桩无 confetti → 不崩） ----------
{
  t.reset();
  for(let r=0;r<8;r++) for(let c=0;c<9;c++) t.setCell(r,c,0);
  ok('清盘后 isWin 真', t.isWin()===true);
  let threw=false;
  try { t.celebrateOnWin(); } catch(e){ threw=true; }
  ok('celebrateOnWin 不抛错', threw===false);
  ok('清盘触发 celebrate 标志', t.wasCelebrated()===true);
  let threw2=false; try{ t.triggerWinEffect(); }catch(e){ threw2=true; }
  ok('triggerWinEffect 不抛错', threw2===false);
}

console.log('lianliankan: 全部断言通过');

// ===== confetti：清盘后完成特效标记（纯追加，不改上方旧断言）=====
(() => {
  const { t: ll } = loadGame('../lianliankan.html');
  ok('lianliankan confetti: 初始未标记', ll.confettiFired === false);
  for (let r = 0; r < ll.ROWS; r++) for (let c = 0; c < ll.COLS; c++) ll.setCell(r, c, 0);
  ll.setCell(0, 0, 5); ll.setCell(0, 1, 5);
  ok('lianliankan confetti: 尚余一对未消除', ll.isWin() === false);
  const rm = ll.tryRemove({ r: 0, c: 0 }, { r: 0, c: 1 });
  ok('lianliankan confetti: 相邻同符可消除', rm === true);
  ok('lianliankan confetti: 全部消除即胜', ll.isWin() === true);
  ll.celebrateOnWin();
  ok('lianliankan confetti: 通关后标记完成特效', ll.confettiFired === true);
  ll.reset();
  ok('lianliankan confetti: 重置恢复未标记', ll.confettiFired === false);
})();

// ===== T-129：本地 Top5 排行榜（Common.HighScores 数据层）=====
(() => {
  ok('lianliankan 排行榜 清空成功', t.clearTop5() === true);
  ok('lianliankan 排行榜 0 分不入榜', t.recordScore(0) === 0);
  ok('lianliankan 排行榜 空榜无记录', t.getTop5().length === 0);
  ok('lianliankan 排行榜 9999 上榜第 1', t.recordScore(9999) === 1);
  ok('lianliankan 排行榜 榜首=9999', t.getTop5()[0].score === 9999);
  ok('lianliankan 排行榜 8888 上榜第 2', t.recordScore(8888) === 2);
  for (let i = 0; i < 6; i++) t.recordScore(10000 + i);
  ok('lianliankan 排行榜 最多保留 5 条', t.getTop5().length === 5);
  ok('lianliankan 排行榜 截断后榜首仍最大', t.getTop5()[0].score === 10005);
  t.clearTop5();
  ok('lianliankan 排行榜 收尾清空', t.getTop5().length === 0);
})();
