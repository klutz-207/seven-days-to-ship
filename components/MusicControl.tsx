"use client";

interface MusicControlProps {
  isMuted: boolean;
  onToggle: () => void;
}

export function MusicControl({ isMuted, onToggle }: MusicControlProps) {
  return (
    <button
      onClick={onToggle}
      className="music-control"
      title={isMuted ? "开启音乐" : "静音"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}
