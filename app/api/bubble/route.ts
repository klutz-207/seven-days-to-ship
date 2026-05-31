import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { BUBBLE_SYSTEM_PROMPT, buildBubblePrompt } from "@/lib/prompts";
import type { RoomId } from "@/lib/types";

interface BubbleRequest {
  roomId: RoomId;
  state: {
    day: number;
    pressure: number;
    selfhood: number;
    trust: number;
    focus: number;
  };
  messages: Array<{ role: string; content: string }>;
}

const MOCK_BUBBLES: Record<RoomId, string[]> = {
  computer: [
    "键盘上还有上次留下的指纹。继续吧。",
    "屏幕亮了。代码还在。还能跑。",
    "显示器的光有点刺眼，但不想调了。",
  ],
  desk: [
    "白纸上还留着昨天的笔记。字迹有点潦草。",
    "把思路理一理，别急着动手。",
    "桌上的咖啡杯还没洗。算了，先不管。",
  ],
  cafe: [
    "旁边那桌在讨论什么，有点吵。",
    "闻到咖啡味了。也许该找人聊聊。",
    "看看别人做到哪了。",
  ],
  bedroom: [
    "床单有点皱。管不了那么多了。",
    "躺一会儿吧。就一会儿。",
    "窗帘拉着，光线刚刚好。",
  ],
  showroom: [
    "空荡荡的，但能想象坐满人的样子。",
    "投影仪还没开。先想想怎么讲。",
    "站在这里，突然有点紧张。",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request: Request) {
  const body = (await request.json()) as BubbleRequest;

  // 如果没有配置 API Key，使用 mock
  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE_URL) {
    const fallback = pickRandom(MOCK_BUBBLES[body.roomId]);
    return NextResponse.json({ bubbles: [fallback] });
  }

  try {
    const userPrompt = buildBubblePrompt({
      roomId: body.roomId,
      day: body.state.day,
      pressure: body.state.pressure,
      selfhood: body.state.selfhood,
      trust: body.state.trust,
      focus: body.state.focus,
    });

    const content = await callLLM(
      [
        { role: "system", content: BUBBLE_SYSTEM_PROMPT },
        ...body.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: userPrompt },
      ],
      false,
      { temperature: 0.8, maxTokens: 200 }
    );

    // 按换行或句号拆分为多句，过滤空行
    const sentences = content
      .split(/[\n。！？]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
      .map((s: string) => (s.endsWith("。") || s.endsWith("！") || s.endsWith("？") ? s : s + "。"));

    return NextResponse.json({ bubbles: sentences.length > 0 ? sentences : [content] });
  } catch (error) {
    console.error("Bubble API failed:", error);
    const fallback = pickRandom(MOCK_BUBBLES[body.roomId]);
    return NextResponse.json({ bubbles: [fallback] });
  }
}
