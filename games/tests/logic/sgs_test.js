// sgs.html（三国杀）逻辑单测
// 覆盖：CARD_META/ROLE_NAME 表、rand/shuffle、findCard/countCard/removeOneType/removeFromHand、
// aliveOthers/shaLimit/busy、buildDeck(46张)、mkPlayer、newGame、nextAlive、
// dealDamage/die/checkWin(主公死/内奸胜/反贼胜/主公胜)、bestAttackTarget、someoneHurt、
// decideAiAction(残血tao/装备/sha/无牌)、performAiAction(sha/equip/tao/juedou/wanjian/shandian/taoyuan)、
// autoDiscard、doPlay(sha/tao/weapon/armor/guohe/shandian/taoyuan/wanjian)、
// resolveDuel(A胜/B胜/平)、resolveWanjian、isTargetable、requireShan/handleResponse 响应链
const { loadGame, ok, eq, results } = require('./harness');

let t;
try { t = loadGame('../sgs.html').t; } catch (e) { console.error(e); process.exit(1); }

// ===== 1. CARD_META 表 =====
const CM = t.CARD_META;
eq('CARD_META sha', CM.sha, {name:'杀',cls:'red',needTarget:'enemy'});
eq('CARD_META shan', CM.shan, {name:'闪',cls:'',needTarget:'none',playable:false});
eq('CARD_META tao', CM.tao, {name:'桃',cls:'green',needTarget:'any'});
eq('CARD_META weapon', CM.weapon, {name:'武器',cls:'gold',needTarget:'self'});
eq('CARD_META armor', CM.armor, {name:'防具',cls:'gold',needTarget:'self'});
eq('CARD_META juedou', CM.juedou, {name:'决斗',cls:'red',needTarget:'enemy'});
eq('CARD_META guohe', CM.guohe, {name:'过河拆桥',cls:'',needTarget:'enemy'});
eq('CARD_META shandian', CM.shandian, {name:'闪电',cls:'gold',needTarget:'none'});
eq('CARD_META wanjian', CM.wanjian, {name:'万箭齐发',cls:'red',needTarget:'none'});
eq('CARD_META taoyuan', CM.taoyuan, {name:'桃园结义',cls:'green',needTarget:'none'});
eq('CARD_META 共10种', Object.keys(CM).length, 10);

// ===== 2. ROLE_NAME =====
const RN = t.ROLE_NAME;
eq('ROLE_NAME lord', RN.lord, '主公');
eq('ROLE_NAME loyal', RN.loyal, '忠臣');
eq('ROLE_NAME rebel', RN.rebel, '反贼');
eq('ROLE_NAME spy', RN.spy, '内奸');
eq('ROLE_NAME 共4种', Object.keys(RN).length, 4);

// ===== 3. rand =====
for (let i=0;i<50;i++){ const r=t.rand(6); ok('rand(6) 在 0..5', r>=0 && r<6, 'r='+r); }
ok('rand(1) 恒 0', t.rand(1)===0);

// ===== 4. shuffle =====
const arr=[1,2,3,4,5,6,7,8];
const sh=t.shuffle(arr.slice());
eq('shuffle 长度保持', sh.length, 8);
sh.sort((a,b)=>a-b);
eq('shuffle 元素不变', sh, [1,2,3,4,5,6,7,8]);

// ===== 5. findCard =====
const p1 = t.mkPlayer(99,'T','lord',4,false);
p1.hand = [{type:'sha'},{type:'tao'},{type:'sha'}];
ok('findCard sha 找到', !!t.findCard(p1,'sha'));
ok('findCard tao 找到', !!t.findCard(p1,'tao'));
ok('findCard wanjian 找不到', t.findCard(p1,'wanjian')===null);

// ===== 6. countCard =====
eq('countCard sha', t.countCard(p1,'sha'), 2);
eq('countCard tao', t.countCard(p1,'tao'), 1);
eq('countCard wanjian', t.countCard(p1,'wanjian'), 0);

// ===== 7. removeOneType =====
const c1 = t.removeOneType(p1,'sha');
ok('removeOneType 返回 sha', c1 && c1.type==='sha');
eq('removeOneType 后 sha 计数', t.countCard(p1,'sha'), 1);
const c2 = t.removeOneType(p1,'wanjian');
ok('removeOneType 无则 null', c2===null);

