// werewolf.html（狼人杀）逻辑单测
// 覆盖：ROLES/ROLE_TEXT 表、shuffle、livingIds/aliveRole/livingNonWitch/weightedPower、
// causeText、newGame(6玩家/角色随机/道具状态)、kill(基础/猎人开枪标记/重复idempotent)、
// checkWin(狼0=好人胜/狼>=民=狼胜/未决)、aiVote(wolf指非狼/seer指已知狼/村民随机)、
// pickStatement 返回合法台词
const { loadGame, ok, eq, results } = require('./harness');

let t;
try { t = loadGame('../werewolf.html').t; } catch (e) { console.error(e); process.exit(1); }

// ===== 1. ROLES / ROLE_TEXT =====
eq('ROLES 6身份', t.ROLES.length, 6);
eq('ROLES 含1狼', t.ROLES.filter(r=>r==='wolf').length, 1);
eq('ROLES 含2村民', t.ROLES.filter(r=>r==='villager').length, 2);
eq('ROLES 含1预言家', t.ROLES.filter(r=>r==='seer').length, 1);
eq('ROLES 含1女巫', t.ROLES.filter(r=>r==='witch').length, 1);
eq('ROLES 含1猎人', t.ROLES.filter(r=>r==='hunter').length, 1);
const RT = t.ROLE_TEXT;
eq('ROLE_TEXT wolf=狼', RT.wolf, '狼');
eq('ROLE_TEXT villager=民', RT.villager, '民');
eq('ROLE_TEXT seer=预', RT.seer, '预');
eq('ROLE_TEXT witch=巫', RT.witch, '巫');
eq('ROLE_TEXT hunter=猎', RT.hunter, '猎');

// ===== 2. shuffle =====
const arr=[1,2,3,4,5,6,7,8];
const sh=t.shuffle(arr.slice());
eq('shuffle 长度保持', sh.length, 8);
sh.sort((a,b)=>a-b);
eq('shuffle 元素不变', sh, [1,2,3,4,5,6,7,8]);

// ===== 3. causeText =====
eq('causeText wolf=遇袭', t.causeText('wolf'), '遇袭');
eq('causeText poison=毒杀', t.causeText('poison'), '毒杀');
eq('causeText gun=枪决', t.causeText('gun'), '枪决');
eq('causeText vote=投票', t.causeText('vote'), '投票');

// ===== 4. newGame 初始状态 =====
t.newGame();
const G = t.getG();
ok('newGame G 非空', !!G);
eq('newGame 6 玩家', t.getPlayers().length, 6);
eq('newGame round=1', t.getRound(), 1);
eq('newGame phase=准备', t.getPhase(), '准备');
ok('newGame 未结束', !t.getOver());
ok('newGame witchAntidote=true', t.getWitchAntidote());
ok('newGame witchPoison=true', t.getWitchPoison());
ok('newGame hunterGun=true', t.getHunterGun());
eq('newGame nightVictim=null', t.getNightVictim(), null);
eq('newGame nightSaved=null', t.getNightSaved(), null);
eq('newGame poisonTarget=null', t.getPoisonTarget(), null);
eq('newGame knownWolves 空', t.getKnownWolves().length, 0);
eq('newGame lastNightDeaths 空', t.getLastNightDeaths().length, 0);
eq('newGame hunterNeedsShoot=null', t.getHunterNeedsShoot(), null);
eq('newGame pending=null', t.getPending(), null);
eq('newGame humanId=0', t.getHumanId(), 0);
// 玩家结构
const p0 = t.getPlayers()[0];
eq('player0 id=0', p0.id, 0);
eq('player0 seat=1', p0.seat, 1);
eq('player0 name=你', p0.name, '你');
ok('player0 isHuman', p0.isHuman);
ok('player0 alive', p0.alive);
ok('player0 !revealed', !p0.revealed);
// 6 玩家的角色组合是 ROLES 的排列
const roles = t.getPlayers().map(p=>p.role).sort();
const expected = t.ROLES.slice().sort();
eq('newGame 角色组合=ROLES', roles, expected);
// 玩家 1-5 是 AI
for (let i=1;i<6;i++){
  ok('player'+i+' !isHuman', !t.getPlayers()[i].isHuman);
  eq('player'+i+' seat='+ (i+1), t.getPlayers()[i].seat, i+1);
}

