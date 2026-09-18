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

// ---------- 轮2：胜利 confetti 标记 ----------
{
  t.reset(); t.setWords(['a','b']);
  t.setClock(()=>0); t.submitWord('a');
  t.setClock(()=>1000); t.submitWord('b'); // 完成
  ok('完成后 confettiFired 标记置位', t.getConfettiFired()===true);
}
{
  t.reset(); t.setWords(['x','y']);
  t.submitWord('x'); // 仅完成第一词，未结束
  ok('未完成不置位', t.getConfettiFired()===false);
}

// ===== T-123：默认词表洗牌（词序不再固定）+ setRand 随机缝 =====
// 注：游戏无重开按钮（重玩=刷新页面），reset 仅在初始化调用一次；
// 测试用 setWords([]) 清词模拟新一轮（reset 对空 words 触发洗牌）。
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const order = () => { t.setWords([]); t.reset(); return JSON.stringify(t.getState().words); };
  ok('typing setRand 钩子存在', typeof t.setRand === 'function');
  t.setRand(lcg(7));     const s1 = order();
  t.setRand(lcg(7));     const s2 = order();
  t.setRand(lcg(99999)); const s3 = order();
  ok('typing 同种子词序确定', s1 === s2);
  ok('typing 不同种子词序不同', s1 !== s3);
  // 词集合不变（仅顺序变）：默认 20 词全在
  t.setRand(); const got = JSON.parse(order());
  const def = t.getDefaultWords();
  ok('typing 词集合不变（20 词全在）', got.length===def.length
    && def.every(w => got.indexOf(w)>=0));
  // setWords 精确控词不受洗牌影响
  t.setRand(lcg(7)); t.reset(); t.setWords(['b','a','c']);
  ok('typing setWords 顺序保持原样', JSON.stringify(t.getState().words)==='["b","a","c"]');
})();
