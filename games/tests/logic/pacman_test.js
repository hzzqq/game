// 吃豆人 纯逻辑单测：墙判定/吃豆/撞墙停止/鬼碰撞/吃 fright 鬼
const H = require('./harness');
const { t } = H.loadGame('../pacman.html');

t.startGame();

// 1) 边界是墙
H.ok('吃豆人 边界(0,0)是墙', t.isWall(0,0) === true);

// 2) 开放格非墙
(() => {
  const s = t.MAZE;
  let found = null;
  for(let r=0;r<t.ROWS && !found;r++)
    for(let c=0;c<t.COLS;c++) if(s[r][c] !== '#'){ found=[c,r]; break; }
  H.ok('吃豆人 开放格非墙', t.isWall(found[0], found[1]) === false);
})();

// 3) validDirs 返回非墙方向
(() => {
  const dirs = t.validDirs(t.getPac());
  H.ok('吃豆人 validDirs 返回>=1方向', dirs.length > 0, '得到 '+dirs.length);
})();

// 4) eatAt 吃豆加分 + dotsLeft-1 + 标记 eaten
(() => {
  const dots = t.getDots();
  const d = dots.find(x => !x.eaten && x.type === 'dot');
  const before = t.getScore();
  const leftBefore = t.getDotsLeft();
  t.eatAt(d.c, d.r);
  H.ok('吃豆人 eatAt 加分+10', t.getScore() === before + 10, '得到 '+(t.getScore()-before));
  H.ok('吃豆人 eatAt dotsLeft-1', t.getDotsLeft() === leftBefore - 1);
  H.ok('吃豆人 eatAt 标记eaten', d.eaten === true);
})();

// 5) 撞墙停止：把 pac 放在「右侧是墙」的开放格，朝右走应被挡住
(() => {
  const s = t.MAZE;
  let open = null;
  for(let r=1;r<t.ROWS-1 && !open;r++)
    for(let c=1;c<t.COLS-1;c++)
      if(s[r][c] !== '#' && s[r][c+1] === '#'){ open=[c,r]; break; }
  H.ok('吃豆人 找到右邻墙的开放格', !!open);
  if(open){
    t.setPacTile(open[0], open[1]);
    const pac = t.getPac();
    pac.want = { x:1, y:0 }; pac.dir = { x:1, y:0 };
    t.movePac();
    const tile = t.tileOf(pac);
    H.ok('吃豆人 撞墙后停在格内', tile.c === open[0] && tile.r === open[1], '得到 '+JSON.stringify(tile));
    H.ok('吃豆人 撞墙后 dir 归零', pac.dir.x === 0 && pac.dir.y === 0);
  }
})();

// 6) 与鬼同格 → 扣命 (lives 3->2)
(() => {
  t.startGame();
  const g = t.getGhosts()[0];
  const gt = t.tileOf(g);
  t.setPacTile(gt.c, gt.r);
  t.checkCollisions();
  H.ok('吃豆人 与鬼同格扣命 lives=2', t.getLives() === 2, '得到 '+t.getLives());
})();

// 7) 吃 frightened 鬼 → 加分 +200 + 标记 eaten
(() => {
  t.startGame();
  const g = t.getGhosts()[0];
  g.frightened = true;
  const gt = t.tileOf(g);
  t.setPacTile(gt.c, gt.r);
  const before = t.getScore();
  t.checkCollisions();
  H.ok('吃豆人 吃fright鬼加分+200', t.getScore() === before + 200, '得到 '+(t.getScore()-before));
  H.ok('吃豆人 吃鬼后 eaten=true', g.eaten === true);
})();
