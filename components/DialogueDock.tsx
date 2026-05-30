"use client";

import type { InterventionType } from "@/lib/types";

interface DialogueDockProps {
  selected: InterventionType;
  note: string;
  canInterrupt: boolean;
  disabled?: boolean;
  onSelectedChange: (value: InterventionType) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
}

const options: Array<{ value: InterventionType; label: string }> = [
  { value: "none", label: "继续" },
  { value: "interrupt", label: "打断" },
  { value: "remind", label: "提醒" },
  { value: "approve", label: "放行" },
];

export function DialogueDock({
  selected,
  note,
  canInterrupt,
  disabled,
  onSelectedChange,
  onNoteChange,
  onSubmit,
}: DialogueDockProps) {
  const interruptBlocked = selected === "interrupt" && !canInterrupt;

  return (
    <section className="dialogue-dock">
      <div className="ui-font flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
        <span>{interruptBlocked ? "当前行动已进入收尾，无法强制打断；输入会作为提醒进入判断。" : "你可以随时输入一句话影响数字人。"}</span>
        <span>{note.length}/160</span>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <textarea
          value={note}
          maxLength={160}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="输入你想说的话：停一下，先确认核心循环能不能讲清楚。"
          className="dialogue-input"
        />
        <div className="grid grid-cols-4 gap-2 lg:w-56 lg:grid-cols-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectedChange(option.value)}
              className={`dialogue-mode ${selected === option.value ? "dialogue-mode--active" : ""}`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className="dialogue-send col-span-4 lg:col-span-2"
          >
            发送并推进
          </button>
        </div>
      </div>
    </section>
  );
}