// ===== 8. removeFromHand =====
const card = p1.hand[0];
t.removeFromHand(p1, card);
ok('removeFromHand 后不含该引用', p1.hand.indexOf(card)<0);

// ===== 9. aliveOthers =====
t.newGame();
eq('aliveOthers 主公视角 3人', t.aliveOthers(t.getPlayers()[0]).length, 3);
t.getPlayers()[1].dead = true;
eq('aliveOthers 杀1后 2人', t.aliveOthers(t.getPlayers()[0]).length, 2);

// ===== 10. shaLimit =====
const pl = t.mkPlayer(0,'T','lord',4,true);
eq('shaLimit 无武器 1', t.shaLimit(pl), 1);
pl.equip.weapon = true;
eq('shaLimit 有武器 2', t.shaLimit(pl), 2);

// ===== 11. busy =====
t.newGame();
ok('busy 初始 false', !t.busy());
t.setPendingResponse({player:t.getPlayers()[0]});
ok('busy 有 pendingResponse true', t.busy());
t.setPendingResponse(null);
t.setCurrent(1);
ok('busy AI 回合 true', t.busy());
t.setCurrent(0);

// ===== 12. buildDeck =====
const d = t.buildDeck();
eq('buildDeck 46 张', d.length, 46);
const counts = {};
d.forEach(c => counts[c.type] = (counts[c.type]||0)+1);
eq('buildDeck sha 14', counts.sha, 14);
eq('buildDeck shan 8', counts.shan, 8);
eq('buildDeck tao 5', counts.tao, 5);
eq('buildDeck weapon 3', counts.weapon, 3);
eq('buildDeck armor 3', counts.armor, 3);
eq('buildDeck juedou 3', counts.juedou, 3);
eq('buildDeck guohe 3', counts.guohe, 3);
eq('buildDeck shandian 2', counts.shandian, 2);
eq('buildDeck wanjian 3', counts.wanjian, 3);
eq('buildDeck taoyuan 2', counts.taoyuan, 2);
const ids = new Set(d.map(c=>c.id));
eq('buildDeck id 唯一', ids.size, 46);

// ===== 13. mkPlayer =====
const mp = t.mkPlayer(7,'测试','rebel',3,false);
eq('mkPlayer id', mp.id, 7);
eq('mkPlayer name', mp.name, '测试');
eq('mkPlayer role', mp.role, 'rebel');
eq('mkPlayer hp', mp.hp, 3);
eq('mkPlayer maxHp', mp.maxHp, 3);
eq('mkPlayer hand 空', mp.hand.length, 0);
eq('mkPlayer equip.weapon false', mp.equip.weapon, false);
eq('mkPlayer equip.armor false', mp.equip.armor, false);
eq('mkPlayer armorBlock false', mp.armorBlock, false);
eq('mkPlayer dead false', mp.dead, false);
eq('mkPlayer isHuman false', mp.isHuman, false);

// ===== 14. newGame =====
t.newGame();
eq('newGame 4 玩家', t.getPlayers().length, 4);
eq('newGame 主公 4血', t.getPlayers()[0].hp, 4);
eq('newGame 主公是主公', t.getPlayers()[0].role, 'lord');
eq('newGame 主公是人类', t.getPlayers()[0].isHuman, true);
ok('newGame AI 不是人类', !t.getPlayers()[1].isHuman);
const aiRoles = t.getPlayers().slice(1).map(p=>p.role).sort();
eq('newGame AI 身份组合', aiRoles, ['loyal','rebel','spy']);
const aiHp = t.getPlayers().slice(1).map(p=>p.hp).sort();
eq('newGame AI 血量 {3,3,4}', aiHp, [3,3,4]);
// 主公 4 初始 + 2 摸牌 = 6；AI 4 初始
eq('newGame 主公 6手牌(4初始+2摸牌)', t.getPlayers()[0].hand.length, 6);
t.getPlayers().slice(1).forEach((p,i) => eq('newGame AI'+i+' 4手牌', p.hand.length, 4));
eq('newGame current=0', t.getCurrent(), 0);
eq('newGame phase=play', t.getPhase(), 'play');
ok('newGame 未结束', !t.getGameOver());
ok('newGame deck 有余', t.getDeck().length > 0);
eq('newGame discard 空', t.getDiscard().length, 0);

