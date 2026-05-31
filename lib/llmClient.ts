import type { DecisionResponse, RoomId, ProjectMetrics, CharacterState, ActionLogEntry, ProjectConcept } from "./types";

export interface ThinkingResponse {
  thinking: string;
  mood: "focused" | "anxious" | "confused" | "excited" | "tired";
}

interface ThinkingContext {
  room: RoomId;
  task: string;
  day: number;
  characterName: string;
  personality?: string;
  trait?: string;
  project?: ProjectConcept;
  character: CharacterState;
}

export interface VisionResponse {
  projectName: string;
  pitch: string;
  coreLoop: string;
  motivation: string;
}

interface VisionContext {
  characterName: string;
  personality: string;
  trait: string;
  catchphrase: string;
}

interface DecisionContext {
  day: number;
  room: RoomId;
  task: string;
  project?: ProjectConcept;
  pressure: number;
  selfhood: number;
  trust: number;
  focus: number;
  metrics?: ProjectMetrics;
  recentLogs?: ActionLogEntry[];
  playerInput?: string;
  thinking?: string;
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

/** 调用思考 API - 数字人进入房间后的主动思考 */
export async function callThinkingAPI(ctx: ThinkingContext): Promise<ThinkingResponse | null> {
  try {
    const response = await fetch("/api/thinking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctx),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Thinking API failed:", error);
    return null;
  }
}

/** 调用愿景 API - 数字人自主构想项目 */
export async function callVisionAPI(ctx: VisionContext): Promise<VisionResponse | null> {
  try {
    const response = await fetch("/api/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctx),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Vision API failed:", error);
    return null;
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
        project: ctx.project,
        day: ctx.day,
        pressure: ctx.pressure,
        selfhood: ctx.selfhood,
        trust: ctx.trust,
        focus: ctx.focus,
        metrics: ctx.metrics,
        recentLogs: ctx.recentLogs,
        playerInput: ctx.playerInput,
        thinking: ctx.thinking,
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

interface PlanContext {
  day: number;
  characterName: string;
  personality: string;
  trait: string;
}

export interface PlanResponse {
  rooms: RoomId[];
  tasks: string[];
}

/** 调用计划 API，让角色自主决定今天的安排 */
export async function callPlanAPI(ctx: PlanContext): Promise<PlanResponse | null> {
  try {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctx),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Plan API failed:", error);
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
    decision_reason: ctx.project
      ? `我先继续围绕《${ctx.project.name}》推进当前任务。`
      : "当前状态还可以，继续推进。",
    inner_monologue: ctx.project
      ? `《${ctx.project.name}》的核心还不能散，先把这一段做扎实。`
      : "先把这一段写完。",
    player_influence: "low",
    reply: `我在${ctx.room === "computer" ? "写代码" : ctx.room === "desk" ? "整理思路" : "做当前的事"}。`,
    path_deviation: {
      changed: false,
      from: ctx.room,
      to: ctx.room,
    },
    log_text: ctx.project
      ? `数字人继续推进《${ctx.project.name}》：${ctx.task}。`
      : `数字人继续执行当前行动。`,
  };
}
