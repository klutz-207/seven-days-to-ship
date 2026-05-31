import type { DecisionResponse, RoomId, ProjectMetrics, CharacterState, ActionLogEntry } from "./types";

interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DecisionContext {
  day: number;
  room: RoomId;
  task: string;
  pressure: number;
  selfhood: number;
  trust: number;
  focus: number;
  metrics?: ProjectMetrics;
  recentLogs?: ActionLogEntry[];
}

interface JournalContext {
  day: number;
  characterName: string;
  actions: Array<{ room: RoomId; task: string; progress: number }>;
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

/** 检测是否在 Tauri 环境中 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/** 调用 LLM API */
async function callLlm(messages: LlmMessage[], maxTokens = 800): Promise<string> {
  if (isTauri()) {
    // Tauri 环境：通过 Rust 端调用
    const { invoke } = await import("@tauri-apps/api/core");
    const response = await invoke<{ content: string }>("call_llm", {
      request: { messages, max_tokens: maxTokens, temperature: 0.7 },
    });
    return response.content;
  } else {
    // Web 环境：通过 API Route 调用
    const response = await fetch("/api/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, max_tokens: maxTokens }),
    });
    const data = await response.json();
    return data.content || "{}";
  }
}

/** 调用决策 API */
export async function callDecisionAPI(ctx: DecisionContext): Promise<DecisionResponse | null> {
  try {
    const response = await fetch("/api/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: ctx.room,
        task: ctx.task,
        day: ctx.day,
        pressure: ctx.pressure,
        selfhood: ctx.selfhood,
        trust: ctx.trust,
        focus: ctx.focus,
        metrics: ctx.metrics,
        recentLogs: ctx.recentLogs,
      }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Decision API failed:", error);
    return null;
  }
}

/** 调用日志 API */
export async function callJournalAPI(ctx: JournalContext): Promise<JournalResponse | null> {
  try {
    const response = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctx),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Journal API failed:", error);
    return null;
  }
}

/** Mock 决策数据 */
export function createMockDecision(ctx: DecisionContext): DecisionResponse {
  return {
    decision: "continue_current",
    final_room: ctx.room,
    final_task: ctx.task,
    queue_change: {
      type: "none",
      new_action: "",
    },
    decision_reason: "当前状态还可以，继续推进。",
    inner_monologue: "先把这一段写完。",
    reply: `我在${ctx.room === "computer" ? "写代码" : ctx.room === "desk" ? "整理思路" : "做当前的事"}。`,
    path_deviation: {
      changed: false,
      from: ctx.room,
      to: ctx.room,
    },
    log_text: `数字人继续执行当前行动。`,
  };
}
