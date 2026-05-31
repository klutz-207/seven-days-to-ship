"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CharacterHud } from "@/components/CharacterHud";
import { MusicControl } from "@/components/MusicControl";
import { useMusic } from "@/hooks/useMusic";
import { CharacterCard } from "@/components/CharacterCard";
import { CorridorScene } from "@/components/CorridorScene";
import { DailyNote } from "@/components/DailyNote";
import { DayTransition } from "@/components/DayTransition";
import { DialogueDock } from "@/components/DialogueDock";
import { EndingReport } from "@/components/EndingReport";
import { GodNarration } from "@/components/GodNarration";
import { RoomStage } from "@/components/RoomStage";
import { NameInput } from "@/components/NameInput";
import { StartScreen } from "@/components/StartScreen";
import { StatusPanel } from "@/components/StatusPanel";
import { Timeline } from "@/components/Timeline";
import { detectImbalances } from "@/lib/imbalanceDetector";
import { callDecisionAPI, callThinkingAPI, callVisionAPI, createMockDecision } from "@/lib/llmClient";
import { advanceState, advanceToNextAction, applyDecisionToState, createInitialState } from "@/lib/stateUpdater";
import { getDayPlanSummary } from "@/lib/planGenerator";
import type { GameState, RoomId } from "@/lib/types";

const STORAGE_KEY = "seven-days-later-state";
const SCENE_KEY = "seven-days-later-scene";

type SceneMode = "start" | "naming" | "god-narration" | "character-card" | "day-transition" | "daily-note" | "corridor" | "room" | "ending";

