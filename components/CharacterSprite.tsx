"use client";

import { useEffect, useRef, useState } from "react";
import { SpriteAnimator } from "./SpriteAnimator";

type Direction = "down" | "up" | "left" | "right";
type ActionState = "idle" | "walk" | "think";

interface Position {
  x: number;
  y: number;
}

/** 碰撞区域（矩形） */
interface CollisionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CharacterSpriteProps {
  actionState: ActionState;
  direction?: Direction;
  targetPosition?: Position;
  clickTarget?: Position;
  containerWidth: number;
  containerHeight: number;
  /** 可行走区域列表 */
  walkableAreas?: CollisionRect[];
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
  think: {
    down: ["/characters/programmer/idle-down-01.png"],
    up: ["/characters/programmer/idle-up-01.png"],
    left: ["/characters/programmer/idle-left-01.png"],
    right: ["/characters/programmer/idle-right-01.png"],
  },
};

const WALK_SPEED = 3;

/** 检查点是否在可行走区域内 */
function isWalkable(pos: Position, areas: CollisionRect[]): boolean {
  if (areas.length === 0) return true; // 没有限制则全部可走
  return areas.some(
    (area) =>
      pos.x >= area.x &&
      pos.x <= area.x + area.width &&
      pos.y >= area.y &&
      pos.y <= area.y + area.height
  );
}

/** 将位置限制在可行走区域内 */
function clampToWalkable(pos: Position, areas: CollisionRect[]): Position {
  if (areas.length === 0) return pos;

  // 找到最近的可行走点
  let closest = pos;
  let minDist = Infinity;

  for (const area of areas) {
    const clampedX = Math.max(area.x, Math.min(area.x + area.width, pos.x));
    const clampedY = Math.max(area.y, Math.min(area.y + area.height, pos.y));
    const dist = Math.sqrt((clampedX - pos.x) ** 2 + (clampedY - pos.y) ** 2);

    if (dist < minDist) {
      minDist = dist;
      closest = { x: clampedX, y: clampedY };
    }
  }

  return closest;
}

export function CharacterSprite({
  actionState,
  direction = "down",
  targetPosition,
  clickTarget,
  containerWidth,
  containerHeight,
  walkableAreas = [],
}: CharacterSpriteProps) {
  // 初始位置在容器底部中央（脚部位置）
  const [position, setPosition] = useState<Position>({
    x: containerWidth / 2,
    y: containerHeight * 0.75,
  });
  const [currentDirection, setCurrentDirection] = useState<Direction>(direction);
  const animationRef = useRef<number | null>(null);
  const [isFollowingClick, setIsFollowingClick] = useState(false);

  // 双击跟随走动
  useEffect(() => {
    if (!clickTarget) return;

    // 将目标限制在可行走区域
    const clampedTarget = clampToWalkable(clickTarget, walkableAreas);
    setIsFollowingClick(true);

    const walk = () => {
      setPosition((prev) => {
        const dx = clampedTarget.x - prev.x;
        const dy = clampedTarget.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < WALK_SPEED) {
          setIsFollowingClick(false);
          return clampedTarget;
        }

        const vx = (dx / distance) * WALK_SPEED;
        const vy = (dy / distance) * WALK_SPEED;

        // 更新方向
        const angle = Math.atan2(dy, dx);
        if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
          setCurrentDirection("right");
        } else if (angle > Math.PI / 4 && angle <= (3 * Math.PI) / 4) {
          setCurrentDirection("down");
        } else if (angle > (-3 * Math.PI) / 4 && angle <= -Math.PI / 4) {
          setCurrentDirection("up");
        } else {
          setCurrentDirection("left");
        }

        const newPos = { x: prev.x + vx, y: prev.y + vy };
        // 限制在可行走区域
        return clampToWalkable(newPos, walkableAreas);
      });

      animationRef.current = requestAnimationFrame(walk);
    };

    animationRef.current = requestAnimationFrame(walk);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clickTarget, walkableAreas]);

  // 自动走动（进入房间）
  useEffect(() => {
    if (isFollowingClick || actionState !== "walk" || !targetPosition) {
      if (!isFollowingClick && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const clampedTarget = clampToWalkable(targetPosition, walkableAreas);

    const walk = () => {
      setPosition((prev) => {
        const dx = clampedTarget.x - prev.x;
        const dy = clampedTarget.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < WALK_SPEED) {
          return clampedTarget;
        }

        const vx = (dx / distance) * WALK_SPEED;
        const vy = (dy / distance) * WALK_SPEED;

        if (Math.abs(dx) > Math.abs(dy)) {
          setCurrentDirection(dx > 0 ? "right" : "left");
        } else {
          setCurrentDirection(dy > 0 ? "down" : "up");
        }

        const newPos = { x: prev.x + vx, y: prev.y + vy };
        return clampToWalkable(newPos, walkableAreas);
      });

      animationRef.current = requestAnimationFrame(walk);
    };

    animationRef.current = requestAnimationFrame(walk);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [actionState, targetPosition, isFollowingClick, walkableAreas]);

  // 随机走动（思考状态）
  useEffect(() => {
    if (actionState !== "think") return;

    const thinkInterval = setInterval(() => {
      const randomDir: Direction = ["left", "right"][Math.floor(Math.random() * 2)] as Direction;
      setCurrentDirection(randomDir);

      const offset = randomDir === "left" ? -50 : 50;
      setPosition((prev) => {
        const newPos = {
          x: prev.x + offset,
          y: prev.y + (Math.random() - 0.5) * 20,
        };
        return clampToWalkable(newPos, walkableAreas);
      });
    }, 2000);

    return () => clearInterval(thinkInterval);
  }, [actionState, walkableAreas]);

  const frames = SPRITE_FRAMES[actionState][currentDirection];

  const scale = 3.5;
  const width = 128 * scale;
  const height = 128 * scale;

  // Y坐标决定层级：Y越大越靠前
  const zIndex = Math.floor(position.y);

  return (
    <div
      className="absolute"
      style={{
        // 脚部锚点定位：x居中，y在底部
        left: position.x - width / 2,
        top: position.y - height,
        width,
        height,
        zIndex,
        // 像素风格渲染
        imageRendering: "pixelated",
      }}
    >
      <SpriteAnimator
        frames={frames}
        fps={actionState === "walk" ? 10 : 4}
        loop={true}
        className="h-full w-full"
      />
    </div>
  );
}
