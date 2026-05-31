"use client";

import { useEffect, useState } from "react";

interface DailyNoteProps {
  day: number;
  tasks: string[];
  onComplete: () => void;
}

export function DailyNote({ day, tasks, onComplete }: DailyNoteProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // 淡入
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 100);

    // 3秒后淡出
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 3000);

    // 淡出动画完成后移除
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center"
      style={{
        opacity,
        transition: "opacity 500ms ease",
        background: "rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* 纸条卡片 */}
      <div
        className="ui-font relative px-8 py-6"
        style={{
          background: "rgba(255, 248, 234, 0.95)",
          border: "3px solid var(--line)",
          boxShadow: "8px 8px 0 rgba(0, 0, 0, 0.3)",
          maxWidth: "24rem",
          width: "90vw",
        }}
      >
        {/* 标题 */}
        <h2
          className="text-center text-lg font-extrabold tracking-wide"
          style={{ color: "var(--ink)" }}
        >
          Day {day} - 今日计划
        </h2>

        {/* 分割线 */}
        <div
          className="mx-auto my-4"
          style={{
            width: "60%",
            height: "2px",
            background: "var(--line)",
            opacity: 0.3,
          }}
        />

        {/* 任务列表 */}
        <ol className="space-y-2 pl-1">
          {tasks.slice(0, 3).map((task, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm leading-relaxed"
              style={{ color: "var(--ink)" }}
            >
              <span
                className="inline-block flex-shrink-0 font-extrabold"
                style={{ color: "var(--accent)", minWidth: "1.5rem" }}
              >
                {i + 1}.
              </span>
              <span>{task}</span>
            </li>
          ))}
        </ol>

        {/* 底部装饰线 */}
        <div
          className="mx-auto mt-5"
          style={{
            width: "40%",
            height: "2px",
            background: "var(--line)",
            opacity: 0.2,
          }}
        />
      </div>
    </div>
  );
}
