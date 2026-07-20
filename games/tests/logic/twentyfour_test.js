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
