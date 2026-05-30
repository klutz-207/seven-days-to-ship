import { judgeEnding } from "@/lib/endingJudge";
import { calculateMainProgress } from "@/lib/stateUpdater";
import type { GameState } from "@/lib/types";

interface EndingReportProps {
  state: GameState;
  onRestart: () => void;
}

export function EndingReport({ state, onRestart }: EndingReportProps) {
  return (
    <section className="border-2 border-[var(--line)] bg-[var(--panel)] p-6 shadow-[8px_8px_0_var(--line)]">
      <p className="ui-font text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Day 7 Report</p>
      <h2 className="mt-3 text-4xl font-bold">《{judgeEnding(state)}》</h2>
      <p className="ui-font mt-4 leading-relaxed text-[var(--muted)]">
        项目完成度停在 {calculateMainProgress(state.metrics)}%。这份报告现在由控制层判定标题，
        后续可以接入 `/api/ending` 生成更完整的项目结局、人格结局和路径复盘。
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="ui-font mt-6 border-2 border-[var(--line)] bg-[var(--accent)] px-4 py-2 font-bold text-white"
      >
        重新开始
      </button>
    </section>
  );
}
