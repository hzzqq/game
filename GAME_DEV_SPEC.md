# 游戏大厅开发规范与改进文档（GAME_DEV_SPEC）

> 适用范围：`D:/project/play/games/*.html` 单文件 HTML5 游戏大厅。
> 本文档由 AI 在既有 155→156 款游戏、6 轮增强（难度/Boss/道具）基础上沉淀，作为后续所有迭代的**唯一标准**。
> 所有"迭代"均指：真实改代码 + 补 `window.__t` 钩子 + 写/扩逻辑单测 + 跑回归（run.js 全绿 + test-runner.js 952/952）+ 提交推送 + 追加记忆。

---

## 0. 项目铁律（违反会搞坏东西或丢数据）

1. **禁止删 `.workbuddy/` 目录**（含记忆/测试 harness）。
2. **只注入视觉/CSS/反馈/拾取增益分支，绝不改动核心玩法逻辑**（移动、碰撞、计分公式本身不动）。
3. **改之前先编译校验，改之后必跑回归测试**（`node run.js` 全绿）才能 push。
4. **git 必须用系统 git**：`export PATH="/d/Git/cmd:$PATH"`，自带 PortableGit 有 DNS 线程 bug，联网必失败。
5. **禁止 `git push --force`**。远程：`https://github.com/hzzqq/game.git` main 分支。沙箱放行 github.com，不开 `dangerouslyDisableSandbox` 也能连通（走缓存凭据）。
6. 所有 `Juice.*` 调用用 `typeof Juice!=='undefined'` 守卫（harness 用桩，逻辑单测不依赖真实 juice）。
7. 所有随机走**局部 PRNG**（mulberry32 / `mk`），禁止裸 `Math.random` 进入游戏逻辑（否则跨测试随机流污染，见下）。

## 1. 通用注入约定

- **状态与 DOM 解耦**：核心状态用普通 JS 变量（`let player, enemies...`），逻辑不依赖 DOM；`window.__t` 暴露真实闭包对象/函数供 harness 驱动。
- **Boot 陷阱**：若 `player` 仅在按钮点击的 `initGame()` 创建（非 boot 拉起），给 `window.__t` 加 `start(){ initGame(); }`，单测先 `start()` 再断言。
- **视口陷阱**：`resize()` 用 `window.innerWidth/innerHeight` 且无兜底时，harness 拿到 `undefined`→坐标 `NaN`→碰撞失败。加 `|| 800` / `|| 600` 兜底（真实浏览器不受影响）。
- **随机流隔离**：`window.__t.setRand(fn)` 注入可控 PRNG；单测依赖随机布局时必须确定性化（`setBoard`/`setRand`），避免全局 `Math.random` 跨测试共享导致顺序依赖伪失败。
- **ES 语法禁忌**（harness 用 `vm.Script` 编译）：`forEach` 嵌套箭头函数须 `);` 闭合；`eq(name, actual, expected)` 顺序；`typeof document!=='undefined'` 守卫对 truthy Proxy 无效，用 `window.addEventListener`。

## 2. 难度系统标准样板（闯关 / 有人机参与的游戏必加）

`DIFFICULTY` 用**倍率法**（normal=1.0 保持现有行为，绝不破坏既有单测）：

```javascript
var DIFFICULTY = {
  easy:   { label:'简单', speedMult:0.75, growth:1.08, bulletMult:0.6,  countMult:0.7, hpMult:0.75, dmgMult:0.8,  bossHpMult:0.7, dropMult:1.4 },
  normal: { label:'普通', speedMult:1.0,  growth:1.12, bulletMult:1.0,  countMult:1.0, hpMult:1.0,  dmgMult:1.0,  bossHpMult:1.0, dropMult:1.0 },
  hard:   { label:'困难', speedMult:1.25, growth:1.16, bulletMult:1.4,  countMult:1.3, hpMult:1.35, dmgMult:1.25, bossHpMult:1.4, dropMult:0.85 },
  hell:   { label:'地狱', speedMult:1.5,  growth:1.22, bulletMult:1.9,  countMult:1.7, hpMult:1.9,  dmgMult:1.5,  bossHpMult:1.9, dropMult:0.7 }
};
var DIFF_ORDER = ['easy','normal','hard','hell'];
var difficulty = 'normal';
function diffCfg(){ return DIFFICULTY[difficulty]; }
function setDifficulty(d){ if(!DIFFICULTY[d]) return; difficulty=d; if(typeof startGame==='function') startGame(); else if(typeof reset==='function') reset(); }
function getDifficulty(){ return difficulty; }
```

