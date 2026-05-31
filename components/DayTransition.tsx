"use client";

import { useEffect, useState } from "react";
import { getPhaseName, getPhaseDescription } from "@/lib/planGenerator";

interface DayTransitionProps {
  day: number;
  onComplete: () => void;
}

export function DayTransition({ day, onComplete }: DayTransitionProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(0);

  const phaseName = getPhaseName(day);
  const phaseDesc = getPhaseDescription(day);

  useEffect(() => {
    // 淡入
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 50);

    // 淡出
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 1200);

    // 完成
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1500);

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
        transition: "opacity 300ms ease",
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
        {/* 阶段名称 */}
        <p className="ui-font text-sm uppercase tracking-[0.5em] text-white/40">
          {phaseName}
        </p>

        {/* 天数 */}
        <h1 className="mt-4 text-[10rem] font-black leading-none text-white md:text-[14rem]">
          {day}
        </h1>

        {/* 阶段描述 */}
        <p className="ui-font mt-6 text-lg text-white/60">
          {phaseDesc}
        </p>

        {/* 提示 */}
        <p className="ui-font mt-8 text-sm text-white/30">
          {day === 1 && "新的开始"}
          {day === 2 && "最终冲刺"}
        </p>
      </div>
    </div>
  );
}
