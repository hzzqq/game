const { loadGame, results, ok, eq } = require('./harness');
const { t } = loadGame('../words.html');

// 1. 词库
const idioms = t.getIDIOMS();
ok('词库非空', idioms.length > 50);
ok('词库全 4 字', idioms.every(w => w.length === 4));

// 2. 词库查重
eq('hasIdiom 一鸣惊人', t.hasIdiom('一鸣惊人'), true);
eq('hasIdiom 不是成语', t.hasIdiom('不是成语'), false);
eq('hasIdiom 人山人海', t.hasIdiom('人山人海'), true);

// 3. chainOk 尾字接首字
eq('chainOk 一鸣惊人→人山人海', t.chainOk('一鸣惊人','人山人海'), true);
eq('chainOk 一鸣惊人→天高地厚', t.chainOk('一鸣惊人','天高地厚'), false);
eq('chainOk 天高地厚→厚德载物', t.chainOk('天高地厚','厚德载物'), true);
eq('chainOk 厚德载物→物极必反', t.chainOk('厚德载物','物极必反'), true);
eq('chainOk 物极必反→反客为主', t.chainOk('物极必反','反客为主'), true);

// 4. comboPts 连击倍率（每 5 连 +1 倍）
eq('comboPts(0)=100', t.comboPts(0), 100);
eq('comboPts(4)=100', t.comboPts(4), 100);
eq('comboPts(5)=200', t.comboPts(5), 200);
eq('comboPts(9)=200', t.comboPts(9), 200);
eq('comboPts(10)=300', t.comboPts(10), 300);
eq('comboPts(15)=400', t.comboPts(15), 400);

// 5. newState 初始化（非 daily）
const s = t.newState(false);
eq('newState running', s.running, true);
eq('newState !over', s.over, false);
eq('newState !daily', s.daily, false);
eq('newState score=0', s.score, 0);
eq('newState combo=0', s.combo, 0);
eq('newState lives=3', s.lives, 3);
eq('newState hints=3', s.hints, 3);
eq('newState skips=2', s.skips, 2);
eq('newState rank=青铜', s.rank, '青铜');
eq('newState anchor 4字', s.anchor.length, 4);
eq('newState required=anchor[3]', s.required, s.anchor[3]);
eq('newState best=0', s.best, 0);
eq('newState wrong=[]', Array.isArray(s.wrong) && s.wrong.length, 0);
ok('newState dateKey>0', s.dateKey > 0);

// 6. newState daily
const sd = t.newState(true);
eq('newState daily=true', sd.daily, true);
ok('newState daily dateKey>0', sd.dateKey > 0);
ok('newState daily anchor 在词库', t.hasIdiom(sd.anchor));

// 7. setS/getS 读写
t.setS({ score: 999, rank: '黄金' });
eq('setS/getS score', t.getS().score, 999);
eq('setS/getS rank', t.getS().rank, '黄金');

// 8. 完成反馈（接龙成功 confetti / chainFx 标记）
{
  t.setS({ running:true, over:false, daily:false, dateKey:1, score:0, combo:0, lives:3, hints:3, skips:2, anchor:'一鸣惊人', required:'人', challenge:false, rank:'青铜', best:0, wrong:[] });
  t.submitWord('人山人海');
  const st = t.getS();
  ok('接龙成功 score 增加', st.score > 0);
  ok('接龙成功 chainFx 触发', t.chainFx() >= 1);
}

// 9. confetti 完成特效标记（接龙成功首触发，重开复位）
(function () {
  t.newState(false); // 重开 → 复位 _confettiFired=false
  t.setS({ running:true, over:false, daily:false, dateKey:1, score:0, combo:0, lives:3, hints:3, skips:2, anchor:'人山人海', required:'一', challenge:false, rank:'青铜', best:0, wrong:[] });
  ok('words: 接龙前未标记 confettiFired', t.confettiFired() === false);
  t.submitWord('一鸣惊人'); // '一' === required → 成功，首次触发
  ok('words: 接龙成功后标记 confettiFired', t.confettiFired() === true);
  t.submitWord('人山人海'); // 再次成功，标志位防重复
  ok('words: 重复接龙不重复标记（仍为 true）', t.confettiFired() === true);
  t.newState(false); // 重开
  ok('words: 重开后 confettiFired 复位 false', t.confettiFired() === false);
})();

// ===== setRand 可注入随机源（T-115：随机缝 + 确定性验证）=====
(() => {
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  ok('words setRand 钩子存在', typeof t.setRand === 'function');
  t.setRand(lcg(7));     const a1 = JSON.stringify(t.newState());
  t.setRand(lcg(7));     const a2 = JSON.stringify(t.newState());
  t.setRand(lcg(99999)); const a3 = JSON.stringify(t.newState());
  ok('words 同种子起始成语确定', a1 === a2);
  ok('words 不同种子起始成语不同', a1 !== a3);
  t.setRand();
})();

// ===== T-132：本地 Top5 排行榜（Common.HighScores 数据层）=====
{
  ok('words 排行榜 清空成功', t.clearTop5() === true);
  ok('words 排行榜 0 分不入榜', t.recordScore(0) === 0);
  ok('words 排行榜 空榜无记录', t.getTop5().length === 0);
  ok('words 排行榜 9999 上榜第 1', t.recordScore(9999) === 1);
  ok('words 排行榜 榜首=9999', t.getTop5()[0].score === 9999);
  ok('words 排行榜 8888 上榜第 2', t.recordScore(8888) === 2);
  for (let i = 0; i < 6; i++) t.recordScore(10000 + i);
  ok('words 排行榜 最多保留 5 条', t.getTop5().length === 5);
  ok('words 排行榜 截断后榜首仍最大', t.getTop5()[0].score === 10005);
  t.clearTop5();
  ok('words 排行榜 收尾清空', t.getTop5().length === 0);
}

// ===== T-132 附带：gameOver 真路径回归（浏览器 QA 抓到 $('overlay h1') 恒 null 崩溃，已修 querySelector）=====
{
  t.clearTop5();
  t.setS({ running:true, over:false, daily:false, dateKey:1, score:600, combo:0, lives:1, hints:3, skips:2, anchor:'一鸣惊人', required:'人', challenge:false, rank:'青铜', best:0, wrong:[] });
  t.submitWord('完全不对词');   // lives 1→0 → gameOver 真路径
  const st = t.getS();
  ok('words gameOver 真路径执行到底', st.over === true);
  ok('words gameOver 记录 Top5（600 上榜首）', (t.getTop5()[0] || {}).score === 600);
  t.clearTop5();
}

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nwords: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
