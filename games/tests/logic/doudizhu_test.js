const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../doudizhu.html');

// 工具：构造指定 rank 的牌（id 自增，不干扰 getCombo 内部 rank 比较）
let cid = 0;
function C(rank, suit){
  if (rank === 16) return { id: cid++, rank: 16, suit: '', red: false, joker: 'small' };
  if (rank === 17) return { id: cid++, rank: 17, suit: '', red: false, joker: 'big' };
  suit = suit || '♠';
  return { id: cid++, rank, suit, red: (suit === '♥' || suit === '♦'), joker: null };
}
function Cs(){ return Array.from(arguments).map(r => C(r)); }

// 1. buildDeck
const deck = t.buildDeck();
ok('buildDeck 54张', deck.length === 54);
ok('buildDeck 含小王', deck.some(c => c.rank === 16 && c.joker === 'small'));
ok('buildDeck 含大王', deck.some(c => c.rank === 17 && c.joker === 'big'));
ok('buildDeck 4花色×13=52 非王', deck.filter(c => !c.joker).length === 52);
ok('buildDeck rank 3-15 各 4 张', (function(){
  for (let r = 3; r <= 15; r++){ if (deck.filter(c => c.rank === r).length !== 4) return false; }
  return true;
})());
ok('buildDeck 4 花色', (function(){
  const suits = new Set(deck.filter(c=>!c.joker).map(c=>c.suit));
  return suits.size === 4 && suits.has('♠') && suits.has('♥') && suits.has('♦') && suits.has('♣');
})());

// 2. rankLabel
eq('rankLabel(3)=3', t.rankLabel(3), '3');
eq('rankLabel(10)=10', t.rankLabel(10), '10');
eq('rankLabel(11)=J', t.rankLabel(11), 'J');
eq('rankLabel(12)=Q', t.rankLabel(12), 'Q');
eq('rankLabel(13)=K', t.rankLabel(13), 'K');
eq('rankLabel(14)=A', t.rankLabel(14), 'A');
eq('rankLabel(15)=2', t.rankLabel(15), '2');

// 3. suitVal
eq('suitVal(♠)=4', t.suitVal('♠'), 4);
eq('suitVal(♥)=3', t.suitVal('♥'), 3);
eq('suitVal(♦)=2', t.suitVal('♦'), 2);
eq('suitVal(♣)=1', t.suitVal('♣'), 1);
eq('suitVal("")=0', t.suitVal(''), 0);

// 4. isConsecutive
eq('isConsecutive([3,4,5])=true', t.isConsecutive([3,4,5]), true);
eq('isConsecutive([3,5,7])=false', t.isConsecutive([3,5,7]), false);
eq('isConsecutive([1])=true', t.isConsecutive([1]), true);
eq('isConsecutive([5,4,3])=false', t.isConsecutive([5,4,3]), false);
eq('isConsecutive([3,4,5,6,7,8])=true', t.isConsecutive([3,4,5,6,7,8]), true);

// 5. straightCheck（counts 字典 + uniq 升序 + 长度 n）
eq('straightCheck 34567 true', t.straightCheck([3,4,5,6,7], {3:1,4:1,5:1,6:1,7:1}, 5), true);
eq('straightCheck 含2 false', t.straightCheck([11,12,13,14,15], {11:1,12:1,13:1,14:1,15:1}, 5), false);
eq('straightCheck 长度<5 false', t.straightCheck([3,4,5], {3:1,4:1,5:1}, 3), false);
eq('straightCheck 含对子 false', t.straightCheck([3,3,4,5,6], {3:2,4:1,5:1,6:1}, 5), false);
eq('straightCheck 不连续 false', t.straightCheck([3,4,5,6,8], {3:1,4:1,5:1,6:1,8:1}, 5), false);
eq('straightCheck 6连 true', t.straightCheck([3,4,5,6,7,8], {3:1,4:1,5:1,6:1,7:1,8:1}, 6), true);

// 6. sortHandDesc（按 rank 降序，相同 rank 按 suit 降序）
const sh = t.sortHandDesc([C(3), C(14), C(7), C(7,'♥')]);
eq('sortHandDesc rank order', sh.map(c=>c.rank), [14,7,7,3]);
eq('sortHandDesc tie-break suit (suitVal 降序)', [sh[1].suit, sh[2].suit], ['♠','♥']);

