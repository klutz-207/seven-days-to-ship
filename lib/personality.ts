import type { PersonalityType } from "./types";

export interface PersonalityConfig {
  name: string;
  description: string;
  /** 压力变化倍率 */
  pressureMultiplier: number;
  /** 自我感变化倍率 */
  selfhoodMultiplier: number;
  /** 信任变化倍率 */
  trustMultiplier: number;
  /** 接受玩家干预的基础概率 */
  acceptInterventionChance: number;
  /** 灵感触发概率修正 */
  inspirationModifier: number;
  /** 思考风格关键词 */
  thinkingStyle: string[];
  /** 拒绝干预时的典型回复 */
  rejectPhrases: string[];
  /** 接受干预时的典型回复 */
  acceptPhrases: string[];
}

export const PERSONALITY_CONFIGS: Record<PersonalityType, PersonalityConfig> = {
  stubborn: {
    name: "固执型",
    description: "坚持己见，难以被打动",
    pressureMultiplier: 0.8,
    selfhoodMultiplier: 1.3,
    trustMultiplier: 0.6,
    acceptInterventionChance: 0.2,
    inspirationModifier: -0.3,
    thinkingStyle: ["我知道该怎么做", "不需要别人教我", "我的判断是对的"],
    rejectPhrases: [
      "我知道自己在做什么。",
      "让我自己来。",
      "这个方向没问题。",
      "我有我的节奏。",
    ],
    acceptPhrases: [
      "嗯……你说的有点道理。",
      "好吧，我再想想。",
    ],
  },
  obedient: {
    name: "顺从型",
    description: "善于倾听，容易受启发",
    pressureMultiplier: 1.0,
    selfhoodMultiplier: 0.7,
    trustMultiplier: 1.4,
    acceptInterventionChance: 0.6,
    inspirationModifier: 0.3,
    thinkingStyle: ["也许别人说的对", "我需要更多反馈", "不确定自己想的对不对"],
    rejectPhrases: [
      "这个……我再想想吧。",
      "可能你是对的，但我还是想试试。",
    ],
    acceptPhrases: [
      "好的，我试试看！",
      "你说得对，我调整一下。",
      "谢谢提醒！",
      "我也是这么想的。",
    ],
  },
  anxious: {
    name: "焦虑型",
    description: "容易紧张，压力来得快",
    pressureMultiplier: 1.5,
    selfhoodMultiplier: 0.9,
    trustMultiplier: 1.0,
    acceptInterventionChance: 0.4,
    inspirationModifier: 0.0,
    thinkingStyle: ["时间不多了", "这样做对吗", "总觉得哪里不对"],
    rejectPhrases: [
      "我……我再想想。",
      "现在改方向来不及了吧。",
      "我有点慌，但还是继续吧。",
    ],
    acceptPhrases: [
      "好，我试试！",
      "我确实需要调整一下。",
      "谢谢，我正需要建议。",
    ],
  },
  confident: {
    name: "自信型",
    description: "心态稳定，按自己节奏走",
    pressureMultiplier: 0.5,
    selfhoodMultiplier: 1.2,
    trustMultiplier: 0.9,
    acceptInterventionChance: 0.35,
    inspirationModifier: 0.1,
    thinkingStyle: ["我知道要做什么", "时间够用", "按计划来"],
    rejectPhrases: [
      "我有我的节奏。",
      "放心，我知道该怎么做。",
      "这个方向没问题。",
    ],
    acceptPhrases: [
      "嗯，有道理。",
      "可以试试。",
      "好建议。",
    ],
  },
};

/** 根据性格描述推断人格类型 */
export function inferPersonalityType(personality: string, trait: string): PersonalityType {
  const text = (personality + " " + trait).toLowerCase();

  if (text.includes("固执") || text.includes("坚持") || text.includes("倔") || text.includes("不听")) {
    return "stubborn";
  }
  if (text.includes("顺从") || text.includes("善听") || text.includes("容易") || text.includes("随和")) {
    return "obedient";
  }
  if (text.includes("焦虑") || text.includes("紧张") || text.includes("担心") || text.includes("急躁")) {
    return "anxious";
  }
  if (text.includes("自信") || text.includes("稳重") || text.includes("淡定") || text.includes("从容")) {
    return "confident";
  }

  // 默认随机
  const types: PersonalityType[] = ["stubborn", "obedient", "anxious", "confident"];
  return types[Math.floor(Math.random() * types.length)];
}

/** 获取随机拒绝回复 */
export function getRejectPhrase(type: PersonalityType): string {
  const config = PERSONALITY_CONFIGS[type];
  return config.rejectPhrases[Math.floor(Math.random() * config.rejectPhrases.length)];
}

/** 获取随机接受回复 */
export function getAcceptPhrase(type: PersonalityType): string {
  const config = PERSONALITY_CONFIGS[type];
  return config.acceptPhrases[Math.floor(Math.random() * config.acceptPhrases.length)];
}
