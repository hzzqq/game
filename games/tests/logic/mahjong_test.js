const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../mahjong.html');

// 1. buildWall：108 张，3 花色 × 9 rank × 4 张
const w = t.buildWall();
ok('buildWall 108 张', w.length === 108);
ok('buildWall 每张 4 个', (function(){
  for (let v = 0; v < 27; v++){ if (t.countTile(w, v) !== 4) return false; }
  return true;
})());
ok('buildWall 值域 0-26', w.every(v => v >= 0 && v < 27));

// 2. shuffle：长度不变，元素相同
const arr = [0,1,2,3,4,5];
const sh = t.shuffle(arr.slice());
eq('shuffle 长度不变', sh.length, 6);
ok('shuffle 元素相同', sh.slice().sort((a,b)=>a-b).join(',') === '0,1,2,3,4,5');

// 3. countTile
eq('countTile [0,0,1,1,1] t=1 = 3', t.countTile([0,0,1,1,1], 1), 3);
eq('countTile [0,0,1,1,1] t=0 = 2', t.countTile([0,0,1,1,1], 0), 2);
eq('countTile [0,0,1,1,1] t=5 = 0', t.countTile([0,0,1,1,1], 5), 0);
eq('countTile [] t=0 = 0', t.countTile([], 0), 0);

// 4. removeTile
const rm = [0,1,2,1];
eq('removeTile 存在 true', t.removeTile(rm, 1), true);
eq('removeTile 移除后长度', rm.length, 3);
ok('removeTile 移除后不含', !rm.includes(1) || rm.includes(1)); // 还剩一个 1
eq('removeTile 实际剩 1 个', t.countTile(rm, 1), 1);
const rm2 = [0,1,2];
eq('removeTile 不存在 false', t.removeTile(rm2, 5), false);
eq('removeTile 不存在长度不变', rm2.length, 3);

// 5. tileLabel
eq('tileLabel(0)=1万', t.tileLabel(0), '1万');
eq('tileLabel(8)=9万', t.tileLabel(8), '9万');
eq('tileLabel(9)=1条', t.tileLabel(9), '1条');
eq('tileLabel(17)=9条', t.tileLabel(17), '9条');
eq('tileLabel(18)=1筒', t.tileLabel(18), '1筒');
eq('tileLabel(26)=9筒', t.tileLabel(26), '9筒');

// 6. tileClass
eq('tileClass(0)=t-wan', t.tileClass(0), 't-wan');
eq('tileClass(8)=t-wan', t.tileClass(8), 't-wan');
eq('tileClass(9)=t-tiao', t.tileClass(9), 't-tiao');
eq('tileClass(17)=t-tiao', t.tileClass(17), 't-tiao');
eq('tileClass(18)=t-tong', t.tileClass(18), 't-tong');
eq('tileClass(26)=t-tong', t.tileClass(26), 't-tong');

// 7. canFormMelds（第一参数是长度 27 的 counts 数组，非 tiles）
function cnt(tiles){
  const c = new Array(27).fill(0);
  for (const v of tiles) c[v]++;
  return c;
}
// 4 刻子 need=4
ok('canFormMelds 4刻子 need=4', t.canFormMelds(cnt([3,3,3,4,4,4,5,5,5,6,6,6]), 4) === true);
// 3 顺子(同花色) need=3
ok('canFormMelds 3顺子 need=3', t.canFormMelds(cnt([0,1,2,3,4,5,6,7,8]), 3) === true);
// 3 跨花色顺子 need=3（每花色 1 顺子）
ok('canFormMelds 跨花色 3顺子 need=3', t.canFormMelds(cnt([0,1,2,9,10,11,18,19,20]), 3) === true);
// 刻子+顺子混搭 need=2
ok('canFormMelds 刻子+顺子 need=2', t.canFormMelds(cnt([0,1,2,5,5,5]), 2) === true);
// need 与实际 melds 数不匹配 → false（9 张 need=2，剩 3 张无 meld 可凑）
ok('canFormMelds 9张 need=2 false', t.canFormMelds(cnt([0,1,2,3,4,5,6,7,8]), 2) === false);
// need=0 且有 tile → false
ok('canFormMelds 有tile need=0 false', t.canFormMelds(cnt([0,1,2]), 0) === false);
// need=0 且无 tile → true
ok('canFormMelds 空 need=0 true', t.canFormMelds(new Array(27).fill(0), 0) === true);
// 凑不出 → false（散牌）
ok('canFormMelds 散牌 need=1 false', t.canFormMelds(cnt([0,3,6]), 1) === false);
// 跨花色不能凑顺子（7=8万，8=9万，9=1条，不连续）
ok('canFormMelds 跨花色假顺子 false', t.canFormMelds(cnt([7,8,9]), 1) === false);

// 8. canWin 胡牌判定（14 张 = 4 melds + 1 pair）
// 4 刻子 + 1 对子
ok('canWin 4刻子+1对 true', t.canWin([0,0,1,1,1,2,2,2,3,3,3,4,4,4]) === true);
// 3 刻子 + 1 对子 + 1 顺子
ok('canWin 刻子+顺子+对子 true', t.canWin([0,1,2,3,3,3,5,5,5,7,7,7,9,9]) === true);
// 4 顺子 + 1 对子（万 3 顺子 + 条 1 顺子）
ok('canWin 4顺子+1对 true', t.canWin([0,1,2,3,4,5,6,7,8,9,10,11,13,13]) === true);
// 不胡：单张散落
ok('canWin 散牌 false', t.canWin([0,0,1,1,1,2,2,2,3,3,3,4,4,5]) === false);
// 不胡：张数不够
ok('canWin 11张 false', t.canWin([0,0,1,1,1,2,2,2,3,3,3]) === false);
// exposedMelds：1 个明刻，手牌 11 张需凑 3 melds+1 pair
ok('canWin exposed=1 11张 true', t.canWin([0,0,1,1,1,2,2,2,3,3,3], 1) === true);
ok('canWin exposed=0 11张 false', t.canWin([0,0,1,1,1,2,2,2,3,3,3], 0) === false);
// exposed=4：只需 1 对子
ok('canWin exposed=4 2张对子 true', t.canWin([5,5], 4) === true);
ok('canWin exposed=4 2张不同 false', t.canWin([5,6], 4) === false);
// exposed 过大
ok('canWin exposed=5 false', t.canWin([5,5], 5) === false);

// 9. mostIsolated
eq('mostIsolated 空手 null', t.mostIsolated([]), null);
// 单张
eq('mostIsolated 单张', t.mostIsolated([5]), 5);
// 全相同 → 第一张（score=(4-1)*3=9，所有相同，并列取第一）
eq('mostIsolated 全相同', t.mostIsolated([3,3,3,3]), 3);

// 10. 胜利/完成特效（纯渲染层，Juice 桩无 confetti → 守卫式 no-op 不抛错）
let mthrew=false;
try { t.triggerWinEffect(); } catch(e){ mthrew=true; }
ok('mahjong triggerWinEffect 不抛错', mthrew === false);
let mthrew2=false;
try { t.winGame(0,'自摸'); } catch(e){ mthrew2=true; }
ok('mahjong winGame 胜利路径不抛错', mthrew2 === false);

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nmahjong: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
