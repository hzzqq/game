const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../invaders.html');

// ---------- 常量 ----------
eq('W=480', t.W, 480);
eq('H=600', t.H, 600);
eq('COLS=8', t.COLS, 8);
eq('ROWS=4', t.ROWS, 4);
eq('PLAYER_Y=556', t.PLAYER_Y, 556);
eq('START_SPEED=10', t.START_SPEED, 10);

// ---------- shoot 生成子弹 + 冷却 ----------
{
  t.reset();
  ok('shoot 成功', t.shoot()===true);
  eq('子弹数 1', t.getBullets().length, 1);
  ok('冷却中再 shoot 失败', t.shoot()===false);
}

// ---------- 子弹击中 alien ----------
{
  t.reset(); t.setScore(0);
  const a = t.getAliens()[0]; // col0 row0
  const ax=t.alienX(a), ay=t.alienY(a);
  // 子弹置于 alien 内偏下，update 上移后仍重叠
  t.getBullets().push({x:ax+t.AW/2, y:ay+t.AH-2, vy:t.BULLET_VY});
  t.update();
  eq('命中后 score=10', t.getScore(), 10);
  ok('命中 alien 变死', t.getAliens()[0].alive===false);
  eq('命中后子弹移除', t.getBullets().length, 0);
}

// ---------- moveAliens：dir=1 时 ox 增加 ----------
{
  t.reset();
  const ox0=t.getOx();
  t.moveAliens();
  ok('dir=1 时 ox 增加', t.getOx() > ox0);
}
// ---------- moveAliens：碰边反转 dir + 下移 ----------
{
  t.reset();
  let reversed=false;
  for(let i=0;i<12;i++){ const d=t.getDir(); t.moveAliens(); if(t.getDir()!==d){ reversed=true; break; } }
  ok('多次移动后编队碰边反转 dir', reversed===true);
  ok('碰边后 oy 增加(下移)', t.getOy() > 0);
}

// ---------- 外星人抵达底线 → over ----------
{
  t.reset();
  t.setOy(400); // 最底行 alienY ≈ 196+400=596 超 PLAYER_Y 556
  t.update();
  ok('外星人抵达底线 over', t.getOver()===true);
}

// ---------- 全清 → 下一波 ----------
{
  t.reset(); t.setScore(0);
  t.getAliens().forEach(a=>a.alive=false);
  t.update();
  eq('全清后 wave=2', t.getWave(), 2);
  eq('全清后 aliens 重建', t.aliveCount(), t.ROWS*t.COLS);
}

// ---------- movePlayer 边界钳制 ----------
{
  t.reset();
  t.movePlayer(-100);
  eq('左边界钳制', t.getPlayer().x, t.PLAYER_W/2);
  t.movePlayer(1000);
  eq('右边界钳制', t.getPlayer().x, t.W - t.PLAYER_W/2);
}

// ---------- over 后 update 不动 ----------
{
  t.reset();
  t.setOy(400); t.update(); // over
  const ox=t.getOx(), oy=t.getOy();
  t.update(); // over 后 return
  eq('over 后 ox 不变', t.getOx(), ox);
  eq('over 后 oy 不变', t.getOy(), oy);
}

// ---------- 掉落系统 ----------
{
  // gem 加分
  t.reset(); t.setScore(0);
  t.spawnPickup('gem', t.getPlayer().x, t.PLAYER_Y-2);
  t.update();
  eq('拾取gem分数+25', t.getScore(), 25);
  eq('gem拾取后移除', t.getPickups().length, 0);
}
{
  // rocket 强化（子弹穿透）
  t.reset(); t.setScore(0);
  t.spawnPickup('rocket', t.getPlayer().x, t.PLAYER_Y-2);
  t.update();
  ok('拾取rocket获得强化', t.getBoost()===true);
  eq('rocket弹量=5', t.getRockets(), 5);
  eq('rocket拾取后移除', t.getPickups().length, 0);
}
{
  // 护盾免死：触底时消耗护盾而非 game over
  t.reset(); t.setOy(400); t.setShield(true);
  t.update();
  ok('持盾触底仍进行(未over)', t.getOver()===false);
  ok('护盾已消耗', t.getShield()===false);
}
{
  // 无盾触底即 over（扣血至 0 结束）
  t.reset(); t.setOy(400);
  t.update();
  ok('无盾触底 over', t.getOver()===true);
}

console.log('invaders: 全部断言通过');
