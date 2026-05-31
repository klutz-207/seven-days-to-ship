import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { PRODUCT_SYSTEM_PROMPT, buildProductPrompt } from "@/lib/prompts";
import { judgeEnding } from "@/lib/endingJudge";
import type { GameState, RoomId } from "@/lib/types";

interface EndingRequest {
  state: GameState;
}

interface ProductResult {
  productName: string;
  description: string;
  features: string[];
  techStack: string[];
  evaluation: string;
}

function createMockProduct(state: GameState): ProductResult {
  const { metrics, character } = state;
  const endingTitle = judgeEnding(state);

  // 根据最强指标选择产品方向
  const metricEntries = Object.entries(metrics) as [string, number][];
  const strongest = metricEntries.reduce((a, b) => (a[1] >= b[1] ? a : b));
  const weakest = metricEntries.reduce((a, b) => (a[1] <= b[1] ? a : b));

  const names: Record<string, string> = {
    feature: "功能驱动",
    clarity: "逻辑清晰",
    stability: "稳如磐石",
    presentation: "颜值担当",
    creativity: "创意独特",
  };

  const techStacks: Record<string, string[]> = {
    feature: ["React", "Node.js", "PostgreSQL"],
    clarity: ["Next.js", "Figma", "Notion"],
    stability: ["TypeScript", "Docker", "CI/CD"],
    presentation: ["Tailwind CSS", "Framer Motion", "Vercel"],
    creativity: ["Three.js", "WebAudio", "Canvas"],
  };

  return {
    productName: `七天作品`,
    description: `一个${names[strongest[0]] || "在七天内完成"}的项目，${endingTitle}。`,
    features: [
      metrics.feature >= 50 ? "完整的核心功能" : "基础功能原型",
      metrics.clarity >= 50 ? "清晰的用户路径" : "待梳理的交互流程",
      metrics.stability >= 50 ? "稳定可运行" : "偶尔会崩",
    ],
    techStack: techStacks[strongest[0]] || ["Next.js", "TypeScript"],
    evaluation: `最强${names[strongest[0]]}（${strongest[1]}），最弱${names[weakest[0]]}（${weakest[1]}）。${endingTitle}。`,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as EndingRequest;
  const { state } = body;

  // 如果没有配置 API Key，使用 mock
  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE_URL) {
    return NextResponse.json(createMockProduct(state));
  }

  try {
    const endingTitle = judgeEnding(state);

    const prompt = buildProductPrompt({
      endingTitle,
      metrics: state.metrics,
      character: state.character,
      day: state.day,
      path: state.path,
      logs: state.logs.map((l) => l.text),
    });

    const content = await callLLM(
      [
        { role: "system", content: PRODUCT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      false,
      { temperature: 0.7, maxTokens: 800, responseFormat: { type: "json_object" } }
    );

    const product = JSON.parse(content) as ProductResult;

    // 确保字段完整
    return NextResponse.json({
      productName: product.productName || "七天作品",
      description: product.description || "一个在七天内完成的项目。",
      features: Array.isArray(product.features) ? product.features : ["基础功能"],
      techStack: Array.isArray(product.techStack) ? product.techStack : ["Next.js"],
      evaluation: product.evaluation || "不完美，但能跑。",
    });
  } catch (error) {
    console.error("Ending LLM call failed:", error);
    return NextResponse.json(createMockProduct(state));
  }
}
