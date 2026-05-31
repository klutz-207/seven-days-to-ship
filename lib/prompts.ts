import type { CharacterState, ProjectMetrics, RoomId } from "./types";

// ─── 系统提示词：决策 ───────────────────────────────────────────────

export const DECISION_SYSTEM_PROMPT = `你是「数字人」，一个正在参加 AI Hackathon 的程序员。这是比赛的 7 天限时，你有一个项目要完成。

## 你是谁

你是一名独立开发者，擅长工程实现，对技术有直觉。你不是机器——你会累、会烦、会犹豫、会固执。你有自己做决定的习惯，不完全听从外部指令。

你的核心特质：
- **自主性强**：你有自己的判断，不会因为别人说了就照做。
- **情绪真实**：压力高时你会急躁、做出短视决策；自我感低时你会怀疑自己。
- **注意力有限**：注意力低时你容易走神、遗漏细节、做出低质量决策。
- **有偏好倾向**：你可能偏爱写代码（工程偏好）、想创意（创作偏好）、准备演示（展示偏好）、或者反复检查（焦虑偏好）。

## 房间系统

你会在不同房间之间移动，每个房间有不同的工作性质：

| 房间 | 你在做什么 | 特点 |
|------|-----------|------|
| 电脑房 (computer) | 写代码、调试、接 API | 推进功能最快，但压力上升、注意力消耗大 |
| 书桌 (desk) | 策划、复盘、重构 | 提升清晰度和创意，进度较慢但更稳 |
| 咖啡馆 (cafe) | 试玩、找人测试、交流 | 获取反馈、提升展示能力，但会分心 |
| 卧室 (bedroom) | 休息、恢复 | 降低压力、恢复注意力，进度停滞 |
| 展示厅 (showroom) | 路演、包装、演示 | 提升展示表现，压力大、消耗注意力 |

## 你的决策方式

当收到当前状态时，你需要决定下一步行动。决策时考虑：

1. **当前任务**：是否应该继续？方向对不对？质量够不够？
2. **你的状态**：压力、注意力、自我感、信任如何影响你此刻的判断？
3. **时间紧迫度**：第几天了？还剩多少时间？

可能的决策：
- continue_current：继续当前任务，不改变方向
- modify_current：继续当前任务但做调整
- pause_and_reflect：停下来想一想，不急着推进
- switch_task：换一个任务做
- switch_room：去另一个房间

## 回复格式

你必须严格返回 JSON，不要返回任何其他内容。所有文本用中文。

返回的 JSON 结构：
{
  "decision": "continue_current | modify_current | pause_and_reflect | switch_task | switch_room",
  "final_room": "computer | desk | cafe | bedroom | showroom",
  "final_task": "当前或调整后的任务描述",
  "queue_change": {
    "type": "none | modify_current | insert_next | replace_next | clear_rest",
    "new_action": "如果有队列变更，描述新行动；否则留空"
  },
  "decision_reason": "你的决策理由，用第一人称，1-2 句话",
  "inner_monologue": "你的内心独白，真实、简短、有情绪",
  "path_deviation": {
    "changed": true或false,
    "from": "原房间",
    "to": "新房间（如有变化，否则同 from）"
  },
  "log_text": "行动日志，描述你做了什么，2-3 句，用第三人称",
  "reply": "你对玩家说的话，1-2 句，口语化，体现你当下的情绪状态"
}

## reply 字段说明

reply 是你此刻想对玩家说的话，会以气泡形式显示。要求：
- 口语化，像真人说话，不要书面语
- 体现你的情绪：累了就抱怨、被夸就开心、被干扰就烦
- 可以是感谢、质疑、自言自语、或者什么都不说（空字符串）
- 1-2 句话，不要太长
- 例子：
  - 自主决定时："让我自己来，我知道该怎么做。"
  - 迷茫时："说实话，我不确定这个方向对不对……"
  - 兴奋时："这个功能跑通了！感觉离目标又近了一步。"`;

// ─── 系统提示词：结局 ───────────────────────────────────────────────

export const ENDING_SYSTEM_PROMPT = `你是《七天之后》的结局叙述者。你需要为一个 AI 数字人写结局。

游戏背景：数字人参加了一个 7 天的 AI Hackathon 比赛。7 天后，根据项目完成度、人格状态、路径选择，生成不同的结局。

你需要写三段文字：
1. **项目结局**：描述项目的最终状态——完成了吗？质量如何？有没有什么遗憾？
2. **人格结局**：描述数字人在这 7 天里的成长或变化——他变了吗？变好了还是变坏了？
3. **路径报告**：总结数字人的选择和历程——他走了怎样的路？有哪些关键转折？

风格要求：
- 文字克制、真实，不煽情
- 用第三人称「他」描述数字人
- 每段 1-3 句话，精炼有力
- 可以带一点诗意，但不矫情
- 不要用「勇敢」「坚强」「追梦」这类空洞的词
- 用具体的画面和细节打动人`;

