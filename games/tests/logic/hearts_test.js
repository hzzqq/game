const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../hearts.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// ===== 1. 同种子同发牌（确定性）=====
{
  t.newGame(12345);
  const a = t.getState().hands;
  t.newGame(12345);
  const b = t.getState().hands;
  eq('同种子发牌一致', JSON.stringify(a), JSON.stringify(b));
  const all = [].concat(...a);
  eq('共 52 张', all.length, 52);
  eq('无重复牌', new Set(all).size, 52);
  eq('每人 13 张', a.map(h=>h.length).join(','), '13,13,13,13');
}

// ===== 2. 传牌阶段非法出牌被拒 =====
{
  t.newGame(7);
  ok('传牌阶段 playCard 被拒', t.playCard(0, 0) === false);
}

// ===== 3. 首攻必须 ♣2 =====
{
  // 构造：P0 仅 ♣2；其余各一张梅花，P1 另带一张红心
  t.setHands([[40],[41,14],[42],[43]], 0);
  eq('首攻只有 ♣2 合法', t.legalMoves(0), [40]);
  ok('首攻非 ♣2 被拒', t.playCard(0, 14) === false);
  ok('首攻 ♣2 成功', t.playCard(0, 40) === true);
  // 现在 P1 跟牌：手里有梅花必须跟
  eq('跟牌须跟同花色(梅花)', t.legalMoves(1), [41]);
  ok('P1 跟 ♣3 成功', t.playCard(1, 41) === true);
  ok('P2 跟 ♣4 成功', t.playCard(2, 42) === true);
  ok('P3 跟 ♣5 成功', t.playCard(3, 43) === true);
  // 一墩结束，♣5 最大 → P4(P3) 赢
  const st = t.getState();
  eq('一墩后轮到赢家 P3', st.current, 3);
  eq('已收 4 张', st.taken[3].length, 4);
}

// ===== 4. 一墩胜者判定 =====
{
  // 领出 ♠A(0)，其余跟黑桃，最大者赢
  t.setHands([[0],[1],[2],[3]], 0);
  const w = t.winnerOfTrick([0,1,2,3]); // 黑桃 A 最大
  eq('黑桃 A 赢墩', w, 0);
  const w2 = t.winnerOfTrick([1,2,0,3]); // ♠2领出，♠A(index2) 最大
  eq('首位为领出花色，黑桃 A 仍赢', w2, 2);
  // 不同花色：领出梅花，黑桃不算
  const w3 = t.winnerOfTrick([40, 0, 42, 3]); // 梅花领出，最大梅花是 42(♣4)
  eq('非领出花色不参与比大小', w3, 2);
}

// ===== 5. 计分：普通一轮 =====
{
  // P0 吃 13 张红心(13分)，P1 吃 ♠Q(13分)，其余 0
  const hearts = []; for(let r=0;r<13;r++) hearts.push(1*13+r); // c=13..25
  const sc = t.scoreRound([hearts, [11], [], []]);
  eq('普通轮计分', JSON.stringify(sc), JSON.stringify([13,13,0,0]));
  // 不变量：总分应等于场上红心(13)+♠Q(13)
  eq('普通轮总分为 26', sc.reduce((a,b)=>a+b,0), 26);
}

// ===== 6. 计分：全收 shoot the moon =====
{
  const moon = []; for(let r=0;r<13;r++) moon.push(1*13+r); // 13 红心
  moon.push(11); // + ♠Q => 26
  const sc = t.scoreRound([moon, [], [], []]);
  eq('全收转 26 分给三家', JSON.stringify(sc), JSON.stringify([0,26,26,26]));
}

// ===== 7. playRound 确定性与不变量 =====
{
  eq('playRound 确定性', JSON.stringify(t.playRound(99)), JSON.stringify(t.playRound(99)));
  let allOK = true;
  for(const seed of [1,2,3,4,5,6,7,8,42,123]){
    const r = t.playRound(seed);
    if(!Array.isArray(r) || r.length!==4){ allOK=false; break; }
    const sum = r.reduce((a,b)=>a+b,0);
    if(!(sum===26 || sum===78)) allOK=false;
  }
  ok('playRound 各种子总分 26 或 78 且不变量成立', allOK);
  // shoot-the-moon 逻辑见上方 scoreRound 直接测试
}

// ===== 8. 通过公开 API 跑完一整轮（集成）=====
{
  t.newGame(555);
  // 人类传 3 张（用 AI 策略选）
  const h0 = t.getState().hands[0];
  const three = h0.slice().sort((a,b)=> t.rankNum(b)-t.rankNum(a)).slice(0,3);
  ok('人类传牌成功', t.passCards(0, three) === true);
  // 出牌直到本局（13 墩）结束
  let guard=0;
  while(t.getState().phase==='play' && t.getState().tricksPlayed<13 && guard++<2000){
    const st = t.getState();
    if(st.current===0){ const lm=t.legalMoves(0); t.playCard(0, lm[0]); }
    else t.step();
  }
  eq('一轮收满 52 张', t.getState().lastRoundCards, 52);
  const sum = t.getScores().reduce((a,b)=>a+b,0);
  ok('一轮总分 26 或 78', sum===26 || sum===78);
}

t.setRand(Math.random);
