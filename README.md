# 七天之后

半实时 AI 路径偏移型 Hackathon 模拟游戏。玩家观察 AI 数字人的项目推进，并在关键行动节点选择继续运行、打断、提醒或放行，最终生成七天后的项目结局、人格结局和路径报告。

## 技术栈

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS 4
- API Route 中转 LLM 请求
- LocalStorage 保存 MVP 游戏状态

## 目录规范

```txt
app/                    Next.js 页面与 API Route
  api/decision/          当前行动的 AI 决策接口
  api/ending/            Day 7 结局文案接口
components/             可复用 UI 组件
lib/                    控制层逻辑、类型、Prompt 与状态更新
docs/                   协作文档与交付规范
```

## 本地启动

```bash
npm install
npm run dev
```

默认访问 `http://localhost:3000`。

## 协作约定

- API Key 只放在 `.env.local`，不要提交真实密钥。
- 前端不直连外部 LLM，统一走 `app/api/*`。
- 行为规则、状态更新和结局判定优先放在 `lib/`，页面只负责组合 UI。
- 每个队友尽量认领一个清晰区域：UI、控制层、AI Prompt/API、结局与文案。
