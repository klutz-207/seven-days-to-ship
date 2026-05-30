import { rooms } from "@/lib/rooms";
import type { ActionLogEntry, ActionNode, RoomId } from "@/lib/types";

interface RoomStageProps {
  action?: ActionNode;
  path: RoomId[];
  latestLog?: ActionLogEntry;
}

const roomBackgrounds: Record<RoomId, string> = {
  computer: "/rooms/computer-room.png",
  desk: "/rooms/desk-room.png",
  cafe: "/rooms/cafe-room.png",
  bedroom: "/rooms/bedroom-room.png",
  showroom: "/rooms/showroom-room.png",
};

export function RoomStage({ action, path, latestLog }: RoomStageProps) {
  const roomId = action?.room ?? "desk";
  const room = rooms[roomId];

  return (
    <section className="room-stage relative overflow-hidden">
      {/* 房间背景图 */}
      <img
        src={roomBackgrounds[roomId]}
        alt={room.name}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* 半透明遮罩保证文字可读 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 内容层 */}
      <div className="relative z-10 flex h-full flex-col justify-between p-6">
        {/* 房间信息 */}
        <div className="room-board">
          <p className="ui-font text-xs uppercase tracking-[0.16em] text-white/70">Current Room</p>
          <h1 className="text-3xl font-black text-white">{room.name}</h1>
          <p className="ui-font mt-2 text-sm text-white/80">{room.description}</p>
        </div>

        {/* 当前行动 */}
        <div className="scene-task">
          <p className="ui-font text-xs text-white/60">当前行动</p>
          <h2 className="text-xl font-bold text-white">{action?.task ?? "今日行动队列已完成"}</h2>
          <div className="mt-4 h-3 bg-white/20">
            <div className="h-full bg-[var(--accent)]" style={{ width: `${action?.progress ?? 100}%` }} />
          </div>
          <p className="ui-font mt-3 text-sm text-white/70">{latestLog?.text ?? "数字人正在等待你的第一句话。"}</p>
        </div>

        {/* 路径条 */}
        <div className="path-strip" aria-label="已点亮房间路径">
          {path.slice(-9).map((item, index) => (
            <span key={`${item}-${index}`} className="path-chip">
              {rooms[item].shortName}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
