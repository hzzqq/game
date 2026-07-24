const { loadGame, eq, ok, results } = require('./harness');
const { t } = loadGame('../wordchain.html');

// ---------- 默认词库非空 ----------
ok('默认词库非空', t.getDefaultDict().length>0);

// ---------- 校验规则 ----------
{
  t.reset();
  t.setDict(['apple','elephant','tiger','rabbit','test','tree','cat']);
  ok('词库内有效（首词任意）', t.validWord('apple')===true);
  ok('不在词库无效', t.validWord('zzz')===false);
  t.play('apple');
  ok('已用无效', t.validWord('apple')===false);
  ok('首字母不符无效', t.validWord('cat')===false); // 上一步 AI 接到 elephant，末字母 t
}

// ---------- 玩家无效即负 ----------
{
  t.reset();
  t.setDict(['apple','elephant','tiger','rabbit','test','tree','cat']);
  const r = t.play('banana'); // 不在词库
  ok('无效词 valid=false', r.valid===false);
  ok('玩家负 winner=ai', t.getState().winner==='ai');
  ok('已 over', t.getState().over===true);
}

// ---------- 正常接龙 + AI 选择确定性 ----------
{
  t.reset();
  t.setDict(['apple','elephant','tiger','rabbit','test','tree']);
  t.setRand(()=>0); // 取候选列表中第一个
  const r1 = t.play('apple');          // 末字母 e
  eq('AI 接 elephant', r1.aiWord, 'elephant');
  ok('未结束', r1.over===false);
  const r2 = t.play('tiger');          // 末字母 r -> AI 接 rabbit
  eq('AI 接 rabbit', r2.aiWord, 'rabbit');
  const r3 = t.play('banana');         // 无效
  ok('玩家负', r3.winner==='ai');
}

// ---------- AI 选择可控：setRand=0.5 选第 2 个候选 ----------
{
  t.reset();
  t.setDict(['cat','tiger','tap','top']);
  t.setRand(()=>0.5); // 候选 [tiger,tap,top] 取 index1 = tap
  const r = t.play('cat'); // 末字母 t
  eq('AI 选 tap', r.aiWord, 'tap');
}

// ---------- 玩家胜：玩家合法出词后 AI 无词可接 ----------
{
  t.reset();
  t.setDict(['cat','tap','pot']);
  t.setRand(()=>0);
  const r1 = t.play('cat');   // 末字母 t -> AI 接 tap（候选仅 tap）
  eq('AI 接 tap', r1.aiWord, 'tap');
  const r2 = t.play('pot');   // 末字母 t -> 无未用候选
  ok('玩家胜 winner=player', r2.winner==='player');
  ok('已 over', r2.over===true);
  ok('aiWord 为 null', r2.aiWord===null);
}

console.log('wordchain: 全部断言通过');

// ---------- 玩家胜 胜利彩带（confettiFired 标记） ----------
{
  t.reset();
  t.setDict(['cat','tap','pot']);
  t.setRand(()=>0);
  t.play('cat');   // AI 接 tap
  t.play('pot');   // AI 无词可接 → 玩家胜
  ok('玩家胜 winner=player', t.getState().winner==='player');
  ok('玩家胜 confettiFired 触发', t.confettiFired() >= 1);
}
if (results.some(r => !r.pass)) process.exit(1);
