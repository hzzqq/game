const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../klondike.html');

// 收牌规则
ok('空座收 A', t.canFoundation({s:0,r:1}));
ok('空座不收 2', !t.canFoundation({s:0,r:2}));
t.setTableau([],[1,0,0,0],[],[]);
ok('黑桃2 接黑桃A', t.canFoundation({s:0,r:2}));
ok('黑桃3 不接黑桃A', !t.canFoundation({s:0,r:3}));

// 牌桌接龙规则
ok('空列只收 K', t.canTableau({s:3,r:13},0));
ok('空列不收 5', !t.canTableau({s:3,r:5},0));
t.setTableau([[{s:0,r:7}],[],[],[],[],[],[]],[0,0,0,0],[],[]);
ok('红6 接黑7（降序异色）', t.canTableau({s:1,r:6},0));
ok('黑6 不接黑7（同色被拒）', !t.canTableau({s:3,r:6},0));
ok('红8 不接黑7（非降序）', !t.canTableau({s:1,r:8},0));

// 弃牌→收牌
t.setTableau([],[1,0,0,0],[],[{s:0,r:2}]);
ok('弃牌收黑桃2', t.moveWasteToFoundation());
eq('收牌座=2', t.getState().foundations[0], 2);
eq('弃牌清空', t.getState().waste.length, 0);

// 通关
t.setTableau([],[13,13,13,13],[],[]);
ok('四座满即胜', t.isWin());

// confetti 标记：四座收齐触发、重开复位
ok('初始未标记 confetti', t.confettiFired === false);
// 四列各放一张 K，逐一收牌触发 checkWin
t.setTableau(
  [[{s:0,r:13}],[{s:1,r:13}],[{s:2,r:13}],[{s:3,r:13}],[],[]],
  [12,12,12,12],[],[]
);
t.moveTableauToFoundation(0);
t.moveTableauToFoundation(1);
t.moveTableauToFoundation(2);
t.moveTableauToFoundation(3);
ok('四座收齐即胜', t.isWin());
ok('通关后标记 confetti', t.confettiFired === true);
t.newGame(); // 重开
ok('重开重置 confetti 标记', t.confettiFired === false);
ok('重开未胜', t.isWin() === false);

// ===== T-173 move 守卫补锁（mutation 缺口：move 系 !canFoundation/!canTableau 拒绝分支此前无锁）=====
(() => {
  t.setTableau([[{ s: 0, r: 5 }],[],[],[],[],[],[]],[0,0,0,0],[],[]);  // 列顶黑5，座空需 A
  ok('klondike 列顶非接牌收座拒', t.moveTableauToFoundation(0) === false);
  eq('klondike 拒后列顶不变', t.getState().tableau[0].length, 1);
  t.setTableau([[],[{ s: 0, r: 3 }],[],[],[],[],[]],[0,0,0,0],[],[{ s: 3, r: 2 }]); // 弃牌黑2，列顶黑3 同色拒
  ok('klondike 弃牌接桌同色拒', t.moveWasteToTableau(1) === false);
  t.setTableau([[{ s: 0, r: 5 }],[{ s: 3, r: 6 }],[],[],[],[],[]],[0,0,0,0],[],[]); // 黑5 → 黑6 同色
  ok('klondike 桌间移动同色拒', t.moveTableauToTableau(0, 1) === false);
  eq('klondike 拒后两列均不变', t.getState().tableau[0].length + t.getState().tableau[1].length, 2);
})();
