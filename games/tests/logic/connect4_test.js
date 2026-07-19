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
