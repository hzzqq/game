const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../samegame.html');

// 3x3：上两行全 0、底行全 1
t.setBoard([
  [0,0,0],
  [0,0,0],
  [1,1,1],
]);
ok('左上 6 连块可消除', t.canRemove(0,0) === true);
eq('消除 6 连块得分 (6-2)^2=16', t.remove(0,0), 6);
eq('当前得分=16', t.getScore(), 16);
ok('底行同色尚存，未结束', t.isOver() === false);

eq('消除底行 3 连块', t.remove(2,0), 3);
eq('累计得分=17', t.getScore(), 17);
ok('全盘清空，游戏结束', t.isOver() === true);
ok('isSolved 反映结束态', t.isSolved() === true);

// 单格不可消除
t.setBoard([
  [0,1],
  [2,3],
]);
ok('孤立单格不可消除', t.canRemove(0,0) === false);
