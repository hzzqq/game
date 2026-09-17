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

// ---- 几何 / 碰撞 / 数值工具簇 ----
H.ok('TAU == 2π', Math.abs(Common.TAU - Math.PI * 2) < 1e-12);
H.ok('deg2rad 90°==π/2', Math.abs(Common.deg2rad(90) - Math.PI / 2) < 1e-12);
H.ok('rad2deg π==180', Math.abs(Common.rad2deg(Math.PI) - 180) < 1e-12);

H.ok('dist2 勾股定理', Common.dist2(0, 0, 3, 4) === 25);
H.ok('dist 勾股定理', Common.dist(0, 0, 3, 4) === 5);
H.ok('dist2 与 dist 一致', Math.abs(Math.sqrt(Common.dist2(1, 2, 4, 6)) - Common.dist(1, 2, 4, 6)) < 1e-12);

H.ok('clamp01 下限裁到0', Common.clamp01(-0.5) === 0);
H.ok('clamp01 上限裁到1', Common.clamp01(1.5) === 1);
H.ok('clamp01 中段不变', Common.clamp01(0.5) === 0.5);

H.ok('invLerp 中点返0.5', Common.invLerp(0, 10, 5) === 0.5);
H.ok('invLerp 同点返0', Common.invLerp(3, 3, 9) === 0);

// AABB 重叠 / 分离
const R = (x, y, w, h) => ({ x, y, w, h });
H.ok('hitAABB 重叠为真', Common.hitAABB(R(0, 0, 10, 10), R(5, 5, 10, 10)) === true);
H.ok('hitAABB 相切不算重叠', Common.hitAABB(R(0, 0, 10, 10), R(10, 0, 10, 10)) === false);
H.ok('hitAABB 远离为假', Common.hitAABB(R(0, 0, 10, 10), R(50, 50, 10, 10)) === false);

// 圆形重叠
const C = (x, y, r) => ({ x, y, r });
H.ok('hitCircle 重叠为真', Common.hitCircle(C(0, 0, 5), C(8, 0, 5)) === true);
H.ok('hitCircle 外切为假', Common.hitCircle(C(0, 0, 5), C(10, 0, 5)) === false);

// 点在矩形内
H.ok('pointInRect 内部为真', Common.pointInRect(5, 5, R(0, 0, 10, 10)) === true);
H.ok('pointInRect 外部为假', Common.pointInRect(15, 5, R(0, 0, 10, 10)) === false);

// 夹角
H.ok('angle 向右为0', Math.abs(Common.angle(0, 0, 1, 0)) < 1e-12);
H.ok('angle 向下为π/2', Math.abs(Common.angle(0, 0, 0, 1) - Math.PI / 2) < 1e-12);

// roundRect：用 mock ctx 验证生成闭合路径（4 段 arcTo + closePath）
function mockCtx() {
  const calls = [];
  const noop = function () { calls.push('noop'); };
  return {
    _c: calls,
    beginPath() { calls.push('beginPath'); },
    moveTo() { calls.push('moveTo'); },
    lineTo() { calls.push('lineTo'); },
    arc() { calls.push('arc'); },
    arcTo() { calls.push('arcTo'); },
    closePath() { calls.push('closePath'); },
    save() { calls.push('save'); }, restore() { calls.push('restore'); },
    fill() { calls.push('fill'); }, stroke() { calls.push('stroke'); }, fillText() { calls.push('fillText'); },
    fillRect() { calls.push('fillRect'); }, strokeRect() { calls.push('strokeRect'); }, setLineDash() { calls.push('setLineDash'); },
    fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '', lineWidth: 1
  };
}
const mc = mockCtx();
Common.roundRect(mc, 10, 20, 100, 50, 8);
H.ok('roundRect 调用 beginPath', mc._c[0] === 'beginPath');
H.ok('roundRect 含4段arcTo', mc._c.filter(x => x === 'arcTo').length === 4);
H.ok('roundRect 以closePath收尾', mc._c[mc._c.length - 1] === 'closePath');
const mc2 = mockCtx();
Common.roundRect(mc2, 0, 0, 30, 30, { tl: 2, tr: 4, br: 6, bl: 8 });
H.ok('roundRect 分角半径仍4段arcTo', mc2._c.filter(x => x === 'arcTo').length === 4);

