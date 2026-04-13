"use client";

import { LocateFixed } from "lucide-react";
import { useShareMyStay } from "./ShareMyStayContext";

export function ShareLocationUpdateRow() {
  const { active, session, manualLocationPing, busy } = useShareMyStay();

  if (!active || !session || session.shareType !== "LIVE_LOCATION") return null;

  const statusLabel = session.lastLocationAt ? "Location available" : "Location not updated yet";

  return (
    <div className="rounded-xl border border-sky-500/35 bg-sky-950/30 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-300/90">Live location</p>
      <p className="mt-1 text-sm text-sky-100/90">
        Status: <span className="font-medium text-white">{statusLabel}</span>
        {session.lastLocationAt ? (
          <span className="text-slate-400"> · Last updated {new Date(session.lastLocationAt).toLocaleString()}</span>
        ) : null}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={busy}
          onClick={() => manualLocationPing()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500/20 px-4 py-3 text-sm font-semibold text-sky-100 ring-1 ring-sky-500/40 hover:bg-sky-500/30 disabled:opacity-50"
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
          Update location
        </button>
        <p className="max-w-sm text-xs text-sky-200/70">
          If nothing happens, enable location for this site in your browser settings (Safari / Chrome site settings).
        </p>
      </div>
    </div>
  );
}
