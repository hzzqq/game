const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../dice.html');

// 固定随机：0.4 → 1+floor(0.4*6)=1+2=3
t.setRand(()=>0.4);
t.reset();
t.roll(); // 3, roundScore=3
t.roll(); // 3, roundScore=6
t.hold(); // 存入玩家0
eq('玩家0 总分=6', t.getTotal(0), 6);
eq('换到玩家1', t.getTurn(), 1);
eq('本回合清零', t.getRound(), 0);

// 掷出 1：回合作废并换人，总分不变
t.setRand(()=>0.0); // 1+floor(0)=1
t.roll(); // 1 → 换回玩家0，roundScore=0，total[1] 不变
eq('掷到1换回玩家0', t.getTurn(), 0);
eq('玩家1 总分仍为0', t.getTotal(1), 0);
eq('本回合因1清零', t.getRound(), 0);

// 胜利判定：玩家0 已达 99，再掷 3 直接到 102 ≥ 100
t.setRand(()=>0.4);
t.setTotal(0,99);
t.roll(); // 3 → 99+3=102 ≥100
ok('达到目标分 → 游戏结束', t.isOver() === true);
eq('玩家0 获胜', t.getWinner(), 0);
