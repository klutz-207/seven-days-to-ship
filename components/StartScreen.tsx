"use client";

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--background)]">
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

      {/* 内容 */}
      <div className="relative z-10 text-center">
        {/* 标题 */}
        <p className="ui-font text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          AI Hackathon Simulation
        </p>
        <h1 className="mt-4 text-6xl font-black text-[var(--panel)] md:text-8xl">
          七天之后
        </h1>
        <p className="ui-font mt-6 max-w-md text-sm text-[var(--muted)]">
          一个数字人将在七天内完成他的 Hackathon 项目。
          <br />
          你可以观察、干预，或只是静静地看着他。
        </p>

        {/* 开始按钮 */}
        <button
          type="button"
          onClick={onStart}
          className="pixel-button pixel-button--accent mt-12 px-8 py-4 text-lg"
        >
          点击开始
        </button>

        {/* 角色预览 */}
        <div className="mt-12 flex justify-center">
          <img
            src="/characters/programmer/idle-down-01.png"
            alt="数字人"
            className="h-24 w-24"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>
    </div>
  );
}
