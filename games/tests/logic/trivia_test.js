const { loadGame, ok, eq } = require('./harness');
const { t } = loadGame('../trivia.html');

t.setQuestions([
  { q:'1+1=', options:['1','2','3','4'], answer:1 },
  { q:'2+2=', options:['3','4','5','6'], answer:1 },
]);
eq('初始进度 0/2', t.getCurrent()!==null, true);

// 第1题答对
ok('第1题选对 → 返回 true', t.answer(1) === true);
eq('答对1题得分=1', t.getScore(), 1);

// 第2题答错
ok('第2题选错 → 返回 false', t.answer(0) === false);
eq('答错不加分 → 仍为1', t.getScore(), 1);
ok('全部答完 → 结束', t.isFinished() === true);

// ---------- 轮2：胜利 confetti 标记 ----------
{
  t.setQuestions([
    { q:'1+1=', options:['1','2','3','4'], answer:1 },
    { q:'2+2=', options:['3','4','5','6'], answer:1 },
  ]);
  t.answer(1); t.answer(1); // 全对完成
  ok('答完所有题 confettiFired 置位', t.getConfettiFired()===true);
}
{
  t.setQuestions([
    { q:'?', options:['1','2','3','4'], answer:0 },
    { q:'??', options:['1','2','3','4'], answer:0 },
  ]);
  t.answer(2); // 答错第一题，未结束
  ok('未答完不置位', t.getConfettiFired()===false);
}
