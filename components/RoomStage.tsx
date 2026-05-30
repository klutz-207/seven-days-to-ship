import { rooms } from "@/lib/rooms";
import type { ActionLogEntry, ActionNode, RoomId } from "@/lib/types";

interface RoomStageProps {
  action?: ActionNode;
  path: RoomId[];
  latestLog?: ActionLogEntry;
}

const roomClasses: Record<RoomId, string> = {
  computer: "room-computer",
  desk: "room-desk",
  cafe: "room-cafe",
  bedroom: "room-bedroom",
  showroom: "room-showroom",
};

export function RoomStage({ action, path, latestLog }: RoomStageProps) {
  const roomId = action?.room ?? "desk";
  const room = rooms[roomId];

  return (
    <section className={`room-stage ${roomClasses[roomId]}`}>
      <div className="room-wall">
        <div className="room-window" />
        <div className="room-board">
          <p className="ui-font text-xs uppercase tracking-[0.16em]">Current Room</p>
          <h1>{room.name}</h1>
          <p className="ui-font">{room.description}</p>
        </div>
      </div>

      <div className="room-floor">
        <div className="room-prop room-prop--left" />
        <div className="room-prop room-prop--center">
          <span>{room.shortName}</span>
        </div>
        <div className="room-prop room-prop--right" />
      </div>

      <div className="scene-task">
        <p className="ui-font text-xs text-[var(--muted)]">当前行动</p>
        <h2>{action?.task ?? "今日行动队列已完成"}</h2>
        <div className="mt-4 h-3 bg-black/10">
          <div className="h-full bg-[var(--accent)]" style={{ width: `${action?.progress ?? 100}%` }} />
        </div>
        <p className="ui-font mt-3 text-sm text-[var(--muted)]">{latestLog?.text ?? "数字人正在等待你的第一句话。"}</p>
      </div>

      <div className="path-strip" aria-label="已点亮房间路径">
        {path.slice(-9).map((item, index) => (
          <span key={`${item}-${index}`} className="path-chip">
            {rooms[item].shortName}
          </span>
        ))}
      </div>
    </section>
  );
}
