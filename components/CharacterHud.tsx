import { calculateMainProgress } from "@/lib/stateUpdater";
import type { CharacterState, ProjectMetrics } from "@/lib/types";

interface CharacterHudProps {
  day: number;
  character: CharacterState;
  metrics: ProjectMetrics;
  warnings: string[];
}

export function CharacterHud({ day, character, metrics, warnings }: CharacterHudProps) {
  return (
    <aside className="scene-hud">
      <div className="scene-avatar relative h-24 w-24 overflow-hidden border-2 border-[var(--line)]" aria-label="数字人形象">
        <img
          src="/characters/programmer/idle-down-01.png"
          alt="数字人"
          className="h-full w-full object-cover pixelated"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <div className="min-w-0">
        <div className="ui-font flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <span>Day {day} / 7</span>
          <span>{calculateMainProgress(metrics)}%</span>
        </div>
        <h2 className="mt-1 truncate text-2xl font-black">数字人</h2>
        <div className="ui-font mt-3 grid grid-cols-2 gap-2 text-xs">
          <HudMetric label="压力" value={character.pressure} />
          <HudMetric label="自我感" value={character.selfhood} />
          <HudMetric label="信任" value={character.trust} />
          <HudMetric label="注意力" value={character.focus} />
        </div>
        <p className="ui-font mt-3 truncate text-xs text-[var(--muted)]">
          {warnings.length > 0 ? warnings.join(" / ") : "状态稳定，仍在行动。"}
        </p>
      </div>
    </aside>
  );
}

function HudMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between gap-2">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-1.5 bg-black/10">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
