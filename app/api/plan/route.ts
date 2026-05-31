import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import type { RoomId } from "@/lib/types";

interface PlanRequest {
  day: number;
  characterName: string;
  personality: string;
  trait: string;
}

interface PlanResponse {
  rooms: RoomId[];
  tasks: string[];
}

const ROOM_NAMES: Record<RoomId, string> = {
  computer: "电脑桌",
  desk: "书桌",
  cafe: "咖啡厅",
  bedroom: "卧室",
  showroom: "展台",
};

const VALID_ROOMS: RoomId[] = ["computer", "desk", "cafe", "bedroom", "showroom"];

function createMockPlan(day: number): PlanResponse {
  const mockPlans: Record<number, PlanResponse> = {
    1: {
      rooms: ["desk", "computer", "cafe"],
      tasks: ["确定项目核心玩法和目标", "搭建项目基础框架", "和队友讨论技术方案"],
    },
    2: {
      rooms: ["computer", "desk", "bedroom"],
      tasks: ["实现核心功能模块", "重构代码，优化架构", "休息一下，恢复精力"],
    },
    3: {
      rooms: ["computer", "showroom", "cafe"],
      tasks: ["完成第一个可运行版本", "准备中期演示", "收集第一轮反馈"],
    },
    4: {
      rooms: ["computer", "desk", "computer"],
      tasks: ["修复第一轮反馈的问题", "优化用户体验流程", "添加新功能特性"],
    },
    5: {
      rooms: ["computer", "cafe", "bedroom"],
      tasks: ["全面测试和修复", "邀请外部测试", "调整心态，准备冲刺"],
    },
    6: {
      rooms: ["computer", "showroom", "desk"],
      tasks: ["最终功能完善", "准备最终演示", "整理项目文档"],
    },
    7: {
      rooms: ["computer", "showroom", "cafe"],
      tasks: ["最后检查和修复", "最终演示和答辩", "庆祝和复盘"],
    },
  };

  return mockPlans[day] ?? mockPlans[1];
}

function validatePlan(plan: unknown): PlanResponse {
  if (!plan || typeof plan !== "object") {
    throw new Error("Invalid plan format");
  }

  const { rooms, tasks } = plan as Record<string, unknown>;

  if (!Array.isArray(rooms) || !Array.isArray(tasks)) {
    throw new Error("Plan must have rooms and tasks arrays");
  }

  const validRooms = (rooms as string[])
    .filter((r): r is RoomId => VALID_ROOMS.includes(r as RoomId))
    .slice(0, 3);

  const validTasks = (tasks as string[])
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .slice(0, 3);

  // Pad with defaults if needed
  while (validRooms.length < 3) {
    validRooms.push(["desk", "computer", "cafe"][validRooms.length] as RoomId);
  }
  while (validTasks.length < 3) {
    validTasks.push(["确定项目方向", "推进核心开发", "收集反馈和讨论"][validTasks.length]);
  }

  return { rooms: validRooms, tasks: validTasks };
}

export async function POST(request: Request) {
  const body = (await request.json()) as PlanRequest;
  const { day, characterName, personality, trait } = body;

  if (!day || !characterName) {
    return NextResponse.json(
      { error: "day and characterName are required" },
      { status: 400 },
    );
  }

  const roomList = Object.entries(ROOM_NAMES)
    .map(([id, name]) => `- ${name}（${id}）`)
    .join("\n");

  const systemPrompt = `你是参加 Hackathon 的数字人「${characterName}」。
性格：${personality}
特质：${trait}

现在是第 ${day} 天（共 7 天），请决定你今天要去哪 3 个房间，以及每个房间要做什么。

可用的房间：
${roomList}

请严格返回 JSON 格式，不要包含其他文字：
{
  "rooms": ["roomId1", "roomId2", "roomId3"],
  "tasks": ["任务1", "任务2", "任务3"]
}

规则：
- rooms 中必须是 roomId（computer/desk/cafe/bedroom/showroom），不是中文名
- 每天最多 3 个房间，任务要具体可执行
- 根据当前天数调整策略：前几天偏探索和搭建，中期偏开发和测试，后期偏演示和收尾
- 根据性格选择房间：工程型偏 computer，创作型偏 desk，展示型偏 showroom，焦虑型可能需要 bedroom 休息`;

  // 没有 API Key 时使用 mock
  if (!process.env.LLM_API_KEY) {
    return NextResponse.json(createMockPlan(day));
  }

  try {
    const response = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `今天是第 ${day} 天，请决定今天的计划。` },
      ],
      false,
      { temperature: 0.8, maxTokens: 300, responseFormat: { type: "json_object" } },
    );

    const parsed = JSON.parse(response);
    const plan = validatePlan(parsed);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("Plan API failed, using mock:", error);
    return NextResponse.json(createMockPlan(day));
  }
}
