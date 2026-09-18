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

// ===== 胜利/里程碑 confetti 标记（P4：纯视觉，整局仅一次，绝不改玩法/计分）=====
t.newGame();
H.ok('消消乐 新局未标记 confetti', t.confettiFired === false);
// resolve 内的 confetti 在 >=5 连消时触发，但受异步延迟影响；沙箱中走同步里程碑钩子驱动确定性断言。
(() => {
  const b = []; for(let r=0;r<t.SIZE;r++){ b[r]=[]; for(let c=0;c<t.SIZE;c++) b[r][c]=(c+r)%t.GEMS; }
  for(let c=0;c<5;c++) b[0][c]=0;          // 第 0 行前 5 格同色 => 大消除里程碑
  t.setBoard(b);
  H.ok('消消乐 hasBigMatch 检出 >=5 连', t.hasBigMatch() === true);
  t.milestone();
  H.ok('消消乐 里程碑后标记 confetti', t.confettiFired === true);
})();
t.newGame();
H.ok('消消乐 重开后 confetti 复位', t.confettiFired === false);
})();

// ===== setRand 可注入随机源（T-115：随机缝 + 确定性验证）=====
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  H.ok('match3 setRand 钩子存在', typeof t.setRand === 'function');
  t.setRand(lcg(7));     t.newGame(); const b1 = JSON.stringify(t.getBoard());
  t.setRand(lcg(7));     t.newGame(); const b2 = JSON.stringify(t.getBoard());
  t.setRand(lcg(99999)); t.newGame(); const b3 = JSON.stringify(t.getBoard());
  H.ok('match3 同种子开局棋盘确定', b1 === b2);
  H.ok('match3 不同种子开局棋盘不同', b1 !== b3);
  t.setRand();
})();

// ===== T-127：本地 Top5 排行榜（Common.HighScores 数据层）=====
(() => {
  H.ok('match3 排行榜 清空成功', t.clearTop5() === true);
  H.ok('match3 排行榜 0 分不入榜', t.recordScore(0) === 0);
  H.ok('match3 排行榜 空榜无记录', t.getTop5().length === 0);
  H.ok('match3 排行榜 9999 上榜第 1', t.recordScore(9999) === 1);
  H.ok('match3 排行榜 榜首=9999', t.getTop5()[0].score === 9999);
  H.ok('match3 排行榜 8888 上榜第 2', t.recordScore(8888) === 2);
  for (let i = 0; i < 6; i++) t.recordScore(10000 + i);
  H.ok('match3 排行榜 最多保留 5 条', t.getTop5().length === 5);
  H.ok('match3 排行榜 截断后榜首仍最大', t.getTop5()[0].score === 10005);
  t.clearTop5();
  H.ok('match3 排行榜 收尾清空', t.getTop5().length === 0);
})();
