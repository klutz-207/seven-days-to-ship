# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

《七天之后》— AI 叙事驱动的 Hackathon 模拟器。玩家观察一个 AI 数字人在 7 天内完成项目，可以随时用文字干预其决策。数字人有自主性，会自己决定去哪个房间、做什么任务。

## 技术栈

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS 4（像素风格主题）
- Tauri 2（桌面应用打包）
- DeepSeek V3.2（大模型 API，通过 `lib/llm.ts` 统一调用）
- LocalStorage 存储游戏状态

## 架构原则

**双进程 LLM 架构**：
- 上帝进程（一次性）：开局调用，生成角色性格
- 数字人进程（持久上下文）：7 天共享对话历史

**AI 与控制层分工**：
- AI 负责：生成计划、气泡思考、响应干预、写日志、描述产品
- 控制层负责：状态更新、数值计算、失衡检测、结局判定

**API Key 安全**：只放 `.env.local`，绝不暴露到前端

## 目录结构

```
app/
  page.tsx              主游戏页面（状态机）
  globals.css           全局样式（像素风格）
  api/
    character/          上帝推演接口
    bubble/             房间气泡接口
    decision/           AI 决策接口
    journal/            DDAE 日志接口
    ending/             最终产品接口
    plan/               每日计划接口
components/
  NameInput.tsx         命名页面
  GodNarration.tsx      上帝推演
  CharacterCard.tsx     角色卡片
  StartScreen.tsx       开始页面
  CorridorScene.tsx     走廊场景
  RoomStage.tsx         房间场景
  CharacterSprite.tsx   角色精灵
  EventBubble.tsx       气泡组件
  DialogueDock.tsx      输入框
  DailyNote.tsx         每日计划
  JournalNote.tsx       DDAE 日志
  EndingReport.tsx      结局报告
  StatusPanel.tsx       项目指标面板
  CharacterHud.tsx      角色状态面板
  Timeline.tsx          时间线日志
lib/
  llm.ts                统一 LLM 调用
  llmClient.ts          前端 API 调用
  conversation.ts       对话历史管理
  types.ts              类型定义
  rooms.ts              房间数据
  eventEngine.ts        事件引擎
  stateUpdater.ts       状态更新
  planGenerator.ts      行动计划生成
  prompts.ts            AI Prompt
  endingJudge.ts        结局判定
  imbalanceDetector.ts  失衡检测
```

## 游戏流程

```
开始 → 命名 → 上帝推演 → 角色卡片 → Day 1
  ├─ 每日计划（小纸条）
  ├─ 走廊 → 房间 1 → 自动执行任务 → 任务完成 → 离开
  ├─ 走廊 → 房间 2 → 自动执行任务 → 任务完成 → 离开
  ├─ 走廊 → 房间 3 → 自动执行任务 → 任务完成 → 离开
  └─ DDAE 日志 → Day 2 → ... → Day 7 → 最终产品
```

## 自主性机制

- 角色进入房间后自动执行任务（每 3 秒 +10 进度）
- 显示气泡（角色的思考）
- 玩家输入时暂停自动推进，5 秒后恢复
- 只有任务完成（进度 100%）才能离开房间

## 环境变量

```bash
LLM_API_KEY=你的API密钥
LLM_API_BASE_URL=https://tokendance.space/gateway
```

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建 Web 版
npm run tauri:dev    # 启动桌面应用开发
npm run tauri:build  # 构建桌面应用
```