// ===== 15. nextAlive =====
t.newGame();
eq('nextAlive 0→1', t.nextAlive(0), 1);
eq('nextAlive 1→2', t.nextAlive(1), 2);
eq('nextAlive 2→3', t.nextAlive(2), 3);
eq('nextAlive 3→0', t.nextAlive(3), 0);
t.getPlayers()[1].dead = true;
eq('nextAlive 跳过死 0→2', t.nextAlive(0), 2);
eq('nextAlive 跳过死 3→0', t.nextAlive(3), 0);
t.getPlayers()[0].dead = true;
t.getPlayers()[2].dead = true;
t.getPlayers()[3].dead = true;
eq('nextAlive 全死 -1', t.nextAlive(0), -1);

// ===== 16. dealDamage =====
t.newGame();
const before = t.getPlayers()[1].hp;
t.dealDamage(t.getPlayers()[1], 2, t.getPlayers()[0]);
eq('dealDamage hp-2', t.getPlayers()[1].hp, before-2);
ok('dealDamage 未死', !t.getPlayers()[1].dead);
t.dealDamage(t.getPlayers()[1], 99, t.getPlayers()[0]);
eq('dealDamage 致死 hp=0', t.getPlayers()[1].hp, 0);
ok('dealDamage 致死 dead=true', t.getPlayers()[1].dead);

// ===== 17. die =====
t.newGame();
t.die(t.getPlayers()[1], t.getPlayers()[0]);
ok('die dead=true', t.getPlayers()[1].dead);
eq('die hp=0', t.getPlayers()[1].hp, 0);
t.die(t.getPlayers()[1], t.getPlayers()[0]);
ok('die 重复 idempotent', t.getPlayers()[1].dead);

// ===== 18. checkWin：主公死 + 只剩内奸 = 内奸胜 =====
t.newGame();
t.getPlayers()[0].dead = false; t.getPlayers()[0].hp = 4;
t.getPlayers()[1].dead = true;
t.getPlayers()[2].dead = true;
t.getPlayers()[3].dead = false;
t.getPlayers()[1].role = 'loyal';
t.getPlayers()[2].role = 'rebel';
t.getPlayers()[3].role = 'spy';
t.setGameOver(false);
t.die(t.getPlayers()[0], t.getPlayers()[3]);
ok('checkWin 主公死+只剩内奸=内奸胜', t.getResult()==='内奸');

// 主公死 + 反贼存活 = 反贼胜
t.newGame();
t.getPlayers()[0].dead = false; t.getPlayers()[0].hp = 4;
t.getPlayers()[1].role = 'rebel'; t.getPlayers()[1].dead = false;
t.getPlayers()[2].role = 'rebel'; t.getPlayers()[2].dead = false;
t.getPlayers()[3].role = 'loyal'; t.getPlayers()[3].dead = true;
t.setGameOver(false);
t.die(t.getPlayers()[0], t.getPlayers()[1]);
ok('checkWin 主公死+反贼活=反贼胜', t.getResult()==='反贼');

// 反贼+内奸全死 = 主公胜
t.newGame();
t.getPlayers()[0].dead = false; t.getPlayers()[0].hp = 4;
t.getPlayers()[1].role = 'loyal'; t.getPlayers()[1].dead = false;
t.getPlayers()[2].role = 'rebel'; t.getPlayers()[2].dead = true;
t.getPlayers()[3].role = 'spy'; t.getPlayers()[3].dead = true;
t.setGameOver(false);
t.checkWin();
ok('checkWin 反贼+内奸全死=主公胜', t.getResult()==='主公 + 忠臣');

