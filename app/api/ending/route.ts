import { NextResponse } from "next/server";
import { judgeEnding } from "@/lib/endingJudge";
import type { GameState } from "@/lib/types";

interface EndingRequest {
  state: GameState;
}

export async function POST(request: Request) {
  const body = (await request.json()) as EndingRequest;
  const endingTitle = judgeEnding(body.state);

  // 如果没有配置 API Key，使用 mock
  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE_URL) {
    return NextResponse.json(createMockEnding(endingTitle, body.state));
  }

  try {
    const prompt = buildEndingPrompt(endingTitle, body.state);

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
            content: ENDING_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      console.error("LLM API error:", response.status);
      return NextResponse.json(createMockEnding(endingTitle, body.state));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(createMockEnding(endingTitle, body.state));
    }

    // 解析 LLM 返回的结局文本
    const lines = content.split("\n").filter((l: string) => l.trim());
    const projectEnding = lines[0] || "项目完成了，但故事还没有结束。";
    const personalityEnding = lines[1] || "数字人在这七天里，找到了自己的节奏。";
    const pathReport = lines.slice(2).join("\n") || "每一天的选择，都刻在了路径里。";

    return NextResponse.json({
      endingTitle,
      projectEnding,
      personalityEnding,
      pathReport,
    });
  } catch (error) {
    console.error("LLM call failed:", error);
    return NextResponse.json(createMockEnding(endingTitle, body.state));
  }
}

const ENDING_SYSTEM_PROMPT = `你是一个游戏结局叙述者。你需要为一个 AI 数字人写结局。

游戏背景：数字人参加了一个 7 天的 AI Hackathon 比赛。玩家可以干预数字人的行动。7 天后，根据项目完成度、人格状态、路径选择，生成不同的结局。

你需要写三段文字：
1. 项目结局：描述项目的最终状态
2. 人格结局：描述数字人的成长或变化
3. 路径报告：总结数字人的选择和历程

风格要求：
- 文字要克制、真实，不要煽情
- 用第三人称描述
- 每段 1-2 句话，不要太长
- 可以带一点诗意，但不要矫情`;

function buildEndingPrompt(title: string, state: GameState): string {
  const { metrics, character, day, path, logs } = state;

  return `结局标题：${title}

项目最终状态：
- 功能完整度：${metrics.feature}/100
- 玩法清晰度：${metrics.clarity}/100
- 技术稳定性：${metrics.stability}/100
- 展示表现：${metrics.presentation}/100
- 创意表达：${metrics.creativity}/100

数字人最终状态：
- 压力：${character.pressure}/100
- 自我感：${character.selfhood}/100
- 信任：${character.trust}/100
- 注意力：${character.focus}/100

历程：
- 总天数：${day}
- 访问过的房间：${[...new Set(path)].join(" → ")}
- 行动日志数量：${logs.length}

请根据以上信息，写出项目结局、人格结局和路径报告。每段 1-2 句话。`;
}

function createMockEnding(title: string, state: GameState) {
  return {
    endingTitle: title,
    projectEnding: "项目在第七天停下了。它不完美，但它能跑。",
    personalityEnding: "数字人没有庆祝，只是关掉了终端，安静地坐在那里。",
    pathReport: "七天，五个房间，十二次选择。每一步都是真实的。",
  };
}
