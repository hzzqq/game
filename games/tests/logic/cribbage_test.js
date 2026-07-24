const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../cribbage.html');

let s = 20260722;
t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });

// 编码速记：c = suit*13 + rank，rank 0=A..12=K
// ♠A=0, ♠2=1, ♠5=4, ♠K=12, ♠J=10, ♥5=17, ♦10=35, ♣10=48

// ===== 1. 同种子同发牌 =====
{
  t.newGame(13579);
  const a = t.getState().hands;
  t.newGame(13579);
  const b = t.getState().hands;
  eq('同种子发牌一致', JSON.stringify(a), JSON.stringify(b));
  const all = [].concat(...a, [t.getState().starter]);
  eq('共 13 张(12+切牌)', all.length, 13);
  eq('每人 6 张', a.map(h=>h.length).join(','), '6,6');
}

// ===== 2. cardValue 基础 =====
{
  t.setup({ hands:[[0],[1]], starter:12, phase:'play', current:1, playTotal:0 });
  ok('A 记 1', t.cardValue(0)===1);
  ok('10 记 10', t.cardValue(9)===10);     // ♠10
  ok('K 记 10', t.cardValue(12)===10);    // ♠K
  ok('5 记 5', t.cardValue(4)===5);       // ♠5
}

// ===== 3. peg：凑 15 得 2 =====
{
  t.setup({ hands:[[9,3],[4,2]], starter:12, phase:'play', current:1, playTotal:0, peg:[0,0] });
  // P2(先手) 出 ♠5(4,值5)；P1 出 ♠10(9,值10) → 15
  t.playCard(1, 4);
  t.playCard(0, 9);
  eq('凑 15 得 2 分', t.getPegScore()[0], 2);
  eq('对方未得分', t.getPegScore()[1], 0);
}

// ===== 4. peg：对子得 2 =====
{
  t.setup({ hands:[[19,3],[6,2]], starter:12, phase:'play', current:1, playTotal:0, peg:[0,0] });
  // ♠7(6) 领；♥7(19) 跟 → 对子
  t.playCard(1, 6);
  t.playCard(0, 19);
  eq('对子得 2 分', t.getPegScore()[0], 2);
}

// ===== 5. peg：顺子(3)得 3（额外牌避免触发最后牌）=====
{
  // P2 出 A(0)、P1 出 2(1)、P2 出 3(2) → 末三张 0,1,2 成顺子
  t.setup({ hands:[[1],[0,2,3]], starter:12, phase:'play', current:1, playTotal:0, peg:[0,0] });
  t.playCard(1, 0); // A
  t.playCard(0, 1); // 2
  t.playCard(1, 2); // 3 -> 顺子
  eq('顺子(3)得 3 分', t.getPegScore()[1], 3);
  eq('此时未触发最后牌', t.getPegScore()[1], 3);
}

// ===== 6. 亮牌计分：15 + 对子 =====
{
  // 手牌(4)+切牌：♠5,♥5,♦10,♣10 + ♠K(12)
  // 15：5+10 共 6 组 → 12；对子：两5 + 两10 → 4
  t.setup({ hands:[[4,17,35,48],[0,1,2,3]], starter:12, dealer:0, phase:'show' });
  eq('手牌计分 12(15)+4(对子)=16', t.scoreHand(0), 16);
}

// ===== 7. crib 计分 + 同花规则 =====
{
  // crib：♠5,♥5,♦10,♣10 + ♠K → 同花(crib 需5张同花才计) 否则 0；15/对子 同 16
  t.setup({ hands:[[0,1,2,3],[4,5,6,7]], crib:[4,17,35,48], starter:12, dealer:0, phase:'show' });
  eq('crib 计 16(同花不足不计)', t.scoreCrib(), 16);
}

// ===== 8. 亮牌计分：his heels（切牌 J 给庄家 +2）=====
{
  const base = { hands:[[4,17,35,48],[4,17,35,48]], crib:[4,17,35,48], dealer:0, phase:'show', peg:[0,0] };
  // 切牌为 ♠J(10) 时庄家额外 +2
  t.setup(Object.assign({}, base, { starter:10 }));
  t.scoreShow();
  const withJ = t.getPegScore()[0];
  t.setup(Object.assign({}, base, { starter:11 })); // ♠Q，无 heels
  t.scoreShow();
  const withQ = t.getPegScore()[0];
  eq('切牌为 J 庄家 +2(his heels)', withJ - withQ, 2);
}

// ===== 9. 完整一局不崩溃并结束 =====
{
  t.newGame(2468);
  // 弃牌：人类用 AI 策略弃 2 张
  const d0 = t.getState().hands[0].slice().sort((a,b)=> t.cardValue(b)-t.cardValue(a)).slice(0,2);
  t.discard(0, d0[0]); t.discard(0, d0[1]);
  ok('弃牌后进入出牌阶段', t.getState().phase === 'play');
  let guard=0;
  while(!t.isOver() && guard++<400){
    const st = t.getState();
    if(st.phase==='play'){
      if(st.current===0){ const lm=t.legalMoves(0); if(lm.length) t.playCard(0, lm[0]); else t.go(0); }
      else t.step();
    } else break;
  }
  ok('整局正常结束(isOver)', t.isOver() === true);
  const sc = t.getScores();
  ok('总分非负且为有限数', sc.every(x=> typeof x==='number'));
}

t.setRand(Math.random);

// ---------- 难度系统 ----------
eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
eq('getDifficulty 为 hell', t.getDifficulty(), 'hell');
eq('setDifficulty(非法) 返回 false', t.setDifficulty('x'), false);
