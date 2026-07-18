# 🎮 HTML5 游戏大厅 · Game Hub

> 一个纯前端、零构建、暗色「金融终端」风格的 HTML5 游戏合集。
> 23 款游戏 + 大厅 + 自动化测试套件，全部用原生 HTML/CSS/JS 写成，双击即玩。

## ✨ 特性

- **23 款游戏**，覆盖经典类型：益智 / 棋牌 / 动作 / 射击 / 竞速 / 解谜 / 多人竞技
- **零依赖离线运行**：绝大多数游戏为单文件内联脚本，断网也能玩
- **统一暗色终端风**：`#0a0e14` 背景、红涨绿跌配色（`#f6465d` / `#02c076` / `#f0b90b`）、等宽字体、三圆点标题栏
- **移动端适配**：viewport + 触控事件 + 虚拟按键，手机可玩
- **自动化测试**：CLI 静态检测 + 浏览器内运行断言，全套 200+ 项全绿

## 🚀 快速开始

方式一（推荐，双击即用）：
```
双击 games/启动游戏大厅.bat
```
它会用系统默认浏览器打开游戏大厅 `games/index.html`。

方式二（手动）：
```
直接用浏览器打开 games/index.html
```

方式三（本地服务，可选）：
```
cd games && python -m http.server 8000   # 然后访问 http://localhost:8000
```

## 🎯 游戏清单（23 款）

| 卡片 | 游戏 | 类型 | 文件 |
|----|------|------|------|
| A | 2048 | 数字合成 | [2048.html](games/2048.html) |
| B | 俄罗斯方块 | 经典落块 | [tetris.html](games/tetris.html) |
| C | 节奏大师 | 音乐节奏 | [rhythm.html](games/rhythm.html) |
| D | 打砖块 | 弹球 | [breakout.html](games/breakout.html) |
| E | 3D 城市 | 城市建设 | [cubecity.html](games/cubecity.html) ⚡ |
| F | 坦克对战 | 联机 PvP | [battle.html](games/battle.html) ⚡ |
| G | 飞机大战 | 射击 | [plane.html](games/plane.html) |
| H | 数独 | 逻辑 | [sudoku.html](games/sudoku.html) |
| I | 扫雷 | 逻辑推理 | [minesweeper.html](games/minesweeper.html) |
| J | 斗地主 | 扑克 | [doudizhu.html](games/doudizhu.html) |
| K | 麻将 | 国粹 | [mahjong.html](games/mahjong.html) |
| L | 造梦西游 | 横版动作 | [dream.html](games/dream.html) |
| M | 保卫萝卜 | 塔防 | [carrot.html](games/carrot.html) |
| N | 冰火人闯关 | 双人协作 | [icefire.html](games/icefire.html) |
| O | 贪吃蛇 | 街机 | [snake.html](games/snake.html) |
| P | 五子棋 | 棋类策略 | [gomoku.html](games/gomoku.html) |
| Q | 消消乐 | 三消 | [match3.html](games/match3.html) |
| R | 跑酷 | 敏捷 | [parkour.html](games/parkour.html) |
| S | 吃豆人 | 迷宫 | [pacman.html](games/pacman.html) |
| T | 泡泡龙 | 弹射消除 | [bubble.html](games/bubble.html) |
| U | 格斗 | 1v1 对战 | [fighting.html](games/fighting.html) |
| V | 赛车 | 竞速 | [racing.html](games/racing.html) |
| W | 泡泡堂 | 多人竞技 | [bubblebob.html](games/bubblebob.html) |

> ⚡ `cubecity`（Three.js）与 `battle`（PeerJS）需联网加载 CDN 资源；其余 21 款均为纯离线内联脚本。

## 🧪 测试

- **CLI 静态检测**（Node，无需浏览器）：
  ```
  cd games/tests && node test-runner.js
  ```
- **浏览器内运行测试**：用浏览器打开 `games/tests/runner.html`，自动加载各游戏并模拟输入做断言。

## 🛠 技术说明

- 所有游戏为单文件 `index.html` 同目录的 `*.html`，互相独立、可单独打开。
- 大厅入口 `games/index.html` 汇总全部卡片，点击即进入对应游戏。
- 统一的 CSS 变量设计系统（终端风），保证视觉一致性。
- 部分复杂游戏（如麻将、泡泡堂）暴露 `window.__bb` 等测试钩子，供 node 逻辑单测驱动。

## 📁 目录结构

```
.
├── games/
│   ├── index.html            # 游戏大厅入口
│   ├── 启动游戏大厅.bat        # 一键启动（双击）
│   ├── 2048.html … bubblebob.html   # 23 款游戏
│   └── tests/                # 自动化测试套件
│       ├── test-runner.js    # CLI 静态检测
│       ├── runner.html       # 浏览器运行测试
│       └── _bbtest.js        # 泡泡堂 node 逻辑单测
├── .gitignore
└── README.md
```

---

© 软件工程实训 · StockSignal 游戏合集
