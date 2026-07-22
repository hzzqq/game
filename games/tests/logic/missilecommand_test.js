// 导弹防御逻辑单测：拦截弹摧毁来袭导弹、城市被毁判定、全城被毁=负、通关判定
const H = require('./harness');
const { t } = H.loadGame('../missilecommand.html');

// 1) launch 发射拦截弹
(() => {
  t.reset();
  t.launch(200, 100);
  H.eq('发射后拦截弹数=1', t.getState().interceptors.length, 1);
})();

// 2) 拦截弹在导弹附近引爆 → 摧毁来袭导弹、加分
(() => {
  t.reset();
  t.spawnIncoming(100, 100, 0); // 静止导弹于 (100,40)
  H.eq('生成来袭导弹=1', t.getState().missiles.length, 1);
  t.launch(100, 40);            // 朝导弹发射
  for(let i=0;i<200 && t.getState().missiles.length>0;i++) t.step(0.05);
  const st=t.getState();
  H.ok('拦截后导弹清空', st.missiles.length===0);
  H.eq('拦截得分+25', st.score, 25);
})();

// 3) explodeAt 直接炸毁范围内来袭导弹
(() => {
  t.reset();
  t.spawnIncoming(200, 200, 0);
  t.explodeAt(200, 40);
  H.eq('explodeAt 摧毁导弹', t.getState().missiles.length, 0);
})();

// 4) 来袭导弹命中城市 → 城市被毁
(() => {
  t.reset();
  const st=t.getState();
  const cityX = st.cities[0].x;
  t.spawnIncoming(cityX, cityX, 150);
  for(let i=0;i<60 && t.getState().alive===6;i++) t.step(0.1);
  H.eq('命中后存活城市=5', t.getState().alive, 5);
  H.ok('城市0已毁', t.getState().cities[0].alive===false);
})();

// 5) 所有城市被毁 → 失败
(() => {
  t.reset();
  const st=t.getState();
  for(let i=0;i<st.total;i++){ const x=st.cities[i].x; t.spawnIncoming(x, x, 150); }
  for(let i=0;i<80 && !t.getState().over;i++) t.step(0.1);
  const s=t.getState();
  H.eq('全城被毁 alive=0', s.alive, 0);
  H.ok('全城被毁 status=lose', s.over && s.status==='lose' && s.won===false);
})();

// 6) 通关判定：清完目标波次且城市 intact 且无飞行物 → win
(() => {
  t.reset();
  t.setClearedWaves(t.TARGET_WAVES);
  t.checkEnd();
  const s=t.getState();
  H.ok('通关判定 won', s.over && s.status==='win' && s.won===true);
})();
