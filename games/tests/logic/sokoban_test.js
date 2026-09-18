// 推箱子逻辑单测：撞墙阻挡 / 推箱 / 推箱顶墙阻挡 / 胜利 / 撤销 / 重置
const H = require('./harness');
const { t: T } = H.loadGame('../sokoban.html');

// 用自定义关卡驱动确定性断言
function lvl(rows) { T.setLevel(rows); }

// 1) 撞墙不移动
lvl([
  '#####',
  '#@  #',
  '#####'
]);
var p0 = T.getState().player;
T.move('left');                 // 左边是墙
var p1 = T.getState().player;
H.ok('sokoban: 撞墙不移动', p1.x === p0.x && p1.y === p0.y);

// 2) 推箱：玩家右推，箱子右移一格
lvl([
  '######',
  '#@$  #',
  '######'
]);
T.move('right');
var s = T.getState();
H.ok('sokoban: 右推箱 玩家→2 箱→3 (p=' + s.player.x + ' b=' + s.boxes[0].x + ')', s.player.x === 2 && s.boxes[0].x === 3);

// 3) 推箱顶墙：箱子紧邻墙，推不动
lvl([
  '#####',
  '#@$##',
  '#####'
]);
var before = T.getState();
T.move('right');
var after = T.getState();
H.ok('sokoban: 箱顶墙推不动', after.player.x === before.player.x && after.boxes[0].x === before.boxes[0].x);

// 4) 推箱入目标 → 胜利
lvl([
  '#####',
  '#@$.#',
  '#####'
]);
T.move('right');                // 把箱推到 (3,1) 目标
H.ok('sokoban: 箱入目标即胜利', T.isWon() === true);
H.ok('sokoban: 箱标记 on=true', T.getState().boxes[0].on === true);

// 5) 撤销：推一步后回退到初始
lvl([
  '######',
  '#@$  #',
  '######'
]);
T.move('right');
T.undo();
var u = T.getState();
H.ok('sokoban: 撤销恢复初始 (p=' + u.player.x + ' b=' + u.boxes[0].x + ' mv=' + u.moves + ')', u.player.x === 1 && u.boxes[0].x === 2 && u.moves === 0);

// 6) 重置：移动后 reset 回到当前关卡初始且步数清零（reset 语义=重载 LEVELS[levelIdx]，自定义 lvl() 盘面不在表内会被替换）
T.loadLevel(0);
var s0 = T.getState();
T.move('up');                   // 预设关0：玩家(4,2)上方为空地，安全移动一步
T.reset();
var r = T.getState();
H.ok('sokoban: 重置归位清零 (p=' + r.player.x + ',' + r.player.y + ' mv=' + r.moves + ')', r.player.x === s0.player.x && r.player.y === s0.player.y && r.boxes[0].x === s0.boxes[0].x && r.boxes[0].y === s0.boxes[0].y && r.moves === 0 && r.won === false);

// 7) 预设关卡可加载且非胜利态
T.loadLevel(0);
H.ok('sokoban: 加载预设关卡0，共 ' + T.countLevels() + ' 关', T.getLevel() === 0 && T.countLevels() >= 3);
H.ok('sokoban: 预设关卡初始未胜利', T.isWon() === false);

// 8) 通关触发完成特效标记
lvl([
  '#####',
  '#@$.#',
  '#####'
]);
H.ok('sokoban: 通关前未标记完成特效', T.confettiFired === false);
T.move('right');                // 把箱推到 (3,1) 目标
H.ok('sokoban: 通关后标记完成特效', T.confettiFired === true);

module.exports = {};
