"use client";

import { useEffect, useState } from "react";

interface FloatingItem {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

interface FloatingTextProps {
  /** 触发显示的数值变化 */
  changes: Array<{
    label: string;
    value: number;
    type: "feature" | "clarity" | "stability" | "presentation" | "creativity" | "pressure" | "selfhood" | "trust" | "focus";
  }>;
  /** 基础位置（角色位置） */
  baseX: number;
  baseY: number;
}

const TYPE_COLORS: Record<string, string> = {
  feature: "#4ade80",      // 绿色 - 功能
  clarity: "#60a5fa",      // 蓝色 - 清晰
  stability: "#a78bfa",    // 紫色 - 稳定
  presentation: "#f97316", // 橙色 - 展示
  creativity: "#ec4899",   // 粉色 - 创意
  pressure: "#ef4444",     // 红色 - 压力
  selfhood: "#fbbf24",     // 黄色 - 自我感
  trust: "#34d399",        // 青色 - 信任
  focus: "#818cf8",        // 靛色 - 注意力
};

const TYPE_LABELS: Record<string, string> = {
  feature: "功能",
  clarity: "清晰",
  stability: "稳定",
  presentation: "展示",
  creativity: "创意",
  pressure: "压力",
  selfhood: "自我感",
  trust: "信任",
  focus: "注意力",
};

export function FloatingText({ changes, baseX, baseY }: FloatingTextProps) {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    if (changes.length === 0) return;

    const timestamp = Date.now();
    const newItems: FloatingItem[] = changes
      .filter((c) => c.value !== 0)
      .map((c, index) => ({
        id: `float-${timestamp}-${c.type}-${Math.random().toString(36).slice(2, 6)}`,
        text: `${c.value > 0 ? "+" : ""}${c.value} ${TYPE_LABELS[c.type] || c.type}`,
        color: TYPE_COLORS[c.type] || "#ffffff",
        // 随机分散在角色周围
        x: baseX + (Math.random() - 0.5) * 120,
        y: baseY - 20 - index * 30,
      }));

    setItems((prev) => [...prev, ...newItems]);

    // 2秒后移除
    const timer = setTimeout(() => {
      setItems((prev) => prev.filter((item) => !newItems.find((n) => n.id === item.id)));
    }, 2000);

    return () => clearTimeout(timer);
  }, [changes, baseX, baseY]);

  return (
    <div className="floating-text-container" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      {items.map((item) => (
        <div
          key={item.id}
          className="floating-text-item"
          style={{
            position: "absolute",
            left: item.x,
            top: item.y,
            color: item.color,
            fontFamily: "var(--ui-font)",
            fontSize: "16px",
            fontWeight: "bold",
            textShadow: "2px 2px 0 rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
            animation: "float-up-fade 2s ease-out forwards",
          }}
        >
          {item.text}
        </div>
      ))}

      <style jsx>{`
        @keyframes float-up-fade {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          20% {
            opacity: 1;
            transform: translateY(-10px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}
