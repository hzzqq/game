const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../tictactoe.html');

// 锁定地狱档：aiRandom=0 → 纯 minimax，保证以下确定性断言不受随机弱化影响
t.setDifficulty('hell');

// ---------- 常量 ----------
eq('HUMAN=1', t.HUMAN, 1);
eq('AI=2', t.AI, 2);
eq('EMPTY=0', t.EMPTY, 0);
eq('LINES 8 条', t.LINES.length, 8);

// ---------- winner 判定 ----------
{
  const E=0,H=1,A=2;
  function B(a){ return a.slice(); }
  // 行
  eq('行0 人赢', t.winner([H,H,H,E,E,E,E,E,E]), H);
  eq('行1 机赢', t.winner([E,E,E,A,A,A,E,E,E]), A);
  // 列
  eq('列0 人赢', t.winner([H,E,E,H,E,E,H,E,E]), H);
  // 对角
  eq('主对角 机赢', t.winner([A,E,E,E,A,E,E,E,A]), A);
  eq('副对角 人赢', t.winner([E,E,H,E,H,E,H,E,E]), H);
  // 无赢
  ok('空盘无赢', t.winner([E,E,E,E,E,E,E,E,E])===null);
  ok('混战无赢', t.winner([H,A,H,A,H,A,E,E,E])===null);
}
// ---------- isFull / avail ----------
{
  ok('满盘 isFull', t.isFull([1,2,1,2,1,2,2,1,2])===true);
  ok('空盘非满', t.isFull([0,0,0,0,0,0,0,0,0])===false);
  eq('avail 空盘 9 个', t.avail([0,0,0,0,0,0,0,0,0]).length, 9);
  eq('avail 半盘', t.avail([1,2,1,2,0,0,0,0,0]).length, 5);
}

// ---------- aiMove：一步制胜 ----------
{
  // AI(2) 在 [2,2,0, 1,1,0, 1,0,0] 中，第2位可连成 2,2,2 行0
  const b=[2,2,0, 1,1,0, 1,0,0];
  const m=t.aiMove(b);
  eq('AI 一步制胜选位2', m, 2);
}
// ---------- aiMove：封堵玩家一步赢 ----------
{
  // 人(1) 行0 已有 1,1,0，AI(2) 必须堵位2
  const b=[1,1,0, 2,0,0, 2,0,0];
  const m=t.aiMove(b);
  eq('AI 封堵选位2', m, 2);
}
// ---------- aiMove：无空返回 -1 ----------
{
  eq('满盘 aiMove -1', t.aiMove([1,2,1,2,1,2,2,1,2]), -1);
}

// ---------- AI 永不落败：随机玩家多局对战 ----------
{
  let humanWins=0, games=200;
  for(let g=0; g<games; g++){
    t.reset();
    // 玩家随机走，AI 用 aiMove 回应（通过 humanMove 接口驱动）
    let guard=0;
    while(!t.isOver() && guard++<9){
      const av=t.avail(t.getBoard());
      // 随机选一个玩家落子
      const pos=av[Math.floor(Math.random()*av.length)];
      t.humanMove(pos); // 内部会触发 AI 回应
    }
    const w=t.winner(t.getBoard());
    if(w===t.HUMAN) humanWins++;
  }
  eq('200 局随机玩家 AI 从未落败', humanWins, 0);
}

// ---------- humanMove 基本流程 ----------
{
  t.reset();
  t.setRecord({w:0,l:0,d:0});
  const r=t.humanMove(0); // 人落位0
  ok('humanMove 成功', r.ok===true);
  eq('位0 变人', t.getBoard()[0], 1);
  ok('落子后轮到 AI（cur 非人 或 已 over）', t.getCur()!==1 || t.isOver());
}
{
  // 人故意走成平局（构造已知平局序列）：人位0, AI 自动；再人位1...
  t.reset();
  // 手动构造一个快结束、AI 必胜局面已覆盖；这里验证平局分支
  const seq=[0,4,8,2,6,3,5,7,1]; // 交替落子，最终平（AI 会介入，但 humanMove 每次触发 AI）
  // 简化：直接验证 finishIfDone 平局逻辑通过 humanMove 不抛错
  let okk=true;
  try{ for(const p of seq){ if(!t.isOver()) t.humanMove(p); } }catch(e){ okk=false; }
  ok('连续 humanMove 不抛错', okk);
}

// ---------- 难度系统 ----------
{
  eq('4 档难度', Object.keys(t.DIFFICULTY).length, 4);
  ok('含简单', t.DIFFICULTY.easy.label==='简单');
  ok('含地狱', t.DIFFICULTY.hell.label==='地狱');
  eq('地狱档 aiRandom=0', t.DIFFICULTY.hell.aiRandom, 0);
  ok('简单档随机率 > 困难档', t.DIFFICULTY.easy.aiRandom > t.DIFFICULTY.hard.aiRandom);
  // setDifficulty 合法/非法
  ok('setDifficulty(easy) 成功', t.setDifficulty('easy')===true);
  eq('getDifficulty=easy', t.getDifficulty(), 'easy');
  ok('setDifficulty(bad) 失败', t.setDifficulty('nope')===false);
  eq('非法档不改变现值', t.getDifficulty(), 'easy');
  // 简单档：注入固定随机流，验证会走随机步（而非最优封堵）
  t.setDifficulty('easy');
  {
    // 局面：人占 3,4（行1 两子）→ 最优应封堵位5；avail[0]=1≠5，可区分随机与最优
    const b=[2,0,0, 1,1,0, 0,0,0];
    t.setDifficulty('hell'); t.setRand(Math.random);
    eq('地狱档封堵人行→位5', t.aiMove(b.slice()), 5);
    t.setDifficulty('easy'); t.setRand(()=>0.0);
    eq('简单档随机→首个空位1', t.aiMove(b.slice()), 1);
  }
  t.setDifficulty('hell'); t.setRand(Math.random); // 复位
}

console.log('tictactoe: 全部断言通过');
