"use client";

import { useRef, useState } from "react";

interface DialogueDockProps {
  onSubmit: (note: string) => void;
  disabled?: boolean;
}

// 建议分类
const SUGGESTION_CATEGORIES = [
  {
    label: "鞭笞他",
    suggestions: [
      "你在干嘛？",
      "这方向不对",
      "太慢了",
      "别磨蹭",
      "清醒一点",
      "这代码太乱了",
    ],
  },
  {
    label: "提醒他",
    suggestions: [
      "想想核心功能",
      "简化一下",
      "先做 demo",
      "聚焦重点",
      "时间不多了",
      "换个思路",
    ],
  },
  {
    label: "鼓励他",
    suggestions: [
      "加油",
      "快了快了",
      "做得不错",
      "继续冲",
      "别放弃",
      "你可以的",
    ],
  },
  {
    label: "夸赞他",
    suggestions: [
      "这想法不错",
      "这段代码写得好",
      "很有创意",
      "审美在线",
      "逻辑清晰",
      "干得漂亮",
    ],
  },
];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function DialogueDock({ onSubmit, disabled }: DialogueDockProps) {
  const [note, setNote] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (note.trim()) {
        onSubmit(note.trim());
        setNote("");
      }
    }
  };

  const handleSuggest = (category: typeof SUGGESTION_CATEGORIES[number]) => {
    setNote(pickRandom(category.suggestions));
    // 点击后焦点回到输入框
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div className="dialogue-dock">
      <div className="dialogue-suggestions">
        {SUGGESTION_CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => handleSuggest(cat)}
            disabled={disabled}
            className="dialogue-suggest-btn"
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="dialogue-input-wrapper">
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="写一句话给数字人... (按回车发送)"
          disabled={disabled}
          className="dialogue-input"
          rows={2}
        />
      </div>
      <p className="ui-font mt-2 text-center text-xs text-white/50">
        {note.length}/160
      </p>
    </div>
  );
}
