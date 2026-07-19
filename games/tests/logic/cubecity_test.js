// cubecity.html（3D 城市建设）逻辑单测
// 覆盖：常量(GRID/TILE/HALF/MAXLV)、TYPES 5 种建筑、upgradeCost、
// handleClick(建造/拆除/升级/钱不够/已占用/满级)、computeClusters(单栋/连片/对角/不同类型)、
// applyEconomy(空 grid/单栋/升级/连片/幸福度钳制/score 公式)、reset、updateHUD
const { loadGame, ok, eq, results } = require('./harness');

const t = loadGame('../cubecity.html').t;

// ===== 1. 常量 =====
eq('GRID=12', t.GRID, 12);
eq('TILE=1', t.TILE, 1);
eq('HALF=6', t.HALF, 6);
eq('MAXLV=3', t.MAXLV, 3);

// ===== 2. TYPES 5 种建筑 =====
const keys = Object.keys(t.TYPES);
eq('TYPES 5 种', keys.length, 5);
ok('residential 在列', keys.includes('residential'));
ok('commercial 在列', keys.includes('commercial'));
ok('industrial 在列', keys.includes('industrial'));
ok('park 在列', keys.includes('park'));
ok('road 在列', keys.includes('road'));

eq('residential.cost=50', t.TYPES.residential.cost, 50);
eq('residential.income=3', t.TYPES.residential.income, 3);
eq('residential.pop=20', t.TYPES.residential.pop, 20);
eq('residential.happy=2', t.TYPES.residential.happy, 2);

eq('commercial.cost=120', t.TYPES.commercial.cost, 120);
eq('commercial.income=7', t.TYPES.commercial.income, 7);
eq('commercial.pop=0', t.TYPES.commercial.pop, 0);
eq('commercial.happy=0', t.TYPES.commercial.happy, 0);

eq('industrial.cost=90', t.TYPES.industrial.cost, 90);
eq('industrial.income=12', t.TYPES.industrial.income, 12);
eq('industrial.pop=5', t.TYPES.industrial.pop, 5);
eq('industrial.happy=-4', t.TYPES.industrial.happy, -4);

eq('park.cost=40', t.TYPES.park.cost, 40);
eq('park.income=0', t.TYPES.park.income, 0);
eq('park.pop=0', t.TYPES.park.pop, 0);
eq('park.happy=6', t.TYPES.park.happy, 6);

eq('road.cost=10', t.TYPES.road.cost, 10);
eq('road.income=0', t.TYPES.road.income, 0);
eq('road.pop=0', t.TYPES.road.pop, 0);
eq('road.happy=0', t.TYPES.road.happy, 0);

// ===== 3. 初始状态 =====
t.reset();
eq('初始 money=1000', t.getMoney(), 1000);
eq('初始 population=0', t.getPopulation(), 0);
eq('初始 happiness=60', t.getHappiness(), 60);
eq('初始 incomePerSec=0', t.getIncomePerSec(), 0);
eq('初始 score=0', t.getScore(), 0);
eq('初始 selected=residential', t.getSelected(), 'residential');
ok('cells 12 行', t.getCells().length === 12);
let nullCount = 0;
for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (t.getCells()[i][j] === null) nullCount++;
eq('cells 144 个 null', nullCount, 144);

// ===== 4. upgradeCost =====
eq('upgradeCost residential lv1=40', t.upgradeCost({ type: 'residential', level: 1 }), Math.round(50 * 1 * 0.8));
eq('upgradeCost residential lv2=80', t.upgradeCost({ type: 'residential', level: 2 }), Math.round(50 * 2 * 0.8));
eq('upgradeCost residential lv3=120', t.upgradeCost({ type: 'residential', level: 3 }), Math.round(50 * 3 * 0.8));
eq('upgradeCost commercial lv1=96', t.upgradeCost({ type: 'commercial', level: 1 }), Math.round(120 * 1 * 0.8));
eq('upgradeCost industrial lv2=144', t.upgradeCost({ type: 'industrial', level: 2 }), Math.round(90 * 2 * 0.8));

// ===== 5. handleClick 建造 =====
t.reset();
t.setSelected('residential');
t.handleClick({ i: 0, j: 0 });
eq('建造 residential money 扣 50', t.getMoney(), 950);
ok('建造后 cells[0][0] 非空', t.getCells()[0][0] !== null);
eq('建造 type=residential', t.getCells()[0][0].type, 'residential');
eq('建造 level=1', t.getCells()[0][0].level, 1);

t.reset();
t.setSelected('commercial');
t.handleClick({ i: 5, j: 5 });
eq('建造 commercial money 扣 120', t.getMoney(), 880);
eq('建造 commercial type', t.getCells()[5][5].type, 'commercial');

t.reset();
t.setSelected('industrial');
t.handleClick({ i: 3, j: 3 });
eq('建造 industrial money 扣 90', t.getMoney(), 910);
eq('建造 industrial type', t.getCells()[3][3].type, 'industrial');

