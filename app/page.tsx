"use client";

import { useEffect, useMemo, useState } from "react";
import { CharacterHud } from "@/components/CharacterHud";
import { DialogueDock } from "@/components/DialogueDock";
import { EndingReport } from "@/components/EndingReport";
import { RoomStage } from "@/components/RoomStage";
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
  const canInterrupt = (currentAction?.progress ?? 100) < 70;

  function handleAdvance() {
    const effectiveIntervention = intervention === "interrupt" && !canInterrupt ? "remind" : intervention;
    setState((current) => advanceState(current, effectiveIntervention, note));
    setIntervention("none");
    setNote("");
  }

  function handleRestart() {
    const next = createInitialState();
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <main className="scene-shell">
      <RoomStage action={currentAction} path={state.path} latestLog={state.logs[0]} />
      <CharacterHud day={state.day} character={state.character} metrics={state.metrics} warnings={warnings} />

      <div className="scene-title">
        <p className="ui-font">AI Hackathon Simulation</p>
        <h1>七天之后</h1>
      </div>

      {state.isEnded ? (
        <div className="scene-ending">
          <EndingReport state={state} onRestart={handleRestart} />
        </div>
      ) : (
        <DialogueDock
          selected={intervention}
          note={note}
          canInterrupt={canInterrupt}
          onSelectedChange={setIntervention}
          onNoteChange={setNote}
          onSubmit={handleAdvance}
          disabled={!currentAction}
        />
      )}
    </main>
  );
}
