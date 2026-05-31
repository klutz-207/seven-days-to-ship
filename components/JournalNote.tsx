"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface JournalNoteProps {
  journal: {
    done: string;
    discovered: string;
    attempted: string;
    expected: string;
  };
  onComplete: () => void;
}

type Phase = "typing" | "shrinking" | "corner";

const SECTIONS = [
  { key: "done" as const, label: "Done" },
  { key: "discovered" as const, label: "Discovered" },
  { key: "attempted" as const, label: "Attempted" },
  { key: "expected" as const, label: "Expected" },
];

const CHAR_DELAY = 35; // ms per character
const SECTION_PAUSE = 400; // ms pause between sections
const SHRINK_DELAY = 1200; // ms after typing finishes before shrinking

export function JournalNote({ journal, onComplete }: JournalNoteProps) {
  const [phase, setPhase] = useState<Phase>("typing");
  const [opacity, setOpacity] = useState(0);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [displayedSections, setDisplayedSections] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCancelledRef = useRef(false);

  // Flatten all text for sequential typing
  const allTexts = SECTIONS.map((s) => journal[s.key]);
  const currentText = allTexts[sectionIndex] ?? "";

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setOpacity(1), 80);
    return () => clearTimeout(t);
  }, []);

  // Typing effect
  useEffect(() => {
    if (phase !== "typing") return;
    if (isCancelledRef.current) return;

    // All sections done
    if (sectionIndex >= SECTIONS.length) {
      timerRef.current = setTimeout(() => {
        setPhase("shrinking");
      }, SHRINK_DELAY);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // Current section fully typed
    if (charIndex >= currentText.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedSections((prev) => [...prev, currentText]);
        setSectionIndex((prev) => prev + 1);
        setCharIndex(0);
      }, SECTION_PAUSE);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // Type next character
    timerRef.current = setTimeout(() => {
      setCharIndex((prev) => prev + 1);
    }, CHAR_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, sectionIndex, charIndex, currentText]);

  // Shrink -> corner transition
  useEffect(() => {
    if (phase !== "shrinking") return;

    const t = setTimeout(() => {
      setPhase("corner");
      onComplete();
    }, 600);

    return () => clearTimeout(t);
  }, [phase, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSkip = useCallback(() => {
    isCancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayedSections(allTexts);
    setPhase("shrinking");
  }, [allTexts]);

  const handleCornerClick = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // --- Corner (collapsed) view ---

  if (phase === "corner" && !expanded) {
    return (
      <button
        onClick={handleCornerClick}
        className="ui-font fixed z-[96] cursor-pointer border-0 p-0"
        style={{
          bottom: "1rem",
          left: "1rem",
          width: "3rem",
          height: "3.5rem",
          background: "var(--panel)",
          border: "3px solid var(--line)",
          boxShadow: "4px 4px 0 rgba(0, 0, 0, 0.25)",
          transform: "rotate(-6deg)",
          transition: "transform 150ms ease, box-shadow 150ms ease",
          fontSize: "1.25rem",
          lineHeight: 1,
          display: "grid",
          placeItems: "center",
        }}
        title="展开今日日志"
      >
        <span style={{ color: "var(--ink)", fontFamily: "Georgia, serif" }}>J</span>
      </button>
    );
  }

  // --- Expanded corner view ---

  if (phase === "corner" && expanded) {
    return (
      <div
        className="fixed z-[96]"
        style={{
          bottom: "1rem",
          left: "1rem",
          opacity: 1,
          transition: "all 400ms ease",
        }}
      >
        <div
          className="ui-font relative overflow-auto"
          style={{
            background: "rgba(255, 248, 234, 0.95)",
            border: "3px solid var(--line)",
            boxShadow: "6px 6px 0 rgba(0, 0, 0, 0.3)",
            maxWidth: "22rem",
            maxHeight: "60vh",
            padding: "1rem 1.25rem",
          }}
        >
          <button
            onClick={handleCornerClick}
            className="absolute cursor-pointer border-0"
            style={{
              top: "0.5rem",
              right: "0.5rem",
              background: "transparent",
              color: "var(--muted)",
              fontSize: "0.875rem",
              fontWeight: 800,
              padding: "0.25rem",
            }}
          >
            x
          </button>

          <h3
            className="mb-3 text-center text-sm font-extrabold tracking-wider"
            style={{ color: "var(--ink)" }}
          >
            DDAE Journal
          </h3>

          <div
            className="mx-auto mb-3"
            style={{ width: "50%", height: "2px", background: "var(--line)", opacity: 0.25 }}
          />

          <div className="space-y-3">
            {SECTIONS.map((s, i) => (
              <div key={s.key}>
                <span
                  className="text-xs font-extrabold tracking-wide"
                  style={{ color: "var(--accent)" }}
                >
                  {s.label}
                </span>
                <p
                  className="mt-0.5 text-xs leading-relaxed"
                  style={{ color: "var(--ink)" }}
                >
                  {allTexts[i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Full-screen overlay (typing + shrinking) ---

  const isShrinking = phase === "shrinking";

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center"
      style={{
        opacity,
        transition: isShrinking ? "opacity 500ms ease" : "opacity 300ms ease",
        background: "rgba(0, 0, 0, 0.45)",
        pointerEvents: isShrinking ? "none" : "auto",
      }}
    >
      {/* Paper note card */}
      <div
        className="ui-font relative px-8 py-6"
        style={{
          background: "rgba(255, 248, 234, 0.95)",
          border: "3px solid var(--line)",
          boxShadow: "8px 8px 0 rgba(0, 0, 0, 0.3)",
          maxWidth: "24rem",
          width: "90vw",
          transform: isShrinking
            ? "scale(0.3) translate(-300%, 200%)"
            : "scale(1) translate(0, 0)",
          opacity: isShrinking ? 0 : 1,
          transition: "transform 500ms ease, opacity 500ms ease",
        }}
      >
        {/* Title */}
        <h2
          className="text-center text-base font-extrabold tracking-wider"
          style={{ color: "var(--ink)" }}
        >
          DDAE Journal
        </h2>

        {/* Divider */}
        <div
          className="mx-auto my-4"
          style={{
            width: "60%",
            height: "2px",
            background: "var(--line)",
            opacity: 0.3,
          }}
        />

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((s, i) => {
            // Already completed sections
            if (i < sectionIndex) {
              return (
                <div key={s.key}>
                  <span
                    className="text-xs font-extrabold tracking-wide"
                    style={{ color: "var(--accent)" }}
                  >
                    {s.label}
                  </span>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "var(--ink)" }}
                  >
                    {displayedSections[i]}
                  </p>
                </div>
              );
            }

            // Currently typing section
            if (i === sectionIndex && phase === "typing") {
              const visibleText = currentText.slice(0, charIndex);
              return (
                <div key={s.key}>
                  <span
                    className="text-xs font-extrabold tracking-wide"
                    style={{ color: "var(--accent)" }}
                  >
                    {s.label}
                  </span>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "var(--ink)" }}
                  >
                    {visibleText}
                    <span
                      className="inline-block ml-0.5"
                      style={{
                        width: "2px",
                        height: "1em",
                        background: "var(--ink)",
                        verticalAlign: "text-bottom",
                        animation: "journal-cursor-blink 600ms step-end infinite",
                      }}
                    />
                  </p>
                </div>
              );
            }

            // Not yet reached
            return null;
          })}
        </div>

        {/* Skip button */}
        {phase === "typing" && (
          <div className="mt-5 text-center">
            <button
              onClick={handleSkip}
              className="pixel-button cursor-pointer px-4 py-1 text-xs"
              style={{ color: "var(--muted)" }}
            >
              skip
            </button>
          </div>
        )}

        {/* Bottom decorative line */}
        <div
          className="mx-auto mt-4"
          style={{
            width: "40%",
            height: "2px",
            background: "var(--line)",
            opacity: 0.2,
          }}
        />
      </div>

    </div>
  );
}