t.reset();
t.setSelected('park');
t.handleClick({ i: 2, j: 2 });
eq('建造 park money 扣 40', t.getMoney(), 960);
eq('建造 park type', t.getCells()[2][2].type, 'park');

t.reset();
t.setSelected('road');
t.handleClick({ i: 1, j: 1 });
eq('建造 road money 扣 10', t.getMoney(), 990);
eq('建造 road type', t.getCells()[1][1].type, 'road');

// 钱不够不建
t.reset();
t.setMoney(30);
t.setSelected('residential');
t.handleClick({ i: 0, j: 0 });
eq('钱不够 money 不变', t.getMoney(), 30);
eq('钱不够 cells 空', t.getCells()[0][0], null);

// 已占用不覆盖
t.reset();
t.setSelected('residential');
t.handleClick({ i: 0, j: 0 });
const moneyAfterBuild = t.getMoney();
t.handleClick({ i: 0, j: 0 });
eq('已占用 money 不变', t.getMoney(), moneyAfterBuild);
eq('已占用 type 不变', t.getCells()[0][0].type, 'residential');

// ===== 6. handleClick 拆除 =====
t.reset();
t.setSelected('residential');
t.handleClick({ i: 0, j: 0 });
t.setSelected('demolish');
t.handleClick({ i: 0, j: 0 });
eq('拆除 residential 卖回 25, money=975', t.getMoney(), 975);
eq('拆除后 cells 空', t.getCells()[0][0], null);

t.reset();
t.setSelected('commercial');
t.handleClick({ i: 0, j: 0 });
t.setSelected('demolish');
t.handleClick({ i: 0, j: 0 });
eq('拆除 commercial 卖回 60, money=940', t.getMoney(), 940);

t.reset();
t.setSelected('demolish');
const beforeDemo = t.getMoney();
t.handleClick({ i: 0, j: 0 });
eq('拆除空地 money 不变', t.getMoney(), beforeDemo);

// ===== 7. handleClick 升级 =====
t.reset();
t.setSelected('residential');
t.handleClick({ i: 0, j: 0 });
t.setSelected('upgrade');
t.handleClick({ i: 0, j: 0 });
eq('升级 lv1→lv2 money 扣 40, =910', t.getMoney(), 910);
eq('升级后 level=2', t.getCells()[0][0].level, 2);

t.setSelected('upgrade');
t.handleClick({ i: 0, j: 0 });
eq('升级 lv2→lv3 money 扣 80, =830', t.getMoney(), 830);
eq('升级后 level=3', t.getCells()[0][0].level, 3);

const moneyMaxLv = t.getMoney();
t.handleClick({ i: 0, j: 0 });
eq('满级不再升 money 不变', t.getMoney(), moneyMaxLv);
eq('满级 level 仍 3', t.getCells()[0][0].level, 3);

t.reset();
t.setSelected('upgrade');
const beforeUpgradeEmpty = t.getMoney();
t.handleClick({ i: 0, j: 0 });
eq('升级空地 money 不变', t.getMoney(), beforeUpgradeEmpty);

// ===== 8. computeClusters =====
t.reset();
let bonus = t.computeClusters();
let ones = 0;
for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (bonus[i][j] === 1) ones++;
eq('空 grid 全 1', ones, 144);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
bonus = t.computeClusters();
eq('单栋 bonus=1', bonus[0][0], 1);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.getCells()[0][1] = { type: 'residential', level: 1, mesh: { material: {} } };
bonus = t.computeClusters();
eq('两栋相邻 bonus[0][0]=1.25', bonus[0][0], 1.25);
eq('两栋相邻 bonus[0][1]=1.25', bonus[0][1], 1.25);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.getCells()[0][1] = { type: 'residential', level: 1, mesh: { material: {} } };
t.getCells()[0][2] = { type: 'residential', level: 1, mesh: { material: {} } };
bonus = t.computeClusters();
eq('三栋连片 bonus=1.5', bonus[0][0], 1.5);
eq('三栋连片 bonus=1.5', bonus[0][1], 1.5);
eq('三栋连片 bonus=1.5', bonus[0][2], 1.5);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.getCells()[5][5] = { type: 'residential', level: 1, mesh: { material: {} } };
bonus = t.computeClusters();
eq('不相邻 bonus[0][0]=1', bonus[0][0], 1);
eq('不相邻 bonus[5][5]=1', bonus[5][5], 1);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.getCells()[0][1] = { type: 'commercial', level: 1, mesh: { material: {} } };
bonus = t.computeClusters();
eq('不同类型 bonus[0][0]=1', bonus[0][0], 1);
eq('不同类型 bonus[0][1]=1', bonus[0][1], 1);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.getCells()[1][1] = { type: 'residential', level: 1, mesh: { material: {} } };
bonus = t.computeClusters();
eq('对角不算连片 bonus[0][0]=1', bonus[0][0], 1);
eq('对角不算连片 bonus[1][1]=1', bonus[1][1], 1);

