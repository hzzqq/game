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

// 汇总
const total = results.length;
const pass = results.filter(r => r.pass).length;
console.log(`\nwords: ${pass}/${total} 通过`);
if (pass !== total) process.exit(1);
