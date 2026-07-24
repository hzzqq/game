const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../qubic.html');

const N=4, idx=(x,y,z)=>x+y*N+z*N*N;

// ---------- 76 条连线已构建 ----------
eq('LINES4 共 76 条', t.LINES4.length, 76);

// ---------- win4 判定 ----------
{
  const b=new Array(64).fill(0);
  // z 轴直线 (0,0,0..3)=AI
  b[idx(0,0,0)]=2; b[idx(0,0,1)]=2; b[idx(0,0,2)]=2; b[idx(0,0,3)]=2;
  eq('z 轴四连 → AI 胜', t.win4(b), 2);
  const c=new Array(64).fill(0);
  c[idx(1,1,0)]=1; c[idx(1,1,1)]=1; c[idx(1,1,2)]=1; c[idx(1,1,3)]=1;
  eq('z 轴四连 → 人胜', t.win4(c), 1);
  const d=new Array(64).fill(0); d[idx(0,0,0)]=2; d[idx(1,1,1)]=2;
  eq('无四连 → 0', t.win4(d), 0);
}

// ---------- 空盘合法点 = 64 ----------
{
  t.newGame();
  eq('空盘 64 个合法点', t.legalMoves().length, 64);
}

// ---------- AI 进攻：一步连成四子 ----------
{
  const b=new Array(64).fill(0);
  b[idx(0,0,0)]=2; b[idx(1,0,0)]=2; b[idx(2,0,0)]=2; // x 轴前三格 AI
  t.setBoard({ board:b, turn:2, winner:0 });
  const m=t.aiMove(t.getState(),3);
  eq('AI 补第四格 idx(3,0,0)=3 取胜', m, idx(3,0,0));
  // 落子后确实获胜
  t.applyMove(3,0,0);
  eq('落子后 AI 胜', t.getState().winner, 2);
}

// ---------- AI 防守：封堵人的四连威胁 ----------
{
  const b=new Array(64).fill(0);
  b[idx(0,0,0)]=1; b[idx(1,0,0)]=1; b[idx(2,0,0)]=1; // 人 x 轴前三格
  t.setBoard({ board:b, turn:2, winner:0 });
  const m=t.aiMove(t.getState(),2); // depth=2 足以看穿必败
  eq('AI 封堵 idx(3,0,0)=3', m, idx(3,0,0));
  // 封堵后再验：该线不再成四
  t.applyMove(3,0,0);
  const after=t.getBoard();
  const line=[idx(0,0,0),idx(1,0,0),idx(2,0,0),idx(3,0,0)];
  const v=after[line[0]];
  ok('封堵后该线非单一颜色', !(v!==0 && line.every(i=>after[i]===v)));
}

// ---------- 平局规则：满盘无四连 → DRAW ----------
function buildNoWin(){
  const b=new Array(64).fill(0);
  function safe(){
    for(const l of t.LINES4){
      const v=b[l[0]]; if(v===0) continue;
      if(b[l[1]]===v && b[l[2]]===v && b[l[3]]===v) return false;
    }
    return true;
  }
  function bt(i){
    if(i===64) return true;
    for(const v of [1,2]){ b[i]=v; if(safe() && bt(i+1)) return true; b[i]=0; }
    return false;
  }
  bt(0);
  return b;
}
{
  const sol=buildNoWin();
  ok('回溯构造出满盘无四连布局', t.win4(sol)===0 && sol.every(x=>x!==0));
  const emptyIdx=idx(3,3,3);
  const col=sol[emptyIdx];
  const board=sol.slice(); board[emptyIdx]=0;
  t.setBoard({ board, turn:col, winner:0 });
  const r=t.applyMove(3,3,3);
  ok('落子成功', r.ok===true);
  eq('填满无四连 → 平局(DRAW=3)', t.getState().winner, 3);
  eq('win4 仍判无赢', t.win4(t.getBoard()), 0);
}

// ---------- 难度系统 ----------
{
  eq('4 档难度', Object.keys(t.DIFFICULTY).length, 4);
  ok('含地狱档', t.DIFFICULTY.hell.label==='地狱');
  ok('地狱档深度 > 简单档', t.DIFFICULTY.hell.depth > t.DIFFICULTY.easy.depth);
  eq('地狱档 aiRandom=0', t.DIFFICULTY.hell.aiRandom, 0);
  ok('简单档随机率 > 困难档', t.DIFFICULTY.easy.aiRandom > t.DIFFICULTY.hard.aiRandom);
  ok('setDifficulty 合法', t.setDifficulty('hard')===true);
  eq('getDifficulty', t.getDifficulty(), 'hard');
  ok('setDifficulty 非法 false', t.setDifficulty('zz')===false);
  // 困难档 aiTurn（depth3）：AI 补第四格取胜
  const b=new Array(64).fill(0);
  b[idx(0,0,0)]=2; b[idx(1,0,0)]=2; b[idx(2,0,0)]=2;
  t.setBoard({ board:b, turn:2, winner:0 });
  t.setDifficulty('hard'); t.setRand(Math.random);
  const m=t.aiTurn();
  eq('困难档 aiTurn 补 idx(3,0,0)', m, idx(3,0,0));
  ok('落子后 AI 胜', t.getState().winner===2);
  // 简单档 + 强制随机流：aiTurn 走随机合法步（返回某合法索引，不抛错）
  t.setBoard({ board:new Array(64).fill(0), turn:2, winner:0 });
  t.setDifficulty('easy'); t.setRand(()=>0.0);
  const m2=t.aiTurn();
  ok('简单档随机步返回合法索引', typeof m2==='number' && m2>=0 && m2<64);
  t.setDifficulty('normal'); t.setRand(Math.random);
}

console.log('qubic: 全部断言通过');

// ---------- 胜利彩带 / 完成反馈（confettiFired 标记） ----------
{
  t.newGame();
  const b=new Array(64).fill(0);
  b[idx(0,0,0)]=1; b[idx(1,0,0)]=1; b[idx(2,0,0)]=1; // x 轴前三格 HUMAN
  t.setBoard({ board:b, turn:1, winner:0 });
  t.applyMove(3,0,0);
  eq('玩家(HUMAN)获胜', t.getState().winner, 1);
  ok('玩家获胜触发 confettiFired', t.confettiFired() >= 1);
}
