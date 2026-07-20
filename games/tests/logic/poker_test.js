const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../poker.html');

// ---------- 牌组 ----------
{
  const d = t.makeDeck();
  ok('makeDeck 52张', d.length === 52);
  const seen = {};
  let uniq = true;
  d.forEach(c => { const k = c.r + '-' + c.s; if (seen[k]) uniq = false; seen[k] = 1; });
  ok('makeDeck 无重复', uniq);
  ok('makeDeck 含 A 黑桃', d.some(c => c.r === 14 && c.s === 0));
}
// shuffle
{
  t.setRand(() => 0.42);
  const a = t.shuffle(t.makeDeck());
  t.setRand(() => 0.42);
  const b = t.shuffle(t.makeDeck());
  ok('shuffle 仍 52 张', a.length === 52);
  ok('shuffle 确定性(同随机源同结果)', JSON.stringify(a) === JSON.stringify(b));
  const seen = {}; let uniq = true;
  a.forEach(c => { const k = c.r + '-' + c.s; if (seen[k]) uniq = false; seen[k] = 1; });
  ok('shuffle 仍为全排列', uniq);
  t.setRand(Math.random);
}
// cardStr
ok('cardStr 10♠', t.cardStr({ r: 10, s: 0 }) === '10♠');
ok('cardStr A♥', t.cardStr({ r: 14, s: 1 }) === 'A♥');

// ---------- eval5 ----------
const C = (r, s) => ({ r, s });
{
  // 同花顺
  ok('eval5 同花顺', t.eval5([C(10,0),C(11,0),C(12,0),C(13,0),C(14,0)]).cat === 8);
  // 轮子 A2345 同花
  ok('eval5 轮子同花顺', t.eval5([C(14,2),C(2,2),C(3,2),C(4,2),C(5,2)]).cat === 8);
  // 四条
  ok('eval5 四条', t.eval5([C(7,0),C(7,1),C(7,2),C(7,3),C(2,0)]).cat === 7);
  // 葫芦
  ok('eval5 葫芦', t.eval5([C(7,0),C(7,1),C(7,2),C(3,3),C(3,0)]).cat === 6);
  // 同花
  ok('eval5 同花', t.eval5([C(2,0),C(5,0),C(9,0),C(11,0),C(13,0)]).cat === 5);
  // 顺子 (非同花)
  ok('eval5 顺子', t.eval5([C(6,0),C(7,1),C(8,2),C(9,3),C(10,0)]).cat === 4);
  // 轮子顺子
  ok('eval5 轮子顺子', t.eval5([C(14,0),C(2,1),C(3,2),C(4,3),C(5,0)]).cat === 4 && t.eval5([C(14,0),C(2,1),C(3,2),C(4,3),C(5,0)]).tb[0] === 5);
  // 三条
  ok('eval5 三条', t.eval5([C(7,0),C(7,1),C(7,2),C(3,3),C(9,0)]).cat === 3);
  // 两对
  ok('eval5 两对', t.eval5([C(7,0),C(7,1),C(3,2),C(3,3),C(9,0)]).cat === 2);
  // 一对
  ok('eval5 一对', t.eval5([C(7,0),C(7,1),C(3,2),C(5,3),C(9,0)]).cat === 1);
  // 高牌
  ok('eval5 高牌', t.eval5([C(7,0),C(2,1),C(3,2),C(5,3),C(9,0)]).cat === 0);
  // 同花顺 > 四条
  ok('cmp 同花顺>四条', t.cmpVec(t.eval5([C(10,0),C(11,0),C(12,0),C(13,0),C(14,0)]), t.eval5([C(7,0),C(7,1),C(7,2),C(7,3),C(2,0)])) > 0);
  // 同花比较：A高同花 > K高同花
  ok('cmp 同花比高牌', t.cmpVec(t.eval5([C(14,0),C(5,0),C(9,0),C(11,0),C(13,0)]), t.eval5([C(13,1),C(5,1),C(9,1),C(11,1),C(12,1)])) > 0);
}
// handName
ok('handName 同花顺', t.handName({ cat: 8, tb: [14] }) === '同花顺');
ok('handName 一对', t.handName({ cat: 1, tb: [7,9,5,3] }) === '一对');

// ---------- evaluate7 ----------
{
  // 7 张含同花 → 应得同花
  const flush7 = [C(2,0),C(5,0),C(9,0),C(11,0),C(13,0), C(3,1),C(4,2)];
  ok('evaluate7 识别同花', t.evaluate7(flush7).cat === 5);
  // 7 张含同花顺（A高）
  const sf7 = [C(10,0),C(11,0),C(12,0),C(13,0),C(14,0), C(2,1),C(3,2)];
  ok('evaluate7 识别同花顺', t.evaluate7(sf7).cat === 8);
  // 7 张含葫芦
  const fh7 = [C(7,0),C(7,1),C(7,2),C(3,3),C(3,0), C(9,1),C(2,2)];
  ok('evaluate7 识别葫芦', t.evaluate7(fh7).cat === 6);
}

