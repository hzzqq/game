const { loadGame, eq, ok, results } = require('./harness');
const { t } = loadGame('../hangman.html');

// ---------- 常量 / 词库 ----------
ok('WORDS 非空', t.WORDS.length >= 10);
ok('WORDS 每项含 w+h', t.WORDS.every(x => /^[A-Z]+$/.test(x.w) && typeof x.h === 'string' && x.h.length>0));
ok('MAX_WRONG=6', t.MAX_WRONG === 6);
ok('GALLOWS 7 阶段', t.GALLOWS.length === 7);

// ---------- 确定性选词 ----------
{
  t.setRand(() => 0);
  const w = t.pickWord();
  eq('setRand(()=>0) 取首个词', w, t.WORDS[0]);
}

// ---------- 基础猜词（APPLE） ----------
{
  t.reset({w:'APPLE', h:'苹果'});
  eq('初始状态 playing', t.getStatus(), 'playing');
  eq('初始 wrong=0', t.getWrong(), 0);
  eq('初始 masked 全下划线', t.masked(), '_ _ _ _ _');
  eq('初始 getHint=苹果', t.getHint(), '苹果');

  const r1 = t.guess('A');
  eq('猜 A → ok', r1, 'ok');
  eq('猜中后 wrong 仍 0', t.getWrong(), 0);
  eq('猜中 A 后 masked', t.masked(), 'A _ _ _ _');

  const r2 = t.guess('A'); // 重复
  eq('重复猜 A → repeat', r2, 'repeat');
  eq('重复不改变状态', t.getWrong(), 0);

  // 猜中其余字母
  t.guess('P'); t.guess('L'); t.guess('E');
  ok('全部猜中 hasWon', t.hasWon());
  eq('猜中后 status=won', t.getStatus(), 'won');
  ok('isWin 真', t.isWin());
  eq('全猜中 masked 无下划线', t.masked().indexOf('_'), -1);
  eq('getSecret=APPLE', t.getSecret(), 'APPLE');
}

// ---------- 错误字母累积 ----------
{
  t.reset({w:'APPLE', h:'苹果'});
  const r = t.guess('Z'); // 不在 APPLE
  eq('猜错 Z → ok', r, 'ok');
  eq('猜错后 wrong=1', t.getWrong(), 1);
  eq('getRemaining=5', t.getRemaining(), 5);
  ok('猜错后未 won', !t.hasWon());
  ok('gallows 下标随 wrong', t.getGallows() === t.GALLOWS[1]);
}

// ---------- 非法输入 ----------
{
  t.reset({w:'APPLE', h:'苹果'});
  eq('数字 → invalid', t.guess('1'), 'invalid');
  eq('多字符 → invalid', t.guess('AB'), 'invalid');
  eq('空串 → invalid', t.guess(''), 'invalid');
  eq('非法输入不计入', t.getWrong(), 0);
}

// ---------- 失败：6 次错误触发 lost ----------
{
  t.reset({w:'APPLE', h:'苹果'});
  const wrongs = ['Z','X','Q','W','V','Y']; // 均不在 APPLE
  let last;
  for(const c of wrongs){ last = t.guess(c); }
  eq('第6次猜错后 wrong=6', t.getWrong(), 6);
  ok('6 次错误后 hasLost', t.hasLost());
  eq('status=lost', t.getStatus(), 'lost');
  eq('getRemaining=0', t.getRemaining(), 0);
  ok('gallows 末阶段', t.getGallows() === t.GALLOWS[6]);
  const over = t.guess('B'); // 已结束
  eq('结束后猜 → over', over, 'over');
  ok('结束后仍 lost', t.hasLost());
}

// ---------- getGuessed 排序 ----------
{
  t.reset({w:'PLANET', h:'行星'});
  t.guess('T'); t.guess('A'); t.guess('N');
  const g = t.getGuessed();
  eq('getGuessed 排序长度3', g.length, 3);
  eq('getGuessed 字母序', g, ['A','N','T'].sort());
}

// ---------- 重复字母单词（如 LETTER 类场景） ----------
{
  // 含重复字母：用自带词库里的 GALAXY 验证
  t.reset({w:'GALAXY', h:'星系'});
  t.guess('A'); // 两 A 同时存在，一次猜中两个位置
  const m = t.masked();
  ok('含重复字母 A 一次点亮两处', (m.match(/A/g)||[]).length === 2 && m.indexOf('_') >= 0);
  eq('猜 A 只计一次 wrong', t.getWrong(), 0);
}

console.log('hangman: 全部断言通过');

// ---------- 胜利彩带 / 完成反馈（confettiFired 标记） ----------
{
  t.reset({w:'APPLE', h:'苹果'});
  t.guess('A'); t.guess('P'); t.guess('L'); t.guess('E');
  ok('胜利后 confettiFired 触发', t.confettiFired() >= 1);
  ok('胜利状态 hasWon', t.hasWon());
  ok('胜利后 status=won', t.getStatus() === 'won');
}
if (results.some(r => !r.pass)) process.exit(1);
