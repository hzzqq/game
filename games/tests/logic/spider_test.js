const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../spider.html');

// 接龙规则（仅比点数，花色不限）
t.setTableau([[{s:0,r:7}]],0,[]);
ok('6 接 7', t.canStack({s:1,r:6},0));
ok('8 不接 7', !t.canStack({s:0,r:8},0));
ok('空列任意可接', t.canStack({s:1,r:13},1));

// 同花色 K→A 整列自动收走
const run=[]; for(let r=13;r>=1;r--) run.push({s:0,r}); // 底K 顶A
t.setTableau([run],0,[]);
t.settle();
eq('收走一套', t.getState().foundations, 1);
eq('该列清空', t.getState().tableau[0].length, 0);

// 非同花色不收
const mixed=[{s:0,r:13},{s:1,r:12},{s:0,r:11},{s:1,r:10},{s:0,r:9},{s:1,r:8},{s:0,r:7},{s:1,r:6},{s:0,r:5},{s:1,r:4},{s:0,r:3},{s:1,r:2},{s:0,r:1}];
t.setTableau([mixed],0,[]);
t.settle();
eq('异色不顺不收', t.getState().foundations, 0);
eq('该列仍在', t.getState().tableau[0].length, 13);

// 发牌：牌库减少、各列加一张
t.setTableau(Array.from({length:10},()=>[{s:0,r:3},{s:0,r:3}]),[],[{s:0,r:3},{s:0,r:3},{s:0,r:3},{s:0,r:3},{s:0,r:3}]);
const before=t.getState().stock;
t.dealOne();
eq('牌库减5', t.getState().stock, before-5);
eq('列0加1', t.getState().tableau[0].length, 3);

// 通关
t.setTableau([],[8],[]);
ok('八套满即胜', t.isWin());
