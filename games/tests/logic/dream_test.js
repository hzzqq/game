// 造梦西游逻辑单测：击杀掉落（回血/回蓝/狂暴）拾取生效 + 清空
const H = require('./harness');
const results = H.results;
const { t: T } = H.loadGame('../dream.html');

T.start();                       // 仅在点击时初始化 hero，单测显式拉起
var hero = T.getHero();
H.ok('dream: start() 后 hero 已初始化', !!hero && typeof hero.maxhp === 'number');

// 1) 回血：hp +25（封顶 maxhp）
hero.hp = 10;
T.spawnPickup('heal', 100, 100);
T.collectAll();
H.ok('dream: 回血 +25 封顶 (得到 ' + hero.hp + ')', hero.hp === Math.min(hero.maxhp, 35));
H.ok('dream: 拾取后清空', T.getPickups() === 0);

// 2) 回蓝：mana +30（封顶 maxmana）
hero.mana = 0;
T.spawnPickup('mana', 100, 100);
T.collectAll();
H.ok('dream: 回蓝 +30 封顶 (得到 ' + hero.mana + ')', hero.mana === Math.min(hero.maxmana, 30));

// 3) 狂暴：heroRage 置 5s
T.setRage(0);
T.spawnPickup('rage', 100, 100);
T.collectAll();
H.ok('dream: 狂暴置 5s (得到 ' + T.getRage() + ')', T.getRage() === 5);

// 4) setRage/getRage 通路
T.setRage(2);
H.ok('dream: setRage/getRage 通路 (得到 ' + T.getRage() + ')', T.getRage() === 2);

// 5) 通关彩带钩子
T.start();
T.win();
H.ok('dream: win() 后状态为 win', T.getState() === 'win');
H.ok('dream: 通关触发胜利彩带(confettiFired)', T.confettiFired());

// ===== 汇总 =====
const passed = results.filter(r=>r.pass).length;
const total = results.length;
console.log(`\ndream: ${passed}/${total} 通过`);
if (passed !== total) {
  results.filter(r=>!r.pass).forEach(r => console.log(`  ✗ ${r.name}  ${r.info}`));
  process.exit(1);
}
module.exports = {};

// --- 手感 fx 计数钩子（只读，纯追加）---
T.start();                        // 重置 fx 计数
H.ok('dream: 初始 fx 计数为 0', T.fxShakes() === 0 && T.fxBursts() === 0);
var fakeEnemy = { x:100, y:100, w:34, h:48, hp:10, dead:false, score:10 };
T.damageEnemy(fakeEnemy, 100, 1);  // 击杀敌人 → shake + burst
H.ok('dream: 击杀敌人后 fxShakes>0 (得到 ' + T.fxShakes() + ')', T.fxShakes() > 0);
H.ok('dream: 击杀敌人后 fxBursts>0 (得到 ' + T.fxBursts() + ')', T.fxBursts() > 0);
T.start();                        // 重置
H.ok('dream: start() 重置后 fx 计数为 0', T.fxShakes() === 0 && T.fxBursts() === 0);

// ===== T-153 断言薄缺口变现（mutation 基线 dream 100% 存活）=====
// 6) 攻击冷却语义：attackCd<=0 才出手，出手后 swingId+1 且置 ATTACK_CD=0.34
(() => {
  T.start();
  const s0 = T.getSwingId();
  T.tryAttack();
  H.ok('dream: 空冷攻击出手 swingId+1 (得到 ' + T.getSwingId() + ')', T.getSwingId() === s0 + 1);
  H.ok('dream: 出手后进入攻击冷却 0.34', Math.abs(T.getAttackCd() - 0.34) < 1e-9);
  T.tryAttack();                   // CD 中再按 → 不出手
  H.ok('dream: 冷却中重复攻击不出手', T.getSwingId() === s0 + 1);
})();

// 7) 技能消耗语义：mana>=25 且 skillCd<=0 才放，放后扣 25+生成弹体+置 CD=0.45
(() => {
  T.start();
  const h = T.getHero();
  h.mana = 24; h.skillCd = 0;
  T.trySkill();                    // mana 不足 → 不放
  H.ok('dream: 蓝量不足 25 技能不放', T.getProjectiles() === 0 && T.getMana() === 24);
  h.mana = 30; h.skillCd = 0;
  T.trySkill();                    // 满足 → 扣 25 出弹体
  H.ok('dream: 放技能扣蓝 30→5 (得到 ' + T.getMana() + ')', T.getMana() === 5);
  H.ok('dream: 放技能生成 1 弹体', T.getProjectiles() === 1);
  H.ok('dream: 放技能进入技能冷却 0.45', Math.abs(T.getSkillCd() - 0.45) < 1e-9);
  T.trySkill();                    // CD 中再按 → 不再生成
  H.ok('dream: 技能冷却中不重复出弹', T.getProjectiles() === 1);
})();

// 8) aabb 边界：严格不等号——恰好相切不算碰撞，重叠 1px 才算
(() => {
  const a = { x: 0, y: 0, w: 10, h: 10 };
  H.ok('dream: aabb 右缘相切不碰', T.aabb(a, { x: 10, y: 5, w: 10, h: 10 }) === false);
  H.ok('dream: aabb 左缘相切不碰', T.aabb(a, { x: -10, y: 5, w: 10, h: 10 }) === false);
  H.ok('dream: aabb 底缘相切不碰', T.aabb(a, { x: 5, y: 10, w: 10, h: 10 }) === false);
  H.ok('dream: aabb 重叠 1px 算碰', T.aabb(a, { x: 9, y: 9, w: 10, h: 10 }) === true);
})();
