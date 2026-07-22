const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../xiangqi.html');

// 工具：构造空盘并摆放
function empty(){ return Array.from({length:10},()=>new Array(9).fill(null)); }
function put(b,r,c,o){ b[r][c]=o; return b; }

// ===== 1. 初始局面结构 =====
{
  t.newGame();
  const st = t.getState();
  eq('棋盘 10 行', st.board.length, 10);
  eq('棋盘 9 列', st.board[0].length, 9);
  eq('红方先手', st.turn, 'r');
  let pieces=0; for(const row of st.board) for(const p of row) if(p) pieces++;
  eq('共 32 子', pieces, 32);
  ok('初始未分胜负', t.isWin('r')===false && t.isWin('b')===false);
  ok('初始红帅在场', st.board[9][4] && st.board[9][4].t==='k' && st.board[9][4].s==='r');
  ok('初始黑将在场', st.board[0][4] && st.board[0][4].t==='k' && st.board[0][4].s==='b');
}

// ===== 2. 馬腿被蹩 =====
{
  const b=empty();
  put(b,9,4,{t:'k',s:'r'}); put(b,0,4,{t:'k',s:'b'});
  put(b,4,4,{t:'h',s:'r'});            // 红馬
  put(b,5,4,{t:'p',s:'b'});            // 蹩马腿：挡住 (4,4)->(6,5) 的腿 (5,4)
  t.setup(b,'r');
  const lm = t.legalMoves([4,4]).map(a=>a.join(','));
  ok('马腿被蹩：(6,5) 不可走', !lm.includes('6,5'));
  ok('无阻挡：(2,5) 可走', lm.includes('2,5'));
}

// ===== 3. 炮架吃子 =====
{
  const b=empty();
  put(b,9,3,{t:'k',s:'r'}); put(b,0,5,{t:'k',s:'b'});  // 不同列，避免飞将干扰
  put(b,4,4,{t:'c',s:'r'});            // 红炮
  put(b,4,6,{t:'p',s:'r'});            // 炮架（己方）
  put(b,4,7,{t:'p',s:'b'});            // 目标（敌）
  t.setup(b,'r');
  const lm = t.legalMoves([4,4]).map(a=>a.join(','));
  ok('炮可平移到空格 (4,5)', lm.includes('4,5'));
  ok('炮隔架吃子 (4,7)', lm.includes('4,7'));
  ok('炮不能落在炮架 (4,6)', !lm.includes('4,6'));
}

// ===== 4. 相/象：不过河 + 塞象眼 =====
{
  const b=empty();
  put(b,9,3,{t:'k',s:'r'}); put(b,0,5,{t:'k',s:'b'});  // 不同列，避免飞将干扰
  put(b,5,5,{t:'e',s:'r'});            // 红相
  t.setup(b,'r');
  const lm = t.legalMoves([5,5]).map(a=>a.join(','));
  ok('相不可过河 (3,5) 不可走', !lm.includes('3,5'));
  ok('相可走 (7,3)', lm.includes('7,3'));
  // 塞象眼：在 (6,4) 放子挡住 (5,5)->(7,3)
  put(b,6,4,{t:'p',s:'b'});
  t.setup(b,'r');
  const lm2 = t.legalMoves([5,5]).map(a=>a.join(','));
  ok('塞象眼 (7,3) 不可走', !lm2.includes('7,3'));
}

// ===== 5. 飞将非法：移动会令两将对脸 =====
{
  const b=empty();
  put(b,9,4,{t:'k',s:'r'}); put(b,0,4,{t:'k',s:'b'});
  put(b,4,4,{t:'p',s:'r'});            // 红兵挡在中间列
  t.setup(b,'r');
  const lm = t.legalMoves([4,4]).map(a=>a.join(','));
  ok('兵可向前 (3,4)', lm.includes('3,4'));
  ok('兵横向 (4,3) 会导致对脸 → 非法', !lm.includes('4,3'));
  ok('兵横向 (4,5) 会导致对脸 → 非法', !lm.includes('4,5'));
  ok('直接走对脸着法被拒', t.move([4,4],[4,3])===false);
  ok('合法着法可执行', t.move([4,4],[3,4])===true);
}

// ===== 6. 飞将吃子（同列无遮 → 主帅可飞吃敌帅，获胜）=====
{
  const b=empty();
  put(b,9,4,{t:'k',s:'r'}); put(b,0,4,{t:'k',s:'b'});  // 同列、中间无子
  t.setup(b,'r');
  const lm = t.legalMoves([9,4]).map(a=>a.join(','));
  ok('主帅可飞吃敌帅 (0,4)', lm.includes('0,4'));
  ok('飞吃后红胜', t.move([9,4],[0,4])===true && t.isWin('r')===true);
}

// ===== 7. 将死判定（黑被将死）=====
{
  const b=empty();
  put(b,0,4,{t:'k',s:'b'});            // 黑将（被将死方）
  put(b,9,9,{t:'k',s:'r'});            // 红帅（远离，不对脸）
  put(b,0,8,{t:'r',s:'r'});            // 横向将军
  put(b,8,3,{t:'r',s:'r'});            // 控 (1,3)
  put(b,8,4,{t:'r',s:'r'});            // 控 (1,4)
  put(b,8,5,{t:'r',s:'r'});            // 控 (1,5)
  t.setup(b,'b');                      // 轮到黑走
  ok('黑方被将', t.inCheck('b')===true);
  ok('黑无合法着法 → 红胜', t.isWin('r')===true);
}

// ===== 8. 多种子：每局均为 32 子的合法初始局面 =====
{
  let allOK=true;
  for(const seed of [1,7,42,999,2024,56789]){
    t.newGame(seed);
    const st=t.getState();
    let pieces=0; for(const row of st.board) for(const p of row) if(p) pieces++;
    if(pieces!==32 || st.turn!=='r') allOK=false;
  }
  ok('6 个种子初始局面均合法', allOK);
}
