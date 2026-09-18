// 拳皇逻辑单测：怒气满 -> 狂暴触发 / 怒气不足不触发 / 已狂暴保持
const H = require('./harness');
const { t: T } = H.loadGame('../fighting.html');

// 1) 怒气满 -> 触发狂暴，怒气清零
T.setRage(T.player, 100);
T.triggerBerserk(T.player);
H.ok('fighting: 怒气满触发狂暴', T.isBerserk(T.player) === true);
H.ok('fighting: 触发后怒气清零 (得到 ' + T.getRage(T.player) + ')', T.getRage(T.player) === 0);

// 2) 怒气不足 -> 不触发
T.setRage(T.ai, 50);
T.triggerBerserk(T.ai);
H.ok('fighting: 怒气不足不触发狂暴', T.isBerserk(T.ai) === false);
H.ok('fighting: 未触发怒气保持 (得到 ' + T.getRage(T.ai) + ')', T.getRage(T.ai) === 50);

// 3) 已狂暴 -> 不重复触发，状态保持
T.setRage(T.player, 100);
T.triggerBerserk(T.player);          // 第一次触发 -> berserk
T.setRage(T.player, 100);
T.triggerBerserk(T.player);          // 已狂暴应被忽略
H.ok('fighting: 已狂暴状态保持', T.isBerserk(T.player) === true);

// 4) 回归：狂暴持续应为秒级(>=5000ms)，曾误写 5(ms) 致一帧即过期、1.5x 伤害失效
T.player.berserkTimer = 0;
T.setRage(T.player, 100);
T.triggerBerserk(T.player);
H.ok('fighting: 狂暴持续应秒级(>=5000ms) (得到 ' + T.player.berserkTimer + ')', T.player.berserkTimer >= 5000);
T.player.berserkTimer -= 16.7;       // 模拟一帧(~60fps)
H.ok('fighting: 一帧后狂暴仍持续(证明非 5ms)', T.isBerserk(T.player) === true);

// 5) 标准化掉落：🔥怒气狂暴 生效（攻速/伤害×1.5，5s）
T.setBoost(0); T.player.berserkTimer=0;
T.spawnPickup('berserk', T.player.x, T.player.y);
T.stepPickups(0.05);
H.ok('fighting: 狂暴 pickup 生效 (berserkTimer=' + T.player.berserkTimer + ')', T.player.berserkTimer > 0);
H.ok('fighting: 拾取后移除', T.getPickups() === 0);

// 6) 未碰撞不生效
T.spawnPickup('berserk', 0, 0);
T.stepPickups(0.05);
H.ok('fighting: 未碰撞 pickup 仍在', T.getPickups() === 1);

// 7) 🛡格挡 pickup → 护盾+1
T.setShield(0);
T.spawnPickup('block', T.player.x, T.player.y);
T.stepPickups(0.05);
H.ok('fighting: 格挡 pickup 护盾+1 (shield=' + T.getShield() + ')', T.getShield() === 1);

// 8) 护盾免死：有盾时受伤不扣血、不结束
T.setShield(1); T.player.health=100;
T.takeHit(30);
H.ok('fighting: 护盾免死 hp 不变 (hp=' + T.player.health + ')', T.player.health === 100);
H.ok('fighting: 护盾免死未结束', T.getState() === 'fight');

// 9) 无盾扣血/失败
T.setShield(0); T.player.health=10;
T.takeHit(50);
H.ok('fighting: 无盾致命 → roundend', T.getState() === 'roundend');

// 10) 加速 get/set
T.setBoost(5);
H.ok('fighting: getBoost=5 (boost=' + T.getBoost() + ')', T.getBoost() === 5);

// 11) 胜利彩带：玩家获胜 → confettiFired 置真（只读锁，独立于 Juice）
T.reset();
H.ok('fighting: 胜利前 confettiFired 为 false', T.confettiFired() === false);
T.win();
H.ok('fighting: 玩家获胜 → confettiFired 为真', T.confettiFired() === true);

// 12) 重置后锁复位
T.reset();
H.ok('fighting: 重置后 confettiFired 复位', T.confettiFired() === false);

// ---------- 手感深化：KO/局胜 shake+burst；狂暴触发 shake；完美格挡 shake ----------
T.reset();
H.ok('fighting: 初始 fx 计数为 0', T.fxShakes() === 0 && T.fxBursts() === 0);
// 击倒对手(ai.health=0) → 局胜：shake + burst
T.ai.health = 0;
T.update(16.6667);
H.ok('fighting: 击倒对手(局胜)触发 shake', T.fxShakes() > 0);
H.ok('fighting: 击倒对手(局胜)触发 burst', T.fxBursts() > 0);
// 狂暴触发 → shake
T.reset();
T.setRage(T.player, 100);
T.triggerBerserk(T.player);
H.ok('fighting: 狂暴触发 shake', T.fxShakes() > 0);
// 重置归零
T.reset();
H.ok('fighting: 重置后 fx 归零', T.fxShakes() === 0 && T.fxBursts() === 0);

const total = H.results.length;
const pass = H.results.filter(r => r.pass).length;
console.log(`\nfighting: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

module.exports = {};
