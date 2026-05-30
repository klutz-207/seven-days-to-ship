"use client";

import type { InterventionType } from "@/lib/types";

interface InterventionPanelProps {
  selected: InterventionType;
  note: string;
  onSelectedChange: (value: InterventionType) => void;
  onNoteChange: (value: string) => void;
  onAdvance: () => void;
  disabled?: boolean;
}

const options: Array<{ value: InterventionType; label: string; hint: string }> = [
  { value: "none", label: "继续运行", hint: "不插手，观察偏航是否出现。" },
  { value: "interrupt", label: "打断", hint: "停下来重新判断方向。" },
  { value: "remind", label: "提醒", hint: "加入一个新的考虑因素。" },
  { value: "approve", label: "放行", hint: "明确支持当前行动。" },
];

export function InterventionPanel({
  selected,
  note,
  onSelectedChange,
  onNoteChange,
  onAdvance,
  disabled,
}: InterventionPanelProps) {
  return (
    <section className="border-2 border-[var(--line)] bg-[var(--panel)] p-5">
      <h2 className="ui-font mb-4 text-sm font-bold">玩家干预</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelectedChange(option.value)}
            className={`ui-font border-2 border-[var(--line)] p-3 text-left text-sm transition ${
              selected === option.value ? "bg-[var(--accent)] text-white" : "bg-white hover:bg-[#fff0d8]"
            }`}
          >
            <span className="block font-bold">{option.label}</span>
            <span className="mt-1 block text-xs opacity-80">{option.hint}</span>
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="写给数字人的一句话，例如：先确认核心循环能不能讲清楚。"
        className="ui-font mt-4 min-h-24 w-full resize-none border-2 border-[var(--line)] bg-white p-3 text-sm outline-none focus:shadow-[4px_4px_0_var(--line)]"
      />
      <button
        type="button"
        onClick={onAdvance}
        disabled={disabled}
        className="ui-font mt-4 w-full border-2 border-[var(--line)] bg-[var(--ink)] px-4 py-3 font-bold text-white shadow-[4px_4px_0_var(--accent)] transition hover:translate-x-0.5 hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ▶ 推进行动节点
      </button>
    </section>
  );
}
