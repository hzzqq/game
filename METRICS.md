# 项目度量报告

> 生成时间：2026-07-28T07:28:37.952Z（由 `node metrics-report.js` 自动生成，勿手改）

## 总览

| 指标 | 数值 |
| --- | --- |
| 游戏数 | 165 |
| HTML 总行数 | 55,138 |
| 平均行数/款 | 334 |
| 测试文件 | 167 |
| 断言通过 | 5688/5688（全绿） |

## Common 共享库采用率

| 指标 | 数值 |
| --- | --- |
| 已用 Common.* | 165/165（100%） |
| 逻辑裸 Math.random | 0 款 |
| 内联主题（待收口 injectTheme） | 0 款 |
| 手写 diffbar（待收口 buildDiffBar） | 55 款 |
| 手写 rAF 循环（待收口 Loop） | 0 款 |

## 可测性

| 指标 | 数值 |
| --- | --- |
| 有 window.__t 钩子 | 164/165 |
| 有逻辑测试 | 165/165 |
| 平均钩子函数 | 8.2 个/款 |

## 体积分布

| 区间 | 款数 |
| --- | --- |
| < 500 行 | 135 |
| 500–1000 行 | 30 |
| 1000–2000 行 | 0 |
| > 2000 行 | 0 |

**最大 5 款**：tetris.html（919 行）、carrot.html（893 行）、rhythm.html（883 行）、bubble.html（877 行）、runner.html（838 行）

## 配套命令

```bash
node ci-check.js                      # 一键门禁：一致性 + 审计 + 全量回归
node games/sync-catalog.js            # 大厅一致性检查
node games/sync-catalog.js --audit    # 随机数/复制量审计
node metrics-report.js                # 重新生成本报告
```