UI：`<div class="diffbar" id="diffbar"></div>` + 统一 CSS（flex 按钮条，active 高亮金色 `--gold,#ffcf5a`）。`buildDiffBar()` 渲染四档按钮，点击 `setDifficulty`。
钩子：`window.__t.DIFFICULTY / setDifficulty / getDifficulty / diffCfg / 各玩法专属 getter`。
**网格对齐坑**：pacman 幽灵速度、蛇步进等必须取网格尺寸整除数，不能用任意浮点倍率，否则 `atCenter` 对不齐导致寻路崩。

## 3. Boss 系统标准样板（动作/射击/生存类必加）

```javascript
var BOSS_EVERY = 3;
function isBossWave(w){ return w>0 && w % BOSS_EVERY === 0; }
var boss = null;
function spawnBoss(){
  boss = { x:W/2, y:60, w:Math.round(W*0.34), h:46, hp:0, maxHp:0, phase:1, vx:(90+wave*8)*diffCfg().speedMult, dir:1, downY:0, fireT:0 };
  boss.maxHp = Math.round((28+wave*6)*diffCfg().bossHpMult);
  boss.hp = boss.maxHp;
  enemies = []; // 清空普通编队
}
function updateBoss(dt){
  if(!boss) return false;
  boss.x += boss.vx*boss.dir*dt;
  if(boss.x < boss.w/2 || boss.x > W-boss.w/2){ boss.dir*=-1; boss.y += 18; }
  if(boss.phase===1 && boss.hp <= boss.maxHp/2){ boss.phase=2; boss.vx*=1.4; } // 半血狂暴
  // 玩家子弹命中扣血（在子弹循环里 boss.hp--）
  if(boss.hp<=0){ score += 100*wave; spawnPickup('rocket', boss.x, boss.y); boss=null; return true; } // 击败返回 true
  return false;
}
```

`reset()` 内 `boss=null`；`update()` 开头 `if(boss){ updatePickups(); if(!over && updateBoss(dt)){ wave++; speed*=growth; buildAliens(); } return; }`；波次推进 `if(isBossWave(wave)) spawnBoss(); else buildAliens();`。
纯躲避类（如 bullethell）用"生存耗竭型"：Boss 血条随生存时间流逝，`bossHpMult` 缩放生存时长，撑过即击败。
渲染：Boss 多边形本体（紫/红）+ 顶部血条；钩子 `BOSS_EVERY / isBossWave / spawnBoss / updateBoss / getBoss / setBossHp / setWave / addBullet`。

## 4. 道具系统标准样板（动作/街机类必加）

拾取增益分支，核心玩法不变：

```javascript
function makePickup(type, x, y){
  var sym = {rapid:'⚡',spread:'✳',shield:'🛡',life:'❤',coin:'💰',boost:'🚀',heal:'✚'}[type]||'★';
  return { type:type, x:x, y:y, r:11, sym:sym, life:9, vy: 38 };
}
function applyPickup(p){
  if(p.type==='rapid') player.rapid = 6;        // 连射计时
  else if(p.type==='spread') player.spread = 6;  // 散射计时
  else if(p.type==='shield') player.shield = (player.shield||0)+1;
  else if(p.type==='life') lives++;
  else if(p.type==='boost') player.boost = 8;
  else if(p.type==='coin') score += 50;
  else if(p.type==='heal') player.hp = Math.min(player.maxhp, player.hp+1);
}
function updatePickups(dt){
  for(var i=pickups.length-1;i>=0;i--){ var p=pickups[i]; p.y += p.vy*dt; p.life-=dt;
    if(p.life<=0 || p.y>H){ pickups.splice(i,1); continue; }
    if(Math.abs(p.x-player.x)<player.r+p.r && Math.abs(p.y-player.y)<player.r+p.r){ applyPickup(p); pickups.splice(i,1); if(J)J.sfx('pickup'); }
  }
}
```

`state/reset` 加 `pickups/boostTimer/shield/spawnTimer` 并初始化；`update(dt)` 按 `spawnTimer` 随机 `spawnPickupAtRandom()`，末尾 `updatePickups(dt)`；碰撞受击分支抽 `takeHit(i)` 独立函数，护盾优先消耗、无盾才扣血；`render` 在玩家前画 `drawPickup`（辉光圆+emoji）；HUD 加 BUFF 指示。
钩子：`spawnPickup / applyPickup / stepPickups / getPickups / getShield / setShield / getBoost / setBoost`。
选型：适合有移动玩家/载具、有敌人/障碍、有 score/hp 的可增益游戏；**跳过**联机对战需双端同步的、放置经营类、纯棋牌解谜（2048/chess/sudoku）。

