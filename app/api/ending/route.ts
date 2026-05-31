import { NextResponse } from "next/server";
import { judgeEnding } from "@/lib/endingJudge";
import {
  ENDING_SYSTEM_PROMPT,
  buildEndingPrompt,
  PRODUCT_SYSTEM_PROMPT,
  buildProductPrompt,
} from "@/lib/prompts";
import type { GameState } from "@/lib/types";

interface EndingRequest {
  state: GameState;
}

interface EndingResult {
  endingTitle: string;
  projectEnding: string;
  personalityEnding: string;
  pathReport: string;
  product: ProductInfo;
}

interface ProductInfo {
  productName: string;
  description: string;
  features: string[];
  techStack: string[];
  evaluation: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as EndingRequest;
  const endingTitle = judgeEnding(body.state);

  // 如果没有配置 API Key，使用 mock
  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE_URL) {
    return NextResponse.json(createMockEnding(endingTitle, body.state));
  }

  try {
    const { metrics, character, day, path, logs } = body.state;

    // 并行请求结局文案和产品信息
    const [endingResult, productResult] = await Promise.all([
      generateEnding(endingTitle, body.state),
      generateProduct(body.state),
    ]);

    return NextResponse.json({
      endingTitle,
      ...endingResult,
      product: productResult,
    });
  } catch (error) {
    console.error("LLM call failed:", error);
    return NextResponse.json(createMockEnding(endingTitle, body.state));
  }
}

async function generateEnding(
  endingTitle: string,
  state: GameState
): Promise<{ projectEnding: string; personalityEnding: string; pathReport: string }> {
  const prompt = buildEndingPrompt({
    endingTitle,
    metrics: state.metrics,
    character: state.character,
    day: state.day,
    path: state.path,
    logCount: state.logs.length,
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
        { role: "system", content: ENDING_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    console.error("Ending LLM API error:", response.status);
    return {
      projectEnding: "项目在第七天停下了。它不完美，但它能跑。",
      personalityEnding: "数字人没有庆祝，只是关掉了终端，安静地坐在那里。",
      pathReport: "七天，五个房间，十二次选择。每一步都是真实的。",
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return {
      projectEnding: "项目在第七天停下了。它不完美，但它能跑。",
      personalityEnding: "数字人没有庆祝，只是关掉了终端，安静地坐在那里。",
      pathReport: "七天，五个房间，十二次选择。每一步都是真实的。",
    };
  }

  const lines = content.split("\n").filter((l: string) => l.trim());
  return {
    projectEnding: lines[0] || "项目完成了，但故事还没有结束。",
    personalityEnding: lines[1] || "数字人在这七天里，找到了自己的节奏。",
    pathReport: lines.slice(2).join("\n") || "每一天的选择，都刻在了路径里。",
  };
}

async function generateProduct(state: GameState): Promise<ProductInfo> {
  const prompt = buildProductPrompt({
    endingTitle: judgeEnding(state),
    metrics: state.metrics,
    character: state.character,
    day: state.day,
    path: state.path,
    logs: state.logs.map((l) => l.text),
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
        { role: "system", content: PRODUCT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    console.error("Product LLM API error:", response.status);
    return getDefaultProduct(state);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return getDefaultProduct(state);
  }

  try {
    // 尝试从 JSON 块或纯 JSON 中提取
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    const jsonStr = jsonMatch[1].trim();
    const parsed = JSON.parse(jsonStr);

    return {
      productName: parsed.productName || "无名项目",
      description: parsed.description || "一个在七天里诞生的产品。",
      features: Array.isArray(parsed.features) ? parsed.features.slice(0, 5) : [],
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
      evaluation: parsed.evaluation || "它存在过，这就够了。",
    };
  } catch {
    console.error("Failed to parse product JSON:", content);
    return getDefaultProduct(state);
  }
}

function getDefaultProduct(state: GameState): ProductInfo {
  // 根据指标推断默认产品特征
  const { metrics } = state;
  const features: string[] = [];

  if (metrics.feature >= 60) features.push("核心功能可用");
  if (metrics.clarity >= 60) features.push("目标定位清晰");
  if (metrics.stability >= 60) features.push("运行稳定可靠");
  if (metrics.presentation >= 60) features.push("界面表现完整");
  if (metrics.creativity >= 60) features.push("有独特创意点");

  if (features.length === 0) features.push("完成基本框架");

  // 根据最强指标推断技术栈
  const techStack: string[] = [];
  const metricEntries = Object.entries(metrics) as [string, number][];
  const strongest = metricEntries.reduce((a, b) => (a[1] >= b[1] ? a : b))[0];

  if (strongest === "feature" || strongest === "stability") {
    techStack.push("React", "Node.js");
  } else if (strongest === "creativity") {
    techStack.push("TypeScript", "Canvas/WebGL");
  } else {
    techStack.push("Next.js", "Tailwind CSS");
  }

  return {
    productName: "七天之作",
    description: `一个在7天极限开发中诞生的产品。`,
    features,
    techStack,
    evaluation: "它不完美，但它是真实的。",
  };
}

function createMockEnding(title: string, state: GameState) {
  return {
    endingTitle: title,
    projectEnding: "项目在第七天停下了。它不完美，但它能跑。",
    personalityEnding: "数字人没有庆祝，只是关掉了终端，安静地坐在那里。",
    pathReport: "七天，五个房间，十二次选择。每一步都是真实的。",
    product: getDefaultProduct(state),
  };
}