// ===== 9. applyEconomy =====
t.reset();
t.applyEconomy();
eq('空 grid inc=0', t.getIncomePerSec(), 0);
eq('空 grid pop=0', t.getPopulation(), 0);
eq('空 grid happiness=60', t.getHappiness(), 60);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.applyEconomy();
eq('residential inc=4', t.getIncomePerSec(), 4);
eq('residential pop=20', t.getPopulation(), 20);
eq('residential happiness=62', t.getHappiness(), 62);

t.reset();
t.getCells()[0][0] = { type: 'commercial', level: 1, mesh: { material: {} } };
t.applyEconomy();
eq('commercial inc=8', t.getIncomePerSec(), 8);
eq('commercial pop=0', t.getPopulation(), 0);
eq('commercial happiness=60', t.getHappiness(), 60);

t.reset();
t.getCells()[0][0] = { type: 'industrial', level: 1, mesh: { material: {} } };
t.applyEconomy();
eq('industrial inc=13', t.getIncomePerSec(), 13);
eq('industrial pop=5', t.getPopulation(), 5);
eq('industrial happiness=56', t.getHappiness(), 56);

t.reset();
t.getCells()[0][0] = { type: 'park', level: 1, mesh: { material: {} } };
t.applyEconomy();
eq('park inc=0', t.getIncomePerSec(), 0);
eq('park happiness=66', t.getHappiness(), 66);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 2, mesh: { material: {} } };
t.applyEconomy();
eq('升级建筑 inc=6', t.getIncomePerSec(), 6);
eq('升级建筑 pop=30', t.getPopulation(), 30);
eq('升级建筑 happiness=63', t.getHappiness(), 63);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.getCells()[0][1] = { type: 'residential', level: 1, mesh: { material: {} } };
t.applyEconomy();
eq('两栋连片 inc=10', t.getIncomePerSec(), 10);
eq('两栋连片 pop=40', t.getPopulation(), 40);
eq('两栋连片 happiness=65', t.getHappiness(), 65);

t.reset();
for (let i = 0; i < 10; i++) {
  t.getCells()[0][i] = { type: 'industrial', level: 1, mesh: { material: {} } };
  t.getCells()[1][i] = { type: 'industrial', level: 1, mesh: { material: {} } };
}
t.applyEconomy();
ok('happiness 钳制下限 >=0', t.getHappiness() >= 0);
eq('happiness=0', t.getHappiness(), 0);

t.reset();
for (let i = 0; i < 12; i++) t.getCells()[0][i] = { type: 'park', level: 3, mesh: { material: {} } };
t.applyEconomy();
ok('happiness 钳制上限 <=100', t.getHappiness() <= 100);
eq('happiness=100', t.getHappiness(), 100);

t.reset();
t.setMoney(1000);
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.applyEconomy();
eq('applyEconomy 累加 money=1004', t.getMoney(), 1004);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.applyEconomy();
eq('score=1290', t.getScore(), 1290);

// ===== 10. reset =====
t.reset();
t.setSelected('residential');
t.handleClick({ i: 0, j: 0 });
t.handleClick({ i: 1, j: 1 });
ok('建造后 money<1000', t.getMoney() < 1000);
ok('建造后 cells 有建筑', t.getCells()[0][0] !== null);
t.reset();
eq('reset money=1000', t.getMoney(), 1000);
eq('reset pop=0', t.getPopulation(), 0);
eq('reset happiness=60', t.getHappiness(), 60);
eq('reset cells[0][0] null', t.getCells()[0][0], null);
eq('reset cells[1][1] null', t.getCells()[1][1], null);

// ===== 11. updateHUD =====
t.reset();
t.updateHUD();
ok('updateHUD 调用成功', true);

// ===== 12. 综合场景 =====
t.reset();
t.setSelected('residential');
t.handleClick({ i: 0, j: 0 });
t.setSelected('upgrade');
t.handleClick({ i: 0, j: 0 });
t.handleClick({ i: 0, j: 0 });
eq('综合 升到 lv3', t.getCells()[0][0].level, 3);
t.setSelected('demolish');
t.handleClick({ i: 0, j: 0 });
eq('综合 拆除 money=830+25=855', t.getMoney(), 855);
eq('综合 cells 空', t.getCells()[0][0], null);

t.reset();
t.getCells()[0][0] = { type: 'residential', level: 1, mesh: { material: {} } };
t.applyEconomy();
t.applyEconomy();
t.applyEconomy();
eq('多次 applyEconomy money=1012', t.getMoney(), 1012);

const pass = results.filter(r => r.pass).length;
const total = results.length;
console.log(`\ncubecity: ${pass}/${total} 通过`);
if (pass !== total) {
  results.filter(r => !r.pass).forEach(r => console.log(`  ✗ ${r.name}  ${r.info}`));
  process.exit(1);
}
