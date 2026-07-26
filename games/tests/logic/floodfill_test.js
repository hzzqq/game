const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../floodfill.html');

// 4x4 手摆棋盘：左上角 0 区域连通，验证漫染扩散与通关判定
const board = [
  [0,0,1,1],
  [0,1,1,2],
  [0,1,2,2],
  [3,3,2,2],
];
t.setBoard(board);

eq('初始漫染区为左上 0 的连通块(4格)', t.getFlooded(), 4);

ok('选色1可漫染', t.step(1) === true);
eq('step1 后漫染区扩到 9 格', t.getFlooded(), 9);
eq('step1 后步数=1', t.getMoves(), 1);
ok('step1 尚未通关', t.isSolved() === false);

t.step(2);
eq('step2 后漫染区扩到 14 格', t.getFlooded(), 14);
eq('step2 后步数=2', t.getMoves(), 2);

t.step(3);
eq('step3 后满盘同色(16格)', t.getFlooded(), 16);
eq('step3 后步数=3', t.getMoves(), 3);
ok('step3 后已通关', t.isSolved() === true);

// ---------- 通关特效：满盘同色触发 celebrate（Juice 桩无 confetti → 不崩） ----------
ok('step3 通关触发 celebrate', t.wasCelebrated() === true);
let threw = false;
try { t.triggerWinEffect(); } catch (e) { threw = true; }
ok('triggerWinEffect 不抛错', threw === false);

// ---------- 胜利/里程碑 confetti：满盘同色标记一次庆祝 ----------
t.setBoard(board);
ok('floodfill: 重摆初始未触发庆祝特效', t.confettiFired === false);
t.step(1); t.step(2); t.step(3);
ok('floodfill: 满盘同色触发庆祝特效', t.confettiFired === true);
t.setBoard(board);
ok('floodfill: 重摆后庆祝特效标记恢复 false', t.confettiFired === false);

// ============ 手感反馈计数钩子：_fxShakes / _fxBursts ============
t.setBoard(board); // 重摆=重置计数
eq('floodfill: 初始 fxBursts=0', t.fxBursts(), 0);
eq('floodfill: 初始 fxShakes=0', t.fxShakes(), 0);
ok('floodfill: 一次填充触发 burst', t.step(1) === true && t.fxBursts() > 0);
t.setBoard(board);
eq('floodfill: 重摆后 fxBursts 归零', t.fxBursts(), 0);
