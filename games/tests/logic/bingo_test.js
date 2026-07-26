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

// --- Round 7: 胜利/完成特效（纯渲染层，Juice 桩无 confetti → 守卫式 no-op 不抛错）---
t.setCard(card);
ok('confettiFired 初始 false', t.confettiFired() === false);
for(let c=0;c<5;c++) t.call(c+1); // 第 0 行命中 → 宾果 → celebrate()
ok('宾果胜利路径触发 over', t.isWin() === true);
ok('宾果达成后 confettiFired=true', t.confettiFired() === true);
let bthrew=false;
try { t.triggerWinEffect(); } catch(e){ bthrew=true; }
ok('triggerWinEffect 在 Juice 无 confetti 时不抛错', bthrew === false);
// 重开新局（setCard 复位）后恢复 false
t.setCard(card);
ok('重开新局后 confettiFired=false', t.confettiFired() === false);

// ===== 手感计数钩子（只读 _fxShakes/_fxBursts）=====
t.setCard(card);
eq('fx 初始 shake=0', t.fxShakes(), 0);
eq('fx 初始 burst=0', t.fxBursts(), 0);
for(let c=0;c<5;c++) t.call(c+1); // 整行命中 → 每次命中 shake，连成一线 burst
ok('命中触发 shake>0', t.fxShakes()>0);
ok('连成一线触发 burst>0', t.fxBursts()>0);
t.setCard(card); // newGame 归零
eq('newGame 后 shake 归零', t.fxShakes(), 0);
eq('newGame 后 burst 归零', t.fxBursts(), 0);
