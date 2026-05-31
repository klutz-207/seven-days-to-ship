/**
 * 统一 LLM 调用工具
 * 所有 API Route 共用，封装 fetch + API Key + 流式处理
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallLLMOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
}

/**
 * 调用 LLM API
 * @param messages 消息数组
 * @param stream 是否使用流式模式
 * @param options 可选参数（temperature, maxTokens, responseFormat）
 * @returns 非流式返回完整文本，流式返回 ReadableStream
 */
export async function callLLM(
  messages: Message[],
  stream: false,
  options?: CallLLMOptions
): Promise<string>;
export async function callLLM(
  messages: Message[],
  stream: true,
  options?: CallLLMOptions
): Promise<ReadableStream>;
export async function callLLM(
  messages: Message[],
  stream: boolean = false,
  options?: CallLLMOptions
): Promise<string | ReadableStream> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_API_BASE_URL || "https://tokendance.space/gateway";

  if (!apiKey) {
    throw new Error("LLM_API_KEY not set");
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-v3.2",
      messages,
      stream,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 800,
      ...(options?.responseFormat ? { response_format: options.responseFormat } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  if (stream) {
    if (!response.body) {
      throw new Error("LLM API returned empty stream body");
    }
    return response.body;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("LLM API returned empty content");
  }

  return content;
}

/**
 * 从流式响应中读取完整文本
 * 用于需要解析流式 JSON 的场景
 */
export async function readStreamContent(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

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
          }
        } catch {
          // 跳过无法解析的 chunk
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullContent;
}
