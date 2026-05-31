import type { ActionNode, RoomId } from "./types";

interface DayPlan {
  actions: Array<{
    room: RoomId;
    task: string;
    duration: string;
    risk: string;
    expectedGain: ActionNode["expectedGain"];
    expectedCost: ActionNode["expectedCost"];
  }>;
}

/** 第一阶段：Day 1-3 基础开发 */
const phase1Plans: Record<number, DayPlan> = {
  1: {
    actions: [
      {
        room: "desk",
        task: "确定项目核心玩法和目标",
        duration: "60 分钟",
        risk: "目标太大会导致后续无法完成。",
        expectedGain: { clarity: 15, creativity: 10 },
        expectedCost: { focus: -3 },
      },
      {
        room: "computer",
        task: "搭建项目基础框架",
        duration: "120 分钟",
        risk: "技术选型不当会影响后续开发。",
        expectedGain: { feature: 15, stability: 5 },
        expectedCost: { pressure: 8, focus: -6 },
      },
      {
        room: "cafe",
        task: "和队友讨论技术方案",
        duration: "45 分钟",
        risk: "讨论太久会耽误开发时间。",
        expectedGain: { clarity: 8, creativity: 5 },
        expectedCost: { pressure: 3, focus: -2 },
      },
    ],
  },
  2: {
    actions: [
      {
        room: "computer",
        task: "实现核心功能模块",
        duration: "150 分钟",
        risk: "功能过于复杂会导致 bug 增多。",
        expectedGain: { feature: 20, stability: -3 },
        expectedCost: { pressure: 10, selfhood: -2, focus: -8 },
      },
      {
        room: "desk",
        task: "重构代码，优化架构",
        duration: "90 分钟",
        risk: "重构过度会拖慢进度。",
        expectedGain: { stability: 12, clarity: 6 },
        expectedCost: { pressure: 5, focus: -4 },
      },
      {
        room: "bedroom",
        task: "休息一下，恢复精力",
        duration: "30 分钟",
        risk: "休息太久会耽误进度。",
        expectedGain: { clarity: 10 },
        expectedCost: { pressure: -15, focus: 15 },
      },
    ],
  },
  3: {
    actions: [
      {
        room: "computer",
        task: "完成第一个可运行版本",
        duration: "180 分钟",
        risk: "赶工会导致代码质量下降。",
        expectedGain: { feature: 25, stability: -5 },
        expectedCost: { pressure: 15, selfhood: -3, focus: -10 },
      },
      {
        room: "showroom",
        task: "准备中期演示",
        duration: "60 分钟",
        risk: "演示准备不足会影响评分。",
        expectedGain: { presentation: 15, clarity: 5 },
        expectedCost: { pressure: 8, focus: -5 },
      },
      {
        room: "cafe",
        task: "收集第一轮反馈",
        duration: "45 分钟",
        risk: "负面反馈可能打击信心。",
        expectedGain: { clarity: 10, creativity: 8 },
        expectedCost: { pressure: 5, selfhood: -2 },
      },
    ],
  },
};

