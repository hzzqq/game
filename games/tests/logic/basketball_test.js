const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../basketball.html');

// 命中：角度20° 力度24 → 落入篮筐
t.reset();
t.shoot(20,24);
ok('合适角度力度可命中', t.isMade() === true);
eq('命中后得分=1', t.getScore(), 1);

// 未命中：力度过小，球未到篮筐
t.reset();
t.shoot(20,5);
ok('力度不足未命中', t.isMade() === false);
eq('未命中没有得分', t.getScore(), 0);
