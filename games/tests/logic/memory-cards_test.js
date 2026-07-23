const H = require('./harness');
const { loadGame, ok, eq } = H;
const { t } = loadGame('../memory-cards.html');

// ===== 初始态 =====
t.reset(12345);
ok('memory: 初始未胜利', t.isWin() === false);
ok('memory: 初始未结束', t.isGameOver() === false);
ok('memory: 初始分数为0', t.getScore() === 0);
const s0 = t.getState();
ok('memory: 普通档 4x4 = 16 张牌', s0.grid.length === 16, 'len=' + s0.grid.length);
ok('memory: 普通档 8 对', s0.pairs === 8, 'pairs=' + s0.pairs);
ok('memory: 初始全部背面朝下', s0.grid.every(c => !c.faceUp && !c.matched));

// ===== flip 翻牌 =====
t.reset(12345);
const flippedOk = t.flip(0);
ok('memory: flip 返回 true', flippedOk === true);
ok('memory: 翻开的牌 faceUp=true', t.getGrid()[0].faceUp === true);
ok('memory: 翻牌计 flips=1', t.getState().flips === 1);
ok('memory: 单张翻牌不计入 moves', t.getState().moves === 0);
// 重复点同一张应被忽略
const flipsBefore = t.getState().flips;
t.flip(0);
ok('memory: 重复点同一张不重复计数', t.getState().flips === flipsBefore, 'flips=' + t.getState().flips);
// 已消除的牌不应被再翻
t.setGrid(['A','A','B','B']);
t.flip(0); t.flip(1);                 // 消除 A 对
ok('memory: 已消除牌不能再翻', t.flip(0) === false);

// ===== 匹配消除加分 =====
t.setGrid(['A','A','B','B']);
const scBefore = t.getScore();
t.flip(0); t.flip(1);                 // 匹配 A 对
const gMatch = t.getGrid();
ok('memory: 匹配后两张均消除', gMatch[0].matched && gMatch[1].matched);
ok('memory: 匹配后 matched=1', t.getState().matched === 1);
ok('memory: 匹配后分数增加', t.getScore() > scBefore, 'score=' + t.getScore());
ok('memory: 匹配未结束', t.isWin() === false && t.isGameOver() === false);

// ===== 不匹配翻回 =====
t.setGrid(['A','A','B','B']);
const sc0 = t.getScore();
t.flip(0);                            // A 翻开
const midUp = t.getGrid()[0].faceUp;
t.flip(2);                            // B 翻开 → 不匹配，应翻回
const gMis = t.getGrid();
ok('memory: 不匹配前确有一张朝上', midUp === true);
ok('memory: 不匹配后两张均翻回', !gMis[0].faceUp && !gMis[2].faceUp);
ok('memory: 不匹配不消除', t.getState().matched === 0);
ok('memory: 不匹配分数不变', t.getScore() === sc0, 'score=' + t.getScore());
ok('memory: 不匹配消耗 1 步', t.getState().moves === 1, 'moves=' + t.getState().moves);

// ===== 胜利判定 =====
t.setGrid(['A','A','B','B']);
t.flip(0); t.flip(1);
t.flip(2); t.flip(3);
ok('memory: 全消除后 isWin=true', t.isWin() === true);
ok('memory: 全消除后游戏结束', t.isGameOver() === true);
ok('memory: 胜利态 won=true', t.getState().won === true);
ok('memory: 胜利时 matched=2', t.getState().matched === 2);
ok('memory: 胜利时分数为正', t.getScore() > 0, 'score=' + t.getScore());
ok('memory: 胜利时共翻 4 张', t.getState().flips === 4, 'flips=' + t.getState().flips);

// ===== 失败结局（步数超限）=====
t.setGrid(['A','A','B','B'], { maxMoves: 2 });
t.flip(0); t.flip(2);                 // 不匹配：moves=1
t.flip(1); t.flip(3);                 // 不匹配：moves=2 → 超限失败
ok('memory: 步数超限后游戏结束', t.isGameOver() === true);
ok('memory: 步数超限非胜利', t.isWin() === false);
ok('memory: 步数超限 won=false', t.getState().won === false);
ok('memory: 失败仍保持难度', t.getDifficulty() === 'normal');

