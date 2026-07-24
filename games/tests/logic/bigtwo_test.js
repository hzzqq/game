const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../bigtwo.html');

// 牌序：2 最大，A 次之
eq('2 的点数=15', t.rankVal(2), 15);
eq('A 的点数=14', t.rankVal(1), 14);
eq('K=13', t.rankVal(13), 13);
eq('3=3', t.rankVal(3), 3);

// 比较：黑桃 5 > 梅花 5
const s5=t.comboOf([{s:3,r:5}]), c5=t.comboOf([{s:0,r:5}]);
ok('黑桃5胜梅花5', t.higher(s5,c5));
ok('梅花5不黑桃5', !t.higher(c5,s5));

// 一对识别
ok('一对识别', t.comboOf([{s:0,r:9},{s:1,r:9}]).type==='pair');
ok('非同点非一对', t.comboOf([{s:0,r:9},{s:1,r:8}])===null);

// 出牌流程 → 玩家2 出完获胜
t.setHands([
  [{s:3,r:5},{s:0,r:3}],
  [{s:0,r:6},{s:0,r:4}],
  [{s:1,r:2}],
  [{s:2,r:14}],
], 0);
ok('玩家1领出单5♠', t.play(0, t.comboOf([{s:3,r:5}])));
ok('玩家2跟单6♣(更大)', t.play(1, t.comboOf([{s:0,r:6}])));
ok('玩家3过', t.play(2, {type:'pass'}));
ok('玩家4过', t.play(3, {type:'pass'}));
ok('玩家1过→三家过回赢家', t.play(0, {type:'pass'}));
eq('当前回到玩家2', t.getTurn(), 1);
ok('玩家2领出单4♣出完', t.play(1, t.comboOf([{s:0,r:4}])));
ok('已结束', t.isWin());
eq('玩家2胜', t.getWinner(), 1);

// 跟小牌被拒
t.setHands([
  [{s:3,r:5}],
  [{s:0,r:4}],
  [{s:1,r:2}],
  [{s:2,r:14}],
], 0);
t.play(0, t.comboOf([{s:3,r:5}]));
ok('跟更小牌被拒', !t.play(1, t.comboOf([{s:0,r:4}])));

// ---------- 难度系统 ----------
eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
eq('getDifficulty 为 hell', t.getDifficulty(), 'hell');
eq('setDifficulty(非法) 返回 false', t.setDifficulty('x'), false);
