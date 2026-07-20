const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../freecell.html');

// 收牌 / 接龙规则与 Klondike 一致
ok('空座收 A', t.canFoundation({s:0,r:1}));
t.setTableau([],[2,0,0,0],[null,null,null,null]);
ok('黑桃3 接黑桃2', t.canFoundation({s:0,r:3}));
t.setTableau([[],[],[],[],[],[],[],[]],[0,0,0,0],[null,null,null,null]);
ok('空列只收 K', t.canTableau({s:3,r:13},0));
t.setTableau([[{s:0,r:7}],[],[],[],[],[],[],[]],[0,0,0,0],[null,null,null,null]);
ok('红6 接黑7', t.canTableau({s:1,r:6},0));

// 自由格→收牌
t.setTableau([],[2,0,0,0],[{s:0,r:3},null,null,null]);
ok('自由格收黑桃3', t.moveFreeToFoundation(0));
eq('收牌座=3', t.getState().foundations[0], 3);
eq('自由格清空', t.getState().free[0], null);

// 通关
t.setTableau([],[13,13,13,13],[null,null,null,null]);
ok('四座满即胜', t.isWin());
