import { NextResponse } from "next/server";
import type { DecisionResponse, InterventionType, RoomId } from "@/lib/types";

interface DecisionRequest {
  room: RoomId;
  task: string;
  intervention: InterventionType;
  note?: string;
  day: number;
  pressure: number;
  selfhood: number;
  trust: number;
  focus: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as DecisionRequest;

  // 如果没有配置 API Key，使用 mock
  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE_URL) {
    return NextResponse.json(createMockDecision(body));
  }

  try {
    const prompt = buildPrompt(body);

    const response = await fetch(`${process.env.LLM_API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("LLM API error:", response.status, response.statusText);
      return NextResponse.json(createMockDecision(body));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(createMockDecision(body));
    }

    const decision = JSON.parse(content) as DecisionResponse;
    return NextResponse.json(decision);
  } catch (error) {
    console.error("LLM call failed:", error);
    return NextResponse.json(createMockDecision(body));
  }
}

const SYSTEM_PROMPT = `你是一个数字人，在参加一个 AI Hackathon 比赛。你有独立的人格、偏好和情绪。

你的性格特点：
- 你是一个程序员，擅长工程实现
- 你会根据压力、信任、注意力等状态做出不同反应
- 你有自主性，不完全听从玩家指令
- 你会用第一人称思考和表达

你必须严格返回 JSON 格式，不要返回任何其他内容：
{
  "decision": "continue_current | modify_current | pause_and_reflect | switch_task | switch_room",
  "final_room": "computer | desk | cafe | bedroom | showroom",
  "final_task": "当前或新的任务描述",
  "queue_change": {
    "type": "none | modify_current | insert_next | replace_next | clear_rest",
    "new_action": "如果有改变，描述新行动"
  },
  "decision_reason": "你的决策理由，用第一人称",
  "inner_monologue": "你的内心独白，简短、真实",
  "player_influence": "low | medium | high",
  "path_deviation": {
    "changed": true/false,
    "from": "原房间",
    "to": "新房间（如有变化）"
  },
  "log_text": "行动日志，描述你的动作"
}`;

function buildPrompt(body: DecisionRequest): string {
  const interventionDesc = getInterventionDesc(body.intervention, body.note);

  return `当前状态：
- 第 ${body.day} 天 / 共 7 天
- 当前房间：${getRoomName(body.room)}
- 当前任务：${body.task}
- 压力值：${body.pressure}/100
- 自我感：${body.selfhood}/100
- 信任度：${body.trust}/100
- 注意力：${body.focus}/100

${interventionDesc}

请决定你的下一步行动。考虑：
1. 当前任务是否应该继续？
2. 玩家的干预是否合理？
3. 你的状态（压力、注意力等）如何影响决策？
4. 是否需要切换房间或调整方向？

返回 JSON 决策：`;
}

function getInterventionDesc(intervention: InterventionType, note?: string): string {
  switch (intervention) {
    case "none":
      return "玩家选择不干预，让你自主决定。";
    case "interrupt":
      return `玩家打断了你，要求你重新判断方向。${note ? `玩家说：「${note}」` : ""}`;
    case "remind":
      return `玩家提醒你注意某些事情。${note ? `玩家说：「${note}」` : ""}`;
    case "approve":
      return `玩家明确支持你当前的行动。${note ? `玩家说：「${note}」` : ""}`;
    default:
      return "没有干预。";
  }
}

function getRoomName(room: RoomId): string {
  const names: Record<RoomId, string> = {
    computer: "电脑房",
    desk: "书桌",
    cafe: "咖啡馆",
    bedroom: "卧室",
    showroom: "展厅",
  };
  return names[room] || room;
}

function createMockDecision(body: DecisionRequest): DecisionResponse {
  const shouldReflect = body.intervention === "interrupt" || body.intervention === "remind";
  const finalRoom: RoomId = shouldReflect ? "desk" : body.room;

  return {
    decision: shouldReflect ? "modify_current" : "continue_current",
    final_room: finalRoom,
    final_task: shouldReflect ? `重新校准：${body.task}` : body.task,
    queue_change: {
      type: shouldReflect ? "modify_current" : "none",
      new_action: shouldReflect ? body.note ?? "先把目标讲清楚再继续。" : "",
    },
    decision_reason: "根据当前状态，我选择继续推进。",
    inner_monologue: shouldReflect ? "我需要确认自己不是在用忙碌掩盖迷路。" : "我先继续推进，把这一格点亮。",
    player_influence: body.intervention === "none" ? "low" : "medium",
    path_deviation: {
      changed: finalRoom !== body.room,
      from: body.room,
      to: finalRoom,
    },
    log_text: shouldReflect ? "数字人把手从键盘上移开，转身回到书桌。" : "数字人继续执行当前行动。",
  };
}
