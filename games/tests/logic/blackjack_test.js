// 21点逻辑单测：算点(Ace软硬) / 黑杰克判定 / 庄家停手 / 结算赔付
const H = require('./harness');
const { t: T } = H.loadGame('../blackjack.html');

var A = { r: 'A', v: 11 }, K = { r: 'K', v: 10 }, Q = { r: 'Q', v: 10 };
var Ten = { r: '10', v: 10 }, N9 = { r: '9', v: 9 }, N8 = { r: '8', v: 8 }, N7 = { r: '7', v: 7 };
var N6 = { r: '6', v: 6 }, N5 = { r: '5', v: 5 };

// 1) 算点：A 软硬自动
H.eq('bj: A+K=21', T.handValue([A, K]), 21);
H.eq('bj: A+A+9=21(软)', T.handValue([A, A, N9]), 21);
H.eq('bj: A+6+10=17(软)', T.handValue([A, N6, Ten]), 17);
H.eq('bj: 10+7=17', T.handValue([Ten, N7]), 17);

// 2) 黑杰克：仅两张 21
H.ok(T.isBlackjack([A, K]) === true, 'bj: A+K 是黑杰克');
H.ok(T.isBlackjack([A, N5, N5]) === false, 'bj: A+5+5 非黑杰克');
H.ok(T.isBlackjack([Ten, Ten]) === false, 'bj: 10+10 非黑杰克');

// 3) 庄家 17 停手
H.ok(T.dealerShouldHit([N6, N8, N5]) === true, 'bj: 19 以上停手前 16 继续要');
H.ok(T.dealerShouldHit([Ten, N7]) === false, 'bj: 17 停手');
H.ok(T.dealerShouldHit([A, N6]) === false, 'bj: 软17 停手');

// 4) 结算
H.eq('bj: 玩家BJ胜', T.resolveRound([A, K], [Ten, N7]), 'blackjack');
H.eq('bj: 玩家点数高胜', T.resolveRound([Ten, N9], [Ten, N8]), 'win');
H.eq('bj: 庄家点数高负', T.resolveRound([Ten, N7], [Ten, N8]), 'lose');
H.eq('bj: 平局', T.resolveRound([Ten, N9], [Ten, N9]), 'push');
H.eq('bj: 玩家爆牌负', T.resolveRound([Ten, N6, N8], [Ten, N8]), 'lose');
H.eq('bj: 庄家爆牌胜', T.resolveRound([Ten, N9], [Ten, N6, N8]), 'win');

// 5) 赔付（本金 1000，下注 100）
T.setChips(1000);
T.runRound([A, K], [Ten, N7], 100);
H.eq('bj: 黑杰克赔付 +150', T.getChips(), 1150, '1000-100+250');

T.setChips(1000);
T.runRound([Ten, N9], [Ten, N8], 100);
H.eq('bj: 普通胜赔付 +100', T.getChips(), 1100, '1000-100+200');

T.setChips(1000);
T.runRound([Ten, N6, N8], [Ten, N8], 100);
H.eq('bj: 爆牌输 -100', T.getChips(), 900, '1000-100');

T.setChips(1000);
T.runRound([Ten, N9], [Ten, N9], 100);
H.eq('bj: 平局退还', T.getChips(), 1000, '1000-100+100');

T.setChips(1000);
T.runRound([Ten, N9], [Ten, N6, N8], 100);
H.eq('bj: 庄家爆牌胜 +100', T.getChips(), 1100, '1000-100+200');

module.exports = {};
