const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../balatro.html');

const C = (r,s)=>({rank:r,suit:s});

// --- run boot ---
t.newRun();
eq('开局进入回合', t.getScreen(), 'round');
const st = t.getState();
eq('起手 8 张', st.hand, 8);
eq('出手次数 4', st.plays, 4);
eq('弃牌次数 3', st.discards, 3);
eq('第 1 轮小盲', st.ante===1 && st.blindIdx===0, true);

// --- poker evaluation ---
eq('对子识别', t.evaluate([C(13,'spade'),C(13,'heart'),C(2,'club'),C(5,'diamond'),C(9,'club')]).type, 'PAIR');
eq('同花识别', t.evaluate([C(2,'spade'),C(5,'spade'),C(7,'spade'),C(9,'spade'),C(11,'spade')]).type, 'FLUSH');
eq('顺子识别', t.evaluate([C(5,'spade'),C(6,'heart'),C(7,'diamond'),C(8,'club'),C(9,'spade')]).type, 'STRAIGHT');
eq('四条识别', t.evaluate([C(7,'spade'),C(7,'heart'),C(7,'diamond'),C(7,'club'),C(2,'spade')]).type, 'FOUR_KIND');
eq('皇家同花顺', t.evaluate([C(10,'spade'),C(11,'spade'),C(12,'spade'),C(13,'spade'),C(14,'spade')]).type, 'ROYAL_FLUSH');
eq('高牌识别', t.evaluate([C(2,'spade'),C(5,'heart'),C(7,'diamond'),C(9,'club'),C(13,'spade')]).type, 'HIGH_CARD');
eq('葫芦识别', t.evaluate([C(7,'spade'),C(7,'heart'),C(7,'diamond'),C(2,'club'),C(2,'spade')]).type, 'FULL_HOUSE');

// --- scoring with no jokers ---
const pairCards=[C(13,'spade'),C(13,'heart'),C(2,'club'),C(5,'diamond'),C(9,'club')];
const s0=t.scoreHand(pairCards);
eq('对子基础倍率 2', s0.mult, 2);
ok(s0.score>0, '无小丑也有得分');

// --- joker adds mult ---
t.newRun();
t.addJoker('joker'); // +4 mult
const s1=t.scoreHand(pairCards);
eq('小丑使倍率 +4', s1.mult, 6);
ok(s1.score > s0.score, '小丑提升总分');

// --- boss debuff disables suit-based joker ---
t.newRun();
const pair7=[C(7,'spade'),C(7,'heart'),C(2,'club'),C(3,'club'),C(4,'club')];
t.addJoker('greedy'); // needs club +3 mult
t.debugSetDebuff(null);
const sNoDeb=t.scoreHand(pair7);
eq('无封印时贪婪触发 +3', sNoDeb.mult, 5);
t.debugSetDebuff('club');
const sDeb=t.scoreHand(pair7);
eq('梅花被封印时贪婪不触发', sDeb.mult, 2);

// --- round win via strong hand + reward ---
t.newRun();
const quads=[C(7,'spade'),C(7,'heart'),C(7,'diamond'),C(7,'club'),C(2,'spade')];
t.debugSetHand(quads);
t.debugSetTarget(50);
t.toggleSelect(0);t.toggleSelect(1);t.toggleSelect(2);t.toggleSelect(3);t.toggleSelect(4);
ok(t.canPlay(), '五张可出牌');
t.playSelected();
eq('达标后进入奖励', t.getScreen(), 'reward');
const jb=t.getState().jokers;
t.chooseReward(0);
eq('选择后小丑 +1', t.getState().jokers, jb+1);
eq('奖励后进入下一盲注', t.getScreen(), 'round');
eq('盲注推进到小盲→大盲', t.getState().blindIdx, 1);

// --- run loss when target unreachable ---
t.newRun();
t.debugSetTarget(1e9);
for(let i=0;i<4;i++){ t.debugSetHand([C(2,'spade'),C(3,'heart'),C(4,'diamond'),C(5,'club'),C(6,'spade')]); t.toggleSelect(0); t.playSelected(); }
ok(t.isOver(), '出手耗尽未达标则游戏结束');
