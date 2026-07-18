// 泡泡堂 逻辑测试（node，无浏览器）
// 加载 bubblebob.html 内联脚本，stub document/window/canvas，通过 window.__bb 驱动模拟。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'bubblebob.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if(!m){ console.error('找不到 <script>'); process.exit(1); }
const code = m[1];

const sandbox = {
  window: {},
  console,
  Math,                 // 共享外层 Math，便于测试中覆盖 random
  requestAnimationFrame: () => 0,
  navigator: { maxTouchPoints: 0 },
  setTimeout: () => 0,
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const bb = sandbox.window.__bb;
if(!bb){ console.error('window.__bb 未暴露'); process.exit(1); }

let pass = 0, fail = 0;
function check(name, cond, extra){
  if(cond){ pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra? '  -> ' + extra : '')); }
}
// 驱动若干帧
function drive(steps, dt){
  dt = dt || 0.05;
  for(let i=0;i<steps;i++) bb.update(dt);
}
// 让某玩家对齐到整数格（清空移动插值）
function align(p){
  p.progress = 0; p.dir = null;
  p.px = p.gx*bb.TILE + bb.TILE/2;
  p.py = p.gy*bb.TILE + bb.TILE/2;
}

console.log('\n=== 泡泡堂逻辑测试 ===\n');

// ---------- 1. 启动与地图 ----------
console.log('[1] 启动 / 地图');
bb.startGame('1v1');
check('状态为 playing', bb.state === 'playing', bb.state);
check('玩家数=2', bb.players.length === 2, bb.players.length);
check('网格尺寸 15x13', bb.grid.length === bb.ROWS && bb.grid[0].length === bb.COLS);
// 四角内部柱子应为 SOLID
check('内部柱子(2,2)=SOLID', bb.grid[2][2] === bb.SOLID, bb.grid[2][2]);
// 出生点(1,1)应为空（玩家0位置）
check('出生点(1,1)=EMPTY', bb.grid[1][1] === bb.EMPTY, bb.grid[1][1]);

// 隔离 AI：把两个玩家都设为非AI，用按键精确控制
bb.players.forEach(p => { p.isAI = false; align(p); });
const P0 = () => bb.players.find(p => p.id === 0);
const P2 = () => bb.players.find(p => p.id === 2);

// ---------- 2. 放炸弹 ----------
console.log('\n[2] 放炸弹');
bb.setKey('Space', true);
const placed = bb.placeBomb(P0());
bb.setKey('Space', false);
check('放炸弹成功', placed === true);
check('bombs 数组长度=1', bb.bombs.length === 1, bb.bombs.length);
check('玩家 bombsActive=1', P0().bombsActive === 1, P0().bombsActive);
check('炸弹位于玩家脚下', bb.bombs[0].gx === 1 && bb.bombs[0].gy === 1);

// ---------- 3. 爆炸 + 摧毁软砖 + 击杀 + 胜负（控制 Math.random 触发道具） ----------
console.log('\n[3] 爆炸摧毁软砖 / 击杀 / 胜负判定');
// 清场：让玩家0脚下及周围可控
bb.gridSet(2,1, bb.SOFT);  // 玩家0东侧的软砖
bb.gridSet(1,2, bb.SOFT);  // 玩家0南侧的软砖（用于判定连锁/爆炸范围）
// 强制道具必定掉落（覆盖 sandbox 内的 Math.random）
const sMath = sandbox.Math;
const origRandom = sMath.random;
sMath.random = () => 0.1;   // < 0.32 触发；choice 取索引0 -> 'B'
bb.killBombsSoon();
drive(40, 0.05);           // 触发爆炸并走完停留
sMath.random = origRandom;
check('软砖(2,1)被摧毁为EMPTY', bb.grid[1][2] === bb.EMPTY, bb.grid[1][2]);
check('玩家0阵亡（踩在自己炸弹上）', P0().alive === false);
check('存活数=1', bb.aliveCount === 1, bb.aliveCount);
check('状态=roundover', bb.state === 'roundover', bb.state);
check('胜者=玩家2', bb.lastWinner && bb.lastWinner.id === 2, bb.lastWinner && bb.lastWinner.id);
check('玩家2得分+1', P2().score === 1, P2().score);
check('软砖处掉落道具B', bb.powerups.some(pu => pu.gx === 2 && pu.gy === 1 && pu.type === 'B'));

// ---------- 4. 爆炸不穿 SOLID 墙 ----------
console.log('\n[4] 爆炸遇硬墙停止');
bb.startGame('1v1');
bb.players.forEach(p => { p.isAI = false; align(p); });
const P0b = () => bb.players.find(p => p.id === 0);
// (2,2) 是内部柱子 SOLID，玩家0在(1,1)，放炸弹，range=2
// 东向：(2,1)若空则可达，但(2,2)是另一格不影响；这里验证炸弹不会炸到 SOLID
// 把(2,1)设为EMPTY，(3,1)设为SOLID 阻挡
bb.gridSet(2,1, bb.EMPTY);
bb.gridSet(3,1, bb.SOLID);
bb.gridSet(1,2, bb.EMPTY);
bb.placeBomb(P0b());
bb.killBombsSoon();
drive(40, 0.05);
// (3,1) 是 SOLID 应保持不变；同时(2,1)成为爆炸格但(3,1)未被炸为EMPTY（本来就是SOLID）
check('硬墙(3,1)仍为SOLID', bb.grid[1][3] === bb.SOLID, bb.grid[1][3]);

