const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../maze.html');

// 数据约定：cell 字段 true = 有墙(阻挡)，false = 无墙(可通行)
// 1x1：起点即终点
t.setMaze([[{ N:true, E:true, S:true, W:true }]]);
ok('1x1 迷宫可解(起点=终点)', t.isSolved() === true);
eq('1x1 路径长度为 1', (t.getPath()||[]).length, 1);

// 1x2 且两格之间墙封闭：无解
t.setMaze([
  [{ E:true,  W:true, N:true, S:true }],
  [{ E:true,  W:true, N:true, S:true }],
]);
ok('被墙隔断的迷宫无解', t.isSolved() === false);
eq('无解时路径为 null', t.getPath(), null);

// 2x2 全开：存在通路
t.setMaze([
  [{ N:true, E:false, S:false, W:true }, { N:true, E:true, S:false, W:false }],
  [{ N:false, E:false, S:true, W:true }, { N:false, E:true, S:true, W:false }],
]);
ok('开放 2x2 迷宫可解', t.isSolved() === true);
const p = t.getPath();
ok('可找到终点路径', Array.isArray(p) && p.length === 3);
eq('路径终点为右下角', p[p.length-1], [1,1]);
