import { calculateMainProgress } from "./stateUpdater";
import type { GameState } from "./types";

export function judgeEnding(state: GameState) {
  const progress = calculateMainProgress(state.metrics);
  const { metrics, character } = state;

  if (metrics.presentation >= 70 && metrics.stability <= 40) {
    return "演示前一秒崩掉的梦";
  }
  if (metrics.creativity >= 75 && metrics.feature <= 35) {
    return "写在文档里的游戏";
  }
  if (metrics.feature >= 75 && metrics.clarity <= 40) {
    return "能运行的空房间";
  }
  if (progress >= 75 && character.pressure >= 80) {
    return "做完了，但他没有庆祝";
  }
  if (progress >= 70 && metrics.clarity >= 55 && metrics.stability >= 55) {
    return "能被讲清楚，也能跑起来";
  }
  return "没有提交，但他知道要做什么了";
}
