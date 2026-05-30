"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CharacterHud } from "@/components/CharacterHud";
import { CorridorScene } from "@/components/CorridorScene";
import { DayTransition } from "@/components/DayTransition";
import { DialogueDock } from "@/components/DialogueDock";
import { EndingReport } from "@/components/EndingReport";
import { RoomStage } from "@/components/RoomStage";
import { StartScreen } from "@/components/StartScreen";
import { StatusPanel } from "@/components/StatusPanel";
import { Timeline } from "@/components/Timeline";
import { detectImbalances } from "@/lib/imbalanceDetector";
import { createInitialState } from "@/lib/stateUpdater";
import type { GameState, DecisionResponse, InterventionType, RoomId } from "@/lib/types";

const STORAGE_KEY = "seven-days-later-state";

type SceneMode = "start" | "day-transition" | "corridor" | "room" | "ending";

export default function Home() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [loaded, setLoaded] = useState(false);
  const [aiReaction, setAiReaction] = useState<string | undefined>();
  const [isThinking, setIsThinking] = useState(false);

  // 场景控制
  const [sceneMode, setSceneMode] = useState<SceneMode>("start");
  const [currentDay, setCurrentDay] = useState(1);
  const [nextRoom, setNextRoom] = useState<RoomId>("desk");
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    if (loaded && sceneMode !== "start") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [loaded, state, sceneMode]);

  const warnings = useMemo(() => detectImbalances(state), [state]);
  const currentAction = state.actions[state.currentActionIndex];

  // 开始游戏
  const handleStart = useCallback(() => {
    setSceneMode("day-transition");
    setCurrentDay(1);
  }, []);

  // 天数过渡完成
  const handleDayTransitionComplete = useCallback(() => {
    // 过渡完成后进入走廊
    if (currentAction) {
      setNextRoom(currentAction.room);
      setSceneMode("corridor");
    } else {
      setSceneMode("room");
    }
  }, [currentAction]);

  // 走廊进入房间
  const handleEnterRoom = useCallback(() => {
    setSceneMode("room");
  }, []);

  // 自动推进时间线
  useEffect(() => {
    if (!loaded || state.isEnded || !currentAction || sceneMode !== "room" || isTransitioning) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const action = prev.actions[prev.currentActionIndex];
        if (!action || action.progress >= 100) return prev;

        const newProgress = Math.min(100, action.progress + 5);
        const updatedActions = [...prev.actions];
        updatedActions[prev.currentActionIndex] = { ...action, progress: newProgress };

        if (newProgress >= 100) {
          const nextIndex = prev.currentActionIndex + 1;
          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            day: action.day,
            room: action.room,
            text: `${action.task} - 完成`,
          };

          // 检查是否需要切换天数
          const nextAction = updatedActions[nextIndex];
          const needDayChange = nextAction && nextAction.day > action.day;

          if (nextIndex < updatedActions.length) {
            // 如果需要切换天数，触发过渡
            if (needDayChange) {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentDay(nextAction.day);
                setSceneMode("day-transition");
                setIsTransitioning(false);
              }, 500);
            } else if (nextAction && nextAction.room !== action.room) {
              // 如果需要切换房间，进入走廊
              setIsTransitioning(true);
              setTimeout(() => {
                setNextRoom(nextAction.room);
                setSceneMode("corridor");
                setIsTransitioning(false);
              }, 500);
            }

            return {
              ...prev,
              actions: updatedActions,
              currentActionIndex: nextIndex,
              logs: [logEntry, ...prev.logs],
            };
          } else {
            return {
              ...prev,
              actions: updatedActions,
              isEnded: true,
              logs: [logEntry, ...prev.logs],
            };
          }
        }

        return { ...prev, actions: updatedActions };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [loaded, state.isEnded, currentAction, sceneMode, isTransitioning]);

  // 调用 AI 决策 API
  async function callDecisionAPI(intervention: InterventionType, note?: string): Promise<DecisionResponse | null> {
    if (!currentAction) return null;

    try {
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: currentAction.room,
          task: currentAction.task,
          intervention,
          note,
          day: state.day,
          pressure: state.character.pressure,
          selfhood: state.character.selfhood,
          trust: state.character.trust,
          focus: state.character.focus,
        }),
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Decision API failed:", error);
      return null;
    }
  }

  // 提交指令（增加进度值）
  async function handleSubmit(note: string) {
    if (isThinking || sceneMode !== "room") return;

    setIsThinking(true);
    setAiReaction("思考中...");

    const decision = await callDecisionAPI("remind", note);

    if (decision) {
      setAiReaction(decision.inner_monologue);

      setState((prev) => {
        const action = prev.actions[prev.currentActionIndex];
        if (!action) return prev;

        // 增加进度值到 20
        const newProgress = Math.min(100, action.progress + 20);
        const updatedActions = [...prev.actions];
        updatedActions[prev.currentActionIndex] = { ...action, progress: newProgress };

        if (newProgress >= 100) {
          const nextIndex = prev.currentActionIndex + 1;
          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            day: action.day,
            room: action.room,
            text: decision.log_text || `${action.task} - 完成`,
          };

          const nextAction = updatedActions[nextIndex];
          const needDayChange = nextAction && nextAction.day > action.day;

          if (nextIndex < updatedActions.length) {
            if (needDayChange) {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentDay(nextAction.day);
                setSceneMode("day-transition");
                setIsTransitioning(false);
              }, 500);
            } else if (nextAction && nextAction.room !== action.room) {
              setIsTransitioning(true);
              setTimeout(() => {
                setNextRoom(nextAction.room);
                setSceneMode("corridor");
                setIsTransitioning(false);
              }, 500);
            }

            return {
              ...prev,
              actions: updatedActions,
              currentActionIndex: nextIndex,
              logs: [logEntry, ...prev.logs],
            };
          } else {
            return {
              ...prev,
              actions: updatedActions,
              isEnded: true,
              logs: [logEntry, ...prev.logs],
            };
          }
        }

        return {
          ...prev,
          actions: updatedActions,
          logs: [
            {
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              day: action.day,
              room: action.room,
              text: `[玩家] ${note}`,
            },
            {
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              day: action.day,
              room: action.room,
              text: decision.log_text,
            },
            ...prev.logs,
          ],
        };
      });
    } else {
      // Fallback
      const reactions = [
        "收到。继续。",
        "明白了，调整中...",
        "好的，优先处理。",
        "了解，我看看。",
        "嗯，想一下。",
        "有道理，改方向。",
        "对，这个重要。",
        "行，先做这个。",
      ];
      setAiReaction(reactions[Math.floor(Math.random() * reactions.length)]);

      setState((prev) => {
        const action = prev.actions[prev.currentActionIndex];
        if (!action) return prev;

        // 增加进度值到 20
        const newProgress = Math.min(100, action.progress + 20);
        const updatedActions = [...prev.actions];
        updatedActions[prev.currentActionIndex] = { ...action, progress: newProgress };

        if (newProgress >= 100) {
          const nextIndex = prev.currentActionIndex + 1;
          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            day: action.day,
            room: action.room,
            text: `${action.task} - 完成（玩家指令）`,
          };

          const nextAction = updatedActions[nextIndex];
          const needDayChange = nextAction && nextAction.day > action.day;

          if (nextIndex < updatedActions.length) {
            if (needDayChange) {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentDay(nextAction.day);
                setSceneMode("day-transition");
                setIsTransitioning(false);
              }, 500);
            } else if (nextAction && nextAction.room !== action.room) {
              setIsTransitioning(true);
              setTimeout(() => {
                setNextRoom(nextAction.room);
                setSceneMode("corridor");
                setIsTransitioning(false);
              }, 500);
            }

            return {
              ...prev,
              actions: updatedActions,
              currentActionIndex: nextIndex,
              logs: [logEntry, ...prev.logs],
            };
          } else {
            return {
              ...prev,
              actions: updatedActions,
              isEnded: true,
              logs: [logEntry, ...prev.logs],
            };
          }
        }

        return {
          ...prev,
          actions: updatedActions,
          logs: [
            {
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              day: action.day,
              room: action.room,
              text: `[玩家] ${note}`,
            },
            ...prev.logs,
          ],
        };
      });
    }

    setIsThinking(false);
    setTimeout(() => setAiReaction(undefined), 5000);
  }

  function handleRestart() {
    const next = createInitialState();
    setState(next);
    setAiReaction(undefined);
    setIsThinking(false);
    setSceneMode("start");
    setCurrentDay(1);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  // 渲染当前场景
  return (
    <main className="scene-shell">
      {/* 初始页面 */}
      {sceneMode === "start" && (
        <StartScreen onStart={handleStart} />
      )}

      {/* 天数过渡 */}
      {sceneMode === "day-transition" && (
        <DayTransition day={currentDay} onComplete={handleDayTransitionComplete} />
      )}

      {/* 走廊场景 */}
      {sceneMode === "corridor" && (
        <CorridorScene targetRoom={nextRoom} onEnterRoom={handleEnterRoom} />
      )}

      {/* 房间场景 */}
      {sceneMode === "room" && (
        <>
          <RoomStage action={currentAction} path={state.path} latestLog={state.logs[0]} />

          {/* HUD */}
          <CharacterHud day={state.day} character={state.character} metrics={state.metrics} warnings={warnings} />
          <StatusPanel metrics={state.metrics} character={state.character} warnings={warnings} />
          <Timeline logs={state.logs} currentAction={currentAction} aiReaction={aiReaction} />

          {/* 输入框 */}
          <DialogueDock onSubmit={handleSubmit} disabled={!currentAction || isThinking} />
        </>
      )}

      {/* 结局 */}
      {sceneMode === "room" && state.isEnded && (
        <div className="scene-ending">
          <EndingReport state={state} onRestart={handleRestart} />
        </div>
      )}
    </main>
  );
}
