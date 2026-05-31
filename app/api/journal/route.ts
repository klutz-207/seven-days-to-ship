import { NextResponse } from "next/server";
import { JOURNAL_SYSTEM_PROMPT, buildJournalPrompt } from "@/lib/prompts";
import type { ActionNode, CharacterState, ProjectMetrics, RoomId } from "@/lib/types";

interface JournalRequest {
  day: number;
  characterName: string;
  actions: ActionNode[];
  metrics: ProjectMetrics;
  character: CharacterState;
  path: RoomId[];
}

export interface JournalResponse {
  done: string;
  discovered: string;
  attempted: string;
  expected: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as JournalRequest;

  // 如果没有配置 API Key，使用 mock
  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE_URL) {
    return NextResponse.json(createMockJournal(body));
  }

  try {
    const prompt = buildJournalPrompt({
      day: body.day,
      characterName: body.characterName,
      actions: body.actions.map((a) => ({
        room: a.room,
        task: a.task,
        status: a.status,
        progress: a.progress,
      })),
      metrics: body.metrics,
      character: body.character,
      path: body.path,
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
            content: JOURNAL_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("LLM API error:", response.status, response.statusText);
      return NextResponse.json(createMockJournal(body));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(createMockJournal(body));
    }

    const journal = JSON.parse(content) as JournalResponse;
    return NextResponse.json(journal);
  } catch (error) {
    console.error("LLM call failed:", error);
    return NextResponse.json(createMockJournal(body));
  }
}

function createMockJournal(body: JournalRequest): JournalResponse {
  const completedCount = body.actions.filter((a) => a.status === "completed").length;
  const roomSummary = [...new Set(body.actions.map((a) => a.room))].join("、");

  return {
    done: `今天在${roomSummary || "各个房间"}完成了 ${completedCount} 个任务，进度还在往前推。`,
    discovered: `功能做得越多，越发现清晰度跟不上——有些地方我自己都说不清楚为什么要这么做。`,
    attempted: `试着把核心玩法重新梳理了一遍，但写到一半又回去改代码了。`,
    expected: `明天先把今天卡住的地方理清楚，不能再闷头往前冲了。`,
  };
}