// ---- 格式化 ----
H.ok('fmtTime 0→0:00', Common.fmtTime(0) === '0:00');
H.ok('fmtTime 65→1:05', Common.fmtTime(65) === '1:05');
H.ok('fmtTime 605→10:05', Common.fmtTime(605) === '10:05');
H.ok('fmtTime 负值归零', Common.fmtTime(-3) === '0:00');
H.ok('fmtNum 千分位', Common.fmtNum(1234567) === '1,234,567');
H.ok('fmtNum 小数截断', Common.fmtNum(1234.9) === '1,234');

// ---- 数值便捷 ----
H.ok('sign 负/零/正', Common.sign(-5) === -1 && Common.sign(0) === 0 && Common.sign(5) === 1);
H.ok('mod 正模', Common.mod(-1, 4) === 3 && Common.mod(5, 4) === 1);
const ri = Common.randInt(1, 6, Common.mulberry32(3));
let riOk = true; for (let i = 0; i < 200; i++) { const v = Common.randInt(1, 6, Common.mulberry32(3)); if (v < 1 || v > 6) riOk = false; }
H.ok('randInt 始终在[1,6]', riOk && ri >= 1 && ri <= 6);
const ch = Common.choices(['a', 'b', 'c', 'd', 'e'], 3, Common.mulberry32(9));
H.ok('choices 返回3个且不重复', ch.length === 3 && new Set(ch).size === 3);
H.ok('approach 向上逼近', Common.approach(0, 10, 3) === 3);
H.ok('approach 不越过目标', Common.approach(8, 10, 3) === 10);
H.ok('approach 向下逼近', Common.approach(10, 0, 3) === 7);
H.ok('lerpAngle 取最短弧(350°→10°中点≈0°/2π)', Math.abs(Common.mod(Common.lerpAngle(Common.deg2rad(350), Common.deg2rad(10), 0.5), Common.TAU)) < 1e-9);

// ---- text / panel（用 mockCtx 验证调用安全、不抛错） ----
const mt = mockCtx();
let textOk = true; try { Common.text(mt, 'hi', 1, 2, { color: '#fff', align: 'center' }); } catch (e) { textOk = false; }
H.ok('text 调用不抛错', textOk);
const mp = mockCtx();
let panelOk = true; try { Common.panel(mp, 0, 0, 100, 40, { fill: '#123', stroke: '#456' }); } catch (e) { panelOk = false; }
H.ok('panel 调用不抛错', panelOk);

// ---- Sound：node 无 AudioContext → 调用安全兜底不抛错 ----
let soundOk = true; try { Common.Sound.setMuted(true); Common.Sound.beep(440, 0.1); Common.Sound.setMuted(false); } catch (e) { soundOk = false; }
H.ok('Sound 无环境安全兜底', soundOk);

// ---- Input：node 无 window → 调用安全兜底，返回 false ----
let inputOk = true, inp; try { inp = Common.Input.down('a'); Common.Input.pressed('a'); } catch (e) { inputOk = false; }
H.ok('Input 无环境安全兜底且返回false', inputOk && inp === false);

// ---- Timer ----
const tm = Common.Timer({ total: 10 });
tm.start(); tm.update(3); tm.update(2);
H.ok('Timer 倒计时正确', tm.remain() === 5);
tm.update(100);
H.ok('Timer 归零不越界', tm.remain() === 0 && tm.done() === true);
tm.pause(); const before = tm.remain(); tm.update(5);
H.ok('Timer 暂停不走动', tm.remain() === before);

// ---- State 场景机 ----
let entered = null;
const st = Common.State('menu');
st.on('play', (d) => { entered = d; });
st.def('play', () => {});
st.set('play', { lv: 2 });
H.ok('State 切换并更新', st.get() === 'play');
H.ok('State 进入回调收到数据', entered && entered.lv === 2);
H.ok('State is 判定', st.is('play') === true && st.is('menu') === false);

// ---- Y 系列新增工具：数组/数值/颜色/缓动/绘制 ----
H.ok('seq(3) 生成[0,1,2]', Common.seq(3).join() === '0,1,2');
H.ok('seq(2,5) 生成[2,3,4]', Common.seq(2, 5).join() === '2,3,4');
H.ok('sum 求和', Common.sum([1, 2, 3, 4]) === 10);
H.ok('avg 均值', Common.avg([2, 4, 6]) === 4);
H.ok('avg 空数组返0', Common.avg([]) === 0);