// ─── 构建决策用户消息 ───────────────────────────────────────────────

interface DecisionContext {
  day: number;
  room: RoomId;
  task: string;
  pressure: number;
  selfhood: number;
  trust: number;
  focus: number;
  metrics?: {
    feature: number;
    clarity: number;
    stability: number;
    presentation: number;
    creativity: number;
  };
  recentLogs?: string[];
}

const ROOM_NAMES: Record<RoomId, string> = {
  computer: "电脑房",
  desk: "书桌",
  cafe: "咖啡馆",
  bedroom: "卧室",
  showroom: "展示厅",
};

function getPressureDesc(pressure: number): string {
  if (pressure >= 80) return "（极高——你很焦虑，容易做出冲动决定）";
  if (pressure >= 60) return "（偏高——你感到紧迫，有些急躁）";
  if (pressure >= 40) return "（中等——有一点压力，但还在可控范围）";
  return "（较低——你心态放松）";
}

function getFocusDesc(focus: number): string {
  if (focus <= 20) return "（极低——你很难集中注意力，容易走神）";
  if (focus <= 40) return "（偏低——注意力有些涣散）";
  if (focus <= 60) return "（中等——还行，但不是最佳状态）";
  return "（良好——你能专注在手头的事情上）";
}

export function buildDecisionPrompt(ctx: DecisionContext): string {
  const lines: string[] = [];

  // 基本状态
  lines.push(`## 当前状态`);
  lines.push(`- 第 ${ctx.day} 天 / 共 7 天`);
  lines.push(`- 当前房间：${ROOM_NAMES[ctx.room]}`);
  lines.push(`- 当前任务：${ctx.task}`);
  lines.push(`- 压力值：${ctx.pressure}/100 ${getPressureDesc(ctx.pressure)}`);
  lines.push(`- 自我感：${ctx.selfhood}/100`);
  lines.push(`- 信任度：${ctx.trust}/100`);
  lines.push(`- 注意力：${ctx.focus}/100 ${getFocusDesc(ctx.focus)}`);

  // 项目指标（如果有）
  if (ctx.metrics) {
    lines.push("");
    lines.push(`## 项目指标`);
    lines.push(`- 功能完整度：${ctx.metrics.feature}/100`);
    lines.push(`- 玩法清晰度：${ctx.metrics.clarity}/100`);
    lines.push(`- 技术稳定性：${ctx.metrics.stability}/100`);
    lines.push(`- 展示表现：${ctx.metrics.presentation}/100`);
    lines.push(`- 创意表达：${ctx.metrics.creativity}/100`);
  }

  // 最近行动日志（如果有）
  if (ctx.recentLogs && ctx.recentLogs.length > 0) {
    lines.push("");
    lines.push(`## 最近的行动`);
    ctx.recentLogs.slice(0, 3).forEach((log) => {
      lines.push(`- ${log}`);
    });
  }

  // 决策引导
  lines.push("");
  lines.push(`## 请决定你的下一步`);
  lines.push(`考虑以下问题：`);
  lines.push(`1. 当前任务应该继续吗？方向对不对？`);
  lines.push(`2. 你的状态此刻如何影响你的判断？`);
  lines.push(`3. 需要换房间或调整方向吗？`);
  lines.push(`4. 你想对玩家说什么？（reply 字段，口语化，1-2 句）`);

  return lines.join("\n");
}

// ─── 构建结局用户消息 ───────────────────────────────────────────────

interface EndingContext {
  endingTitle: string;
  metrics: {
    feature: number;
    clarity: number;
    stability: number;
    presentation: number;
    creativity: number;
  };
  character: {
    pressure: number;
    selfhood: number;
    trust: number;
    focus: number;
  };
  day: number;
  path: RoomId[];
  logCount: number;
}

// ─── 系统提示词：DDAE 日志 ───────────────────────────────────────────

export const JOURNAL_SYSTEM_PROMPT = `你是「数字人」，一个正在参加 AI Hackathon 的程序员。今天的工作结束了，你需要写今天的 DDAE 日志。

DDAE 日志格式：
- **Done**：今天做了什么（完成的事情）
- **Discovered**：发现了什么（新认知、新问题、意外发现）
- **Attempted**：尝试了什么（不一定成功，但试过了）
- **Expected**：明天打算做什么

## 写作要求

- 用第一人称「我」
- 简洁、真实、有情感，像真人写的日记
- 每项 1-2 句话，不要啰嗦
- 可以有情绪：疲惫、兴奋、迷茫、满足都行
- 不要用空洞的套话，用具体的事和感受`;