// ===== 19. bestAttackTarget =====
t.newGame();
t.getPlayers()[1].role = 'rebel';
t.getPlayers()[1].dead = false;
let atk = t.bestAttackTarget(t.getPlayers()[1]);
eq('bestAttackTarget rebel 指主公', atk && atk.id, 0);
t.getPlayers()[1].role = 'spy';
atk = t.bestAttackTarget(t.getPlayers()[1]);
eq('bestAttackTarget spy 指主公', atk && atk.id, 0);
// loyal 指向其他非主公低血量
t.getPlayers()[1].role = 'loyal';
t.getPlayers()[2].role = 'rebel'; t.getPlayers()[2].hp = 1; t.getPlayers()[2].dead = false;
t.getPlayers()[3].role = 'rebel'; t.getPlayers()[3].hp = 3; t.getPlayers()[3].dead = false;
atk = t.bestAttackTarget(t.getPlayers()[1]);
eq('bestAttackTarget loyal 指低血量', atk && atk.id, 2);
// 主公死时 rebel/spy 不指向主公
t.getPlayers()[0].dead = true;
t.getPlayers()[1].role = 'rebel';
atk = t.bestAttackTarget(t.getPlayers()[1]);
ok('bestAttackTarget 主公死 不返回主公', !atk || atk.id!==0);

// ===== 20. someoneHurt =====
t.newGame();
ok('someoneHurt 初始全员满血 false', !t.someoneHurt());
t.getPlayers()[1].hp = 1;
ok('someoneHurt 有伤员 true', t.someoneHurt());

// ===== 21. decideAiAction =====
t.newGame();
const p = t.getPlayers()[1];
// 残血 + tao → tao
p.hp = 1; p.maxHp = 3;
p.hand = [{type:'tao',id:1}];
p.equip.weapon = false; p.equip.armor = false;
let act = t.decideAiAction(p);
ok('decideAi 残血+tao → tao', act && act.k==='tao');
// 满血 + weapon → equip
p.hp = 3; p.maxHp = 3;
p.equip.weapon = false;
p.hand = [{type:'weapon',id:2}];
act = t.decideAiAction(p);
ok('decideAi 满血+weapon → equip', act && act.k==='equip');
// 满血 + armor → equip
p.equip.armor = false;
p.hand = [{type:'armor',id:3}];
act = t.decideAiAction(p);
ok('decideAi 满血+armor → equip', act && act.k==='equip');
// sha + 目标
p.equip.weapon = false; p.equip.armor = false;
p.hand = [{type:'sha',id:4}];
p.role = 'rebel';
t.setShaPlayedThisTurn(0);
act = t.decideAiAction(p);
ok('decideAi rebel+sha → sha', act && act.k==='sha');
// sha 用尽 → null
t.setShaPlayedThisTurn(1);
p.hand = [{type:'sha',id:5}];
act = t.decideAiAction(p);
ok('decideAi sha用尽 → null', act===null);
// 无牌 → null
t.setShaPlayedThisTurn(0);
p.hand = [];
act = t.decideAiAction(p);
ok('decideAi 无牌 → null', act===null);

// ===== 22. autoDiscard =====
t.newGame();
const ap = t.getPlayers()[1];
ap.hp = 2;
ap.hand = [{type:'shan',id:1},{type:'shan',id:2},{type:'shan',id:3},{type:'sha',id:4},{type:'tao',id:5}];
t.autoDiscard(ap);
eq('autoDiscard 弃至 hp 张', ap.hand.length, 2);
ok('autoDiscard 优先弃shan 保留高优先级', ap.hand.every(c=>c.type!=='shan'));

