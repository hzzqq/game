const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../baccarat.html');

// 固定序列随机：rk(rank) 给出映射到 rank(1..13) 的确定性 pick
function rk(rank){ return (rank - 0.5) / 13; }
function seq(arr){ let i = 0; return () => arr[i++ % arr.length]; }

// ---- 1. 重置后状态正确 ----
t.setRand(() => 0);
t.reset();
let s = t.getState();
eq('重置余额=1000', s.balance, 1000);
eq('重置闲家空', s.player, []);
eq('重置庄家空', s.banker, []);
eq('重置无结果', s.result, null);
eq('重置无下注', s.bet, null);
ok('牌靴已建立(8副)', s.shoe.length === 416);

// ---- 2. mod10 + 含 10/K 不进位（闲天牌9结束，庄含10/K=0）----
t.setRand(seq([rk(9), rk(10), rk(9), rk(13)])); // P9 B10 P9 BK
t.reset(); t.placeBet('player', 100); t.deal();
s = t.getState();
eq('10/K场景闲家牌[9,9]', s.player, [9, 9]);
eq('10/K场景庄家牌含10与K', s.banker, [10, 13]);
eq('10/K场景闲胜(10/K=0,mod10生效)', s.result, 'player');
eq('闲胜余额+100', s.balance, 1100);
eq('闲胜赔付=100', s.lastPayout, 100);

// ---- 3. 天牌判定：双方8/9立即结束，各两张 ----
t.setRand(seq([rk(8), rk(4), rk(10), rk(5)])); // P8 B4 P10 BK -> 闲8 庄9 天牌
t.reset(); t.placeBet('banker', 100); t.deal();
s = t.getState();
eq('天牌闲家仅2张', s.player.length, 2);
eq('天牌庄家仅2张', s.banker.length, 2);
eq('天牌庄9胜', s.result, 'banker');

// ---- 4. 闲家补牌：0-5补第三张 ----
t.setRand(seq([rk(2), rk(4), rk(3), rk(3), rk(1)])); // P2 B4 P3 B3 + P1
t.reset(); t.placeBet('player', 100); t.deal();
s = t.getState();
eq('闲0-5补牌→闲3张', s.player.length, 3);
eq('闲补牌时庄未补→庄2张', s.banker.length, 2);

// ---- 5. 庄家补牌：闲停牌(7)，庄<=5补 ----
t.setRand(seq([rk(6), rk(2), rk(1), rk(2), rk(5)])); // P6 B2 P1 B2 + B5
t.reset(); t.placeBet('banker', 100); t.deal();
s = t.getState();
eq('闲停牌→闲2张', s.player.length, 2);
eq('庄<=5补牌→庄3张', s.banker.length, 3);

// ---- 6. 庄家停牌：bv=7 始终停（pThird已知）----
t.setRand(seq([rk(3), rk(7), rk(2), rk(10), rk(6)])); // P3 B7 P2 B10 + P6
t.reset(); t.placeBet('player', 100); t.deal();
s = t.getState();
eq('庄bv=7停牌→庄2张', s.banker.length, 2);
eq('闲补牌→闲3张', s.player.length, 3);

// ---- 7. 庄家停牌：bv=4 且 p=8 停 ----
t.setRand(seq([rk(3), rk(4), rk(2), rk(10), rk(8)])); // P3 B4 P2 B10 + P8
t.reset(); t.placeBet('player', 100); t.deal();
s = t.getState();
eq('庄bv=4,p=8停牌→庄2张', s.banker.length, 2);

// ---- 8. 庄家补牌：bv=6 且 p=7 补 ----
t.setRand(seq([rk(3), rk(6), rk(2), rk(10), rk(7)])); // P3 B6 P2 B10 + P7
t.reset(); t.placeBet('banker', 100); t.deal();
s = t.getState();
eq('庄bv=6,p=7补牌→庄3张', s.banker.length, 3);

// ---- 9. 赔付：庄胜余额+0.95*amount ----
t.setRand(seq([rk(2), rk(9), rk(2), rk(9), rk(1)])); // P2 B9 P2 B9 + P1(未用)
t.reset(); t.placeBet('banker', 100); t.deal();
s = t.getState();
eq('庄胜结算', s.result, 'banker');
eq('庄胜余额+95', s.balance, 1095);
eq('庄胜赔付=95', s.lastPayout, 95);

// ---- 10. 赔付：和局余额+8*amount ----
t.setRand(seq([rk(6), rk(9), rk(2), rk(9)])); // P6 B9 P2 B9 -> 闲8 庄8 天牌和
t.reset(); t.placeBet('tie', 100); t.deal();
s = t.getState();
eq('和局结算', s.result, 'tie');
eq('和局余额+800', s.balance, 1800);
eq('和局赔付=800', s.lastPayout, 800);

// ---- 11. 赔付：输 余额-amount ----
t.setRand(seq([rk(2), rk(9), rk(2), rk(9), rk(1)])); // 庄胜但下注闲
t.reset(); t.placeBet('player', 100); t.deal();
s = t.getState();
eq('输局结算为庄胜', s.result, 'banker');
eq('输局余额-100', s.balance, 900);
eq('输局赔付=-100', s.lastPayout, -100);

// ---- 12. 重置后状态恢复 ----
t.reset();
s = t.getState();
eq('二次重置余额=1000', s.balance, 1000);
eq('二次重置闲空', s.player, []);
eq('二次重置庄空', s.banker, []);
eq('二次重置无下注', s.bet, null);
