const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../backgammon.html');

// 1) 初始局：双方各 15 子、轮到红、无胜者
t.reset();
eq('初始红方总数', t.countAll('red'), 15);
eq('初始白方总数', t.countAll('white'), 15);
eq('初始轮次', t.turn, 'red');
eq('初始无胜者', t.winner, null);

// 2) 掷骰确定性（setRand 注入）
let seq = [0.4, 0.0]; let si = 0;
t.setRand(() => seq[si++ % seq.length]);
const d = t.rollDice();
eq('掷骰点数1', d[0], 3);
eq('掷骰点数2', d[1], 1);

// 3) 普通移动：从点24(idx23)走3步到点21(idx20)
t.reset();
seq = [0.4, 0.0]; si = 0; t.setRand(() => seq[si++ % seq.length]);
t.rollDice();
const before = t.points[23].r;
ok(t.move(23, 3), '点24走3步合法');
eq('点24剩余', t.points[23].r, before - 1);
eq('点21落子', t.points[20].r, 1);
ok(!t.turnDice.includes(3), '骰子3已被消耗');

// 4) 击落规则：红子(idx13)走3步落白方单子(idx10)→白子进中线
t.reset(); t.debugClear();
t.debugSet(13, 1, 0);   // 红 1 子在 idx13(点14)
t.debugSet(10, 0, 1);   // 白 1 子(blot)在 idx10(点11)
seq = [0.4, 0.0]; si = 0; t.setRand(() => seq[si++ % seq.length]);
t.rollDice();           // 期望 [3,1]
ok(t.move(13, 3), '红走3步落白blot合法');
eq('目标点红子', t.points[10].r, 1);
eq('目标点白子清空', t.points[10].w, 0);
eq('白方中线+1', t.bar.w, 1);

// 5) 移出(bear off)：全部在红方内盘 + 掷出对应点数
t.reset(); t.debugClear();
// 15 枚红全部放入内盘(idx0..5)，bar 清空
t.debugSet(0, 3, 0); t.debugSet(1, 3, 0); t.debugSet(2, 3, 0);
t.debugSet(3, 3, 0); t.debugSet(4, 2, 0); t.debugSet(5, 1, 0);
t.debugBar('red', 0);
ok(t.allHome('red'), '全部在内盘可移出');
seq = [0.9, 0.0]; si = 0; t.setRand(() => seq[si++ % seq.length]);
t.rollDice();           // 期望 [6,1]
eq('掷出6', t.dice[0], 6);
ok(t.bearOff(5, 6), '点6(die=6)精确移出合法');
eq('红方移出+1', t.off.r, 1);

// 6) 胜利判定：14 枚已移出 + 第15枚移出 → 红胜
t.reset(); t.debugClear();
t.debugOff('red', 14);
t.debugSet(5, 1, 0);    // 最后一枚在 idx5(点6)
t.debugBar('red', 0);
seq = [0.9, 0.0]; si = 0; t.setRand(() => seq[si++ % seq.length]);
t.rollDice();
ok(t.bearOff(5, 6), '最后一枚移出');
eq('红方全移出', t.off.r, 15);
eq('红方获胜', t.winner, 'red');

// 7) 合法步枚举返回数组
t.reset();
seq = [0.4, 0.0]; si = 0; t.setRand(() => seq[si++ % seq.length]);
t.rollDice();
ok(Array.isArray(t.legalMoves()) && t.legalMoves().length > 0, '能枚举合法步');

console.log('✓ backgammon_test 完成 · 共 21 条断言');

// ---------- 难度系统 ----------
{
  eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty 返回 hell', t.getDifficulty(), 'hell');
  eq('setDifficulty(非法) 返回 false', t.setDifficulty('x'), false);
}