## 5. 特效标准（只改渲染层）

- 粒子：`Juice.burst(x,y,{color,n})` 守卫调用；爆炸/击杀/拾取各补粒子。
- 屏震：`Juice.shake(amt)` 守卫，Boss 登场/受击/爆炸触发。
- 胜利彩带：isWin 时 `Juice.confetti()`，覆盖所有有胜利态的游戏。
- 拖尾：高速物体（子弹、玩家冲刺）画半透明历史点。
- 所有特效必须 `typeof Juice!=='undefined'` 守卫，逻辑单测不依赖。

## 6. 建模标准（只改绘制层）

- 复古游戏用**多边形/路径**绘制角色（triangle/ship/hex），替代纯色方块。
- 玩家载具/主角加 1~2 层高光与描边，提升辨识度。
- Boss / 敌人按 phase 变色（phase2 转红/紫）。
- 不引入外部图片资源（保持单文件离线可玩）。

## 7. 测试与验收标准

- 每个被改游戏在 `games/tests/logic/<game>_test.js` 有断言：`window.__t` 驱动，`H.loadGame('../<game>.html')`。
- 断言覆盖：新能力生效数值、未触发不生效、使用后移除/计时递减、边界（护盾免死/无盾扣血/Boss 阶段切换/击败奖励）。
- **语法**：`new vm.Script(code)` 编译内联 `<script>` 确认 SYNTAX OK（临时脚本跑完即删）。
- **全量回归**：`node games/tests/logic/run.js` 必须全绿（基线持续增长，当前 4043+）；`node games/tests/test-runner.js` 必须 952/952。
- **浏览器冒烟**（关键批次后）：playwright 加载页驱动到目标态，断言 0 报错、diffbar/Boss/道具渲染存在。
- 测试失败**先修代码**，不删断言掩盖问题。

## 8. 迭代 Backlog（40 项，按类别排队，逐条执行）

### P. 道具系统铺开（18）
- P1 crossyroad（coin/shield）— 进行中
- P2 centipede（rapid/shield/life）
- P3 lunarlander（fuel/score）
- P4 runner（coin/boost/shield）
- P5 frogger（fly/life）
- P6 doodlejump（spring/rocket/shield）
- P7 jetpack（coin/boost/shield）
- P8 geometrydash（orb/shield）
- P9 tempprun（prop）
- P10 subwaysuroffers（coin/boost）
- P11 jumpjump（prop）
- P12 climb（prop）
- P13 plumber（prop）
- P14 bomberman（prop）
- P15 pong（powerups）
- P16 arkanoid（multiball/expand）
- P17 asteroids（prop）
- P18 galaga 已做，复核

### B. Boss 系统铺开（8）
- B1 plane（多阶段增强既有 bossbar）
- B2 galaga（boss）
- B3 asteroids（boss）
- B4 centipede（head boss）
- B5 runner（sub-boss）
- B6 crossyroad（eagle boss）
- B7 frogger（crocodile king）
- B8 doodlejump（boss）

### D. 难度选择填补（6）
- D1 crossyroad · D2 frogger · D3 runner · D4 doodlejump · D5 geometrydash · D6 jetpack

### E. 特效增强（4）
- E1 粒子升级（5 款）· E2 屏震升级 · E3 胜利彩带覆盖 +10 款 · E4 拖尾特效（5 款）

### M. 建模精细化（2）
- M1 多边形建模（5 款复古）· M2 sprite 造型（5 款）

### N. 新游戏（2）
- N1 snake-battle-ai（人机贪吃蛇）· N2 memory-cards（翻牌记忆）

> 合计 40 项。每完成一项打勾并 commit；每 1~2 类跑一次全量回归 + 推送。

## 9. 收尾纪律
- 每批在 `.workbuddy/memory/2026-MM-DD.md` 追加记录（改动点、验证结果、commit hash）。
- 任务多时用 TaskCreate 跟踪，做完逐个 completed。
- 反模式：改核心玩法 ❌ / 用自带 git ❌ / 给不适配游戏硬塞 ❌ / 跳过钩子与单测 ❌。
