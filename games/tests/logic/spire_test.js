const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../spire.html');

// --- map / run boot ---
t.resetRun();
eq('开局进入地图', t.getScreen(), 'map');
const mp = t.getMap();
eq('地图共 15 层', mp.floors, 15);
eq('末层为 Boss', mp.lastType, 'boss');
ok(t.currentOptions().length >= 1, '起点至少 1 个可达节点');

// --- entering a battle via direct startCombat ---
t.resetRun();
t.startCombat(['slime'], 'battle');
eq('进入战斗界面', t.getScreen(), 'combat');
let c = t.getCombat();
eq('起手抽 5 张', c.hand.length, 5);
eq('能量为 3', c.energy, 3);
eq('初始最大能量 3', c.maxEnergy, 3);
ok(t.getEnemies().length === 1, '竞技场有 1 个敌人');

// --- playing an attack reduces enemy hp & spends energy ---
let e0 = t.getEnemies()[0].hp;
let hand = t.getHand();
let ai = hand.findIndex(h=>h.type==='attack');
ok(ai >= 0, '手牌中存在攻击牌');
const cost = hand[ai].cost;
const before = t.getCombat().energy;
t.playCard(ai, 0);
let e1 = t.getEnemies()[0].hp;
ok(e1 < e0, '攻击后敌人血量下降');
eq('攻击消耗能量', t.getCombat().energy, before - cost);

// --- vulnerable multiplies damage (debug hooks) ---
t.resetRun();
t.startCombat(['guardian'], 'battle'); // hp 54
t.debugDeal(0, 10);
let g1 = t.getEnemies()[0].hp;          // 44
t.debugVuln(0, 2);
t.debugDeal(0, 10);
let g2 = t.getEnemies()[0].hp;          // 44 - 15 = 29
eq('易伤使伤害 ×1.5', g1 - g2, 15);

// --- block absorbs damage (debug hooks) ---
t.resetRun();
t.startCombat(['slime'], 'battle');
t.setRunHp(70);
t.debugBlock(5);
t.debugPlayerTake(8);                   // 5 格挡吸收后掉 3
eq('格挡吸收后剩余血量', t.getRunHp(), 67);

// --- 恶魔形态牌打出不崩溃且 C.demon+2（回归：曾误写 C.combat.demon 致打出即抛错）---
t.resetRun();
t.startCombat(['slime'], 'battle');
t.debugSetHand(['demon']);
const demonBefore = t.getCombat().demon;
ok('打出恶魔形态不抛错', t.playCard(0, 0) === true);
eq('恶魔形态打出后 C.demon=2', t.getCombat().demon, demonBefore + 2);
// 下回合开始应额外 +2 力量（demon 机制）
t.endTurn();
// endTurn 后若战斗未结束，新回合 C.demon 仍生效（C.str += C.demon）

// --- end turn: enemy acts, new player turn resets ---
t.resetRun();
t.startCombat(['slime'], 'battle');
t.setRunHp(70);
const turnBefore = t.getCombat().turn;
const hpBefore = t.getRunHp();
t.endTurn();
const c2 = t.getCombat();
eq('回合 +1', c2.turn, turnBefore + 1);
eq('新回合能量回满', c2.energy, c2.maxEnergy);
eq('新回合补满 5 张手牌', c2.hand.length, 5);
ok(t.getRunHp() < hpBefore, '敌人攻击使玩家掉血');

// --- full clear -> win -> reward -> choose adds card ---
t.resetRun();
t.startCombat(['slime'], 'battle');     // weak enemy, should be winnable
let guard=0, won=false;
while(guard++ < 50){
  const cc = t.getCombat();
  if(!cc || cc.over) break;
  // play all affordable attacks
  let g2=0;
  while(g2++<30){ const h=t.getHand(); const idx=h.findIndex(x=>x.type==='attack'); if(idx<0) break; if(!t.playCard(idx,0)) break; }
  if(t.getCombat().over) break;
  t.endTurn();
}
ok(t.getScreen()==='reward' || t.getScreen()==='win', '清场后进入奖励/胜利');
if(t.getScreen()==='reward'){
  const rw = t.getReward();
  ok(rw && rw.cards.length===3, '奖励提供 3 张可选卡');
  const deckBefore = t.getPlayer().deck;
  t.chooseReward(0);
  eq('选择奖励后牌组 +1', t.getPlayer().deck, deckBefore + 1);
  eq('选择后回到地图', t.getScreen(), 'map');
}

// --- player death ends run ---
t.resetRun();
t.startCombat(['dragon'], 'boss');      // 130 hp boss, will overwhelm
t.setRunHp(20);
let g3=0;
while(g3++ < 60){
  const cc=t.getCombat();
  if(!cc || cc.over) break;
  let g4=0; while(g4++<30){ const h=t.getHand(); const idx=h.findIndex(x=>x.type==='attack'); if(idx<0) break; if(!t.playCard(idx,0)) break; }
  if(t.getCombat().over) break;
  t.endTurn();
}
ok(t.isOver(), '被 Boss 击败后游戏结束');
