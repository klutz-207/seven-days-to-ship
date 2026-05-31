export type RoomId = "computer" | "desk" | "cafe" | "bedroom" | "showroom";

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
  | "switch_room";

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
}

export interface ActionLogEntry {
  id: string;
  day: number;
  text: string;
  room?: RoomId;
}

export interface GameState {
  day: number;
  currentActionIndex: number;
  actions: ActionNode[];
  metrics: ProjectMetrics;
  character: CharacterState;
  path: RoomId[];
  logs: ActionLogEntry[];
  completedOriginalActions: number;
  isEnded: boolean;
}

export interface DecisionResponse {
  decision: AiDecision;
  final_room: RoomId;
  final_task: string;
  queue_change: {
    type: "none" | "modify_current" | "insert_next" | "replace_next" | "clear_rest";
    new_action: string;
  };
  decision_reason: string;
  inner_monologue: string;
  path_deviation: {
    changed: boolean;
    from: RoomId;
    to: RoomId;
  };
  log_text: string;
  reply: string;
}
