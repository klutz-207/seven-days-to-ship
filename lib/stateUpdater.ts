import { generateDayPlan } from "./planGenerator";
import type {
  ActionNode,
  ActionLogEntry,
  CharacterState,
  GameState,
  ProjectMetrics,
  RoomId,
} from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

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
  };
}

export function advanceState(
  state: GameState,
): GameState {
  const current = state.actions[state.currentActionIndex];
  if (!current || state.isEnded) {
    return state;
  }

  const nextProgress = clamp(current.progress + 30);
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

  const isLastAction = state.currentActionIndex >= actions.length - 1;
  const nextIndex = completed && !isLastAction ? state.currentActionIndex + 1 : state.currentActionIndex;
  const shouldAdvanceDay = completed && isLastAction;
  const nextDay = shouldAdvanceDay ? state.day + 1 : state.day;
  const shouldEnd = nextDay > 7;
  const nextActions = shouldAdvanceDay && !shouldEnd ? generateDayPlan(nextDay) : actions;

  return {
    ...state,
    day: shouldEnd ? 7 : nextDay,
    currentActionIndex: shouldAdvanceDay ? 0 : nextIndex,
    actions: nextActions,
    metrics,
    character,
    path: [...state.path, current.room],
    logs: [
      makeLog(state.day, current.room, current.task, completed),
      ...state.logs,
    ].slice(0, 24),
    completedOriginalActions: state.completedOriginalActions + (completed ? 1 : 0),
    isEnded: shouldEnd,
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
): ActionLogEntry {
  const text = `[${roomNames[room]}] ${task} - ${completed ? "完成" : "进行中"}`;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    day,
    room,
    text,
  };
}
