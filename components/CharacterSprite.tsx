"use client";

import { useEffect, useRef, useState } from "react";
import { SpriteAnimator } from "./SpriteAnimator";

type Direction = "down" | "up" | "left" | "right";
type ActionState = "idle" | "walk" | "walk-to-center";

interface Position {
  x: number;
  y: number;
}

interface CharacterSpriteProps {
  actionState: ActionState;
  direction?: Direction;
  containerWidth: number;
  containerHeight: number;
  /** 可行走区域（相对于容器的百分比） */
  walkableArea?: { x: number; y: number; width: number; height: number };
  /** 角色位置变化回调，用于外部定位（如气泡） */
  onPositionChange?: (pos: { x: number; y: number }) => void;
  /** 角色到达中间位置回调（walk-to-center 专用） */
  onReachedCenter?: () => void;
}

// 精灵图帧定义
const SPRITE_FRAMES: Record<ActionState, Record<Direction, string[]>> = {
  idle: {
    down: ["/characters/programmer/idle-down-01.png"],
    up: ["/characters/programmer/idle-up-01.png"],
    left: ["/characters/programmer/idle-left-01.png"],
    right: ["/characters/programmer/idle-right-01.png"],
  },
  walk: {
    down: [
      "/characters/programmer/walk-down-01.png",
      "/characters/programmer/walk-down-02.png",
      "/characters/programmer/walk-down-03.png",
      "/characters/programmer/walk-down-04.png",
    ],
    up: [
      "/characters/programmer/walk-up-01.png",
      "/characters/programmer/walk-up-02.png",
      "/characters/programmer/walk-up-03.png",
      "/characters/programmer/walk-up-04.png",
    ],
    left: [
      "/characters/programmer/walk-left-01.png",
      "/characters/programmer/walk-left-02.png",
      "/characters/programmer/walk-left-03.png",
      "/characters/programmer/walk-left-04.png",
    ],
    right: [
      "/characters/programmer/walk-right-01.png",
      "/characters/programmer/walk-right-02.png",
      "/characters/programmer/walk-right-03.png",
      "/characters/programmer/walk-right-04.png",
    ],
  },
  "walk-to-center": {
    down: ["/characters/programmer/idle-down-01.png"],
    up: ["/characters/programmer/idle-up-01.png"],
    left: [
      "/characters/programmer/walk-left-01.png",
      "/characters/programmer/walk-left-02.png",
      "/characters/programmer/walk-left-03.png",
      "/characters/programmer/walk-left-04.png",
    ],
    right: [
      "/characters/programmer/walk-right-01.png",
      "/characters/programmer/walk-right-02.png",
      "/characters/programmer/walk-right-03.png",
      "/characters/programmer/walk-right-04.png",
    ],
  },
};

const WALK_SPEED = 3;

export function CharacterSprite({
  actionState,
  direction = "down",
  containerWidth,
  containerHeight,
  walkableArea,
  onPositionChange,
  onReachedCenter,
}: CharacterSpriteProps) {
  const [position, setPosition] = useState<Position>({
    x: containerWidth * 0.1,
    y: containerHeight * 0.75,
  });
  const [currentDirection, setCurrentDirection] = useState<Direction>(direction);
  const walkRef = useRef<{ targetX: number; direction: Direction } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 向外部报告角色位置
  useEffect(() => {
    onPositionChange?.(position);
  }, [position, onPositionChange]);

  // 计算可行走边界
  const getBounds = () => {
    if (!walkableArea || containerWidth === 0) {
      return {
        minX: containerWidth * 0.1,
        maxX: containerWidth * 0.9,
        minY: containerHeight * 0.6,
        maxY: containerHeight * 0.85,
      };
    }
    return {
      minX: walkableArea.x * containerWidth,
      maxX: (walkableArea.x + walkableArea.width) * containerWidth,
      minY: walkableArea.y * containerHeight,
      maxY: (walkableArea.y + walkableArea.height) * containerHeight,
    };
  };

  // walk 模式：自动左右走动（用于走廊等场景）
  useEffect(() => {
    if (actionState !== "walk") {
      walkRef.current = null;
      return;
    }

    const bounds = getBounds();
    const midY = (bounds.minY + bounds.maxY) / 2;

    // 初始化位置
    setPosition({ x: bounds.minX + 50, y: midY });
    walkRef.current = { targetX: bounds.maxX - 50, direction: "right" };
    setCurrentDirection("right");

    const walk = () => {
      setPosition((prev) => {
        const walkState = walkRef.current;
        if (!walkState) return prev;

        const dx = walkState.targetX - prev.x;
        const moveX = dx > 0 ? WALK_SPEED : -WALK_SPEED;

        // 到达目标，反转方向
        if (Math.abs(dx) < WALK_SPEED * 2) {
          const newTarget = walkState.targetX === bounds.maxX - 50 ? bounds.minX + 50 : bounds.maxX - 50;
          const newDir = newTarget > prev.x ? "right" : "left";
          walkRef.current = { targetX: newTarget, direction: newDir };
          setCurrentDirection(newDir);
          return prev;
        }

        return { x: prev.x + moveX, y: prev.y };
      });

      animFrameRef.current = requestAnimationFrame(walk);
    };

    animFrameRef.current = requestAnimationFrame(walk);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [actionState, containerWidth, containerHeight, walkableArea]);

  // walk-to-center 模式：从左侧 (0.1) 走到右侧 (0.9) 后停下
  useEffect(() => {
    if (actionState !== "walk-to-center") {
      walkRef.current = null;
      return;
    }

    const bounds = getBounds();
    const midY = (bounds.minY + bounds.maxY) / 2;

    // 初始化位置：从左侧开始
    setPosition({ x: bounds.minX, y: midY });
    walkRef.current = { targetX: bounds.maxX, direction: "right" };
    setCurrentDirection("right");

    let reached = false;

    const walk = () => {
      setPosition((prev) => {
        const walkState = walkRef.current;
        if (!walkState || reached) return prev;

        const dx = walkState.targetX - prev.x;

        // 到达右侧终点
        if (Math.abs(dx) < WALK_SPEED * 2) {
          reached = true;
          // 通知外部已走完全程
          setTimeout(() => onReachedCenter?.(), 0);
          return { x: walkState.targetX, y: prev.y };
        }

        const moveX = dx > 0 ? WALK_SPEED : -WALK_SPEED;
        return { x: prev.x + moveX, y: prev.y };
      });

      if (!reached) {
        animFrameRef.current = requestAnimationFrame(walk);
      }
    };

    animFrameRef.current = requestAnimationFrame(walk);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [actionState, containerWidth, containerHeight, walkableArea, onReachedCenter]);

  // 更新方向
  useEffect(() => {
    setCurrentDirection(direction);
  }, [direction]);

  const frames = SPRITE_FRAMES[actionState][currentDirection];

  const scale = 3.5;
  const width = 128 * scale;
  const height = 128 * scale;

  const zIndex = Math.floor(position.y);

  return (
    <div
      className="absolute"
      style={{
        left: position.x - width / 2,
        top: position.y - height,
        width,
        height,
        zIndex,
        imageRendering: "pixelated",
      }}
    >
      <SpriteAnimator
        frames={frames}
        fps={actionState === "idle" ? 4 : 10}
        loop={true}
        className="h-full w-full"
      />
    </div>
  );
}
