"use client";

import { useState } from "react";

interface DialogueDockProps {
  onSubmit: (note: string) => void;
  disabled?: boolean;
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

  return (
    <div className="dialogue-dock">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="写一句话给数字人... (按回车发送)"
        disabled={disabled}
        className="dialogue-input"
        rows={2}
      />
      <p className="ui-font mt-2 text-center text-xs text-white/50">
        {note.length}/160
      </p>
    </div>
  );
}
