"use client";

import type { CharacterState, ProjectConcept } from "@/lib/types";

interface CharacterCardProps {
  name: string;
  personality: string;
  trait: string;
  catchphrase: string;
  character: CharacterState;
  project?: ProjectConcept;
  onEnter: () => void;
}

const statLabels: Record<string, string> = {
  pressure: "压力",
  selfhood: "自我感",
  trust: "信任",
  focus: "注意力",
};

export function CharacterCard({
  name,
  personality,
  trait,
  catchphrase,
  character,
  project,
  onEnter,
}: CharacterCardProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)]">
      {/* 像素网格背景 */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(90deg, var(--line) 1px, transparent 1px),
            linear-gradient(var(--line) 1px, transparent 1px)
          `,
          backgroundSize: "4px 4px",
        }}
      />

      {/* 卡片 */}
      <div
        className="relative z-10 w-[22rem] border-4 px-8 py-8 text-center shadow-[8px_8px_0_rgba(0,0,0,0.3)]"
        style={{
          borderColor: "var(--line)",
          background: "var(--panel)",
        }}
      >
        {/* 头像 */}
        <div
          className="mx-auto mb-5 grid h-28 w-28 place-items-center overflow-hidden border-3"
          style={{
            borderColor: "var(--line)",
            background: "#f1c15b",
          }}
        >
          <img
            src="/characters/programmer/idle-down-01.png"
            alt={name}
            className="h-full w-full object-cover"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* 名字 */}
        <h2 className="text-3xl font-black text-[var(--ink)]">{name}</h2>

        {/* 性格 & 特质 */}
        <div className="mt-3 flex justify-center gap-2">
          <span className="tag">{personality}</span>
          <span className="tag">{trait}</span>
        </div>

        {/* 口头禅 */}
        <p
          className="ui-font mt-4 text-sm italic text-[var(--muted)]"
        >
          &ldquo;{catchphrase}&rdquo;
        </p>

        {/* 项目构想 */}
        {project && (
          <div className="mt-4 border-2 px-4 py-3 text-left" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.5)" }}>
            <h3 className="ui-font mb-1 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              我想做的项目
            </h3>
            <p className="text-lg font-black text-[var(--ink)]">《{project.name}》</p>
            <p className="ui-font mt-1 text-sm text-[var(--muted)]">{project.pitch}</p>
          </div>
        )}

        {/* 初始状态 */}
        <div className="mt-6 border-t-2 pt-4" style={{ borderColor: "var(--line)" }}>
          <h3 className="ui-font mb-3 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
            初始状态
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-left">
            {(Object.keys(statLabels) as Array<keyof CharacterState>).map(
              (key) => (
                <div key={key}>
                  <div className="flex justify-between text-xs">
                    <span className="ui-font text-[var(--muted)]">
                      {statLabels[key]}
                    </span>
                    <span className="ui-font font-bold text-[var(--ink)]">
                      {character[key]}
                    </span>
                  </div>
                  <div className="progress-bar mt-1">
                    <div
                      className="progress-bar__fill"
                      style={{ width: `${character[key]}%` }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* 进入按钮 */}
        <button
          type="button"
          onClick={onEnter}
          className="pixel-button pixel-button--accent mt-8 w-full py-3 text-base"
        >
          进入 Hackathon
        </button>
      </div>
    </div>
  );
}