/** 第二阶段：Day 4-6 完善和测试 */
const phase2Plans: Record<number, DayPlan> = {
  4: {
    actions: [
      {
        room: "computer",
        task: "修复第一轮反馈的问题",
        duration: "120 分钟",
        risk: "修 bug 可能引入新问题。",
        expectedGain: { stability: 15, feature: 5 },
        expectedCost: { pressure: 10, focus: -6 },
      },
      {
        room: "desk",
        task: "优化用户体验流程",
        duration: "90 分钟",
        risk: "过度优化会偏离核心功能。",
        expectedGain: { clarity: 12, presentation: 5 },
        expectedCost: { focus: -4 },
      },
      {
        room: "computer",
        task: "添加新功能特性",
        duration: "100 分钟",
        risk: "功能膨胀会导致系统不稳定。",
        expectedGain: { feature: 15, creativity: 5, stability: -3 },
        expectedCost: { pressure: 8, focus: -5 },
      },
    ],
  },
  5: {
    actions: [
      {
        room: "computer",
        task: "全面测试和修复",
        duration: "150 分钟",
        risk: "测试发现的问题可能很难修复。",
        expectedGain: { stability: 20, feature: 3 },
        expectedCost: { pressure: 12, focus: -8 },
      },
      {
        room: "cafe",
        task: "邀请外部测试",
        duration: "60 分钟",
        risk: "外部测试可能暴露严重问题。",
        expectedGain: { clarity: 10, presentation: 10 },
        expectedCost: { pressure: 8, selfhood: -3 },
      },
      {
        room: "bedroom",
        task: "调整心态，准备冲刺",
        duration: "30 分钟",
        risk: "过度放松会失去紧迫感。",
        expectedGain: { clarity: 5 },
        expectedCost: { pressure: -15, focus: 12 },
      },
    ],
  },
  6: {
    actions: [
      {
        room: "computer",
        task: "最终功能完善",
        duration: "180 分钟",
        risk: "最后时刻改动可能破坏稳定性。",
        expectedGain: { feature: 18, stability: -5 },
        expectedCost: { pressure: 15, selfhood: -5, focus: -10 },
      },
      {
        room: "showroom",
        task: "准备最终演示",
        duration: "120 分钟",
        risk: "演示准备会占用开发时间。",
        expectedGain: { presentation: 20, clarity: 8 },
        expectedCost: { pressure: 10, focus: -8 },
      },
      {
        room: "desk",
        task: "整理项目文档",
        duration: "60 分钟",
        risk: "文档整理可能暴露遗漏。",
        expectedGain: { clarity: 10, presentation: 5 },
        expectedCost: { focus: -3 },
      },
    ],
  },
};

/** 第三阶段：Day 7 最终展示 */
const phase3Plan: DayPlan = {
  actions: [
    {
      room: "computer",
      task: "最后检查和修复",
      duration: "60 分钟",
      risk: "最后时刻的修复可能引入新问题。",
      expectedGain: { stability: 10, feature: 3 },
      expectedCost: { pressure: 12, focus: -5 },
    },
    {
      room: "showroom",
      task: "最终演示和答辩",
      duration: "90 分钟",
      risk: "演示失败会影响最终评分。",
      expectedGain: { presentation: 25, clarity: 10 },
      expectedCost: { pressure: 20, focus: -10, selfhood: -5 },
    },
    {
      room: "cafe",
      task: "庆祝和复盘",
      duration: "45 分钟",
      risk: "过度庆祝会忽略反思。",
      expectedGain: { creativity: 15, clarity: 5 },
      expectedCost: { pressure: -20 },
    },
  ],
};

export function generateDayPlan(day: number): ActionNode[] {
  const baseId = `day-${day}`;
  let plan: DayPlan;

  if (day <= 3) {
    plan = phase1Plans[day];
  } else if (day <= 6) {
    plan = phase2Plans[day];
  } else {
    plan = phase3Plan;
  }

  return plan.actions.map((action, index) => ({
    id: `${baseId}-${index}`,
    day,
    room: action.room,
    task: action.task,
    duration: action.duration,
    progress: 0,
    risk: action.risk,
    expectedGain: action.expectedGain,
    expectedCost: action.expectedCost,
    status: "pending" as const,
  }));
}

/** 获取当前阶段名称 */
export function getPhaseName(day: number): string {
  if (day === 1) return "第一天：起步";
  if (day === 2) return "第二天：深入";
  return "第三天：冲刺";
}

/** 获取当前阶段描述 */
export function getPhaseDescription(day: number): string {
  if (day === 1) return "确定方向，搭建框架";
  if (day === 2) return "核心开发，完善功能";
  return "最终打磨，准备展示";
}

/** 获取当天行动的任务描述摘要 */
export function getDayPlanSummary(day: number): string[] {
  return generateDayPlan(day).map((action) => action.task);
}
