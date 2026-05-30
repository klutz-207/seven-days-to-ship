import { rooms } from "@/lib/rooms";
import type { ActionNode } from "@/lib/types";

interface CurrentTaskCardProps {
  action?: ActionNode;
}

export function CurrentTaskCard({ action }: CurrentTaskCardProps) {
  if (!action) {
    return (
      <section className="border-2 border-[var(--line)] bg-[var(--panel)] p-5 shadow-[6px_6px_0_var(--line)]">
        <p className="ui-font text-sm text-[var(--muted)]">今日行动队列已完成。</p>
      </section>
    );
  }

  const room = rooms[action.room];

  return (
    <section className="border-2 border-[var(--line)] bg-[var(--panel)] p-5 shadow-[6px_6px_0_var(--line)]">
      <div className="ui-font flex items-center justify-between gap-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
        <span>{room.name}</span>
        <span>{action.duration}</span>
      </div>
      <h2 className="mt-4 text-3xl font-bold leading-tight">{action.task}</h2>
      <p className="ui-font mt-3 text-sm text-[var(--muted)]">{action.risk}</p>
      <div className="mt-5 h-4 border-2 border-[var(--line)] bg-white">
        <div
          className="h-full bg-[var(--accent)] transition-all"
          style={{ width: `${action.progress}%` }}
        />
      </div>
      <div className="ui-font mt-2 flex justify-between text-xs">
        <span>节点进度</span>
        <span>{action.progress}%</span>
      </div>
    </section>
  );
}
