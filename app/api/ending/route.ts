import { NextResponse } from "next/server";
import { judgeEnding } from "@/lib/endingJudge";
import { endingPrompt } from "@/lib/prompts";
import type { GameState } from "@/lib/types";

export async function POST(request: Request) {
  const state = (await request.json()) as GameState;
  const title = judgeEnding(state);

  if (!process.env.LLM_API_KEY) {
    return NextResponse.json({
      title,
      projectEnding: `《${title}》：这是 MVP Mock 结局，后续由 LLM 扩写项目报告。`,
      personalityEnding: "他记住了哪些干预让自己更像自己，也记住了哪些沉默让路径偏远。",
      pathReport: `共点亮 ${state.path.length} 个房间格子。`,
    });
  }

  return NextResponse.json({
    title,
    projectEnding: `${endingPrompt} 当前尚未接入具体供应商 SDK，请在这里补充后端 LLM 调用。`,
    personalityEnding: "待 LLM 生成。",
    pathReport: `共点亮 ${state.path.length} 个房间格子。`,
  });
}