// ===== 难度影响网格规模 =====
function gridSize(diff){
  t.setDifficulty(diff);
  t.reset(777);
  const st = t.getState();
  return { len: st.grid.length, rows: st.rows, cols: st.cols };
}
const ez = gridSize('easy');
const nm = gridSize('normal');
const hd = gridSize('hard');
const hl = gridSize('hell');
ok('memory: 简单档 4x3=12 张', ez.len === 12 && ez.rows === 4 && ez.cols === 3, JSON.stringify(ez));
ok('memory: 普通档 4x4=16 张', nm.len === 16 && nm.rows === 4 && nm.cols === 4, JSON.stringify(nm));
ok('memory: 困难档 5x4=20 张', hd.len === 20 && hd.rows === 5 && hd.cols === 4, JSON.stringify(hd));
ok('memory: 地狱档 6x5=30 张', hl.len === 30 && hl.rows === 6 && hl.cols === 5, JSON.stringify(hl));
ok('memory: 难度越高网格越大', ez.len < nm.len && nm.len < hd.len && hd.len < hl.len,
   `${ez.len},${nm.len},${hd.len},${hl.len}`);
// 网格规模必为偶数（可成对）
ok('memory: 各档网格均为偶数', ez.len%2===0 && nm.len%2===0 && hd.len%2===0 && hl.len%2===0);
// 符号成对：每种符号恰好出现两次
[ 'easy','normal','hard','hell' ].forEach(function(d){
  t.setDifficulty(d); t.reset(2024);
  const cnt = {};
  t.getGrid().forEach(c => { cnt[c.sym] = (cnt[c.sym]||0)+1; });
  const allPair = Object.keys(cnt).every(k => cnt[k] === 2);
  ok('memory: ' + d + ' 档每种符号成对出现', allPair, JSON.stringify(cnt));
});

// ===== 难度钩子生效 =====
t.setDifficulty('normal');            // 恢复基线（前面已切换过难度）
ok('memory: 默认普通难度', t.getDifficulty() === 'normal', 'diff=' + t.getDifficulty());
ok('memory: DIFFICULTY 含四档', t.DIFFICULTY && t.DIFFICULTY.easy && t.DIFFICULTY.normal && t.DIFFICULTY.hard && t.DIFFICULTY.hell);
const setHell = t.setDifficulty('hell');
ok('memory: setDifficulty(hell) 返回 true', setHell === true);
ok('memory: 切换后难度为地狱', t.getDifficulty() === 'hell');
ok('memory: 地狱档 DIFFICULTY 配置存在', !!t.DIFFICULTY.hell && t.DIFFICULTY.hell.rows === 6);
// 越界难度被忽略
const keep = t.getDifficulty();
const bad = t.setDifficulty('xyz');
ok('memory: 非法难度 setDifficulty 返回 false', bad === false);
ok('memory: 非法难度被忽略', t.getDifficulty() === keep, 'diff=' + t.getDifficulty());
// reset 后难度保持
t.setDifficulty('easy'); t.reset(99);
ok('memory: reset 后难度保持为简单', t.getDifficulty() === 'easy');
// 切回普通
t.setDifficulty('normal');
ok('memory: 可切回普通', t.getDifficulty() === 'normal');

// ===== 步数宽限随难度递减（maxMovesMult）=====
const me = t.DIFFICULTY.easy.maxMovesMult, mn = t.DIFFICULTY.normal.maxMovesMult,
      mh = t.DIFFICULTY.hard.maxMovesMult, mx = t.DIFFICULTY.hell.maxMovesMult;
ok('memory: 步数宽限 简单>普通>困难>地狱',
   me > mn && mn > mh && mh > mx, `${me},${mn},${mh},${mx}`);
// 普通档 maxMoves 数值正确（8 对 × 2.5 = 20）
t.setDifficulty('normal'); t.reset(7);
ok('memory: 普通档 maxMoves=20', t.maxMoves() === 20, 'maxMoves=' + t.maxMoves());

// ===== 汇总 =====
const failed = H.results.filter(r => !r.pass).length;
console.log('\n----------------------------------------');
console.log(`memory-cards 单测：${H.results.length} 条 · ${H.results.length - failed} 通过` + (failed ? ` · ${failed} 失败` : ' · 全绿'));
console.log('----------------------------------------');
if (typeof process !== 'undefined' && process.exit) process.exit(failed ? 1 : 0);
