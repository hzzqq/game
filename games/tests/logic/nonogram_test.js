const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../nonogram.html');

// ===== 1. 提示计算正确 =====
{
  // 已知解：第 0 行 [1,1,0,0,1] → 提示 [2,1]
  const sol=[
    [1,1,0,0,1],
    [0,0,0,0,0],
    [1,0,1,0,1],
    [0,1,1,1,0],
    [1,1,1,1,1],
  ];
  t.setSolution(sol);
  const rh=t.getRHints();
  eq('行0 提示 [2,1]', JSON.stringify(rh[0]), JSON.stringify([2,1]));
  eq('行1 提示 [0]', JSON.stringify(rh[1]), JSON.stringify([0]));
  eq('行2 提示 [1,1,1]', JSON.stringify(rh[2]), JSON.stringify([1,1,1]));
  eq('行4 提示 [5]', JSON.stringify(rh[4]), JSON.stringify([5]));
  const ch=t.getCHints();
  // 列0: [1,0,1,0,1] → [1,1,1]
  eq('列0 提示 [1,1,1]', JSON.stringify(ch[0]), JSON.stringify([1,1,1]));
  // 列4: [1,0,1,0,1] → [1,1,1]
  eq('列4 提示 [1,1,1]', JSON.stringify(ch[4]), JSON.stringify([1,1,1]));
}

// ===== 2. 还原解即胜 =====
{
  const sol=[
    [1,1,0,0,1],
    [0,0,0,0,0],
    [1,0,1,0,1],
    [0,1,1,1,0],
    [1,1,1,1,1],
  ];
  t.setSolution(sol);
  for(let r=0;r<5;r++)for(let c=0;c<5;c++) if(sol[r][c]) t.toggle(r,c);
  ok('完全还原→胜利', t.isWin() && t.isOver());
  eq('填充数 = 解中 1 的个数', t.getFilled(), sol.flat().reduce((a,b)=>a+b,0));
}

// ===== 3. 还原一半不算胜，错填也不算 =====
{
  const sol=[
    [1,0,0,0,0],
    [0,1,0,0,0],
    [0,0,1,0,0],
    [0,0,0,1,0],
    [0,0,0,0,1],
  ];
  t.setSolution(sol);
  t.toggle(0,0); t.toggle(1,1); // 仅还原 2 个
  ok('部分还原未胜', t.isWin()===false);
  t.toggle(2,0); // 错填一个 (2,0) 应为 0
  ok('错填仍未胜', t.isWin()===false);
}

// ===== 4. 切换 toggle 取消填充 =====
{
  const sol=[
    [1,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,1],
  ];
  t.setSolution(sol);
  t.toggle(0,0);
  eq('toggle 后填充 1', t.getFilled(), 1);
  ok('仅填 1 格未胜', t.isWin()===false);
  t.toggle(0,0); // 再点取消
  eq('再 toggle 取消→0', t.getFilled(), 0);
  ok('取消后未胜', t.isWin()===false);
}

// ===== _confettiFired 只读钩子范式：还原成功彩带标记（纯视觉，不改玩法） =====
(function () {
  const N = 5;
  const sol = Array.from({length:N},()=>new Array(N).fill(0));
  for(let i=0;i<N;i++) sol[i][i]=1;   // 对角 5 格为 1

  // 1) 初始未触发
  t.setSolution(sol);
  eq('nonogram: 初始 confettiFired=false', t.confettiFired(), false);

  // 2) 还原解 → 触发
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(sol[r][c]) t.toggle(r,c);
  ok('nonogram: 还原后 isWin=true', t.isWin()===true);
  eq('nonogram: 通关后 confettiFired=true', t.confettiFired(), true);

  // 3) 新局重置为 false
  t.newGame();
  eq('nonogram: 新局后 confettiFired=false', t.confettiFired(), false);
})();

// ===== confetti 钩子汇总（确保 exit 0） =====
{
  const Hmod = require('./harness');
  const allTotal = Hmod.results.length;
  const allPass = Hmod.results.filter(x => x.pass).length;
  console.log(`nonogram(confetti-hook): ${allPass}/${allTotal} 通过`);
  if (allPass !== allTotal) process.exit(1);
}
