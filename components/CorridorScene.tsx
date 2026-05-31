"use client";

import { useEffect, useRef, useState } from "react";
import type { RoomId } from "@/lib/types";
import { CharacterSprite } from "./CharacterSprite";

interface CorridorSceneProps {
  targetRoom: RoomId;
  onEnterRoom: () => void;
}

/** 走廊中每个房间门口的位置（百分比） */
const doorPositions: Record<RoomId, { x: number; y: number }> = {
  computer: { x: 0.15, y: 0.8 },
  desk: { x: 0.32, y: 0.8 },
  cafe: { x: 0.5, y: 0.8 },
  bedroom: { x: 0.68, y: 0.8 },
  showroom: { x: 0.85, y: 0.8 },
};

/** 走廊可行走区域 */
const corridorWalkable = { x: 0.05, y: 0.6, width: 0.9, height: 0.3 };

export function CorridorScene({ targetRoom, onEnterRoom }: CorridorSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasArrived, setHasArrived] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // 根据目标房间计算行走时间
  useEffect(() => {
    if (!containerSize.width) return;

    // 计算距离对应的行走时间
    const door = doorPositions[targetRoom];
    const startX = 0.1; // 从左侧开始
    const distance = Math.abs(door.x - startX);
    const walkTime = distance * 2000; // 每 10% 距离需要 200ms

    const timer = setTimeout(() => {
      setHasArrived(true);
    }, walkTime);

    return () => clearTimeout(timer);
  }, [targetRoom, containerSize]);

  // 到达后自动进入房间
  useEffect(() => {
    if (!hasArrived) return;

    const enterTimer = setTimeout(() => {
      onEnterRoom();
    }, 500);

    return () => clearTimeout(enterTimer);
  }, [hasArrived, onEnterRoom]);

  return (
    <section ref={containerRef} className="room-stage">
      {/* 走廊背景图 */}
      <img
        src="/rooms/corridor.png"
        alt="走廊"
      />

      {/* 半透明遮罩 */}
      <div className="absolute inset-0 bg-black/20 z-[2]" />

      {/* 角色精灵 - 自动行走 */}
      {containerSize.width > 0 && (
        <CharacterSprite
          actionState="walk"
          direction="right"
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          walkableArea={corridorWalkable}
        />
      )}

      {/* 提示文字 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[20]">
        <p className="ui-font text-sm text-white/70 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
          {hasArrived ? "进入房间..." : "在走廊中行走..."}
        </p>
      </div>
    </section>
  );
}
