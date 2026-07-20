const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../asteroids.html');

t.reset();
// 子弹命中大陨石 → 裂成 2 小块、子弹消失、得分
t.setAsteroids([{ x:100, y:100, vx:0, vy:0, r:40 }]);
t.setBullets([{ x:100, y:100, vx:0, vy:0 }]);
t.step(0.016);
eq('大陨石被击中后裂成 2 块', t.getAsteroids().length, 2);
eq('子弹命中后消失', t.getBullets().length, 0);
ok('击碎大陨石得分', t.getScore() > 0);

// 边界环绕
t.reset();
t.setAsteroids([{ x:399, y:300, vx:100, vy:0, r:10 }]);
t.step(0.1); // x → 409 > 400 → 环绕回左边界附近
ok('陨石越过右边界后环绕', t.getAsteroids()[0].x < 400);

// 无碰撞：子弹与陨石远离
t.reset();
t.setAsteroids([{ x:100, y:100, vx:0, vy:0, r:10 }]);
t.setBullets([{ x:500, y:500, vx:0, vy:0 }]);
t.step(0.016);
eq('无命中时陨石数不变', t.getAsteroids().length, 1);
eq('无命中时子弹数不变', t.getBullets().length, 1);
eq('无命中不加分', t.getScore(), 0);
