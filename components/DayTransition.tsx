"use client";

import { useEffect, useState } from "react";

interface DayTransitionProps {
  day: number;
  onComplete: () => void;
}

export function DayTransition({ day, onComplete }: DayTransitionProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // 淡入
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 100);

    // 淡出
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 2000);

    // 完成
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black"
      style={{
        opacity,
        transition: "opacity 500ms ease",
      }}
    >
      {/* 像素网格背景 */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(90deg, white 1px, transparent 1px),
            linear-gradient(white 1px, transparent 1px)
          `,
          backgroundSize: "4px 4px",
        }}
      />

      {/* 内容 */}
      <div className="relative z-10 text-center">
        <p className="ui-font text-lg uppercase tracking-[0.5em] text-white/50">
          Day
        </p>
        <h1 className="mt-4 text-[12rem] font-black leading-none text-white md:text-[16rem]">
          {day}
        </h1>
        <p className="ui-font mt-8 text-sm text-white/30">
          {day === 1 && "新的开始"}
          {day === 2 && "继续前进"}
          {day === 3 && "已经过半"}
          {day === 4 && "保持专注"}
          {day === 5 && "接近尾声"}
          {day === 6 && "最后冲刺"}
          {day === 7 && "最终日"}
        </p>
      </div>
    </div>
  );
}
