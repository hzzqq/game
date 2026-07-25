const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../dotsboxes.html');

// ===== 1. 初始化（4x4 点 → 3x3 格） =====
{
  t.newGame(4,4);
  const [R,C]=t.getRC();
  eq('R=4', R, 4); eq('C=4', C, 4);
  eq('横线 4x3', t.getH().length*100 + t.getH()[0].length, 403);
  eq('竖线 3x4', t.getV().length*100 + t.getV()[0].length, 304);
  eq('方格 3x3', t.getOwner().length*100 + t.getOwner()[0].length, 303);
}

// ===== 2. 非法画线被拒 =====
{
  t.newGame(4,4);
  ok('横线越列界被拒', t.playH(0,3)===false);   // c 必须 < C-1=3
  ok('横线负索引被拒', t.playH(-1,0)===false);
  ok('合法横线', t.playH(0,0)===true);
  ok('重复画线被拒', t.playH(0,0)===false);
}

// ===== 3. 不成格则切换回合 =====
{
  t.newGame(4,4);
  t.playH(0,0); // 未成格
  eq('未成格→切换对手', t.getCurrent(), 1);
}

// ===== 4. 成格得分 + 额外回合 =====
{
  // 用 setRaw 构造 box(0,0) 已画 3 边（缺右边 v[0][1]），轮到你
  const h=[[true,false,false],[true,false,false],[false,false,false],[false,false,false]];
  const v=[[true,false,false,false],[false,false,false,false],[false,false,false,false]];
  const own=[[-1,-1,-1],[-1,-1,-1],[-1,-1,-1]];
  t.setRaw(h,v,own,0,[0,0]);
  ok('补最后一边成格', t.playV(0,1)===true);
  eq('box(0,0) 归你', t.getOwner()[0][0], 0);
  eq('你得分 +1', t.getScores()[0], 1);
  eq('成格后可再走（不切换）', t.getCurrent(), 0);
}

// ===== 5. 一格小局：画满即终局判胜 =====
{
  t.newGame(2,2); // 1 个方格
  const h=[[true],[true]];
  const v=[[true,false]];
  const own=[[-1]];
  t.setRaw(h,v,own,0,[0,0]);
  t.playV(0,1); // 补右边成格
  ok('全格分完→终局', t.isOver()===true);
  eq('你获胜', t.getWinner(), 0);
  eq('你占 1 格', t.getScores()[0], 1);
}

// ---------- 难度系统 ----------
{
  eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty 返回 hell', t.getDifficulty(), 'hell');
  eq('setDifficulty(非法) 返回 false', t.setDifficulty('x'), false);
}

// ---------- 胜利 confetti ----------
{
  t.newGame(2,2); // 1 个方格
  const h=[[true],[true]];
  const v=[[true,false]];
  const own=[[-1]];
  t.setRaw(h,v,own,0,[0,0]);
  t.playV(0,1); // 补右边成格 → 绿方得格且全盘终局
  eq('玩家(绿)获胜', t.getWinner(), 0);
  eq('胜利 confetti 触发', t.confettiFired(), true);
}

// ---------- 手感深化：fxShakes / fxBursts 反馈层（纯追加，不改动玩法）----------
{
  t.newGame(4,4);
  eq('手感: 初始 fxShakes=0', t.fxShakes(), 0);
  eq('手感: 初始 fxBursts=0', t.fxBursts(), 0);
}
{
  // 玩家(绿)补最后一边成格 → burst
  const h=[[true,false,false],[true,false,false],[false,false,false],[false,false,false]];
  const v=[[true,false,false,false],[false,false,false,false],[false,false,false,false]];
  const own=[[-1,-1,-1],[-1,-1,-1],[-1,-1,-1]];
  t.setRaw(h,v,own,0,[0,0]);
  t.playV(0,1); // 绿方成格
  ok('手感: 玩家成格触发 burst', t.fxBursts()>0);
  eq('手感: 玩家成格不触发对手 shake', t.fxShakes(), 0);
}
{
  // 对手(红, current=1)一步连吃 2 格 → shake + burst
  t.newGame(3,3);
  const h=[[true,false],[false,false],[true,false]];
  const v=[[true,true,false],[true,true,false]];
  const own=[[-1,-1],[-1,-1]];
  t.setRaw(h,v,own,1,[0,0]);
  t.playH(1,0); // 红方一步补 h[1][0]，同时闭合 box(0,0) 与 box(1,0)
  ok('手感: 对手连吃2格触发 shake', t.fxShakes()>0);
  ok('手感: 对手连吃2格触发 burst', t.fxBursts()>0);
}
{
  // newGame 归零
  t.newGame(4,4);
  eq('手感: newGame 后 fxShakes 归零', t.fxShakes(), 0);
  eq('手感: newGame 后 fxBursts 归零', t.fxBursts(), 0);
}
