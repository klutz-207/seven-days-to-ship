import { rooms } from "@/lib/rooms";
import type { RoomId } from "@/lib/types";

interface PathMapProps {
  path: RoomId[];
}

const layout: RoomId[] = ["desk", "computer", "showroom", "cafe", "bedroom"];

export function PathMap({ path }: PathMapProps) {
  return (
    <section className="border-2 border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="ui-font mb-4 flex items-center justify-between text-sm">
        <h2 className="font-bold">房间路径</h2>
        <span>{path.length} 步</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {layout.map((roomId) => {
          const visits = path.filter((room) => room === roomId).length;
          const active = visits > 0;
          return (
            <div
              key={roomId}
              className={`min-h-28 border-2 border-[var(--line)] p-3 transition ${
                active ? "bg-[var(--accent-3)] text-white" : "bg-white"
              } ${roomId === "bedroom" ? "col-span-2" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-4xl font-bold">{rooms[roomId].shortName}</span>
                <span className="ui-font text-sm">x{visits}</span>
              </div>
              <p className="ui-font mt-3 text-sm">{rooms[roomId].name}</p>
              <p className="ui-font mt-1 text-xs opacity-80">{rooms[roomId].description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
