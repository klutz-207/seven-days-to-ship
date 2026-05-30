import { calculateMainProgress } from "@/lib/stateUpdater";
import type { CharacterState, ProjectMetrics } from "@/lib/types";

interface StatusPanelProps {
  metrics: ProjectMetrics;
  character: CharacterState;
  warnings: string[];
}

const metricLabels: Record<keyof ProjectMetrics, string> = {
  feature: "功能",
  clarity: "清晰",
  stability: "稳定",
  presentation: "展示",
  creativity: "创意",
};

const characterLabels: Record<keyof CharacterState, { label: string; icon: string }> = {
  pressure: { label: "压力", icon: "/ui/pressure.png" },
  selfhood: { label: "自我感", icon: "/ui/selfhood.png" },
  trust: { label: "信任", icon: "/ui/trust.png" },
  focus: { label: "注意力", icon: "/ui/focus.png" },
};

export function StatusPanel({ metrics, character, warnings }: StatusPanelProps) {
  return (
    <section className="status-panel">
      {/* 项目进度 */}
      <div className="flex items-center justify-between mb-3">
        <span className="ui-font text-xs uppercase tracking-widest text-[var(--muted)]">Project Pulse</span>
        <span className="text-2xl font-black">{calculateMainProgress(metrics)}%</span>
      </div>

      {/* 失衡警告 */}
      {warnings.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {warnings.map((warning) => (
            <span key={warning} className="tag tag--warning">{warning}</span>
          ))}
        </div>
      )}

      {/* 项目指标 */}
      <div className="mb-3">
        <h3 className="ui-font mb-2 text-xs font-bold text-[var(--muted)]">项目指标</h3>
        <div className="grid gap-1.5">
          {(Object.keys(metricLabels) as Array<keyof ProjectMetrics>).map((key) => (
            <div key={key} className="grid grid-cols-[3.5rem_1fr_2rem] items-center gap-2">
              <span className="ui-font text-xs text-[var(--muted)]">{metricLabels[key]}</span>
              <div className="progress-bar">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${metrics[key]}%` }}
                />
              </div>
              <span className="ui-font text-right text-xs font-bold">{metrics[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 角色状态 */}
      <div>
        <h3 className="ui-font mb-2 text-xs font-bold text-[var(--muted)]">角色状态</h3>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(characterLabels) as Array<keyof CharacterState>).map((key) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <img
                src={characterLabels[key].icon}
                alt={characterLabels[key].label}
                className="h-6 w-6"
                style={{ imageRendering: "pixelated" }}
              />
              <span className="ui-font text-[10px] text-[var(--muted)]">{characterLabels[key].label}</span>
              <span className="ui-font text-xs font-bold">{character[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