H.ok('wrap 同点不变', Common.wrap(5, 0, 10) === 5);
H.ok('wrap 上溢回绕', Common.wrap(11, 0, 10) === 1);
H.ok('wrap 下溢回绕', Common.wrap(-1, 0, 10) === 9);
H.ok('wrap 边界归零', Common.wrap(10, 0, 10) === 0);
H.ok('wrap 含负区间', Common.wrap(6, -5, 5) === -4);

H.ok('lerpColor 中点灰阶', JSON.stringify(Common.lerpColor([0, 0, 0], [255, 255, 255], 0.5)) === JSON.stringify([128, 128, 128]));
H.ok('lerpColor 端点', JSON.stringify(Common.lerpColor([0, 0, 0], [255, 255, 255], 0)) === JSON.stringify([0, 0, 0]));
H.ok('rgba 默认不透明', Common.rgba(255, 0, 0) === 'rgba(255,0,0,1)');
H.ok('rgba 带 alpha', Common.rgba(255, 0, 0, 0.5) === 'rgba(255,0,0,0.5)');

H.ok('easing.outCubic 端点', Common.easing.outCubic(0) === 0 && Common.easing.outCubic(1) === 1);
H.ok('easing.outCubic 中点', Math.abs(Common.easing.outCubic(0.5) - 0.875) < 1e-9);
H.ok('easing.inOutQuad 端点', Common.easing.inOutQuad(0) === 0 && Common.easing.inOutQuad(1) === 1);
H.ok('easing.inOutQuad 中点', Math.abs(Common.easing.inOutQuad(0.5) - 0.5) < 1e-9);
H.ok('easing.inOutCubic 中点', Math.abs(Common.easing.inOutCubic(0.5) - 0.5) < 1e-9);

const mc3 = mockCtx();
let circleOk = true;
try { Common.circle(mc3, 10, 20, 5); } catch (e) { circleOk = false; }
H.ok('circle 触发 arc+fill 且不抛错', circleOk && mc3._c.indexOf('arc') >= 0 && mc3._c.indexOf('fill') >= 0);


// ---- Z 系列边界加固：捕捉纯工具回归 ----
H.ok('seq 负区间 [-2,2)', Common.seq(-2, 2).join() === '-2,-1,0,1');
H.ok('sum 空数组返0', Common.sum([]) === 0);
H.ok('avg 小数均值', Common.avg([1, 2]) === 1.5);
H.ok('wrap 整倍数归零', Common.wrap(20, 0, 10) === 0 && Common.wrap(0, 0, 10) === 0);
H.ok('lerpColor t=1 取终点', JSON.stringify(Common.lerpColor([0, 0, 0], [255, 255, 255], 1)) === JSON.stringify([255, 255, 255]));
H.ok('easing.outCubic 单调递增(0.25)>0.25', Common.easing.outCubic(0.25) > 0.25);
H.ok('easing 输出有限数', [Common.easing.outCubic(0.3), Common.easing.inOutQuad(0.7), Common.easing.inOutCubic(0.9)].every(Number.isFinite));
H.ok('circle 半径0不抛错', (function () { const mc = mockCtx(); try { Common.circle(mc, 0, 0, 0); return mc._c.indexOf('arc') >= 0; } catch (e) { return false; } })());

// ---- buildDiffBar / DIFFICULTY（T-121 收口：容器缺失兜底 + 四档键一致 + 配置数值合法）----
H.ok('buildDiffBar 容器缺失返回 null', Common.buildDiffBar(null, function () {}) === null);
H.ok('DIFFICULTY 四档键完整', (function () {
  const want = ['easy', 'normal', 'hard', 'hell'];
  const keys = Object.keys(Common.DIFFICULTY);
  return keys.length === 4 && want.every(k => keys.indexOf(k) >= 0);
})());
H.ok('DIFFICULTY 各档倍率为正数', (function () {
  const fields = ['speedMult', 'growth', 'countMult', 'hpMult', 'dmgMult', 'bossHpMult', 'dropMult'];
  return Object.keys(Common.DIFFICULTY).every(k => fields.every(f => typeof Common.DIFFICULTY[k][f] === 'number' && Common.DIFFICULTY[k][f] > 0));
})());
H.ok('DIFFICULTY normal 档主倍率全 1（growth 除外=1.12 渐进）', (function () {
  const n = Common.DIFFICULTY.normal;
  const ones = ['speedMult', 'bulletMult', 'countMult', 'hpMult', 'dmgMult', 'bossHpMult', 'dropMult'];
  return ones.every(f => n[f] === 1) && n.growth === 1.12;
})());

module.exports = {};
