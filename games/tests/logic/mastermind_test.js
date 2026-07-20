const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../mastermind.html');

// ---------- 常量 ----------
eq('LEN=4', t.LEN, 4);
eq('DOMAIN=6', t.DOMAIN, 6);
eq('MAX_STEP=10', t.MAX_STEP, 10);
eq('COLORS 6 色', t.COLORS.length, 6);

// ---------- generateSecret 范围 ----------
{
  t.setRand(()=>0.5);
  const s = t.generateSecret();
  eq('secret 长度 4', s.length, 4);
  ok('secret 每位 0..5', s.every(v=>v>=0&&v<6));
}
{
  let bad=0; t.setRand(()=>0.5);
  for(let i=0;i<500;i++){ const s=t.generateSecret(); if(s.length!==4||s.some(v=>v<0||v>=6)) bad++; }
  ok('generateSecret 500 次合法', bad===0);
}

// ---------- evaluate 反馈算法 ----------
{
  const s=[0,1,2,3];
  eq('全对 black=4 white=0', JSON.stringify(t.evaluate(s,[0,1,2,3])), JSON.stringify({black:4,white:0}));
  eq('全错 black=0 white=0', JSON.stringify(t.evaluate(s,[4,4,4,4])), JSON.stringify({black:0,white:0}));
  eq('全值对位错 black=0 white=4', JSON.stringify(t.evaluate(s,[3,2,1,0])), JSON.stringify({black:0,white:4}));
  eq('部分: [0,1,4,5]', JSON.stringify(t.evaluate(s,[0,1,4,5])), JSON.stringify({black:2,white:0}));
}
// 重复符号处理
{
  const s=[0,0,1,2];
  // guess [0,1,0,3]: 位0=0 black=1；位1=1? secret位1=0 不等；位2=0 白(匹配 secret 位0已用? 先 black)
  // 标准：black 先 → 位0匹配(0==0) black=1；位2=0 但 secret 还有一个 0（位1），位2 的 0 与 secret 位1 的 0 匹配 → white=1
  const r=t.evaluate(s,[0,1,0,3]);
  eq('重复符号 black', r.black, 1);
  eq('重复符号 white', r.white, 2);
}
{
  const s=[1,1,2,2];
  // guess [2,2,1,1]：无 black；值全对 → white=4
  const r=t.evaluate(s,[2,2,1,1]);
  eq('全值对位错(重复) black=0', r.black, 0);
  eq('全值对位错(重复) white=4', r.white, 4);
}
{
  const s=[0,0,0,1];
  // guess [0,0,1,2]: 位0,1 black=2；位2=1 匹配 secret 位3 的 1 → white=1
  const r=t.evaluate(s,[0,0,1,2]);
  eq('black=2', r.black, 2);
  eq('white=1', r.white, 1);
}

// ---------- submitGuess 状态机 ----------
{
  t.reset();
  t.setSecret([0,1,2,3]);
  const fb = t.submitGuess([0,1,2,3]);
  eq('submit 正确 black=4', fb.black, 4);
  ok('submit 正确即胜', t.isWin()===true);
  ok('submit 正确即 over', t.isOver()===true);
  eq('step=1', t.getStep(), 1);
}
{
  t.reset();
  t.setSecret([0,1,2,3]);
  const fb=t.submitGuess([4,4,4,4]);
  eq('错误 black=0', fb.black, 0);
  ok('未胜', t.isWin()===false);
  ok('未 over', t.isOver()===false);
  eq('step=1', t.getStep(), 1);
  eq('历史 1 条', t.getHistory().length, 1);
}
{
  // 步数限制：连续 10 次错误 → over 但未胜
  t.reset();
  t.setSecret([0,1,2,3]);
  let over=false;
  for(let i=0;i<10;i++){ t.submitGuess([4,4,4,4]); }
  ok('10 步后 over', t.isOver()===true);
  ok('10 步未胜', t.isWin()===false);
  eq('step=10', t.getStep(), 10);
}
{
  // 非法猜测被拒
  t.reset();
  t.setSecret([0,1,2,3]);
  const r1=t.submitGuess([1,2]);      // 长度不足
  const r2=t.submitGuess([9,9,9,9]);   // 超域
  const r3=t.submitGuess('x');        // 非数组
  ok('短猜测返回 null', r1===null);
  ok('超域猜测返回 null', r2===null);
  ok('非数组返回 null', r3===null);
  eq('非法猜测不计步', t.getStep(), 0);
}
{
  // over 后不再接受
  t.reset();
  t.setSecret([0,1,2,3]);
  t.submitGuess([0,1,2,3]); // 胜
  const r=t.submitGuess([0,1,2,3]);
  ok('over 后 submit 返回 null', r===null);
}

console.log('mastermind: 全部断言通过');
