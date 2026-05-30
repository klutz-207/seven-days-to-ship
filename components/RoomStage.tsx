"use client";

import { useEffect, useRef, useState } from "react";
import { rooms } from "@/lib/rooms";
import type { ActionLogEntry, ActionNode, RoomId } from "@/lib/types";
import { CharacterSprite } from "./CharacterSprite";

interface RoomStageProps {
  action?: ActionNode;
  path: RoomId[];
  latestLog?: ActionLogEntry;
}

const roomBackgrounds: Record<RoomId, string> = {
  computer: "/rooms/computer-room.png",
  desk: "/rooms/desk-room.png",
  cafe: "/rooms/cafe-room.png",
  bedroom: "/rooms/bedroom-room.png",
  showroom: "/rooms/showroom-room.png",
};

const roomFloorAreas: Record<RoomId, Array<{ x: number; y: number; width: number; height: number }>> = {
  computer: [{ x: 0.1, y: 0.6, width: 0.8, height: 0.3 }],
  desk: [{ x: 0.1, y: 0.55, width: 0.8, height: 0.35 }],
  cafe: [{ x: 0.05, y: 0.6, width: 0.9, height: 0.3 }],
  bedroom: [{ x: 0.1, y: 0.6, width: 0.8, height: 0.3 }],
  showroom: [{ x: 0.15, y: 0.55, width: 0.7, height: 0.35 }],
};

const roomEntryPositions: Record<RoomId, { x: number; y: number }> = {
  computer: { x: 0.2, y: 0.8 },
  desk: { x: 0.5, y: 0.8 },
  cafe: { x: 0.3, y: 0.8 },
  bedroom: { x: 0.6, y: 0.8 },
  showroom: { x: 0.5, y: 0.75 },
};

export function RoomStage({ action, path, latestLog }: RoomStageProps) {
  const roomId = action?.room ?? "desk";
  const room = rooms[roomId];
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

  const [characterState, setCharacterState] = useState<"idle" | "walk" | "think">("idle");
  const [characterDirection, setCharacterDirection] = useState<"down" | "up" | "left" | "right">("down");
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | undefined>();
  const [clickTarget, setClickTarget] = useState<{ x: number; y: number } | undefined>();

  const walkableAreas = containerSize.width > 0
    ? roomFloorAreas[roomId].map((area) => ({
        x: area.x * containerSize.width,
        y: area.y * containerSize.height,
        width: area.width * containerSize.width,
        height: area.height * containerSize.height,
      }))
    : [];

  useEffect(() => {
    if (!containerSize.width) return;

    const entry = roomEntryPositions[roomId];
    const targetX = entry.x * containerSize.width;
    const targetY = entry.y * containerSize.height;

    setCharacterState("walk");
    setCharacterDirection("up");
    setTargetPosition({ x: targetX, y: targetY });

    const walkDuration = 1500;
    const timer = setTimeout(() => {
      setCharacterState("idle");
      setCharacterDirection("down");
      setTargetPosition(undefined);
    }, walkDuration);

    return () => clearTimeout(timer);
  }, [roomId, containerSize]);

  useEffect(() => {
    if (!action || action.progress >= 100) return;

    const thinkInterval = setInterval(() => {
      setCharacterState("think");
      setTimeout(() => {
        setCharacterState("idle");
        setCharacterDirection("down");
      }, 3000);
    }, 8000);

    return () => clearInterval(thinkInterval);
  }, [action]);

  useEffect(() => {
    if (latestLog?.text?.includes("打断") || latestLog?.text?.includes("提醒")) {
      setCharacterState("idle");
      setCharacterDirection("down");
    }
  }, [latestLog]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClickTarget({ x, y });
    setCharacterState("walk");
  };

  return (
    <section
      ref={containerRef}
      className="room-stage"
      onDoubleClick={handleDoubleClick}
    >
      {/* 房间背景图 */}
      <img
        src={roomBackgrounds[roomId]}
        alt={room.name}
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

      {/* 房间信息 - 左下角 */}
      <div className="absolute bottom-6 left-6 z-[20] max-w-sm">
        <p className="ui-font text-xs uppercase tracking-widest text-white/60">Current Room</p>
        <h1 className="mt-1 text-2xl font-black text-white drop-shadow-lg">{room.name}</h1>

        {/* 当前行动 */}
        <div className="mt-4">
          <p className="ui-font text-xs text-white/60">当前行动</p>
          <h2 className="mt-1 text-lg font-bold text-white drop-shadow-md">{action?.task ?? "今日行动队列已完成"}</h2>
          <div className="progress-bar mt-2 w-48">
            <div
              className="progress-bar__fill"
              style={{ width: `${action?.progress ?? 100}%` }}
            />
          </div>
          <p className="ui-font mt-2 text-sm text-white/70">{latestLog?.text ?? "数字人正在等待你的第一句话。"}</p>
        </div>
      </div>

      {/* 路径条 - 右下角 */}
      <div className="path-strip" aria-label="已点亮房间路径">
        {path.slice(-9).map((item, index) => (
          <span key={`${item}-${index}`} className="path-chip">
            {rooms[item].shortName}
          </span>
        ))}
      </div>
    </section>
  );
}
