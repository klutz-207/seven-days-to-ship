"use client";

import { useEffect, useRef, useState } from "react";

interface GodNarrationProps {
  name: string;
  onComplete: (data: { personality: string; trait: string; catchphrase: string }) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(false);
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
        let fullContent = "";
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

            // 累积内容
            fullContent += data;

            // 尝试从累积内容中提取 narration
            const extracted = extractNarration(fullContent);
            setNarration(extracted);
          }
        }

        if (finalData) {
          setCharacterData(finalData);
          setNarration(finalData.narration);
        } else {
          // 尝试从完整内容中解析
          const parsed = tryParseJSON(fullContent);
          if (parsed) {
            setCharacterData(parsed);
            setNarration(parsed.narration);
          } else {
            // 兜底
            const fallback: CharacterData = {
              personality: "工程型",
              trait: "遇到 Bug 会较真",
              catchphrase: "先跑起来再说",
              narration: fullContent || `他的名字叫「${name}」。`,
            };
            setCharacterData(fallback);
          }
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
  const handleContinue = async () => {
    if (characterData) {
      setIsLoading(true);
      try {
        await onComplete({
          personality: characterData.personality,
          trait: characterData.trait,
          catchphrase: characterData.catchphrase,
        });
      } finally {
        setIsLoading(false);
      }
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

  // 叙事显示完成后标记 isDone
  useEffect(() => {
    if (characterData && narration === characterData.narration && !isDone) {
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
          {!isDone && !isLoading && (
            <button
              type="button"
              onClick={handleSkip}
              className="pixel-button cursor-pointer px-4 py-1 text-xs"
              style={{ color: "var(--muted)" }}
            >
              skip
            </button>
          )}
          {isDone && !isLoading && (
            <button
              type="button"
              onClick={handleContinue}
              className="pixel-button pixel-button--accent cursor-pointer px-6 py-2 text-sm"
            >
              继续
            </button>
          )}
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="loading-spinner" />
              <span className="ui-font text-sm text-[var(--muted)]">正在构思项目...</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid var(--line);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/** 从内容中提取 narration 字段 */
function extractNarration(content: string): string {
  // 尝试匹配 JSON 中的 narration 字段
  const narrationMatch = content.match(/"narration"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (narrationMatch) {
    // 解析 JSON 转义字符
    try {
      return JSON.parse(`"${narrationMatch[1]}"`);
    } catch {
      return narrationMatch[1];
    }
  }

  // 如果没有匹配到 JSON 格式，直接返回内容
  // 过滤掉明显的 JSON 结构
  if (content.startsWith("{") || content.startsWith("```")) {
    return "";
  }

  return content;
}

/** 尝试解析 JSON */
function tryParseJSON(content: string): CharacterData | null {
  try {
    // 尝试直接解析
    const parsed = JSON.parse(content) as CharacterData;
    if (parsed.personality && parsed.trait && parsed.catchphrase && parsed.narration) {
      return parsed;
    }
  } catch {
    // 尝试从 markdown 代码块中提取
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim()) as CharacterData;
        if (parsed.personality && parsed.narration) return parsed;
      } catch {
        // ignore
      }
    }
  }
  return null;
}
