// 管道连接逻辑单测：旋转改变掩码、连通判定、打乱未连通、旋转4次复原、新局合法
const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../pipes.html');
const { U,R,D,L } = t;
const N = t.N;

function flatten(g){ const f=new Array(N*N).fill(0); for(let r=0;r<N;r++) for(let c=0;c<N;c++) f[r*N+c]=g[r][c]; return f; }

// 用确定布局测试旋转确实改变掩码（用 L 型管道，旋转必变）
const flat1 = new Array(N*N).fill(0); flat1[2*N+2] = U|R;
t.setBoard(flat1);
const before = t.getMask(2,2);
t.rotate(2,2);
ok('旋转改变掩码', t.getMask(2,2) !== before);

// 已解 L 型：isSolved 为真
const g = Array.from({length:N},()=>new Array(N).fill(0));
for(let c=0;c<N;c++) g[0][c] = (c===N-1)? (L|D) : (L|R);
for(let r=1;r<N-1;r++) g[r][N-1] = U|D;
g[N-1][N-1] = U|L;
t.setBoard(flatten(g));
ok('L 型解已连通', t.isSolved());

// 打乱 (0,0) 旋转一次 → 不再连通
const broken = flatten(g);
broken[0] = t.rotMask(broken[0]);
t.setBoard(broken);
ok('打乱后未连通', !t.isSolved());

// 旋转 4 次回到原样
let m = g[0][0];
const m0 = m;
for(let i=0;i<4;i++) m = t.rotMask(m);
eq('旋转4次复原', m, m0);

// 新局：规模合法、掩码范围合法
(() => {
  t.newGame();
  const st=t.getState();
  eq('新局网格 '+N+'x'+N, st.board.length, N*N);
  ok('新局掩码均在 0..15', st.board.every(v=>v>=0 && v<=15));
  ok('新局 solved 为布尔', typeof st.solved==='boolean');
})();
