const { loadGame, ok, eq, results } = require('./harness');
const { t } = loadGame('../survivor.html');

// --- boot ---
t.reset();
let s = t.getState();
ok( '初始进入游戏状态', s.state==='playing');
eq('初始自带 1 把武器(鞭击)', s.weapons, 1);
eq('初始无敌人', s.enemies, 0);

// --- overlap damage ---
t.reset();
let p = t.getPlayer();
// T-143 修正：原构造 spawn bat(8hp, 5px) 会在接触判定前被开局自带鞭击一击秒杀（探针证实
// step 后 enemies=[]，玩家不掉血 → 断言换参后暴露假覆盖）。改用 boss(1400hp, r42)：
// 5px 已在其接触圈(r+12=54)内，且不会被首发武器打死，确定性触发 hurtPlayer。
t.spawnEnemy('boss', p.x+5, p.y);
t.step(0.05);
let p2 = t.getPlayer();
ok( '敌人重叠时玩家受伤', p2.hp < p.maxhp);

// --- kill drops gem + increments kills ---
t.reset();
p = t.getPlayer();
t.spawnEnemy('bat', p.x+220, p.y);
let before = t.getState().kills;
t.killEnemy(0);
let st = t.getState();
eq('击杀数 +1', st.kills, before+1);
ok( '击杀掉落经验宝石', st.gems >= 1);

// --- xp -> level up -> choices -> apply ---
t.reset();
t.gainXp(100);
st = t.getState();
ok( '经验足够后升级', st.level > 1);
ok( '升级进入三选一状态', st.state==='levelup');
let ch = t.getUpgradeChoices();
ok( '生成 1~3 个升级选项', ch && ch.length>=1 && ch.length<=3);
t.applyUpgrade(0);
st = t.getState();
ok( '选择后恢复游戏', st.state==='playing');
ok( '选择后经验已重置进位', st.level>1 && st.xp < st.xpNext);

// --- new weapon add + passive application ---
t.reset();
ok( '可新增飞刀武器', t.addWeapon('knife')!==null);
ok( '飞刀已进入武器列表', t.getWeapons().some(w=>w.type==='knife'));
// apply a passive via generated choices if available, else direct
t.reset();
t.gainXp(1000);
let ch2 = t.getUpgradeChoices();
let applied = false;
for(let i=0;i<ch2.length;i++){ if(ch2[i].kind==='passive'){ t.applyUpgrade(i); applied=true; break; } }
ok( '能在选项中应用一个增益', applied);

// --- boss spawn over time ---
t.reset();
t.setTime(60);
t.forceBoss();
t.step(0.05);
ok( '到达时间后刷出敌人(含Boss)', t.getState().enemies>0);

// --- player death ends game ---
t.reset();
p = t.getPlayer();
// T-157 确定性修正：原 spawn brute(70hp) 会被玩家鞭击约 3.5s 击杀，接触伤害与
// whip DPS 赛跑只差一击 → 400 步内死亡概率性（实测 flaky）。改用 boss(1400hp 打不死、
// dmg30、5px 已在接触圈)，必然压制致死。
t.spawnEnemy('boss', p.x+3, p.y);
let died=false;
for(let i=0;i<400;i++){ t.step(0.05); if(t.getState().over){ died=true; break; } }
ok( '被压制时玩家死亡并结束', died);

// --- 升级里程碑触发 confetti（_confettiFired 只读锁，独立于 Juice）---
t.reset();
ok( '升级前 confettiFired 为 false', t.confettiFired() === false);
t.gainXp(100);
ok( '升级 → confettiFired 为 true', t.confettiFired() === true);
t.reset();
ok( '重开复位 confettiFired 为 false', t.confettiFired() === false);

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nsurvivor: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