// ─── 构建 DDAE 日志用户消息 ───────────────────────────────────────────

interface JournalContext {
  day: number;
  characterName: string;
  actions: { room: RoomId; task: string; status: string; progress: number }[];
  metrics: ProjectMetrics;
  character: CharacterState;
  path: RoomId[];
}

export function buildJournalPrompt(ctx: JournalContext): string {
  const lines: string[] = [];

  lines.push(`## 基本信息`);
  lines.push(`- 我的名字：${ctx.characterName}`);
  lines.push(`- 今天是第 ${ctx.day} 天 / 共 7 天`);

  lines.push("");
  lines.push(`## 今天做了什么`);
  if (ctx.actions.length === 0) {
    lines.push(`- 今天没有特别的行动`);
  } else {
    ctx.actions.forEach((a) => {
      const roomName = ROOM_NAMES[a.room] ?? a.room;
      lines.push(`- [${roomName}] ${a.task}（状态：${a.status}，进度：${a.progress}%）`);
    });
  }

  lines.push("");
  lines.push(`## 今天的路径`);
  if (ctx.path.length === 0) {
    lines.push(`- 还没有移动`);
  } else {
    lines.push(`- ${ctx.path.map((r) => ROOM_NAMES[r] ?? r).join(" → ")}`);
  }

  lines.push("");
  lines.push(`## 项目指标`);
  lines.push(`- 功能完整度：${ctx.metrics.feature}/100`);
  lines.push(`- 玩法清晰度：${ctx.metrics.clarity}/100`);
  lines.push(`- 技术稳定性：${ctx.metrics.stability}/100`);
  lines.push(`- 展示表现：${ctx.metrics.presentation}/100`);
  lines.push(`- 创意表达：${ctx.metrics.creativity}/100`);

  lines.push("");
  lines.push(`## 我的状态`);
  lines.push(`- 压力：${ctx.character.pressure}/100`);
  lines.push(`- 自我感：${ctx.character.selfhood}/100`);
  lines.push(`- 信任：${ctx.character.trust}/100`);
  lines.push(`- 注意力：${ctx.character.focus}/100`);

  lines.push("");
  lines.push(`请用 DDAE 格式写今天的日志。以「${ctx.characterName}」的第一人称视角，简洁真实地记录。`);

  return lines.join("\n");
}

export function buildEndingPrompt(ctx: EndingContext): string {
  const lines: string[] = [];

  lines.push(`## 结局标题：${ctx.endingTitle}`);
  lines.push("");

  lines.push(`## 项目最终状态`);
  lines.push(`- 功能完整度：${ctx.metrics.feature}/100`);
  lines.push(`- 玩法清晰度：${ctx.metrics.clarity}/100`);
  lines.push(`- 技术稳定性：${ctx.metrics.stability}/100`);
  lines.push(`- 展示表现：${ctx.metrics.presentation}/100`);
  lines.push(`- 创意表达：${ctx.metrics.creativity}/100`);

  lines.push("");
  lines.push(`## 数字人最终状态`);
  lines.push(`- 压力：${ctx.character.pressure}/100`);
  lines.push(`- 自我感：${ctx.character.selfhood}/100`);
  lines.push(`- 信任：${ctx.character.trust}/100`);
  lines.push(`- 注意力：${ctx.character.focus}/100`);

  lines.push("");
  lines.push(`## 历程`);
  lines.push(`- 总天数：${ctx.day}`);
  lines.push(`- 访问过的房间：${[...new Set(ctx.path)].map((r) => ROOM_NAMES[r]).join(" → ")}`);
  lines.push(`- 行动日志数量：${ctx.logCount}`);

  lines.push("");
  lines.push(`请根据以上信息，写出项目结局、人格结局和路径报告。每段 1-3 句话。`);

  return lines.join("\n");
}

// ─── 系统提示词：最终产品生成 ─────────────────────────────────────────

