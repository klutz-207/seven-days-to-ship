"use client";

import { useEffect, useRef, useState } from "react";

interface SpriteAnimatorProps {
  frames: string[]; // 帧图片路径数组
  fps?: number;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function SpriteAnimator({
  frames,
  fps = 8,
  loop = true,
  className = "",
  style,
}: SpriteAnimatorProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (frames.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        if (next >= frames.length) {
          return loop ? 0 : prev;
        }
        return next;
      });
    }, 1000 / fps);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [frames, fps, loop]);

  // 帧数组变化时重置
  useEffect(() => {
    setCurrentFrame(0);
  }, [frames]);

  return (
    <img
      src={frames[currentFrame]}
      alt=""
      className={className}
      style={{
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}
