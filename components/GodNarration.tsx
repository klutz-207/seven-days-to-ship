"use client";

import { useEffect, useRef, useState } from "react";

interface GodNarrationProps {
  name: string;
  onComplete: (data: { personality: string; trait: string; catchphrase: string }) => void;
}

interface CharacterData {
  personality: string;
  trait: string;
  catchphrase: string;
  narration: string;
}

export function GodNarration({ name, onComplete }: GodNarrationProps) {
  const [narration, setNarration] = useState("");
  const [opacity, setOpacity] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const charIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 淡入
  useEffect(() => {
    const t = setTimeout(() => setOpacity(1), 100);
    return () => clearTimeout(t);
  }, []);

  // 调用 /api/character 获取流式叙事
  useEffect(() => {
    const controller = new AbortController();

    async function fetchCharacter() {
      try {
        const response = await fetch("/api/character", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          // 使用 mock 数据
          const mock: CharacterData = {
            personality: "工程型",
            trait: "遇到 Bug 会较真",
            catchphrase: "先跑起来再说",
            narration: `他的名字叫「${name}」。此刻他坐在电脑前，屏幕上闪烁着未完成的代码。窗外的天已经暗了，但他没有注意到。他打开终端，深吸一口气，开始敲下第一行代码。七天后的他，会是什么样子？`,
          };
          setCharacterData(mock);
          typeOut(mock.narration);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullNarration = "";
        let finalData: CharacterData | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const data = line.slice(6).trim();

            // 检查是否是 [DONE] 后跟结构化数据
            if (data.startsWith("[DONE]")) {
              const jsonStr = data.slice(6);
              if (jsonStr) {
                try {
                  finalData = JSON.parse(jsonStr) as CharacterData;
                } catch {
                  // ignore
                }
              }
              continue;
            }

            // 普通文字 chunk
            fullNarration += data;
            setNarration(fullNarration);
          }
        }

        if (finalData) {
          setCharacterData(finalData);
        } else {
          // 兜底
          const fallback: CharacterData = {
            personality: "工程型",
            trait: "遇到 Bug 会较真",
            catchphrase: "先跑起来再说",
            narration: fullNarration || `他的名字叫「${name}」。`,
          };
          setCharacterData(fallback);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("Character fetch failed:", err);
        const mock: CharacterData = {
          personality: "工程型",
          trait: "遇到 Bug 会较真",
          catchphrase: "先跑起来再说",
          narration: `他的名字叫「${name}」。此刻他坐在电脑前，屏幕上闪烁着未完成的代码。窗外的天已经暗了，但他没有注意到。他打开终端，深吸一口气，开始敲下第一行代码。七天后的他，会是什么样子？`,
        };
        setCharacterData(mock);
        typeOut(mock.narration);
      }
    }

    fetchCharacter();
    return () => controller.abort();
  }, [name]);

  // 当 narration 变化且非流式模式时，触发逐字显示
  function typeOut(text: string) {
    charIndexRef.current = 0;
    setNarration("");

    function tick() {
      if (charIndexRef.current < text.length) {
        charIndexRef.current++;
        setNarration(text.slice(0, charIndexRef.current));
        timerRef.current = setTimeout(tick, 35);
      }
    }
    tick();
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 点击继续
  const handleContinue = () => {
    if (characterData) {
      onComplete({
        personality: characterData.personality,
        trait: characterData.trait,
        catchphrase: characterData.catchphrase,
      });
    }
  };

  // 跳过
  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (characterData) {
      setNarration(characterData.narration);
      setIsDone(true);
    }
  };

  // 流式加载完成后立即标记 isDone
  useEffect(() => {
    if (characterData && !isDone) {
      // 流式加载完成，检查是否需要逐字显示
      if (narration === characterData.narration) {
        // 已经显示完整，直接标记完成
        setIsDone(true);
      }
      // 否则等待逐字显示完成（由下面的 effect 处理）
    }
  }, [characterData, narration, isDone]);

  // 逐字显示完成后标记 isDone
  useEffect(() => {
    if (characterData && narration.length > 0 && narration === characterData.narration && !isDone) {
      setIsDone(true);
    }
  }, [narration, characterData, isDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        opacity,
        transition: "opacity 500ms ease",
        background: "var(--background)",
      }}
    >
      <div className="relative px-8 py-6 text-center" style={{ maxWidth: "32rem", width: "90vw" }}>
        {/* 角色头像 */}
        <div className="mx-auto mb-6" style={{ width: "5rem", height: "5rem" }}>
          <img
            src="/characters/programmer/idle-down-01.png"
            alt={name}
            className="h-full w-full"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* 名字 */}
        <h2 className="text-2xl font-bold text-[var(--panel)] mb-6">{name}</h2>

        {/* 叙事文字 */}
        <div className="min-h-[8rem]">
          <p
            className="text-base leading-relaxed text-[var(--panel)]"
            style={{ fontFamily: "Georgia, serif", opacity: 0.9 }}
          >
            {narration}
            {!isDone && (
              <span
                className="inline-block ml-0.5"
                style={{
                  width: "2px",
                  height: "1em",
                  background: "var(--panel)",
                  verticalAlign: "text-bottom",
                  animation: "journal-cursor-blink 600ms step-end infinite",
                }}
              />
            )}
          </p>
        </div>

        {/* 性格标签（叙事完成后显示） */}
        {isDone && characterData && (
          <div
            className="mt-6 flex justify-center gap-3"
            style={{ opacity: 0, animation: "fadeIn 500ms ease forwards 300ms" }}
          >
            <span className="tag">{characterData.personality}</span>
            <span className="tag">{characterData.trait}</span>
          </div>
        )}

        {/* 按钮区域 */}
        <div className="mt-8 flex justify-center gap-4">
          {!isDone && (
            <button
              type="button"
              onClick={handleSkip}
              className="pixel-button cursor-pointer px-4 py-1 text-xs"
              style={{ color: "var(--muted)" }}
            >
              skip
            </button>
          )}
          {isDone && (
            <button
              type="button"
              onClick={handleContinue}
              className="pixel-button pixel-button--accent cursor-pointer px-6 py-2 text-sm"
            >
              继续
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
