// 收敛门禁行为锁：验证第 7/8 不变量的检出与不误报（T-136）
// 纯函数调用（无 IO），直接对 convergence.js 导出的检测函数喂样例字符串。
const H = require('./harness');
const C = require('../convergence');

// ===== 检查 7：getElementById 型 DOM 助手误传选择器 =====
// words 崩溃原型：$ = getElementById 封装，$('overlay h1') 恒 null
var wordsLike = "function $(id){ return (typeof document!=='undefined')?document.getElementById(id):null; }\n$('overlay h1').textContent='x';";
H.eq('convergence: words 型崩溃样例被检出(1 处)', C.findGetByIdSelectorAbuse(wordsLike).length, 1);
var arrowLike = "const $=id=>document.getElementById(id); $('.foo').style.color='r';";
H.eq('convergence: 箭头型 $ + class 选择器被检出', C.findGetByIdSelectorAbuse(arrowLike).length, 1);
var hashLike = "const $ = (id) => document.getElementById(id); $('#board .cell').innerHTML='';";
H.eq('convergence: #前缀后代选择器被检出', C.findGetByIdSelectorAbuse(hashLike).length, 1);
var clean = "function $(id){ return document.getElementById(id); }\n$('overlay'); $('msg'); $('hs-board'); document.getElementById('top5Board');";
H.eq('convergence: 干净纯 id 调用不误报', C.findGetByIdSelectorAbuse(clean).length, 0);
var qsType = "const $=s=>document.querySelector(s); $('#overlay h1').textContent='x'; $('.desc').classList.add('on');";
H.eq('convergence: querySelector 型 $ 传选择器合法不误报', C.findGetByIdSelectorAbuse(qsType).length, 0);
var direct = "document.getElementById('a b').remove();";
H.eq('convergence: 直接 getElementById 传选择器被检出', C.findGetByIdSelectorAbuse(direct).length, 1);

// ===== 检查 8：H.ok 反参恒真 =====
// （毒样例源码里写成 H_ok + replace，避免字面反参形态触发门禁自指命中）
var poison = "H_ok(reached, 'icefire: CPU 驱动 P2 抵达出口')".replace('_ok', '.ok');
H.eq('convergence: H.ok(cond, name) 反参被检出', C.findHOkReversed(poison).length, 1);
var exprPoison = "H_ok(Math.abs(T.fire.x - fBefore) < 0.001, 'icefire: 不被移动')".replace('_ok', '.ok');
H.eq('convergence: 表达式开头的反参被检出', C.findHOkReversed(exprPoison).length, 1);
var good = "H.ok('icefire: CPU 驱动 P2 抵达出口', reached);";
H.eq('convergence: name-first 正参不误报', C.findHOkReversed(good).length, 0);
var concat = "H.ok('icefire: 抵达 (steps=' + psteps + ')', reached);";
H.eq('convergence: name 拼接变量的正参不误报', C.findHOkReversed(concat).length, 0);
var threeArgs = "H.ok('icefire: 抵达', reached, 'steps=' + psteps);";
H.eq('convergence: 三参调用(带 info)不误报', C.findHOkReversed(threeArgs).length, 0);
var nested = "H.ok('n: f(x,y) 校验', a > 0 && b < 2, 'x');";
H.eq('convergence: 嵌套括号/逗号的正参不误报', C.findHOkReversed(nested).length, 0);

module.exports = {};