// 7. cardsByRank
const m = t.cardsByRank([C(3), C(3,'♥'), C(5)]);
eq('cardsByRank keys', Object.keys(m).sort(), ['3','5']);
eq('cardsByRank 3 count', m[3].length, 2);

// 8. getCombo - 单张
eq('getCombo 单3 type=single', t.getCombo(Cs(3)).type, 'single');
eq('getCombo 单3 rank=3', t.getCombo(Cs(3)).rank, 3);
eq('getCombo 大A rank=14', t.getCombo(Cs(14)).rank, 14);

// 9. getCombo - 对子
const pair = t.getCombo(Cs(3,3));
eq('getCombo 对3 type=pair', pair.type, 'pair');
eq('getCombo 对3 rank=3', pair.rank, 3);

// 10. getCombo - 三张
const tri = t.getCombo(Cs(3,3,3));
eq('getCombo 三3 type=triple', tri.type, 'triple');
eq('getCombo 三3 rank=3', tri.rank, 3);

// 11. getCombo - 三带一
const ts = t.getCombo(Cs(3,3,3,5));
eq('getCombo 三带一 type=triple_single', ts.type, 'triple_single');
eq('getCombo 三带一 rank=3', ts.rank, 3);

// 12. getCombo - 三带二
const tp = t.getCombo(Cs(3,3,3,5,5));
eq('getCombo 三带二 type=triple_pair', tp.type, 'triple_pair');
eq('getCombo 三带二 rank=3', tp.rank, 3);

// 13. getCombo - 顺子
const st = t.getCombo(Cs(3,4,5,6,7));
eq('getCombo 顺子 type=straight', st.type, 'straight');
eq('getCombo 顺子 len=5', st.len, 5);
eq('getCombo 顺子 rank=7', st.rank, 7);

// 14. getCombo - 连对
const pr = t.getCombo(Cs(3,3,4,4,5,5));
eq('getCombo 连对 type=pairs', pr.type, 'pairs');
eq('getCombo 连对 len=3', pr.len, 3);
eq('getCombo 连对 rank=5', pr.rank, 5);

// 15. getCombo - 飞机（纯）
const ap = t.getCombo(Cs(3,3,3,4,4,4));
eq('getCombo 飞机 type=airplane', ap.type, 'airplane');
eq('getCombo 飞机 len=2', ap.len, 2);
eq('getCombo 飞机 rank=4', ap.rank, 4);

// 16. getCombo - 飞机带单
const aps = t.getCombo(Cs(3,3,3,4,4,4,5,6));
eq('getCombo 飞机带单 type=airplane_single', aps.type, 'airplane_single');
eq('getCombo 飞机带单 len=2', aps.len, 2);

// 17. getCombo - 飞机带对
const app = t.getCombo(Cs(3,3,3,4,4,4,5,5,6,6));
eq('getCombo 飞机带对 type=airplane_pair', app.type, 'airplane_pair');
eq('getCombo 飞机带对 len=2', app.len, 2);

// 18. getCombo - 炸弹
const b = t.getCombo(Cs(3,3,3,3));
eq('getCombo 炸弹 type=bomb', b.type, 'bomb');
eq('getCombo 炸弹 rank=3', b.rank, 3);

// 19. getCombo - 王炸
const rk = t.getCombo([C(16), C(17)]);
eq('getCombo 王炸 type=rocket', rk.type, 'rocket');

// 20. getCombo - 非法牌型
eq('getCombo 非法 3+5 null', t.getCombo(Cs(3,5)), null);
eq('getCombo 非法 三带不同对 null', t.getCombo(Cs(3,3,3,4,5)), null);
eq('getCombo 非法 3张不同 null', t.getCombo(Cs(3,4,5)), null);
eq('getCombo 非法 4张不炸弹 null', t.getCombo(Cs(3,3,4,4)), null);

