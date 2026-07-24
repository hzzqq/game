const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../plumber.html');
const { U,R,D,L } = t;

// 用确定布局测试旋转确实改变掩码（避免随机布局恰为空格/十字等旋转不变管道导致伪失败）
const N = t.N;
const b1 = Array.from({length:N},()=>new Array(N).fill(0));
b1[2][2] = U|R; // L 型管道，旋转必变
t.setBoard(b1);
const before = t.getMask(2,2);
t.rotate(2,2);
ok('旋转改变掩码', t.getMask(2,2) !== before);

// 已解 L 型：isSolved 为真
const solved = [
  [L|R, L|R, L|R, L|R, L|R, L|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|R],
];
t.setBoard(solved);
ok('L 型解已连通', t.isSolved());

// 打乱 (0,0) 旋转一次 → 不再连通
const broken = solved.map(r=>r.slice());
broken[0][0] = t.rotMask(broken[0][0]);
t.setBoard(broken);
ok('打乱后未连通', !t.isSolved());

// 旋转 4 次回到原样
let m = solved[0][0];
const m0 = m;
for(let i=0;i<4;i++) m = t.rotMask(m);
eq('旋转4次复原', m, m0);

// ===== 注入：掉落道具 / 增益（确定性驱动，不依赖随机自动掉落）=====
t.reset();
eq('初始无掉落', t.getPickups().length, 0);
eq('初始金币0', t.getCoins(), 0);
t.spawnPickup('coin',2,2);
eq('spawnPickup 生成掉落', t.getPickups().length, 1);
t.applyPickup('coin');
eq('拾取金币后 coins=25', t.getCoins(), 25);

// 未碰撞不生效
t.reset();
t.spawnPickup('shield',1,1);
eq('生成护盾掉落但 coins 不变', t.getCoins(), 0);
ok('护盾未拾取前为 false', t.getShield()===false);
eq('掉落尚未被移除', t.getPickups().length, 1);

// 拾取后移除 + 生效
t.collectAt(1,1);
eq('collectAt 后掉落移除', t.getPickups().length, 0);
ok('护盾拾取生效', t.getShield()===true);

// 护盾免扣血、无盾扣血
t.applyPickup('coin');
const beforeCoins=t.getCoins();
t.takeHit();
eq('有护盾 takeHit 不扣血', t.getCoins(), beforeCoins);
ok('护盾被消耗', t.getShield()===false);
t.takeHit();
eq('无护盾 takeHit 扣血10', t.getCoins(), beforeCoins-10);

// 加速倍率 + 计时衰减
t.reset();
t.applyPickup('boost');
ok('boost 计时>0', t.getBoost()>0);
t.applyPickup('coin');
eq('boost 期间金币翻倍=50', t.getCoins(), 50);
t.stepPickups(8);
eq('boost 计时归零', t.getBoost(), 0);

// 计时器随机掉落（update 驱动场景掉落）
t.reset();
eq('update 前无掉落', t.getPickups().length, 0);
eq('初始掉落计时为0', t.getSpawnTimer(), 0);
t.update(t.SPAWN_INTERVAL + 0.1);   // 跨过掉落间隔
eq('update 触发随机掉落(数量+1)', t.getPickups().length, 1);
const p0 = t.getPickups()[0];
ok('随机掉落类型合法', ['coin','boost','shield'].indexOf(p0.type) >= 0, 'type=' + p0.type);
ok('随机掉落落在网格内', p0.r>=0 && p0.r<t.N && p0.c>=0 && p0.c<t.N);

// update 同时衰减 boost，且无 boost 时不误扣
t.reset();
t.applyPickup('boost');
ok('boost 计时>0', t.getBoost() > 0);
t.update(8);
eq('update 后 boost 归零', t.getBoost(), 0);

// 护盾 HUD 状态可见
t.reset();
t.applyPickup('shield');
ok('护盾已激活', t.getShield() === true);

// ===== 轮5：完成彩带特效（解出触发，只读标记）=====
const solvedBoard = [
  [L|R, L|R, L|R, L|R, L|R, L|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|D],
  [0,   0,   0,   0,   0,   U|R],
];
t.setBoard(solvedBoard);
const pf0 = t.confettiFired;
t.render();
eq('接水管解出触发彩带', t.confettiFired, pf0+1);
t.render();
eq('已解出不重复触发', t.confettiFired, pf0+1);

