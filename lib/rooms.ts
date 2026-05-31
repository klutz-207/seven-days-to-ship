import type { RoomId } from "./types";

export const rooms: Record<
  RoomId,
  {
    name: string;
    shortName: string;
    description: string;
  }
> = {
  computer: {
    name: "电脑房",
    shortName: "码",
    description: "开发、调试、接 API",
  },
  desk: {
    name: "书桌",
    shortName: "策",
    description: "策划、复盘、重构",
  },
  cafe: {
    name: "咖啡馆",
    shortName: "测",
    description: "试玩、反馈、交流",
  },
  bedroom: {
    name: "卧室",
    shortName: "息",
    description: "休息、恢复",
  },
  showroom: {
    name: "展示厅",
    shortName: "演",
    description: "路演、包装",
  },
};

/** 每个房间对应的灵感池 */
export const inspirationPools: Record<RoomId, string[]> = {
  computer: ["异步架构", "缓存策略", "状态机", "事件驱动", "性能优化", "模块化设计"],
  desk: ["非线性叙事", "极简交互", "留白美学", "隐喻系统", "节奏设计", "涌现玩法"],
  cafe: ["多人协作", "反馈循环", "社交裂变", "用户旅程", "共情设计", "社区运营"],
  bedroom: ["心流状态", "减法思维", "第二曲线", "逆向设计"],
  showroom: ["一页演示", "视觉冲击", "故事包装", "数据叙事", "钩子设计", "情感共鸣"],
};
