// 造梦西游逻辑单测：击杀掉落（回血/回蓝/狂暴）拾取生效 + 清空
const H = require('./harness');
const { t: T } = H.loadGame('../dream.html');

T.start();                       // 仅在点击时初始化 hero，单测显式拉起
var hero = T.getHero();
H.ok(!!hero && typeof hero.maxhp === 'number', 'dream: start() 后 hero 已初始化');

// 1) 回血：hp +25（封顶 maxhp）
hero.hp = 10;
T.spawnPickup('heal', 100, 100);
T.collectAll();
H.ok(hero.hp === Math.min(hero.maxhp, 35), 'dream: 回血 +25 封顶 (得到 ' + hero.hp + ')');
H.ok(T.getPickups() === 0, 'dream: 拾取后清空');

// 2) 回蓝：mana +30（封顶 maxmana）
hero.mana = 0;
T.spawnPickup('mana', 100, 100);
T.collectAll();
H.ok(hero.mana === Math.min(hero.maxmana, 30), 'dream: 回蓝 +30 封顶 (得到 ' + hero.mana + ')');

// 3) 狂暴：heroRage 置 5s
T.setRage(0);
T.spawnPickup('rage', 100, 100);
T.collectAll();
H.ok(T.getRage() === 5, 'dream: 狂暴置 5s (得到 ' + T.getRage() + ')');

// 4) setRage/getRage 通路
T.setRage(2);
H.ok(T.getRage() === 2, 'dream: setRage/getRage 通路 (得到 ' + T.getRage() + ')');

module.exports = {};
