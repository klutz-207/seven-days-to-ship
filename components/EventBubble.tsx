"use client";

import { useEffect, useState } from "react";

interface EventBubbleProps {
  text: string;
  x: number;
  y: number;
  isTyping?: boolean;
  onComplete?: () => void;
}

export default function EventBubble({ text, x, y, isTyping, onComplete }: EventBubbleProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    // 弹入动画结束后切换到 visible
    const enterTimer = setTimeout(() => setPhase("visible"), 300);
    // 3秒后开始淡出
    const exitTimer = setTimeout(() => setPhase("exit"), 3000);
    // 淡出动画结束后触发回调
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="event-bubble"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        padding: "8px 14px",
        background: "rgba(255, 248, 234, 0.95)",
        border: "3px solid var(--line)",
        borderRadius: 8,
        boxShadow: "4px 4px 0 rgba(0, 0, 0, 0.24)",
        fontFamily: "var(--ui-font)",
        fontSize: 14,
        lineHeight: 1.5,
        color: "#2d2017",
        whiteSpace: "pre-wrap",
        pointerEvents: "none",
        zIndex: 100,
        opacity: phase === "enter" ? 0 : phase === "exit" ? 0 : 1,
        animation:
          phase === "enter"
            ? "bubble-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
            : phase === "exit"
            ? "bubble-fade-out 0.5s ease-out forwards"
            : "none",
      }}
    >
      {text}
      {isTyping && <span className="typing-cursor">|</span>}
      {/* 气泡小三角 */}
      <div
        style={{
          position: "absolute",
          bottom: -8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid var(--line)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -5,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid rgba(255, 248, 234, 0.95)",
        }}
      />

      <style jsx>{`
        @keyframes bubble-pop-in {
          0% {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.5) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1) translateY(0);
          }
        }
        @keyframes bubble-fade-out {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -100%) translateY(-8px);
          }
        }
        .typing-cursor {
          display: inline-block;
          animation: blink 0.7s infinite;
          color: #666;
          font-weight: bold;
          margin-left: 1px;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
