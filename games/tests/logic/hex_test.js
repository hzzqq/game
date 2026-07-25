const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../hex.html');

// 红方沿第 0 列连通上下 → 胜
const red = [
  ['r',null,null],
  ['r',null,null],
  ['r',null,null],
];
t.setBoard(red, 'r', 3);
ok('红连通上下', t.isWin('r'));
ok('绿未连通', !t.isWin('g'));

// 空盘无胜
t.setBoard([
  [null,null,null],
  [null,null,null],
  [null,null,null],
], 'r', 3);
ok('空盘无胜', !t.isWin('r') && !t.isWin('g'));

// 落子 + 胜负判定（红先落一子）
t.newGame(3);
ok('红落(0,0)', t.play(0,0,'r'));
eq('(0,0)为红', t.getBoard()[0][0], 'r');
eq('轮到绿', t.getTurn(), 'g');

// 绿连通左右（col0 → 底行 → col2）
t.newGame(3);
ok('绿落(0,0)', t.play(0,0,'g'));
ok('绿落(1,0)', t.play(1,0,'g'));
ok('绿落(2,0)', t.play(2,0,'g'));
ok('绿落(2,1)', t.play(2,1,'g'));
ok('绿落(2,2)', t.play(2,2,'g'));
ok('绿连通左右', t.isWin('g'));
ok('已结束', t.isOver());
eq('绿胜', t.getWinner(), 'g');

// 占位拒绝
t.newGame(3);
t.play(1,1,'r');
ok('已占格被拒', !t.play(1,1,'g'));

// ---------- 难度系统 ----------
{
  eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty()==hell', t.getDifficulty(), 'hell');
  eq('setDifficulty(bad) 返回 false', t.setDifficulty('bad'), false);
}

// ---------- 胜利 confetti ----------
t.newGame(3);
t.setBoard([
  ['r',null,null],
  ['r',null,null],
  [null,null,null],
], 'r', 3);
ok('胜利前 confettiFired 为 false', t.confettiFired() === false);
t.play(2,0,'r');
ok('游戏结束胜利 → confettiFired 为真', t.confettiFired() === true);

// ===== 手感深化：Juice 反馈钩子（纯注入，不改动玩法）=====
{
  // 初始计数应为 0
  t.newGame(3);
  eq('fx: 初始 fxShakes=0', t.fxShakes(), 0);
  eq('fx: 初始 fxBursts=0', t.fxBursts(), 0);

  // 占位（非法落子）→ 触发 shake
  t.newGame(3);
  t.play(1,1,'r');
  t.play(1,1,'g'); // 同一格已占，应被拒并触发 shake
  ok('fx: 占位触发 shake (fxShakes>0)', t.fxShakes() > 0);
  eq('fx: 占位未触发 burst', t.fxBursts(), 0);

  // 胜利 → 触发 burst（确定性坐标，不消耗随机数）
  t.newGame(3);
  t.setBoard([
    ['r',null,null],
    ['r',null,null],
    [null,null,null],
  ], 'r', 3);
  t.play(2,0,'r'); // 连通上下 → 胜利
  ok('fx: 胜利触发 burst (fxBursts>0)', t.fxBursts() > 0);

  // newGame 后计数归零
  t.newGame(3);
  eq('fx: newGame 后归零', t.fxShakes(), 0);
  eq('fx: newGame 后归零2', t.fxBursts(), 0);
}

const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nhex: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