// ===== 23. doPlay：tao 回血 =====
t.newGame();
const p0 = t.getPlayers()[0];
p0.hp = 2; p0.maxHp = 4;
const tao = {type:'tao',id:100};
t.doPlay(p0, tao, 0);
eq('doPlay tao 回血', p0.hp, 3);
ok('doPlay tao 进弃牌', t.getDiscard().indexOf(tao)>=0);
// tao 满血无效
t.newGame();
const p0b = t.getPlayers()[0];
p0b.hp = 4; p0b.maxHp = 4;
const tao2 = {type:'tao',id:101};
t.doPlay(p0b, tao2, 0);
eq('doPlay tao 满血不回血', p0b.hp, 4);
// weapon 装备
t.newGame();
const p0c = t.getPlayers()[0];
const w = {type:'weapon',id:102};
t.doPlay(p0c, w, 0);
eq('doPlay weapon 装备', p0c.equip.weapon, true);
// armor 装备 + armorBlock
const a = {type:'armor',id:103};
t.doPlay(p0c, a, 0);
eq('doPlay armor 装备', p0c.equip.armor, true);
eq('doPlay armor armorBlock=true', p0c.armorBlock, true);
// guohe 拆桥
t.newGame();
const p0d = t.getPlayers()[0];
const p1d = t.getPlayers()[1];
p1d.hand = [{type:'sha',id:200}];
const gh = {type:'guohe',id:104};
t.doPlay(p0d, gh, 1);
eq('doPlay guohe 弃对方1张', p1d.hand.length, 0);
// guohe 对方无手牌
t.newGame();
const p0d2 = t.getPlayers()[0];
const p1d2 = t.getPlayers()[1];
p1d2.hand = [];
const gh2 = {type:'guohe',id:105};
t.doPlay(p0d2, gh2, 1);
eq('doPlay guohe 对方无手牌不报错', p1d2.hand.length, 0);
// shandian 闪电
t.newGame();
const p0e = t.getPlayers()[0];
const before2 = t.getPlayers().slice(1).reduce((s,p)=>s+p.hp,0);
const sd = {type:'shandian',id:106};
t.doPlay(p0e, sd, -1);
const after2 = t.getPlayers().slice(1).reduce((s,p)=>s+p.hp,0);
ok('doPlay shandian 造成伤害', after2 < before2 || t.getPlayers().slice(1).some(p=>p.dead));
// taoyuan 桃园结义
t.newGame();
const p0f = t.getPlayers()[0];
t.getPlayers().forEach(p => { p.hp = 1; });
const ty = {type:'taoyuan',id:107};
t.doPlay(p0f, ty, -1);
ok('doPlay taoyuan 全员回血+1', t.getPlayers().every(p=>p.hp>=2));

// ===== 24. doPlay sha 响应链 =====
// AI 无闪 → 直接受伤
t.newGame();
const p0h = t.getPlayers()[0];
const p1h = t.getPlayers()[1];
p1h.hand = [];
const beforeHp = p1h.hp;
t.doPlay(p0h, {type:'sha',id:300}, 1);
eq('doPlay sha AI无闪直接受伤', p1h.hp, beforeHp-1);
// AI 有闪 → 出闪不受伤
t.newGame();
const p0i = t.getPlayers()[0];
const p1i = t.getPlayers()[1];
p1i.hand = [{type:'shan',id:301}];
const beforeHp2 = p1i.hp;
t.doPlay(p0i, {type:'sha',id:302}, 1);
eq('doPlay sha AI有闪出闪不受伤', p1i.hp, beforeHp2);
eq('doPlay sha AI闪消耗', p1i.hand.length, 0);
// 防具格挡
t.newGame();
const p0j = t.getPlayers()[0];
const p1j = t.getPlayers()[1];
p1j.equip.armor = true; p1j.armorBlock = true;
p1j.hand = [];
const beforeHp3 = p1j.hp;
t.doPlay(p0j, {type:'sha',id:303}, 1);
eq('doPlay sha 防具格挡不受伤', p1j.hp, beforeHp3);
ok('doPlay sha 防具消耗 armorBlock=false', !p1j.armorBlock);

