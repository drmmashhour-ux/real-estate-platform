"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { DealRoomEntityType } from "@/modules/deal-room/deal-room.types";

type RoomRow = { id: string; title: string };

/**
 * Open an existing ImmoContact collaboration room for the entity, or create one (broker/admin/operator only).
 */
export function ImmoDealRoomEntry({
  entityType,
  entityId,
  titleHint,
  className = "",
}: {
  entityType: DealRoomEntityType;
  entityId: string;
  /** e.g. lead or listing display name for the default room title */
  titleHint?: string;
  className?: string;
}) {
  const [rooms, setRooms] = useState<RoomRow[] | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const u = new URL("/api/immo-deal-room/rooms", window.location.origin);
      u.searchParams.set("entityType", entityType);
      u.searchParams.set("entityId", entityId);
      const r = await fetch(u.toString(), { credentials: "same-origin" });
      const j = (await r.json().catch(() => ({}))) as { rooms?: RoomRow[]; error?: string };
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) {
          setHidden(true);
          setRooms([]);
          return;
        }
        setRooms([]);
        setErr(typeof j.error === "string" ? j.error : "Could not load deal rooms.");
        return;
      }
      setRooms(Array.isArray(j.rooms) ? j.rooms : []);
    } catch {
      setRooms([]);
      setErr("Could not load deal rooms.");
    }
  }, [entityType, entityId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createRoom = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/immo-deal-room/rooms", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          titleHint: titleHint?.trim() || undefined,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { dealRoom?: { id: string }; error?: string };
      if (!r.ok) {
        setErr(typeof j.error === "string" ? j.error : "Could not create room.");
        setBusy(false);
        return;
      }
      if (j.dealRoom?.id) {
        window.location.href = `/dashboard/immo-deal-rooms/${encodeURIComponent(j.dealRoom.id)}`;
        return;
      }
      setErr("Unexpected response.");
    } catch {
      setErr("Could not create room.");
    } finally {
      setBusy(false);
    }
  };

  if (hidden) return null;

  if (rooms === null) {
    return (
      <div className={`rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/50 ${className}`}>
        Loading collaboration room…
      </div>
    );
  }

  const primary = rooms[0];

  return (
    <div className={`rounded-xl border border-emerald-500/25 bg-emerald-950/30 px-4 py-3 text-sm ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">ImmoContact deal room</p>
      <p className="mt-1 text-xs text-white/60">
        Safe internal workspace — notes, tasks, links, and timeline. Not a legal closing or payment workflow.
      </p>
      {err ? <p className="mt-2 text-xs text-rose-300">{err}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {primary ? (
          <Link
            href={`/dashboard/immo-deal-rooms/${encodeURIComponent(primary.id)}`}
            className="inline-flex items-center rounded-lg border border-emerald-500/40 bg-emerald-900/40 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-900/70"
          >
            Open deal room
          </Link>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void createRoom()}
            className="inline-flex items-center rounded-lg border border-emerald-500/40 bg-emerald-900/40 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-900/70 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Start collaboration"}
          </button>
        )}
        {primary && rooms.length > 1 ? (
          <span className="self-center text-[11px] text-white/40">{rooms.length} rooms — opening latest</span>
        ) : null}
      </div>
    </div>
  );
}