export default function Home() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [loaded, setLoaded] = useState(false);
  const [aiReaction, setAiReaction] = useState<string | undefined>();
  const [bubbleText, setBubbleText] = useState<string | undefined>();
  const [isThinking, setIsThinking] = useState(false);
  const [isAutoProgress, setIsAutoProgress] = useState(true);
  const [hasShownHalf, setHasShownHalf] = useState(false);

  // 场景控制
  const [sceneMode, setSceneMode] = useState<SceneMode>("start");
  const [currentDay, setCurrentDay] = useState(1);
  const [nextRoom, setNextRoom] = useState<RoomId>("desk");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<string[]>([]);
  const [eventCompleted, setEventCompleted] = useState(false);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [isFromRoom, setIsFromRoom] = useState(false);

  // 思考系统
  const [isThinkingLoading, setIsThinkingLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState<string | undefined>();
  const [thinkingMood, setThinkingMood] = useState<string>("focused");
  const [showTyping, setShowTyping] = useState(false);

  // 数值变化动画
  const [metricChanges, setMetricChanges] = useState<Array<{
    label: string;
    value: number;
    type: "feature" | "clarity" | "stability" | "presentation" | "creativity" | "pressure" | "selfhood" | "trust" | "focus";
  }>>([]);

  // 角色性格数据（由 GodNarration 生成）
  const [characterData, setCharacterData] = useState<{
    personality: string;
    trait: string;
    catchphrase: string;
  } | null>(null);

  // 背景音乐
  const { isMuted, toggleMute } = useMusic(sceneMode);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (
        process.env.NODE_ENV === "development" &&
        new URLSearchParams(window.location.search).get("debugRoom") === "1"
      ) {
        const debugState = createInitialState();
        debugState.characterName = "测试数字人";
        setState(debugState);
        setCurrentDay(debugState.day);
        setCurrentRoomIndex(debugState.currentActionIndex);
        setNextRoom(debugState.actions[debugState.currentActionIndex]?.room ?? "desk");
        setSceneMode("room");
        setLoaded(true);
        return;
      }

      // 刷新页面时强制重置为初始页面
      setSceneMode("start");
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loaded && sceneMode !== "start" && sceneMode !== "naming" && sceneMode !== "god-narration" && sceneMode !== "character-card") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.localStorage.setItem(SCENE_KEY, sceneMode);
    }
  }, [loaded, state, sceneMode]);

  const warnings = useMemo(() => detectImbalances(state), [state]);
  const currentAction = state.actions[state.currentActionIndex];

  // 开始游戏 → 命名阶段
  const handleStart = useCallback(() => {
    setSceneMode("naming");
  }, []);

  // 命名确认 → 上帝推演
  const handleNameConfirm = useCallback((name: string) => {
    // 重置游戏状态，但保留名字
    const newState = createInitialState();
    newState.characterName = name;
    setState(newState);
    setCharacterData(null);
    setSceneMode("god-narration");
    setCurrentDay(1);
    setCurrentRoomIndex(0);
    // 清除 LocalStorage 中的旧状态
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SCENE_KEY);
  }, []);

  // 天数过渡完成
  const handleDayTransitionComplete = useCallback(() => {
    setCurrentRoomIndex(0);
    // 过渡完成后进入每日计划页面
    const tasks = getDayPlanSummary(currentDay);
    setDailyTasks(tasks);
    setSceneMode("daily-note");
  }, [currentDay]);

  // 上帝推演完成 → 生成项目愿景 → 角色卡片
  const handleGodNarrationComplete = useCallback(async (character: {
    personality: string;
    trait: string;
    catchphrase: string;
  }) => {
    setCharacterData(character);

    try {
      // 根据性格生成项目愿景
      const vision = await callVisionAPI({
        characterName: state.characterName,
        personality: character.personality,
        trait: character.trait,
        catchphrase: character.catchphrase,
      });

      if (vision) {
        setState((prev) => ({
          ...prev,
          project: {
            name: vision.projectName,
            pitch: vision.pitch,
            coreLoop: vision.coreLoop,
          },
        }));
      }
    } catch (error) {
      console.error("Vision API failed:", error);
    }

    // 确保总是跳转到角色卡片
    setSceneMode("character-card");
  }, [state.characterName]);

  // 角色卡片确认 → 天数过渡
  const handleCharacterCardEnter = useCallback(() => {
    setSceneMode("day-transition");
  }, []);

  // 每日计划完成
  const handleDailyNoteComplete = useCallback(() => {
    // 计划显示完成后进入走廊（初始进入，不是从房间出来）
    if (currentAction) {
      setNextRoom(currentAction.room);
      setIsFromRoom(false);
      setSceneMode("corridor");
    } else {
      setSceneMode("room");
    }
  }, [currentAction]);

  // 走廊进入房间
  const handleEnterRoom = useCallback(async () => {
    setSceneMode("room");
    setHasShownHalf(false); // 重置50%动画标记

    // 进入房间后，数字人开始思考
    if (currentAction) {
      setIsThinkingLoading(true);
      setThinkingText(undefined);

      const thinkingCtx = {
        room: currentAction.room,
        task: currentAction.task,
        day: state.day,
        characterName: state.characterName,
        personality: characterData?.personality,
        trait: characterData?.trait,
        project: state.project,
        character: state.character,
      };

      const result = await callThinkingAPI(thinkingCtx);
      if (result) {
        setThinkingText(result.thinking);
        setThinkingMood(result.mood);
        setShowTyping(true);
      }
      setIsThinkingLoading(false);
    }
  }, [currentAction, state, characterData]);

  // 自动推进回调：角色自主执行，每 3 秒推进 +25 进度
  const handleAutoProgress = useCallback(() => {
    if (!isAutoProgress || !currentAction || isThinking) return;
    if (currentAction.progress >= 100) return;

    setState((prev) => {
      const current = prev.actions[prev.currentActionIndex];
      if (!current || current.progress >= 100) return prev;

      const nextState = advanceState(prev, 25);
      const nextCurrent = nextState.actions[nextState.currentActionIndex];
      const actionCompleted = !!nextCurrent && nextCurrent.progress >= 100;
      const halfReached = !hasShownHalf && nextCurrent && nextCurrent.progress >= 50;

      // 计算数值变化的辅助函数
      const calcChanges = () => {
        const changes: Array<{ label: string; value: number; type: any }> = [];
        const metricKeys: Array<keyof typeof nextState.metrics> = ["feature", "clarity", "stability", "presentation", "creativity"];
        const charKeys: Array<keyof typeof nextState.character> = ["pressure", "selfhood", "trust", "focus"];

        for (const key of metricKeys) {
          const diff = nextState.metrics[key] - prev.metrics[key];
          if (diff !== 0) {
            changes.push({ label: key, value: Math.round(diff), type: key });
          }
        }
        for (const key of charKeys) {
          const diff = nextState.character[key] - prev.character[key];
          if (diff !== 0) {
            changes.push({ label: key, value: Math.round(diff), type: key });
          }
        }
        return changes;
      };

      // 进度达到50%时显示数值变化
      if (halfReached) {
        setHasShownHalf(true);
        const changes = calcChanges();
        if (changes.length > 0) {
          setTimeout(() => {
            setMetricChanges(changes);
            setTimeout(() => setMetricChanges([]), 2500);
          }, 300);
        }
      }

      // 任务完成时
      if (actionCompleted) {
        setIsAutoProgress(false);
        setTimeout(() => setEventCompleted(true), 500);

        // 任务完成时再次显示数值变化（显示剩余的增量）
        const changes = calcChanges();
        if (changes.length > 0) {
          setTimeout(() => {
            setMetricChanges(changes);
            setTimeout(() => setMetricChanges([]), 2500);
          }, 600);
        }
      }

      return {
        ...nextState,
        logs: [
          {
            id: `log-auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            day: prev.day,
            room: current.room,
            text: `[自主] ${current.task} - 推进中`,
          },
          ...nextState.logs,
        ].slice(0, 24),
      };
    });
  }, [isAutoProgress, currentAction, isThinking, hasShownHalf]);

  // 提交指令：打断数字人思考，获取反应
  async function handleSubmit(note: string) {
    if (isThinking || sceneMode !== "room" || !currentAction) return;
    if (currentAction.progress >= 100) return;

    // 暂停自动推进，清除当前思考
    setIsAutoProgress(false);
    setIsThinking(true);
    setShowTyping(false);
    setAiReaction("思考中...");
    setBubbleText(undefined);

    const ctx = {
      day: state.day,
      room: currentAction.room,
      task: currentAction.task,
      project: state.project,
      pressure: state.character.pressure,
      selfhood: state.character.selfhood,
      trust: state.character.trust,
      focus: state.character.focus,
      metrics: state.metrics,
      recentLogs: state.logs.slice(0, 5),
      playerInput: note,
      thinking: thinkingText,
    };

    const decision = await callDecisionAPI(ctx) ?? createMockDecision(ctx);

    // 处理灵感效果
    const inspirationBonus = decision.inspiration ? Math.floor(Math.random() * 6) + 5 : 0; // 5-10

    setState((prev) => {
      const decidedState = applyDecisionToState(prev, decision);
      let nextState = advanceState(decidedState, 50);

      // 如果有灵感，增加创意值
      if (decision.inspiration && inspirationBonus > 0) {
        nextState = {
          ...nextState,
          metrics: {
            ...nextState.metrics,
            creativity: Math.min(100, nextState.metrics.creativity + inspirationBonus),
          },
        };
      }

      const nextCurrent = nextState.actions[nextState.currentActionIndex];
      if (nextCurrent?.progress >= 100) {
        setTimeout(() => setEventCompleted(true), 500);
      }

      // 计算数值变化
      const changes: Array<{ label: string; value: number; type: any }> = [];
      const metricKeys: Array<keyof typeof nextState.metrics> = ["feature", "clarity", "stability", "presentation", "creativity"];
      const charKeys: Array<keyof typeof nextState.character> = ["pressure", "selfhood", "trust", "focus"];

      for (const key of metricKeys) {
        const diff = nextState.metrics[key] - prev.metrics[key];
        if (diff !== 0) {
          changes.push({ label: key, value: Math.round(diff), type: key });
        }
      }
      for (const key of charKeys) {
        const diff = nextState.character[key] - prev.character[key];
        if (diff !== 0) {
          changes.push({ label: key, value: Math.round(diff), type: key });
        }
      }

      if (changes.length > 0) {
        setTimeout(() => {
          setMetricChanges(changes);
          setTimeout(() => setMetricChanges([]), 2500);
        }, 800);
      }

      const logs = [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          day: decidedState.day,
          room: currentAction.room,
          text: `[玩家] ${note}`,
        },
        {
          id: `log-${Date.now() + 1}-${Math.random().toString(36).slice(2, 7)}`,
          day: decidedState.day,
          room: decision.final_room,
          text: decision.log_text,
        },
        ...nextState.logs,
      ];

      // 如果有灵感，添加灵感日志
      if (decision.inspiration) {
        logs.unshift({
          id: `log-inspiration-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          day: decidedState.day,
          room: currentAction.room,
          text: `[灵感] ${decision.inspiration} +${inspirationBonus}创意`,
        });
      }

      return {
        ...nextState,
        logs: logs.slice(0, 30),
      };
    });

    // 显示数字人的反应
    setAiReaction(decision.inner_monologue);
    if (decision.reply) {
      setBubbleText(decision.reply);
    }

    setIsThinking(false);
    setThinkingText(undefined);

    // 玩家输入后 5 秒恢复自动推进
    setTimeout(() => {
      setAiReaction(undefined);
      setBubbleText(undefined);
      setIsAutoProgress(true);
    }, 5000);
  }

  // 事件完成回调：只有在当前房间任务完成后才能离开
  const handleEventComplete = useCallback(() => {
    if (currentAction && currentAction.progress >= 100) {
      // 任务完成，进入下一个房间
      setEventCompleted(false);
      setBubbleText(undefined);
      setAiReaction(undefined);

      const nextState = advanceToNextAction(state);
      if (nextState.day > state.day) {
        setCurrentRoomIndex(0);
        setCurrentDay(nextState.day);
        setIsTransitioning(true);
        setTimeout(() => {
          setSceneMode(nextState.isEnded ? "ending" : "day-transition");
          setIsTransitioning(false);
        }, 500);
      } else if (nextState.isEnded) {
        setSceneMode("ending");
      } else {
        setCurrentRoomIndex((idx) => idx + 1);
        setNextRoom(nextState.actions[nextState.currentActionIndex].room);
        setIsFromRoom(true);
        setSceneMode("corridor");
      }

      setState(nextState);
      setIsAutoProgress(!nextState.isEnded);
    } else {
      // 任务未完成，继续在房间内
      setEventCompleted(false);
    }
  }, [currentAction, state]);

  function handleRestart() {
    const next = createInitialState();
    setState(next);
    setAiReaction(undefined);
    setBubbleText(undefined);
    setIsThinking(false);
    setCharacterData(null);
    setSceneMode("start");
    setCurrentDay(1);
    setCurrentRoomIndex(0);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SCENE_KEY);
  }

  // 渲染当前场景
  return (
    <main className="scene-shell">
      {/* 背景音乐控制 */}
      <MusicControl isMuted={isMuted} onToggle={toggleMute} />

      {/* 初始页面 */}
      {sceneMode === "start" && (
        <StartScreen onStart={handleStart} />
      )}

      {/* 命名阶段 */}
      {sceneMode === "naming" && (
        <NameInput onConfirm={handleNameConfirm} />
      )}

      {/* 上帝推演 */}
      {sceneMode === "god-narration" && (
        <GodNarration name={state.characterName} onComplete={handleGodNarrationComplete} />
      )}

      {/* 角色卡片 */}
      {sceneMode === "character-card" && characterData && (
        <CharacterCard
          name={state.characterName}
          personality={characterData.personality}
          trait={characterData.trait}
          catchphrase={characterData.catchphrase}
          character={state.character}
          project={state.project}
          onEnter={handleCharacterCardEnter}
        />
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
        <CorridorScene targetRoom={nextRoom} onEnterRoom={handleEnterRoom} isFromRoom={isFromRoom} />
      )}

      {/* 房间场景 */}
      {sceneMode === "room" && (
        <>
          <RoomStage
            action={currentAction}
            path={state.path}
            latestLog={state.logs[0]}
            project={state.project}
            bubbleText={bubbleText}
            thinkingText={thinkingText}
            isThinkingLoading={isThinkingLoading}
            showTyping={showTyping}
            metricChanges={metricChanges}
            eventCompleted={eventCompleted}
            onEventComplete={handleEventComplete}
            onAutoProgress={handleAutoProgress}
            isPaused={!isAutoProgress || isThinking}
          />

          {/* HUD */}
          <CharacterHud day={state.day} character={state.character} metrics={state.metrics} warnings={warnings} characterName={state.characterName} />
          <StatusPanel metrics={state.metrics} character={state.character} warnings={warnings} />
          <Timeline logs={state.logs} currentAction={currentAction} aiReaction={aiReaction} />

          {/* 输入框 */}
          <DialogueDock onSubmit={handleSubmit} disabled={!currentAction || isThinking} />
        </>
      )}

      {/* 结局：独立场景分支 */}
      {sceneMode === "ending" && (
        <EndingReport state={state} onRestart={handleRestart} />
      )}
    </main>
  );
}
