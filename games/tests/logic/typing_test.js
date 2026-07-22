const { loadGame, eq, ok } = require('./harness');
const { t } = loadGame('../typing.html');

// ---------- setWords / 默认词表 ----------
ok('默认词表非空', t.getDefaultWords().length>0);

// ---------- 全部正确：WPM 与准确率 ----------
{
  t.reset();
  t.setWords(['hello','world']);
  t.setClock(()=>0);
  const r1 = t.submitWord('hello');
  ok('第一词正确', r1.wordCorrect===true);
  t.setClock(()=>60000); // 1 分钟
  const r2 = t.submitWord('world');
  ok('第二词正确', r2.wordCorrect===true);
  ok('已完成', t.getState().finished===true);
  const s = t.getStats();
  eq('正确字符 10', s.wpm*1, 2); // (10/5)/1 = 2
  eq('准确率 100%', s.accuracy, 1);
  eq('完成词数 2', s.correctWords, 2);
}
// 直接断言 WPM 数值（避免浮点显示误差，用取整比较）
{
  t.reset(); t.setWords(['hello','world']);
  t.setClock(()=>0); t.submitWord('hello');
  t.setClock(()=>60000); t.submitWord('world');
  const s=t.getStats();
  ok('WPM=2', Math.round(s.wpm)===2);
}

// ---------- 含错误：准确率下降、WPM 仍按正确字符 ----------
{
  t.reset(); t.setWords(['hello','world']);
  t.setClock(()=>0); t.submitWord('hello');           // 5 正确 / 5 输入
  t.setClock(()=>60000); t.submitWord('xyz');          // 0 正确 / 3 输入（vs world）
  const s=t.getStats();
  eq('完成 1 词', s.correctWords, 1);
  eq('正确字符 5', t.getState().totalCorrectChars, 5);
  eq('输入字符 8', t.getState().totalEntryChars, 8);
  ok('准确率 5/8', Math.abs(s.accuracy-5/8)<1e-9);
  ok('WPM=1', Math.round(s.wpm)===1); // (5/5)/1 = 1
}

// ---------- 边界：完成后不再接收 ----------
{
  t.reset(); t.setWords(['a','b']);
  t.setClock(()=>0); t.submitWord('a');
  t.setClock(()=>1000); t.submitWord('b'); // finished
  const extra = t.submitWord('c');
  ok('完成后 submit 返回 finished', extra && extra.error==='finished');
  eq('idx 不越界', t.getState().idx, 2);
}

console.log('typing: 全部断言通过');
