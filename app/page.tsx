"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CharacterHud } from "@/components/CharacterHud";
import { CorridorScene } from "@/components/CorridorScene";
import { DailyNote } from "@/components/DailyNote";
import { DayTransition } from "@/components/DayTransition";
import { DialogueDock } from "@/components/DialogueDock";
import { EndingReport } from "@/components/EndingReport";
import { RoomStage } from "@/components/RoomStage";
import { StartScreen } from "@/components/StartScreen";
import { StatusPanel } from "@/components/StatusPanel";
import { Timeline } from "@/components/Timeline";
import { detectImbalances } from "@/lib/imbalanceDetector";
import { callDecisionAPI, createMockDecision } from "@/lib/llmClient";
import { advanceState, createInitialState } from "@/lib/stateUpdater";
import { getDayPlanSummary } from "@/lib/planGenerator";
import type { GameState, RoomId } from "@/lib/types";

const STORAGE_KEY = "seven-days-later-state";

type SceneMode = "start" | "day-transition" | "daily-note" | "corridor" | "room" | "ending";

export default function Home() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [loaded, setLoaded] = useState(false);
  const [aiReaction, setAiReaction] = useState<string | undefined>();
  const [bubbleText, setBubbleText] = useState<string | undefined>();
  const [isThinking, setIsThinking] = useState(false);

  // 场景控制
  const [sceneMode, setSceneMode] = useState<SceneMode>("start");
  const [currentDay, setCurrentDay] = useState(1);
  const [nextRoom, setNextRoom] = useState<RoomId>("desk");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<string[]>([]);
  const [eventCompleted, setEventCompleted] = useState(false);

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
    // 过渡完成后进入每日计划页面
    const tasks = getDayPlanSummary(currentDay);
    setDailyTasks(tasks);
    setSceneMode("daily-note");
  }, [currentDay]);

  // 每日计划完成
  const handleDailyNoteComplete = useCallback(() => {
    // 计划显示完成后进入走廊
    if (currentAction) {
      setNextRoom(currentAction.room);
      setSceneMode("corridor");
    } else {
      setSceneMode("room");
    }
  }, [currentAction]);

  // 走廊进入房间
  const handleEnterRoom = useCallback(() => {
    setEventCompleted(false);
    setSceneMode("room");
  }, []);

  // 事件完成后自动推进：气泡消失后等 2 秒自动推进到下一个房间
  useEffect(() => {
    if (!eventCompleted || sceneMode !== "room" || isTransitioning || state.isEnded) return;

    const timer = setTimeout(() => {
      setState((prev) => {
        const action = prev.actions[prev.currentActionIndex];
        if (!action || action.progress >= 100) return prev;

        const newState = advanceState(prev);

        const oldDay = prev.day;
        const newDay = newState.day;
        const oldRoom = prev.actions[prev.currentActionIndex]?.room;
        const newRoom = newState.actions[newState.currentActionIndex]?.room;

        if (newDay > oldDay) {
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentDay(newDay);
            setSceneMode("day-transition");
            setIsTransitioning(false);
          }, 500);
        } else if (newRoom && newRoom !== oldRoom) {
          setIsTransitioning(true);
          setTimeout(() => {
            setNextRoom(newRoom);
            setSceneMode("corridor");
            setIsTransitioning(false);
          }, 500);
        }

        return newState;
      });

      setEventCompleted(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [eventCompleted, sceneMode, isTransitioning, state.isEnded]);

  // 提交指令：统一使用 advanceState 处理进度推进、指标更新、路径记录和跨天计划生成
  async function handleSubmit(note: string) {
    if (isThinking || sceneMode !== "room" || !currentAction) return;

    setIsThinking(true);
    setAiReaction("思考中...");

    const ctx = {
      day: state.day,
      room: currentAction.room,
      task: currentAction.task,
      pressure: state.character.pressure,
      selfhood: state.character.selfhood,
      trust: state.character.trust,
      focus: state.character.focus,
      metrics: state.metrics,
      recentLogs: state.logs.slice(0, 5),
    };

    const decision = await callDecisionAPI(ctx) ?? createMockDecision(ctx);

    setState((prev) => {
      // 统一使用 advanceState 推进状态
      const nextState = advanceState(prev);

      // 检测场景切换需求
      const needDayChange = nextState.day > prev.day;
      const needRoomChange =
        !needDayChange &&
        nextState.actions[nextState.currentActionIndex]?.room !==
          prev.actions[prev.currentActionIndex]?.room;

      if (nextState.isEnded) {
        setTimeout(() => setSceneMode("ending"), 500);
      } else if (needDayChange) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentDay(nextState.day);
          setSceneMode("day-transition");
          setIsTransitioning(false);
        }, 500);
      } else if (needRoomChange) {
        setIsTransitioning(true);
        setTimeout(() => {
          setNextRoom(nextState.actions[nextState.currentActionIndex].room);
          setSceneMode("corridor");
          setIsTransitioning(false);
        }, 500);
      }

      // 合并 AI 决策产生的额外日志（advanceState 已写入一条基础日志）
      return {
        ...nextState,
        logs: [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            day: prev.day,
            room: currentAction.room,
            text: `[玩家] ${note}`,
          },
          {
            id: `log-${Date.now() + 1}-${Math.random().toString(36).slice(2, 7)}`,
            day: prev.day,
            room: currentAction.room,
            text: decision.log_text,
          },
          ...nextState.logs,
        ].slice(0, 30),
      };
    });

    setAiReaction(decision.inner_monologue);
    if (decision.reply) {
      setBubbleText(decision.reply);
    }

    setIsThinking(false);
    setTimeout(() => setAiReaction(undefined), 5000);
  }

  // 事件完成回调：角色气泡结束后通知页面
  const handleEventComplete = useCallback(() => {
    setEventCompleted(true);
  }, []);

  function handleRestart() {
    const next = createInitialState();
    setState(next);
    setAiReaction(undefined);
    setBubbleText(undefined);
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

      {/* 每日计划 */}
      {sceneMode === "daily-note" && (
        <DailyNote day={currentDay} tasks={dailyTasks} onComplete={handleDailyNoteComplete} />
      )}

      {/* 走廊场景 */}
      {sceneMode === "corridor" && (
        <CorridorScene targetRoom={nextRoom} onEnterRoom={handleEnterRoom} />
      )}

      {/* 房间场景 */}
      {sceneMode === "room" && (
        <>
          <RoomStage action={currentAction} path={state.path} latestLog={state.logs[0]} bubbleText={bubbleText} onEventComplete={handleEventComplete} />

          {/* HUD */}
          <CharacterHud day={state.day} character={state.character} metrics={state.metrics} warnings={warnings} />
          <StatusPanel metrics={state.metrics} character={state.character} warnings={warnings} />
          <Timeline logs={state.logs} currentAction={currentAction} aiReaction={aiReaction} />

          {/* 输入框 */}
          <DialogueDock onSubmit={handleSubmit} disabled={!currentAction || isThinking} />
        </>
      )}

      {/* 结局：独立场景分支 */}
      {sceneMode === "ending" && (
        <div className="scene-ending">
          <EndingReport state={state} onRestart={handleRestart} />
        </div>
      )}
    </main>
  );
}
