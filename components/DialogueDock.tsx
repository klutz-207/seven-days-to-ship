"use client";

import { useState } from "react";

interface DialogueDockProps {
  onSubmit: (note: string) => void;
  disabled?: boolean;
}

// 打断建议池
const INTERRUPTION_SUGGESTIONS = [
  "换个思路吧",
  "这个方向不对",
  "先休息一下",
  "想想核心功能",
  "简化一下",
  "用户会喜欢吗",
  "太复杂了",
  "加个动画怎么样",
  "换个配色试试",
  "先做个 demo",
  "别纠结细节",
  "问问别人意见",
  "这个功能砍掉",
  "聚焦重点",
  "时间不多了",
];

function pickRandomSuggestion(): string {
  return INTERRUPTION_SUGGESTIONS[Math.floor(Math.random() * INTERRUPTION_SUGGESTIONS.length)];
}

export function DialogueDock({ onSubmit, disabled }: DialogueDockProps) {
  const [note, setNote] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (note.trim()) {
        onSubmit(note.trim());
        setNote("");
      }
    }
  };

  const handleRoll = () => {
    setNote(pickRandomSuggestion());
  };

  return (
    <div className="dialogue-dock">
      <div className="dialogue-input-wrapper">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="写一句话给数字人... (按回车发送)"
          disabled={disabled}
          className="dialogue-input"
          rows={2}
        />
        <button
          type="button"
          onClick={handleRoll}
          disabled={disabled}
          className="dialogue-roll-btn"
          title="roll 一个灵感"
        >
          🎲
        </button>
      </div>
      <p className="ui-font mt-2 text-center text-xs text-white/50">
        {note.length}/160
      </p>
    </div>
  );
}
