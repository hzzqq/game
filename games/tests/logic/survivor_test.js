const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../survivor.html');

// --- boot ---
t.reset();
let s = t.getState();
ok(s.state==='playing', '初始进入游戏状态');
eq('初始自带 1 把武器(鞭击)', s.weapons, 1);
eq('初始无敌人', s.enemies, 0);

// --- overlap damage ---
t.reset();
let p = t.getPlayer();
t.spawnEnemy('bat', p.x+5, p.y);
t.step(0.05);
let p2 = t.getPlayer();
ok(p2.hp < p.maxhp, '敌人重叠时玩家受伤');

// --- kill drops gem + increments kills ---
t.reset();
p = t.getPlayer();
t.spawnEnemy('bat', p.x+220, p.y);
let before = t.getState().kills;
t.killEnemy(0);
let st = t.getState();
eq('击杀数 +1', st.kills, before+1);
ok(st.gems >= 1, '击杀掉落经验宝石');

// --- xp -> level up -> choices -> apply ---
t.reset();
t.gainXp(100);
st = t.getState();
ok(st.level > 1, '经验足够后升级');
ok(st.state==='levelup', '升级进入三选一状态');
let ch = t.getUpgradeChoices();
ok(ch && ch.length>=1 && ch.length<=3, '生成 1~3 个升级选项');
t.applyUpgrade(0);
st = t.getState();
ok(st.state==='playing', '选择后恢复游戏');
ok(st.level>1 && st.xp < st.xpNext, '选择后经验已重置进位');

// --- new weapon add + passive application ---
t.reset();
ok(t.addWeapon('knife')!==null, '可新增飞刀武器');
ok(t.getWeapons().some(w=>w.type==='knife'), '飞刀已进入武器列表');
// apply a passive via generated choices if available, else direct
t.reset();
t.gainXp(1000);
let ch2 = t.getUpgradeChoices();
let applied = false;
for(let i=0;i<ch2.length;i++){ if(ch2[i].kind==='passive'){ t.applyUpgrade(i); applied=true; break; } }
ok(applied, '能在选项中应用一个增益');

// --- boss spawn over time ---
t.reset();
t.setTime(60);
t.forceBoss();
t.step(0.05);
ok(t.getState().enemies>0, '到达时间后刷出敌人(含Boss)');

// --- player death ends game ---
t.reset();
p = t.getPlayer();
t.spawnEnemy('brute', p.x+3, p.y);
let died=false;
for(let i=0;i<400;i++){ t.step(0.05); if(t.getState().over){ died=true; break; } }
ok(died, '被压制时玩家死亡并结束');