// 21. beatsCombo 压牌判定
ok('beatsCombo 首出 true', t.beatsCombo({type:'single',rank:3,len:1}, null) === true);
ok('beatsCombo 火箭压一切 true', t.beatsCombo({type:'rocket',rank:1000,len:0}, {type:'bomb',rank:15,len:0}) === true);
ok('beatsCombo 火箭不能被压 false', t.beatsCombo({type:'bomb',rank:15,len:0}, {type:'rocket',rank:1000,len:0}) === false);
ok('beatsCombo 炸弹压非炸弹 true', t.beatsCombo({type:'bomb',rank:3,len:0}, {type:'single',rank:15,len:1}) === true);
ok('beatsCombo 炸弹压炸弹大压小 true', t.beatsCombo({type:'bomb',rank:5,len:0}, {type:'bomb',rank:3,len:0}) === true);
ok('beatsCombo 炸弹压炸弹小不压大 false', t.beatsCombo({type:'bomb',rank:3,len:0}, {type:'bomb',rank:5,len:0}) === false);
ok('beatsCombo 非炸弹被炸弹压 false', t.beatsCombo({type:'single',rank:15,len:1}, {type:'bomb',rank:3,len:0}) === false);
ok('beatsCombo 同型大压小 true', t.beatsCombo({type:'single',rank:5,len:1}, {type:'single',rank:3,len:1}) === true);
ok('beatsCombo 同型小不压大 false', t.beatsCombo({type:'single',rank:3,len:1}, {type:'single',rank:5,len:1}) === false);
ok('beatsCombo 不同型不压 false', t.beatsCombo({type:'pair',rank:5,len:1}, {type:'single',rank:3,len:1}) === false);
ok('beatsCombo 顺子同长压 true', t.beatsCombo({type:'straight',rank:7,len:5}, {type:'straight',rank:6,len:5}) === true);
ok('beatsCombo 顺子不同长不压 false', t.beatsCombo({type:'straight',rank:8,len:6}, {type:'straight',rank:6,len:5}) === false);

// 22. handStrength
ok('handStrength 大王+8', t.handStrength([C(17)]) === 8);
ok('handStrength 小王+6', t.handStrength([C(16)]) === 6);
ok('handStrength 2+3', t.handStrength([C(15)]) === 3);
ok('handStrength A+1', t.handStrength([C(14)]) === 1);
ok('handStrength 炸弹+10', t.handStrength([C(3),C(3,'♥'),C(3,'♦'),C(3,'♣')]) === 10);
ok('handStrength 大王+炸弹=18', t.handStrength([C(17),C(3),C(3,'♥'),C(3,'♦'),C(3,'♣')]) === 18);

// 23. enumerateCombos 至少能枚举出多种合法牌型
const ec = t.enumerateCombos([C(3),C(3,'♥'),C(4),C(5),C(6),C(7),C(8),C(14),C(14,'♥'),C(14,'♦')]);
ok('enumerateCombos 非空', ec.length > 5);
ok('enumerateCombos 含 single', ec.some(p => p.combo.type === 'single'));
ok('enumerateCombos 含 pair', ec.some(p => p.combo.type === 'pair'));
ok('enumerateCombos 含 triple', ec.some(p => p.combo.type === 'triple'));
ok('enumerateCombos 含 straight', ec.some(p => p.combo.type === 'straight'));
ok('enumerateCombos 所有项合法', ec.every(p => p.combo !== null && p.cards.length > 0));

// 24. chooseLead 返回合法牌
const lead = t.chooseLead([C(3),C(4),C(5),C(6),C(7),C(14),C(14,'♥'),C(16)]);
ok('chooseLead 非空', Array.isArray(lead) && lead.length > 0);
const leadCombo = t.getCombo(lead);
ok('chooseLead 合法牌型', leadCombo !== null);

// 25. chooseFollow 能压则压
const follow = t.chooseFollow([C(5),C(6),C(7),C(14),C(14,'♥'),C(16),C(17)], {type:'single',rank:4,len:1});
ok('chooseFollow 能压则压', follow !== null && t.getCombo(follow).rank > 4);

// 26. chooseFollow 压不过返回 null
const noF = t.chooseFollow([C(3)], {type:'single',rank:15,len:1});
eq('chooseFollow 压不过 null', noF, null);

// 27. 难度系统
eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
eq('getDifficulty 为 hell', t.getDifficulty(), 'hell');
eq('setDifficulty(非法) 返回 false', t.setDifficulty('x'), false);

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\ndoudizhu: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
