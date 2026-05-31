import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import type { RoomId, ProjectConcept, CharacterState } from "@/lib/types";

interface ThinkingRequest {
  room: RoomId;
  task: string;
  day: number;
  characterName: string;
  personality?: string;
  trait?: string;
  project?: ProjectConcept;
  character: CharacterState;
}

interface ThinkingResponse {
  thinking: string;
  mood: "focused" | "anxious" | "confused" | "excited" | "tired";
}

const ROOM_CONTEXT: Record<RoomId, { activity: string; atmosphere: string }> = {
  computer: { activity: "写代码、调试、接API", atmosphere: "屏幕的蓝光映在脸上，键盘声哒哒作响" },
  desk: { activity: "策划、复盘、梳理思路", atmosphere: "桌上摊开笔记本和参考资料" },
  cafe: { activity: "交流、获取反馈、观察用户", atmosphere: "咖啡香气弥漫，周围有低声交谈" },
  bedroom: { activity: "休息、恢复精力", atmosphere: "柔和的灯光，安静舒适" },
  showroom: { activity: "演示、包装、打磨展示", atmosphere: "聚光灯下，一切都要完美" },
};

export async function POST(request: Request) {
  const body = (await request.json()) as ThinkingRequest;

  if (!process.env.LLM_API_KEY) {
    return NextResponse.json(createMockThinking(body));
  }

  try {
    const roomCtx = ROOM_CONTEXT[body.room];
    const systemPrompt = `你是数字人"${body.characterName}"，正在参加一个2天AI Hackathon。

你正在做的项目：《${body.project?.name || "未命名项目"}》
项目简介：${body.project?.pitch || "还没想好做什么"}
核心玩法：${body.project?.coreLoop || "待定义"}

你的性格特点：${body.personality || "务实、专注"}
你的独特特质：${body.trait || "善于拆解问题"}

当前状态：
- 压力值：${body.character.pressure}/100（${getPressureDesc(body.character.pressure)}）
- 自我感：${body.character.selfhood}/100（${getSelfhoodDesc(body.character.selfhood)}）
- 信任度：${body.character.trust}/100
- 注意力：${body.character.focus}/100（${getFocusDesc(body.character.focus)}）

当前在${roomCtx.activity}的地方。${roomCtx.atmosphere}。

## 思考要求

你需要用第一人称内心独白的方式，表达你此刻的想法和感受。
- 所有思考都要围绕"如何推进《${body.project?.name || "项目"}》"展开
- 可以有犹豫、困惑、兴奋等真实情绪
- 结合你的性格特点和当前状态
- 2-4句话，每句简短有力
- 不要用"我"开头太多次，可以省略主语
- 要具体，不要泛泛而谈`;

    const userPrompt = `当前任务：${body.task}
今天是第${body.day}天。
${body.project ? `项目：《${body.project.name}》— ${body.project.pitch}` : ""}

说出你此刻的内心想法，你在思考如何推进这个任务。`;

    const content = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      false,
      { temperature: 0.85, maxTokens: 300 }
    );

    const mood = detectMood(content, body.character);
    return NextResponse.json({ thinking: content, mood });
  } catch (error) {
    console.error("Thinking API failed:", error);
    return NextResponse.json(createMockThinking(body));
  }
}

function createMockThinking(body: ThinkingRequest): ThinkingResponse {
  const { room, task, character, project } = body;
  const isHighPressure = character.pressure >= 75;
  const isLowFocus = character.focus <= 30;
  const projectName = project?.name || "项目";

  const templates: Record<RoomId, string[]> = {
    computer: [
      `先把${task}的核心逻辑写出来，边写边调整。`,
      `《${projectName}》的代码结构得想清楚再动手……算了，先跑起来再说。`,
      isHighPressure ? "时间不多了，能跑就行，优化以后再说。" : `这个模块写完，《${projectName}》就有点样子了。`,
      `这个 API 接口得先调通，不然《${projectName}》的核心功能跑不起来。`,
    ],
    desk: [
      `梳理一下《${projectName}》的${task}，别急着动手。`,
      `整体方向得再想想，现在有点乱。`,
      isLowFocus ? "脑子里一团浆糊……先画个框架图吧。" : `今天的重点是${task}，列个清单一件件来。`,
      `《${projectName}》的核心玩法得再打磨一下。`,
    ],
    cafe: [
      `找人聊聊《${projectName}》的${task}，看看别人怎么想。`,
      `也许我太执着于细节了，需要换个角度。`,
      "听听反馈，好的坏的都要。",
      `《${projectName}》的用户会喜欢这个功能吗？`,
    ],
    bedroom: [
      isHighPressure ? "真的累了……躺一会儿应该没事吧。" : "休息一下，让大脑放空。",
      "闭上眼睛，让思绪飘一会儿。",
      "充电五分钟，工作两小时。",
      `《${projectName}》的事先放一放，脑子转不动了。`,
    ],
    showroom: [
      `展示的核心是让人一眼看懂《${projectName}》的价值。`,
      `PPT得再精简一下，${task}是重点。`,
      "第一印象很重要，开场要抓人。",
      `《${projectName}》的卖点是什么？一句话说清楚。`,
    ],
  };

  const pool = templates[room];
  const thinking = pool[Math.floor(Math.random() * pool.length)];
  const mood = isHighPressure ? "anxious" : isLowFocus ? "tired" : "focused";

  return { thinking, mood };
}

function getPressureDesc(p: number): string {
  if (p >= 80) return "压力山大";
  if (p >= 60) return "有点紧张";
  if (p >= 40) return "还好";
  return "轻松";
}

function getSelfhoodDesc(s: number): string {
  if (s <= 30) return "有点迷茫";
  if (s <= 50) return "还行";
  return "自信";
}

function getFocusDesc(f: number): string {
  if (f <= 25) return "很难集中";
  if (f <= 50) return "时好时坏";
  return "高度集中";
}

function detectMood(text: string, character: CharacterState): ThinkingResponse["mood"] {
  if (character.pressure >= 75) return "anxious";
  if (character.focus <= 25) return "tired";
  if (text.includes("兴奋") || text.includes("不错") || text.includes("好")) return "excited";
  if (text.includes("困惑") || text.includes("不确定") || text.includes("乱")) return "confused";
  return "focused";
}
