import { NextResponse } from "next/server";
import { decisionPrompt } from "@/lib/prompts";
import type { DecisionResponse, InterventionType, RoomId } from "@/lib/types";

interface DecisionRequest {
  room: RoomId;
  task: string;
  intervention: InterventionType;
  note?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as DecisionRequest;

  if (!process.env.LLM_API_KEY) {
    return NextResponse.json(createMockDecision(body));
  }

  return NextResponse.json({
    ...createMockDecision(body),
    decision_reason: `${decisionPrompt} 当前尚未接入具体供应商 SDK，请在这里补充后端 LLM 调用。`,
  });
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
    decision_reason: "MVP Mock：根据干预类型返回一个稳定的可测试决策。",
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
