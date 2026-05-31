import { generateDayPlan } from "./planGenerator";
import { pickInspiration } from "./eventEngine";
import type {
  ActionNode,
  ActionLogEntry,
  CharacterState,
  DecisionResponse,
  GameState,
  ProjectMetrics,
  RoomId,
} from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const DEFAULT_PROJECT = {
  name: "情绪修补站",
  pitch: "一款让玩家修复数字人心智裂缝的叙事解谜小游戏",
  coreLoop: "观察异常 -> 选择干预 -> 修复房间 -> 解锁记忆片段",
};

export function calculateMainProgress(metrics: ProjectMetrics) {
  return clamp(
    metrics.feature * 0.35 +
      metrics.clarity * 0.25 +
      metrics.stability * 0.2 +
      metrics.presentation * 0.1 +
      metrics.creativity * 0.1,
  );
}

export function createInitialState(): GameState {
  const actions = generateDayPlan(1);

  return {
    day: 1,
    currentActionIndex: 0,
    actions,
    project: DEFAULT_PROJECT,
    metrics: {
      feature: 18,
      clarity: 22,
      stability: 20,
      presentation: 8,
      creativity: 30,
    },
    character: {
      pressure: 28,
      selfhood: 52,
      trust: 48,
      focus: 66,
    },
    characterName: "",
    path: [],
    logs: [
      {
        id: "start",
        day: 1,
        text: "Day 1 开始：数字人站在房间门口，等待第一个行动节点被点亮。",
      },
    ],
    completedOriginalActions: 0,
    isEnded: false,
    inspirationSet: [],
  };
}

export function advanceState(
  state: GameState,
  progressStep = 30,
): GameState {
  const current = state.actions[state.currentActionIndex];
  if (!current || state.isEnded) {
    return state;
  }

  const nextProgress = clamp(current.progress + progressStep);
  const completed = nextProgress >= 100;
  const nextAction: ActionNode = {
    ...current,
    progress: completed ? 100 : nextProgress,
    status: completed ? "completed" : ("running" as const),
  };

  const metrics = mergeMetrics(state.metrics, current.expectedGain, completed ? 1 : 0.35);
  const character = mergeCharacter(
    state.character,
    current.expectedCost,
    completed ? 1 : 0.35,
  );

  const actions = [...state.actions];
  actions[state.currentActionIndex] = nextAction;

  // 灵感收集：行动完成时尝试从当前房间获取灵感
  const inspiration = completed
    ? pickInspiration(current.room, state.inspirationSet)
    : undefined;
  const nextInspirationSet = inspiration
    ? [...state.inspirationSet, inspiration]
    : state.inspirationSet;

  return {
    ...state,
    actions,
    metrics,
    character,
    path: completed ? [...state.path, current.room] : state.path,
    logs: [
      makeLog(state.day, current.room, current.task, completed, inspiration),
      ...state.logs,
    ].slice(0, 24),
    completedOriginalActions: state.completedOriginalActions + (completed ? 1 : 0),
    inspirationSet: nextInspirationSet,
  };
}

export function advanceToNextAction(state: GameState): GameState {
  const current = state.actions[state.currentActionIndex];
  if (!current || state.isEnded || current.progress < 100) {
    return state;
  }

  const isLastAction = state.currentActionIndex >= state.actions.length - 1;
  if (!isLastAction) {
    return {
      ...state,
      currentActionIndex: state.currentActionIndex + 1,
    };
  }

  const nextDay = state.day + 1;
  const shouldEnd = nextDay > 2; // 2天结束

  return {
    ...state,
    day: shouldEnd ? 2 : nextDay,
    currentActionIndex: 0,
    actions: shouldEnd ? state.actions : generateDayPlan(nextDay),
    isEnded: shouldEnd,
  };
}

export function applyDecisionToState(
  state: GameState,
  decision: DecisionResponse,
): GameState {
  const current = state.actions[state.currentActionIndex];
  if (!current || state.isEnded || current.progress >= 100) {
    return state;
  }

  const shouldModifyCurrent =
    decision.queue_change.type === "modify_current" ||
    decision.decision === "switch_room" ||
    decision.decision === "switch_task" ||
    decision.final_room !== current.room ||
    decision.final_task !== current.task;

  const actions = [...state.actions];
  const nextAction = createDecisionAction(current, decision);

  if (shouldModifyCurrent) {
    actions[state.currentActionIndex] = nextAction;
  }

  if (decision.queue_change.type === "insert_next") {
    actions.splice(state.currentActionIndex + 1, 0, {
      ...nextAction,
      id: `${current.id}-inserted`,
      progress: 0,
      status: "pending",
    });
  }

  if (decision.queue_change.type === "replace_next") {
    const replacement = {
      ...nextAction,
      id: `${current.id}-replacement`,
      progress: 0,
      status: "pending" as const,
    };

    if (state.currentActionIndex + 1 < actions.length) {
      actions[state.currentActionIndex + 1] = replacement;
    } else {
      actions.push(replacement);
    }
  }

  if (decision.queue_change.type === "clear_rest") {
    actions.splice(state.currentActionIndex + 1);
  }

  return {
    ...state,
    actions,
  };
}

function mergeMetrics(
  metrics: ProjectMetrics,
  gain: Partial<ProjectMetrics>,
  ratio: number,
): ProjectMetrics {
  return {
    feature: clamp(metrics.feature + (gain.feature ?? 0) * ratio),
    clarity: clamp(metrics.clarity + (gain.clarity ?? 0) * ratio),
    stability: clamp(metrics.stability + (gain.stability ?? 0) * ratio),
    presentation: clamp(metrics.presentation + (gain.presentation ?? 0) * ratio),
    creativity: clamp(metrics.creativity + (gain.creativity ?? 0) * ratio),
  };
}

function mergeCharacter(
  character: CharacterState,
  cost: Partial<CharacterState>,
  ratio: number,
): CharacterState {
  return {
    pressure: clamp(character.pressure + (cost.pressure ?? 0) * ratio),
    selfhood: clamp(character.selfhood + (cost.selfhood ?? 0) * ratio),
    trust: clamp(character.trust + (cost.trust ?? 0) * ratio),
    focus: clamp(character.focus + (cost.focus ?? 0) * ratio),
  };
}

function createDecisionAction(
  current: ActionNode,
  decision: DecisionResponse,
): ActionNode {
  const task = decision.queue_change.new_action.trim() || decision.final_task || current.task;

  return {
    ...current,
    room: decision.final_room || current.room,
    task,
    progress: current.progress,
    status: current.status === "completed" ? "completed" : "modified",
  };
}

const roomNames: Record<RoomId, string> = {
  computer: "电脑房",
  desk: "书桌",
  cafe: "咖啡馆",
  bedroom: "卧室",
  showroom: "展厅",
};

function makeLog(
  day: number,
  room: RoomId,
  task: string,
  completed: boolean,
  inspiration?: string,
): ActionLogEntry {
  let text = `[${roomNames[room]}] ${task} - ${completed ? "完成" : "进行中"}`;
  if (inspiration) {
    text += ` | 灵感：${inspiration}`;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    day,
    room,
    text,
  };
}
