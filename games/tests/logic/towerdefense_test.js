// 塔防：掉落道具/增益系统注入测试（确定性驱动，不依赖随机自动掉落）
const H = require('./harness');
const { t: T } = H.loadGame('../towerdefense.html');

T.reset();
const s0 = T.getState();
H.ok(s0.pickups === 0 && s0.shield === 0 && s0.boostTimer === 0, 'towerdefense: reset 后无掉落/护盾/强化');

// 1) 金币生效数值
T.setGold(0);
T.applyPickup('coin');
H.eq('towerdefense: 金币 +20', T.getGold(), 20);

// 2) 全图加速计时
T.applyPickup('boost');
H.eq('towerdefense: 加速计时置 6s', T.getBoost(), 6);
T.stepPickups(1);
H.eq('towerdefense: 加速计时递减', T.getBoost(), 5);

// 3) 回血生效数值
T.setLives(5);
T.applyPickup('heart');
H.eq('towerdefense: 回血 +1', T.getLives(), 6);

// 4) 护盾生效数值
T.applyPickup('shield');
H.eq('towerdefense: 护盾置 1', T.getShield(), 1);

// 5) 强化使塔射速更快（同时间敌人受伤更多）
function freshEnemy(){ return {id:1,hp:100,maxhp:100,seg:0,t:0,speed:0,reward:4,alive:true}; }
T.reset(); T.setGold(999); T.placeTower(2,1);
T.setEnemies([freshEnemy()]); T.setBoost(0);
for(let i=0;i<10;i++) T.step(0.5);
const hpNo = T.getEnemies()[0] ? T.getEnemies()[0].hp : 0;
T.setEnemies([freshEnemy()]); T.setBoost(6);
for(let i=0;i<10;i++) T.step(0.5);
const hpHas = T.getEnemies()[0] ? T.getEnemies()[0].hp : 0;
H.ok(hpHas < hpNo, 'towerdefense: 强化使塔射速更快（受伤更多）');

// 6) 未碰撞不生效（顶部掉落未落到底）
T.reset(); T.setGold(0);
T.spawnPickup('coin', 100, 0);
H.eq('towerdefense: 未碰撞前掉落数=1', T.getPickups().length, 1);
T.stepPickups(0.05);
H.eq('towerdefense: 未落底未拾取，金不变', T.getGold(), 0);
H.eq('towerdefense: 未落底掉落仍在', T.getPickups().length, 1);

// 7) 拾取后移除（掉落到底部基地即拾取）
T.reset(); T.setGold(0);
T.spawnPickup('coin', 100, 320); // 接近 H(336)-r(12)=324 阈值
T.stepPickups(0.1);
H.eq('towerdefense: 落底拾取后金 +20', T.getGold(), 20);
H.eq('towerdefense: 拾取后掉落清空', T.getPickups().length, 0);

// 8) 护盾免死（不扣命，护盾消耗）
T.reset(); T.setLives(10); T.setShield(1);
T.takeHit(1);
H.eq('towerdefense: 护盾免死，命数不变', T.getLives(), 10);
H.eq('towerdefense: 护盾被消耗', T.getShield(), 0);

// 9) 无盾扣血
T.reset(); T.setLives(10); T.setShield(0);
T.takeHit(1);
H.eq('towerdefense: 无盾扣血，命数-1', T.getLives(), 9);

// 10) 守住全部波次触发通关 confetti
T.newGame();
H.ok('通关前 confettiFired 为 false', T.confettiFired() === false);
T.setWave(T.MAX_WAVE);
T.setWaveActive(true);
T.setEnemies([]);
T.update(0.016); // waveActive 且无敌人 → 通关
H.ok('守住全部波次 hasWon 为 true', T.hasWon() === true);
H.ok('通关 → confettiFired 为 true', T.confettiFired() === true);
T.newGame();
H.ok('重开后 confettiFired 复位为 false', T.confettiFired() === false);

// 汇总
const total = H.results.length;
const pass = H.results.filter(r => r.pass).length;
console.log(`\ntowerdefense: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);

module.exports = {};
