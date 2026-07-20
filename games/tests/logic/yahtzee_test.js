const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../yahtzee.html');

// ===== 1. 投掷与保留 =====
{
  t.setRand(()=>0.5);
  t.newGame();
  t.roll(); // 全投
  eq('投后 rolls=1', t.getRolls(), 1);
  const d1=t.getDice().slice();
  t.roll([true,true,true,true,true]); // 全保留
  eq('全保留→骰子不变', JSON.stringify(t.getDice()), JSON.stringify(d1));
  eq('再投 rolls=2', t.getRolls(), 2);
  t.roll([true,true,true,true,true]);
  eq('rolls=3', t.getRolls(), 3);
  ok('超过 3 次投被拒', t.roll()===false);
}

// ===== 2. 计分计算 =====
{
  t.setDice([1,1,1,2,3]);
  eq('ones=3', t.compute('ones'), 3);
  eq('twos=2', t.compute('twos'), 2);
  eq('threes=3', t.compute('threes'), 3);
  eq('threeKind=sum=8', t.compute('threeKind'), 8);
  eq('fourKind=0', t.compute('fourKind'), 0);
  eq('fullHouse=0', t.compute('fullHouse'), 0);
  eq('smallStraight=0', t.compute('smallStraight'), 0);
  eq('largeStraight=0', t.compute('largeStraight'), 0);
  eq('yahtzee=0', t.compute('yahtzee'), 0);
  eq('chance=8', t.compute('chance'), 8);
}

// ===== 3. 特殊组合 =====
{
  t.setDice([2,2,3,3,3]);
  eq('葫芦=25', t.compute('fullHouse'), 25);
  eq('三条=13', t.compute('threeKind'), 13);
  t.setDice([1,2,3,4,4]);
  eq('小顺=30', t.compute('smallStraight'), 30);
  t.setDice([2,3,4,5,6]);
  eq('大顺=40', t.compute('largeStraight'), 40);
  t.setDice([5,5,5,5,5]);
  eq('快艇=50', t.compute('yahtzee'), 50);
  eq('四条=25', t.compute('fourKind'), 25);
}

// ===== 4. 记分与回合推进 =====
{
  t.setDice([1,1,1,2,3]);
  const before=t.getTotal();
  ok('ones 未用→可记分', t.assign('ones')===true);
  eq('总分增加 3', t.getTotal(), before+3);
  ok('同一类二次记分被拒', t.assign('ones')===false);
  eq('记分后重置回合（rolls=0）', t.getRolls(), 0);
  eq('已用类数=1', Object.keys(t.getUsedCats()).length, 1);
}

// ===== 5. 必须先投掷才能记分 =====
{
  t.newGame();
  ok('未投掷不能记分', t.assign('chance')===false);
}

// ===== 6. 13 类全部分配→终局 =====
{
  // 每回合须先“投掷”(setDice 令 rolls=1)再记分
  let okAll=true;
  for(const cat of t.getCats()){ t.setDice([1,2,3,4,5]); if(!t.assign(cat)) okAll=false; }
  ok('13 类逐一记分全部成功', okAll);
  ok('全部分配后终局', t.isOver()===true);
  eq('终局时已用 13 类', Object.keys(t.getUsedCats()).length, 13);
}
