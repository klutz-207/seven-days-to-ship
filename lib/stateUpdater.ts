import { generateDayPlan } from "./planGenerator";
import type {
  ActionNode,
  ActionLogEntry,
  CharacterState,
  GameState,
  InterventionType,
  ProjectMetrics,
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
    interventionCount: 0,
    completedOriginalActions: 0,
    isEnded: false,
  };
}

export function advanceState(
  state: GameState,
  intervention: InterventionType,
  note: string,
): GameState {
  const current = state.actions[state.currentActionIndex];
  if (!current || state.isEnded) {
    return state;
  }

  const nextProgress = clamp(current.progress + 30);
  const completed = nextProgress >= 100;
  const interventionEffect = getInterventionEffect(intervention);
  const nextAction: ActionNode = {
    ...current,
    progress: completed ? 100 : nextProgress,
    status: completed ? "completed" : ("running" as const),
  };

  const metrics = mergeMetrics(state.metrics, current.expectedGain, completed ? 1 : 0.35);
  const character = mergeCharacter(
    state.character,
    current.expectedCost,
    interventionEffect,
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
      makeLog(state.day, current.room, intervention, note, completed),
      ...state.logs,
    ].slice(0, 24),
    interventionCount: state.interventionCount + (intervention === "none" ? 0 : 1),
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
  interventionEffect: Partial<CharacterState>,
  ratio: number,
): CharacterState {
  return {
    pressure: clamp(character.pressure + (cost.pressure ?? 0) * ratio + (interventionEffect.pressure ?? 0)),
    selfhood: clamp(character.selfhood + (cost.selfhood ?? 0) * ratio + (interventionEffect.selfhood ?? 0)),
    trust: clamp(character.trust + (cost.trust ?? 0) * ratio + (interventionEffect.trust ?? 0)),
    focus: clamp(character.focus + (cost.focus ?? 0) * ratio + (interventionEffect.focus ?? 0)),
  };
}

function getInterventionEffect(intervention: InterventionType): Partial<CharacterState> {
  if (intervention === "interrupt") {
    return { pressure: 5, trust: -3, focus: -6, selfhood: 2 };
  }
  if (intervention === "remind") {
    return { trust: 4, focus: -1 };
  }
  if (intervention === "approve") {
    return { trust: 5, pressure: -2, focus: 2 };
  }
  return { focus: 2 };
}

function makeLog(
  day: number,
  room: ActionLogEntry["room"],
  intervention: InterventionType,
  note: string,
  completed: boolean,
): ActionLogEntry {
  const suffix = completed ? "行动完成，路径格子被点亮。" : "行动推进了 30%，仍在运行。";
  const interventionText =
    intervention === "none" ? "你选择继续观察。" : `你选择${interventionLabel(intervention)}：${note || "没有补充说明"}`;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    day,
    room,
    text: `${interventionText} ${suffix}`,
  };
}

function interventionLabel(intervention: InterventionType) {
  const labels: Record<InterventionType, string> = {
    none: "继续运行",
    interrupt: "打断",
    remind: "提醒",
    approve: "放行",
  };
  return labels[intervention];
}
