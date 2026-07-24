const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../airchess.html');

function approx(a, b, eps){ return Math.abs(a - b) < (eps || 0.001); }

// 1. angleOf（i=0 在顶部 -π/2，顺时针）
ok('angleOf(0)≈-π/2', approx(t.angleOf(0), -Math.PI/2));
ok('angleOf(13)≈0', approx(t.angleOf(13), 0));
ok('angleOf(26)≈π/2', approx(t.angleOf(26), Math.PI/2));
ok('angleOf(39)≈π', approx(t.angleOf(39), Math.PI) || approx(t.angleOf(39), -Math.PI));
ok('angleOf(51)≈-π/2+51*2π/52', approx(t.angleOf(51), -Math.PI/2 + 51*(2*Math.PI/52)));

// 2. mainIndexOf（START=[0,13,26,39]，N=52）
eq('mainIndexOf(0,0)=0', t.mainIndexOf(0,0), 0);
eq('mainIndexOf(0,13)=13', t.mainIndexOf(0,13), 13);
eq('mainIndexOf(1,0)=13', t.mainIndexOf(1,0), 13);
eq('mainIndexOf(1,39)=0', t.mainIndexOf(1,39), 0);   // (13+39)%52=0
eq('mainIndexOf(2,0)=26', t.mainIndexOf(2,0), 26);
eq('mainIndexOf(3,0)=39', t.mainIndexOf(3,0), 39);
eq('mainIndexOf(0,52)=0', t.mainIndexOf(0,52), 0);   // 绕一圈
eq('mainIndexOf(0,-1)=51', t.mainIndexOf(0,-1), 51); // 负 prog 兜底

// 3. cellPos / planeXY / basePos / homePos 返回 [x,y] 在 canvas 范围
const cp = t.cellPos(0);
ok('cellPos(0) 是 [x,y]', Array.isArray(cp) && cp.length === 2);
ok('cellPos(0) x 在 canvas 内', cp[0] >= 0 && cp[0] <= 560);
ok('cellPos(0) y 在 canvas 内', cp[1] >= 0 && cp[1] <= 560);

const bp = t.basePos(0, -1);
ok('basePos(0,-1) 是 [x,y]', Array.isArray(bp) && bp.length === 2);
ok('basePos(0,-1) 在 canvas 内', bp[0] >= 0 && bp[0] <= 560 && bp[1] >= 0 && bp[1] <= 560);

const hp = t.homePos(0, 0);
ok('homePos(0,0) 是 [x,y]', Array.isArray(hp) && hp.length === 2);
ok('homePos(0,0) 在 canvas 内', hp[0] >= 0 && hp[0] <= 560 && hp[1] >= 0 && hp[1] <= 560);

// planeXY 根据 prog 分发
const pxy0 = t.planeXY(0, -1);  // base
ok('planeXY(0,-1) = basePos', pxy0[0] === t.basePos(0,-1)[0]);
const pxy1 = t.planeXY(0, 10);  // track
ok('planeXY(0,10) = cellPos(mainIndexOf(0,10))', pxy1[0] === t.cellPos(t.mainIndexOf(0,10))[0]);
const pxy2 = t.planeXY(0, 53);  // home (51..56)
ok('planeXY(0,53) = homePos(0,2)', pxy2[0] === t.homePos(0, 2)[0]);

// 4. 常量
eq('N=52', t.getN(), 52);
eq('WIN=56', t.getWIN(), 56);  // 50 + HOMELEN(6)
ok('START=[0,13,26,39]', JSON.stringify(t.getStart()) === '[0,13,26,39]');
ok('SAFE 含 8 个', t.getSafe().size === 8);
ok('ITEMCELL 含 4 个', t.getItemcell().size === 4);

// 5. newGame 重置
t.newGame();
const ps = t.getPlayers();
eq('newGame 4 玩家', ps.length, 4);
ok('newGame 每玩家 4 架', ps.every(p => p.planes.length === 4));
ok('newGame 全 base', ps.every(p => p.planes.every(pl => pl.state === 'base' && pl.prog === -1)));
ok('newGame done=0', ps.every(p => p.done === 0));
ok('newGame shield=false', ps.every(p => p.shield === false));
eq('newGame cur=0', t.getCur(), 0);
eq('newGame dice=0', t.getDice(), 0);
eq('newGame extra=0', t.getExtra(), 0);

// 6. movablePlanes（base 飞机只有 d=6 可起飞）
t.newGame();
eq('movable base d=6 全可动', t.movablePlanes(0, 6).length, 4);
eq('movable base d=5 全不可动', t.movablePlanes(0, 5).length, 0);
eq('movable base d=1 不可动', t.movablePlanes(0, 1).length, 0);

// 把 0 号玩家 0 号飞机设为 track prog=10
t.setProg(0, 0, 10);
const mv = t.movablePlanes(0, 5);
ok('movable track 飞机含 0', mv.includes(0));
eq('movable track 后 d=6 仍可动 4 架', t.movablePlanes(0, 6).length, 4);  // 3 base(d=6起飞) + 1 track

