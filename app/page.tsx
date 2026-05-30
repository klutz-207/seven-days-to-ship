"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionLog } from "@/components/ActionLog";
import { CurrentTaskCard } from "@/components/CurrentTaskCard";
import { EndingReport } from "@/components/EndingReport";
import { InterventionPanel } from "@/components/InterventionPanel";
import { PathMap } from "@/components/PathMap";
import { StatusPanel } from "@/components/StatusPanel";
import { detectImbalances } from "@/lib/imbalanceDetector";
import { advanceState, createInitialState } from "@/lib/stateUpdater";
import type { GameState, InterventionType } from "@/lib/types";

const STORAGE_KEY = "seven-days-later-state";

export default function Home() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [intervention, setIntervention] = useState<InterventionType>("none");
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState(JSON.parse(saved) as GameState);
      }
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [loaded, state]);

  const warnings = useMemo(() => detectImbalances(state), [state]);
  const currentAction = state.actions[state.currentActionIndex];

  function handleAdvance() {
    setState((current) => advanceState(current, intervention, note));
    setIntervention("none");
    setNote("");
  }

  function handleRestart() {
    const next = createInitialState();
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[20rem_1fr_20rem]">
      <aside className="lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
        <ActionLog logs={state.logs} />
      </aside>

      <section className="grid content-start gap-5">
        <header className="border-2 border-[var(--line)] bg-[var(--panel)] p-6 shadow-[8px_8px_0_var(--line)]">
          <div className="ui-font flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="border border-[var(--line)] bg-white px-2 py-1">Day {state.day} / 7</span>
            <span>半实时路径偏移模拟</span>
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-none md:text-7xl">七天之后</h1>
          <p className="ui-font mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
            数字人持续推进 Hackathon 项目。你可以观察、打断、提醒或放行，每次行动都会点亮一个房间路径。
          </p>
        </header>

        {state.isEnded ? (
          <EndingReport state={state} onRestart={handleRestart} />
        ) : (
          <>
            <CurrentTaskCard action={currentAction} />
            <InterventionPanel
              selected={intervention}
              note={note}
              onSelectedChange={setIntervention}
              onNoteChange={setNote}
              onAdvance={handleAdvance}
              disabled={!currentAction}
            />
          </>
        )}

        <StatusPanel metrics={state.metrics} character={state.character} warnings={warnings} />
      </section>

      <aside className="lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
        <PathMap path={state.path} />
      </aside>
    </main>
  );
}
