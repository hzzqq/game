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

// 5) 标准化掉落：🔥怒气狂暴 生效（攻速/伤害×1.5，5s）
T.setBoost(0); T.player.berserkTimer=0;
T.spawnPickup('berserk', T.player.x, T.player.y);
T.stepPickups(0.05);
H.ok(T.player.berserkTimer > 0, 'fighting: 狂暴 pickup 生效 (berserkTimer=' + T.player.berserkTimer + ')');
H.ok(T.getPickups() === 0, 'fighting: 拾取后移除');

// 6) 未碰撞不生效
T.spawnPickup('berserk', 0, 0);
T.stepPickups(0.05);
H.ok(T.getPickups() === 1, 'fighting: 未碰撞 pickup 仍在');

// 7) 🛡格挡 pickup → 护盾+1
T.setShield(0);
T.spawnPickup('block', T.player.x, T.player.y);
T.stepPickups(0.05);
H.ok(T.getShield() === 1, 'fighting: 格挡 pickup 护盾+1 (shield=' + T.getShield() + ')');

// 8) 护盾免死：有盾时受伤不扣血、不结束
T.setShield(1); T.player.health=100;
T.takeHit(30);
H.ok(T.player.health === 100, 'fighting: 护盾免死 hp 不变 (hp=' + T.player.health + ')');
H.ok(T.getState() === 'fight', 'fighting: 护盾免死未结束');

// 9) 无盾扣血/失败
T.setShield(0); T.player.health=10;
T.takeHit(50);
H.ok(T.getState() === 'roundend', 'fighting: 无盾致命 → roundend');

// 10) 加速 get/set
T.setBoost(5);
H.ok(T.getBoost() === 5, 'fighting: getBoost=5 (boost=' + T.getBoost() + ')');

// 11) 胜利彩带：玩家获胜 → confettiFired 置真（只读锁，独立于 Juice）
T.reset();
H.ok(T.confettiFired() === false, 'fighting: 胜利前 confettiFired 为 false');
T.win();
H.ok(T.confettiFired() === true, 'fighting: 玩家获胜 → confettiFired 为真');

// 12) 重置后锁复位
T.reset();
H.ok(T.confettiFired() === false, 'fighting: 重置后 confettiFired 复位');

const total = H.results.length;
const pass = H.results.filter(r => r.pass).length;
console.log(`\nfighting: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

module.exports = {};
