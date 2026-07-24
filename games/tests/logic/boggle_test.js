const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../boggle.html');

// ===== 1. 同种子同盘（确定性，且不依赖 Math.random）=====
{
  const a = t.newGame(42);
  const b = t.newGame(42);
  eq('同种子生成相同盘', JSON.stringify(a.grid), JSON.stringify(b.grid));
  eq('盘为 4×4', a.grid.length, 4);
  eq('盘为 4 列', a.grid[0].length, 4);
  const c = t.newGame(7);
  ok('不同种子盘不同', JSON.stringify(a.grid) !== JSON.stringify(c.grid));
}

// ===== 2. setRand 覆盖 rng：确定性可复现 =====
{
  let s=12345; t.setRand(()=>{ s=(s*1664525+1013904223)>>>0; return (s&0x7fffffff)/0x7fffffff; });
  const g1 = t.newGame();
  let s2=12345; t.setRand(()=>{ s2=(s2*1664525+1013904223)>>>0; return (s2&0x7fffffff)/0x7fffffff; });
  const g2 = t.newGame();
  eq('setRand 控制生成可复现', JSON.stringify(g1.grid), JSON.stringify(g2.grid));
  t.setRand(Math.random);
}

// ===== 3. 词典与计分 =====
{
  ok('inDict 含常见词', t.inDict('cat')===true && t.inDict('star')===true);
  ok('inDict 拒非常词', t.inDict('zzqx')===false);
  ok('长度<3 不计分', t.score('at')===0);
  eq('3 字母=1', t.score('cat'), 1);
  eq('4 字母=1', t.score('code'), 1);
  eq('5 字母=2', t.score('apple'), 2);
  eq('6 字母=3', t.score('banana'), 3);
  eq('7+ 字母=5', t.score('elephant'), 5);
}

// ===== 4. findWords：受控盘应找到已知词 =====
{
  const GRID=[
    ['c','a','t','s'],
    ['o','r','e','n'],
    ['t','r','a','p'],
    ['e','s','t','s']
  ];
  t.setup(GRID);
  const found = t.findWords();
  const need = ['cat','rats','rate','tar','star','tear','ten','net','pant','trap','art',
                'eats','eat','tea','set','sea','are','ear','ant','nap','pan','pen','ate','car','arc','ore'];
  let allPresent = need.every(w=>found.includes(w));
  ok('受控盘找到全部已知词 ('+found.length+' 词)', allPresent);
  ok('全部结果长度≥3', found.every(w=>w.length>=3));
  ok('全部结果在词典内', found.every(w=>t.inDict(w)));
  ok('结果无重复', new Set(found).size===found.length);
}

// ===== 5. 不可重复用格：与独立无重复 DFS 一致 =====
{
  const GRID=[
    ['c','a','t','s'],
    ['o','r','e','n'],
    ['t','r','a','p'],
    ['e','s','t','s']
  ];
  t.setup(GRID);
  const grid = t.getState().grid;
  // 独立复刻：严格不重复用格的 DFS
  function refAll(){
    const out=new Set();
    const vis=Array.from({length:4},()=>new Array(4).fill(false));
    function dfs(r,c,str){
      const ns=str+grid[r][c]; vis[r][c]=true;
      if(ns.length>=3 && t.inDict(ns)) out.add(ns);
      if(ns.length<16){
        for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
          if(dr===0&&dc===0) continue;
          const nr=r+dr,nc=c+dc;
          if(nr>=0&&nr<4&&nc>=0&&nc<4&&!vis[nr][nc]) dfs(nr,nc,ns);
        }
      }
      vis[r][c]=false;
    }
    for(let r=0;r<4;r++) for(let c=0;c<4;c++) dfs(r,c,'');
    return [...out].sort();
  }
  eq('findWords 与无重复 DFS 完全一致', t.findWords(), refAll());
}

// ===== 6. 边界：无可成词时返回空 =====
{
  t.setup([['q','q','q','q'],['q','q','q','q'],['q','q','q','q'],['q','q','q','q']]);
  eq('全 Q 盘无词', t.findWords(), []);
}

// ===== 7. 轮2：完成反馈 confetti 标记 =====
{
  t.setup([
    ['c','a','t','s'],
    ['o','r','e','n'],
    ['t','r','a','p'],
    ['e','s','t','s']
  ]);
  const ws = t.finishFind();
  ok('finishFind 返回词数组', Array.isArray(ws) && ws.length>0);
  ok('完成后 confettiFired 置位', t.getConfettiFired()===true);
}
