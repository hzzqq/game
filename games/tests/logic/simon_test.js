const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../simon.html');

// 确定性随机源
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let tt=Math.imul(a^a>>>15,1|a); tt=tt+Math.imul(tt^tt>>>7,61|tt)^tt; return ((tt^tt>>>14)>>>0)/4294967296; }; }

// ===== 1. 新局状态 =====
{
  t.setRand(mulberry32(1));
  t.newGame();
  eq('初始关卡 0', t.getRound(), 0);
  eq('初始未结束', t.isOver(), false);
  eq('初始序列空', t.getSequence().length, 0);
}

// ===== 2. 开始一轮：序列 +1 =====
{
  t.setRand(mulberry32(7));
  t.newGame();
  t.startRound();
  eq('第 1 轮序列长 1', t.getSequence().length, 1);
  eq('关卡=1', t.getRound(), 1);
}

// ===== 3. 正确复现 → 过关、计分 =====
{
  t.setRand(mulberry32(7));
  t.newGame();
  t.startRound();                 // seq = [s0]
  const s0 = t.getSequence()[0];
  ok('输入正确灯→该步为 true', t.input(s0)===true);
  ok('全序列复现→本关完成', t.isRoundComplete()===true);
  eq('得分=当前关卡 1', t.getScore(), 1);
  // 第二关
  t.startRound();                 // seq = [s0, s1]
  const seq=t.getSequence();
  ok('输入第 1 盏正确', t.input(seq[0])===true);
  ok('尚未完成（还差 1 盏）', t.isRoundComplete()===false);
  ok('输入第 2 盏正确→完成', t.input(seq[1])===true);
  eq('得分=当前关卡 2', t.getScore(), 2);
}

// ===== 4. 点错 → 终局 =====
{
  t.setRand(mulberry32(7));
  t.newGame();
  t.startRound();                 // seq = [s0]
  const s0=t.getSequence()[0];
  const wrong = (s0===0)?1:0;
  ok('点错灯→返回 false', t.input(wrong)===false);
  ok('点错后游戏结束', t.isOver()===true);
  eq('结束后未更新得分', t.getScore(), 0);
  // 结束后继续输入无效
  ok('结束后输入被忽略', t.input(s0)===false);
}

// ===== 5. 完成后需开新一轮才能继续输入 =====
{
  t.setRand(mulberry32(7));
  t.newGame();
  t.startRound();
  const s0=t.getSequence()[0];
  t.input(s0); // 完成第 1 关
  ok('完成态下再输入被拒', t.input(s0)===false);
}
