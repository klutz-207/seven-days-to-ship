import type { GameState, ProjectMetrics, CharacterState, RoomId } from "./types";
import { inspirationPools } from "./rooms";

// ─── 灵感系统 ───

export { inspirationPools } from "./rooms";

/**
 * 根据房间随机获取一个灵感标签。
 * 使用 Fisher-Yates 思路从池中抽取，避免与已有灵感重复。
 */
export function pickInspiration(room: RoomId, existing: string[]): string | undefined {
  const pool = inspirationPools[room];
  if (!pool || pool.length === 0) return undefined;

  // 过滤已获得的灵感
  const available = pool.filter((item) => !existing.includes(item));
  if (available.length === 0) return undefined;

  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

// ─── 事件类型定义 ───

export interface RoomEvent {
  id: string;
  roomId: RoomId;
  /** 气泡文字，展示角色的内心独白 */
  bubble: string;
  /** 数值效果 */
  effect: {
    metrics?: Partial<ProjectMetrics>;
    character?: Partial<CharacterState>;
  };
  /** 可选的灵感标签 */
  inspiration?: string;
  /** 权重函数，返回该事件被抽中的相对概率 */
  weight: (state: GameState) => number;
}

// ─── 辅助：计算连续在某房间的次数 ───

function consecutiveRoomCount(path: RoomId[], roomId: RoomId): number {
  let count = 0;
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i] === roomId) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

// ─── 事件池定义 ───

const computerEvents: RoomEvent[] = [
  {
    id: "computer-bug-fix",
    roomId: "computer",
    bubble: "终于跑通了！",
    effect: {
      metrics: { feature: 8 },
      character: { pressure: -3 },
    },
    weight: () => 10,
  },
  {
    id: "computer-weird-bug",
    roomId: "computer",
    bubble: "为什么这个变量是 undefined...",
    effect: {
      metrics: { stability: -3 },
      character: { pressure: 5 },
    },
    weight: () => 10,
  },
  {
    id: "computer-better-solution",
    roomId: "computer",
    bubble: "等等，原来可以这样写",
    effect: {
      metrics: { creativity: 5, feature: 3 },
    },
    inspiration: "异步架构",
    weight: (state) => (state.metrics.creativity > 60 ? 8 : 4),
  },
  {
    id: "computer-spiral",
    roomId: "computer",
    bubble: "我刚才在做什么来着...",
    effect: {
      metrics: { clarity: -5 },
      character: { pressure: 4 },
    },
    weight: (state) => (state.character.pressure > 70 ? 12 : 5),
  },
  {
    id: "computer-api-connected",
    roomId: "computer",
    bubble: "！！！",
    effect: {
      metrics: { feature: 10 },
      character: { pressure: -5 },
    },
    inspiration: "缓存策略",
    weight: (state) => (consecutiveRoomCount(state.path, "computer") >= 2 ? 10 : 3),
  },
];

const deskEvents: RoomEvent[] = [
  {
    id: "desk-inspiration",
    roomId: "desk",
    bubble: "我想到一个好点子",
    effect: {
      metrics: { creativity: 10, clarity: 3 },
    },
    inspiration: "非线性叙事",
    weight: () => 10,
  },
  {
    id: "desk-rethink",
    roomId: "desk",
    bubble: "不对，这个方向不行",
    effect: {
      metrics: { creativity: 5, clarity: -8 },
      character: { pressure: 6 },
    },
    weight: () => 10,
  },
  {
    id: "desk-found-core",
    roomId: "desk",
    bubble: "这才是我要做的东西",
    effect: {
      metrics: { clarity: 12 },
      character: { selfhood: 5 },
    },
    inspiration: "极简交互",
    weight: (state) => (state.metrics.creativity > 65 ? 8 : 4),
  },
  {
    id: "desk-overthink",
    roomId: "desk",
    bubble: "我到底想做什么...",
    effect: {
      metrics: { clarity: -4 },
      character: { pressure: 5 },
    },
    weight: (state) => (state.character.pressure > 65 ? 12 : 5),
  },
];

const cafeEvents: RoomEvent[] = [
  {
    id: "cafe-friend-interest",
    roomId: "cafe",
    bubble: "他说这个想法很酷",
    effect: {
      metrics: { presentation: 5 },
      character: { selfhood: 3 },
    },
    weight: () => 10,
  },
  {
    id: "cafe-confused",
    roomId: "cafe",
    bubble: "他说他没听懂...",
    effect: {
      metrics: { clarity: -5 },
      character: { pressure: 6 },
    },
    weight: (state) => (state.metrics.clarity < 50 ? 10 : 4),
  },
  {
    id: "cafe-new-perspective",
    roomId: "cafe",
    bubble: "原来可以从这个角度看",
    effect: {
      metrics: { creativity: 6, clarity: 4 },
    },
    inspiration: "反馈循环",
    weight: () => 10,
  },
  {
    id: "cafe-social-fatigue",
    roomId: "cafe",
    bubble: "好累，不想说话了",
    effect: {
      character: { pressure: 4, focus: -5 },
    },
    weight: (state) => (state.character.pressure > 60 ? 10 : 5),
  },
];