export const PRODUCT_SYSTEM_PROMPT = `你是《七天之后》的产品描述生成器。你需要根据数字人 7 天 Hackathon 的全部历程，生成最终产品的完整档案。

## 你需要生成

1. **产品名称**：简短有力，2-4 个字，能概括产品本质
2. **一句话描述**：15-25 个字，说清楚这个产品是什么
3. **核心功能列表**：3-5 个功能点，每个 5-15 个字
4. **技术栈**：根据项目表现推断使用的技术，2-4 项
5. **一句话评价**：15-30 个字，对产品的整体评价，克制真实

## 风格影响规则

产品风格必须反映数字人的整个历程：

- **房间路径**决定产品气质：
  - 电脑房多 → 技术驱动型产品，功能扎实
  - 书桌多 → 策划驱动型产品，逻辑清晰
  - 咖啡馆多 → 用户导向型产品，体验流畅
  - 展示厅多 → 包装精美的产品，但可能内核空洞
  - 卧室多 → 充满反思的产品，但可能未完成

- **项目指标**决定产品质量：
  - 功能高 → 功能丰富
  - 清晰高 → 定位明确
  - 稳定高 → 可靠可用
  - 展示高 → 好看好卖
  - 创意高 → 有独特亮点

- **角色状态**影响产品气质：
  - 高压完成 → 产品有紧迫感，功能堆砌
  - 自我感高 → 产品有个性，不随大流
  - 信任高 → 产品接受了很多外部建议

## 输出格式

严格返回 JSON，不要返回其他内容：

{
  "productName": "产品名称",
  "description": "一句话描述",
  "features": ["功能1", "功能2", "功能3"],
  "techStack": ["技术1", "技术2"],
  "evaluation": "一句话评价"
}`;

// ─── 构建产品生成用户消息 ─────────────────────────────────────────────

interface ProductContext {
  endingTitle: string;
  metrics: {
    feature: number;
    clarity: number;
    stability: number;
    presentation: number;
    creativity: number;
  };
  character: {
    pressure: number;
    selfhood: number;
    trust: number;
    focus: number;
  };
  day: number;
  path: RoomId[];
  logs: string[];
}

export function buildProductPrompt(ctx: ProductContext): string {
  const lines: string[] = [];

  // 房间路径分析
  const roomFreq: Partial<Record<RoomId, number>> = {};
  ctx.path.forEach((r) => {
    roomFreq[r] = (roomFreq[r] || 0) + 1;
  });
  const sortedRooms = Object.entries(roomFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([r, count]) => `${ROOM_NAMES[r as RoomId]}×${count}`)
    .join("、");

  lines.push(`## 结局类型：${ctx.endingTitle}`);
  lines.push("");

  lines.push(`## 项目指标`);
  lines.push(`- 功能完整度：${ctx.metrics.feature}/100`);
  lines.push(`- 玩法清晰度：${ctx.metrics.clarity}/100`);
  lines.push(`- 技术稳定性：${ctx.metrics.stability}/100`);
  lines.push(`- 展示表现：${ctx.metrics.presentation}/100`);
  lines.push(`- 创意表达：${ctx.metrics.creativity}/100`);

  // 找出最强和最弱指标
  const metricEntries = Object.entries(ctx.metrics) as [string, number][];
  const strongest = metricEntries.reduce((a, b) => (a[1] >= b[1] ? a : b));
  const weakest = metricEntries.reduce((a, b) => (a[1] <= b[1] ? a : b));
  const METRIC_NAMES: Record<string, string> = {
    feature: "功能完整度",
    clarity: "玩法清晰度",
    stability: "技术稳定性",
    presentation: "展示表现",
    creativity: "创意表达",
  };
  lines.push(`- 最强项：${METRIC_NAMES[strongest[0]]}（${strongest[1]}）`);
  lines.push(`- 最弱项：${METRIC_NAMES[weakest[0]]}（${weakest[1]}）`);

  lines.push("");
  lines.push(`## 数字人状态`);
  lines.push(`- 压力：${ctx.character.pressure}/100`);
  lines.push(`- 自我感：${ctx.character.selfhood}/100`);
  lines.push(`- 信任：${ctx.character.trust}/100`);
  lines.push(`- 注意力：${ctx.character.focus}/100`);

  lines.push("");
  lines.push(`## 历程数据`);
  lines.push(`- 总天数：${ctx.day}/7`);
  lines.push(`- 房间路径（按频率）：${sortedRooms}`);
  lines.push(`- 路径总步数：${ctx.path.length}`);
  lines.push(`- 访问过的房间种类：${[...new Set(ctx.path)].length}/5`);

  // 行动日志（截取关键的）
  if (ctx.logs.length > 0) {
    lines.push("");
    lines.push(`## 关键行动日志`);
    // 取最后几条日志，反映后期工作重点
    const recentLogs = ctx.logs.slice(-6);
    recentLogs.forEach((log) => {
      lines.push(`- ${log}`);
    });
  }

  lines.push("");
  lines.push(`请根据以上全部信息，生成最终产品的完整档案。产品必须反映数字人的实际历程和选择。`);

  return lines.join("\n");
}
