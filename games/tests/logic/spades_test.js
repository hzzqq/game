const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../spades.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 同种子同发牌 =====
{
  t.newGame(24680);
  const a = t.getState().hands;
  t.newGame(24680);
  const b = t.getState().hands;
  eq('同种子发牌一致', JSON.stringify(a), JSON.stringify(b));
  const all = [].concat(...a);
  eq('共 52 张', all.length, 52);
  eq('每人 13 张', a.map(h=>h.length).join(','), '13,13,13,13');
}

// ===== 2. 叫牌阶段非法出牌被拒 =====
{
  t.newGame(7);
  ok('叫牌阶段 playCard 被拒', t.playCard(0, 0) === false);
  ok('叫牌阶段必须叫牌', t.bid(0, 3) === true);
}

// ===== 3. 将牌吃墩：黑桃赢非黑桃首攻 =====
{
  // 领出 ♥A(13)，其余跟非黑桃，但 P3 用 ♠2(1) 将吃 → 黑桃最大
  const w = t.winnerOfTrick([13, 26, 39, 1]); // ♥A,♦A,♣A,♠2
  eq('黑桃将牌赢墩', w, 3);
  // 无黑桃时按首攻花色最大
  const w2 = t.winnerOfTrick([13, 26, 39, 14]); // 全非黑桃，首攻♥，♥A(13)最大
  eq('无将按首攻花色比对', w2, 0);
}

// ===== 4. 合法出牌：黑桃未破不能首攻黑桃；跟牌须跟花色 =====
{
  // 首攻：含黑桃但不能首攻（未破）
  t.setHands([[0,13,26],[1,2,3],[4,5,6],[7,8,9]], 0); // ♠A,♥A,♦A
  eq('黑桃未破首攻仅非黑桃', JSON.stringify(t.legalMoves(0)), JSON.stringify([13,26]));

  // 打出黑桃后 spadesBroken 置真
  t.setHands([[0],[1,13],[2],[3]], 0);
  t.playCard(0, 0); // 首攻 ♠A → 触发 spadesBroken
  ok('打出黑桃后黑桃已破', t.getState().spadesBroken === true);

  // 跟牌须跟首攻花色
  t.setHands([[0],[1,13],[2],[3]], 0);
  t.playCard(0, 0); // ♠A 领出
  eq('跟牌须跟黑桃', JSON.stringify(t.legalMoves(1)), JSON.stringify([1]));
}

// ===== 5. 计分：完成 / 超叫bag / 欠叫 / bag惩罚 =====
{
  let r = t.roundScore([3,0,0,0],[3,0,0,0],[0,0,0,0]);
  eq('完成叫数 +30', JSON.stringify(r.delta), JSON.stringify([30,0,0,0]));

  r = t.roundScore([3,3,3,3],[5,5,5,5],[0,0,0,0]);
  eq('超叫 +32/人 且记 2 bag', JSON.stringify(r.delta), JSON.stringify([32,32,32,32]));
  eq('bags 累加 2', JSON.stringify(r.bags), JSON.stringify([2,2,2,2]));

  r = t.roundScore([4,0,0,0],[2,0,0,0],[0,0,0,0]);
  eq('欠叫 -40', JSON.stringify(r.delta), JSON.stringify([-40,0,0,0]));

  // bags 累计到 10 → 扣 100
  r = t.roundScore([1,1,1,1],[11,11,11,11],[8,8,8,8]);
  // 每人超叫 10 → bags 8+10=18 → -100, bags 8；delta = 10*1+10 -100 = -80
  eq('bag 满 10 扣 100', JSON.stringify(r.delta), JSON.stringify([-80,-80,-80,-80]));
  eq('bag 扣后余 8', JSON.stringify(r.bags), JSON.stringify([8,8,8,8]));
}

// ===== 6. 通过公开 API 跑完一整轮（集成）=====
{
  t.newGame(31337);
  // 人类与 AI 都叫牌
  ok('人类叫牌成功', t.bid(0, t.aiBid(0)) === true);
  ok('叫牌后进入出牌阶段', t.getState().phase === 'play');
  let guard=0;
  while(t.getState().phase==='play' && t.getState().tricksPlayed!==13 && guard++<2000){
    const st = t.getState();
    if(st.current===0){ const lm=t.legalMoves(0); t.playCard(0, lm[0]); }
    else t.step();
  }
  eq('一轮收满 52 张(完成)', t.getState().lastRoundCards, 52);
  const sum = t.getScores().reduce((a,b)=>a+b,0);
  ok('一轮后有计分(总分非零)', sum !== 0);
}

t.setRand(Math.random);