// ===== 5. livingIds / aliveRole / livingNonWitch =====
t.newGame();
eq('livingIds 初始6', t.livingIds().length, 6);
const _k0 = t.getPlayers().findIndex(p => p.role!=='wolf');
t.getPlayers()[_k0].alive = false;
eq('livingIds 杀1后5', t.livingIds().length, 5);
// aliveRole（确定性：先定位狼，再杀一个非狼玩家，避免依赖随机角色分配）
const wolfIdx = t.getPlayers().findIndex(p => p.role==='wolf');
ok('存在 wolf 玩家', wolfIdx>=0);
const killIdx = t.getPlayers().findIndex((p,i) => p.role!=='wolf');
t.getPlayers()[killIdx].alive = false;
const wolf = t.aliveRole('wolf');
ok('aliveRole wolf 存在', !!wolf);
ok('aliveRole wolf.role=wolf', wolf && wolf.role==='wolf');
t.getPlayers()[wolfIdx].alive = false;
ok('aliveRole wolf 死后 null', t.aliveRole('wolf')===null);
// 恢复
t.newGame();
// livingNonWitch：排除女巫
const nonWitch = t.livingNonWitch();
eq('livingNonWitch 初始5', nonWitch.length, 5);
ok('livingNonWitch 不含女巫', nonWitch.every(id => t.getPlayers()[id].role!=='witch'));

// ===== 6. weightedPower =====
t.newGame();
// 权重：seer/witch/hunter=3，wolf/villager=1。总权重 = 1+1+1+3+3+3=12
const ids = t.livingIds();
for (let i=0;i<30;i++){
  const r = t.weightedPower(ids);
  ok('weightedPower 返回在ids内', ids.indexOf(r)>=0, 'r='+r);
}
// 空数组 → null
ok('weightedPower 空 null', t.weightedPower([])===null);
// 单元素 → 返回该元素
eq('weightedPower 单元素', t.weightedPower([3]), 3);

// ===== 7. kill =====
t.newGame();
const beforeAlive = t.getPlayers()[1].alive;
t.kill(1, 'wolf');
ok('kill 后 alive=false', !t.getPlayers()[1].alive);
eq('kill cause', t.getPlayers()[1].cause, 'wolf');
ok('kill revealed=true', t.getPlayers()[1].revealed);
// 重复 kill idempotent
t.kill(1, 'wolf');
ok('kill 重复 idempotent', !t.getPlayers()[1].alive);
// 猎人被狼杀/投票 → hunterNeedsShoot 标记
t.newGame();
// 找到猎人
let hunterId = -1;
t.getPlayers().forEach((p,i) => { if(p.role==='hunter') hunterId = i; });
ok('找到猎人', hunterId>=0);
t.kill(hunterId, 'wolf');
eq('kill 猎人被狼杀 标记开枪', t.getHunterNeedsShoot(), hunterId);
// 猎人被毒杀 → 不标记
t.newGame();
t.getPlayers().forEach((p,i) => { if(p.role==='hunter') hunterId = i; });
t.kill(hunterId, 'poison');
eq('kill 猎人被毒杀 不标记', t.getHunterNeedsShoot(), null);
// 猎人被枪决 → 标记
t.newGame();
t.getPlayers().forEach((p,i) => { if(p.role==='hunter') hunterId = i; });
t.kill(hunterId, 'gun');
eq('kill 猎人被枪决 标记开枪', t.getHunterNeedsShoot(), hunterId);
// 猎枪已用 → 不标记
t.newGame();
t.setHunterGun(false);
t.getPlayers().forEach((p,i) => { if(p.role==='hunter') hunterId = i; });
t.kill(hunterId, 'wolf');
eq('kill 猎枪已用 不标记', t.getHunterNeedsShoot(), null);

