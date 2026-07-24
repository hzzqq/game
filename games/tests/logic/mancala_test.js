const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../mancala.html');

// ===== 1. 新局初始化 =====
{
  t.newGame();
  const b=t.getBoard();
  ok('每侧 6 坑各 4 子', OWNsum(b,0)===24 && OWNsum(b,1)===24);
  eq('你大库初始 0', b[6], 0);
  eq('对手大库初始 0', b[13], 0);
  eq('开局轮到你', t.getCurrent(), 0);
}
function OWNsum(b,p){ return (p===0?[0,1,2,3,4,5]:[7,8,9,10,11,12]).reduce((s,i)=>s+b[i],0); }

// ===== 2. 基础 sow：从 pit0 播 4 子 =====
{
  t.newGame();
  const ok1 = t.sow(0,0);
  ok('sow(0,0) 合法', ok1===true);
  const b=t.getBoard();
  // 取走 pit0 的 4 子，依次放入 1,2,3,4；最后落在 pit4（己方坑，非大库）→ 切换对手
  eq('pit0 清空', b[0], 0);
  eq('pit1=5', b[1], 5);
  eq('pit4=5', b[4], 5);
  eq('pit5=4', b[5], 4);
  eq('切换为对手', t.getCurrent(), 1);
}

// ===== 3. 非法走子被拒 =====
{
  // 构造：pit0 空、其余你方坑有子，轮到你
  t.setBoard([0,4,4,4,4,4, 0, 4,4,4,4,4,4, 0], 0);
  ok('空坑不能走', t.sow(0,0)===false);
  ok('非空坑可走', t.sow(0,1)===true);
  // 对手回合不能动你的坑
  t.setBoard([4,4,4,4,4,4, 0, 4,4,4,4,4,4, 0], 1);
  ok('非当前玩家不能走', t.sow(0,0)===false);
}

// ===== 4. 额外回合：最后一子落入自己大库 =====
{
  // 构造：pit5 有 1 子，其余己方坑 0；大库 0
  t.setBoard([0,0,0,0,0,1, 0, 0,0,0,0,0,0, 0], 0);
  const extra = t.sow(0,5);
  ok('最后一子落己方大库→额外回合', t.getCurrent()===0);
  eq('大库收到 1 子', t.getStore(0), 1);
}

// ===== 5. 吃子：落进己方空格且对面有子 =====
{
  // 你 pit4 有 1 子，其余己方坑空；对手 pit7(对面 of pit5? 12-5=7) 有 3 子
  t.setBoard([0,0,0,0,1,0, 0, 3,0,0,0,0,0, 0], 0);
  t.sow(0,4);
  eq('吃子后你大库=4（自身1+对面3）', t.getStore(0), 4);
  eq('pit5 清空', t.getBoard()[5], 0);
  eq('对面 pit7 清空', t.getBoard()[7], 0);
  eq('吃子后切换对手', t.getCurrent(), 1);
}

// ===== 6. 终局判定与胜负 =====
{
  // 你仅 pit0 有 1 子，对手全空；轮到你
  t.setBoard([1,0,0,0,0,0, 0, 0,0,0,0,0,0, 0], 0);
  t.sow(0,0); // 1 子落入 pit1（己方空格），无对面子，切换对手
  ok('对手坑全空→终局', t.isOver()===true);
  eq('你剩余 1 子归你大库', t.getStore(0), 1);
  eq('你获胜', t.getWinner(), 0);
}

// ---------- 难度系统 ----------
{
  eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty 返回 hell', t.getDifficulty(), 'hell');
  eq('setDifficulty(非法) 返回 false', t.setDifficulty('x'), false);
}

// ---------- 胜利 confetti ----------
{
  t.newGame();
  t.setBoard([0,0,0,0,0,0, 10, 0,0,0,0,0,0, 5], 0); // 你大库 10 > 对手 5
  t.checkEnd();
  eq('玩家(绿)获胜', t.getWinner(), 0);
  eq('胜利 confetti 触发', t.confettiFired(), true);
}
