const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../breakthrough.html');

const RED=1, BLACK=2, SIZE=8;
const idx=(r,c)=>r*SIZE+c;
function boardWith(pieces, turn, winner){
  const b=new Array(64).fill(0);
  for(const [r,c,v] of pieces) b[idx(r,c)]=v;
  t.setBoard({ board:b, turn:turn||RED, winner:winner||0 });
}

// ---------- 初始布局 ----------
{
  t.newGame();
  eq('红方 16 子', t.countPieces(t.getBoard(), RED), 16);
  eq('黑方 16 子', t.countPieces(t.getBoard(), BLACK), 16);
  eq('开局红方仅第二排可前进 → 8 个合法着法', t.legalMoves().length, 8);
}

// ---------- 吃子着法可用 ----------
{
  boardWith([[3,3,RED],[4,2,BLACK],[4,4,BLACK]], RED);
  const mv=t.legalMoves();
  const caps=mv.filter(m=>m.cap);
  ok('红子可斜前吃子(4,2)', caps.some(m=>m.to[0]===4&&m.to[1]===2));
  ok('红子可斜前吃子(4,4)', caps.some(m=>m.to[0]===4&&m.to[1]===4));
  ok('普通前进着法存在', mv.some(m=>!m.cap && m.to[0]===4 && m.to[1]===3));
}

// ---------- 胜负：抵达底线即胜 ----------
{
  boardWith([[6,0,RED]], RED);
  const r=t.applyMove({from:[6,0],to:[7,0]});
  ok('落子成功', r.ok===true);
  eq('红子抵达底线 row7 → 红胜', t.winnerOf(), RED);
}

// ---------- 胜负：吃光对方即胜 ----------
{
  boardWith([[5,5,RED],[6,4,BLACK]], BLACK);
  const mv=t.aiMove(t.getState(),4);
  ok('AI 找到吃子手', !!mv && mv.cap);
  t.applyMove(mv);
  eq('吃光红子 → 黑胜', t.winnerOf(), BLACK);
}

// ---------- AI 进攻：一步突破底线 ----------
{
  boardWith([[1,3,BLACK],[4,4,RED]], BLACK); // 黑在 row1，进一步到 row0(底线)即胜
  const mv=t.aiMove(t.getState(),4);
  ok('AI 选择突破', !!mv);
  eq('AI 落子抵达底线 row0', mv.to[0], 0);
  t.applyMove(mv);
  eq('落子后黑胜', t.winnerOf(), BLACK);
}

// ---------- AI 不送子：消除对手的制胜威胁 ----------
{
  // 红子在 (6,3) 下一步即可到 (7,3) 获胜；黑在 (7,2)/(7,4) 可斜吃 (6,3)
  // 额外放一个红子(0,0)以免被吃光触发“消除胜”，从而验证 AI 主动封堵威胁
  boardWith([[6,3,RED],[0,0,RED],[7,2,BLACK],[7,4,BLACK]], BLACK);
  const mv=t.aiMove(t.getState(),4);
  ok('AI 找到着法', !!mv);
  eq('AI 斜吃消除红方制胜威胁(6,3)', mv.to[0]===6 && mv.to[1]===3, true);
  t.applyMove(mv);
  eq('吃子后该格变为黑子(红子已消失)', t.getBoard()[idx(6,3)], BLACK);
  eq('红方仍有 1 子(未被吃光)', t.countPieces(t.getBoard(), RED), 1);
  ok('威胁解除，尚未分胜负', t.winnerOf()===0);
}

console.log('breakthrough: 全部断言通过');
