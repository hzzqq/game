// 叠塔逻辑单测：完美叠放、切边、完全错过=负、达标=胜、step 移动与边界回弹
const H = require('./harness');
const { t } = H.loadGame('../towerstack.html');
const W = t.W;

// 1) 完美叠放：完全重合 → 新块与底块一致、层数+1
(() => {
  t.reset();
  t.setBlocks([{x:0, w:200}]);
  t.setCurrent({x:0, w:200, dir:1});
  t.drop();
  const st=t.getState();
  H.eq('完美叠放 层数=2', st.blocks.length, 2);
  H.eq('完美叠放 顶块x=0', st.blocks[1].x, 0);
  H.eq('完美叠放 顶块w=200', st.blocks[1].w, 200);
  H.ok('完美叠放 未结束', st.over===false);
})();

// 2) 部分重叠 → 取交集宽度（右移 50）
(() => {
  t.reset();
  t.setBlocks([{x:0, w:200}]);
  t.setCurrent({x:50, w:200, dir:1});
  t.drop();
  const top=t.getState().blocks[1];
  H.eq('切边 顶块x=50', top.x, 50);
  H.eq('切边 顶块w=150', top.w, 150);
})();

// 3) 完全错过 → 失败
(() => {
  t.reset();
  t.setBlocks([{x:0, w:200}]);
  t.setCurrent({x:300, w:100, dir:-1});
  t.drop();
  const st=t.getState();
  H.ok('完全错过 gameOver', st.gameOver===true);
  H.ok('完全错过 won=false', st.won===false);
})();

// 4) 叠到目标层数 → 胜利
(() => {
  t.reset();
  t.setTarget(2);
  t.setBlocks([{x:0, w:200}]);
  t.setCurrent({x:0, w:200, dir:1});
  t.drop();
  const st=t.getState();
  H.ok('达标 won', st.won===true && st.over===true);
})();

// 5) step 推进且边界回弹
(() => {
  t.reset();
  t.setCurrent({x:0, w:50, dir:1});
  t.step(0.1);
  H.ok('step 向右移动', t.getState().current.x > 0);
  // 推到右侧边界
  t.setCurrent({x:W-50, w:50, dir:1});
  t.step(1.0);
  const c=t.getState().current;
  H.eq('回弹后贴右界 x=W-50', c.x, W-50);
  H.eq('回弹后方向反转', c.dir, -1);
})();
