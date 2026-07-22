// 金字塔纸牌逻辑单测：可消判定（差1 + 已解锁）、非法消除拒绝、翻基准、通关判定
const H = require('./harness');
const { t } = H.loadGame('../pyramid.html');

// 构造确定性金字塔（3 行 6 张）
//        [5]
//      [6]   [7]
//   [8]   [9]   [10]
const rows = [
  [{s:0, r:5}],
  [{s:0, r:6}, {s:1, r:7}],
  [{s:0, r:8}, {s:1, r:9}, {s:0, r:10}],
];

// 1) 基准=9，底层(2,0)=8 与基准差1 且已解锁 → 可消成功
(() => {
  t.setPyramid(rows, {s:0, r:9}, []);
  const ok = t.remove(2,0); // 底层自由，rank 8 与 9 差1
  H.ok('消底层(8) 成功', ok === true);
  H.eq('消除计数=1', t.getState().removed, 1);
  H.eq('新基准=8', t.getState().base.r, 8);
})();

// 2) 未解锁的牌（上层子牌未消）拒绝消除
(() => {
  t.setPyramid(rows, {s:0, r:9}, []);
  const ok = t.remove(1,0); // (1,0)=6，子牌 (2,0)(2,1) 还在 -> 未解锁
  H.ok('未解锁拒绝', ok === false);
  H.eq('未解锁 计数不变', t.getState().removed, 0);
})();

// 3) 已解锁但点数差不为1 → 拒绝
(() => {
  t.setPyramid(rows, {s:0, r:2}, []); // 基准=2，底层(2,0)=8 差6
  const ok = t.remove(2,0);
  H.ok('差!=1 拒绝', ok === false);
})();

// 4) 翻牌库更新基准
(() => {
  t.setPyramid(rows, {s:0, r:6}, [{s:1, r:3}]);
  const ok = t.drawBase();
  H.ok('翻基准成功', ok === true);
  H.eq('基准更新为3', t.getState().base.r, 3);
  H.eq('牌库 -1', t.getState().stockLen, 0);
})();

// 5) 空牌库翻基准返回 false
(() => {
  t.setPyramid(rows, {s:0, r:6}, []);
  H.ok('空牌库翻基准=false', t.drawBase() === false);
})();

// 6) 消到顶 → 通关
(() => {
  const one = [[{s:0, r:5}]];
  t.setPyramid(one, {s:0, r:6}, []);
  const ok = t.remove(0,0);
  const st = t.getState();
  H.ok('单层消除成功', ok === true);
  H.ok('消到顶 won', st.over && st.won === true);
})();

// 7) free() 判定：底层自由、被覆盖的牌不自由
(() => {
  t.setPyramid(rows, {s:0, r:6}, []);
  H.ok('底层(2,0)自由', t.free(2,0) === true);
  H.ok('顶层(0,0) 被覆盖 不自由', t.free(0,0) === false);
  H.ok('(1,0) 被覆盖 不自由', t.free(1,0) === false);
})();

// 8) 新局：发牌规模合法（金字塔 TOTAL 张 + 基准 + 牌库）
(() => {
  t.newGame();
  const st=t.getState();
  H.eq('新局 金字塔张数=TOTAL', st.total, t.TOTAL);
  H.ok('新局 基准非空', st.base !== null);
  H.ok('新局 已消=0', st.removed === 0);
})();
