# 工作空间规范

## 推荐协作分工

1. **主仓库工作空间**：维护 `main` 分支、集成可运行版本、处理发布。
2. **玩法/控制层工作空间**：重点修改 `lib/`，实现行动队列、状态更新、失衡检测和结局判定。
3. **界面/体验工作空间**：重点修改 `app/` 和 `components/`，完善交互、视觉、响应式和报告页。

## 分支建议

- `main`：稳定可演示版本。
- `feature/game-loop`：行动推进、干预和状态更新。
- `feature/ui-polish`：界面布局、动效、视觉和可用性。
- `feature/ai-routes`：Prompt、API Route、Mock 与错误处理。

## 提交前检查

```bash
npm run typecheck
npm run build
```

如果改动较小，可以先跑：

```bash
npm run typecheck
```
