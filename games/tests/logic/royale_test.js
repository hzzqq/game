// 皇室战争逻辑单测：击杀掉落（圣水/狂暴）age 生效 + 移除
const H = require('./harness');
const { t: T } = H.loadGame('../royale.html');

// 1) 圣水掉落：age>=0.9 生效 elixir +2
T.setElixir('me', 3);
var e0 = T.getElixir('me');
T.spawnLoot('me', 'energy', 100, 100);
H.ok(T.getLoot() === 1, 'royale: 圣水掉落入场合计=1');
T.stepLoot(1.0);
H.ok(T.getElixir('me') === e0 + 2, 'royale: 圣水生效 elixir+2 (得到 ' + T.getElixir('me') + ' 期望 ' + (e0+2) + ')');
H.ok(T.getLoot() === 0, 'royale: 圣水拾取后移除');

// 2) 狂暴掉落：age>=0.9 生效 rage=4
T.spawnLoot('me', 'rage', 100, 100);
T.stepLoot(1.0);
H.ok(T.getRage('me') === 4, 'royale: 狂暴生效 rage=4 (得到 ' + T.getRage('me') + ')');

// 3) AI 侧同理
T.setElixir('ai', 2);
var ea = T.getElixir('ai');
T.spawnLoot('ai', 'energy', 100, 100);
T.stepLoot(1.0);
H.ok(T.getElixir('ai') === ea + 2, 'royale: AI 圣水生效 elixir+2 (得到 ' + T.getElixir('ai') + ')');

// 4) age<0.9 不生效、不移除
T.setElixir('me', 0);
var e2 = T.getElixir('me');
T.spawnLoot('me', 'energy', 100, 100);
T.stepLoot(0.5);
H.ok(T.getElixir('me') === e2, 'royale: age<0.9 不生效');
H.ok(T.getLoot() === 1, 'royale: age<0.9 未移除');

module.exports = {};
