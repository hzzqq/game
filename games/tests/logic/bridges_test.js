const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../bridges.html');

// ===== 1. 一行三岛：正解→胜利 =====
{
  t.setBoard([
    {r:0,c:0,deg:1},
    {r:0,c:2,deg:2},
    {r:0,c:4,deg:1},
  ]);
  ok('A-B 建桥合法', t.addBridge(0,1,1)===true);
  eq('A 已用=1', t.usedOf(0), 1);
  ok('B-C 建桥合法', t.addBridge(1,2,1)===true);
  eq('B 已用=2', t.usedOf(1), 2);
  ok('三岛全满足且连通→胜利', t.isWin()===true);
}

// ===== 2. alignedClear 中间有岛则不通 =====
{
  t.setBoard([{r:0,c:0,deg:1},{r:0,c:4,deg:1}]);
  ok('同行无遮挡→对齐', t.alignedClear(0,1)===true);
  t.setBoard([{r:0,c:0,deg:1},{r:0,c:2,deg:1},{r:0,c:4,deg:1}]);
  ok('中间有岛→不对齐', t.alignedClear(0,2)===false);
  ok('跳过中间岛对齐', t.alignedClear(0,1)===true);
}

// ===== 3. 交叉桥被拒 =====
{
  t.setBoard([
    {r:2,c:0,deg:1},   // A 横桥左端
    {r:2,c:4,deg:1},   // B 横桥右端（row2）
    {r:0,c:2,deg:1},   // C 竖桥上端
    {r:4,c:2,deg:1},   // D 竖桥下端（col2，跨过 row2）
  ]);
  ok('横桥 A-B 合法', t.addBridge(0,1,1)===true);
  ok('竖桥 C-D 与横桥在(2,2)交叉被拒', t.addBridge(2,3,1)===false);
}

// ===== 4. 容量超限被拒 =====
{
  t.setBoard([{r:0,c:0,deg:1},{r:0,c:2,deg:1}]);
  ok('双桥超容量被拒', t.addBridge(0,1,2)===false);
  ok('单桥合法', t.addBridge(0,1,1)===true);
  ok('再加成双桥超容量被拒', t.addBridge(0,1,1)===false); // 已用满 deg=1
}

// ===== 5. 度数满足但未连通→未胜 =====
{
  t.setBoard([
    {r:0,c:0,deg:1},
    {r:0,c:2,deg:1},
    {r:2,c:0,deg:1},
    {r:2,c:2,deg:1},
  ]);
  t.addBridge(0,1,1); t.addBridge(2,3,1);
  ok('四岛度数皆满足', t.allSatisfied()===true);
  ok('两组分离→未连通', t.connected()===false);
  ok('未连通→未胜', t.isWin()===false);
}

// ===== 6. solve() 证明随机局可解（确定性 PRNG）=====
{
  let s = 31415;
  t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });
  t.newGame();
  ok('新局初始未胜', t.getState().won===false);
  const won = t.solve();
  ok('solve 后胜利（必可解）', won===true && t.isWin()===true);
  t.setRand(Math.random);
}

// ===== 7. newGame 结构性 =====
{
  let s = 808;
  t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });
  t.newGame();
  const st = t.getState();
  ok('岛屿数 5~7', st.islands.length>=5 && st.islands.length<=7);
  ok('每岛度数>=1', st.islands.every(p=>p.deg>=1));
  // 位置不重复
  const pos=new Set(st.islands.map(p=>p.r+','+p.c));
  eq('岛位置互异', pos.size, st.islands.length);
  // 度数和为偶数（握手定理）
  const sum=st.islands.reduce((a,p)=>a+p.deg,0);
  ok('度数和为偶数', sum%2===0);
  t.setRand(Math.random);
}

// ===== 8. 通关触发完成特效标记 =====
{
  t.setBoard([
    {r:0,c:0,deg:1},
    {r:0,c:2,deg:2},
    {r:0,c:4,deg:1},
  ]);
  eq('通关前未标记完成特效', t.confettiFired, false);
  ok('A-B 建桥合法', t.addBridge(0,1,1)===true);
  ok('B-C 建桥合法', t.addBridge(1,2,1)===true);
  ok('通关后标记完成特效', t.confettiFired===true);
}
