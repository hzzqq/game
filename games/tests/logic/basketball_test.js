// 投篮：掉落道具/增益系统注入测试（确定性驱动，不依赖随机自动掉落）
const H = require('./harness');
const { t: T } = H.loadGame('../basketball.html');

T.reset();
const s0 = T.getState();
H.ok(s0.pickups === 0 && s0.boostTimer === 0, 'basketball: reset 后无掉落/强化');

// 找一个能命中的角度/力度组合
let found=false, ang=0, pow=0;
outer:
for(let a=15;a<=80;a+=2){
  for(let p=8;p<=24;p+=1){
    T.reset(); T.setScore(0); T.shoot(a, p);
    if(T.getScore()===1){ ang=a; pow=p; found=true; break outer; }
  }
}
H.ok(found, 'basketball: 找到能命中的角度/力度 (' + ang + '°/' + pow + ')');

// 1) 金币生效数值
T.reset(); T.setScore(0);
T.applyPickup('coin');
H.eq('basketball: 金币 +2', T.getScore(), 2);

// 2) 星星生效数值
T.reset(); T.setScore(0);
T.applyPickup('star');
H.eq('basketball: 星星 +5', T.getScore(), 5);

// 3) 强化计时
T.reset();
T.applyPickup('boost');
H.eq('basketball: 强化计时置 6s', T.getBoost(), 6);
T.stepPickups(1);
H.eq('basketball: 强化计时递减', T.getBoost(), 5);

// 4) 强化使进球得分 +3（而非 +1）
T.reset(); T.setScore(0); T.setBoost(6);
T.shoot(ang, pow);
H.eq('basketball: 强化下进球得 3 分', T.getScore(), 3);

// 5) 拾取后移除（飞行球经过篮筐处掉落物即收集）
T.reset(); T.setScore(0);
T.spawnPickup('coin', 330, 110); // 篮筐位置
T.shoot(ang, pow);               // 命中并经过该点
H.eq('basketball: 飞行球拾取得 +2（总 3）', T.getScore(), 3);
H.eq('basketball: 拾取后掉落清空', T.getPickups().length, 0);

// 6) 未碰撞不生效（掉落物远离轨迹）
T.reset(); T.setScore(0);
T.spawnPickup('coin', 50, 250);
T.shoot(ang, pow);
H.eq('basketball: 远离未拾取，仅进球 +1', T.getScore(), 1);
H.eq('basketball: 远离掉落仍在', T.getPickups().length, 1);

// 7) collectPickup 直接移除
T.reset(); T.setScore(0);
T.spawnPickup('star', 200, 200);
T.collectPickup(0);
H.eq('basketball: collectPickup 生效 +5', T.getScore(), 5);
H.eq('basketball: collectPickup 后清空', T.getPickups().length, 0);

module.exports = {};
