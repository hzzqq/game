// 月球着陆逻辑单测：着陆判定（落速/落角/横向/平台）、撞毁、出界、step 推进
const H = require('./harness');
const { t } = H.loadGame('../lunarlander.html');

const PAD_X0=t.PAD_X0, PAD_X1=t.PAD_X1, GROUND=t.GROUND;

// 1) 平台中心、参数良好 → 判定着陆
(() => {
  t.setShip({ x:300, y:GROUND-10, vx:0, vy:10, angle:0, fuel:100 });
  H.eq('平台中心软着陆=landed', t.evaluateLanding(), 'landed');
})();

// 2) 落速过快 → 撞毁
(() => {
  t.setShip({ x:300, y:GROUND-10, vx:0, vy:40, angle:0, fuel:100 });
  H.eq('落速过快=crashed', t.evaluateLanding(), 'crashed');
})();

// 3) 落角过大 → 撞毁
(() => {
  t.setShip({ x:300, y:GROUND-10, vx:0, vy:10, angle:0.5, fuel:100 });
  H.eq('落角过大=crashed', t.evaluateLanding(), 'crashed');
})();

// 4) 落在平台外 → 撞毁
(() => {
  t.setShip({ x:100, y:GROUND-10, vx:0, vy:5, angle:0, fuel:100 });
  H.eq('平台外=crashed', t.evaluateLanding(), 'crashed');
})();

// 5) step 触地软着陆 → won
(() => {
  t.reset();
  t.setShip({ x:300, y:GROUND-11, vx:0, vy:10, angle:0, fuel:100 });
  const st = t.step(0.1, { thrust:false, left:false, right:false });
  H.ok('step 软着陆 over', st.over === true);
  H.ok('step 软着陆 won', st.won === true && st.status === 'landed');
})();

// 6) step 触地高速 → 撞毁
(() => {
  t.reset();
  t.setShip({ x:300, y:GROUND-11, vx:0, vy:30, angle:0, fuel:100 });
  const st = t.step(0.1, { thrust:false, left:false, right:false });
  H.ok('step 高速撞毁 over', st.over === true);
  H.ok('step 高速撞毁 won=false', st.won === false && st.status === 'crashed');
})();

// 7) 出界 → 撞毁
(() => {
  t.reset();
  t.setShip({ x:-5, y:200, vx:-20, vy:0, angle:0, fuel:100 });
  const st = t.step(0.1, { thrust:false, left:false, right:false });
  H.ok('出界 over', st.over === true);
  H.ok('出界 crashed', st.status === 'crashed' && st.won === false);
})();

// 8) 推力应抵消重力（燃料消耗、vy 减小）
(() => {
  t.reset();
  t.setShip({ x:300, y:200, vx:0, vy:30, angle:0, fuel:100 });
  const before = t.getState();
  const after = t.step(0.2, { thrust:true, left:false, right:false });
  H.ok('推力消耗燃料', after.fuel < before.fuel);
  H.ok('推力使 vy 增速小于纯重力', after.vy < before.vy + 18*0.2 + 0.001);
})();
