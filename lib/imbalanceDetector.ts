import type { GameState } from "./types";

export function detectImbalances(state: GameState): string[] {
  const { metrics, character } = state;
  const warnings: string[] = [];

  if (metrics.feature >= 75 && metrics.clarity <= 40) warnings.push("功能膨胀");
  if (metrics.creativity >= 75 && metrics.feature <= 35) warnings.push("概念空转");
  if (metrics.presentation >= 70 && metrics.stability <= 40) warnings.push("展示泡沫");
  if (metrics.stability >= 75 && metrics.creativity <= 35) warnings.push("稳定但无聊");
  if (character.pressure >= 80) warnings.push("高压冲刺");

  return warnings;
}
