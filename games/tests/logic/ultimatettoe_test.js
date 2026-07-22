const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../ultimatettoe.html');

function emptyMicro(){ return Array.from({length:9},()=>new Array(9).fill(0)); }
function setState(o){ t.setBoard(Object.assign({ micro:emptyMicro(), macro:new Array(9).fill(0), turn:1, active:-1, winner:0 }, o)); }

// ---------- winner3 判定 ----------
{
  const E=0,H=1,A=2;
  eq('行0 人赢', t.winner3([H,H,H,E,E,E,E,E,E]), H);
  eq('列2 机赢', t.winner3([E,E,A,E,E,A,E,E,A]), A);
  eq('主对角 人赢', t.winner3([H,E,E,E,H,E,E,E,H]), H);
  eq('副对角 机赢', t.winner3([E,E,A,E,A,E,A,E,E]), A);
  eq('无赢', t.winner3([H,A,H,A,H,A,E,E,E]), 0);
  eq('DRAW(3) 不算赢', t.winner3([3,3,3,E,E,E,E,E,E]), 0);
}

// ---------- 落子合法性：active 约束 ----------
{
  setState({ active:4 });
  const mv=t.legalMoves();
  eq('active=4 时共 9 个合法点', mv.length, 9);
  ok('active=4 全部落在第4小棋盘', mv.every(m=>m[0]===4));
}
{
  // 所指小棋盘已结束 → 自动转为任意走
  const micro=emptyMicro();
  setState({ micro, macro:[0,0,0,0,3,0,0,0,0], active:4 });
  const mv=t.legalMoves();
  ok('macro[4]已平 → 转为自由走', mv.some(m=>m[0]!==4) && mv.length>9);
}

// ---------- applyMove 更新 macro（小棋盘取胜） ----------
{
  const micro=emptyMicro();
  micro[0]=[2,2,0, 0,0,0, 0,0,0]; // AI 行0 两子，待补位2
  setState({ micro, active:0, turn:2 });
  const r=t.applyMove(0,2); // AI 补成 2,2,2
  ok('落子成功', r.ok===true);
  eq('小棋盘0 → AI 占领(macro=2)', t.getMacro()[0], 2);
  eq('仅占一格、全局未分胜负', t.getState().winner, 0);
}

// ---------- 平局规则：小棋盘填满无连线 → macro=DRAW ----------
{
  const micro=emptyMicro();
  // 一个无 3 连线的满盘（差最后一格）
  micro[2]=[1,2,1, 2,1,2, 2,1,0];
  setState({ micro, macro:[0,0,0,0,0,0,0,0,0], active:2, turn:2 });
  const r=t.applyMove(2,8);
  ok('落子成功', r.ok===true);
  eq('小棋盘2 填满无连线 → macro=DRAW(3)', t.getMacro()[2], 3);
}

// ---------- 平局规则：全局满盘无大线 → winner=DRAW ----------
{
  const micro=emptyMicro();
  micro[8]=[1,2,1, 2,1,2, 2,1,0]; // 该小棋盘补满即平
  const macro=[1,2,1, 2,1,2, 2,1,0]; // 前8个大格无连线
  setState({ micro, macro, active:8, turn:2 });
  const r=t.applyMove(8,8);
  ok('落子成功', r.ok===true);
  eq('全局满盘无大线 → 平局(DRAW)', t.getState().winner, 3);
}

// ---------- AI 进攻：一步锁定全局胜 ----------
{
  const micro=emptyMicro();
  micro[2]=[2,2,0, 0,0,0, 0,0,0]; // AI 在 board2 行0 两子
  setState({ micro, macro:[2,2,0, 0,0,0, 0,0,0], active:-1, turn:2 });
  const m=t.aiMove(t.getState(),4);
  ok('AI 找到制胜手', !!m);
  eq('AI 选 board2 取胜', m[0], 2);
  t.applyMove(m[0],m[1]);
  eq('落子后 AI 全局胜', t.getState().winner, 2);
}

// ---------- AI 防守：封堵人的大线 ----------
{
  const micro=emptyMicro();
  micro[2]=[2,2,0, 0,0,0, 0,0,0]; // AI 也能在 board2 取胜，借此封堵
  setState({ micro, macro:[1,1,0, 0,0,0, 0,0,0], active:-1, turn:2 });
  const m=t.aiMove(t.getState(),4);
  ok('AI 找到封堵手', !!m);
  eq('AI 占据 board2 阻断人的连线', m[0], 2);
}

console.log('ultimatettoe: 全部断言通过');
