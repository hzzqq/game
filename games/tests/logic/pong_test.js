const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../pong.html');

t.reset();
// 球到达右挡板碰撞面(x+R>=W-PW=392)、挡板居中(y=150 覆盖 120-180)，球 y=150 在范围内 → 反弹
t.setPaddle('right',150);
t.setBall(385,150,5,0);
t.step(1); // ball.x → 390，ball.x+R=397 >= 392 触发右挡板反弹
eq('右挡板反弹后 vx 变负', t.getBall().vx < 0, true);
eq('挡板反弹未得分', t.getScore(), [0,0]);

// 回归：左挡板不应在球远离时提前反弹（曾因 PW+PH/2 阈值在 x≈45 处误弹）
t.reset();
t.setPaddle('left',150);
t.setBall(40,150,-3,0);
t.step(1); // ball.x → 37，距左挡板(x∈[0,8])尚远，不应反弹
eq('左挡板不应在 x=37 处提前接球 (vx 应仍为 -3)', t.getBall().vx, -3);
// 左挡板在球真正到达时正确反弹
t.reset();
t.setPaddle('left',150);
t.setBall(20,150,-5,0);
t.step(2); // ball.x → 10，ball.x-R=3 <= PW=8 → 反弹
ok('左挡板正确反弹后 vx 变正', t.getBall().vx > 0);

// 球出右边界且右挡板让开(y=50 覆盖 20-80，球 y=300 不在) → 左方得分
t.reset();
t.setPaddle('right',50);
t.setBall(390,300,5,0);
t.step(5); // x→415 > 400(宽) → 左方(score[0])得分
eq('球越过右挡板 → 左方得分', t.getScore(), [1,0]);

// 上下墙反弹
t.reset();
t.setBall(200,5,0,-5); // 向上，贴近上墙
t.step(5); // y→0 反弹为向下
ok('上墙反弹后 vy 变正', t.getBall().vy > 0);

// ===== 注入：掉落道具 / 增益（确定性驱动）=====
t.reset();
eq('初始无掉落', t.getPickups().length, 0);
eq('初始金币0', t.getCoins(), 0);
// 球碰撞拾取：掉落放在球初始位置
t.spawnPickup('coin',200,150);
t.stepPickups(0.001);
eq('球碰撞拾取金币+50', t.getCoins(), 50);
eq('拾取后掉落移除', t.getPickups().length, 0);

// 护盾免失分一次（左方漏球 -> 本应右方得分）
t.reset();
t.applyPickup('shield','L');
ok('左护盾生效', t.getShield('L')===true);
t.setBall(5,150,-5,0);
t.step(2); // ball.x → -5 < 0，左方漏球，护盾抵消
eq('护盾免失分：比分仍 0:0', t.getScore(), [0,0]);
ok('护盾已消耗', t.getShield('L')===false);
// 无护盾则正常失分
t.reset();
t.setBall(5,150,-5,0);
t.step(2);
eq('无护盾左方漏球 -> 右方得分', t.getScore(), [0,1]);

// 球速增益：左板接球后 vx 放大
t.reset();
t.applyPickup('boost','L');
t.setBall(20,150,-5,0);
t.setPaddle('left',150);
t.step(2);
ok('左板加速后 vx 放大(>5)', t.getBall().vx > 5);

// boost 计时衰减
t.reset();
t.applyPickup('boost','R');
ok('右boost>0', t.getBoost('R')>0);
t.stepPickups(5);
eq('右boost 计时归零', t.getBoost('R'), 0);

// 未碰撞不生效
t.reset();
t.spawnPickup('coin',50,30);
eq('生成掉落但金币仍0', t.getCoins(), 0);
t.stepPickups(0.001); // 球在(200,150)，远离(50,30)，不拾取
eq('远离则未拾取', t.getCoins(), 0);
eq('掉落仍保留', t.getPickups().length, 1);
