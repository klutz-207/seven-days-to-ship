# 七天之后

AI 叙事驱动的 Hackathon 模拟器。玩家观察一个 AI 数字人在 7 天内完成项目，可以随时用文字干预其决策。

## 技术栈

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS 4（像素风格主题）
- Tauri 2（桌面应用打包）
- DeepSeek V3.2（大模型 API）

## 功能特性

### 游戏流程
- **命名系统** — 为数字人取名
- **上帝推演** — AI 生成角色性格、特质、口头禅
- **角色卡片** — 展示角色信息
- **每日计划** — AI 生成每天的行动计划
- **走廊场景** — 角色在走廊行走，进入房间
- **房间场景** — 角色自动执行任务，显示气泡思考
- **DDAE 日志** — 每天结束时生成日志
- **最终产品** — Day 7 生成产品描述

### 场景系统
- 5 个房间：电脑桌、书桌、咖啡厅、卧室、展台
- 走廊连接所有房间
- 角色精灵动画（4方向行走、站立）
- 可行走区域限制，脚部贴地

### 自主性机制
- 角色自动执行任务（每 3 秒 +10 进度）
- 玩家输入时暂停自动推进
- 只有任务完成才能离开房间

## 目录结构

```
app/                    Next.js 页面与 API Route
  api/
    character/          上帝推演接口
    bubble/             房间气泡接口
    decision/           AI 决策接口
    journal/            DDAE 日志接口
    ending/             最终产品接口
    plan/               每日计划接口
components/             UI 组件
  NameInput.tsx         命名页面
  GodNarration.tsx      上帝推演
  CharacterCard.tsx     角色卡片
  CorridorScene.tsx     走廊场景
  RoomStage.tsx         房间场景
  CharacterSprite.tsx   角色精灵
  EventBubble.tsx       气泡组件
  DialogueDock.tsx      输入框
  DailyNote.tsx         每日计划
  JournalNote.tsx       DDAE 日志
  EndingReport.tsx      结局报告
lib/                    控制层逻辑
  llm.ts                统一 LLM 调用
  conversation.ts       对话历史管理
  types.ts              类型定义
  rooms.ts              房间数据
  eventEngine.ts        事件引擎
  stateUpdater.ts       状态更新
  prompts.ts            AI Prompt
public/                 静态资源
  characters/           角色精灵图
  rooms/                房间背景图
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
LLM_API_BASE_URL=https://tokendance.space/gateway
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

## License

MIT
