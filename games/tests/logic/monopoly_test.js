const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../monopoly.html');

// 1. rand 1-6
for (let i = 0; i < 50; i++){
  const r = t.rand();
  ok('rand ' + i + ' 在 1-6', r >= 1 && r <= 6);
}

// 2. houseLabel
eq('houseLabel(0)=空地', t.houseLabel(0), '空地');
eq('houseLabel(1)=1栋', t.houseLabel(1), '1栋');
eq('houseLabel(4)=4栋', t.houseLabel(4), '4栋');
eq('houseLabel(5)=旅馆', t.houseLabel(5), '旅馆');
eq('houseLabel(6)=旅馆', t.houseLabel(6), '旅馆');
eq('houseLabel(10)=旅馆', t.houseLabel(10), '旅馆');

// 3. houseCostOf = round(price/2)
eq('houseCostOf price=60 → 30', t.houseCostOf({price:60}), 30);
eq('houseCostOf price=200 → 100', t.houseCostOf({price:200}), 100);
eq('houseCostOf price=350 → 175', t.houseCostOf({price:350}), 175);
eq('houseCostOf price=150 → 75', t.houseCostOf({price:150}), 75);

// 4. makePlayers
const ps = t.makePlayers();
eq('makePlayers 4 个', ps.length, 4);
eq('makePlayers[0] name=你', ps[0].name, '你');
ok('makePlayers[0] 非 AI', ps[0].isAI === false);
ok('makePlayers[1-3] 是 AI', ps[1].isAI && ps[2].isAI && ps[3].isAI);
ok('makePlayers cash=1500', ps.every(p => p.cash === 1500));
ok('makePlayers pos=0', ps.every(p => p.pos === 0));
ok('makePlayers alive=true', ps.every(p => p.alive === true));
ok('makePlayers inJail=false', ps.every(p => p.inJail === false));
ok('makePlayers 4 种颜色', new Set(ps.map(p=>p.color)).size === 4);

// 5. makeBoard
const bd = t.makeBoard();
eq('makeBoard 40 格', bd.length, 40);
eq('makeBoard[0] type=go', bd[0].type, 'go');
eq('makeBoard[10] type=jail', bd[10].type, 'jail');
eq('makeBoard[20] type=freeparking', bd[20].type, 'freeparking');
eq('makeBoard[30] type=gotojail', bd[30].type, 'gotojail');
// property 22 个
eq('makeBoard property 22 个', bd.filter(t=>t.type==='property').length, 22);
// railroad 4 个
eq('makeBoard railroad 4 个', bd.filter(t=>t.type==='railroad').length, 4);
// utility 2 个
eq('makeBoard utility 2 个', bd.filter(t=>t.type==='utility').length, 2);
// 所有地块初始 owner=null, houses=0
ok('makeBoard owner=null', bd.every(t => t.owner === null));
ok('makeBoard houses=0', bd.every(t => t.houses === 0));
// property 有 price 和 baseRent
const props = bd.filter(t=>t.type==='property');
ok('makeBoard property 都有 price', props.every(t => typeof t.price === 'number'));
ok('makeBoard property 都有 baseRent', props.every(t => typeof t.baseRent === 'number' && t.baseRent > 0));

// 6. playerById（boot 后 players 已初始化）
const p0 = t.playerById(0);
eq('playerById(0) 是当前玩家', p0.id, 0);
eq('playerById(3) id=3', t.playerById(3).id, 3);

// 7. aliveCount
eq('aliveCount 初始 4', t.aliveCount(), 4);
t.players[1].alive = false;
eq('aliveCount 杀1后 3', t.aliveCount(), 3);
t.players[1].alive = true;  // 恢复

// 8. countOwned
eq('countOwned 初始 0', t.countOwned(0, 'property'), 0);
// 给 player 0 设 2 块 property
t.board[1].owner = 0;
t.board[3].owner = 0;
eq('countOwned player0 property 2', t.countOwned(0, 'property'), 2);
eq('countOwned player0 railroad 0', t.countOwned(0, 'railroad'), 0);
t.board[5].owner = 0;
eq('countOwned player0 railroad 1', t.countOwned(0, 'railroad'), 1);
// 清理
t.board[1].owner = null; t.board[3].owner = null; t.board[5].owner = null;

// 9. nextIdx
eq('nextIdx(0)=1', t.nextIdx(0), 1);
eq('nextIdx(1)=2', t.nextIdx(1), 2);
eq('nextIdx(2)=3', t.nextIdx(2), 3);
eq('nextIdx(3)=0', t.nextIdx(3), 0);
// 杀 player 1，nextIdx(0) 应跳过 1 到 2
t.players[1].alive = false;
eq('nextIdx(0) 跳过死玩家=2', t.nextIdx(0), 2);
eq('nextIdx(3) 跳过死玩家=0', t.nextIdx(3), 0);
t.players[1].alive = true;

// 10. cornerType
ok('cornerType go true', t.cornerType({type:'go'}) === true);
ok('cornerType jail true', t.cornerType({type:'jail'}) === true);
ok('cornerType freeparking true', t.cornerType({type:'freeparking'}) === true);
ok('cornerType gotojail true', t.cornerType({type:'gotojail'}) === true);
ok('cornerType property false', t.cornerType({type:'property'}) === false);
ok('cornerType railroad false', t.cornerType({type:'railroad'}) === false);

// 11. sendToJail
const pj = t.playerById(0);
pj.pos = 5; pj.inJail = false; pj.jailTurns = 3;
t.sendToJail(pj);
eq('sendToJail pos=10', pj.pos, 10);
eq('sendToJail inJail=true', pj.inJail, true);
eq('sendToJail jailTurns=0', pj.jailTurns, 0);

// 12. reset 重置
t.reset();
eq('reset phase=roll', t.phase, 'roll');
eq('reset players 4', t.players.length, 4);
eq('reset board 40', t.board.length, 40);
ok('reset cash=1500', t.players.every(p => p.cash === 1500));
ok('reset pos=0', t.players.every(p => p.pos === 0));
ok('reset alive=true', t.players.every(p => p.alive === true));
ok('reset board owner=null', t.board.every(tt => tt.owner === null));

// ---------- 四档难度 ----------
eq('setDifficulty(hell) 返回 true', t.setDifficulty('hell'), true);
eq('getDifficulty()==hell', t.getDifficulty(), 'hell');
eq('setDifficulty(easy)', t.setDifficulty('easy'), true);
eq('getDifficulty()==easy', t.getDifficulty(), 'easy');
eq('setDifficulty(bad) 返回 false', t.setDifficulty('bad'), false);

// ---------- 胜利 confetti ----------
t.reset();
ok('胜利前 confettiFired 为 false', t.confettiFired() === false);
t.players[1].alive=false; t.players[2].alive=false; t.players[3].alive=false;
t.endGame();
ok('游戏结束胜利 → confettiFired 为真', t.confettiFired() === true);

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nmonopoly: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
