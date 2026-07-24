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

// 5) 标准化补给箱：heal 回血生效 + 拾取后移除
var meKing5 = T.getState().towers.find(t=>t.side==='me'&&t.kind==='king');
meKing5.hp = 1000;
T.spawnPickup('heal', meKing5.x, meKing5.y);
H.ok(T.getPickups() === 1, 'royale: 补给箱生成 1 个');
T.stepPickups(0.016);
H.ok(meKing5.hp > 1000, 'royale: heal 回血生效 (hp '+meKing5.hp+')');
H.ok(T.getPickups() === 0, 'royale: 拾取后移除');

// 6) 未碰撞不生效
T.spawnPickup('heal', 0, 0);
T.stepPickups(0.016);
H.ok(T.getPickups() === 1, 'royale: 未碰撞 pickup 仍在');

// 7) 护盾免死：有盾时受伤不扣血、不结束
T.setShield(6);
var k7 = T.getState().towers.find(t=>t.side==='me'&&t.kind==='king');
var hp7 = k7.hp;
T.takeHit(50);
H.ok(k7.hp === hp7, 'royale: 护盾免死 hp 不变 (hp '+k7.hp+')');
H.ok(T.getState().over !== true, 'royale: 护盾免死未结束');

// 8) 无盾扣血/失败
T.setShield(0);
var k8 = T.getState().towers.find(t=>t.side==='me'&&t.kind==='king');
k8.hp = 100;
T.takeHit(2000);
H.ok(T.getState().over === true, 'royale: 无盾致命 king 失守 → over');

// 9) 加速 buff 数值
T.setBoost(6);
H.ok(T.getBoost() === 6, 'royale: 加速 buff=6');

// 10) 摧毁敌方国王塔触发胜利 confetti
T.reset();
H.ok('胜利前 confettiFired 为 false', T.confettiFired() === false);
T.finish('win');
H.ok('胜利 → confettiFired 为 true', T.confettiFired() === true);
H.ok('finish 后 result=win', T.state.result === 'win');
T.reset();
H.ok('重开后 confettiFired 复位为 false', T.confettiFired() === false);

// 汇总
const total = H.results.length;
const pass = H.results.filter(r => r.pass).length;
console.log(`\nroyale: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

module.exports = {};
