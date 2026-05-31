"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rooms } from "@/lib/rooms";
import type { ActionLogEntry, ActionNode, RoomId } from "@/lib/types";
import { CharacterSprite } from "./CharacterSprite";
import EventBubble from "./EventBubble";

interface RoomStageProps {
  action?: ActionNode;
  path: RoomId[];
  latestLog?: ActionLogEntry;
  bubbleText?: string;
  /** 气泡结束后通知父组件，用于驱动自动切换到下一个房间 */
  onEventComplete?: () => void;
}

const roomBackgrounds: Record<RoomId, string> = {
  computer: "/rooms/computer-room.png",
  desk: "/rooms/desk-room.png",
  cafe: "/rooms/cafe-room.png",
  bedroom: "/rooms/bedroom-room.png",
  showroom: "/rooms/showroom-room.png",
};

/** 每个房间的可行走地板区域（百分比） */
const roomFloorAreas: Record<RoomId, { x: number; y: number; width: number; height: number }> = {
  computer: { x: 0.1, y: 0.6, width: 0.8, height: 0.25 },
  desk: { x: 0.1, y: 0.55, width: 0.8, height: 0.3 },
  cafe: { x: 0.05, y: 0.6, width: 0.9, height: 0.25 },
  bedroom: { x: 0.1, y: 0.6, width: 0.8, height: 0.25 },
  showroom: { x: 0.15, y: 0.55, width: 0.7, height: 0.3 },
};

export function RoomStage({ action, path, latestLog, bubbleText, onEventComplete }: RoomStageProps) {
  const roomId = action?.room ?? "desk";
  const room = rooms[roomId];
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [characterPos, setCharacterPos] = useState({ x: 0, y: 0 });
  const [visibleBubble, setVisibleBubble] = useState<string | undefined>();

  // bubbleText 变化时（用户提交干预）覆盖当前气泡
  useEffect(() => {
    if (bubbleText) {
      setVisibleBubble(bubbleText);
    }
  }, [bubbleText]);

  // 气泡结束后通知父组件
  const handleBubbleComplete = useCallback(() => {
    setVisibleBubble(undefined);
    onEventComplete?.();
  }, [onEventComplete]);

  const handleCharacterPosition = useCallback((pos: { x: number; y: number }) => {
    setCharacterPos(pos);
  }, []);

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

  // 角色状态：进入房间时从左走到右，走完后停下
  const [characterState, setCharacterState] = useState<"idle" | "walk-to-center">("walk-to-center");

  // action 变化时重新走入场，清除旧气泡（气泡在走完后由 handleReachedCenter 显示）
  useEffect(() => {
    if (!action || action.progress >= 100) {
      setCharacterState("idle");
    } else {
      setCharacterState("walk-to-center");
      setVisibleBubble(undefined); // 清除旧气泡
    }
  }, [action]);

  // 角色走完全程后切换为 idle 并立即显示气泡
  const handleReachedCenter = useCallback(() => {
    setCharacterState("idle");
    if (action && action.progress < 100) {
      setVisibleBubble(action.task);
    }
  }, [action]);

  const walkableArea = roomFloorAreas[roomId];

  return (
    <section ref={containerRef} className="room-stage">
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
          direction="right"
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          walkableArea={walkableArea}
          onPositionChange={handleCharacterPosition}
          onReachedCenter={handleReachedCenter}
        />
      )}

      {/* 事件气泡 - 角色头顶 */}
      {visibleBubble && characterPos.y > 0 && (
        <EventBubble
          text={visibleBubble}
          x={characterPos.x}
          y={characterPos.y - 128 * 3.5}
          onComplete={handleBubbleComplete}
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
