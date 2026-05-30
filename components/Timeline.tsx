"use client";

import { rooms } from "@/lib/rooms";
import type { ActionLogEntry, ActionNode } from "@/lib/types";

interface TimelineProps {
  logs: ActionLogEntry[];
  currentAction?: ActionNode;
  aiReaction?: string;
}

export function Timeline({ logs, currentAction, aiReaction }: TimelineProps) {
  // 只显示最近3条日志 + 当前行动
  const recentLogs = logs.slice(0, 3);

  return (
    <div className="timeline-panel">
      <h3 className="ui-font mb-3 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Timeline</h3>

      {/* 时间线容器 */}
      <div className="relative pl-6">
        {/* 竖线 */}
        <div className="absolute left-2 top-0 h-full w-0.5 bg-[var(--line)] opacity-30" />

        {/* 最近日志（已完成） */}
        {recentLogs.map((log, index) => (
          <div key={log.id} className="relative mb-4">
            {/* 节点 */}
            <div className="absolute -left-4 top-1 h-4 w-4 rounded-full border-2 border-[var(--line)] bg-[var(--panel)]" />

            {/* 内容 */}
            <div>
              <div className="ui-font flex items-center gap-2 text-xs text-[var(--muted)]">
                <span>Day {log.day}</span>
                {log.room && (
                  <>
                    <span>·</span>
                    <span>{rooms[log.room].name}</span>
                  </>
                )}
              </div>
              <p className="ui-font mt-1 text-sm text-[var(--ink)]">{log.text}</p>
            </div>
          </div>
        ))}

        {/* 当前行动（进行中） */}
        {currentAction && (
          <div className="relative mb-4">
            {/* 节点 - 高亮 */}
            <div className="absolute -left-4 top-1 h-4 w-4 animate-pulse rounded-full border-2 border-[var(--accent)] bg-[var(--accent)]" />

            {/* 内容 */}
            <div>
              <div className="ui-font flex items-center gap-2 text-xs text-[var(--accent)]">
                <span>Day {currentAction.day}</span>
                <span>·</span>
                <span>{rooms[currentAction.room].name}</span>
                <span>·</span>
                <span className="font-bold">{currentAction.task}</span>
              </div>

              {/* 进度条 */}
              <div className="progress-bar mt-2">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${currentAction.progress}%` }}
                />
              </div>

              {/* AI 反应 */}
              {aiReaction && (
                <p className="ui-font mt-2 text-sm text-[var(--ink)] italic opacity-80">
                  &gt; {aiReaction}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
