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
