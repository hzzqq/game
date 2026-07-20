const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../bowling.html');

// 全洗沟：20 次 0 瓶 → 0 分
t.setRolls(new Array(20).fill(0));
eq('全洗沟得分=0', t.score(), 0);

// 完美局：12 次全中 → 300 分
t.setRolls(new Array(12).fill(10));
eq('全中满分=300', t.score(), 300);
ok('isPerfect 判定满分', t.isPerfect() === true);

// 每格 4+5=9，共 10 格 → 90 分
t.setRolls(Array(10).fill([4,5]).flat());
eq('每格9分共10格=90', t.score(), 90);

// 补中+奖励：第1格 5+5(spare) 加下一球3 = 13；第2格 3+4=7；其余0 → 20
t.setRolls([5,5,3,4, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
eq('补中带奖励分=20', t.score(), 20);
