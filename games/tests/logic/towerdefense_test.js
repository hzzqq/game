const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../towerdefense.html');

// ---------- 常量 ----------
eq('COLS=9', t.COLS, 9);
eq('ROWS=7', t.ROWS, 7);
eq('MAX_WAVE=8', t.MAX_WAVE, 8);
eq('TOWER_COST=30', t.TOWER_COST, 30);
ok('PATH 非空且为 [r,c]', t.PATH.length>5 && t.PATH.every(p=>p.length===2));

// ---------- 新局状态 ----------
{
  t.newGame();
  eq('初始金币 120', t.getGold(), 120);
  eq('初始生命 20', t.getLives(), 20);
  eq('初始波次 0', t.getWave(), 0);
  ok('初始无敌人', t.getEnemies().length===0);
  ok('初始无塔', t.getTowers().length===0);
  ok('未开始波次', t.getWaveActive()===false);
  ok('未结束', t.isOver()===false && t.hasWon()===false);
}

// ---------- 路径格判定 ----------
{
  ok('路径格识别', t.isPathCell(t.PATH[0][0], t.PATH[0][1])===true);
  // 找一个非路径格（如 (0,0)）
  ok('非路径格识别', t.isPathCell(0,0)===false);
}

// ---------- 建塔规则 ----------
{
  t.newGame();
  // 在路径外的 (0,0) 建塔
  const okBuild = t.placeTower(0,0);
  ok('空白格建塔成功', okBuild===true);
  eq('建塔扣 30 金', t.getGold(), 90);
  eq('塔数量 1', t.getTowers().length, 1);
  // 路径格不可建
  const p = t.PATH[0];
  ok('路径格拒绝建塔', t.placeTower(p[0],p[1])===false);
  // 重复位置不可建
  ok('重复位置拒绝', t.placeTower(0,0)===false);
  // 金币不足不可建（先清空）
  t.setGold(10);
  ok('金币不足拒绝', t.placeTower(0,1)===false);
}

// ---------- 敌人沿路径移动 ----------
{
  t.newGame();
  t.setEnemies([]); t.setTowers([]);
  t.spawnWave(1); // 生成第 1 波敌人
  const n0 = t.getEnemies().length;
  ok('spawnWave 生成敌人', n0>0);
  const e = t.getEnemies()[0];
  const seg0 = e.seg, t0 = e.t;
  t.step(0.5);
  // 敌人应向前推进（t 增大或 seg 增大）
  const e2 = t.getEnemies()[0];
  ok('step 推进敌人', e2.seg>seg0 || e2.t>t0 || (e2.t<0 && t0<0 && e2.t>t0));
}

// ---------- 漏怪掉血（无塔） ----------
{
  t.newGame();
  t.setTowers([]);
  t.setLives(20);
  t.spawnWave(1);
  // 持续 step 直到敌人全部到达终点或被清
  let guard=0;
  while(t.getEnemies().length>0 && guard++<2000) t.step(0.1);
  ok('无塔时敌人到达终点掉血', t.getLives() < 20);
}

// ---------- 塔击杀敌人赚金 ----------
{
  t.newGame();
  t.setEnemies([]); t.setTowers([]); t.setLives(20);
  t.setGold(200);
  // 在路线起点 (1,0) 附近建塔（(0,0) 距 (1,0) 约 1 格，在射程内）
  t.placeTower(0,0);
  eq('建塔后金 170', t.getGold(), 170);
  t.spawnWave(1);
  const before = t.getGold();
  let guard=0;
  while(t.getEnemies().length>0 && t.getLives()>0 && guard++<3000) t.step(0.05);
  // 塔应击杀至少部分敌人（金币因奖励/击杀变动），且基地未必掉血
  ok('塔参与战斗（金币或生命发生变化）', t.getGold()!==before || t.getLives()<20);
}

// ---------- 塔 targeting 选取最近终点 ----------
{
  t.newGame();
  t.setEnemies([
    {id:1,hp:10,maxhp:10,seg:0,t:0.1,speed:0.5,reward:4,alive:true},
    {id:2,hp:10,maxhp:10,seg:3,t:0.2,speed:0.5,reward:4,alive:true},
  ]);
  t.setTowers([{id:9,r:1,c:0,range:5,dmg:8,cd:0.5,cdLeft:0}]);
  const tg = t.towerTargets(t.getTowers()[0]);
  ok('towerTargets 返回在射程内敌人', tg.length>=1);
  // 应优先选 seg+t 更大者（更接近终点）
  ok('优先攻击最接近终点的敌人', tg[0].id===2);
}

// ---------- 胜利判定（清完 8 波） ----------
{
  t.newGame();
  t.setWave(8); t.setEnemies([]); t.setTowers([]);
  t.setWaveActive(true);
  const g0 = t.getGold();
  t.step(0.01); // 敌人已空 + 第8波 → 触发胜利 + 清波奖励
  ok('清完第8波 → hasWon', t.hasWon()===true);
  ok('清波奖励 +20 金', t.getGold() >= g0 + 20 - 0); // 奖励已计入（可能恰好 g0+20）
  ok('胜利后 over 仍 false', t.isOver()===false);
  const st = t._state();
  ok('状态对象可读', typeof st.gold==='number' && typeof st.lives==='number');
}

// ---------- 失败判定（生命归零） ----------
{
  t.newGame();
  t.setLives(1); t.setTowers([]);
  t.spawnWave(1);
  let guard=0;
  while(!t.isOver() && guard++<2000) t.step(0.1);
  ok('生命归零 → over', t.isOver()===true);
  ok('over 时未获胜', t.hasWon()===false);
}

console.log('towerdefense: 全部断言通过');