// ===== 8. checkWin =====
// 狼死 → 好人胜
t.newGame();
t.getPlayers().forEach(p => { if(p.role==='wolf') p.alive=false; });
ok('checkWin 狼死 好人胜', t.checkWin());
ok('checkWin 狼死 over=true', t.getOver());
// 狼>=民 → 狼胜（1狼 vs 1民）
t.newGame();
t.getPlayers().forEach((p,i) => {
  if(p.role!=='wolf' && p.role!=='villager') p.alive=false;
});
// 现在：1狼 + 2村民 活。狼1 < 民2 → 未决
ok('checkWin 1狼2民 未决', !t.checkWin());
// 杀1村民 → 1狼1民 → 狼>=民 → 狼胜
t.getPlayers().forEach((p,i) => {
  if(p.role==='villager' && p.alive){ p.alive=false; return; }
});
ok('checkWin 1狼1民 狼胜', t.checkWin());
// 1狼0民 → 狼胜
t.newGame();
t.getPlayers().forEach(p => {
  if(p.role!=='wolf') p.alive=false;
});
ok('checkWin 1狼0民 狼胜', t.checkWin());

// ===== 9. aiVote =====
t.newGame();
// wolf 投票：指向非狼
const wolfP = t.aliveRole('wolf');
ok('aiVote wolf 存在', !!wolfP);
const wolfTarget = t.aiVote(wolfP);
const aliveNonWolf = t.livingIds().filter(id => id!==wolfP.id && t.getPlayers()[id].role!=='wolf');
ok('aiVote wolf 指非狼', aliveNonWolf.indexOf(wolfTarget)>=0, 'target='+wolfTarget);
// seer 投票：优先已知狼
t.newGame();
const seerP = t.aliveRole('seer');
// 设定已知狼
let wolfId = -1;
t.getPlayers().forEach((p,i) => { if(p.role==='wolf') wolfId = i; });
t.setKnownWolves([wolfId]);
t.setVotes({});
const seerTarget = t.aiVote(seerP);
eq('aiVote seer 指已知狼', seerTarget, wolfId);
// seer 无已知狼 → 随机
t.setKnownWolves([]);
const seerTarget2 = t.aiVote(seerP);
const aliveOthers = t.livingIds().filter(id => id!==seerP.id);
ok('aiVote seer 无已知狼 随机', aliveOthers.indexOf(seerTarget2)>=0);
// villager 投票：随机
t.newGame();
const villP = t.getPlayers().find(p => p.role==='villager');
const villTarget = t.aiVote(villP);
const aliveOthers2 = t.livingIds().filter(id => id!==villP.id);
ok('aiVote villager 随机', aliveOthers2.indexOf(villTarget)>=0);
// 单人时投自己
t.newGame();
const alone = t.getPlayers()[0];
t.getPlayers().forEach((p,i) => { if(i!==0) p.alive=false; });
eq('aiVote 单人投自己', t.aiVote(alone), 0);

// ===== 10. pickStatement =====
t.newGame();
const speaker = t.getPlayers()[1];
const target = t.getPlayers()[2];
for (let i=0;i<20;i++){
  const s = t.pickStatement(speaker, target);
  ok('pickStatement 返回非空字符串', typeof s==='string' && s.length>0);
}

// ===== 11. 胜利彩带钩子 =====
t.newGame();
// 强制人类为好人阵营，保证 endGame('good') 时人类获胜 → 彩带触发
t.getPlayers()[0].role = 'villager';
t.getPlayers().forEach(p => { if(p.role==='wolf') p.alive=false; });
t.checkWin();
ok('endGame 好人胜 触发胜利彩带(confettiFired)', t.confettiFired());

// ===== 汇总 =====
const passed = results.filter(r=>r.pass).length;
const total = results.length;
console.log(`\nwerewolf: ${passed}/${total} 通过`);
if (passed !== total) {
  results.filter(r=>!r.pass).forEach(r => console.log(`  ✗ ${r.name}  ${r.info}`));
  process.exit(1);
}