// 7. doMove base 起飞
t.newGame();
t.doMove(0, 0, 6);
const pl0 = t.getPlayers()[0].planes[0];
eq('doMove base→track state', pl0.state, 'track');
eq('doMove base→track prog', pl0.prog, 0);

// 8. doMove track 前进
t.setProg(0, 0, 10);
t.doMove(0, 0, 5);
eq('doMove track +5 prog', t.getPlayers()[0].planes[0].prog, 15);

// 9. planeProg / setProg
t.newGame();
eq('planeProg 初始 -1', t.planeProg(0, 0), -1);
t.setProg(0, 0, 25);
eq('setProg(0,0,25)', t.planeProg(0, 0), 25);
eq('setProg 后 state=track', t.getPlayers()[0].planes[0].state, 'track');
t.setProg(0, 0, 53);
eq('setProg 53 state=home', t.getPlayers()[0].planes[0].state, 'home');
t.setProg(0, 0, -1);
eq('setProg -1 state=base', t.getPlayers()[0].planes[0].state, 'base');

// 10. doMoveRaw（不触发道具/吃子）
t.newGame();
t.setProg(0, 0, 10);
t.doMoveRaw(0, 0, 3);
eq('doMoveRaw +3 prog', t.planeProg(0, 0), 13);

// 11. findRivalOnTrack
t.newGame();
eq('findRivalOnTrack 无对手 null', t.findRivalOnTrack(0), null);
t.setProg(1, 0, 10);  // 绿方 0 号飞机上 track
const rival = t.findRivalOnTrack(0);
ok('findRivalOnTrack 找到绿方', rival !== null && rival.c === 1 && rival.i === 0);

// 12. ITEMS 道具数组
ok('ITEMS 5 个', Array.isArray(t.ITEMS) && t.ITEMS.length === 5);
ok('ITEMS 都有 e 描述', t.ITEMS.every(it => typeof it.e === 'string' && it.e.length > 0));
ok('ITEMS 都有 fn 函数', t.ITEMS.every(it => typeof it.fn === 'function'));

// 13. 胜利彩带 / 完成反馈（confettiFired 标记）
{
  t.newGame();
  const ps = t.getPlayers();
  ps[0].done = 3; ps[0].planes[0].state='track'; ps[0].planes[0].prog = t.getWIN()-1; // 55→再走 1 到 56 终点
  t.setPlayers(ps);
  t.setDice(1);
  t.doMove(0, 0, 1); // 抵达终点 → done=4
  t.postMove(0);     // 触发胜利判定 + showOverlay（彩带）
  ok('玩家(红)4 架归港获胜', t.getPlayers()[0].done === 4);
  ok('玩家获胜触发 confettiFired', t.confettiFired() >= 1);
}

// 14. 难度系统（四档 AI 人机难度）
{
  ok('默认难度 normal', t.getDifficulty() === 'normal');
  eq('setDifficulty easy 返回 true', t.setDifficulty('easy'), true);
  eq('getDifficulty 反映 easy', t.getDifficulty(), 'easy');
  eq('setDifficulty hell 返回 true', t.setDifficulty('hell'), true);
  eq('getDifficulty 反映 hell', t.getDifficulty(), 'hell');
  eq('setDifficulty 非法返回 false', t.setDifficulty('xx'), false);
  ok('DIFFICULTY 含 4 档', Object.keys(t.DIFFICULTY).length === 4);
  ok('地狱档 aiRandom=0', t.DIFFICULTY.hell.aiRandom === 0);
  ok('简单档随机率 > 地狱档', t.DIFFICULTY.easy.aiRandom > t.DIFFICULTY.hell.aiRandom);

  // easy 随机分支（setRand 确定性）：aiRandom=0.55，_rand()=0.5<0.55 → 走随机合法步
  t.newGame(); t.setDifficulty('easy'); t.setRand(()=>0.5); t.setCur(1);
  t.aiPickAndMove(1, 6, t.movablePlanes(1,6));
  const easyMoved = t.getPlayers()[1].planes.findIndex(p=>p.state!=='base');
  eq('easy 随机分支落到非首架(plane 2)', easyMoved, 2);

  // hard 最优分支（无随机）：走启发式最优（首架 base）
  t.newGame(); t.setDifficulty('hard'); t.setRand(()=>0.5); t.setCur(1);
  t.aiPickAndMove(1, 6, t.movablePlanes(1,6));
  const hardMoved = t.getPlayers()[1].planes.findIndex(p=>p.state!=='base');
  eq('hard 最优分支落到首架(plane 0)', hardMoved, 0);

  ok('easy 与 hard AI 行为可区分', easyMoved !== hardMoved);
  t.setRand(Math.random);
}

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nairchess: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
