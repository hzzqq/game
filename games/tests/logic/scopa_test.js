const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../scopa.html');

// 组合收牌：5 = 2+3（取最多张），留下桌上的 5
t.setTableau([{v:2,s:0},{v:3,s:1},{v:5,s:2}], [{v:5,s:3}]);
ok('出5收走2+3', t.play({v:5,s:3}));
eq('桌上剩1张', t.getTable().length, 1);
eq('收牌数=3', t.getCaptured(), 3);

// 单张收牌 + 清台得斯科普
t.setTableau([{v:5,s:0}], [{v:5,s:1}]);
ok('出5收单张5', t.play({v:5,s:1}));
eq('桌面清空', t.getTable().length, 0);
eq('斯科普+1', t.getScopa(), 1);

// 无法凑数 → 牌留桌面
t.setTableau([{v:3,s:0},{v:4,s:1}], [{v:1,s:2}]);
ok('出1无法收', !t.play({v:1,s:2}));
eq('桌面变3张', t.getTable().length, 3);
eq('未收牌', t.getCaptured(), 0);
