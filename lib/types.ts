export type RoomId = "computer" | "desk" | "cafe" | "bedroom" | "showroom";

export type PersonalityType = "stubborn" | "obedient" | "anxious" | "confident";

export type ActionStatus =
  | "pending"
  | "running"
  | "paused"
  | "modified"
  | "completed"
  | "abandoned";

export type AiDecision =
  | "continue_current"
  | "modify_current"
  | "pause_and_reflect"
  | "switch_task"
  | "switch_room"
  | "resist_intervention"
  | "misinterpret";

export interface ProjectMetrics {
  feature: number;
  clarity: number;
  stability: number;
  presentation: number;
  creativity: number;
}

export interface CharacterState {
  pressure: number;
  selfhood: number;
  trust: number;
  focus: number;
  personalityType: PersonalityType;
}

export interface ActionNode {
  id: string;
  day: number;
  room: RoomId;
  task: string;
  duration: string;
  progress: number;
  risk: string;
  expectedGain: Partial<ProjectMetrics>;
  expectedCost: Partial<CharacterState>;
  status: ActionStatus;
  inspiration?: string;
}

export interface ActionLogEntry {
  id: string;
  day: number;
  text: string;
  room?: RoomId;
}

export interface ProjectConcept {
  name: string;
  pitch: string;
  coreLoop: string;
}

export interface GameState {
  day: number;
  currentActionIndex: number;
  actions: ActionNode[];
  project: ProjectConcept;
  metrics: ProjectMetrics;
  character: CharacterState;
  characterName: string;
  path: RoomId[];
  logs: ActionLogEntry[];
  completedOriginalActions: number;
  isEnded: boolean;
  inspirationSet: string[];
}

export interface DecisionResponse {
  decision: AiDecision;
  final_room: RoomId;
  final_task: string;
  queue_change: {
    type: DecisionQueueChangeType;
    new_action: string;
  };
  decision_reason: string;
  inner_monologue: string;
  player_influence: "low" | "medium" | "high";
  path_deviation: {
    changed: boolean;
    from: RoomId;
    to: RoomId;
  };
  log_text: string;
  reply: string;
  inspiration?: string;  // 灵感内容（玩家触发）
}

export type DecisionQueueChangeType =
  | "none"
  | "modify_current"
  | "insert_next"
  | "replace_next"
  | "clear_rest";
