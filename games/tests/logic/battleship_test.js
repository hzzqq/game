const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../battleship.html');

// 持续变化的随机源（mulberry32），保证布舰每艘落到不同位置
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let x=Math.imul(a^a>>>15,1|a); x=x+Math.imul(x^x>>>7,61|x)^x; return ((x^x>>>14)>>>0)/4294967296; }; }
const _rng = mulberry32(0x9e3779b9);

// ---------- 常量 ----------
eq('SIZE=10', t.SIZE, 10);
eq('SHIP_LENS 5 艘', t.SHIP_LENS.length, 5);
eq('舰长 [5,4,3,3,2]', JSON.stringify(t.SHIP_LENS), JSON.stringify([5,4,3,3,2]));

// ---------- 布舰：不重叠、在界内、总数正确 ----------
{
  t.setRand(_rng);
  t.reset();
  const ships = t.getShips();
  eq('5 艘舰', ships.length, 5);
  const seen = new Set();
  let totalCells = 0, inBounds = true;
  ships.forEach(s=>{
    totalCells += s.len;
    s.cells.forEach(p=>{
      if(p.r<0||p.r>=10||p.c<0||p.c>=10) inBounds=false;
      const k=p.r+','+p.c;
      if(seen.has(k)) throw new Error('overlap at '+k);
      seen.add(k);
    });
  });
  eq('舰身总数 17', totalCells, 17);
  ok('所有舰在界内', inBounds);
  // board 上 1 的数量 = 17
  let ones=0; const b=t.getBoard(); for(let r=0;r<10;r++) for(let c=0;c<10;c++) if(b[r][c]===1) ones++;
  eq('board 上舰格=17', ones, 17);
}

// ---------- shoot 命中 / 未中 ----------
{
  t.setRand(_rng);
  t.reset();
  const b=t.getBoard();
  // 找一个舰格
  let sr=-1,sc=-1;
  for(let r=0;r<10;r++) for(let c=0;c<10;c++) if(b[r][c]===1){ sr=r; sc=c; break; }
  const hitRes = t.shoot(sr,sc);
  ok('命中返回 hit', hitRes.hit===true && hitRes.miss===false);
  eq('命中后 hits=1', t.getHits(), 1);
  eq('该格变 2', t.getBoard()[sr][sc], 2);
  // 找一个空格
  let mr=-1,mc=-1;
  for(let r=0;r<10;r++) for(let c=0;c<10;c++) if(b[r][c]===0){ mr=r; mc=c; break; }
  const missRes = t.shoot(mr,mc);
  ok('未中返回 miss', missRes.miss===true && missRes.hit===false);
  eq('未中不增 hits', t.getHits(), 1);
}

// ---------- 重复射击 ----------
{
  t.setRand(_rng);
  t.reset();
  let sr=-1,sc=-1; const b=t.getBoard();
  for(let r=0;r<10;r++) for(let c=0;c<10;c++) if(b[r][c]===1){ sr=r; sc=c; break; }
  t.shoot(sr,sc);
  const rep = t.shoot(sr,sc);
  ok('重复射击返回 repeat', rep.repeat===true);
  eq('重复射击不计 hits', t.getHits(), 1);
  eq('射击次数仍 1', t.getShots().size, 1);
}

// ---------- 越界拒绝 ----------
{
  t.setRand(_rng);
  t.reset();
  const r = t.shoot(-1, 5);
  const r2 = t.shoot(10, 5);
  ok('越界返回 err', r.err==='oob' && r2.err==='oob');
}

// ---------- 击沉一艘 + 全胜 ----------
{
  t.setRand(_rng);
  t.reset();
  const ships = t.getShips();
  // 击沉第一艘（长度 ships[0].len）
  const len0 = ships[0].len;
  ships[0].cells.forEach(p=>{ const res=t.shoot(p.r,p.c); });
  const sc = t.getSunk();
  ok('击沉至少 1 艘', sc>=1);
}
{
  // 全胜：把所有舰格都射中
  t.setRand(_rng);
  t.reset();
  const ships = t.getShips();
  ships.forEach(s=>s.cells.forEach(p=>{ t.shoot(p.r,p.c); }));
  ok('全击沉即胜', t.isWin()===true);
  ok('胜利即 over', t.isOver()===true);
  eq('击沉数=5', t.getSunk(), 5);
}
{
  // over 后不再接受
  t.setRand(_rng);
  t.reset();
  const ships=t.getShips();
  ships.forEach(s=>s.cells.forEach(p=>{ t.shoot(p.r,p.c); }));
  const r=t.shoot(0,0);
  ok('over 后 shoot 返回 err', r.err==='over');
}

console.log('battleship: 全部断言通过');
