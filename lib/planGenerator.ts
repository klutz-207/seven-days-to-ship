import type { ActionNode } from "./types";

export function generateDayPlan(day: number): ActionNode[] {
  const baseId = `day-${day}`;

  return [
    {
      id: `${baseId}-build`,
      day,
      room: "computer",
      task: "实现今天最小可演示功能",
      duration: "90 分钟",
      progress: 0,
      risk: "如果目标过大，功能会挤压清晰度。",
      expectedGain: { feature: 12, stability: 3 },
      expectedCost: { pressure: 6, selfhood: -1, focus: -5 },
      status: "pending",
    },
    {
      id: `${baseId}-reflect`,
      day,
      room: "desk",
      task: "复盘路径偏移和下一步优先级",
      duration: "45 分钟",
      progress: 0,
      risk: "反思过久会拖慢提交节奏。",
      expectedGain: { clarity: 10, creativity: 6 },
      expectedCost: { focus: -2 },
      status: "pending",
    },
    {
      id: `${baseId}-demo`,
      day,
      room: "showroom",
      task: "整理一个可讲清楚的演示切片",
      duration: "60 分钟",
      progress: 0,
      risk: "包装过早会掩盖稳定性问题。",
      expectedGain: { presentation: 12, clarity: 4, stability: -1 },
      expectedCost: { pressure: 6, focus: -4 },
      status: "pending",
    },
  ];
}
