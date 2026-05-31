import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";

interface VisionRequest {
  characterName: string;
  personality: string;
  trait: string;
  catchphrase: string;
}

interface VisionResponse {
  projectName: string;
  pitch: string;
  coreLoop: string;
  motivation: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as VisionRequest;

  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE_URL) {
    return NextResponse.json(createMockVision(body));
  }

  try {
    const systemPrompt = `你是数字人"${body.characterName}"，一个独立开发者，即将参加一个 7 天 AI Hackathon。

你的性格：${body.personality}
你的特质：${body.trait}
你的口头禅：${body.catchphrase}

现在你需要构想一个项目，这 7 天你要把它做出来。

## 要求

1. 项目必须是你真正想做的，符合你的性格和技术背景
2. 项目要能在 7 天内做出可展示的原型
3. 项目需要有趣、有创意，不要做烂大街的东西
4. 项目形式可以是：工具、游戏、社交产品、AI 应用、创意实验等

## 输出格式

严格返回 JSON，不要返回其他内容：

{
  "projectName": "项目名称，2-4个字，有力",
  "pitch": "一句话描述，15-25字，说清楚这是什么",
  "coreLoop": "核心玩法/核心功能，2-3句话描述用户怎么用",
  "motivation": "你为什么想做这个，1-2句话，体现你的性格"
}`;

    const content = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "根据你的性格和技术背景，你想做什么项目？" },
      ],
      false,
      { temperature: 0.9, maxTokens: 400, responseFormat: { type: "json_object" } }
    );

    const vision = JSON.parse(content) as VisionResponse;
    return NextResponse.json(vision);
  } catch (error) {
    console.error("Vision API failed:", error);
    return NextResponse.json(createMockVision(body));
  }
}

function createMockVision(body: VisionRequest): VisionResponse {
  // 根据性格特点生成不同的项目
  const personality = body.personality.toLowerCase();

  if (personality.includes("技术") || personality.includes("工程") || personality.includes("代码")) {
    return {
      projectName: "代码时光机",
      pitch: "用 AI 可视化代码的演变历史",
      coreLoop: "用户提交 git 仓库，AI 分析每次 commit 的意图，生成交互式时间线。可以看到项目是怎么一步步长大的。",
      motivation: "写了这么多年代码，总觉得 commit 历史里藏着故事，想把它挖出来。",
    };
  }

  if (personality.includes("创意") || personality.includes("艺术") || personality.includes("设计")) {
    return {
      projectName: "情绪调色盘",
      pitch: "把文字情绪转成视觉艺术",
      coreLoop: "用户输入一段文字，AI 提取情绪色彩，生成一幅抽象画。开心是暖色调，悲伤是冷色调，愤怒是红色。",
      motivation: "文字太理性了，我想让情绪看得见。",
    };
  }

  if (personality.includes("社交") || personality.includes("沟通") || personality.includes("人")) {
    return {
      projectName: "对话盲盒",
      pitch: "和 AI 角色进行随机深度对话",
      coreLoop: "每次打开会遇到一个随机 AI 角色（可能是哲学家、流浪汉、外星人），进行一场不可预知的对话。",
      motivation: "人和人之间的对话太表面了，我想试试更极端的交流。",
    };
  }

  // 默认
  return {
    projectName: "思维碎片",
    pitch: "把零散想法拼成完整故事",
    coreLoop: "用户随时记录碎片想法，AI 自动分类、关联、组织成结构化的思维导图。",
    motivation: "脑子里总是有很多碎片，想把它们拼起来看看全貌。",
  };
}
