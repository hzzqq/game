// 消消乐 (Match-3) 纯逻辑单测：找连/交换/重力
const H = require('./harness');
const { t } = H.loadGame('../match3.html');

// 构造无 3 连的基线棋盘：对角线条纹，相邻必不同
function baseline(){
  const b = [];
  for(let r=0;r<t.SIZE;r++){ b[r]=[]; for(let c=0;c<t.SIZE;c++) b[r][c]=(c+r)%t.GEMS; }
  return b;
}

// 1) adjacent 正交相邻性
H.ok('消消乐 adjacent 正交相邻=true', t.adjacent([0,0],[0,1]) === true);
H.ok('消消乐 adjacent 对角=false',   t.adjacent([0,0],[1,1]) === false);
H.ok('消消乐 adjacent 同行隔格=false', t.adjacent([0,0],[0,2]) === false);

// 2) findMatches 横向三连
(() => {
  const b = baseline();
  b[0][0]=9; b[0][1]=9; b[0][2]=9;
  t.setBoard(b);
  const m = t.findMatches();
  H.ok('消消乐 findMatches 横向三连命中3格', m.length === 3, '得到 '+m.length);
  const has = (r,c)=>m.some(([rr,cc])=>rr===r&&cc===c);
  H.ok('消消乐 命中(0,0)(0,1)(0,2)', has(0,0)&&has(0,1)&&has(0,2));
})();

// 3) findMatches 纵向三连
(() => {
  const b = baseline();
  b[0][3]=9; b[1][3]=9; b[2][3]=9;
  t.setBoard(b);
  const m = t.findMatches();
  H.ok('消消乐 findMatches 纵向三连命中3格', m.length === 3, '得到 '+m.length);
})();

// 4) 基线棋盘应当无匹配
(() => {
  t.setBoard(baseline());
  H.ok('消消乐 基线棋盘无匹配', t.findMatches().length === 0);
})();

// 5) swapArr 交换正确 + 交换后触发横向三连
(() => {
  const b = baseline();
  b[0][0]=9; b[0][2]=9; b[0][1]=7; b[1][1]=9; // 交换前无匹配
  t.setBoard(b);
  H.ok('消消乐 交换前无匹配', t.findMatches().length === 0);
  t.swapArr([0,1],[1,1]); // (0,1)->9, (1,1)->7
  const m = t.findMatches();
  H.ok('消消乐 swapArr 后触发横向三连', m.length === 3, '得到 '+m.length);
  H.eq('消消乐 swapArr 交换值正确', [t.getBoard()[0][1], t.getBoard()[1][1]], [9,7]);
})();

// 6) applyGravity 列下落 + 无空洞 + 保留原值
(() => {
  const b = []; for(let r=0;r<t.SIZE;r++){ b[r]=[]; for(let c=0;c<t.SIZE;c++) b[r][c]=null; }
  b[0][0]=5; // 仅顶部一格有值
  t.setBoard(b);
  t.applyGravity();
  const g = t.getBoard();
  let nulls = 0; for(let r=0;r<t.SIZE;r++) for(let c=0;c<t.SIZE;c++) if(g[r][c]===null) nulls++;
  H.ok('消消乐 applyGravity 无空洞', nulls === 0, 'null数 '+nulls);
  H.ok('消消乐 applyGravity 底部保留原值', g[t.SIZE-1][0] === 5);
})();
