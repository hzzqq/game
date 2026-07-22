# juice.js · 可复用「游戏手感 / 留存」引擎

`games/juice.js` 是一套零依赖、离线可用的 vanilla JS 引擎，被大厅多数游戏以 `<script src="juice.js"></script>` 引入，统一提供「打击感」与留存反馈。

## 接入方式

```html
<script src="juice.js"></script>
```

```js
const J = window.Juice;
// 游戏循环里：
J.update(dt);                 // 推进粒子/闪光/震动衰减（秒）
// 渲染世界前后：
J.begin(ctx);  /* 画世界 */  J.mid(ctx);  /* 画特效 */  J.end(ctx);
// 事件里：
J.sfx('hit');  J.burst(x,y,{color:'#f0b90b'});  J.popup(x,y,'+10','#f0b90b');
J.addTrauma(.5);  J.flash('#f6465d',.4);  J.confetti(innerWidth/2, innerHeight*0.3,{n:120});
```

> 注：`confetti` 是**独立 DOM 叠层**原语，自带 `requestAnimationFrame` 循环，不依赖 `J.mid`/`J.begin`，因此即使游戏是纯 DOM 渲染（无 canvas）也能正常显示庆祝纸屑。

## 手感 API

| 方法 | 作用 |
|------|------|
| `J.sfx(name)` | WebAudio 合成音效：`hit`/`win`/`lose`/`pickup`/`levelup`/`combo`/`boom`/`click`/`error`/`shoot` |
| `J.addTrauma(a)` / `J.shake(a)` | 屏幕震动（trauma 平方衰减，短促有冲击力） |
| `J.burst(x,y,o)` | 粒子爆发（颜色/数量/速度/重力/寿命） |
| `J.ring(x,y,o)` / `J.beam(x1,y1,x2,y2,o)` | 冲击波环 / 射线光束（命中/攻击视觉强调） |
| `J.popup(x,y,text,color,o)` | 浮动文字（伤害/得分/提示） |
| `J.flash(color,a)` | 屏幕闪光（在 `J.end` 绘制） |
| `J.confetti(x,y,o)` | 庆祝纸屑（独立 DOM 叠层，opt-in） |

## 留存 API

| 方法 | 作用 |
|------|------|
| `J.best(key, score)` | 最佳分（返回 `{isNew, value}`） |
| `J.rank(score)` | 段位：青铜→白银→黄金→铂金→钻石→大师→宗师 |
| `J.achievement(text)` | 成就 toast（DOM，自动消失） |
| `J.save(k,v)` / `J.load(k,def)` | localStorage 封装（file:// 下 try 包裹） |
| `J.setMuted(m)` / `J.toggleMute()` | 全局静音（大厅静音按钮即调用此） |

## 铁律

- 引擎只提供**视觉/听觉反馈**，绝不修改任何游戏逻辑或玩法判定。
- 任何游戏接入只需在事件回调里插入 `J.*` 调用，**不改变布局/规则**。
- 在 node 测试 harness 中 `Juice` 为 no-op 桩，调用 `J.confetti/sfx/...` 不影响逻辑单测。

## 历次增强

- 初版：trauma 震动 / 粒子 / 浮动文字 / 闪光 / 合成音效 / 最佳分 / 成就 / 段位。
- 本轮：`J.confetti` 庆祝纸屑原语（独立叠层，适配纯 DOM 游戏），并接入 balatro / spire 胜利反馈。
