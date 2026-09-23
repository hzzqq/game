const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../morris.html');

// 布子连线胜
t.newGame();
ok('黑落(0,0)', t.place(0,0));
ok('白落(1,0)', t.place(1,0));
ok('黑落(0,1)', t.place(0,1));
ok('白落(1,1)', t.place(1,1));
ok('黑落(0,2)成横排', t.place(0,2));
ok('已结束', t.isOver());
eq('黑胜', t.getWinner(), 'b');

// 走子：clean 局面，黑(0,0) 下移一步到 (1,0)（空）
t.newGame();
t.setBoard([
  ['b',null,null],
  [null,null,null],
  [null,null,'w'],
], 'b', 'move');
eq('阶段=走子', t.getPhase(), 'move');
ok('黑横/竖走子', t.move(0,0,1,0));
eq('原位置空', t.getBoard()[0][0], null);
eq('新位置为黑', t.getBoard()[1][0], 'b');

// 非法走子（非相邻）被拒
t.newGame();
t.setBoard([
  ['b',null,null],
  [null,null,null],
  [null,null,'w'],
], 'b', 'move');
ok('非相邻走子被拒', !t.move(0,0,0,2));

// ---------- 难度系统 ----------
{
  eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty()==hell', t.getDifficulty(), 'hell');
  eq('setDifficulty(bad) 返回 false', t.setDifficulty('bad'), false);
}

// ---------- 胜利 confetti ----------
t.newGame();
ok('胜利前 confettiFired 为 false', t.confettiFired() === false);
t.place(0,0); t.place(1,0); t.place(0,1); t.place(1,1); t.place(0,2);
ok('游戏结束胜利 → confettiFired 为真', t.confettiFired() === true);

// ===== T-161 布子相位（mutation 缺口：placed>=NEED 满后切 move 且 place 拒此前无锁）=====
(() => {
  t.newGame();
  ok('morris 开局为布子相位', t.getPhase() === 'place');
  const NEED = t.NEED;
  let placedAll = true;
  for (let i = 0; i < NEED * 2; i++) {
    const b = t.getBoard();
    outer: {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        if (!b[r][c]) { if (!t.place(r, c)) { placedAll = false; break outer; } break outer; }
      }
    }
  }
  ok('morris 双方各放满 ' + NEED + ' 枚全部成功', placedAll);
  ok('morris 双方放满后切移动相位', t.getPhase() === 'move');
  ok('morris 移动相位 place 被拒', t.place(0, 0) === false || t.getBoard()[0][0] !== null);
})();

const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nmorris: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