// ===== 25. resolveDuel =====
// A(2sha) vs B(1sha) → B 落败
t.newGame();
const A = t.mkPlayer(10,'A','lord',4,true);
A.hand = [{type:'sha',id:1},{type:'sha',id:2}];
const B = t.mkPlayer(11,'B','rebel',4,false);
B.hand = [{type:'sha',id:3}];
t.setPlayers([A,B]);
const bHpBefore = B.hp;
t.resolveDuel(A, B);
eq('resolveDuel A(2sha) vs B(1sha) B受伤', B.hp, bHpBefore-1);
eq('resolveDuel A 消耗1sha 剩1', A.hand.filter(c=>c.type==='sha').length, 1);
eq('resolveDuel B 消耗1sha 剩0', B.hand.filter(c=>c.type==='sha').length, 0);
// A(0) vs B(0) → B 落败（ca>=cb 且 cb===0）
t.newGame();
const A2 = t.mkPlayer(10,'A','lord',4,true);
A2.hand = [{type:'tao',id:1}];
const B2 = t.mkPlayer(11,'B','rebel',4,false);
B2.hand = [{type:'tao',id:2}];
t.setPlayers([A2,B2]);
const b2Hp = B2.hp;
t.resolveDuel(A2, B2);
eq('resolveDuel A(0) vs B(0) B受伤', B2.hp, b2Hp-1);
// A(1) vs B(2) → A 落败
t.newGame();
const A3 = t.mkPlayer(10,'A','lord',4,true);
A3.hand = [{type:'sha',id:1}];
const B3 = t.mkPlayer(11,'B','rebel',4,false);
B3.hand = [{type:'sha',id:2},{type:'sha',id:3}];
t.setPlayers([A3,B3]);
const a3Hp = A3.hp;
t.resolveDuel(A3, B3);
eq('resolveDuel A(1) vs B(2) A受伤', A3.hp, a3Hp-1);

// ===== 26. resolveWanjian =====
t.newGame();
t.getPlayers().slice(1).forEach(p => p.hand = []);
const caster = t.getPlayers()[0];
const hpsBefore = t.getPlayers().slice(1).map(p=>p.hp);
t.resolveWanjian(caster);
let hurtCount = 0;
for (let i=0;i<hpsBefore.length;i++){
  const p = t.getPlayers()[i+1];
  if (p.hp < hpsBefore[i] || p.dead) hurtCount++;
}
eq('resolveWanjian 无闪全受伤', hurtCount, 3);

// ===== 27. isTargetable =====
t.newGame();
t.setPhase('play');
t.setSelCard(-1);
ok('isTargetable 无选牌 false', !t.isTargetable(1));
// sha（enemy）
t.getPlayers()[0].hand = [{type:'sha',id:1}];
t.setSelCard(0);
ok('isTargetable sha→敌人 true', t.isTargetable(1));
ok('isTargetable sha→自己 false', !t.isTargetable(0));
// 死人不可
t.getPlayers()[1].dead = true;
ok('isTargetable 死人 false', !t.isTargetable(1));
t.getPlayers()[1].dead = false;
// tao（any）
t.getPlayers()[0].hand = [{type:'tao',id:2}];
t.setSelCard(0);
ok('isTargetable tao→自己 true', t.isTargetable(0));
ok('isTargetable tao→敌人 true', t.isTargetable(1));
// weapon（self）→ 都不可选
t.getPlayers()[0].hand = [{type:'weapon',id:3}];
t.setSelCard(0);
ok('isTargetable weapon→自己 false', !t.isTargetable(0));
ok('isTargetable weapon→敌人 false', !t.isTargetable(1));
// discard 模式
t.setDiscardMode(true);
ok('isTargetable discard模式 false', !t.isTargetable(1));
t.setDiscardMode(false);
// 非 play 阶段
t.setPhase('ai');
ok('isTargetable 非play false', !t.isTargetable(1));
t.setPhase('play');

