const { loadGame, eq, ok, results } = require('./harness');
const { t } = loadGame('../slots.html');

// ---------- 常量 / 符号表 ----------
ok('SYMBOLS 6 种', t.SYMBOLS.length === 6);
eq('CHERRY mult=3', t.SYMBOLS[0].mult, 3);
eq('LEMON mult=5', t.SYMBOLS[1].mult, 5);
eq('BELL mult=10', t.SYMBOLS[2].mult, 10);
eq('BAR mult=20', t.SYMBOLS[3].mult, 20);
eq('SEVEN mult=50', t.SYMBOLS[4].mult, 50);
eq('DIAMOND mult=100', t.SYMBOLS[5].mult, 100);
eq('JACKPOT_MULT=50', t.JACKPOT_MULT, 50);
eq('START_BAL=200', t.START_BAL, 200);

// ---------- pickSymbol 范围 ----------
{
  let bad=0;
  for(let i=0;i<2000;i++){ const id=t.pickSymbol(); if(!(id>=0&&id<6)) bad++; }
  ok('pickSymbol 2000 次均在 [0,6)', bad===0);
}

// ---------- makeReels 长度 + 范围 ----------
{
  let okk=true;
  for(let i=0;i<500;i++){ const r=t.makeReels(); if(r.length!==3||r.some(x=>x<0||x>=6)) okk=false; }
  ok('makeReels 500 次均为 3 个合法符号', okk);
}

// ---------- payout 赔率 ----------
eq('三连樱桃 bet10 → 30', t.payout([0,0,0],10).win, 30);
eq('三连柠檬 bet10 → 50', t.payout([1,1,1],10).win, 50);
eq('三连铃铛 bet10 → 100', t.payout([2,2,2],10).win, 100);
eq('三连BAR bet10 → 200', t.payout([3,3,3],10).win, 200);
eq('三连7 bet10 → 500', t.payout([4,4,4],10).win, 500);
eq('三连钻石 bet10 → 1000', t.payout([5,5,5],10).win, 1000);
eq('两樱桃 bet10 → 50', t.payout([0,0,1],10).win, 50);
eq('两柠檬 bet10 → 20', t.payout([1,1,2],10).win, 20);
eq('两7 bet10 → 20', t.payout([4,2,4],10).win, 20);
eq('全不同 → 0', t.payout([0,1,2],10).win, 0);
ok('三连樱桃 kind=triple', t.payout([0,0,0],10).kind==='triple');
ok('两樱桃 kind=two-cherry', t.payout([0,0,1],10).kind==='two-cherry');
ok('两同非樱桃 kind=pair', t.payout([1,2,1],10).kind==='pair');
ok('全不同 kind=none', t.payout([0,1,2],10).kind==='none');

// ---------- isJackpot ----------
ok('三连钻石是 jackpot', t.isJackpot([5,5,5],10)===true);
ok('三连7是 jackpot', t.isJackpot([4,4,4],10)===true);
ok('三连樱桃非 jackpot', t.isJackpot([0,0,0],10)===false);
ok('三连BAR非 jackpot', t.isJackpot([3,3,3],10)===false);
ok('两同非 jackpot', t.isJackpot([0,0,1],10)===false);

// ---------- setBet 校验 ----------
{
  t.reset();
  t.setBet(50); eq('setBet 50 生效', t.getBet(), 50);
  t.setBet(0);  eq('setBet 0 → 钳为 1', t.getBet(), 1);
  t.setBet(-5); eq('setBet 负 → 钳为 1', t.getBet(), 1);
  t.setBet(999999); eq('setBet 超余额 → 钳为余额', t.getBet(), 200);
}

// ---------- spin 状态机（注入确定性随机） ----------
{
  // 强制三连樱桃
  t.reset(); t.setRand(()=>0.0); // 第一档 w=30，x=0-30 落在 CHERRY
  t.setBet(10);
  const b0 = t.getBalance();
  const r = t.spin();
  eq('spin 前余额 200', b0, 200);
  eq('spin 赢 30', r.win, 30);
  eq('spin 后余额 220（扣10加30）', t.getBalance(), 220);
  ok('spin 返回 reels 长度 3', r.reels.length===3);
}
{
  // 强制全不同：用确定性序列让三个 reel 取不同符号
  t.reset();
  let seq=[0.0, 0.5, 0.9]; let i=0; // 0→CHERRY,0.5→越30落LEMON(30-55),0.9→越55+25落BELL
  t.setRand(()=>seq[(i++)%3]);
  t.setBet(10);
  const b0=t.getBalance();
  const r=t.spin();
  eq('全不同 spin 赢 0', r.win, 0);
  eq('全不同余额 190（仅扣 bet）', t.getBalance(), 190);
}
{
  // 余额不足不 spin
  t.reset(); t.setBet(200);
  const r1=t.spin(); ok('余额200 全下可 spin', r1!==null);
  // 余额可能 >0 或 =0（取决于结果）。再尝试下注超过余额
  t.setBet(9999); // 钳为余额
  const r2=t.spin();
  // 若余额已 0 则 gameOver，spin 返回 null
  ok('余额耗尽后 spin 返回 null 或合法（不抛错）', r2===null || (r2 && typeof r2.win==='number'));
}
{
  // gameOver 后 spin 返回 null
  t.reset();
  // 直接下注 200 全下，若输则归零
  t.setRand(()=>0.0); t.setBet(200);
  // 三连樱桃 → 赢 600，不归零；换全不同序列
  let seq=[0.0,0.5,0.9]; let i=0; t.setRand(()=>seq[(i++)%3]);
  // 重置后再测 gameOver 逻辑
  t.reset();
  t.setBet(10);
  // 连续全不同直到余额归零
  let guard=0;
  while(!t.isGameOver() && guard++<100){ t.setBet(Math.min(10,t.getBalance())); t.spin(); }
  ok('连续全不同最终 gameOver', t.isGameOver()===true);
  const r=t.spin();
  ok('gameOver 后 spin 返回 null', r===null);
}

console.log('slots: 全部断言通过');

// ===== jackpot 大奖 confetti 测试（仅视觉反馈钩子，不改玩法）=====
t.reset(); t.setRand(()=>0.99); t.setBet(10); // 三连钻石（mult 100>=50 → jackpot）
ok('slots: jackpot 前 confettiFired 为 false', t.confettiFired() === false);
const r = t.spin();
ok('slots: 三连钻石为 jackpot', r.jackpot === true);
ok('slots: jackpot → confettiFired 为真', t.confettiFired() === true);
ok('slots: jackpot 后余额增加（1000 赢）', t.getBalance() === 1190);
// reset 清空锁后，新一局 jackpot 可再次触发（验证锁随新局重置）
t.reset(); t.setRand(()=>0.99); t.setBet(10);
ok('slots: reset 后 confettiFired 重置为 false', t.confettiFired() === false);
t.spin();
ok('slots: 新一局 jackpot 可再次触发 confetti', t.confettiFired() === true);

const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nslots: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
