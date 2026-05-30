# 七天之后

半实时 AI 路径偏移型 Hackathon 模拟游戏。玩家观察 AI 数字人的项目推进，并在关键行动节点选择继续运行、打断、提醒或放行，最终生成七天后的项目结局、人格结局和路径报告。

## 技术栈

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS 4
- DeepSeek V4 Flash（大模型 API）
- LocalStorage 保存游戏状态
- Tauri 2（桌面应用打包）

## 功能特性

### 游戏流程
- **初始页面** — 点击开始进入游戏
- **天数过渡** — 每天切换时全屏显示 Day X
- **走廊场景** — 房间切换时角色在走廊行走
- **房间场景** — 角色在房间内执行任务
- **AI 决策** — 接入大模型，根据玩家干预做出反应

### 场景系统
- 5 个房间：电脑房、书桌、咖啡馆、卧室、展厅
- 走廊连接所有房间
- 角色精灵动画（4方向行走、站立）
- 可行走区域限制，脚部贴地

### 干预系统
- 输入文字给数字人
- AI 以电报语风格回应
- 每次干预推进进度 +20

## 目录结构

```txt
app/                    Next.js 页面与 API Route
  api/decision/          AI 决策接口
  api/ending/            结局生成接口
  page.tsx               主游戏页面
  globals.css            全局样式（像素风格）
components/             UI 组件
  CharacterSprite.tsx    角色精灵动画
  CharacterHud.tsx       角色状态面板
  CorridorScene.tsx      走廊场景
  DayTransition.tsx      天数过渡效果
  DialogueDock.tsx       输入框
  RoomStage.tsx          房间场景
  StartScreen.tsx        初始页面
  StatusPanel.tsx        项目状态面板
  Timeline.tsx           时间线日志
lib/                    控制层逻辑
  types.ts               TypeScript 类型定义
  rooms.ts               房间数据
  planGenerator.ts       行动计划生成
  stateUpdater.ts        状态更新
  endingJudge.ts         结局判定
  imbalanceDetector.ts   失衡检测
public/                 静态资源
  characters/            角色精灵图
  rooms/                 房间背景图
  ui/                    UI 图标
src-tauri/              Tauri 桌面应用配置
```

## 本地启动

### Web 版

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

### 桌面版

```bash
npm run tauri:dev
```

或直接运行 `桌面应用/seven-days-later.exe`。

## 环境变量

创建 `.env.local` 文件：

```bash
LLM_API_KEY=你的API密钥
LLM_API_BASE_URL=https://tokendance.space/models/deepseek-v4-flash
```

不配置则使用本地 mock 数据。

## 构建部署

### Web 构建

```bash
npm run build
```

### 桌面应用构建

```bash
npm run tauri:build
```

生成的 exe 文件在 `src-tauri/target/release/`。

## 协作约定

- API Key 只放在 `.env.local`，不要提交真实密钥
- 前端不直连外部 LLM，统一走 `app/api/*`
- 行为规则、状态更新和结局判定放在 `lib/`，页面只负责组合 UI
- 像素风格使用 CSS 变量系统（`--accent`, `--panel`, `--line`）

## 游戏截图

> 待补充

## License

MIT
