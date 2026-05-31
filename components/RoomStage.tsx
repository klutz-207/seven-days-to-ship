"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { rooms } from "@/lib/rooms";
import type { ActionLogEntry, ActionNode, ProjectConcept, RoomId } from "@/lib/types";
import { CharacterSprite } from "./CharacterSprite";
import EventBubble from "./EventBubble";
import { FloatingText } from "./FloatingText";

interface RoomStageProps {
  action?: ActionNode;
  path: RoomId[];
  latestLog?: ActionLogEntry;
  project?: ProjectConcept;
  bubbleText?: string;
  /** 数字人思考文本（带打字机效果） */
  thinkingText?: string;
  /** 是否正在加载思考 */
  isThinkingLoading?: boolean;
  /** 是否显示打字机效果 */
  showTyping?: boolean;
  /** 数值变化 */
  metricChanges?: Array<{
    label: string;
    value: number;
    type: "feature" | "clarity" | "stability" | "presentation" | "creativity" | "pressure" | "selfhood" | "trust" | "focus";
  }>;
  /** 外部事件完成信号，收到后角色开始离开 */
  eventCompleted?: boolean;
  /** 角色离开后通知父组件 */
  onEventComplete?: () => void;
  /** 自动推进回调，每 3 秒触发一次 */
  onAutoProgress?: () => void;
  /** 暂停自动推进（玩家输入时为 true） */
  isPaused?: boolean;
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

export function RoomStage({ action, path, latestLog, project, bubbleText, thinkingText, isThinkingLoading, showTyping, metricChanges, eventCompleted, onEventComplete, onAutoProgress, isPaused }: RoomStageProps) {
  const roomId = action?.room ?? "desk";
  const room = rooms[roomId];
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 角色行走三阶段
  const [characterState, setCharacterState] = useState<"walk-right-stop" | "idle" | "walk-left-stop">("walk-right-stop");
  const [targetX, setTargetX] = useState(0.5);
  const [phase, setPhase] = useState<"walking-to-center" | "waiting" | "walking-to-exit">("walking-to-center");

  // 打字机效果状态
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typewriterSource, setTypewriterSource] = useState<"thinking" | "bubble" | null>(null);

  // 思考文本打字机效果
  useEffect(() => {
    if (thinkingText && showTyping) {
      setIsTyping(true);
      setDisplayText("");
      setTypewriterSource("thinking");
      let index = 0;
      const interval = setInterval(() => {
        if (index < thinkingText.length) {
          setDisplayText(thinkingText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          // 打字机完成后，保持显示 2 秒
          setTimeout(() => {
            setTypewriterSource(null);
          }, 2000);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [thinkingText, showTyping]);

  // 打断回复打字机效果
  useEffect(() => {
    if (bubbleText && !showTyping) {
      setIsTyping(true);
      setDisplayText("");
      setTypewriterSource("bubble");
      let index = 0;
      const interval = setInterval(() => {
        if (index < bubbleText.length) {
          setDisplayText(bubbleText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [bubbleText]);

  // 计算当前应该显示的气泡内容
  const currentBubbleText = useMemo(() => {
    // 打字机进行中
    if (isTyping && displayText) return displayText;
    // 打字机结束，显示完整文本（2秒内）
    if (!isTyping && typewriterSource === "bubble" && bubbleText) return bubbleText;
    if (!isTyping && typewriterSource === "thinking" && thinkingText) return thinkingText;
    // 加载中
    if (isThinkingLoading) return "思考中...";
    return undefined;
  }, [isTyping, displayText, typewriterSource, bubbleText, thinkingText, isThinkingLoading]);

  // 到达中间：进入 idle 状态，等待思考文本加载
  const handleReachedCenter = useCallback(() => {
    setCharacterState("idle");
    setPhase("waiting");
  }, []);

  // 自动推进：进入 waiting 阶段且未暂停时，每 3 秒推进一次
  useEffect(() => {
    if (phase !== "waiting" || isPaused) return;

    const interval = setInterval(() => {
      onAutoProgress?.();
    }, 3000);

    return () => clearInterval(interval);
  }, [phase, isPaused, onAutoProgress]);

  // 接收到 eventCompleted 信号后开始离开
  useEffect(() => {
    if (phase === "waiting" && eventCompleted) {
      setPhase("walking-to-exit");
      setCharacterState("walk-left-stop");
      setTargetX(0.1);
    }
  }, [phase, eventCompleted]);

  // 到达出口时检查任务是否完成
  const handleReachedExit = useCallback(() => {
    if (action && action.progress >= 100) {
      // 任务完成，通知父组件离开房间
      onEventComplete?.();
    } else {
      // 任务未完成，回到中间继续任务
      setPhase("walking-to-center");
      setCharacterState("walk-right-stop");
      setTargetX(0.5);
    }
  }, [action, onEventComplete]);

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

  // action 变化时重新走入场，重置三阶段
  useEffect(() => {
    if (eventCompleted || phase === "walking-to-exit") {
      return;
    }

    if (!action || action.progress >= 100) {
      setCharacterState("idle");
    } else {
      setPhase("walking-to-center");
      setCharacterState("walk-right-stop");
      setTargetX(0.5);
    }
  }, [action?.id]);

  const walkableArea = roomFloorAreas[roomId];

  // 气泡定位：基于 targetX 在可行走区域内的绝对像素位置
  const bubbleX = walkableArea.x * containerSize.width + walkableArea.width * containerSize.width * targetX;
  const bubbleY = (walkableArea.y + walkableArea.height / 2) * containerSize.height - 128 * 3.5;

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
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          walkableArea={walkableArea}
          targetX={targetX}
          startFrom={phase === "walking-to-exit" ? "current" : "edge"}
          onReachedTarget={phase === "walking-to-center" ? handleReachedCenter : handleReachedExit}
        />
      )}

      {/* 事件气泡 - 角色头顶，自动显示，由 eventCompleted 信号驱动离开 */}
      {currentBubbleText && containerSize.width > 0 && (
        <EventBubble
          text={currentBubbleText}
          x={bubbleX}
          y={bubbleY}
          isTyping={isTyping}
        />
      )}

      {/* 数值变化浮动效果 */}
      {metricChanges && metricChanges.length > 0 && containerSize.width > 0 && (
        <FloatingText
          changes={metricChanges}
          baseX={bubbleX}
          baseY={bubbleY + 60}
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
