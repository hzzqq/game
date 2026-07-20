const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../rps.html');

ok('石头砸剪刀', t.beats('R','S') === true);
ok('剪刀剪布', t.beats('S','P') === true);
ok('布包石头', t.beats('P','R') === true);
ok('石头不克布', t.beats('R','P') === false);

eq('石头胜剪刀 → 玩家0 胜', t.play('R','S'), 0);
eq('剪刀负石头 → 玩家1 胜', t.play('S','R'), 1);
eq('同拳 → 平局(-1)', t.play('P','P'), -1);
ok('非法出拳返回 null', t.play('X','R') === null);

t.reset();
t.play('R','S'); t.play('P','P'); t.play('S','R');
const sc = t.getScore();
ok('三回合后比分为 1:1(1胜1负1平)', sc[0]===1 && sc[1]===1);
eq('总回合数=3', t.getRound(), 3);
