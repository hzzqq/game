const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../lunarlander.html');

// 初始态
t.reset(1234);
ok('lunarlander: 初始未结束', t.getState().over === false);
ok('lunarlander: 初始无掉落物', t.getPickups() === 0, 'n=' + t.getPickups());
ok('lunarlander: 初始无护盾', t.getShield() === 0);

// ===== 道具系统（P3） =====

// 1) applyPickup 数值生效（直接走钩子，不改核心玩法）
t.reset(11);
let sc0 = t.getScore();
t.applyPickup('coin');
ok('lunarlander: 金币加分 +50', t.getScore() === sc0 + 50, 'score=' + t.getScore());

t.reset(12);
t.setFuel(20);
t.applyPickup('fuel');
ok('lunarlander: 燃料回复 +40(上限100)', t.getFuel() === 60, 'fuel=' + t.getFuel());

t.reset(13);
t.applyPickup('shield');
ok('lunarlander: 护盾 +1', t.getShield() === 1, 'shield=' + t.getShield());

t.reset(14);
t.applyPickup('stable');
ok('lunarlander: 稳定计时 >0', t.getStable() > 0, 'stable=' + t.getStable());

// 2) 拾取后移除（spawnPickup 落在飞船上 → stepPickups 即时拾取）
t.reset(21);
t.setFuel(10);
t.spawnPickup('fuel');                 // 默认落在 ship 当前位置
ok('lunarlander: spawnPickup 后掉落物 +1', t.getPickups() === 1, 'n=' + t.getPickups());
t.stepPickups(0.001);
ok('lunarlander: 接触后掉落物移除', t.getPickups() === 0, 'n=' + t.getPickups());
ok('lunarlander: 接触后燃料生效', t.getFuel() === 50, 'fuel=' + t.getFuel());

t.reset(22);
t.spawnPickup('shield');
t.stepPickups(0.001);
ok('lunarlander: 拾取护盾生效', t.getShield() === 1, 'shield=' + t.getShield());
ok('lunarlander: 拾取后移除', t.getPickups() === 0);

t.reset(23);
t.spawnPickup('stable');
t.stepPickups(0.001);
ok('lunarlander: 拾取稳定生效', t.getStable() === t.STABLE_DUR, 'stable=' + t.getStable());
ok('lunarlander: 拾取后移除', t.getPickups() === 0);

// 用 step 主循环路径也能拾取（验证 update 内 updatePickups 真实调用）
t.reset(24);
t.setShip({ x: 300, y: 100, vx: 0, vy: 0, angle: 0 });
const scBefore = t.getScore();
t.spawnPickup('coin');
t.step(0.016, {});
ok('lunarlander: step 路径拾取金币生效', t.getScore() === scBefore + 50, 'score=' + t.getScore());
ok('lunarlander: step 路径拾取后移除', t.getPickups() === 0);

// 3) 护盾免一次坠毁（撞地但有护盾 → 不死 + 护盾消耗）
t.reset(31);
t.setShip({ x: 300, y: 540 - 10 + 8, vx: 0, vy: 50, angle: 0.5 }); // 平台内、角度/落速超限 → 判定 crashed
t.setShield(1);
t.step(0.016, {});
ok('lunarlander: 有护盾时坠毁不死', t.getState().over === false, 'over=' + t.getState().over);
ok('lunarlander: 护盾被消耗', t.getShield() === 0, 'shield=' + t.getShield());
ok('lunarlander: 护盾消耗后状态非 crashed', t.getState().status !== 'crashed', 'status=' + t.getState().status);

// 4) 无盾失败行为不变（与注入前一致：over=true, won=false, status=crashed）
t.reset(32);
t.setShip({ x: 300, y: 540 - 10 + 8, vx: 0, vy: 50, angle: 0.5 });
t.setShield(0);
t.step(0.016, {});
ok('lunarlander: 无护盾坠毁 → 结束', t.getState().over === true);
ok('lunarlander: 无护盾坠毁 → 未胜利', t.getState().won === false);
ok('lunarlander: 无护盾坠毁 → status crashed', t.getState().status === 'crashed', 'status=' + t.getState().status);

// 5) 稳定增益：buff 期间自动平衡（angle 向 0 收敛，vx 衰减）
t.reset(33);
t.setShip({ x: 300, y: 100, vx: 12, vy: 0, angle: 0.4 });
t.setStable(1);
t.step(0.1, {});
const st = t.getState();
ok('lunarlander: 稳定期间角度趋向 0', Math.abs(st.angle) < 0.4, 'angle=' + st.angle.toFixed(3));
ok('lunarlander: 稳定期间横向速度衰减', Math.abs(st.vx) < 12, 'vx=' + st.vx.toFixed(3));