const bedroomEvents: RoomEvent[] = [
  {
    id: "bedroom-good-sleep",
    roomId: "bedroom",
    bubble: "精神好多了",
    effect: {
      character: { pressure: -15, focus: 10 },
    },
    weight: (state) => (state.character.pressure > 50 ? 10 : 6),
  },
  {
    id: "bedroom-cant-sleep",
    roomId: "bedroom",
    bubble: "...还在想那个 Bug",
    effect: {
      character: { pressure: -3, focus: 2 },
    },
    weight: (state) => (state.character.pressure > 75 ? 12 : 3),
  },
  {
    id: "bedroom-epiphany",
    roomId: "bedroom",
    bubble: "我知道明天该做什么了",
    effect: {
      metrics: { clarity: 6 },
      character: { selfhood: 4 },
    },
    weight: (state) => (state.character.pressure < 50 ? 10 : 4),
  },
  {
    id: "bedroom-lazy",
    roomId: "bedroom",
    bubble: "再躺五分钟...",
    effect: {
      character: { pressure: -8 },
    },
    weight: (state) => (consecutiveRoomCount(state.path, "bedroom") >= 2 ? 12 : 5),
  },
];

const showroomEvents: RoomEvent[] = [
  {
    id: "showroom-smooth-rehearsal",
    roomId: "showroom",
    bubble: "时间刚好",
    effect: {
      metrics: { presentation: 8 },
      character: { pressure: -3 },
    },
    weight: () => 10,
  },
  {
    id: "showroom-found-flaw",
    roomId: "showroom",
    bubble: "完了，这个功能没做",
    effect: {
      metrics: { stability: -4 },
      character: { pressure: 7 },
    },
    weight: (state) => (state.metrics.stability < 50 ? 10 : 4),
  },
  {
    id: "showroom-good-packaging",
    roomId: "showroom",
    bubble: "这个截图好看",
    effect: {
      metrics: { presentation: 10, clarity: 3 },
    },
    inspiration: "视觉冲击",
    weight: () => 10,
  },
  {
    id: "showroom-overtime",
    roomId: "showroom",
    bubble: "还有五分钟？！",
    effect: {
      metrics: { presentation: -3 },
      character: { pressure: 8 },
    },
    weight: (state) => (state.metrics.presentation < 40 ? 10 : 4),
  },
];

// ─── 导出事件池 ───

export const roomEvents: Record<RoomId, RoomEvent[]> = {
  computer: computerEvents,
  desk: deskEvents,
  cafe: cafeEvents,
  bedroom: bedroomEvents,
  showroom: showroomEvents,
};

// ─── 权重随机抽取 ───

export function pickEvent(roomId: RoomId, state: GameState): RoomEvent {
  const events = roomEvents[roomId];
  if (!events || events.length === 0) {
    throw new Error(`No events defined for room: ${roomId}`);
  }

  // 计算每个事件的权重
  const weights = events.map((event) => event.weight(state));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // 加权随机抽取
  let random = Math.random() * totalWeight;
  for (let i = 0; i < events.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return events[i];
    }
  }

  // 兜底返回最后一个
  return events[events.length - 1];
}

// ─── 应用事件效果 ───

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function applyEventEffects(state: GameState, event: RoomEvent): GameState {
  const newMetrics: ProjectMetrics = { ...state.metrics };
  const newCharacter: CharacterState = { ...state.character };

  // 应用项目指标变化
  if (event.effect.metrics) {
    const m = event.effect.metrics;
    if (m.feature !== undefined) newMetrics.feature = clamp(newMetrics.feature + m.feature);
    if (m.clarity !== undefined) newMetrics.clarity = clamp(newMetrics.clarity + m.clarity);
    if (m.stability !== undefined) newMetrics.stability = clamp(newMetrics.stability + m.stability);
    if (m.presentation !== undefined) newMetrics.presentation = clamp(newMetrics.presentation + m.presentation);
    if (m.creativity !== undefined) newMetrics.creativity = clamp(newMetrics.creativity + m.creativity);
  }

  // 应用角色状态变化
  if (event.effect.character) {
    const c = event.effect.character;
    if (c.pressure !== undefined) newCharacter.pressure = clamp(newCharacter.pressure + c.pressure);
    if (c.selfhood !== undefined) newCharacter.selfhood = clamp(newCharacter.selfhood + c.selfhood);
    if (c.trust !== undefined) newCharacter.trust = clamp(newCharacter.trust + c.trust);
    if (c.focus !== undefined) newCharacter.focus = clamp(newCharacter.focus + c.focus);
  }

  // 处理灵感
  const newInspirationSet = [...state.inspirationSet];
  if (event.inspiration && !newInspirationSet.includes(event.inspiration)) {
    newInspirationSet.push(event.inspiration);
  }

  return {
    ...state,
    metrics: newMetrics,
    character: newCharacter,
    inspirationSet: newInspirationSet,
  };
}
