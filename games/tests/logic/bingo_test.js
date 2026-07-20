const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../bingo.html');

// 卡片 = 1..25 顺序排布（card[r][c]=r*5+c+1）
const card = [];
for(let r=0;r<5;r++){ const row=[]; for(let c=0;c<5;c++) row.push(r*5+c+1); card.push(row); }
t.setCard(card);

ok('初始未获胜', t.isWin() === false);

// 喊出第 0 行 1..5
for(let c=0;c<5;c++) t.call(c+1);
ok('整行命中 → 宾果', t.isWin() === true);

// 复位后用列验证
t.setCard(card);
for(let r=0;r<5;r++) t.call(r*5+1); // 第 0 列
ok('整列命中 → 宾果', t.isWin() === true);

// 复位后仅命中 4 个 → 未胜
t.setCard(card);
for(let c=0;c<4;c++) t.call(c+1);
ok('仅 4 格未达成连线', t.isWin() === false);
ok('(0,4) 未被标记', t.getMarked(0,4) === false);
