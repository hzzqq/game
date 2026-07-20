const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../klotski.html');

// ===== 1. 已解局面判定胜利 =====
{
  t.setPieces([
    {id:'cao', name:'曹操', r:2, c:1, w:2, h:2, cao:true, kind:'cao'},
  ]);
  ok('曹操在出口(2,1)→胜利', t.isWin()===true);
  const ex=t.getExit();
  eq('出口坐标 (2,1)', ex[0]===2 && ex[1]===1, true);
}

// ===== 2. 曹操不在出口→未胜 =====
{
  t.setPieces([
    {id:'cao', name:'曹操', r:0, c:1, w:2, h:2, cao:true, kind:'cao'},
  ]);
  ok('曹操在顶部→未胜', t.isWin()===false);
}

// ===== 3. 合法移动：兵滑入空格 =====
{
  t.setPieces([
    {id:'cao', name:'曹操', r:0, c:1, w:2, h:2, cao:true, kind:'cao'},
    {id:'s1',  name:'兵', r:3, c:1, w:1, h:1, cao:false, kind:'sol'},
  ]);
  ok('兵向右滑入空格 (3,2)', t.move('s1',0,1)===true);
  const ps=t.getPieces();
  const s1=ps.find(p=>p.id==='s1');
  eq('兵移到 (3,2)', s1.r===3 && s1.c===2, true);
}

// ===== 4. 非法移动：撞其他块/越界被拒 =====
{
  t.setPieces([
    {id:'cao', name:'曹操', r:0, c:1, w:2, h:2, cao:true, kind:'cao'},
    {id:'s1',  name:'兵', r:2, c:1, w:1, h:1, cao:false, kind:'sol'},
  ]);
  // 兵(2,1) 上方是曹操(占 (1,1)) → 上移撞块
  ok('兵上移撞曹操被拒', t.move('s1',-1,0)===false);
  // 兵(2,1) 右移 (2,2) 为空 → 合法（不越界）
  ok('兵右移 (2,2) 合法', t.move('s1',0,1)===true);
}

// ===== 5. 越界移动被拒 =====
{
  t.setPieces([
    {id:'s1', name:'兵', r:0, c:0, w:1, h:1, cao:false, kind:'sol'},
  ]);
  ok('兵向左越界被拒', t.move('s1',0,-1)===false);
  ok('兵向上越界被拒', t.move('s1',-1,0)===false);
}

// ===== 6. 胜利后锁定 =====
{
  t.setPieces([
    {id:'cao', name:'曹操', r:2, c:1, w:2, h:2, cao:true, kind:'cao'},
    {id:'s1',  name:'兵', r:0, c:0, w:1, h:1, cao:false, kind:'sol'},
  ]);
  ok('已胜状态', t.isWin()===true);
  ok('胜利后移动被拒', t.move('s1',0,1)===false);
}