// ---------- 开局状态 ----------
t.startHand();
{
  ok('startHand 4 名玩家', t.getPlayers().length === 4);
  ok('startHand 庄家=0(首局)', t.getDealer() === 0);
  ok('startHand currentBet=BB(10)', t.getCurrentBet() === 10);
  ok('startHand pot=SB+BB=15', t.getPot() === 15);
  ok('startHand 4 人未弃牌', t.activePlayers().length === 4);
  // 小盲(p1) bet=5, 大盲(p2) bet=10
  eq('startHand 小盲下注=5', t.getPlayers()[1].bet, 5);
  eq('startHand 大盲下注=10', t.getPlayers()[2].bet, 10);
  // 首行动者 = 大盲后一位 = p3 (dealer+3 %4)
  eq('startHand 首行动者=p3', t.getToAct(), 3);
  ok('startHand 人类初始 200 筹码', t.getPlayers()[0].chips === 200);
}

// ---------- 行动：弃牌推进 ----------
{
  const r = t.action(3, 'fold');
  ok('action(p3,fold) 成功', r.ok === true);
  eq('fold 后 p3.folded', t.getPlayers()[3].folded, true);
  eq('fold 后行动者推进到 p0', t.getToAct(), 0);
}

// ---------- 行动：非法（非当前行动者） ----------
{
  const bad = t.action(2, 'fold');
  ok('非当前行动者行动被拒', bad.ok === false);
}

// ---------- 行动：跟注 ----------
{
  t.startHand();
  const before = t.getPlayers()[3].chips;
  const r = t.action(3, 'call'); // 跟大盲 10
  ok('call 成功', r.ok === true);
  eq('call 后 p3 下注=10', t.getPlayers()[3].bet, 10);
  ok('call 后筹码减少 10', t.getPlayers()[3].chips === before - 10);
}

// ---------- 行动：加注抬高 currentBet ----------
{
  t.startHand();
  const r = t.action(3, 'raise', 10); // 当前10 + 10 = 20
  ok('raise 成功', r.ok === true);
  eq('raise 后 currentBet=20', t.getCurrentBet(), 20);
  // 其他未行动者 hasActed 重置
  ok('raise 后 p0 需重新行动', t.getPlayers()[0].hasActed === false);
}

// ---------- 只剩一家未弃牌 → 直接赢 ----------
{
  t.startHand();
  t.setToAct(0);
  t.action(0, 'fold'); // p0 弃
  t.setToAct(1); t.action(1, 'fold'); // p1 弃
  t.setToAct(2); t.action(2, 'fold'); // p2 弃 → 只剩 p3
  ok('全部弃牌后 handOver', t.isHandOver() === true);
  ok('赢家为 p3(唯一未弃)', t.activePlayers().length === 1 && t.activePlayers()[0].id === 3);
}

// ---------- showdown 分发 ----------
{
  t.startHand();
  const potBefore = t.getPlayers()[0].chips;
  const b1 = t.getPlayers()[1].chips; // p1 为小盲已扣 5
  // p0 同花（红桃 K Q，无轮子），p1 仅一对 K
  t.setCommunity([C(2,1),C(3,1),C(6,1),C(8,1),C(10,1)]);
  t.setHole(0, [C(13,1),C(12,1)]);
  t.setHole(1, [C(14,0),C(13,0)]);
  t.setFolded(2, true); t.setFolded(3, true);
  t.setPot(100);
  t.showdown();
  ok('showdown 后 handOver', t.isHandOver() === true);
  ok('showdown p0 赢得底池 +100', t.getPlayers()[0].chips === potBefore + 100);
  ok('showdown p1 筹码不变', t.getPlayers()[1].chips === b1);
}

// ---------- 平局分池 ----------
{
  t.startHand();
  t.setCommunity([C(2,0),C(3,1),C(9,2),C(10,3),C(13,0)]);
  // 双方各持一对 A（不同花色），最佳牌完全相同 → 平局
  t.setHole(0, [C(14,1),C(14,2)]);
  t.setHole(1, [C(14,3),C(14,0)]);
  t.setFolded(2, true); t.setFolded(3, true);
  t.setPot(100);
  const b0 = t.getPlayers()[0].chips, b1 = t.getPlayers()[1].chips;
  t.showdown();
  ok('平局 p0 得一半', t.getPlayers()[0].chips === b0 + 50);
  ok('平局 p1 得一半', t.getPlayers()[1].chips === b1 + 50);
}

// ---------- best7 经钩子 ----------
{
  t.startHand();
  t.setCommunity([C(2,1),C(3,1),C(6,1),C(8,1),C(10,1)]);
  t.setHole(0, [C(13,1),C(12,1)]);
  ok('best7 p0 同花', t.best7(0).cat === 5);
}

// 失败则非零退出
let failed = 0;
for (const r of require('./harness').results) if (!r.pass) failed++;
if (failed > 0) { console.log('\n✗ poker: ' + failed + ' 项失败'); process.exit(1); }
console.log('poker: 全部断言通过');
