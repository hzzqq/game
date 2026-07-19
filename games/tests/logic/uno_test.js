// UNO 逻辑单测：发牌/牌堆规模、多局随机模拟不抛异常且有进展（绕开万能牌选色路径）
const H = require('./harness');
const { t } = H.loadGame('../uno.html');

(() => {
  t.setN(4); t.reset();
  const st = t.getState();
  H.eq('UNO 玩家数=4', st.N, 4);
  H.ok('UNO 每人 7 张', st.hands.every(h => h === 7));
  H.eq('UNO 牌堆 108 张', t.buildDeck().length, 108);
  const h0 = t.hand(0);
  H.ok('UNO hand(0) 返回 7 张', Array.isArray(h0) && h0.length === 7);

  let total = 0, exc = 0;
  for (let trial = 0; trial < 30; trial++) {
    t.setN(2 + (trial % 3)); t.reset();
    let steps = 0;
    try {
      while (steps < 400) {
        const g = t.getState();
        if (g.gameOver) break;
        const h = t.hand(g.current);
        let played = false;
        for (let i = 0; i < h.length; i++) {
          const c = h[i];
          if (c.color === 'w') continue; // 模拟中不主动出万能牌
          const legal = (c.color === g.currentColor) || (c.value === g.currentValue);
          if (legal) { t.playCard(g.current, i); played = true; break; }
        }
        if (!played) {
          t.drawCards(g.current, 1);
          const h2 = t.hand(g.current);
          const last = h2[h2.length - 1];
          if (last && last.color !== 'w' && (last.color === t.getState().currentColor || last.value === t.getState().currentValue)) {
            t.playCard(g.current, h2.length - 1);
          } else break; // 仅剩万能牌则停本局
        }
        steps++;
      }
      total += steps;
    } catch (e) { exc++; console.log('  uno trial ' + trial + ' threw: ' + e.message); }
  }
  H.eq('UNO 30 局模拟无异常', exc, 0);
  H.ok('UNO 多局有进展(>50步)', total > 50, '(' + total + ')');
})();
