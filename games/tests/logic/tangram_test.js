const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../tangram.html');

function canon(cells){ return cells.map(p=>p.slice()).sort((a,b)=>a[0]-b[0]||a[1]-b[1]); }

const BAR = [[0,0],[1,0],[2,0]]; // 竖条 I-tromino
const FULL3 = [
  [1,1,1],
  [1,1,1],
  [1,1,1],
];

// ===== 1. 已知解判定胜利 =====
{
  t.setBoard(FULL3, [BAR, BAR, BAR]);
  ok('放 P0 合法', t.place(0,0,0,0)===true);
  ok('放 P1 合法', t.place(1,0,0,1)===true);
  ok('放 P2 合法', t.place(2,0,0,2)===true);
  ok('三片铺满→胜利', t.isWin()===true);
  eq('覆盖格=9', t.coveredCount(), 9);
  eq('目标格=9', t.targetCount(), 9);
}

// ===== 2. 重叠他片被拒 =====
{
  t.setBoard(FULL3, [BAR, BAR, BAR]);
  t.place(0,0,0,0);
  ok('P1 重叠 P0 被拒', t.place(1,0,0,0)===false);
}

// ===== 3. 越界被拒 =====
{
  t.setBoard(FULL3, [BAR, BAR, BAR]);
  ok('竖条放在 (1,0) 越界被拒', t.place(0,0,1,0)===false); // (3,0) 出界
}

// ===== 4. 落在轮廓外（空洞）被拒 =====
{
  const tg=[
    [1,1,1],
    [1,0,1],
    [1,1,1],
  ];
  t.setBoard(tg, [BAR, BAR]);
  ok('放在空洞 (1,1) 被拒', t.place(0,0,0,1)===false); // 含 (1,1)
  ok('放在轮廓内合法', t.place(0,0,0,0)===true);
}

// ===== 5. 旋转几何正确 =====
{
  eq('竖条转90°=横条', JSON.stringify(canon(t.rotate(BAR,1))), JSON.stringify(canon([[0,0],[0,1],[0,2]])));
  eq('转360°=原状', JSON.stringify(canon(t.rotate(BAR,4))), JSON.stringify(canon(BAR)));
  eq('转180°=原状(竖条)', JSON.stringify(canon(t.rotate(BAR,2))), JSON.stringify(canon(BAR)));
}

// ===== 6. 取回碎片 =====
{
  t.setBoard(FULL3, [BAR, BAR, BAR]);
  t.place(0,0,0,0);
  eq('放置后覆盖=3', t.coveredCount(), 3);
  t.remove(0);
  eq('取回后覆盖=0', t.coveredCount(), 0);
}

// ===== 7. newGame：随机切分必可解（确定性 PRNG）=====
{
  let s = 777;
  t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });
  t.newGame();
  const st = t.getState();
  ok('碎片数 4~6', st.pieces>=4 && st.pieces<=6);
  let sum=0; for(const p of st.piecesDef) sum+=p.cells.length;
  eq('碎片总格数=目标格数(可解划分)', sum, st.target);
  ok('每片≥3格', st.piecesDef.every(p=>p.cells.length>=3));
  t.setRand(Math.random);
}

// ===== 8. 通关触发完成特效标记 =====
{
  t.setBoard(FULL3, [BAR, BAR, BAR]);
  eq('通关前未标记完成特效', t.confettiFired, false);
  ok('放 P0 合法', t.place(0,0,0,0)===true);
  ok('放 P1 合法', t.place(1,0,0,1)===true);
  ok('放 P2 合法', t.place(2,0,0,2)===true);
  ok('三片铺满→胜利', t.isWin()===true);
  ok('通关后标记完成特效', t.confettiFired===true);
}
