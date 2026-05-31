import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";

interface CharacterRequest {
  name: string;
}

interface CharacterData {
  personality: string;
  trait: string;
  catchphrase: string;
  narration: string;
}

const CHARACTER_SYSTEM_PROMPT = `你是一个性格生成器。根据用户给出的名字，为这个数字人角色生成性格设定。

你必须严格返回一个 JSON 对象，不要包含任何其他文字、解释或 markdown 格式。

{
  "personality": "从 工程型/创作型/展示型/焦虑型 中选一个",
  "trait": "一句描述这个人的特质（15字以内）",
  "catchphrase": "一句口头禅（10字以内）",
  "narration": "用第一人称介绍这个人的旁白（80-120字），语调安静、有画面感"
}

规则：
- 根据名字的"感觉"选择性格类型。名字硬朗→工程型，名字灵动→创作型，名字响亮→展示型，名字小→焦虑型
- trait 要有画面感，能让人一眼想象出这个人的习惯
- catchphrase 要口语化，像这个人真的会说的话
- narration 以第三人称描述，像在讲述一个故事的开头`;

function createMockCharacter(name: string): CharacterData {
  return {
    personality: "工程型",
    trait: "遇到 Bug 会较真",
    catchphrase: "先跑起来再说",
    narration: `他的名字叫「${name}」。此刻他坐在电脑前，屏幕上闪烁着未完成的代码。窗外的天已经暗了，但他没有注意到。他打开终端，深吸一口气，开始敲下第一行代码。七天后的他，会是什么样子？`,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as CharacterRequest;
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // 如果没有配置 API Key，使用 mock
  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE_URL) {
    return streamMockCharacter(name);
  }

  try {
    const llmStream = await callLLM(
      [
        { role: "system", content: CHARACTER_SYSTEM_PROMPT },
        { role: "user", content: `名字：${name}` },
      ],
      true,
      { temperature: 0.8, maxTokens: 500 }
    );

    // 流式转发 SSE
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = llmStream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

            for (const line of lines) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullContent += delta;
                  controller.enqueue(encoder.encode(`data: ${delta}\n\n`));
                }
              } catch {
                // 跳过无法解析的 chunk
              }
            }
          }

          // 流结束时发送完整结构化数据
          const character = extractCharacterData(fullContent, name);
          controller.enqueue(
            encoder.encode(`data: [DONE]${JSON.stringify(character)}\n\n`)
          );
        } catch (err) {
          console.error("Stream reading error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(createMockCharacter(name))}\n\n`)
          );
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Character API failed:", error);
    return streamMockCharacter(name);
  }
}

/** 流式输出 mock 数据（逐字发送 narration） */
function streamMockCharacter(name: string) {
  const mock = createMockCharacter(name);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 逐字发送 narration
      const chars = mock.narration.split("");
      let i = 0;
      const interval = setInterval(() => {
        if (i < chars.length) {
          controller.enqueue(encoder.encode(`data: ${chars[i]}\n\n`));
          i++;
        } else {
          clearInterval(interval);
          controller.enqueue(
            encoder.encode(`data: [DONE]${JSON.stringify(mock)}\n\n`)
          );
          controller.close();
        }
      }, 30);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/** 从 LLM 输出中提取结构化数据 */
function extractCharacterData(content: string, name: string): CharacterData {
  try {
    // 尝试直接解析
    const parsed = JSON.parse(content) as CharacterData;
    if (parsed.personality && parsed.trait && parsed.catchphrase && parsed.narration) {
      return parsed;
    }
  } catch {
    // 尝试从 markdown 代码块中提取
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim()) as CharacterData;
        if (parsed.personality && parsed.narration) return parsed;
      } catch {
        // ignore
      }
    }
  }

  return createMockCharacter(name);
}
