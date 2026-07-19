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

module.exports = {};
