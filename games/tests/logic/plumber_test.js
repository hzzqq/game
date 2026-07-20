const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../plumber.html');
const { U,R,D,L } = t;

t.newGame();
const before = t.getMask(2,2);
t.rotate(2,2);
ok('旋转改变掩码', t.getMask(2,2) !== before);

// 已解 L 型：isSolved 为真
const solved = [
  [L|R, L|R, L|R, L|R, L|R, L|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|R],
];
t.setBoard(solved);
ok('L 型解已连通', t.isSolved());

// 打乱 (0,0) 旋转一次 → 不再连通
const broken = solved.map(r=>r.slice());
broken[0][0] = t.rotMask(broken[0][0]);
t.setBoard(broken);
ok('打乱后未连通', !t.isSolved());

// 旋转 4 次回到原样
let m = solved[0][0];
const m0 = m;
for(let i=0;i<4;i++) m = t.rotMask(m);
eq('旋转4次复原', m, m0);
