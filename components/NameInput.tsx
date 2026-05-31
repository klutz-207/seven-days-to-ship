"use client";

import { useState } from "react";

interface NameInputProps {
  onConfirm: (name: string) => void;
}

export function NameInput({ onConfirm }: NameInputProps) {
  const [name, setName] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed.length <= 8) {
        onConfirm(trimmed);
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // 限制最长 8 个字符
    const value = e.target.value.slice(0, 8);
    setName(value);
  }

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 8;

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-8">
      <p className="text-white/50 text-lg tracking-widest font-mono">
        他的名字：____
      </p>
      <input
        autoFocus
        maxLength={8}
        value={name}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="输入名字并回车确认"
        className="w-64 bg-transparent text-white text-2xl text-center
                   border-b border-white/40 outline-none pb-2
                   placeholder:text-white/20 placeholder:text-sm
                   focus:border-white/80 transition-colors"
      />
      {!isValid && name.length > 0 && (
        <p className="text-red-400/70 text-xs">
          {name.trim().length === 0 ? "名字不能为空" : "名字不超过 8 个字符"}
        </p>
      )}
      {isValid && (
        <p className="text-white/30 text-xs">按回车确认</p>
      )}
    </div>
  );
}