// ---------- 5. 连锁反应（两枚相邻炸弹） ----------
console.log('\n[5] 连锁反应');
bb.startGame('1v1');
bb.players.forEach(p => { p.isAI = false; align(p); });
const P0c = () => bb.players.find(p => p.id === 0);
P0c().bombsMax = 2;                 // 允许放两枚
// 清出 (1,1)->(2,1)->(3,1) 通道
bb.gridSet(2,1, bb.EMPTY);
bb.gridSet(3,1, bb.EMPTY);
bb.gridSet(1,2, bb.SOFT);          // 炸弹(1,1)南向会炸到(1,2)
bb.gridSet(2,2, bb.SOFT);          // 炸弹(2,1)南向会炸到(2,2)
// 放第一枚
bb.placeBomb(P0c());
// 移动到 (2,1)
bb.setKey('KeyD', true);
let guard = 0;
while(P0c().gx !== 2 && guard++ < 200){ bb.update(0.05); }
bb.setKey('KeyD', false);
align(P0c());
// 放第二枚（在(2,1)）
const placed2 = bb.placeBomb(P0c());
check('第二枚炸弹放置成功', placed2 === true, 'bombsMax=' + P0c().bombsMax);
check('场上炸弹数=2', bb.bombs.length === 2, bb.bombs.length);
bb.killBombsSoon();
drive(60, 0.05);
check('连锁后场上无炸弹', bb.bombs.length === 0, bb.bombs.length);
check('(1,2)软砖被炸（来自炸弹1连锁）', bb.grid[2][1] === bb.EMPTY, bb.grid[2][1]);
check('(2,2)软砖被炸（来自炸弹2）', bb.grid[2][2] === bb.EMPTY, bb.grid[2][2]);

// ---------- 6. AI 不崩溃且产出合法意图 ----------
console.log('\n[6] AI 行为');
bb.startGame('1v1');
// 保留 AI：玩家2 为 AI，玩家0 设为非AI 不干扰
bb.players.forEach(p => { if(p.id === 0) p.isAI = false; });
let aiOk = true;
for(let i=0;i<120;i++){
  bb.update(0.05);
  const ai = bb.players.find(p => p.id === 2);
  if(!ai) { aiOk = false; break; }
  const it = ai.intent;
  if(!it || typeof it.dx !== 'number' || typeof it.dy !== 'number' || typeof it.bomb !== 'boolean'){ aiOk = false; break; }
  // 单轴约束：dx/dy 不能同时非零（代码内已约束）
  if(it.dx !== 0 && it.dy !== 0){ aiOk = false; break; }
}
check('AI 120帧无异常且意图合法', aiOk);

// ---------- 7. 道具拾取增益 ----------
console.log('\n[7] 道具拾取');
bb.startGame('1v1');
bb.players.forEach(p => { p.isAI = false; align(p); });
const P0d = () => bb.players.find(p => p.id === 0);
// 在玩家0脚下放一个炸弹数道具，再移动踩上去
bb.powerups.push({ gx: 1, gy: 1, type: 'B' });
bb.powerups.push({ gx: 1, gy: 1, type: 'F' });
bb.powerups.push({ gx: 1, gy: 1, type: 'S' });
const b0 = P0d().bombsMax, r0 = P0d().range, s0 = P0d().speed;
align(P0d());
bb.update(0.05); // 拾取（玩家0在(1,1)中心）
check('拾取B后 bombsMax+1', P0d().bombsMax === b0 + 1, P0d().bombsMax);
check('拾取F后 range+1', P0d().range === r0 + 1, P0d().range);
check('拾取S后 speed增加', P0d().speed > s0, P0d().speed);
check('道具被移除', bb.powerups.length === 0, bb.powerups.length);

// ---------- 8. nextRound 保留分数 ----------
console.log('\n[8] nextRound 保留分数');
bb.startGame('1v1');
bb.players.forEach(p => { p.isAI = false; align(p); });
const P2e = () => bb.players.find(p => p.id === 2);
P2e().score = 5;
bb.nextRound();
check('回合号+1', bb.roundNo === 2, bb.roundNo);
check('分数被保留', bb.players.find(p => p.id === 2).score === 5, bb.players.find(p => p.id === 2).score);
check('nextRound 后状态 playing', bb.state === 'playing', bb.state);

console.log('\n=== 结果: ' + pass + ' 通过 / ' + fail + ' 失败 ===\n');
process.exit(fail === 0 ? 0 : 1);
