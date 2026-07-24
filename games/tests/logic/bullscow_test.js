const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../bullscow.html');

// ---------- 常量 ----------
eq('LEN=4', t.LEN, 4);
eq('DOMAIN=10', t.DOMAIN, 10);
eq('MAX_TRIES=10', t.MAX_TRIES, 10);

// ---------- generateSecret：4 位不重复、0..9 ----------
{
  t.setRand(()=>0.5);
  const s = t.generateSecret();
  eq('secret 长度 4', s.length, 4);
  ok('secret 每位 0..9', s.every(v=>v>=0&&v<10));
  ok('secret 互不重复', new Set(s).size===4);
}
{
  let bad=0; t.setRand(()=>0.42);
  for(let i=0;i<300;i++){ const s=t.generateSecret(); if(s.length!==4||new Set(s).size!==4||s.some(v=>v<0||v>=10)) bad++; }
  ok('generateSecret 300 次全合法', bad===0);
}

// ---------- feedback 算法 ----------
{
  const s=[1,2,3,4];
  eq('全对 A=4 B=0', JSON.stringify(t.feedback(s,[1,2,3,4])), JSON.stringify({A:4,B:0}));
  eq('全错 A=0 B=0', JSON.stringify(t.feedback(s,[5,6,7,8])), JSON.stringify({A:0,B:0}));
  eq('全值对位错 A=0 B=4', JSON.stringify(t.feedback(s,[4,3,2,1])), JSON.stringify({A:0,B:4}));
  eq('部分 A=1', JSON.stringify(t.feedback(s,[1,5,6,7])), JSON.stringify({A:1,B:0}));
  eq('部分 A=2', JSON.stringify(t.feedback(s,[1,2,5,6])), JSON.stringify({A:2,B:0}));
  eq('混合 A=2 B=2', JSON.stringify(t.feedback(s,[1,3,2,4])), JSON.stringify({A:2,B:2}));
}

// ---------- guess 状态机 ----------
{
  t.reset(); t.setSecret([1,2,3,4]);
  const r = t.guess([1,2,3,4]);
  eq('猜中 A=4', r.A, 4);
  ok('猜中即胜', t.isWin()===true);
  ok('猜中即 over', t.isOver()===true);
  eq('tries=1', t.getState().tries, 1);
}
{
  t.reset(); t.setSecret([1,2,3,4]);
  const r = t.guess([5,6,7,8]);
  eq('错误 A=0', r.A, 0);
  ok('未胜', t.isWin()===false);
  ok('未 over', t.isOver()===false);
  eq('历史 1 条', t.getState().history.length, 1);
}
{
  // 10 步上限
  t.reset(); t.setSecret([1,2,3,4]);
  for(let i=0;i<10;i++) t.guess([5,6,7,8]);
  ok('10 步后 over', t.isOver()===true);
  ok('10 步未胜', t.isWin()===false);
  eq('tries=10', t.getState().tries, 10);
}
{
  // 非法猜测被拒：长度不足 / 超域 / 非数组 / 含重复数字
  t.reset(); t.setSecret([1,2,3,4]);
  ok('短猜测返回 null', t.guess([1,2])===null);
  ok('超域猜测返回 null', t.guess([1,2,3,10])===null);
  ok('非数组返回 null', t.guess('1234')===null);
  ok('含重复数字返回 null', t.guess([1,1,2,3])===null);
  eq('非法猜测不计步', t.getState().tries, 0);
}
{
  // over 后不再接受
  t.reset(); t.setSecret([1,2,3,4]);
  t.guess([1,2,3,4]);
  ok('over 后 guess 返回 null', t.guess([1,2,3,4])===null);
}

console.log('bullscow: 全部断言通过');

// ---------- 轮2：胜利 confetti 标记 ----------
{
  t.reset(); t.setSecret([1,2,3,4]);
  t.guess([1,2,3,4]);
  ok('猜中后 confettiFired 置位', t.getConfettiFired()===true);
}
{
  t.reset(); t.setSecret([1,2,3,4]);
  t.guess([5,6,7,8]); // 未中
  ok('未中不置位', t.getConfettiFired()===false);
}
