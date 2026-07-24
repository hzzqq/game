const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../twentyfour.html');

// 可解组合
ok('(8-4)*(7-1)=24', t.solve([4,1,8,7]));
ok('5*(5-1/5)=24', t.solve([1,5,5,5]));
ok('8/(3-8/3)=24', t.solve([3,3,8,8]));

// 无解组合
ok('1,1,1,1 无解', !t.solve([1,1,1,1]));

// 算式验证
ok('(8-4)*(7-1) 得24', t.evalExpr('(8-4)*(7-1)',[8,4,7,1])===true);
ok('1+1 不等于24', t.evalExpr('1+1',[1,1,2,3])===false);
ok('非法表达式返回 null', t.evalExpr('1+',[1,1,2,3])===null);

// 回归：算式必须用满且只用给定 4 数各一次（曾可凭空输 "24" 直接判胜）
ok('直接输 24 不应判胜', t.evalExpr('24',[4,1,8,7])===false);
ok('12+12 不应判胜(用错数字)', t.evalExpr('12+12',[4,1,8,7])===false);
ok('100-76 不应判胜', t.evalExpr('100-76',[4,1,8,7])===false);
ok('8+8+8 不应判胜(重复用8且未用满)', t.evalExpr('8+8+8',[4,1,8,7])===false);
ok('正确解 (7-1)*(8-4) 判胜', t.evalExpr('(7-1)*(8-4)',[4,1,8,7])===true);

// ===== 轮5：完成彩带特效（解出触发，只读标记）=====
t.setNums([4,1,8,7]);
const tf0 = t.confettiFired;
ok('提交正确解判胜', t.submitAnswer('(8-4)*(7-1)') === true);
eq('24点解出触发彩带', t.confettiFired, tf0+1);
eq('错误解不触发彩带', t.submitAnswer('1+1') === false, true);
eq('错误解后彩带计数不变', t.confettiFired, tf0+1);
