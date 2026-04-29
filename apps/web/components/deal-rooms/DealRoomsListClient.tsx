"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DealPriorityLabel, DealRoomStage } from "@/types/deal-room-enums";
import { PriorityBadge, STAGE_ORDER, StageBadge, stageLabel } from "./deal-room-ui";

type RoomRow = {
  id: string;
  stage: DealRoomStage;
  priorityLabel: DealPriorityLabel;
  nextAction: string | null;
  nextFollowUpAt: string | null;
  updatedAt: string;
  broker?: { name: string | null; email: string | null };
  listing: { title: string; listingCode: string } | null;
  lead: { name: string; email: string } | null;
  events: { createdAt: string }[];
};

export function DealRoomsListClient({
  initialRooms,
  userRole,
}: {
  initialRooms: RoomRow[];
  userRole: string;
}) {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [stageFilter, setStageFilter] = useState<DealRoomStage | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<DealPriorityLabel | "all">("all");

  const filtered = useMemo(() => {
    return initialRooms.filter((r) => {
      if (stageFilter !== "all" && r.stage !== stageFilter) {
        return false;
      }
      if (priorityFilter !== "all" && r.priorityLabel !== priorityFilter) {
        return false;
      }
      return true;
    });
  }, [initialRooms, stageFilter, priorityFilter]);

  const byStage = useMemo(() => {
    const m = new Map<DealRoomStage, RoomRow[]>();
    for (const s of STAGE_ORDER) {
      m.set(s, []);
    }
    for (const r of filtered) {
      const list = m.get(r.stage);
      if (list) {
        list.push(r);
      }
    }
    return m;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`rounded-lg px-3 py-1.5 text-sm ${view === "kanban" ? "bg-amber-500/20 text-amber-100" : "text-slate-400"}`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-lg px-3 py-1.5 text-sm ${view === "table" ? "bg-amber-500/20 text-amber-100" : "text-slate-400"}`}
          >
            Table
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as DealRoomStage | "all")}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
          >
            <option value="all">All stages</option>
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {stageLabel(s)}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as DealPriorityLabel | "all")}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {userRole === "ADMIN" ? (
        <p className="text-xs text-sky-300/90">
          Admin view: all deal rooms. Broker attribution is shown on each card/row.
        </p>
      ) : null}

      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGE_ORDER.filter((s) => s !== "closed" && s !== "lost").map((stage) => (
            <div key={stage} className="min-w-[240px] flex-shrink-0 rounded-xl border border-slate-800 bg-slate-900/40">
              <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400">
                {stageLabel(stage)}{" "}
                <span className="text-slate-600">({byStage.get(stage)?.length ?? 0})</span>
              </div>
              <ul className="max-h-[70vh] space-y-2 overflow-y-auto p-2">
                {(byStage.get(stage) ?? []).map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/dashboard/deal-rooms/${r.id}`}
                      className="block rounded-lg border border-slate-800 bg-slate-950/80 p-2 text-sm hover:border-amber-500/30"
                    >
                      <div className="font-medium text-slate-100">{r.lead?.name ?? "Unnamed lead"}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {r.listing?.title ?? "No listing"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <PriorityBadge priority={r.priorityLabel} />
                      </div>
                      {userRole === "ADMIN" && r.broker?.name ? (
                        <p className="mt-1 text-[10px] text-slate-500">Broker: {r.broker.name}</p>
                      ) : null}
                      {r.nextAction ? (
                        <p className="mt-2 text-[11px] text-amber-200/90">Next: {r.nextAction}</p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[720px] text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Lead / client</th>
                <th className="px-3 py-2">Listing</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Next action</th>
                <th className="px-3 py-2">Follow-up</th>
                <th className="px-3 py-2">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/80 hover:bg-slate-900/50">
                  <td className="px-3 py-2">
                    <Link className="text-amber-300 hover:underline" href={`/dashboard/deal-rooms/${r.id}`}>
                      {r.lead?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{r.listing?.title ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StageBadge stage={r.stage} />
                  </td>
                  <td className="px-3 py-2">
                    <PriorityBadge priority={r.priorityLabel} />
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-xs">{r.nextAction ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {r.nextFollowUpAt ? new Date(r.nextFollowUpAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {r.events[0]?.createdAt
                      ? new Date(r.events[0].createdAt).toLocaleString()
                      : new Date(r.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
