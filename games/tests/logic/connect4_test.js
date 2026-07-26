// 四子棋逻辑单测：竖直/水平/斜向四连判定、三连非胜
const H = require('./harness');
const { t } = H.loadGame('../connect4.html');

(() => {
  t.reset();
  const empty = [];
  for (let r = 0; r < 6; r++) { const row = []; for (let c = 0; c < 7; c++) row.push(0); empty.push(row); }

  const v = empty.map(x => x.slice()); v[5][0] = 1; v[4][0] = 1; v[3][0] = 1; v[2][0] = 1;
  t.setBoard(v); H.ok('四子棋 竖直四连', t.checkWin(2, 0, 1) !== null);

  const h = empty.map(x => x.slice()); h[5][0] = 1; h[5][1] = 1; h[5][2] = 1; h[5][3] = 1;
  t.setBoard(h); H.ok('四子棋 水平四连', t.checkWin(5, 3, 1) !== null);

  const d = empty.map(x => x.slice()); d[5][0] = 1; d[4][1] = 1; d[3][2] = 1; d[2][3] = 1;
  t.setBoard(d); H.ok('四子棋 斜向四连', t.checkWin(2, 3, 1) !== null);

  const n = empty.map(x => x.slice()); n[5][0] = 1; n[5][1] = 1; n[5][2] = 1;
  t.setBoard(n); H.ok('四子棋 三连非胜', t.checkWin(5, 2, 1) === null);
})();

// ---------- 胜利 confetti 标记（竖直四连，确定性驱动）----------
(() => {
  t.reset();
  H.ok('confettiFired 初始 false', t.confettiFired === false);
  const b = t.getBoard();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) b[r][c] = 0;
  b[5][0] = 1; b[4][0] = 1; b[3][0] = 1; // 底部三红，待落第4子
  t.setBoard(b);
  t.current = 1; // 红方
  t.dropAt(0);   // 落下动画（不依赖 rAF 循环）
  t.commitDrop(); // 提交 → checkWin 四连 → endGame
  H.ok('竖直四连胜利后 confettiFired 置 true', t.confettiFired === true);
  t.reset();
  H.ok('reset 后 confettiFired 恢复 false', t.confettiFired === false);
})();

// ---------- 手感反馈只读计数钩子 ----------
H.ok('connect4 暴露 fxShakes', typeof t.fxShakes === 'function');
H.ok('connect4 暴露 fxBursts', typeof t.fxBursts === 'function');
t.reset();
H.eq('fxShakes 初始 0', t.fxShakes(), 0);
H.eq('fxBursts 初始 0', t.fxBursts(), 0);

// 普通落子 → fxBursts++
(() => {
  t.reset();
  const b = t.getBoard();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) b[r][c] = 0;
  t.setBoard(b); t.current = 1;
  t.dropAt(3); t.commitDrop();
  H.ok('落子后 fxBursts > 0', t.fxBursts() > 0);
  H.eq('普通落子未连成 → fxShakes 仍 0', t.fxShakes(), 0);
})();

// 连成四子 → fxShakes++（同时 fxBursts++）
(() => {
  t.reset();
  const b = t.getBoard();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) b[r][c] = 0;
  b[5][0] = 1; b[4][0] = 1; b[3][0] = 1;
  t.setBoard(b); t.current = 1;
  t.dropAt(0); t.commitDrop();
  H.ok('连成四子后 fxShakes > 0', t.fxShakes() > 0);
  H.ok('连成四子后 fxBursts > 0', t.fxBursts() > 0);
})();

t.reset();
H.eq('reset 后 fxShakes 归零', t.fxShakes(), 0);
H.eq('reset 后 fxBursts 归零', t.fxBursts(), 0);
