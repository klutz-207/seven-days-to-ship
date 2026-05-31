import { NextResponse } from "next/server";
import { DECISION_SYSTEM_PROMPT, buildDecisionPrompt } from "@/lib/prompts";
import type { DecisionResponse, RoomId, AiDecision } from "@/lib/types";

interface DecisionRequest {
  room: RoomId;
  task: string;
  day: number;
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

export async function POST(request: Request) {
  const body = (await request.json()) as DecisionRequest;

  // 如果没有配置 API Key，使用 mock
  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE_URL) {
    return NextResponse.json(createMockDecision(body));
  }

  try {
    const prompt = buildDecisionPrompt({
      day: body.day,
      room: body.room,
      task: body.task,
      pressure: body.pressure,
      selfhood: body.selfhood,
      trust: body.trust,
      focus: body.focus,
      metrics: body.metrics,
      recentLogs: body.recentLogs,
    });

    const response = await fetch(`${process.env.LLM_API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v3.2",
        messages: [
          {
            role: "system",
            content: DECISION_SYSTEM_PROMPT,
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

// ─── Mock 决策生成 ───────────────────────────────────────────────

const ROOM_NAMES: Record<RoomId, string> = {
  computer: "电脑房",
  desk: "书桌",
  cafe: "咖啡馆",
  bedroom: "卧室",
  showroom: "展示厅",
};

function createMockDecision(body: DecisionRequest): DecisionResponse {
  const { room, task, day, pressure, selfhood, focus, metrics } = body;

  // 核心状态判断
  const isHighPressure = pressure >= 75;
  const isLowSelfhood = selfhood <= 30;
  const isLowFocus = focus <= 25;
  const isHighFocus = focus >= 70;
  const isLateGame = day >= 6;
  const isEarlyGame = day <= 2;

  // 检测失衡
  const hasImbalance = metrics
    ? (metrics.feature >= 75 && metrics.clarity <= 40) ||
      (metrics.creativity >= 75 && metrics.feature <= 35) ||
      (metrics.presentation >= 70 && metrics.stability <= 40) ||
      (metrics.stability >= 75 && metrics.creativity <= 35)
    : false;

  // 晚期 + 高压力 → 冲刺
  if (isLateGame && isHighPressure) {
    return buildResponse({
      decision: "continue_current",
      finalRoom: room,
      finalTask: task,
      queueType: "none",
      queueAction: "",
      reason: "没时间犹豫了，先冲过去再说。",
      monologue: "还剩两天。不管了，先做出来。",
      fromRoom: room,
      logText: `数字人没有抬头，手指在键盘上飞快地移动。${ROOM_NAMES[room]}里只剩下敲击声。`,
      reply: "",
    });
  }

  // 早期 + 低清晰度 → 去书桌规划
  if (isEarlyGame && metrics && metrics.clarity <= 35 && room !== "desk") {
    return buildResponse({
      decision: "switch_room",
      finalRoom: "desk",
      finalTask: "梳理项目方向和核心玩法",
      queueType: "replace_next",
      queueAction: "先搞清楚要做什么",
      reason: "我还没想清楚到底要做什么，先去书桌理理思路。",
      monologue: "不能一上来就写代码，得先想清楚。",
      fromRoom: room,
      logText: `数字人合上笔记本，起身走向书桌。他翻开空白文档，开始梳理项目的核心想法。`,
      reply: "我先想想这个项目到底要做什么。",
    });
  }

  // 失衡检测 → 暂停审视
  if (hasImbalance) {
    return buildResponse({
      decision: "pause_and_reflect",
      finalRoom: "desk",
      finalTask: "审视项目是否存在失衡",
      queueType: "insert_next",
      queueAction: "去书桌做一次项目复盘",
      reason: "好像有什么不太对……我需要退一步看看全局。",
      monologue: "总觉得哪里不对劲，但说不上来。",
      fromRoom: room,
      logText: `数字人停下手里的活，盯着屏幕发了一会儿呆。他拿起笔记本走向书桌，准备重新审视整个项目。`,
      reply: pickRandom([
        "等一下，好像哪里不太对……",
        "我需要想想整体的方向。",
        "",
      ]),
    });
  }

  // 高注意力 → 高效推进
  if (isHighFocus) {
    return buildResponse({
      decision: "continue_current",
      finalRoom: room,
      finalTask: task,
      queueType: "none",
      queueAction: "",
      reason: "状态不错，趁现在多推进一些。",
      monologue: "进入状态了。继续。",
      fromRoom: room,
      logText: `数字人进入了工作状态。${ROOM_NAMES[room]}里，他的手指几乎没有停过。`,
      reply: "",
    });
  }

  // 低注意力 + 不在卧室 → 去休息
  if (isLowFocus && room !== "bedroom") {
    return buildResponse({
      decision: "switch_room",
      finalRoom: "bedroom",
      finalTask: "休息一下恢复注意力",
      queueType: "insert_next",
      queueAction: "先休息一下",
      reason: "注意力不太行了，需要休息一下再继续。",
      monologue: "眼皮有点重……效率太低了，不如先歇会儿。",
      fromRoom: room,
      logText: `数字人揉了揉脖子，起身离开${ROOM_NAMES[room]}。他走向卧室，打算小憩一下。`,
      reply: "我有点累了，先休息一下。",
    });
  }

  // 低自我感 + 不在咖啡馆/卧室 → 去找人聊聊
  if (isLowSelfhood && room !== "cafe" && room !== "bedroom") {
    return buildResponse({
      decision: "switch_room",
      finalRoom: "cafe",
      finalTask: "找人聊聊，确认方向",
      queueType: "insert_next",
      queueAction: "去咖啡馆交流一下",
      reason: "我不太确定自己做的对不对，也许该找人聊聊。",
      monologue: "最近总觉得自己在瞎搞。",
      fromRoom: room,
      logText: `数字人放下手中的东西，起身走向咖啡馆。他想找个人聊聊，看看自己的方向是不是对的。`,
      reply: "我去转转，换换脑子。",
    });
  }

  // 默认：继续当前
  return buildResponse({
    decision: "continue_current",
    finalRoom: room,
    finalTask: task,
    queueType: "none",
    queueAction: "",
    reason: "继续推进，没什么好犹豫的。",
    monologue: "一步一步来。",
    fromRoom: room,
    logText: `数字人在${ROOM_NAMES[room]}里继续当前的工作。`,
    reply: "",
  });
}

// ─── 辅助函数 ────────────────────────────────────────────────────

function buildResponse(params: {
  decision: AiDecision;
  finalRoom: RoomId;
  finalTask: string;
  queueType: "none" | "modify_current" | "insert_next" | "replace_next" | "clear_rest";
  queueAction: string;
  reason: string;
  monologue: string;
  fromRoom: RoomId;
  logText: string;
  reply: string;
}): DecisionResponse {
  return {
    decision: params.decision,
    final_room: params.finalRoom,
    final_task: params.finalTask,
    queue_change: {
      type: params.queueType,
      new_action: params.queueAction,
    },
    decision_reason: params.reason,
    inner_monologue: params.monologue,
    path_deviation: {
      changed: params.fromRoom !== params.finalRoom,
      from: params.fromRoom,
      to: params.finalRoom,
    },
    log_text: params.logText,
    reply: params.reply,
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
