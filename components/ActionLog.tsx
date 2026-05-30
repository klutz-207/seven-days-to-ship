import { rooms } from "@/lib/rooms";
import type { ActionLogEntry } from "@/lib/types";

interface ActionLogProps {
  logs: ActionLogEntry[];
}

export function ActionLog({ logs }: ActionLogProps) {
  return (
    <section className="border-2 border-[var(--line)] bg-[var(--panel)] p-5">
      <h2 className="ui-font mb-4 text-sm font-bold">行动流日志</h2>
      <div className="grid max-h-[32rem] gap-3 overflow-auto pr-1">
        {logs.map((log) => (
          <article key={log.id} className="border border-[var(--line)] bg-white p-3">
            <div className="ui-font mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Day {log.day}</span>
              <span>{log.room ? rooms[log.room].name : "系统"}</span>
            </div>
            <p className="text-sm leading-relaxed">{log.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
