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

const characterLabels: Record<keyof CharacterState, string> = {
  pressure: "压力",
  selfhood: "自我感",
  trust: "信任",
  focus: "注意力",
};

export function StatusPanel({ metrics, character, warnings }: StatusPanelProps) {
  return (
    <section className="border-2 border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="ui-font text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Project Pulse</p>
          <h2 className="text-4xl font-bold">{calculateMainProgress(metrics)}%</h2>
        </div>
        <div className="ui-font flex flex-wrap gap-2 text-xs">
          {warnings.length === 0 ? (
            <span className="border border-[var(--line)] bg-white px-2 py-1">暂无失衡</span>
          ) : (
            warnings.map((warning) => (
              <span key={warning} className="border border-[var(--line)] bg-[var(--accent)] px-2 py-1 text-white">
                {warning}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <MetricGroup
          title="项目指标"
          items={(Object.keys(metricLabels) as Array<keyof ProjectMetrics>).map((key) => ({
            key,
            label: metricLabels[key],
            value: metrics[key],
          }))}
        />
        <MetricGroup
          title="角色状态"
          items={(Object.keys(characterLabels) as Array<keyof CharacterState>).map((key) => ({
            key,
            label: characterLabels[key],
            value: character[key],
          }))}
        />
      </div>
    </section>
  );
}

function MetricGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; value: number }>;
}) {
  return (
    <div>
      <h3 className="ui-font mb-3 text-sm font-bold">{title}</h3>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.key} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-2">
            <span className="ui-font text-sm text-[var(--muted)]">{item.label}</span>
            <span className="h-3 border border-[var(--line)] bg-white">
              <span
                className="block h-full bg-[var(--accent-2)]"
                style={{ width: `${item.value}%` }}
              />
            </span>
            <span className="ui-font text-right text-sm">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
