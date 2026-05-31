"use client";

import { useEffect, useRef, useState } from "react";

export type SceneMode =
  | "start"
  | "naming"
  | "god-narration"
  | "character-card"
  | "day-transition"
  | "daily-note"
  | "corridor"
  | "room"
  | "ending";

// 场景 → 背景音乐文件映射
// 把你的 mp3 文件放到 public/music/ 目录下
const SCENE_MUSIC: Record<SceneMode, string> = {
  start: "/music/start.mp3",
  naming: "/music/start.mp3",
  "god-narration": "/music/narration.mp3",
  "character-card": "/music/narration.mp3",
  "day-transition": "/music/day-transition.mp3",
  "daily-note": "/music/daily-note.mp3",
  corridor: "/music/corridor.mp3",
  room: "/music/room.mp3",
  ending: "/music/ending.mp3",
};

export function useMusic(sceneMode: SceneMode) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentSrcRef = useRef<string>("");

  useEffect(() => {
    // 浏览器环境检查
    if (typeof window === "undefined") return;

    // 首次创建 Audio 元素
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    const audio = audioRef.current;
    const targetSrc = SCENE_MUSIC[sceneMode];

    // 同一首歌不切换
    if (currentSrcRef.current === targetSrc) return;

    currentSrcRef.current = targetSrc;

    // 淡出当前音乐，再切换
    const fadeOut = () => {
      return new Promise<void>((resolve) => {
        if (audio.volume <= 0.01) {
          audio.pause();
          resolve();
          return;
        }
        const step = () => {
          audio.volume = Math.max(0, audio.volume - 0.05);
          if (audio.volume > 0.01) {
            requestAnimationFrame(step);
          } else {
            audio.pause();
            audio.volume = 0.3; // 重置音量
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    };

    const playNew = async () => {
      await fadeOut();
      audio.src = targetSrc;
      audio.volume = 0.3;

      if (!isMuted) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          // 自动播放被浏览器阻止，需要用户交互
          setIsPlaying(false);
        }
      }
    };

    playNew();
  }, [sceneMode, isMuted]);

  // 静音切换
  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { isMuted, isPlaying, toggleMute };
}