// ===== 28. performAiAction 各分支 =====
// sha
t.newGame();
const ap2 = t.getPlayers()[1];
ap2.role = 'rebel';
ap2.hp = 3; ap2.maxHp = 3;
ap2.equip.weapon = false; ap2.equip.armor = false;
t.setShaPlayedThisTurn(0);
ap2.hand = [{type:'sha',id:1}];
t.performAiAction(ap2, {k:'sha', card:ap2.hand[0], target:t.getPlayers()[0]});
eq('performAi sha 后手牌空', ap2.hand.length, 0);
eq('performAi sha 计数+1', t.getShaPlayedThisTurn(), 1);
// equip
ap2.hand = [{type:'weapon',id:2}];
t.performAiAction(ap2, {k:'equip', card:ap2.hand[0]});
eq('performAi equip 装备', ap2.equip.weapon, true);
// tao
ap2.hp = 1; ap2.maxHp = 4;
ap2.hand = [{type:'tao',id:3}];
t.performAiAction(ap2, {k:'tao', card:ap2.hand[0], target:ap2});
eq('performAi tao 回血', ap2.hp, 2);
// juedou
t.newGame();
const ap3 = t.getPlayers()[1];
ap3.hand = [{type:'juedou',id:4}];
t.getPlayers()[0].hand = [];
t.performAiAction(ap3, {k:'juedou', card:ap3.hand[0], target:t.getPlayers()[0]});
eq('performAi juedou 后手牌空', ap3.hand.length, 0);
ok('performAi juedou 主公受伤', t.getPlayers()[0].hp < 4 || t.getPlayers()[0].dead);
// wanjian
t.newGame();
const ap4 = t.getPlayers()[1];
ap4.hand = [{type:'wanjian',id:5}];
t.getPlayers().slice(2).forEach(p=>p.hand=[]);
t.performAiAction(ap4, {k:'wanjian', card:ap4.hand[0]});
eq('performAi wanjian 后手牌空', ap4.hand.length, 0);
// shandian
t.newGame();
const ap5 = t.getPlayers()[1];
ap5.hand = [{type:'shandian',id:6}];
const hpBefore5 = t.getPlayers().reduce((s,p)=>s+p.hp,0);
t.performAiAction(ap5, {k:'shandian', card:ap5.hand[0]});
const hpAfter5 = t.getPlayers().reduce((s,p)=>s+p.hp,0);
ok('performAi shandian 造成伤害', hpAfter5 < hpBefore5);
// taoyuan
t.newGame();
const ap6 = t.getPlayers()[1];
ap6.hand = [{type:'taoyuan',id:7}];
t.getPlayers().forEach(p=>{ p.hp = Math.max(1, p.hp - 3); });
t.performAiAction(ap6, {k:'taoyuan', card:ap6.hand[0]});
ok('performAi taoyuan 全员+1', t.getPlayers().every(p=>p.hp>=2));

// ===== 29. requireShan + handleResponse 人类响应链 =====
t.newGame();
const human = t.getPlayers()[0];
human.hand = [{type:'shan',id:1}];
t.setPendingResponse(null);
t.requireShan(human, false, function(){ human._dodged=true; }, function(){ human._hit=true; });
ok('requireShan 人类受击设 pending', t.getPendingResponse()!==null);
eq('requireShan pending.player', t.getPendingResponse().player, human);
t.handleResponse(true);
ok('requireShan 出闪 onDodge', human._dodged===true);
eq('requireShan 出闪后手牌空', human.hand.length, 0);
ok('requireShan 出闪后 pending 清空', t.getPendingResponse()===null);
// 承受
t.setPendingResponse({
  player: human,
  label: '杀',
  onDodge: function(){ human._dodged2 = true; },
  onHit: function(){ human._hit2 = true; }
});
t.handleResponse(false);
ok('handleResponse 承受触发 onHit', human._hit2===true);
ok('handleResponse 承受后 pending 清空', t.getPendingResponse()===null);
// gameOver 时 handleResponse 不响应
t.setGameOver(true);
t.setPendingResponse({
  player: human,
  onDodge: function(){ human._dodged3 = true; },
  onHit: function(){ human._hit3 = true; }
});
t.handleResponse(true);
ok('handleResponse gameOver不响应', human._dodged3===undefined);
t.setGameOver(false);

// ===== 30. 防具 requireShan 格挡 =====
t.newGame();
const human2 = t.getPlayers()[0];
human2.equip.armor = true; human2.armorBlock = true;
human2.hand = [];
let triggered = false;
t.requireShan(human2, true, function(){ triggered=true; }, function(){ triggered=true; });
ok('requireShan 防具格挡不触发回调', !triggered);
ok('requireShan 防具格挡 armorBlock=false', !human2.armorBlock);
ok('requireShan 防具格挡不设 pending', t.getPendingResponse()===null);

// ===== 汇总 =====
const passed = results.filter(r=>r.pass).length;
const total = results.length;
console.log(`\nsgs: ${passed}/${total} 通过`);
if (passed !== total) {
  results.filter(r=>!r.pass).forEach(r => console.log(`  ✗ ${r.name}  ${r.info}`));
  process.exit(1);
}
