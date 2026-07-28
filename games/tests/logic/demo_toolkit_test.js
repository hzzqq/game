// 参考实现 · 逻辑单测：验证 common.js 数值/洗牌工具（shuffle/clamp/lerp）端到端可用。
// 加载 games/demo/demo_toolkit.html（仅依赖 Common.*）。
const H = require('./harness');
const { t } = H.loadGame('../demo/demo_toolkit.html');

// 1) 初始状态
t.reset(1);
let s = t.getState();
H.eq('初始: 已发=0', s.dealt, 0);
H.eq('初始: 押注=10', s.bet, 10);
H.eq('初始: 手牌=0', s.handSize, 0);

// 2) 种子化洗牌确定性：同种子 → 完全相同的牌序
t.reset(42);
const deckA = t.getDeck().join(',');
t.reset(42);
const deckB = t.getDeck().join(',');
H.eq('同种子 → 同牌序（52张全同）', deckA, deckB);

// 3) 不同种子 → 牌序不同（碰撞概率 1/52! 可忽略）
t.reset(43);
H.ok('不同种子 → 牌序不同', t.getDeck().join(',') !== deckA);

// 4) 洗牌是重排：52 张不重不漏
t.reset(7);
const deck = t.getDeck();
H.eq('牌数=52', deck.length, 52);
H.eq('去重后仍 52（不重不漏）', new Set(deck).size, 52);

// 5) 发牌推进
t.reset(7);
const hand = t.deal(5);
H.eq('发 5 张到手', hand.length, 5);
H.eq('已发计数=5', t.getState().dealt, 5);
H.eq('手牌与牌堆前 5 张一致', t.getHand().join(','), deck.slice(0, 5).join(','));

// 6) 发牌上限钳位：剩 47 张时要 100 张只给 47
const big = t.deal(100);
H.eq('超发被钳位到剩余张数', big.length, 47);
H.eq('发完 52 张', t.getState().dealt, 52);

// 7) clamp 边界
H.eq('clamp 下界', t.clamp(-5, 1, 100), 1);
H.eq('clamp 上界', t.clamp(999, 1, 100), 100);
H.eq('clamp 区间内原样', t.clamp(50, 1, 100), 50);
t.reset(1);
H.eq('押注钳位: 0→1', t.setBet(0), 1);
H.eq('押注钳位: 500→100', t.setBet(500), 100);

// 8) lerp 语义
H.eq('lerp t=0 → a', t.lerp(10, 20, 0), 10);
H.eq('lerp t=1 → b', t.lerp(10, 20, 1), 20);
H.eq('lerp t=0.5 → 中点', t.lerp(10, 20, 0.5), 15);
