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

// ===== T-120：每局随机出题（题目顺序洗牌）+ setRand 随机缝 =====
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  ok('trivia setRand 钩子存在', typeof t.setRand === 'function');
  const seq = () => { const a=[]; t.reset(); while(!t.isFinished()){ a.push(t.getCurrent().q); t.answer(0); } return a; };
  t.setRand(lcg(7));     const s1 = JSON.stringify(seq());
  t.setRand(lcg(7));     const s2 = JSON.stringify(seq());
  t.setRand(lcg(99999)); const s3 = JSON.stringify(seq());
  ok('trivia 同种子出题顺序确定', s1 === s2);
  ok('trivia 不同种子出题顺序不同', s1 !== s3);
  // 题目集合不变（仅顺序变）
  t.setRand(); t.reset();
  const got = new Set();
  while(!t.isFinished()){ got.add(t.getCurrent().q); t.answer(0); }
  ok('trivia 题目集合不变（4 题全在）', got.size === 4
    && got.has('光在真空中的速度约为？') && got.has('下列哪个是质数？')
    && got.has('水的化学式是？') && got.has('一年有多少天（平年）？'));
})();
