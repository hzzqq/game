const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../jungle.html');

// 吃子：红狮(7) 在 (5,3) 吃蓝狼(4) 在 (4,3)（均为非水格）
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,{side:'w',rank:4},null,null,null],
  [null,null,null,{side:'b',rank:7},null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'b');
ok('红狮吃蓝狼', t.move(5,3,4,3));
eq('狮到(4,3)', t.getPiece(4,3).side, 'b');
eq('(5,3)已空', t.getPiece(5,3), null);

// 进敌穴胜：红方踏入蓝穴(0,3)
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,{side:'b',rank:7},null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'b');
ok('踏入蓝穴获胜', t.move(1,3,0,3));
ok('已结束', t.isOver());
eq('红方胜', t.getWinner(), 'b');

// 鼠克象：红鼠(1) 在 (7,2) 吃蓝象(8) 在 (7,1)
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,{side:'w',rank:8},{side:'b',rank:1},null,null,null,null],
  [null,null,null,null,null,null,null],
], 'b');
ok('鼠克象', t.move(7,2,7,1));
eq('象被吃', t.getPiece(7,1).side, 'b');

// 象不吃鼠：蓝象(8) 在 (2,3) 不能吃红鼠(1) 在 (2,2)
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,{side:'b',rank:1},{side:'w',rank:8},null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'w');
ok('象不吃鼠', !t.move(2,3,2,2));

// 回归：鼠蹲在敌方陷阱上 effRank 降为 0，象应能吃（曾因「象不吃鼠」在 effRank 前短路而无法吃）
t.newGame();
t.setBoard([
  [null,{side:'w',rank:8},{side:'b',rank:1},null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'w');
ok('象吃敌方陷阱上的鼠', t.move(0,1,0,2));
eq('鼠被吃，象落到(0,2)', t.getPiece(0,2).side, 'w');

// ============ 注入：掉落道具 / 增益系统 ============
// 1) 金币：score +5
t.newGame();
const j0 = t.getScore();
t.applyPickup('coin');
ok('斗兽棋: 金币 score+5', t.getScore() === j0 + 5);

// 2) 护盾：+1
t.newGame();
t.applyPickup('shield');
ok('斗兽棋: 护盾 +1', t.getShield() === 1);

// 3) 加速：boostTimer>0
t.newGame();
t.applyPickup('boost');
ok('斗兽棋: 加速 boostTimer>0', t.getBoost() > 0);

// 4) 回血：lives +1
t.newGame();
t.setLives(3);
t.applyPickup('heart');
ok('斗兽棋: 回血 lives+1', t.getLives() === 4);

// 5) 集成：红方走到掉落物格 → 拾取生效并移除
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,{side:'b',rank:2},null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'b');
t.spawnPickup('coin',4,3);
const before = t.getPickups();
const s1 = t.getScore();
t.move(5,3,4,3);
ok('斗兽棋: 走到掉落物格即拾取移除', t.getPickups() === before - 1, '剩 '+t.getPickups());
ok('斗兽棋: 拾取金币 score+5', t.getScore() === s1 + 5);

// 6) 未碰撞不生效
t.newGame();
t.setBoard([
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,{side:'b',rank:2},null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null],
], 'b');
t.spawnPickup('coin',0,0);
const s2 = t.getScore();
t.stepPickups(0);
ok('斗兽棋: 无棋子踩中掉落物不拾取', t.getPickups() === 1);
ok('斗兽棋: 未拾取 score 不变', t.getScore() === s2);

// 7) 护盾免死：有护盾受击不扣血、护盾被消耗
t.newGame();
t.setShield(1);
const lives0 = t.getLives();
t.takeHit();
ok('斗兽棋: 有护盾受击不扣血', t.getLives() === lives0);
ok('斗兽棋: 护盾被消耗', t.getShield() === 0);

// 8) 无护盾受击：扣血
t.newGame();
const lives1 = t.getLives();
t.takeHit();
ok('斗兽棋: 无护盾受击扣血', t.getLives() === lives1 - 1);

// ============ 胜利 confetti ============
{
  t.newGame();
  t.setBoard([
    [null,null,null,null,null,null,null],
    [null,null,null,{side:'b',rank:7},null,null,null],
    [null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null],
  ], 'b');
  ok('红方踏入蓝穴获胜', t.move(1,3,0,3));
  ok('已结束', t.isOver());
  eq('红方胜', t.getWinner(), 'b');
  eq('胜利 confetti 触发', t.confettiFired(), true);
}

// ============ 难度系统（四档 AI 人机） ============
{
  eq('有 4 个难度档', Object.keys(t.DIFFICULTY).length, 4);
  ok('含地狱档', !!t.DIFFICULTY.hell);
  eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty 返回 hell', t.getDifficulty(), 'hell');
  eq('setDifficulty(非法) 返回 false', t.setDifficulty('x'), false);
  eq('非法档不改变难度', t.getDifficulty(), 'hell');

  // 切换难度不崩、蓝方 AI 走合法着法
  t.setDifficulty('easy'); t.setRand(()=>0.0);
  t.newGame();
  t.setBoard(t.getBoard(), 'w'); // 轮到蓝方(AI)
  const mv = t.aiTurn();
  ok('蓝方 AI 返回合法着法', !!mv && mv.fr!=null && mv.tr!=null);
  t.setRand(Math.random); t.setDifficulty('normal');
}

// ============ AI 随机路径确定性（setRand 注入） ============
{
  t.setDifficulty('easy'); t.setRand(()=>0.0);
  t.newGame();
  t.setBoard(t.getBoard(), 'w');
  const mv = t.aiTurn();
  ok('easy+随机流 返回合法着法', !!mv);
  t.setRand(Math.random); t.setDifficulty('normal');
}
