// 拳皇逻辑单测：怒气满 -> 狂暴触发 / 怒气不足不触发 / 已狂暴保持
const H = require('./harness');
const { t: T } = H.loadGame('../fighting.html');

// 1) 怒气满 -> 触发狂暴，怒气清零
T.setRage(T.player, 100);
T.triggerBerserk(T.player);
H.ok(T.isBerserk(T.player) === true, 'fighting: 怒气满触发狂暴');
H.ok(T.getRage(T.player) === 0, 'fighting: 触发后怒气清零 (得到 ' + T.getRage(T.player) + ')');

// 2) 怒气不足 -> 不触发
T.setRage(T.ai, 50);
T.triggerBerserk(T.ai);
H.ok(T.isBerserk(T.ai) === false, 'fighting: 怒气不足不触发狂暴');
H.ok(T.getRage(T.ai) === 50, 'fighting: 未触发怒气保持 (得到 ' + T.getRage(T.ai) + ')');

// 3) 已狂暴 -> 不重复触发，状态保持
T.setRage(T.player, 100);
T.triggerBerserk(T.player);          // 第一次触发 -> berserk
T.setRage(T.player, 100);
T.triggerBerserk(T.player);          // 已狂暴应被忽略
H.ok(T.isBerserk(T.player) === true, 'fighting: 已狂暴状态保持');

// 4) 回归：狂暴持续应为秒级(>=5000ms)，曾误写 5(ms) 致一帧即过期、1.5x 伤害失效
T.player.berserkTimer = 0;
T.setRage(T.player, 100);
T.triggerBerserk(T.player);
H.ok(T.player.berserkTimer >= 5000, 'fighting: 狂暴持续应秒级(>=5000ms) (得到 ' + T.player.berserkTimer + ')');
T.player.berserkTimer -= 16.7;       // 模拟一帧(~60fps)
H.ok(T.isBerserk(T.player) === true, 'fighting: 一帧后狂暴仍持续(证明非 5ms)');

module.exports = {};
