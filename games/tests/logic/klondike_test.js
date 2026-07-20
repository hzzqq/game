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
