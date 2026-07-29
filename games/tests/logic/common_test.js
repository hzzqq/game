// common_test.js — 锁住 games/common.js 共享工具的纯逻辑行为（node 直跑，无需 DOM）。
// 仅在无 localStorage 环境下验证「安全兜底 + 确定性 + 范围」，不渲染。
const H = require('./harness');
const Common = require('../../common.js');

// mulberry32 确定性
const r1 = Common.mulberry32(123), r2 = Common.mulberry32(123);
H.ok('mulberry32 同种子产生同序列', r1() === r2() && r1() === r2());

// shuffle：原地 + 仍为同元素集合
const a = [1, 2, 3, 4, 5], b = a.slice();
Common.shuffle(a, Common.mulberry32(7));
H.ok('shuffle 长度不变', a.length === 5);
H.ok('shuffle 仍是同元素集合', a.slice().sort((x, y) => x - y).join() === b.slice().sort((x, y) => x - y).join());

// clamp / lerp
H.ok('clamp 低于下限取下限', Common.clamp(-1, 0, 10) === 0);
H.ok('clamp 高于上限取上限', Common.clamp(20, 0, 10) === 10);
H.ok('lerp 中点正确', Common.lerp(0, 10, 0.5) === 5);

// pick / chance：确定性 + 范围
const r = Common.mulberry32(42), arr = ['x', 'y', 'z'];
let allIn = true;
for (let i = 0; i < 300; i++) { if (arr.indexOf(Common.pick(arr, r)) < 0) allIn = false; }
H.ok('pick 始终返回数组内元素', allIn);
let boolOk = true;
for (let i = 0; i < 300; i++) { if (typeof Common.chance(0.5, r) !== 'boolean') boolOk = false; }
H.ok('chance 返回布尔', boolOk);

// ScreenShake：衰减到停止
const sh = Common.ScreenShake({ mag: 5, decay: 0.5 });
sh.add(10);
let stopped = false;
for (let i = 0; i < 40; i++) { sh.update(0.016); if (!sh.active()) { stopped = true; break; } }
H.ok('ScreenShake 衰减后停止', stopped);

// Storage：无 localStorage 环境安全兜底
H.ok('Storage.get 无环境返回默认', Common.Storage.get('nope', 'best', 0) === 0);
H.ok('Storage.best 无环境返回传入值', Common.Storage.best('nope', 7) === 7);
H.ok('Storage.key 命名空间化', Common.Storage.key('game1', 'best') === 'game:game1:best');

module.exports = {};
