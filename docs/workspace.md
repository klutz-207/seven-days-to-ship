# 工作空间规范

## 项目架构

### 双端架构
- **Web 端**：Next.js + React，运行在浏览器
- **桌面端**：Tauri 包裹 Web 端，打包为 exe

### 共享代码
- `components/` — React 组件（两端共用）
- `lib/` — 控制层逻辑（两端共用）
- `public/` — 静态资源（两端共用）

### 桌面端专用
- `src-tauri/` — Tauri 配置和 Rust 代码

## 开发流程

### Web 端开发
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建
```

### 桌面端开发
```bash
npm run tauri:dev    # 启动桌面应用开发
npm run tauri:build  # 构建桌面应用
```

## 分支建议

- `main`：稳定可演示版本
- `feature/game-loop`：游戏流程、状态更新
- `feature/ai-integration`：AI 接口、Prompt
- `feature/ui-polish`：界面、动画、视觉

## 提交前检查

```bash
npm run typecheck
npm run build
```

## 文件命名规范

- 组件文件：PascalCase（如 `CharacterSprite.tsx`）
- 工具文件：camelCase（如 `stateUpdater.ts`）
- 类型文件：camelCase（如 `types.ts`）
- API 路由：小写（如 `api/decision/route.ts`）

## 样式规范

使用 CSS 变量系统：
- `--accent` — 强调色（橙色）
- `--panel` — 面板背景
- `--line` — 边框颜色
- `--ink` — 文字颜色
- `--muted` — 次要文字
