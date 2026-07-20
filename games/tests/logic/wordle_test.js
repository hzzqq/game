const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../wordle.html');

// 反馈规则
t.setSolution('CRANE');
eq('全中全绿', JSON.stringify(t.feedback('CRANE')), JSON.stringify(['g','g','g','g','g']));
eq('部分绿黄', JSON.stringify(t.feedback('SLATE')), JSON.stringify(['x','x','g','x','g']));

// 重复字母处理：ALLOY vs LLAMA
t.setSolution('ALLOY');
const fb = t.feedback('LLAMA');
eq('L绿L黄A黄', JSON.stringify(fb), JSON.stringify(['y','g','y','x','x']));

// 猜中即胜
t.setSolution('APPLE');
t.guess('APPLE');
ok('已结束', t.isOver());
ok('猜中', t.isWon());

// 六次未中
t.setSolution('BRICK');
for(let i=0;i<6;i++) t.guess('ZZZZZ');
ok('已结束', t.isOver());
ok('未中', !t.isWon());
