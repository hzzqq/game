const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../mini2048.html');

// ---------- 常量 ----------
eq('SIZE=3', t.SIZE, 3);
eq('WIN=128', t.WIN, 128);

// 用确定随机：spawn 取第 1 个空格、值为 2（_rand<0.9）
function lockRand(){ t.setRand(()=>0); }

// ---------- 合并：向左 2 2 0 -> 4 ----------
{
  t.reset(); lockRand();
  t.setBoard([[2,2,0],[0,0,0],[0,0,0]]);
  const r = t.move('left');
  ok('发生移动', r.moved===true);
  eq('得分 +4', r.gained, 4);
  const st = t.getState();
  eq('(0,0)=4', st.board[0][0], 4);
  // spawn 落在 (0,1) 值为 2
  eq('spawn (0,1)=2', st.board[0][1], 2);
  eq('状态 playing', st.status, 'playing');
}
// ---------- 合并：向左 2 2 2 -> 4 2（只合并一次） ----------
{
  t.reset(); lockRand();
  t.setBoard([[2,2,2],[0,0,0],[0,0,0]]);
  const r = t.move('left');
  eq('得分 +4', r.gained, 4);
  const st = t.getState();
  eq('(0,0)=4', st.board[0][0], 4);
  eq('(0,1)=2', st.board[0][1], 2);
}
// ---------- 向右合并 ----------
{
  t.reset(); lockRand();
  t.setBoard([[0,2,2],[0,0,0],[0,0,0]]);
  const r = t.move('right');
  const st = t.getState();
  eq('(0,2)=4', st.board[0][2], 4);
  ok('得分 +4', r.gained===4);
}
// ---------- 向上合并（列） ----------
{
  t.reset(); lockRand();
  t.setBoard([[2,0,0],[2,0,0],[0,0,0]]);
  const r = t.move('up');
  const st = t.getState();
  eq('(0,0)=4', st.board[0][0], 4);
  ok('得分 +4', r.gained===4);
}
// ---------- 向下合并（列） ----------
{
  t.reset(); lockRand();
  t.setBoard([[2,0,0],[2,0,0],[0,0,0]]);
  const r = t.move('down');
  const st = t.getState();
  eq('(2,0)=4', st.board[2][0], 4);
  ok('得分 +4', r.gained===4);
}
// ---------- 无移动：满盘无相邻相同 -> over ----------
{
  t.reset(); lockRand();
  t.setBoard([[2,4,2],[4,2,4],[2,4,2]]);
  const r = t.move('left');
  ok('无移动', r.moved===false);
  eq('状态 over', r.status, 'over');
  const st = t.getState();
  eq('棋盘不变', JSON.stringify(st.board), JSON.stringify([[2,4,2],[4,2,4],[2,4,2]]));
}
// ---------- 胜利：64 64 -> 128 ----------
{
  t.reset(); lockRand();
  t.setBoard([[64,64,0],[0,0,0],[0,0,0]]);
  const r = t.move('left');
  const st = t.getState();
  eq('(0,0)=128', st.board[0][0], 128);
  eq('状态 win', st.status, 'win');
  ok('hasValue(128)', t.hasValue(128)===true);
}
// ---------- 起始棋盘有 2 个方块 ----------
{
  t.reset(); lockRand();
  const st = t.getState();
  let count=0; for(let r=0;r<3;r++) for(let c=0;c<3;c++) if(st.board[r][c]!==0) count++;
  eq('初始 2 个方块', count, 2);
}
// ---------- over 后 move 无效 ----------
{
  t.reset(); lockRand();
  t.setBoard([[2,4,2],[4,2,4],[2,4,2]]);
  t.move('left'); // -> over
  const r = t.move('right');
  ok('over 后 move moved=false', r.moved===false);
}

// ---------- 胜利特效：达成 128 触发 celebrate（Juice 桩无 confetti → 不崩） ----------
{
  t.reset(); lockRand();
  t.setBoard([[64,64,0],[0,0,0],[0,0,0]]);
  let threw=false;
  try { t.move('left'); } catch(e){ threw=true; }
  ok('胜利 move 不抛错 (confetti 被守卫)', threw===false);
  ok('胜利触发 celebrate 标志', t.wasCelebrated()===true);
  let threw2=false;
  try { t.triggerWinEffect(); } catch(e){ threw2=true; }
  ok('triggerWinEffect 不抛错', threw2===false);
}

console.log('mini2048: 全部断言通过');
