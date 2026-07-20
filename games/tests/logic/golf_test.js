const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../golf.html');

// 直击进洞：从 (0,0) 朝 0° 力度 50 命中 (50,0) 的洞
t.reset();
t.setBall(0,0);
t.setHole(50,0);
t.setObstacles([]);
t.hit(0,50);
ok('一杆进洞', t.isInHole() === true);
eq('杆数=1', t.getStrokes(), 1);

// 力度不足：从 (0,0) 力度 30 → 停在 (30,0)，未进洞
t.reset();
t.setBall(0,0);
t.setHole(50,0);
t.hit(0,30);
ok('力度不足未进洞', t.isInHole() === false);
eq('球停在 (30,0)', t.getBall(), {x:30,y:0});

// 补杆进洞：再打 20 力度 → 到达 (50,0)
t.hit(0,20);
ok('补杆后进洞', t.isInHole() === true);
eq('总杆数=2', t.getStrokes(), 2);

// 障碍墙阻挡：x=20 处竖墙，从 (0,0) 力度 50 撞墙停在墙前
t.reset();
t.setBall(0,0);
t.setHole(50,0);
t.setObstacles([{x:20,y:-10,w:2,h:40}]); // 覆盖 y∈[-10,30]
t.hit(0,50);
ok('撞墙未进洞', t.isInHole() === false);
ok('球停在墙前(x<20)', t.getBall().x < 20);
