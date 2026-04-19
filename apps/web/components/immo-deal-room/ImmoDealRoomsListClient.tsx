"use client";

import Link from "next/link";
import type { DealRoom, DealRoomStatus } from "@/modules/deal-room/deal-room.types";

const STATUS_CLASS: Record<DealRoomStatus, string> = {
  open: "text-sky-300",
  active: "text-emerald-300",
  pending_review: "text-amber-300",
  paused: "text-slate-400",
  closed: "text-slate-500",
  archived: "text-slate-600",
};

export function ImmoDealRoomsListClient({ rooms }: { rooms: DealRoom[] }) {
  if (rooms.length === 0) {
    return (
      <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
        No collaboration deal rooms yet. Open a listing or lead and use <strong>Start collaboration</strong>, or create
        a room from a broker context.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rooms.map((r) => (
        <li key={r.id}>
          <Link
            href={`/dashboard/immo-deal-rooms/${encodeURIComponent(r.id)}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 transition hover:border-amber-500/30 hover:bg-slate-900/70"
          >
            <div>
              <p className="font-medium text-white">{r.title}</p>
              <p className="text-xs text-slate-500">
                {r.entityType} · {r.entityId.slice(0, 12)}
                {r.entityId.length > 12 ? "…" : ""}
              </p>
            </div>
            <span className={`text-xs font-medium uppercase tracking-wide ${STATUS_CLASS[r.status]}`}>{r.status}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
