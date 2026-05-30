"use client";

import { useEffect, useRef, useState } from "react";
import type { RoomId } from "@/lib/types";
import { CharacterSprite } from "./CharacterSprite";

interface CorridorSceneProps {
  /** 目标房间门口位置 */
  targetRoom: RoomId;
  /** 进入房间回调 */
  onEnterRoom: () => void;
}

/** 走廊中每个房间门口的位置（百分比，y 在地板上） */
const doorPositions: Record<RoomId, { x: number; y: number }> = {
  computer: { x: 0.15, y: 0.8 },
  desk: { x: 0.32, y: 0.8 },
  cafe: { x: 0.5, y: 0.8 },
  bedroom: { x: 0.68, y: 0.8 },
  showroom: { x: 0.85, y: 0.8 },
};

/** 走廊可行走区域（地板区域） */
const corridorWalkable = [
  { x: 0.05, y: 0.6, width: 0.9, height: 0.3 },
];

export function CorridorScene({ targetRoom, onEnterRoom }: CorridorSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [characterState, setCharacterState] = useState<"idle" | "walk">("walk");
  const [characterDirection, setCharacterDirection] = useState<"down" | "up" | "left" | "right">("right");
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | undefined>();
  const [clickTarget, setClickTarget] = useState<{ x: number; y: number } | undefined>();
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

  // 自动走到目标门口
  useEffect(() => {
    if (!containerSize.width) return;

    const door = doorPositions[targetRoom];
    const targetX = door.x * containerSize.width;
    const targetY = door.y * containerSize.height;

    setTargetPosition({ x: targetX, y: targetY });
    setCharacterState("walk");

    // 计算到达时间
    const startX = containerSize.width * 0.1;
    const distance = Math.abs(targetX - startX);
    const walkTime = distance * 3;

    const timer = setTimeout(() => {
      setCharacterState("idle");
      setCharacterDirection("up");
      setHasArrived(true);
    }, walkTime);

    return () => clearTimeout(timer);
  }, [targetRoom, containerSize]);

  // 到达后自动进入房间
  useEffect(() => {
    if (!hasArrived) return;

    const enterTimer = setTimeout(() => {
      onEnterRoom();
    }, 1000);

    return () => clearTimeout(enterTimer);
  }, [hasArrived, onEnterRoom]);

  // 双击跟随
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClickTarget({ x, y });
    setCharacterState("walk");
  };

  // 计算可行走区域（像素坐标）
  const walkableAreas = containerSize.width > 0
    ? corridorWalkable.map((area) => ({
        x: area.x * containerSize.width,
        y: area.y * containerSize.height,
        width: area.width * containerSize.width,
        height: area.height * containerSize.height,
      }))
    : [];

  return (
    <section
      ref={containerRef}
      className="room-stage"
      onDoubleClick={handleDoubleClick}
    >
      {/* 走廊背景图 */}
      <img
        src="/rooms/corridor.png"
        alt="走廊"
      />

      {/* 半透明遮罩 */}
      <div className="absolute inset-0 bg-black/20 z-[2]" />

      {/* 角色精灵 */}
      {containerSize.width > 0 && (
        <CharacterSprite
          actionState={characterState}
          direction={characterDirection}
          targetPosition={targetPosition}
          clickTarget={clickTarget}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          walkableAreas={walkableAreas}
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
