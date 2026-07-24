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
H.ok(p1.x === p0.x && p1.y === p0.y, 'sokoban: 撞墙不移动');

// 2) 推箱：玩家右推，箱子右移一格
lvl([
  '######',
  '#@$  #',
  '######'
]);
T.move('right');
var s = T.getState();
H.ok(s.player.x === 2 && s.boxes[0].x === 3, 'sokoban: 右推箱 玩家→2 箱→3 (p=' + s.player.x + ' b=' + s.boxes[0].x + ')');

// 3) 推箱顶墙：箱子紧邻墙，推不动
lvl([
  '#####',
  '#@$##',
  '#####'
]);
var before = T.getState();
T.move('right');
var after = T.getState();
H.ok(after.player.x === before.player.x && after.boxes[0].x === before.boxes[0].x, 'sokoban: 箱顶墙推不动');

// 4) 推箱入目标 → 胜利
lvl([
  '#####',
  '#@$.#',
  '#####'
]);
T.move('right');                // 把箱推到 (3,1) 目标
H.ok(T.isWon() === true, 'sokoban: 箱入目标即胜利');
H.ok(T.getState().boxes[0].on === true, 'sokoban: 箱标记 on=true');

// 5) 撤销：推一步后回退到初始
lvl([
  '######',
  '#@$  #',
  '######'
]);
T.move('right');
T.undo();
var u = T.getState();
H.ok(u.player.x === 1 && u.boxes[0].x === 2 && u.moves === 0, 'sokoban: 撤销恢复初始 (p=' + u.player.x + ' b=' + u.boxes[0].x + ' mv=' + u.moves + ')');

// 6) 重置：移动后 reset 回到初始且步数清零
lvl([
  '######',
  '#@$  #',
  '######'
]);
T.move('right'); T.move('right');
T.reset();
var r = T.getState();
H.ok(r.player.x === 1 && r.boxes[0].x === 2 && r.moves === 0 && r.won === false, 'sokoban: 重置归位清零');

// 7) 预设关卡可加载且非胜利态
T.loadLevel(0);
H.ok(T.getLevel() === 0 && T.countLevels() >= 3, 'sokoban: 加载预设关卡0，共 ' + T.countLevels() + ' 关');
H.ok(T.isWon() === false, 'sokoban: 预设关卡初始未胜利');

// 8) 通关触发完成特效标记
lvl([
  '#####',
  '#@$.#',
  '#####'
]);
H.ok(T.confettiFired === false, 'sokoban: 通关前未标记完成特效');
T.move('right');                // 把箱推到 (3,1) 目标
H.ok(T.confettiFired === true, 'sokoban: 通关后标记完成特效');

module.exports = {};
